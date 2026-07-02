import os
from dotenv import load_dotenv
load_dotenv()

from config import CITIES
from osm import fetch_venues_for_city
from brand_inference import apply_brand_inference
from review_mining import mine_reviews
from upsert import get_client, upsert_venues


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

        print('  Applying brand inference...')
        venues = [apply_brand_inference(v) for v in venues]
        inferred = sum(1 for v in venues if v.get('ac_confidence') == 'inferred')
        print(f'  {inferred} venues inferred as AC from brand/type')

        if not skip_review_mining and api_key:
            unresolved = [v for v in venues if v.get('has_ac') is None]
            print(f'  Review mining {len(unresolved)} unresolved venues...')
            resolved = []
            for i, v in enumerate(unresolved):
                resolved.append(mine_reviews(v, api_key))
                if (i + 1) % 10 == 0:
                    print(f'    {i + 1}/{len(unresolved)}')
            # Merge back: already-resolved + newly-resolved
            venues = [v for v in venues if v.get('has_ac') is not None] + resolved
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
