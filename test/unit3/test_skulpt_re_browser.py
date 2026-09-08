"""Boundary behavior shared by modern and pre-lookbehind browsers."""
import re
import unittest


class BrowserBoundaryTests(unittest.TestCase):
    def test_word_boundaries(self):
        for flags in (0, re.A):
            self.assertEqual(
                [m.span() for m in re.finditer(r'\b', 'foo bar', flags)],
                [(0, 0), (3, 3), (4, 4), (7, 7)])
            self.assertEqual(re.sub(r'\bfoo\b', 'x', 'foo food', flags=flags),
                             'x food')

    def test_non_boundaries(self):
        for flags in (0, re.A):
            self.assertEqual(
                [m.span() for m in re.finditer(r'\B', 'foo bar', flags)],
                [(1, 1), (2, 2), (5, 5), (6, 6)])
            self.assertEqual(re.sub(r'\Boo\B', 'x', 'foobar foo', flags=flags),
                             'fxbar foo')


if __name__ == '__main__':
    unittest.main()
