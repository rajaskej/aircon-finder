import os
from datetime import datetime, timezone
from dotenv import load_dotenv
load_dotenv()

from config import CITIES
from osm import fetch_venues_for_city
from brand_inference import apply_brand_inference
from review_mining import mine_reviews
from upsert import get_client, upsert_venues


def fetch_existing_state(client, city_name: str) -> dict:
    """Fetch prior pipeline/crowdsource state by osm_id so reruns don't wipe it."""
    rows = []
    offset = 0
    while True:
        page = (client.table('venues')
                .select('osm_id,reviews_checked_at,google_place_id,has_ac,ac_confidence')
                .eq('city', city_name)
                .range(offset, offset + 999)
                .execute().data)
        rows.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    return {r['osm_id']: r for r in rows if r.get('osm_id')}


def merge_existing(venue: dict, existing: dict) -> dict:
    """Carry over prior DB state that a fresh OSM fetch doesn't know about."""
    venue = dict(venue)
    prev = existing.get(venue['osm_id'])
    if not prev:
        return venue

    venue['reviews_checked_at'] = prev.get('reviews_checked_at')
    if not venue.get('google_place_id'):
        venue['google_place_id'] = prev.get('google_place_id')

    # Crowdsourced / review-mined results must survive pipeline reruns
    # (OSM tag data takes precedence over neither — it's set fresh each run,
    # so only fill in when the fresh fetch has no answer).
    if venue.get('has_ac') is None and prev.get('has_ac') is not None:
        if prev.get('ac_confidence') in ('crowdsourced', 'review_mined', 'confirmed'):
            venue['has_ac'] = prev['has_ac']
            venue['ac_confidence'] = prev['ac_confidence']
    return venue


def run_pipeline(skip_review_mining: bool = False, only_cities: list = None) -> None:
    """
    Process all cities: fetch venues from OSM, apply brand inference,
    optionally mine reviews, and upsert to Supabase.
    """
    api_key = os.environ.get('GOOGLE_PLACES_API_KEY', '')
    client = get_client()

    for city_name, bbox in CITIES:
        if only_cities and city_name.lower() not in only_cities:
            continue
        print(f'\n=== Processing {city_name} ===')

        print('  Fetching from OSM...')
        venues = fetch_venues_for_city(city_name, bbox)
        print(f'  Found {len(venues)} raw venues')

        existing = fetch_existing_state(client, city_name)
        venues = [merge_existing(v, existing) for v in venues]

        print('  Applying brand inference...')
        venues = [apply_brand_inference(v) for v in venues]
        inferred = sum(1 for v in venues if v.get('ac_confidence') == 'inferred')
        print(f'  {inferred} venues inferred as AC from brand/type')

        if not skip_review_mining and api_key:
            # Only mine venues never checked before — Place Details with
            # reviews is a paid call; each venue is mined at most once.
            unresolved = [v for v in venues if v.get('has_ac') is None
                          and not v.get('reviews_checked_at')]
            already_checked = sum(1 for v in venues if v.get('has_ac') is None
                                  and v.get('reviews_checked_at'))
            print(f'  Review mining {len(unresolved)} unresolved venues '
                  f'({already_checked} skipped, already checked)...')
            now = datetime.now(timezone.utc).isoformat()
            mined = []
            for i, v in enumerate(unresolved):
                result = mine_reviews(v, api_key)
                result['reviews_checked_at'] = now
                mined.append(result)
                if (i + 1) % 10 == 0:
                    print(f'    {i + 1}/{len(unresolved)}')
            mined_ids = {v['osm_id'] for v in mined}
            venues = [v for v in venues if v['osm_id'] not in mined_ids] + mined
        else:
            print('  Skipping review mining')

        print(f'  Upserting {len(venues)} venues...')
        upsert_venues(venues, client)
        print(f'  Done {city_name}')


if __name__ == '__main__':
    import sys
    skip_reviews = '--no-reviews' in sys.argv

    # --cities Graz Vienna  →  only process those cities
    cities_arg = None
    if '--cities' in sys.argv:
        idx = sys.argv.index('--cities')
        cities_arg = [c.lower() for c in sys.argv[idx + 1:] if not c.startswith('--')]

    run_pipeline(skip_review_mining=skip_reviews, only_cities=cities_arg)
