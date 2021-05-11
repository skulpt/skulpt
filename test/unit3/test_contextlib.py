"""Unit tests for contextlib.py, and other context managers."""

# import io
import sys
# import tempfile
# import threading
import unittest
from contextlib import *  # Tests __all__
# from test import support
# from test.support import os_helper
# import weakref

from functools import wraps
def ignore_skulpt(func):
    @wraps(func)
    def wrapper(self, *args, **kws):
        pass
    return wrapper
    


class ContextManagerTestCase(unittest.TestCase):

    def test_contextmanager_plain(self):
        state = []
        @contextmanager
        def woohoo():
            state.append(1)
            yield 42
            state.append(999)
        with woohoo() as x:
            self.assertEqual(state, [1])
            self.assertEqual(x, 42)
            state.append(x)
        self.assertEqual(state, [1, 42, 999])

    def test_contextmanager_finally(self):
        state = []
        @contextmanager
        def woohoo():
            state.append(1)
            try:
                yield 42
            finally:
                state.append(999)
        with self.assertRaises(ZeroDivisionError):
            with woohoo() as x:
                self.assertEqual(state, [1])
                self.assertEqual(x, 42)
                state.append(x)
                raise ZeroDivisionError()
        self.assertEqual(state, [1, 42, 999])

    def test_contextmanager_no_reraise(self):
        @contextmanager
        def whee():
            yield
        ctx = whee()
        ctx.__enter__()
        # Calling __exit__ should not result in an exception
        self.assertFalse(ctx.__exit__(TypeError, TypeError("foo"), None))

    def test_contextmanager_trap_yield_after_throw(self):
        @contextmanager
        def whoo():
            try:
                yield
            except:
                yield
        ctx = whoo()
        ctx.__enter__()
        self.assertRaises(
            RuntimeError, ctx.__exit__, TypeError, TypeError("foo"), None
        )

    def test_contextmanager_except(self):
        state = []
        @contextmanager
        def woohoo():
            state.append(1)
            try:
                yield 42
            except ZeroDivisionError as e:
                state.append(e.args[0])
                self.assertEqual(state, [1, 42, 999])
        with woohoo() as x:
            self.assertEqual(state, [1])
            self.assertEqual(x, 42)
            state.append(x)
            raise ZeroDivisionError(999)
        self.assertEqual(state, [1, 42, 999])

    def test_contextmanager_except_stopiter(self):
        stop_exc = StopIteration('spam')
        @contextmanager
        def woohoo():
            yield
        try:
            # with self.assertWarnsRegex(DeprecationWarning,
            #                            "StopIteration"):
                with woohoo():
                    raise stop_exc
        except Exception as ex:
            self.assertIs(ex, stop_exc)
        else:
            self.fail('StopIteration was suppressed')

    @ignore_skulpt
    def test_contextmanager_except_pep479(self):
        code = """\
from __future__ import generator_stop
from contextlib import contextmanager
@contextmanager
def woohoo():
    yield
"""
        locals = {}
        exec(code, locals, locals)
        woohoo = locals['woohoo']

        stop_exc = StopIteration('spam')
        try:
            with woohoo():
                raise stop_exc
        except Exception as ex:
            self.assertIs(ex, stop_exc)
        else:
            self.fail('StopIteration was suppressed')

    def test_contextmanager_do_not_unchain_non_stopiteration_exceptions(self):
        @contextmanager
        def test_issue29692():
            try:
                yield
            except Exception as exc:
                raise RuntimeError('issue29692:Chained') from exc
        try:
            with test_issue29692():
                raise ZeroDivisionError
        except Exception as ex:
            self.assertIs(type(ex), RuntimeError)
            self.assertEqual(ex.args[0], 'issue29692:Chained')
            # self.assertIsInstance(ex.__cause__, ZeroDivisionError)

        try:
            with test_issue29692():
                raise StopIteration('issue29692:Unchained')
        except Exception as ex:
            self.assertIs(type(ex), StopIteration)
            self.assertEqual(ex.args[0], 'issue29692:Unchained')
            # self.assertIsNone(ex.__cause__)

    def _create_contextmanager_attribs(self):
        def attribs(**kw):
            def decorate(func):
                for k,v in kw.items():
                    setattr(func,k,v)
                return func
            return decorate
        @contextmanager
        @attribs(foo='bar')
        def baz(spam):
            """Whee!"""
        return baz

    def test_contextmanager_attribs(self):
        baz = self._create_contextmanager_attribs()
        self.assertEqual(baz.__name__,'baz')
        self.assertEqual(baz.foo, 'bar')

    # @support.requires_docstrings
    def test_contextmanager_doc_attrib(self):
        baz = self._create_contextmanager_attribs()
        self.assertEqual(baz.__doc__, "Whee!")

    # @support.requires_docstrings
    def test_instance_docstring_given_cm_docstring(self):
        baz = self._create_contextmanager_attribs()(None)
        self.assertEqual(baz.__doc__, "Whee!")

    def test_keywords(self):
        # Ensure no keyword arguments are inhibited
        @contextmanager
        def woohoo(self, func, args, kwds):
            yield (self, func, args, kwds)
        with woohoo(self=11, func=22, args=33, kwds=44) as target:
            self.assertEqual(target, (11, 22, 33, 44))

    @ignore_skulpt
    def test_nokeepref(self):
        class A:
            pass

        @contextmanager
        def woohoo(a, b):
            a = weakref.ref(a)
            b = weakref.ref(b)
            self.assertIsNone(a())
            self.assertIsNone(b())
            yield

        with woohoo(A(), b=A()):
            pass

    def test_param_errors(self):
        @contextmanager
        def woohoo(a, *, b):
            yield

        with self.assertRaises(TypeError):
            woohoo()
        with self.assertRaises(TypeError):
            woohoo(3, 5)
        with self.assertRaises(TypeError):
            woohoo(b=3)

    def test_recursive(self):
        global depth
        depth = 0
        @contextmanager
        def woohoo():
            global depth
            # nonlocal depth
            before = depth
            depth += 1
            yield
            depth -= 1
            self.assertEqual(depth, before)

        @woohoo()
        def recursive():
            if depth < 10:
                recursive()

        recursive()
        self.assertEqual(depth, 0)


class TestSuppress(unittest.TestCase):

    # @support.requires_docstrings
    def test_instance_docs(self):
        # Issue 19330: ensure context manager instances have good docstrings
        cm_docstring = suppress.__doc__
        obj = suppress()
        self.assertEqual(obj.__doc__, cm_docstring)

    def test_no_result_from_enter(self):
        with suppress(ValueError) as enter_result:
            self.assertIsNone(enter_result)

    def test_no_exception(self):
        with suppress(ValueError):
            self.assertEqual(pow(2, 5), 32)

    def test_exact_exception(self):
        with suppress(TypeError):
            len(5)

    def test_exception_hierarchy(self):
        with suppress(LookupError):
            'Hello'[50]

    def test_other_exception(self):
        with self.assertRaises(ZeroDivisionError):
            with suppress(TypeError):
                1/0

    def test_no_args(self):
        with self.assertRaises(ZeroDivisionError):
            with suppress():
                1/0

    def test_multiple_exception_args(self):
        with suppress(ZeroDivisionError, TypeError):
            1/0
        with suppress(ZeroDivisionError, TypeError):
            len(5)

    def test_cm_is_reentrant(self):
        ignore_exceptions = suppress(Exception)
        with ignore_exceptions:
            pass
        with ignore_exceptions:
            len(5)
        with ignore_exceptions:
            with ignore_exceptions: # Check nested usage
                len(5)
            outer_continued = True
            1/0
        self.assertTrue(outer_continued)


class NullcontextTestCase(unittest.TestCase):
    def test_nullcontext(self):
        class C:
            pass
        c = C()
        with nullcontext(c) as c_in:
            self.assertIs(c_in, c)


class ClosingTestCase(unittest.TestCase):

    #@support.requires_docstrings
    def test_instance_docs(self):
        # Issue 19330: ensure context manager instances have good docstrings
        cm_docstring = closing.__doc__
        obj = closing(None)
        self.assertEqual(obj.__doc__, cm_docstring)

    def test_closing(self):
        state = []
        class C:
            def close(self):
                state.append(1)
        x = C()
        self.assertEqual(state, [])
        with closing(x) as y:
            self.assertEqual(x, y)
        self.assertEqual(state, [1])

    def test_closing_error(self):
        state = []
        class C:
            def close(self):
                state.append(1)
        x = C()
        self.assertEqual(state, [])
        with self.assertRaises(ZeroDivisionError):
            with closing(x) as y:
                self.assertEqual(x, y)
                1 / 0
        self.assertEqual(state, [1])


if __name__ == "__main__":
    unittest.main()
