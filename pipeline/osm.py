# pipeline/osm.py
from typing import Optional
import requests
from config import OSM_VENUE_QUERIES

OVERPASS_URLS = [
    'https://overpass-api.de/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
]
HEADERS = {'User-Agent': 'ACFinderApp/1.0 (heatwave venue finder)'}

def fetch_venues_for_city(
    city_name: str,
    bbox: tuple[float, float, float, float],  # (south, west, north, east)
) -> list[dict]:
    """Fetch all venue types for a city bounding box from Overpass API."""
    south, west, north, east = bbox
    bbox_str = f'{south},{west},{north},{east}'

    parts = [f'{query}({bbox_str});' for query in OSM_VENUE_QUERIES.values()]
    union_body = '\n'.join(parts)
    query = f'[out:json][timeout:60];\n(\n{union_body}\n);\nout body;'

    resp = None
    for url in OVERPASS_URLS:
        try:
            resp = requests.post(url, data={'data': query}, headers=HEADERS, timeout=90)
            if resp.status_code == 200:
                break
        except requests.exceptions.RequestException:
            continue
    if resp is None or resp.status_code != 200:
        raise RuntimeError(f'All Overpass endpoints failed for {city_name} (last status: {resp.status_code if resp else "no response"})')
    elements = resp.json().get('elements', [])

    venues = []
    for el in elements:
        tags = el.get('tags', {})
        name = tags.get('name')
        if not name:
            continue

        venue_type = _resolve_type(tags)
        if not venue_type:
            continue

        brand = (tags.get('brand') or tags.get('operator') or '').lower().strip() or None

        venues.append({
            'name': name,
            'lat': el['lat'],
            'lng': el['lon'],
            'osm_id': str(el['id']),
            'type': venue_type,
            'brand': brand,
            'address': _build_address(tags),
            'city': city_name,
            'country': tags.get('addr:country'),
        })

    return venues


def _resolve_type(tags: dict) -> Optional[str]:
    amenity = tags.get('amenity')
    shop = tags.get('shop')
    tourism = tags.get('tourism')

    if amenity == 'cafe':             return 'cafe'
    if amenity == 'library':          return 'library'
    if amenity == 'cinema':           return 'cinema'
    if amenity == 'community_centre': return 'community_centre'
    if tourism == 'museum':           return 'museum'
    if shop == 'supermarket':         return 'supermarket'
    if shop == 'mall':                return 'mall'
    return None


def _build_address(tags: dict) -> Optional[str]:
    parts = [
        tags.get('addr:housenumber'),
        tags.get('addr:street'),
        tags.get('addr:postcode'),
    ]
    parts = [p for p in parts if p]
    return ', '.join(parts) or None
