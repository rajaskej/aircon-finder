from config import BRAND_WHITELIST, AC_CERTAIN_TYPES

def apply_brand_inference(venue: dict) -> dict:
    """
    Returns a new venue dict with has_ac and ac_confidence set if the venue
    matches a known AC-certain brand or venue type.
    Does not mutate the caller's dict.
    """
    venue = dict(venue)  # don't mutate caller's dict

    if venue.get('has_ac') is not None:
        return venue  # already determined upstream (e.g. OSM air_conditioning tag)

    brand = (venue.get('brand') or '').lower().strip()
    venue_type = venue.get('type', '')

    if brand in BRAND_WHITELIST or venue_type in AC_CERTAIN_TYPES:
        venue['has_ac'] = True
        venue['ac_confidence'] = 'inferred'

    return venue
