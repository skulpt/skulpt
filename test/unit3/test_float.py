import sys
import unittest
import math

class FloatTestCases(unittest.TestCase):
    def test_conjugate(self):
        self.assertEqual(float(3.0).conjugate(), 3.0)
        self.assertEqual(int(-3.0).conjugate(), -3.0)

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
        self.assertEqual(repr(0.3000000000000000004), "0.3")

    def test_str(self):
        self.assertEqual(str(0.3000000000000000004), "0.3")

    def test_str_and_add(self):
        self.assertEqual(str(0.1 + 0.2), "0.30000000000000004")  # issue 968

    def test_repr_and_add(self):
        self.assertEqual(repr(0.1 + 0.2), "0.30000000000000004")  # issue 968


if __name__ == '__main__':
    unittest.main()
