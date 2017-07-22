import sys
import unittest

class TestHexOctBin(unittest.TestCase):
    def test_hex_baseline(self):
        # A few upper/lowercase tests
        self.assertEqual(0x0, 0X0)
        self.assertEqual(0x1, 0X1)
        self.assertEqual(0x123456789abcdef, 0X123456789abcdef)
        # Baseline tests
        self.assertEqual(0x0, 0)
        self.assertEqual(0x10, 16)
        self.assertEqual(0x7fffffff, 2147483647)
        self.assertEqual(0x7fffffffffffffff, 9223372036854775807)
        # Ditto with a minus sign and parentheses
        self.assertEqual(-(0x0), 0)
        self.assertEqual(-(0x10), -16)
        self.assertEqual(-(0x7fffffff), -2147483647)
        self.assertEqual(-(0x7fffffffffffffff), -9223372036854775807)
        # Ditto with a minus sign and NO parentheses
        self.assertEqual(-0x0, 0)
        self.assertEqual(-0x10, -16)
        self.assertEqual(-0x7fffffff, -2147483647)
        self.assertEqual(-0x7fffffffffffffff, -9223372036854775807)

    def test_hex_unsigned(self):
        # Positive constants
        self.assertEqual(0x80000000, 2147483648)
        self.assertEqual(0xffffffff, 4294967295)
        # Ditto with a minus sign and parentheses
        self.assertEqual(-(0x80000000), -2147483648)
        self.assertEqual(-(0xffffffff), -4294967295)
        # Ditto with a minus sign and NO parentheses
        # This failed in Python 2.2 through 2.2.2 and in 2.3a1
        self.assertEqual(-0x80000000, -2147483648)
        self.assertEqual(-0xffffffff, -4294967295)

        # Positive constants
        self.assertEqual(0x8000000000000000, 9223372036854775808)
        self.assertEqual(0xffffffffffffffff, 18446744073709551615)
        # Ditto with a minus sign and parentheses
        self.assertEqual(-(0x8000000000000000), -9223372036854775808)
        self.assertEqual(-(0xffffffffffffffff), -18446744073709551615)
        # Ditto with a minus sign and NO parentheses
        # This failed in Python 2.2 through 2.2.2 and in 2.3a1
        self.assertEqual(-0x8000000000000000, -9223372036854775808)
        self.assertEqual(-0xffffffffffffffff, -18446744073709551615)

    def test_oct_baseline(self):
        # A few upper/lowercase tests
        self.assertEqual(0o0, 0O0)
        self.assertEqual(0o1, 0O1)
        self.assertEqual(0o1234567, 0O1234567)
        # Baseline tests
        self.assertEqual(0o0, 0)
        self.assertEqual(0o20, 16)
        self.assertEqual(0o17777777777, 2147483647)
        self.assertEqual(0o777777777777777777777, 9223372036854775807)
        # Ditto with a minus sign and parentheses
        self.assertEqual(-(0o0), 0)
        self.assertEqual(-(0o20), -16)
        self.assertEqual(-(0o17777777777), -2147483647)
        self.assertEqual(-(0o777777777777777777777), -9223372036854775807)
        # Ditto with a minus sign and NO parentheses
        self.assertEqual(-0o0, 0)
        self.assertEqual(-0o20, -16)
        self.assertEqual(-0o17777777777, -2147483647)
        self.assertEqual(-0o777777777777777777777, -9223372036854775807)

    def test_oct_unsigned(self):
        # Positive constants
        self.assertEqual(0o20000000000, 2147483648)
        self.assertEqual(0o37777777777, 4294967295)
        # Ditto with a minus sign and parentheses
        self.assertEqual(-(0o20000000000), -2147483648)
        self.assertEqual(-(0o37777777777), -4294967295)
        # Ditto with a minus sign and NO parentheses
        # This failed in Python 2.2 through 2.2.2 and in 2.3a1
        self.assertEqual(-0o20000000000, -2147483648)
        self.assertEqual(-0o37777777777, -4294967295)

        # Positive constants
        self.assertEqual(0o1000000000000000000000, 9223372036854775808)
        self.assertEqual(0o1777777777777777777777, 18446744073709551615)
        # Ditto with a minus sign and parentheses
        self.assertEqual(-(0o1000000000000000000000), -9223372036854775808)
        self.assertEqual(-(0o1777777777777777777777), -18446744073709551615)
        # Ditto with a minus sign and NO parentheses
        # This failed in Python 2.2 through 2.2.2 and in 2.3a1
        self.assertEqual(-0o1000000000000000000000, -9223372036854775808)
        self.assertEqual(-0o1777777777777777777777, -18446744073709551615)

    """
      we do not support binary literals
    """

if __name__ == '__main__':
    unittest.main()
