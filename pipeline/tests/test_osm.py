import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from osm import _resolve_type, _build_address

def test_resolve_type_cafe():
    assert _resolve_type({'amenity': 'cafe'}) == 'cafe'

def test_resolve_type_library():
    assert _resolve_type({'amenity': 'library'}) == 'library'

def test_resolve_type_museum():
    assert _resolve_type({'tourism': 'museum'}) == 'museum'

def test_resolve_type_unknown():
    assert _resolve_type({'amenity': 'pub'}) is None

def test_build_address_full():
    tags = {'addr:housenumber': '10', 'addr:street': 'Baker St', 'addr:postcode': 'NW1 6XE'}
    assert _build_address(tags) == '10, Baker St, NW1 6XE'

def test_build_address_partial():
    assert _build_address({'addr:street': 'Oxford St'}) == 'Oxford St'

def test_build_address_empty():
    assert _build_address({}) is None
