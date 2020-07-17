""" Unit test for magic methods"""
import unittest

class A:
        def __bool__(self):
            return False

class TestMagicMethods(unittest.TestCase):

    def test_dynamic_creation(self):
        ax = A()
        ay = A()

        # add
        with self.assertRaises(TypeError):
            ax + ay
        A.__add__ = lambda x,y : 5
        self.assertEqual(ax+ay, 5)

        # bool
        self.assertFalse(bool(ax))
        A.__bool__ = lambda x: True
        self.assertTrue(bool(ax))

        # lt
        with self.assertRaises(TypeError):
            ax < ay
        
        A.__lt__ = lambda x,y : True
        self.assertTrue(ax<ay)


if __name__ == '__main__':
    unittest.main()
