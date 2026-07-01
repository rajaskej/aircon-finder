# pipeline/config.py

OSM_VENUE_QUERIES = {
    'cafe':             'node["amenity"="cafe"]',
    'library':          'node["amenity"="library"]',
    'cinema':           'node["amenity"="cinema"]',
    'museum':           'node["tourism"="museum"]',
    'supermarket':      'node["shop"="supermarket"]',
    'mall':             'node["shop"="mall"]',
    'community_centre': 'node["amenity"="community_centre"]',
}

# Cities to process: (display_name, (south, west, north, east))
CITIES = [
    ('London',   (51.28, -0.49, 51.69,  0.24)),
    ('Paris',    (48.81,  2.22, 48.91,  2.47)),
    ('Berlin',   (52.34, 13.09, 52.68, 13.76)),
    ('Madrid',   (40.31, -3.83, 40.64, -3.52)),
    ('Rome',     (41.79, 12.35, 41.99, 12.65)),
    ('Amsterdam',(52.27,  4.73, 52.43,  5.08)),
    ('Barcelona',(41.32,  2.07, 41.47,  2.23)),
]

BRAND_WHITELIST = {
    # Cafés / fast food
    'starbucks', 'costa', 'pret a manger', "pret", "mcdonald's", 'mcdonalds',
    'burger king', 'kfc', 'subway', 'leon', 'greggs', 'caffe nero',
    # Retail
    'primark', 'h&m', 'zara', 'ikea', 'marks & spencer', 'm&s',
    'boots', 'apple', 'waterstones', 'fnac',
    # Supermarkets
    'tesco', "sainsbury's", 'sainsburys', 'waitrose', 'asda', 'lidl',
    'aldi', 'carrefour', 'leclerc', 'rewe', 'edeka', 'mercadona',
}

# OSM venue types that always have AC (regardless of brand)
AC_CERTAIN_TYPES = {'library', 'cinema', 'mall', 'museum'}

AC_POSITIVE_KEYWORDS = [
    'air con', 'air conditioning', 'air-conditioning', 'air conditioned',
    'air-conditioned', ' ac ', 'a/c', 'freezing inside', 'cool inside',
    'cold inside', 'nicely cooled', 'well cooled',
]

AC_NEGATIVE_KEYWORDS = [
    'no ac', 'no air con', 'no air conditioning', 'hot inside',
    'stuffy', 'sweltering', 'boiling inside', 'no cooling',
    'no a/c', 'very warm inside',
]
