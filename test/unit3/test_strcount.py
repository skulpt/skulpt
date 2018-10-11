import unittest

class string_count(unittest.TestCase):
    def test_singles(self):
        self.assertEqual(1, 'abc'.count('a'))
        self.assertEqual(2, 'abcab'.count('b'))
        self.assertEqual(2, 'abc..abc'.count('.'))

    def test_multiples(self):
        self.assertEqual(2, 'abab'.count('ab'))
        self.assertEqual(2, 'abcab'.count('ab'))

        self.assertEqual(1, 'aaa'.count('aa'))

    def test_specials(self):
        self.assertEqual(2, '-abc-'.count('-'))
        self.assertEqual(2, '[[abc]'.count('['))
        self.assertEqual(2, '\\abc\\'.count('\\'))
        self.assertEqual(4, ']]]abc]'.count(']'))
        self.assertEqual(2, '{{}}'.count('{'))
        self.assertEqual(3, '{}}}'.count('}'))
        self.assertEqual(1, '(abc]'.count('('))
        self.assertEqual(2, 'abc))'.count(')'))
        self.assertEqual(3, 'a*b*c*d'.count('*'))
        self.assertEqual(2, 'a+b+c'.count('+'))
        self.assertEqual(2, '?abc?'.count('?'))
        self.assertEqual(2, 'abc..abc'.count('.'))
        self.assertEqual(4, 'a, b, c, d, '.count(','))
        self.assertEqual(1, 'a^b*c'.count('^'))
        self.assertEqual(3, '$$$'.count('$'))
        self.assertEqual(2, 'a|b|c'.count('|'))
        self.assertEqual(1, '#abc'.count('#'))
        self.assertEqual(1, ' '.count(' '))
        self.assertEqual(3, '   '.count(' '))

if __name__ == "__main__":
    unittest.main()
