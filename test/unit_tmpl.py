__author__ = 'You'

# unit test files should be named test_<your name here>.py
# this ensures they will automatically be included in the
# ./skulpt.py test or ./skulpt.py dist testing procedures
#

import unittest

class SimpleMath(unittest.TestCase):
    def setUp(self):
        # run prior to each test
        pass
        
    def tearDown(self):
        # run after each test
        pass
        
    def testOne(self):
        # tests must follow the naming convention of starting with test
        x = 2 + 2
        self.assertEqual(x, 4)
        self.assertEqual(type(x), int)

if __name__ == '__main__':
    unittest.main()
