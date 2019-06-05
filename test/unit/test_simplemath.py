__author__ = 'millbr02'


import unittest


class SimpleMath(unittest.TestCase):
    def testOne(self):
        x = 2 + 2
        self.assertEqual(x, 4)
        self.assertEqual(type(x), int)

if __name__ == '__main__':
    unittest.main()
