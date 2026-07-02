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
    ('Graz',      (47.00, 15.35, 47.10, 15.50)),
    ('Vienna',    (48.12, 16.18, 48.32, 16.58)),
    ('Salzburg',  (47.77, 13.01, 47.84, 13.10)),
    ('Munich',    (48.06, 11.36, 48.23, 11.72)),
    ('London',    (51.28, -0.49, 51.69,  0.24)),
    ('Amsterdam', (52.27,  4.73, 52.43,  5.08)),
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
    # English
    'air con', 'air conditioning', 'air-conditioning', 'air conditioned',
    'air-conditioned', ' ac ', 'a/c', 'freezing inside', 'cool inside',
    'cold inside', 'nicely cooled', 'well cooled',
    # German
    'klimaanlage', 'klimatisiert', 'klimatisierung', 'air condition',
    'angenehm kühl', 'schön kühl', 'gut gekühlt', 'gut klimatisiert',
    # French
    'climatisation', 'climatisé', 'climatisée', 'bien climatisé',
    # Spanish
    'aire acondicionado', 'climatizado', 'climatizada',
    # Italian
    'aria condizionata', 'condizionatore', 'climatizzato',
    # Dutch
    'airconditioning', 'airco', 'gekoeld', 'lekker koel',
]

AC_NEGATIVE_KEYWORDS = [
    # English
    'no ac', 'no air con', 'no air conditioning', 'hot inside',
    'stuffy', 'sweltering', 'boiling inside', 'no cooling',
    'no a/c', 'very warm inside',
    # German
    'keine klimaanlage', 'keine klimatisierung', 'kein ac',
    'sehr warm', 'zu warm', 'sehr heiß', 'stickig',
    # French
    'pas de climatisation', 'pas de clim', 'trop chaud',
    # Spanish
    'sin aire acondicionado', 'sin climatización', 'mucho calor',
    # Italian
    'senza aria condizionata', 'senza condizionatore', 'molto caldo',
    # Dutch
    'geen airco', 'geen airconditioning', 'erg warm', 'te warm',
]
