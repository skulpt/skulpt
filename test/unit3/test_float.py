import sys
import unittest
import math

from test_grammar import (VALID_UNDERSCORE_LITERALS, INVALID_UNDERSCORE_LITERALS)

class FloatTestCases(unittest.TestCase):
    def test_conjugate(self):
        self.assertEqual(float(3.0).conjugate(), 3.0)
        self.assertEqual(int(-3.0).conjugate(), -3.0)
        
    def test_underscores(self):
        for lit in VALID_UNDERSCORE_LITERALS:
            if not any(ch in lit for ch in 'jJxXoObB'):
                # self.assertEqual(float(lit), eval(lit))
                self.assertEqual(float(lit), float(lit.replace('_', '')))
        for lit in INVALID_UNDERSCORE_LITERALS:
            if lit in ('0_7', '09_99'):  # octals are not recognized here
                continue
            if not any(ch in lit for ch in 'jJxXoObB'):
                self.assertRaises(ValueError, float, lit)
        # Additional test cases; nan and inf are never valid as literals,
        # only in the float() constructor, but we don't allow underscores
        # in or around them.
        self.assertRaises(ValueError, float, '_NaN')
        self.assertRaises(ValueError, float, 'Na_N')
        self.assertRaises(ValueError, float, 'IN_F')
        self.assertRaises(ValueError, float, '-_INF')
        self.assertRaises(ValueError, float, '-INF_')
        # Check that we handle bytes values correctly.
        # self.assertRaises(ValueError, float, b'0_.\xff9')

    def test_inf(self):
        self.assertTrue(math.isinf(float('Inf')))
        self.assertFalse(math.isinf(42))
        self.assertFalse(math.isinf(42.1))
        self.assertRaises(TypeError, lambda: math.isinf("42"))
        self.assertTrue(math.isinf(float('inf')))
        self.assertTrue(math.isinf(float('-inf')))

    def test_type_conversion(self):
        self.assertEqual(int(3.0),3)
        self.assertEqual(float(3), 3.0)
        self.assertEqual(type(float(1)), float)
        self.assertEqual(float("12.3"), 12.3)
        self.assertEqual(float("0."+"123456789"*3), 0.12345678912345678)
        self.assertEqual(float("123456789"*3), 1.2345678912345679e+26)

    def test_nan(self):
        self.assertTrue(math.isnan(float('nan')))
        self.assertTrue(math.isnan(float('-nan')))
        self.assertTrue(math.isnan(float('NAN')))
        self.assertTrue(math.isnan(float('-NAN')))
        self.assertTrue(math.isnan(float('+nAn')))

    def test_repr(self):
        self.assertEqual(repr(1.5), '1.5')

    def test_overflow(self):
        self.assertRaises(OverflowError, float, 2**1024)
        self.assertRaises(OverflowError, float, -2**1024)
        self.assertEqual(float('inf'), float(str(2**1024)))


if __name__ == '__main__':
    unittest.main()
