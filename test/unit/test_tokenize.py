import token
import tokenize
import unittest

class TokenTests(unittest.TestCase):
    def test_isterminal(self):
        self.assertTrue(token.ISTERMINAL(token.PLUS))
        self.assertFalse(token.ISNONTERMINAL(token.COMMENT))

    def test_iseof(self):
        self.assertTrue(token.ISEOF(token.ENDMARKER))
        self.assertFalse(token.ISEOF(token.GREATER))

    def test_tok_name(self):
        self.assertEqual(token.tok_name[token.COMMENT], 'COMMENT')

class TokenizeTests(unittest.TestCase):
    def test_tokenize(self):
        code = ["print('a', 1 < 2)"]
        def readline():
            if code:
                return code.pop()
            else:
                return ''

        tokens = list(tokenize.tokenize(readline))

        self.assertEqual(tokens[0][0], token.ENCODING)

        (token_type, token_string, start, end, line) = tokens[1]
        self.assertEqual(token_type, token.NAME)
        self.assertEqual(token_string, "print")
        self.assertEqual(start, (1, 0))
        self.assertEqual(end, (1, 5))
        self.assertEqual(line, "print('a', 1 < 2)")

        (token_type, token_string, start, end, line) = tokens[2]
        self.assertEqual(token_type, token.OP)
        self.assertEqual(token_string, "(")

        (token_type, token_string, start, end, line) = tokens[3]
        self.assertEqual(token_type, token.STRING)
        self.assertEqual(token_string, "'a'")

        (token_type, token_string, start, end, line) = tokens[4]
        self.assertEqual(token_type, token.OP)
        self.assertEqual(token_string, ",")

if __name__ == '__main__':
    unittest.main()
