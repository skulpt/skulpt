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

i = 0
def foo():
    global i
    try:
        return
    finally:
        i += 1
        raise Exception("foo")


class Foo:
    def __enter__(self):
        return self
    def __exit__(self, *args):
        global i
        i += 1
        raise Exception("foo")


def foo_context():
    with Foo():
        return



class TestSuper(unittest.TestCase):
    def test_bug_1345(self):
        """defining a __str__ broke super"""
        try:
            B('foo')
        except Exception:
            self.fail("this shouldn't fail")

    def test_finally_raises(self):
        def helper(fn):
            global i
            try:
                fn()
            except Exception:
                pass
            self.assertEqual(i, 1)
            i = 0

        helper(foo)
        helper(foo_context)





if __name__ == "__main__":
    unittest.main()
