# Adapted from the keywordonly_args doctest in CPython Lib/test/test_code.py.

import unittest

class TestCodeMetadata(unittest.TestCase):
    def test_keywordonly_args(self):
        def keywordonly_args(a, b, *, k1):
            return a, b, k1
        co = keywordonly_args.__code__
        self.assertEqual(co.co_name, 'keywordonly_args')
        self.assertEqual(co.co_argcount, 2)
        self.assertEqual(co.co_posonlyargcount, 0)
        self.assertEqual(co.co_kwonlyargcount, 1)
        self.assertEqual(co.co_varnames, ('a', 'b', 'k1'))

if __name__ == '__main__':
    unittest.main()
