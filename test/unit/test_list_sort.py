__author__ = 'albertjan'

# unit test files should be named test_<your name here>.py
# this ensures they will automatically be included in the
# ./skulpt.py test or ./skulpt.py dist testing procedures
#

import unittest

class ListSort(unittest.TestCase):
    def test_sortReverseFalseShouldWork(self):
        x = [1,2,3]
        x.sort(reverse=False)
        self.assertEqual(x, [1,2,3])

if __name__ == '__main__':
    unittest.main()
