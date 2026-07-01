import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from review_mining import scan_reviews_for_ac, _has_ac_signal

def test_positive_keyword_detected():
    reviews = [{'text': 'Great place, the air conditioning was amazing'}]
    assert _has_ac_signal(reviews) == 'yes'

def test_negative_keyword_detected():
    reviews = [{'text': 'No AC at all, very hot inside'}]
    assert _has_ac_signal(reviews) == 'no'

def test_no_signal_returns_none():
    reviews = [{'text': 'Nice coffee and friendly staff'}]
    assert _has_ac_signal(reviews) is None

def test_empty_reviews_returns_none():
    assert _has_ac_signal([]) is None

def test_positive_beats_negative_when_majority():
    reviews = [
        {'text': 'air conditioning was great'},
        {'text': 'air conditioning was great'},
        {'text': 'a bit stuffy'},
    ]
    assert _has_ac_signal(reviews) == 'yes'

def test_scan_reviews_sets_has_ac_true():
    venue = {'has_ac': None, 'ac_confidence': None, 'google_place_id': None}
    reviews = [{'text': 'Freezing inside, great AC'}]
    result = scan_reviews_for_ac(venue, reviews, 'fake_place_id')
    assert result['has_ac'] is True
    assert result['ac_confidence'] == 'review_mined'
    assert result['google_place_id'] == 'fake_place_id'

def test_scan_reviews_sets_has_ac_false():
    venue = {'has_ac': None, 'ac_confidence': None, 'google_place_id': None}
    reviews = [{'text': 'No air con, boiling inside'}]
    result = scan_reviews_for_ac(venue, reviews, 'fake_place_id')
    assert result['has_ac'] is False
    assert result['ac_confidence'] == 'review_mined'

def test_scan_reviews_no_signal_unchanged():
    venue = {'has_ac': None, 'ac_confidence': None, 'google_place_id': None}
    result = scan_reviews_for_ac(venue, [{'text': 'Good coffee'}], 'fake_place_id')
    assert result['has_ac'] is None
