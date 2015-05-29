# Python test set -- built-in functions

import unittest
from operator import neg
import sys

class BuiltinTest(unittest.TestCase):

    def test_getattr(self):
        import sys
        self.assertTrue(getattr(sys, 'maxint') is sys.maxint)
        self.assertRaises(TypeError, getattr, sys, 1)
        self.assertRaises(TypeError, getattr)

    def test_hasattr(self):
        import sys
        self.assertTrue(hasattr(sys, 'maxint'))
        self.assertRaises(TypeError, hasattr, sys, 1)
        self.assertRaises(TypeError, hasattr)

    def test_setattr(self):
        setattr(sys, 'spam', 1)
        self.assertEqual(sys.spam, 1)
        self.assertRaises(TypeError, setattr, sys, 1, 'spam')
        self.assertRaises(AttributeError, setattr, 1, 'spam', 9)
        self.assertRaises(TypeError, setattr)

    def test_dir_subclasses(self):
        class Base:
            def method1(self):
                pass

        class Sub(Base):
            def method2(self):
                pass

        self.assertIn("method1", dir(Sub))
        self.assertIn("method2", dir(Sub))
        sub = Sub()
        self.assertIn("method1", dir(sub))
        self.assertIn("method2", dir(sub))

if __name__ == "__main__":
    unittest.main()
