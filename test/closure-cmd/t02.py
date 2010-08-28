import goog.json

strd = goog.json.serialize({
    'a': 45,
    'b': [
        1, 2, 3, 4, {
            'c': "stuff",
            'd': "things",
        }],
    'xyzzy': False,
    'blorp': True
        })
print strd
print goog.json.unsafeParse(strd)
print goog.json.serialize(goog.json.unsafeParse(strd)) == strd
