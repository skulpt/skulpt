__author__ = 'jsd'

# Test the unichr() function
# This is hardly an exhaustive check,
# but spot-checking is better than no checking.

import unittest

class TestUnichr(unittest.TestCase):
# one-byte code (basic plane):
    def testOne(self):
        self.assertEqual(unichr(0x61),     'a')
    def testOneMore(self):
        self.assertEqual(unichr(0x61),    u'a')

# two-byte code:
    def testTwo(self):
        self.assertEqual(unichr(0x3c9),   u'ω')
# three-byte code:
    def testThree(self):
        self.assertEqual(unichr(0x2207),  u'∇')

# four-byte code (astral plane)
    def testFour(self):
        self.assertEqual(unichr(0x1d11e), u'𝄞')

if __name__ == '__main__':
    unittest.main()
