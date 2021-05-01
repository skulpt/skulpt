"""Unit test for biwise operators"""
import unittest

class OperatorsTest(unittest.TestCase):
    def test_bitwise_and(self):
        self.assertEqual(5&7, 5)
        x = 5
        x &= 7
        self.assertEqual(x, 5)
        self.assertEqual(0b1111 & 0b0001, 0b0001)
        self.assertEqual(0O7740 & 0O7400, 0O7400)
        self.assertEqual(0x0ff0 & 0xf00f, 0x0000)
        self.assertEqual(745 & 348, 72)

    def test_bitwise_xor(self):
        self.assertEqual(2^7, 5)
        self.assertEqual(7^2&2, 5)
        x = 2
        x ^= 7
        self.assertEqual(x, 5)
        self.assertEqual(0b0110 ^ 0b0101, 0b0011)
        self.assertEqual(0O1200 ^ 0O1034,0O0234)
        self.assertEqual(0x10f0 ^ 0x01f0, 0x1100)
        self.assertEqual(3847 ^ 4958, 7257)

    def test_bitwise_or(self):
        self.assertEqual(7^2|4, 5)
        x=4
        x|=1
        self.assertEqual(x, 5)
        a = 1|2|3|4|5|6|0x80
        self.assertEqual(a, 135)
        self.assertEqual(0b0101 | 0b1010, 0b1111)
        self.assertEqual(0x0ff0 | 0x0000, 0x0ff0)
        self.assertEqual(0O0505 | 0O1000, 0O1505)
        self.assertEqual(124 | 37, 125)

    def test_shift(self):
        self.assertRaises(ValueError, lambda x: 3 >> x, -3)
        self.assertEqual(0b0110 << 2, 0b11000)
        self.assertEqual(0b0110 >> 2, 0b0001)
        self.assertEqual(0O2763 << 2, 0O13714)
        self.assertEqual(0O2763 >> 2, 0O574)
        self.assertEqual(0x5a01 << 2, 0x16804)
        self.assertEqual(0x5a01 >> 2, 0x1680)
        self.assertEqual(1834 << 2, 7336)
        self.assertEqual(1834 >> 2, 458)
        self.assertEqual((1834<<30)>>28, 7336)
        self.assertEqual((1<<33)>>32, 2)
        over_32bits = 0xa * 2**34
        self.assertEqual(over_32bits >> 2, over_32bits / 4)
        self.assertEqual(-0xa >> 2, -3)

    def test_more_shifts(self):
        for i in range(1, 70):
            self.assertEqual((1<<i)>>(i-1), 2)
            self.assertEqual((-1<<i)>>(i-1), -2)
            self.assertEqual((0xb<<i)>>(i+1), 5)

    def test_not(self):
        self.assertEqual(~0b0011, -0b0100)
        self.assertEqual(~0x4a30, -0x4a31)
        self.assertEqual(~2398, -2399)
        self.assertEqual(~0O1234, -0O1235)

if __name__ == '__main__':
    unittest.main()
            
