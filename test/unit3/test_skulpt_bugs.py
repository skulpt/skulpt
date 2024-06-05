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


class Meta(type):
    def __call__(cls, *args, **kws):
        return super().__call__(*args, **kws)


class I(metaclass=Meta):
    pass


class TestSuper(unittest.TestCase):
    def test_bug_1345(self):
        """defining a __str__ broke super"""
        try:
            B("foo")
        except Exception:
            self.fail("this shouldn't fail")

    def test_meta_call_override(self):
        i = I()  # should not result in an infinite loop!
        self.assertIsInstance(i, I)


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


class An:
    name: str
    __foo: int


class TestAnnotations(unittest.TestCase):
    def test_bug_1428(self):
        annotations = An.__annotations__
        self.assertEqual(annotations, {"name": str, "_An__foo": int})


class TestDict(unittest.TestCase):
    def test_override_dunder_dict(self):
        class D(dict):
            called = False

            def __getitem__(self, key):
                self.called = True
                return dict.__getitem__(self, key)

            def __setitem__(self, key, value):
                self.called = True
                return dict.__setitem__(self, key, value)

        class A:
            def __init__(self):
                self.__dict__ = D()

        a = A()

        self.assertFalse(a.__dict__.called)
        a.foo = "bar"
        self.assertFalse(a.__dict__.called)
        self.assertEqual(a.foo, "bar")
        self.assertFalse(a.__dict__.called)



class TestLineNoErrorBug(unittest.TestCase):
    def test_error_after_func_call(self):
        global err

        import time
        class Foo:
            def __init__(self):
                f"{time.time()} {self.bar}"
        
        with self.assertRaises(AttributeError) as e:
            Foo()
        
        err = e.exception
        # hack because traceback is not exposed in python yet
        lineno = jseval("Sk.globals['err'].traceback[0].lineno")
        self.assertNotEqual(lineno, 1)


if __name__ == "__main__":
    unittest.main()
