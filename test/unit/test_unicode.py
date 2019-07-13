import unittest

class TestUnicode(unittest.TestCase):
    def test_normal_string_should_be_parsed_correctly(self):
        unicode_string = u"这是"
        self.assertIn(u"是", unicode_string)

    def test_string_with_escape_should_be_parsed_correctly(self):
        unicode_string = u"这是\n这这这"
        self.assertIn(u"是", unicode_string)

if __name__ == '__main__':
    unittest.main()
