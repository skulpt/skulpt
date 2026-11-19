# Selected CPython contextlib tests. Async managers and some contextlib
# classes are outside this implementation.
"""Unit tests for contextlib.py, and other context managers."""

import unittest
from contextlib import *  # Tests __all__


class ContextManagerTestCase(unittest.TestCase):

    def test_contextmanager_traceback(self):
        # CPython Lib/test/test_contextlib.py. Inspect native frames directly
        # because the traceback formatter is supplied by a separate PR.
        @contextmanager
        def f():
            yield

        class RuntimeErrorSubclass(RuntimeError):
            pass

        class StopIterationSubclass(StopIteration):
            pass

        for error in (ZeroDivisionError(), RuntimeErrorSubclass(42),
                      StopIteration('spam'), StopIterationSubclass('spam')):
            try:
                with f():
                    raise error
            except type(error) as caught:
                self.assertIs(caught, error)
                tb = caught.__traceback__
                self.assertIs(tb.tb_frame.f_code, self.test_contextmanager_traceback.__code__)
                self.assertIsNone(tb.tb_next)
            else:
                self.fail(f'{error} was suppressed')

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

    def test_contextmanager_trap_no_yield(self):
        @contextmanager
        def whoo():
            if False:
                yield
        ctx = whoo()
        with self.assertRaises(RuntimeError):
            ctx.__enter__()

    def test_contextmanager_non_normalised(self):
        @contextmanager
        def whoo():
            try:
                yield
            except RuntimeError:
                raise SyntaxError

        ctx = whoo()
        ctx.__enter__()
        with self.assertRaises(SyntaxError):
            ctx.__exit__(RuntimeError, None, None)

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
            self.assertIsInstance(ex.__cause__, ZeroDivisionError)

        try:
            with test_issue29692():
                raise StopIteration('issue29692:Unchained')
        except Exception as ex:
            self.assertIs(type(ex), StopIteration)
            self.assertEqual(ex.args[0], 'issue29692:Unchained')
            self.assertIsNone(ex.__cause__)

    def test_contextmanager_wrap_runtimeerror(self):
        @contextmanager
        def woohoo():
            try:
                yield
            except Exception as exc:
                raise RuntimeError('caught {}'.format(exc)) from exc

        with self.assertRaises(RuntimeError):
            with woohoo():
                1 / 0

        with self.assertRaises(StopIteration):
            with woohoo():
                raise StopIteration

    # Newer CPython closes immediately here; 3.7 waited for finalization.
    def test_contextmanager_trap_second_yield_closes(self):
        state = []

        @contextmanager
        def woohoo():
            try:
                yield
                yield
            finally:
                state.append('cleanup')

        ctx = woohoo()
        ctx.__enter__()
        with self.assertRaises(RuntimeError):
            ctx.__exit__(None, None, None)
        self.assertEqual(state, ['cleanup'])

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



# CPython Lib/test/test_contextlib.py, TestBaseExitStack and TestExitStack.
# Run the synchronous cases through the public API.
class TestExitStack(unittest.TestCase):
    @property
    def exit_stack(self):
        return ExitStack

    def test_no_resources(self):
        with self.exit_stack():
            pass

    def test_callback(self):
        expected = [
            ((), {}),
            ((1,), {}),
            ((1,2), {}),
            ((), dict(example=1)),
            ((1,), dict(example=1)),
            ((1,2), dict(example=1)),
            ((1,2), dict(self=3, callback=4)),
        ]
        result = []
        def _exit(*args, **kwds):
            """Test metadata propagation"""
            result.append((args, kwds))
        with self.exit_stack() as stack:
            for args, kwds in reversed(expected):
                if args and kwds:
                    f = stack.callback(_exit, *args, **kwds)
                elif args:
                    f = stack.callback(_exit, *args)
                elif kwds:
                    f = stack.callback(_exit, **kwds)
                else:
                    f = stack.callback(_exit)
                self.assertIs(f, _exit)
        self.assertEqual(result, expected)

        result = []
        with self.exit_stack() as stack:
            with self.assertRaises(TypeError):
                stack.callback(arg=1)
            with self.assertRaises(TypeError):
                self.exit_stack.callback(arg=2)
            with self.assertRaises(TypeError):
                stack.callback(callback=_exit, arg=3)
        self.assertEqual(result, [])

    def test_push(self):
        exc_raised = ZeroDivisionError
        def _expect_exc(exc_type, exc, exc_tb):
            self.assertIs(exc_type, exc_raised)
        def _suppress_exc(*exc_details):
            return True
        def _expect_ok(exc_type, exc, exc_tb):
            self.assertIsNone(exc_type)
            self.assertIsNone(exc)
            self.assertIsNone(exc_tb)
        class ExitCM(object):
            def __init__(self, check_exc):
                self.check_exc = check_exc
            def __enter__(self):
                self.fail("Should not be called!")
            def __exit__(self, *exc_details):
                self.check_exc(*exc_details)
        with self.exit_stack() as stack:
            stack.push(_expect_ok)
            cm = ExitCM(_expect_ok)
            stack.push(cm)
            stack.push(_suppress_exc)
            cm = ExitCM(_expect_exc)
            stack.push(cm)
            stack.push(_expect_exc)
            stack.push(_expect_exc)
            1/0

    def test_enter_context(self):
        class TestCM(object):
            def __enter__(self):
                result.append(1)
            def __exit__(self, *exc_details):
                result.append(3)

        result = []
        cm = TestCM()
        with self.exit_stack() as stack:
            @stack.callback  # Registered first => cleaned up last
            def _exit():
                result.append(4)
            self.assertIsNotNone(_exit)
            stack.enter_context(cm)
            result.append(2)
        self.assertEqual(result, [1, 2, 3, 4])

    def test_enter_context_errors(self):
        class LacksEnterAndExit:
            pass
        class LacksEnter:
            def __exit__(self, *exc_info):
                pass
        class LacksExit:
            def __enter__(self):
                pass

        with self.exit_stack() as stack:
            with self.assertRaisesRegex(TypeError, 'the context manager'):
                stack.enter_context(LacksEnterAndExit())
            with self.assertRaisesRegex(TypeError, 'the context manager'):
                stack.enter_context(LacksEnter())
            with self.assertRaisesRegex(TypeError, 'the context manager'):
                stack.enter_context(LacksExit())

    def test_close(self):
        result = []
        with self.exit_stack() as stack:
            @stack.callback
            def _exit():
                result.append(1)
            self.assertIsNotNone(_exit)
            stack.close()
            result.append(2)
        self.assertEqual(result, [1, 2])

    def test_pop_all(self):
        result = []
        with self.exit_stack() as stack:
            @stack.callback
            def _exit():
                result.append(3)
            self.assertIsNotNone(_exit)
            new_stack = stack.pop_all()
            result.append(1)
        result.append(2)
        new_stack.close()
        self.assertEqual(result, [1, 2, 3])

    def test_exit_raise(self):
        with self.assertRaises(ZeroDivisionError):
            with self.exit_stack() as stack:
                stack.push(lambda *exc: False)
                1/0

    def test_exit_suppress(self):
        with self.exit_stack() as stack:
            stack.push(lambda *exc: True)
            1/0

    @unittest.skip("Skulpt lacks implicit exception chaining")
    def test_exit_exception_chaining(self):
        # Ensure exception chaining matches the reference behaviour
        def raise_exc(exc):
            raise exc

        saved_details = None
        def suppress_exc(*exc_details):
            nonlocal saved_details
            saved_details = exc_details
            return True

        try:
            with self.exit_stack() as stack:
                stack.callback(raise_exc, IndexError)
                stack.callback(raise_exc, KeyError)
                stack.callback(raise_exc, AttributeError)
                stack.push(suppress_exc)
                stack.callback(raise_exc, ValueError)
                1 / 0
        except IndexError as exc:
            self.assertIsInstance(exc.__context__, KeyError)
            self.assertIsInstance(exc.__context__.__context__, AttributeError)
            # Inner exceptions were suppressed
            self.assertIsNone(exc.__context__.__context__.__context__)
        else:
            self.fail("Expected IndexError, but no exception was raised")
        # Check the inner exceptions
        inner_exc = saved_details[1]
        self.assertIsInstance(inner_exc, ValueError)
        self.assertIsInstance(inner_exc.__context__, ZeroDivisionError)

    def test_exit_exception_non_suppressing(self):
        # http://bugs.python.org/issue19092
        def raise_exc(exc):
            raise exc

        def suppress_exc(*exc_details):
            return True

        try:
            with self.exit_stack() as stack:
                stack.callback(lambda: None)
                stack.callback(raise_exc, IndexError)
        except Exception as exc:
            self.assertIsInstance(exc, IndexError)
        else:
            self.fail("Expected IndexError, but no exception was raised")

        try:
            with self.exit_stack() as stack:
                stack.callback(raise_exc, KeyError)
                stack.push(suppress_exc)
                stack.callback(raise_exc, IndexError)
        except Exception as exc:
            self.assertIsInstance(exc, KeyError)
        else:
            self.fail("Expected KeyError, but no exception was raised")

    def test_exit_exception_chaining_suppress(self):
        with self.exit_stack() as stack:
            stack.push(lambda *exc: True)
            stack.push(lambda *exc: 1/0)
            stack.push(lambda *exc: {}[1])

    def test_excessive_nesting(self):
        # The original implementation would die with RecursionError here
        with self.exit_stack() as stack:
            for i in range(10000):
                stack.callback(int)

    def test_instance_bypass(self):
        # Observe the registered exit through close() instead of inspecting
        # the private callback stack.
        calls = []

        class Example(object):
            def __call__(self, *exc_details):
                calls.append(exc_details)

        cm = Example()
        cm.__enter__ = object()
        cm.__exit__ = object()
        stack = self.exit_stack()
        with self.assertRaisesRegex(TypeError, 'the context manager'):
            stack.enter_context(cm)
        stack.push(cm)
        stack.close()
        self.assertEqual(calls, [(None, None, None)])


class TestSkulptExitStack(unittest.TestCase):
    def test_suspended_exit_can_replace_exception(self):
        import time

        original = ValueError("body")
        replacement = RuntimeError("exit")
        observed = []

        def fail(exc_type, exc, traceback):
            time.sleep(0.001)
            observed.append(exc)
            raise replacement

        def suppress_replacement(exc_type, exc, traceback):
            observed.append(exc)
            return True

        with ExitStack() as stack:
            stack.push(suppress_replacement)
            stack.push(fail)
            raise original

        self.assertEqual(observed, [original, replacement])


class ContextManagerProtocolTests(unittest.TestCase):
    def test_second_yield_cleanup_failure_propagates(self):
        original = StopIteration('body failed')

        @contextmanager
        def manager():
            try:
                yield
            except StopIteration as error:
                try:
                    yield
                finally:
                    raise RuntimeError('cleanup failed') from error

        with self.assertRaises(RuntimeError) as caught:
            with manager():
                raise original
        self.assertEqual(str(caught.exception), 'cleanup failed')
        self.assertIs(caught.exception.__cause__, original)

    # CPython v3.7.9 Lib/test/test_contextlib.py, issue #11647.
    def test_contextmanager_as_decorator(self):
        @contextmanager
        def woohoo(y):
            state.append(y)
            yield
            state.append(999)

        state = []
        @woohoo(1)
        def test(x):
            self.assertEqual(state, [1])
            state.append(x)
        test('something')
        self.assertEqual(state, [1, 'something', 999])

        # Issue #11647: Ensure the decorated function is 'reusable'
        state = []
        test('something else')
        self.assertEqual(state, [1, 'something else', 999])

    def test_decorator_returns_and_metadata(self):
        @contextmanager
        def manager():
            yield
        @manager()
        def answer(value=42):
            """Wrapped documentation."""
            return value
        self.assertEqual(answer(), 42)
        self.assertEqual(answer(value=7), 7)
        self.assertEqual(answer.__name__, "answer")
        self.assertEqual(answer.__doc__, "Wrapped documentation.")

    def test_failed_entry_preserves_error(self):
        error = ValueError("entry")
        @contextmanager
        def manager():
            raise error
            yield
        @manager()
        def answer():
            self.fail("body must not run")
        with self.assertRaises(ValueError) as caught:
            answer()
        self.assertIs(caught.exception, error)

    def test_decorated_exception_suppression_and_exit_failure(self):
        @contextmanager
        def suppress_value_error():
            try:
                yield
            except ValueError:
                pass
        @suppress_value_error()
        def fail():
            raise ValueError
        self.assertIsNone(fail())
        error = RuntimeError("exit")
        @contextmanager
        def bad_exit():
            yield
            raise error
        @bad_exit()
        def answer():
            return 42
        with self.assertRaises(RuntimeError) as caught:
            answer()
        self.assertIs(caught.exception, error)

    def test_closing_keyword_argument(self):
        events = []
        class Resource:
            def close(self):
                events.append("closed")
        resource = Resource()
        with closing(thing=resource) as entered:
            self.assertIs(entered, resource)
        self.assertEqual(events, ["closed"])


if __name__ == "__main__":
    unittest.main()
