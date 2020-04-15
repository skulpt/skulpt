import unittest
import token


class TokenTests(unittest.TestCase):
    def test_isterminal(self):
        self.assertTrue(token.ISTERMINAL(token.PLUS))
        self.assertFalse(token.ISNONTERMINAL(token.COMMENT))

    def test_iseof(self):
        self.assertTrue(token.ISEOF(token.ENDMARKER))
        self.assertFalse(token.ISEOF(token.GREATER))

    def test_tok_name(self):
        self.assertEqual(token.tok_name[token.COMMENT], 'COMMENT')


if __name__ == '__main__':
    unittest.main()
