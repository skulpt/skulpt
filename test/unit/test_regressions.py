"""Tests for bug regressions."""

import unittest

class RegressionTest(unittest.TestCase):
    def test_string_equality(self):
        self.assertTrue("1" == "1")
        self.assertFalse("1" != "1")
        self.assertFalse("1" == "2")
        self.assertTrue("1" != "2")
        self.assertFalse("1" == 1)
        self.assertTrue("1" != 1)
    

    def testNotEqual(self):
        # these should compile in py2
        self.assertTrue(2<>3)
        self.assertFalse(2<>2)



if __name__ == "__main__":
    unittest.main()
