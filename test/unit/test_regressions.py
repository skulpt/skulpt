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


if __name__ == "__main__":
    unittest.main()
