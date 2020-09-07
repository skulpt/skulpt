import unittest

class TestUnicode(unittest.TestCase):
    def test_normal_string_should_be_parsed_correctly(self):
        unicode_string = u"这是"
        self.assertIn(u"是", unicode_string)

    def test_string_with_escape_should_be_parsed_correctly(self):
        unicode_string = u"这是\n这这这"
        self.assertIn(u"是", unicode_string)

    def test_encoding(self):
        # Unicode snowman: BMP emoji
        self.assertEqual(u'\u2603'.encode(), '\xe2\x98\x83')
        self.assertEqual('\xe2\x98\x83'.decode(), u'\u2603')

        self.assertEqual(ord(u'\u2603'), 0x2603) 
        self.assertRaises(ValueError, chr, 0x2603)
        self.assertEqual(unichr(0x2603), u'\u2603') 

        # String repr in Python 2 is ascii
        self.assertEqual(repr(u'\x01\xf0\u2603'), "'\\x01\\xf0\\u2603'")
        # ...and there is no explicit ascii() function
        self.assertRaises(NameError, lambda: ascii('hi there'))

        # Piece of pizza: Astral emoji
        self.assertEqual(u'\U0001f355'.encode(), b'\xf0\x9f\x8d\x95')
        self.assertEqual('\xf0\x9f\x8d\x95'.decode(), u'\U0001f355')

        # Python 2 silently accepts b'' strings
        self.assertEqual(b'hello world', 'hello world')
        self.assertEqual(type(b'hello world'), str)

        # We do not distinguish between str and unicode in Skulpt


if __name__ == '__main__':
    unittest.main()
