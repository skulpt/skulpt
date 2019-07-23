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

    def test_binary_literal(self):
        self.assertEqual(0b1010, 10)
        self.assertEqual(str(0b1010), '10')
        self.assertEqual(-0b1010, -10)
        self.assertEqual(str(-0b1010), '-10')
        self.assertEqual(0, -0)

    def test_big_numbers(self):
        def helper(func,x):
            return (func(x), func(-x))
        big = 123456789123456789123456789123456789
        self.assertEqual(helper(hex,10), ('0xa', '-0xa'))
        self.assertEqual(helper(hex,0xff), ('0xff', '-0xff'))
        self.assertEqual(helper(hex,0b1110011), ('0x73', '-0x73'))
        self.assertEqual(helper(hex,big), ('0x17c6e3c032f89045ad746684045f15', '-0x17c6e3c032f89045ad746684045f15'))
        self.assertEqual(helper(oct,10), ('0o12', '-0o12'))
        self.assertEqual(helper(oct,0xff), ('0o377', '-0o377'))
        self.assertEqual(helper(oct,0b1110011), ('0o163', '-0o163'))
        self.assertEqual(helper(oct,big), ('0o574334360031370440426553506320401057425', '-0o574334360031370440426553506320401057425'))
        self.assertEqual(helper(bin,10), ('0b1010', '-0b1010'))
        self.assertEqual(helper(bin,0xff), ('0b11111111', '-0b11111111'))
        self.assertEqual(helper(bin,0b1110011), ('0b1110011', '-0b1110011'))
        self.assertEqual(helper(bin,big), ('0b101111100011011100011110000000011001011111000100100000100010110101101011101000110011010000100000001000101111100010101', '-0b101111100011011100011110000000011001011111000100100000100010110101101011101000110011010000100000001000101111100010101'))

if __name__ == '__main__':
    unittest.main()
