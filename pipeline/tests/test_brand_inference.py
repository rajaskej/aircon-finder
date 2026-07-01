import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from brand_inference import apply_brand_inference

def _venue(type='cafe', brand=None):
    return {'type': type, 'brand': brand, 'has_ac': None, 'ac_confidence': None}

def test_starbucks_gets_ac():
    result = apply_brand_inference(_venue(brand='starbucks'))
    assert result['has_ac'] is True
    assert result['ac_confidence'] == 'inferred'

def test_costa_gets_ac():
    result = apply_brand_inference(_venue(brand='costa'))
    assert result['has_ac'] is True

def test_unknown_brand_unchanged():
    result = apply_brand_inference(_venue(brand='local_cafe'))
    assert result['has_ac'] is None
    assert result['ac_confidence'] is None

def test_library_type_gets_ac():
    result = apply_brand_inference(_venue(type='library'))
    assert result['has_ac'] is True
    assert result['ac_confidence'] == 'inferred'

def test_cinema_type_gets_ac():
    result = apply_brand_inference(_venue(type='cinema'))
    assert result['has_ac'] is True

def test_no_brand_cafe_unchanged():
    result = apply_brand_inference(_venue(type='cafe', brand=None))
    assert result['has_ac'] is None

def test_brand_case_insensitive():
    result = apply_brand_inference(_venue(brand='Starbucks'))
    assert result['has_ac'] is True
