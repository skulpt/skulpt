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
    def test_function_preserves_shadowed_closure_cell(self):
        def outer():
            x = 1
            y = 2

            def capture():  # Keep outer x in the closure passed to inner.
                return x

            def inner():
                x = 3
                y  # Give inner a free variable as well as its own cell.

                def get():
                    return x

                return x, get()

            return inner()

        self.assertEqual(outer(), (3, 3))

    def test_function_observes_rebound_outer_cell(self):
        def outer():
            x = 1

            def middle():
                def get():
                    return x
                return get

            get = middle()
            before = get()
            x = 2
            return before, get()

        self.assertEqual(outer(), (1, 2))

    def test_class_preserves_shadowed_closure_cell(self):
        def outer():
            x = 1
            y = 2

            def capture():  # Keep outer x in the closure passed to inner.
                return x

            def inner():
                def get():
                    return x

                x = 3
                y  # Give inner a free variable as well as its own cell.
                class C:
                    pass
                return get()

            return inner()

        self.assertEqual(outer(), 3)

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
    def test_annotated_variables_remain_local(self):
        def first():
            rows: list = []
            second()
            return rows

        def second():
            rows: list = []
            rows.append(7)

        self.assertEqual(first(), [])

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


class Wrapper:
    def __init__(self, fn):
        self.fn = fn

    def __get__(self, obj, ob_type=None):
        assert isinstance(ob_type, object)
        return self.fn.__get__(obj, ob_type)


class TestBugs(unittest.TestCase):
    def test_class_method_bug(self):
        class A:
            @classmethod
            @Wrapper
            def foo(cls):
                return 42

        self.assertEqual(A.foo(), 42)
        # shouldn't fail

    def test_with_statement(self):
        class W:
            def __enter__(self):
                return "a", "b"
            def __exit__(self, exc_type, exc_val, exc_tb):
                pass

        with W() as (x, y):
            self.assertEqual(x, "a")
            self.assertEqual(y, "b")

    def test_object_ne_on_tuple_subclass_uses_object_slot(self):
        class C(tuple):
            __ne__ = object.__ne__

            def __eq__(self, other):
                return False

        a = C()
        self.assertFalse(a == a)
        self.assertTrue(a != a)


class TestExceptionProtocols(unittest.TestCase):
    def test_explicit_cause(self):
        for cause in (BaseException, ValueError, ValueError("cause"), None):
            try:
                raise RuntimeError("outer") from cause
            except RuntimeError as error:
                if cause in (BaseException, ValueError):
                    self.assertIsInstance(error.__cause__, cause)
                else:
                    self.assertIs(error.__cause__, cause)
        with self.assertRaises(TypeError):
            raise RuntimeError from 42

    def test_missing_context_methods(self):
        entered = []
        class EnterOnly:
            def __enter__(self):
                entered.append(True)
        class ExitOnly:
            def __exit__(self, *args):
                pass
        for manager in (EnterOnly(), ExitOnly()):
            with self.assertRaises(AttributeError):
                with manager:
                    self.fail("body must not run")
        self.assertEqual(entered, [])

    def test_exception_values(self):
        self.assertIsNone(StopIteration().value)
        self.assertIsNone(StopIteration(None).value)
        self.assertEqual(StopIteration(42).value, 42)
        self.assertTrue(issubclass(GeneratorExit, BaseException))
        self.assertFalse(issubclass(GeneratorExit, Exception))


class TestClassCell(unittest.TestCase):
    """Tests for __class__ cell and super() handling - Issues #1171, #1340"""

    def test_class_cell_available_after_type_new(self):
        seen = []
        class Meta(type):
            def __new__(meta, name, bases, namespace):
                result = super().__new__(meta, name, bases, namespace)
                seen.append(result.get_class())
                return result
        class C(metaclass=Meta):
            @staticmethod
            def get_class():
                return __class__
        self.assertEqual(seen, [C])

    def test_class_cell_available_in_creation_hooks(self):
        seen = []
        class Descriptor:
            def __set_name__(self, owner, name):
                seen.append(owner.get_class())
        class Base:
            def __init_subclass__(cls):
                seen.append(cls.get_class())
        class C(Base):
            descriptor = Descriptor()
            @staticmethod
            def get_class():
                return __class__
        self.assertEqual(seen, [C, C])
        self.assertNotIn("__classcell__", C.__dict__)

    def test_class_cell_must_be_forwarded_by_metaclass(self):
        class Meta(type):
            def __new__(meta, name, bases, namespace):
                namespace.pop("__classcell__")
                return super().__new__(meta, name, bases, namespace)
        with self.assertRaises(RuntimeError):
            class C(metaclass=Meta):
                def get_class(self):
                    return __class__

    def test_invalid_class_cell_rejected(self):
        with self.assertRaises(TypeError):
            type("C", (), {"__classcell__": 42})

    def test_class_cell_and_nonlocal_share_outer_binding(self):
        def outer():
            count = 0
            class C:
                def increment(self):
                    nonlocal count
                    count += 1
                    return __class__
            self.assertIs(C().increment(), C)
            return count
        self.assertEqual(outer(), 1)

    def test_issue_1171_super_in_nested_class_in_function(self):
        """super() in __init_subclass__ of class defined inside a function"""
        def bar():
            class A:
                def __init_subclass__(cls):
                    super().__init_subclass__()

            class B(A):
                pass
            return A, B

        A, B = bar()
        self.assertEqual(A.__name__, 'A')
        self.assertEqual(B.__name__, 'B')

    def test_super_with_closure_in_method(self):
        """super() in method that also has a closure (Issue #4360 in CPython)"""
        class A:
            def f(self):
                return 'A'

        class E(A):
            def f(self):
                def nested():
                    self  # creates closure
                return super().f() + 'E'

        self.assertEqual(E().f(), 'AE')

    def test___class___in_instancemethod(self):
        """__class__ should be available in instance methods"""
        class X:
            def f(self):
                return __class__

        self.assertIs(X().f(), X)

    def test___class___in_classmethod(self):
        """__class__ should be available in classmethods"""
        class Y:
            @classmethod
            def f(cls):
                return __class__

        self.assertIs(Y.f(), Y)

    def test___class___in_staticmethod(self):
        """__class__ should be available in staticmethods"""
        class Z:
            @staticmethod
            def f():
                return __class__

        self.assertIs(Z.f(), Z)

    def test_super_in_nested_classes(self):
        """super() works correctly in nested class hierarchies"""
        class Outer:
            class Inner:
                def greet(self):
                    return "Inner"

            class InnerChild(Inner):
                def greet(self):
                    return super().greet() + "Child"

        self.assertEqual(Outer.InnerChild().greet(), "InnerChild")

    def test_multiple_levels_of_super(self):
        """super() works through multiple inheritance levels"""
        class A:
            def f(self):
                return 'A'

        class B(A):
            def f(self):
                return super().f() + 'B'

        class C(B):
            def f(self):
                return super().f() + 'C'

        class D(C):
            def f(self):
                return super().f() + 'D'

        self.assertEqual(D().f(), 'ABCD')

    def test_super_in_init_subclass_chain(self):
        """super().__init_subclass__() works through inheritance chain"""
        calls = []

        class Base:
            def __init_subclass__(cls, **kwargs):
                super().__init_subclass__(**kwargs)
                calls.append(cls.__name__)

        class Middle(Base):
            pass

        class Leaf(Middle):
            pass

        self.assertEqual(calls, ['Middle', 'Leaf'])


class TestGeneratorCells(unittest.TestCase):
    def test_cells_and_super_across_yields(self):
        class Base:
            def value(self):
                return 10
        class Child(Base):
            def values(self):
                count = 1
                def update():
                    nonlocal count
                    count += 1
                yield __class__, super().value(), count
                update()
                yield __class__, super().value(), count
        self.assertEqual(list(Child().values()), [(Child, 10, 1), (Child, 10, 2)])

    def test_unbound_cell_reservation(self):
        value = 100
        def gen():
            def inner():
                return value
            yield inner
            value = 2
            yield inner
        g = gen()
        inner = next(g)
        with self.assertRaises(NameError):
            inner()
        self.assertIs(next(g), inner)
        self.assertEqual(inner(), 2)

    def test_nonlocal_owner_across_generator_frames(self):
        value = 1
        def middle():
            local = 5
            def gen():
                nonlocal value
                yield local, value
                value = 2
                yield local, value
                del value
            return gen()
        g = middle()
        self.assertEqual(next(g), (5, 1))
        self.assertEqual(next(g), (5, 2))
        self.assertEqual(value, 2)
        self.assertEqual(list(g), [])
        with self.assertRaises(UnboundLocalError):
            value


if __name__ == "__main__":
    unittest.main()
