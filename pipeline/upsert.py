import os
from supabase import create_client, Client


def get_client() -> Client:
    """Create and return a Supabase client using service role key."""
    url = os.environ['SUPABASE_URL']
    key = os.environ['SUPABASE_SERVICE_KEY']  # service key for write access
    return create_client(url, key)


def upsert_venues(venues: list[dict], client: Client) -> None:
    """Upsert a batch of venue dicts to Supabase on osm_id conflict."""
    if not venues:
        return

    rows = []
    for v in venues:
        rows.append({
            'name': v['name'],
            'type': v['type'],
            'lat': v['lat'],
            'lng': v['lng'],
            'address': v.get('address'),
            'city': v.get('city'),
            'country': v.get('country'),
            'has_ac': v.get('has_ac'),
            'ac_confidence': v.get('ac_confidence'),
            'brand': v.get('brand'),
            'google_place_id': v.get('google_place_id'),
            'osm_id': v['osm_id'],
        })

    # Upsert in batches of 500 to avoid request size limits
    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        client.table('venues').upsert(batch, on_conflict='osm_id').execute()
        print(f'  Upserted {i + len(batch)}/{len(rows)} venues')
