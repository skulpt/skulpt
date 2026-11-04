# Selected CPython generator frame and argument-binding regressions.
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



class GeneratorProtocolTest(unittest.TestCase):
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



class CPythonCoroutineTests(unittest.TestCase):
    # CPython generator/coroutine cases; doctests use unittest assertions.
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



if __name__ == "__main__":
    unittest.main()
