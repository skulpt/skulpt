import unittest
from contextlib import closing, contextmanager
from time import sleep

def sleeping_gen(x):
    for i in x:
        sleep(.01)
        yield i

def sleeping_f(x):
    sleep(.01)
    return x

class SleepingEmptyIter:
    def __iter__(self):
      return self
    def __next__(self):
      sleep(.01)
      raise StopIteration

class SleepingClass:
    def __bytes__ (self):
        sleep(.01)
        return b'abc'
    def __contains__(self, key):
        sleep(.01)
        return bool(key)

class SleepingDunderFail:
    # __iter__ can't suspend (__next__ can)
    def __iter__(self):
        sleep(0.01)
        return iter([0, 1, 2])

class SleepingObjectGetatttr:
    @property
    def _foo(self):
        sleep(.01)
        return "foo"

    @property
    def foo(self):
        return object.__getattribute__(self, "_foo")

class Test_Suspensions(unittest.TestCase):
    def test_expression_temporaries_survive_suspending_finally(self):
        cleanup = []

        def calculate():
            try:
                return sleeping_f(3) + sleeping_f(4) * sleeping_f(5)
            finally:
                cleanup.append(sleeping_f(6) + sleeping_f(7))

        self.assertEqual(calculate(), 23)
        self.assertEqual(cleanup, [13])

    def test_dictionary_temporaries_survive_suspensions(self):
        values = {
            sleeping_f(1): sleeping_f(2) + sleeping_f(3),
            sleeping_f(4): sleeping_f(5) * sleeping_f(6),
            sleeping_f(7): {sleeping_f(8): sleeping_f(9)},
        }
        self.assertEqual(values, {1: 5, 4: 30, 7: {8: 9}})

    def test_min_max(self):
        x = [4, 1, 5]
        self.assertEqual(min(sleeping_gen(x)), 1)
        self.assertEqual(min(sleeping_gen(x), key=sleeping_f), 1)
        self.assertRaises(ValueError, min, SleepingEmptyIter())
        with self.assertRaises(ValueError):
            min(SleepingEmptyIter(), key=sleeping_f)

        self.assertEqual(max(sleeping_gen(x)), 5)
        self.assertEqual(max(sleeping_gen(x), key=sleeping_f), 5)
        self.assertRaises(ValueError, max, SleepingEmptyIter())
        with self.assertRaises(ValueError):
            max(SleepingEmptyIter(), key=sleeping_f)
    def test_any(self):
        self.assertEqual(any(sleeping_gen([0, 5, 0])), True)
        self.assertEqual(any(sleeping_gen([0, 0, 0])), False)
        self.assertEqual(all(sleeping_gen([4, 1, 5])), True)
        self.assertEqual(all(sleeping_gen([4, 0, 5])), False)
    def test_sum(self):
        self.assertEqual(sum(sleeping_gen([1, 2, 3])), 6)
        self.assertEqual(sum(sleeping_gen([1, 2.0, 3])), 6.0)
        self.assertEqual(sum(sleeping_gen([[1], [2]]), []), [1, 2])

    def test_builtin_types(self):
        self.assertEqual(list(sleeping_gen([1, 2, 3])), [1, 2, 3])
        self.assertEqual(tuple(sleeping_gen([1, 2, 3])), (1, 2, 3))

    def test_bytes(self):
        self.assertEqual(bytes(sleeping_gen([1,2,3])), bytes([1,2,3]))
        self.assertEqual(bytes(SleepingClass()), b'abc')

    def test_starred_assignment(self):
        x = [1,2,3]
        a, b, c = sleeping_gen(x)
        self.assertEqual([a, b, c], x)
        a, b, *c = sleeping_gen(x)
        self.assertEqual((a, b, c), (1, 2, [3]))
        *a, = sleeping_gen(x)
        self.assertEqual(a, x)

    def test_dunders(self):
        x = SleepingClass()
        # __contains__
        self.assertFalse(0 in x)
        self.assertTrue(1 in x)
    
    def test_suspension_error(self):
        x = SleepingDunderFail()
        with self.assertRaises(Exception) as e:
            for i in x:
                pass
        self.assertIn("Cannot call a function that blocks or suspends", str(e.exception))
        self.assertTrue(repr(e.exception).startswith("SuspensionError"))
    
    def test_suspension_bug_getattribute(self):
        obj = SleepingObjectGetatttr()
        self.assertEqual(obj.foo, "foo")
        self.assertEqual(SleepingObjectGetatttr._foo.__get__(obj, None), "foo")



class ContextlibSuspensionTests(unittest.TestCase):
    # sleep(0) forces a real host suspension in Skulpt. CPython-derived
    # contextlib tests are kept separately in test_contextlib.py.
    def test_decorator_entry_body_and_exit(self):
        events = []
        @contextmanager
        def manager():
            sleep(0)
            events.append("enter")
            yield
            sleep(0)
            events.append("exit")
        @manager()
        def answer():
            sleep(0)
            events.append("body")
            return 42
        self.assertEqual(answer(), 42)
        with manager():
            sleep(0)
            events.append("body")
        self.assertEqual(events, ["enter", "body", "exit"] * 2)

    def test_failed_entry_preserves_error(self):
        error = ValueError("entry")
        @contextmanager
        def manager():
            sleep(0)
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
                sleep(0)
        @suppress_value_error()
        def fail():
            sleep(0)
            raise ValueError
        self.assertIsNone(fail())

        error = RuntimeError("exit")
        @contextmanager
        def bad_exit():
            yield
            sleep(0)
            raise error
        @bad_exit()
        def answer():
            return 42
        with self.assertRaises(RuntimeError) as caught:
            answer()
        self.assertIs(caught.exception, error)

    def test_closing_lookup_and_call(self):
        events = []
        class Resource:
            @property
            def close(self):
                sleep(0)
                events.append("lookup")
                return self.finish
            def finish(self):
                sleep(0)
                events.append("closed")
        with closing(Resource()):
            pass
        self.assertEqual(events, ["lookup", "closed"])

    def test_exception_constructor(self):
        class ExitError(Exception):
            def __init__(self):
                sleep(0)

        @contextmanager
        def manager():
            try:
                yield
            except ExitError:
                pass

        ctx = manager()
        ctx.__enter__()
        self.assertTrue(ctx.__exit__(ExitError, None, None))

    def test_generator_factory(self):
        calls = []
        def raw_manager():
            yield 42
        def factory():
            sleep(0)
            calls.append("factory")
            return raw_manager()

        wrapped = contextmanager(factory)
        with wrapped() as value:
            self.assertEqual(value, 42)
        @wrapped()
        def answer():
            return 99
        self.assertEqual(answer(), 99)
        self.assertEqual(calls, ["factory"] * 3)


if __name__ == '__main__':
    unittest.main()
