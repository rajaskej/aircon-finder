import re
import requests
from typing import Optional
from config import AC_POSITIVE_KEYWORDS, AC_NEGATIVE_KEYWORDS

PLACES_URL = 'https://maps.googleapis.com/maps/api/place'

# Word-boundary matching so 'no ac' doesn't match 'no account' / 'no access'
def _compile(keywords: list) -> list:
    return [re.compile(r'\b' + re.escape(kw.strip()) + r'\b') for kw in keywords]

_NEG_PATTERNS = _compile(AC_NEGATIVE_KEYWORDS)
_POS_PATTERNS = _compile(AC_POSITIVE_KEYWORDS)


def mine_reviews(venue: dict, api_key: str) -> dict:
    """
    Looks up the venue on Google Places, fetches reviews,
    and scans for AC keywords. Returns updated venue dict.
    """
    venue = dict(venue)

    if venue.get('has_ac') is not None:
        return venue  # already determined

    place_id = _find_place_id(venue['name'], venue['lat'], venue['lng'], api_key)
    if not place_id:
        return venue

    reviews = _fetch_reviews(place_id, api_key)
    return scan_reviews_for_ac(venue, reviews, place_id)


def scan_reviews_for_ac(venue: dict, reviews: list, place_id: str) -> dict:
    venue = dict(venue)
    venue['google_place_id'] = place_id
    signal = _has_ac_signal(reviews)
    if signal == 'yes':
        venue['has_ac'] = True
        venue['ac_confidence'] = 'review_mined'
    elif signal == 'no':
        venue['has_ac'] = False
        venue['ac_confidence'] = 'review_mined'
    return venue


def _has_ac_signal(reviews: list) -> Optional[str]:
    yes_count = 0
    no_count = 0
    for review in reviews:
        text = (review.get('text') or '').lower()
        # Check negative keywords first to avoid false positives (e.g., "no ac" contains "ac")
        if any(p.search(text) for p in _NEG_PATTERNS):
            no_count += 1
        elif any(p.search(text) for p in _POS_PATTERNS):
            yes_count += 1

    if yes_count == 0 and no_count == 0:
        return None
    return 'yes' if yes_count >= no_count else 'no'


def _find_place_id(name: str, lat: float, lng: float, api_key: str) -> Optional[str]:
    resp = requests.get(
        f'{PLACES_URL}/findplacefromtext/json',
        params={
            'input': name,
            'inputtype': 'textquery',
            'locationbias': f'point:{lat},{lng}',
            'fields': 'place_id',
            'key': api_key,
        },
        timeout=10,
    )
    resp.raise_for_status()
    candidates = resp.json().get('candidates', [])
    return candidates[0]['place_id'] if candidates else None


def _fetch_reviews(place_id: str, api_key: str) -> list:
    resp = requests.get(
        f'{PLACES_URL}/details/json',
        params={
            'place_id': place_id,
            'fields': 'reviews',
            'key': api_key,
        },
        timeout=10,
    )
    resp.raise_for_status()
    result = resp.json().get('result', {})
    return result.get('reviews', [])
