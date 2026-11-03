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
    def test_nonlocal_write_through_intermediate_cells(self):
        def outer():
            x = 1
            def middle():
                y = 2
                def inner():
                    nonlocal x
                    x += y
                inner()
            middle()
            return x
        self.assertEqual(outer(), 3)

    def test_nonlocal_generator_write_through_intermediate_cells(self):
        def outer():
            x = 1
            def middle():
                y = 2
                def inner():
                    nonlocal x
                    x += y
                    yield x
                    x += y
                return inner()
            gen = middle()
            self.assertEqual(next(gen), 3)
            self.assertEqual(x, 3)
            self.assertRaises(StopIteration, next, gen)
            return x
        self.assertEqual(outer(), 5)

    def test_nonlocal_write_before_enclosing_assignment(self):
        def outer():
            def middle():
                y = 2
                def inner():
                    nonlocal x
                    x = y
                inner()
            middle()
            return x
            x = 1
        self.assertEqual(outer(), 2)

    def test_nonlocal_delete_and_rebind_through_intermediate_cells(self):
        def outer():
            x = 1
            def middle():
                y = 2
                def delete():
                    nonlocal x
                    y
                    del x
                def bind():
                    nonlocal x
                    x = y
                return delete, bind
            delete, bind = middle()
            delete()
            with self.assertRaises(UnboundLocalError):
                x
            self.assertRaises(NameError, delete)
            bind()
            return x
        self.assertEqual(outer(), 2)

    def test_unbound_cell_shadows_outer_binding(self):
        x = 10
        y = 20
        def capture():  # Keep the outer x in the enclosing cells.
            return x
        def middle():
            y  # Give middle both a free variable and its own empty cell.
            def inner():
                return x
            inner()
            x = 1
        self.assertRaises(NameError, middle)

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


class TestImports(unittest.TestCase):
    def test_missing_import_name(self):
        import sys

        with self.assertRaises(ImportError) as caught:
            from sys import _skulpt_missing_name
        self.assertIn("_skulpt_missing_name", str(caught.exception))

        with self.assertRaises(AttributeError):
            sys._skulpt_missing_name

        with self.assertRaises(ImportError):
            from t221_sub import _skulpt_missing_name as missing

    def test_module_getattr_error(self):
        import sys

        module = type(sys)("_skulpt_import_getattr")

        def getattr_error(name):
            raise RuntimeError("module lookup failed")

        module.__getattr__ = getattr_error
        sys.modules[module.__name__] = module
        try:
            with self.assertRaises(RuntimeError):
                from _skulpt_import_getattr import missing
        finally:
            del sys.modules[module.__name__]


class TestSys(unittest.TestCase):
    def test_implementation_metadata(self):
        import sys
        from sys import implementation

        self.assertIs(implementation, sys.implementation)
        self.assertEqual(implementation.name, "skulpt")
        self.assertIsNone(implementation.cache_tag)


class TestExceptionProtocols(unittest.TestCase):
    def test_explicit_cause(self):
        for cause in (BaseException, None):
            try:
                raise RuntimeError("outer") from cause
            except RuntimeError as error:
                if cause is BaseException:
                    self.assertIsInstance(error.__cause__, cause)
                else:
                    self.assertIs(error.__cause__, cause)

    def test_cause_expression_precedes_exception_construction(self):
        events = []

        class OuterError(Exception):
            def __init__(self):
                events.append("exception")

        def cause():
            events.append("cause")
            return ValueError()

        with self.assertRaises(OuterError):
            raise OuterError from cause()
        self.assertEqual(events, ["cause", "exception"])

        def failing_cause():
            raise KeyError()

        events.clear()
        with self.assertRaises(KeyError):
            raise OuterError from failing_cause()
        self.assertEqual(events, [])

    def test_primary_exception_validated_before_cause_construction(self):
        events = []

        class CauseError(Exception):
            def __init__(self):
                events.append("constructor")
                raise RuntimeError()

        def cause():
            events.append("expression")
            return CauseError

        with self.assertRaises(TypeError):
            raise 42 from cause()
        self.assertEqual(events, ["expression"])

    def test_cause_constructor_must_return_exception(self):
        class CauseError(Exception):
            def __new__(cls):
                return None

        with self.assertRaises(TypeError):
            raise RuntimeError from CauseError


class TestClassCell(unittest.TestCase):
    """Tests for __class__ cell and super() handling - Issues #1171, #1340"""

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

    def test_class_cell_must_be_forwarded_by_prepared_namespace(self):
        class Namespace(dict):
            def __setitem__(self, key, value):
                if key != "__classcell__":
                    super().__setitem__(key, value)

        class Meta(type):
            @classmethod
            def __prepare__(meta, name, bases):
                return Namespace()

            def __new__(meta, name, bases, namespace):
                return super().__new__(meta, name, bases, dict(namespace))

        with self.assertRaises(RuntimeError):
            class C(metaclass=Meta):
                def get_class(self):
                    return __class__

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


if __name__ == "__main__":
    unittest.main()
