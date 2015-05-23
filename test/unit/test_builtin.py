# Python test set -- built-in functions

import unittest
from operator import neg
import sys

class BuiltinTest(unittest.TestCase):

    def test_getattr(self):
        import sys
        self.assertTrue(getattr(sys, 'maxint') is sys.maxint)
        def foo():
            getattr(sys,1)
        self.assertRaises(TypeError, foo)
        self.assertRaises(TypeError, getattr)

    def test_hasattr(self):
        import sys
        self.assertTrue(hasattr(sys, 'maxint'))
        def foo():
            hasattr(sys,1)
        self.assertRaises(TypeError, foo)
        self.assertRaises(TypeError, hasattr)

    def test_setattr(self):
        setattr(sys, 'spam', 1)
        self.assertEqual(sys.spam, 1)
        def foo():
            setattr(sys,1,'spam')
        def bar():
            setattr(1,'spam',9)
        self.assertRaises(TypeError, foo)
        self.assertRaises(AttributeError, bar)
        self.assertRaises(TypeError, setattr)




if __name__ == "__main__":
    unittest.main()
