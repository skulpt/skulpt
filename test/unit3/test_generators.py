# Selected CPython generator regressions. Frame introspection, pickling,
# garbage-collection finalization and exception-context inspection are unsupported.
import copy
import unittest

class GeneratorTest(unittest.TestCase):
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


    def test_except_next(self):
        def gen():
            # self.assertEqual(sys.exc_info()[0], ValueError)
            yield "done"

        g = gen()
        try:
            raise ValueError
        except Exception:
            self.assertEqual(next(g), "done")


    def test_except_gen_except(self):
        def gen():
            try:
                # self.assertEqual(sys.exc_info()[0], None)
                yield
                # we are called from "except ValueError:", TypeError must
                # inherit ValueError in its context
                raise TypeError()
            except TypeError as exc: pass
                # self.assertEqual(sys.exc_info()[0], TypeError)
                # self.assertEqual(type(exc.__context__), ValueError)
            # here we are still called from the "except ValueError:"
            # self.assertEqual(sys.exc_info()[0], ValueError)
            yield
            # self.assertIsNone(sys.exc_info()[0])
            yield "done"

        g = gen()
        next(g)
        try:
            raise ValueError
        except Exception:
            next(g)

        self.assertEqual(next(g), "done")


    def test_except_throw_exception_context(self):
        def gen():
            try:
                try:
                    # self.assertEqual(sys.exc_info()[0], None)
                    yield
                except ValueError:
                    # we are called from "except ValueError:"
                    # self.assertEqual(sys.exc_info()[0], ValueError)
                    raise TypeError()
            except Exception as exc: pass
                # self.assertEqual(sys.exc_info()[0], TypeError)
                # self.assertEqual(type(exc.__context__), ValueError)
            # we are still called from "except ValueError:"
            # self.assertEqual(sys.exc_info()[0], ValueError)
            yield
            # self.assertIsNone(sys.exc_info()[0])
            yield "done"

        g = gen()
        next(g)
        try:
            raise ValueError
        except Exception as exc:
            g.throw(exc)

        self.assertEqual(next(g), "done")


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


    def test_stopiteration_wrapping_context(self):
        def f():
            raise StopIteration
        def g():
            yield f()

        try:
            next(g())
        except RuntimeError as exc:
            # self.assertIs(type(exc.__cause__), StopIteration)
            # self.assertIs(type(exc.__context__), StopIteration)
            # self.assertTrue(exc.__suppress_context__)
            pass
        else:
            self.fail('__cause__, __context__, or __suppress_context__ '
                      'were not properly set')


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
        self.assertEqual(list(g), [])


if __name__ == "__main__":
    unittest.main()
