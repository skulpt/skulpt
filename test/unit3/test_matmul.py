"""Unit testing for matrix multiplication operator, @"""
import unittest

class MatMulTests(unittest.TestCase):
    def test_matmul(self):
        class A:
            def __init__(self,x):
                self.x = x
            def __matmul__(self,other):
                return self.x*(other.x)
        a = A(2)
        b = A(3)
        c = a @ b
        self.assertEqual(c, 6)
        self.assertEqual((a.x, b.x), (2,3))
        self.assertEqual(a.__matmul__(b), 6)
        #self.assertEqual(repr(a.__matmul__), '<bound method A.__matmul__ of <__main__.A object>>')
        class B:
            def __init__(self,x):
                self.x = x
        a = B(2)
        b = B(3)
        self.assertRaises(TypeError, lambda x, y: x @ y, a, b)
        self.assertRaises(AttributeError, lambda x: x.__matmul__, a)

    def test_imatmul(self):
        class A:
            def __init__(self,x):
                self.x = x
            def __imatmul__(self,other):
                return A(self.x * other.x)
        a = A(2)
        b = A(3)
        a @= b
        self.assertEqual(a.x, 6)
        self.assertEqual(a.__imatmul__(b).x, 18)
        class B:
            def __init__(self,x):
                self.x = x
        a = B(2)
        b = B(3)
        def foo(x, y):
            x @= y
            return x
        self.assertRaises(TypeError,  foo, a, b)
        self.assertRaises(AttributeError, lambda x: x.__imatmul__, a)
        class C:
            def __init__(self,x):
                self.x = x
            def __matmult__(self, other):
                return self.x * other.x
            def __imatmul__(self,other):
                return C(self.x * other.x)
        a = C(2)
        b = C(3)
        a @= b
        self.assertEqual(a.x, 6)
        self.assertEqual(type(a), C)
        self.assertEqual(a.__imatmul__(b).x, 18)
        class D:
            def __init__(self,x):
                self.x = x
            def __matmul__(self, other):
                return self.x * other.x
        a = D(2)
        b = D(3)
        a @= b
        self.assertEqual(a, 6)
        self.assertEqual(type(a), int)
        self.assertRaises(AttributeError, lambda x: x.__imatmul__, a)

    def test_rmatmul(self):
        class A:
            def __init__(self,x):
                self.x = x
        class B:
            def __init__(self, x):
                self.x = x
            def __rmatmul__(self, other):
                return self.x * other.x
        a = A(2)
        b = B(3)
        c = a @ b
        self.assertEqual(c, 6)
        def foo(x, y):
            z = x @ y
            return z
        self.assertRaises(TypeError, foo, b, a)
        self.assertRaises(AttributeError, lambda x: x.__rmatmul__, a)
        class C:
            def __init__(self,x):
                self.x = x
            def __matmul__(self,other):
                return self.x*(other.x)
            def __rmatmul__(self, other):
                return 0
        class D:
            def __init__(self, x):
                self.x = x
            def __matmul__(self, other):
                return -1
            def __rmatmul__(self, other):
                return -2
        a = C(2)
        b = D(3)
        c = a @ b
        self.assertEqual(c, 6)
        d = b @ a
        self.assertEqual(d, -1)

if __name__ == '__main__':
    unittest.main()
      
