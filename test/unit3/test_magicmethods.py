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

    def test_subclass_override_reflected_slots(self):
        class A:
            def __add__(self, other):
                return 4
            def __radd__(self, other):
                return 5

        class B(A): pass

        a = A(); b = B()

        # the subclass did not override the reflected slot
        self.assertEqual(a + b, 4)

        # we only take the __radd__ slot if the subclass has actually overridden it
        B.__radd__ = lambda self, other: 6
        self.assertEqual(a + b, 6)

        del B.__radd__
        A.__add__ = lambda self, other: NotImplemented
        # if a superclass returns NotImplemented use the reflected slot
        # because we haven't tried it yet
        self.assertEqual(a + b, 5)
        
        # but only if we're actually a subclass
        # if we're the same type don't try the refelcted slot
        with self.assertRaises(TypeError):
            a + a
        with self.assertRaises(TypeError):
            b + b

        class C:
            def __radd__(self, other):
                return 7
        c = C()
        with self.assertRaises(TypeError):
            c + c 
         # even though c has a __radd__ and no __add__
         # we don't try the __radd__ because c and c are the same type 
        
        # C has an override and A.__add__ returns NotImplemented
        self.assertEqual(a + c, 7)
        self.assertEqual(c + a, 5) # vice versa but C.__add__ doesn't exist

        A.__add__ = lambda self, other: 4
        self.assertEqual(a + c, 4) # not a subclass so use __add__


        class A:
            def __lt__(self, other):
                return True
            def __gt__(self, other):
                return False

        class B(A): pass

        a = A(); b = B()


        #  always use the reflected slot if we're a subclass
        self.assertFalse(a < b)
        #  but only if we're a subclass
        self.assertTrue(a < a)

        A.__lt__ = lambda self, other: NotImplemented
        # if the original slot returns NotImplemented
        # always use the reflected slot with richcompare
        self.assertFalse(a < a)
        self.assertFalse(b < b)
        del A.__lt__
        # or if it doesn't exist use the relected slot
        self.assertFalse(a < a)
        del A.__gt__
        with self.assertRaises(TypeError):
            a < a




if __name__ == '__main__':
    unittest.main()
