"""Unit tests for zero-argument super() & related machinery."""

import unittest


class A:
    def __init__(self, foo):
        self.foo = foo
    def __str__(self):

        return f"{self.__class__.__name__}({self.foo})"

class B(A):
    def __init__(self, foo):
        super().__init__(foo)


class TestSuper(unittest.TestCase):
    def test_bug_1345(self):
        """defining a __str__ broke super"""
        try:
            B('foo')
        except Exception:
            self.fail("this shouldn't fail")

class TestRegressions(unittest.TestCase):
    def test_bug_1470(self):
        global i
        i = 0

        def g():
            global i
            i += 1
        
        def f(x):
            pass

        f(x=g())

        self.assertEqual(i, 1)



if __name__ == "__main__":
    unittest.main()
