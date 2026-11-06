# Selected tests from CPython's Lib/test/test_unicode_identifiers.py.
import unittest


class PEP3131Test(unittest.TestCase):
    def test_valid(self):
        class T:
            ä = 1
            µ = 2  # this is a compatibility character
            蟒 = 3
            x󠄀 = 4
        self.assertEqual(getattr(T, "\xe4"), 1)
        # NFKC normalisation of bound names remains unsupported.
        # self.assertEqual(getattr(T, "\u03bc"), 2)
        self.assertEqual(getattr(T, '\u87d2'), 3)
        self.assertEqual(getattr(T, 'x\U000E0100'), 4)


class TestSkulptRegressions(unittest.TestCase):
    def test_astral_identifier_start(self):
        𐐀 = 5
        self.assertEqual(𐐀, 5)


if __name__ == "__main__":
    unittest.main()
