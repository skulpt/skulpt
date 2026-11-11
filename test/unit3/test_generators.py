# Selected CPython generator regressions. Frame introspection, pickling,
# garbage-collection finalization and exception-context inspection are unsupported.
import copy
import unittest

class GeneratorTest(unittest.TestCase):
    def test_send_non_none_to_new_gen(self):
        def f():
            yield 1
        g = f()
        with self.assertRaises(TypeError):
            g.send(0)
        self.assertEqual(next(g), 1)

    def test_name(self):
        def func():
            yield 1

        # check generator names
        gen = func()
        self.assertEqual(gen.__name__, "func")
        # @TODO nested qualname
        # self.assertEqual(gen.__qualname__,
        #                  "GeneratorTest.test_name.<locals>.func")

        # modify generator names
        gen.__name__ = "name"
        gen.__qualname__ = "qualname"
        self.assertEqual(gen.__name__, "name")
        self.assertEqual(gen.__qualname__, "qualname")

        # generator names must be a string and cannot be deleted
        self.assertRaises(TypeError, setattr, gen, '__name__', 123)
        self.assertRaises(TypeError, setattr, gen, '__qualname__', 123)
        self.assertRaises(TypeError, delattr, gen, '__name__')
        self.assertRaises(TypeError, delattr, gen, '__qualname__')

        # modify names of the function creating the generator
        func.__qualname__ = "func_qualname"
        func.__name__ = "func_name"
        gen = func()
        self.assertEqual(gen.__name__, "func_name")
        self.assertEqual(gen.__qualname__, "func_qualname")

        # unnamed generator
        gen = (x for x in range(10))
        self.assertEqual(gen.__name__,
                         "<genexpr>")


    def test_copy(self):
        def f():
            yield 1
        g = f()
        with self.assertRaises(TypeError):
            copy.copy(g)


class ExceptionTest(unittest.TestCase):
    def test_except_throw(self):
        def store_raise_exc_generator():
            try:
                # self.assertEqual(sys.exc_info()[0], None)
                yield
            except Exception as exc:
                # exception raised by gen.throw(exc)
                # self.assertEqual(sys.exc_info()[0], ValueError)
                # self.assertIsNone(exc.__context__)
                yield

                # ensure that the exception is not lost
                # self.assertEqual(sys.exc_info()[0], ValueError)
                yield

                # we should be able to raise back the ValueError
                raise

        make = store_raise_exc_generator()
        next(make)

        try:
            raise ValueError()
        except Exception as exc:
            try:
                make.throw(exc)
            except Exception:
                pass

        next(make)
        with self.assertRaises(ValueError) as cm:
            next(make)


    def test_except_throw_bad_exception(self):
        class E(Exception):
            def __new__(cls, *args, **kwargs):
                return cls

        def boring_generator():
            yield

        gen = boring_generator()

        err_msg = 'should have returned an instance of BaseException'

        with self.assertRaisesRegex(TypeError, err_msg):
            gen.throw(E)

        self.assertRaises(StopIteration, next, gen)

        def generator():
            with self.assertRaisesRegex(TypeError, err_msg):
                yield

        gen = generator()
        next(gen)
        with self.assertRaises(StopIteration):
            gen.throw(E)

    def test_throw_constructor_error_enters_frame(self):
        class Broken(Exception):
            def __new__(cls):
                raise ValueError('constructor failed')

        def gen():
            try:
                yield 1
            except ValueError:
                yield 'caught constructor error'

        g = gen()
        self.assertEqual(next(g), 1)
        self.assertEqual(g.throw(Broken), 'caught constructor error')
        g.close()

    def test_stopiteration_error(self):
        # See also PEP 479.

        def gen():
            raise StopIteration
            yield

        with self.assertRaises(RuntimeError) as e:
            next(gen())
        self.assertIn("raised StopIteration", repr(e.exception))


    def test_tutorial_stopiteration(self):
        # Raise StopIteration" stops the generator too:

        def f():
            yield 1
            raise StopIteration
            yield 2 # never reached

        g = f()
        self.assertEqual(next(g), 1)

        with self.assertRaises(RuntimeError) as e:
            next(g)
        self.assertIn("raised StopIteration", repr(e.exception))


    def test_return_tuple(self):
        def g():
            return (yield 1)

        gen = g()
        self.assertEqual(next(gen), 1)
        with self.assertRaises(StopIteration) as cm:
            gen.send((2,))
        self.assertEqual(cm.exception.value, (2,))


    def test_return_stopiteration(self):
        def g():
            return (yield 1)

        gen = g()
        self.assertEqual(next(gen), 1)
        with self.assertRaises(StopIteration) as cm:
            gen.send(StopIteration(2))
        self.assertIsInstance(cm.exception.value, StopIteration)
        self.assertEqual(cm.exception.value.value, 2)


class TestPEP479(unittest.TestCase):
    def test_stopiteration_wrapping(self):
        def f():
            raise StopIteration
        def g():
            yield f()
        with self.assertRaises(RuntimeError) as e:
            next(g())
        self.assertEqual(str(e.exception), "generator raised StopIteration")


class GeneratorProtocolTest(unittest.TestCase):
    def test_start_exhaustion_and_throw_arguments(self):
        entered = []
        def gen():
            entered.append(True)
            try:
                yield 1
            except ValueError as error:
                yield error.args
        g = gen()
        with self.assertRaises(TypeError):
            g.send(9)
        self.assertEqual(entered, [])
        self.assertEqual(next(g), 1)
        self.assertEqual(g.throw(ValueError, ("a", "b")), ("a", "b"))
        self.assertEqual(list(g), [])
        error = ValueError("closed")
        with self.assertRaises(ValueError) as caught:
            g.throw(error)
        self.assertIs(caught.exception, error)
        g = gen()
        g.close()
        self.assertEqual(list(g), [])
        self.assertEqual(entered, [True])
        with self.assertRaises(TypeError):
            gen().throw(error, "extra")

    def test_close_and_exception_state(self):
        trace = []
        def gen():
            try:
                try:
                    yield 1
                except ValueError:
                    yield 2
                    raise
            finally:
                trace.append("closed")
        g = gen()
        next(g)
        self.assertEqual(g.throw(ValueError), 2)
        with self.assertRaises(ValueError):
            next(g)
        self.assertEqual(trace, ["closed"])
        g.close()
        self.assertEqual(trace, ["closed"])

    def test_argument_binding_and_laziness(self):
        entered = []
        def gen(a, *args, required, default=3, **kwargs):
            entered.append(True)
            yield a, args, required, default, kwargs
        with self.assertRaises(TypeError):
            gen(1)
        self.assertEqual(entered, [])
        g = gen(1, 2, required=4, extra=5)
        self.assertEqual(entered, [])
        self.assertEqual(next(g), (1, (2,), 4, 3, {"extra": 5}))

    def test_delegate_throw_result_and_return(self):
        class Delegate:
            def __iter__(self):
                return self
            def __next__(self):
                return 1
            def throw(self, value):
                if str(value) == "yield":
                    return 42
                raise StopIteration(99)
        delegate = Delegate()
        def gen():
            result = yield from delegate
            yield result
        g = gen()
        self.assertIsNone(g.gi_yieldfrom)
        self.assertEqual(next(g), 1)
        self.assertIs(g.gi_yieldfrom, delegate)
        self.assertEqual(g.throw(ValueError("yield")), 42)
        self.assertEqual(g.throw(ValueError("return")), 99)
        self.assertIsNone(g.gi_yieldfrom)

    def test_throw_stopiteration_before_start_and_after_close(self):
        def gen():
            yield 1
        error = StopIteration("injected")
        g = gen()
        with self.assertRaises(RuntimeError) as caught:
            g.throw(error)
        self.assertIs(caught.exception.__cause__, error)
        with self.assertRaises(StopIteration) as caught:
            g.throw(error)
        self.assertIs(caught.exception, error)

    def test_delegated_throw_normalizes_once(self):
        states = []
        class Signal(Exception):
            def __init__(self):
                states.append((g.gi_running, child.gi_running))

        def inner():
            try:
                yield 1
            except Signal:
                yield 'caught'

        child = inner()
        def outer():
            yield from child

        g = outer()
        next(g)
        self.assertEqual(g.throw(Signal), 'caught')
        self.assertEqual(states, [(True, False)])
        g.close()

    def test_expression_temporaries_across_yields(self):
        def gen():
            yield (yield 1) + (yield 2)
            yield [10, (yield 3), (yield 4)]
        g = gen()
        self.assertEqual(next(g), 1)
        self.assertEqual(g.send(10), 2)
        self.assertEqual(g.send(20), 30)
        self.assertEqual(next(g), 3)
        self.assertEqual(g.send(11), 4)
        self.assertEqual(g.send(22), [10, 11, 22])

    def test_delegated_throw_lookup_error_preserves_frame(self):
        class Delegate:
            def __iter__(self):
                return self
            def __next__(self):
                return 'item'
            @property
            def throw(self):
                raise LookupError('throw lookup failed')

        delegate = Delegate()
        def gen():
            try:
                yield from delegate
            except LookupError:
                yield 'caught inside generator'

        g = gen()
        self.assertEqual(next(g), 'item')
        with self.assertRaises(LookupError):
            g.throw(ValueError)
        self.assertIs(g.gi_yieldfrom, delegate)
        self.assertEqual(next(g), 'item')
        g.close()

    def test_pep479_cause(self):
        error = StopIteration("unexpected")
        def gen():
            yield 1
            raise error
        g = gen()
        next(g)
        with self.assertRaises(RuntimeError) as caught:
            next(g)
        self.assertIs(caught.exception.__cause__, error)
        self.assertIs(caught.exception.__context__, error)
        self.assertTrue(caught.exception.__suppress_context__)
        self.assertEqual(list(g), [])




class CPythonCoroutineTests(unittest.TestCase):
    # CPython v3.7.9 Lib/test/test_generators.py: YieldFromTests and
    # coroutine_tests. Doctests use unittest assertions here. gi_running and
    # __name__ replace unsupported inspect state and gi_code introspection.
    def test_generator_gi_yieldfrom(self):
        def a():
            self.assertTrue(gen_b.gi_running)
            self.assertIsNone(gen_b.gi_yieldfrom)
            yield
            self.assertTrue(gen_b.gi_running)
            self.assertIsNone(gen_b.gi_yieldfrom)

        def b():
            self.assertIsNone(gen_b.gi_yieldfrom)
            yield from a()
            self.assertIsNone(gen_b.gi_yieldfrom)
            yield
            self.assertIsNone(gen_b.gi_yieldfrom)

        gen_b = b()
        self.assertFalse(gen_b.gi_running)
        self.assertIsNone(gen_b.gi_yieldfrom)

        gen_b.send(None)
        self.assertFalse(gen_b.gi_running)
        self.assertEqual(gen_b.gi_yieldfrom.__name__, 'a')

        gen_b.send(None)
        self.assertFalse(gen_b.gi_running)
        self.assertIsNone(gen_b.gi_yieldfrom)

        [] = gen_b  # Exhaust generator
        self.assertFalse(gen_b.gi_running)
        self.assertIsNone(gen_b.gi_yieldfrom)


    def test_augmented_assignment_yield(self):
        def coroutine(seq):
            count = 0
            while count < 200:
                count += yield
                seq.append(count)
        seq = []
        c = coroutine(seq)
        next(c)
        for expected in ([10], [10, 20], [10, 20, 30]):
            c.send(10)
            self.assertEqual(seq, expected)
        c.close()


    def test_assignment_target_yields(self):
        def f(d):
            d[(yield "a")] = d[(yield "b")] = 27
        data = [1, 2]
        g = f(data)
        self.assertEqual(g.send(None), "a")
        self.assertEqual(data, [1, 2])
        self.assertEqual(g.send(0), "b")
        self.assertEqual(data, [27, 2])
        with self.assertRaises(StopIteration):
            g.send(1)
        self.assertEqual(data, [27, 27])


    def test_throw_normalization(self):
        def f():
            while True:
                try:
                    yield
                except ValueError as v:
                    yield v
        cases = [(ValueError,), (ValueError("xyz"),),
                 (ValueError, ValueError(1)), (ValueError, TypeError(1)),
                 (ValueError, ValueError(1), None)]
        for args in cases:
            g = f()
            next(g)
            result = g.throw(*args)
            self.assertIsInstance(result, ValueError)
            if len(args) > 1:
                if isinstance(args[1], ValueError):
                    self.assertIs(result, args[1])
                else:
                    self.assertIs(result.args[0], args[1])
            g.close()


    def test_close_ignored_generatorexit(self):
        def f():
            try:
                yield
            except GeneratorExit:
                yield "foo!"
        g = f()
        next(g)
        with self.assertRaises(RuntimeError):
            g.close()
        g.close()


    def test_error_during_close(self):
        def f():
            try:
                yield
            except GeneratorExit:
                raise TypeError("fie!")
        g = f()
        next(g)
        with self.assertRaises(TypeError) as caught:
            g.close()
        self.assertEqual(str(caught.exception), "fie!")


if __name__ == "__main__":
    unittest.main()
