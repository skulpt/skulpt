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

    def test_unicode(self):
        code = ["å = 11", "være = 42", "vare = 43"]

        def readline():
            if code:
                return code.pop()
            else:
                return ''

        tokens = list(tokenize.tokenize(readline))

        self.assertEqual(tokens[0][0], token.ENCODING)

        token_type, token_string, start, end, line = tokens[1]
        self.assertEqual(token_type, token.NAME)
        self.assertEqual(token_string, "vare")
        self.assertEqual(start, (1, 0))
        self.assertEqual(end, (1, 4))
        self.assertEqual(line, "vare = 43")

        token_type, token_string, start, end, line = tokens[2]
        self.assertEqual(token_type, token.OP)
        self.assertEqual(token_string, "=")
        self.assertEqual(start, (1, 5))
        self.assertEqual(end, (1, 6))
        self.assertEqual(line, "vare = 43")

        token_type, token_string, start, end, line = tokens[3]
        self.assertEqual(token_type, token.NUMBER)
        self.assertEqual(token_string, "43")
        self.assertEqual(start, (1, 7))
        self.assertEqual(end, (1, 9))
        self.assertEqual(line, "vare = 43")

        token_type, token_string, start, end, line = tokens[4]
        self.assertEqual(token_type, token.NAME)
        self.assertEqual(token_string, "være")
        self.assertEqual(start, (2,0))
        self.assertEqual(end, (2, 4))
        self.assertEqual(line, "være = 42")

        token_type, token_string, start, end, line = tokens[5]
        self.assertEqual(token_type, token.OP)
        self.assertEqual(token_string, "=")
        self.assertEqual(start, (2, 5))
        self.assertEqual(end, (2, 6))
        self.assertEqual(line, "være = 42")

        token_type, token_string, start, end, line = tokens[6]
        self.assertEqual(token_type, token.NUMBER)
        self.assertEqual(token_string, "42")
        self.assertEqual(start, (2, 7))
        self.assertEqual(end, (2, 9))
        self.assertEqual(line, "være = 43")

        token_type, token_string, start, end, line = tokens[7]
        self.assertEqual(token_type, token.NAME)
        self.assertEqual(token_string, "å")
        self.assertEqual(start, (3, 0))
        self.assertEqual(end, (3, 1))
        self.assertEqual(line, "å = 11")

        token_type, token_string, start, end, line = tokens[8]
        self.assertEqual(token_type, token.OP)
        self.assertEqual(token_string, "=")
        self.assertEqual(start, (3, 2))
        self.assertEqual(end, (3, 3))
        self.assertEqual(line, "å = 11")

        token_type, token_string, start, end, line = tokens[9]
        self.assertEqual(token_type, token.NUMBER)
        self.assertEqual(token_string, "11")
        self.assertEqual(start, (3, 4))
        self.assertEqual(end, (3, 6))
        self.assertEqual(line, "å = 11")

if __name__ == '__main__':
    unittest.main()
