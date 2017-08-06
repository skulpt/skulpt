import sys
import unittest
import math

class SetTestCases(unittest.TestCase):
    def test_or(self):
        self.assertEqual(set('abcba') | set('cdc'), set('abcd'))
        self.assertEqual(set('abcba') | set('efgfe'), set('abcefg'))
        self.assertEqual(set('abcba') | set('ccb'), set('abc'))
        self.assertEqual(set('abcba') | set('ef'), set('abcef'))
        self.assertEqual(set('abcba') | set('ef') | set('fg'), set('abcefg'))

    def test_and(self):
        self.assertEqual(set('abcba') & set('cdc'), set('cc'))
        self.assertEqual(set('abcba') & set('efgfe'), set(''))
        self.assertEqual(set('abcba') & set('ccb'), set('bc'))
        self.assertEqual(set('abcba') & set('ef'), set(''))
        self.assertEqual(set('abcba') & set('cbcf') & set('bag'), set('b'))

    def test_sub(self):
        self.assertEqual(set('abcba') - set('cdc'), set('ab'))
        self.assertEqual(set('abcba') - set('efgfe'), set('abc'))
        self.assertEqual(set('abcba') - set('ccb'), set('a'))
        self.assertEqual(set('abcba') - set('ef'), set('abc'))
        self.assertEqual(set('abcba') - set('a') - set('b'), set('c'))

    def test_xor(self):
        self.assertEqual(set('abcba') ^ set('cdc'), set('abd'))
        self.assertEqual(set('abcba') ^ set('efgfe'), set('abcefg'))
        self.assertEqual(set('abcba') ^ set('ccb'), set('a'))
        self.assertEqual(set('abcba') ^ set('ef'), set('abcef'))

if __name__ == '__main__':
    unittest.main()