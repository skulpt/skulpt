"""Unit testing for None """
import unittest

class NoneTests(unittest.TestCase):
    def test_basic(self):
        self.assertEqual(str(None), 'None')
        self.assertEqual(repr(None), 'None')
        self.assertEqual(str(type(None)), "<class 'NoneType'>")
        self.assertTrue(isinstance(None, type(None)))
        flag = False
        if None:
            flag = True
        self.assertFalse(flag)

    def test_compare(self):
        self.assertFalse(0 == None)
        self.assertFalse(0.0 == None)
        self.assertFalse(None == 0)
        self.assertFalse(None == 0.0)
        self.assertTrue(0 != None)
        self.assertTrue(0.0 != None)
        self.assertTrue(None != 0)
        self.assertTrue(None != 0.0)

    def test_in_list(self):
        self.assertFalse(None in [1,2,3])
        self.assertTrue(None in [1,2,3,None])
        self.assertTrue(None not in [1,2,3])
        self.assertFalse(None not in [1,2,3,None])

    def test_in_dict(self):
        self.assertFalse(None in {1:2, 3:4})
        self.assertTrue(None in {1:2, 3:4, None:5})
        self.assertTrue(None not in {1:2, 3:4})
        self.assertFalse(None not in {1:2, 3:4, None:5})

    def test_is_isnot(self):
        self.assertTrue(None is None)
        self.assertFalse(None is not None)
        self.assertFalse(None is 3)
        self.assertFalse(3 is None)
        self.assertTrue(None is not 3)
        self.assertTrue(3 is not None)
        self.assertTrue(None == None)

    def test_errors(self):
        #Skulpt fails the following 3 tests, it should pass them though
        #self.assertRaises(TypeError, lambda x: x > 3, None)
        #self.assertRaises(TypeError, lambda x: x > None, None)
        #self.assertRaises(TypeError, abs, None)
        self.assertRaises(TypeError, chr, None)
        self.assertRaises(TypeError, int, None)
        self.assertRaises(TypeError, float, None)

if __name__ == '__main__':
    unittest.main()
            
