""" Unit test for while and for loops"""
import unittest

class SimpleLoopTests(unittest.TestCase):
    def test_for_in_range(self):
        a = 0
        b = 0
        for i in range(5):
            b = i
            a +=1
        self.assertEqual(a,5)
        self.assertEqual(b, 4)
        y = 0
        for t in range(1,4):
            y += t
        self.assertEqual(y, 6)
        #test using step argument
        n = 0
        for x in range(0,10,2):
            n +=1
        self.assertEqual(n,5)
        x = [0]*10
        for i in range(10):
            x[i] += i
            x[i] += i*2
        self.assertEqual(x, [0, 3, 6, 9, 12, 15, 18, 21, 24, 27])
        def foo(x):
            for i in x:
                break
        self.assertRaises(TypeError, foo, 2)


    def test_for_in_list(self):
        z = 0
        for x in [1,2,3]:
            z += x
        self.assertEqual(z,6)
        
    def test_for_in_dict(self):
        a = []
        for k in {"OK":0}: a.append(k)
        self.assertEqual(a, ["OK"])

    def test_for_in_string(self):
        a = []
        for i in "skulpt": a.append(i)
        self.assertEqual(a, ["s","k","u","l","p","t"])

    def test_for_in_tuple(self):
        z = []
        a = (1,2,3)
        b = ('a', 'b', 'c')
        for x in a+b:
            z.append(x)
        self.assertEqual(z, [1,2,3,'a', 'b', 'c'])

    def test_while(self):
        x = 1
        t = 0
        while x <=5:
            t = t+x
            x = x+1
        self.assertEqual(x,6)
        self.assertEqual(t,15)

    def test_break(self):
        x = 1
        while x < 3:
            break
            x = x + 1
        self.assertEqual(x,1)
        def f():
            for i in 1,2,3,4,5:
                if i == 3: break
                yield i
        self.assertEqual(list(f()), [1, 2])

    def test_continue(self):
        x = 1
        n = 0
        while x < 10:
            x = x + 1
            if n == 2:
                continue
            n = n + 1
        self.assertEqual(n,2)
        def f():
            for i in 1,2,3,4,5:
                if i % 2 == 0: continue
                yield i
        self.assertEqual(list(f()), [1, 3, 5])


    def test_list_comprehension(self):
        x = [v*v for v in range(0,5)]
        self.assertEqual(x[3], 9)
        t = [[y*10+x for x in range(0,10)] for y in range(0,10)]
        self.assertEqual(t[2][3], 23)
        a = [c for c in "asdf"]
        self.assertEqual(a, ['a', 's', 'd', 'f'])

    def test_yield(self):
        def f(n):
            i = 0
            yield i
            i += 1
            j = i
            yield i
            yield j
            j *= 100
            i += j
            yield j
            yield i
            yield n + i
        a = []
        for i in f(10): # i to conflict with body
            j = 999
            a.append(i)
        self.assertEqual(a, [0, 1, 1, 100, 101, 111])

        def f(n):
            i = 0
            while i < n:
                yield i
                yield i * 10
                i += 1
        a = []
        for i in f(10):
            a.append(i)
        self.assertEqual(a, [0, 0, 1, 10, 2, 20, 3, 30, 4, 40, 5, 50, 6, 60, 7, 70, 8, 80, 9, 90])

        def f(n):
            i = 0
            while i < n:
                yield i
                i = 100
                yield i
                i += 1
        a = []
        for i in f(50):
            a.append(i)
        self.assertEqual(a, [0, 100])
        def f():
            y = 0
            while y == 0:
                y += 1
                yield y
        a = []
        for i in f():
            a.append(i)
        self.assertEqual(a, [1])
        def yrange(n):
            for i in range(n):
                yield i
        self.assertEqual([0, 1, 2, 3, 4],list(yrange(5)))
        def yrange(n):
            for i in range(n):
                yield i

        def zrange(n):
            for y in yrange(n):
                yield y
        self.assertEqual(list(zrange(5)), [0, 1, 2, 3, 4])
        def f(n):
            yield 1
            a, b = n, n + 1
            yield 2
            yield a
            yield b
        a = 9999
        b = 9999
        z = []
        for i in f(20):
            z.append(i)
        self.assertEqual(z, [1,2,20,21])
        def f():
            for i in 1,2,3,4,5:
                if i == 4: return
                yield i
        self.assertEqual([1, 2, 3], list(f()))
        def foo(value = None):
            for i in [-1,0,1,2,3,4]:
                if i < 0:
                    continue
                elif i == 0:
                    yield 0
                elif i == 1:
                    yield 1
                    yield value
                    yield 2
                else:
                    yield i
        self.assertEqual(list(foo()), [0, 1, None, 2, 2, 3, 4])
        def f():
            if 1 == 2:
                yield -1
            elif 1 == 1:
                yield 3
            else:
                yield -1
        self.assertEqual(list(f()),[3])
        class GeneratorClass:
            test = "hi"
            def __init__(self):
                pass
            def generator(self):
                for i in range(10):
                    yield i

        gen = GeneratorClass()
        a = []
        for g in gen.generator():
            a.append(g)
        self.assertEqual(a, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])


    def test_generator(self):
        a = (1 for x in range(3))
        self.assertEqual(str(a)[:17], "<generator object")
        b = []
        for i in a:
            b.append(a)
        self.assertNotEqual(b, [1,1,1])
        z = []
        for i in (1 for x in range(3)):
            z.append(i)
        self.assertEqual(z, [1,1,1])
        c = []
        for i in (i*2 for i in range(3)):
            c.append(i)
        self.assertEqual(c, [0,2,4])


if __name__ == '__main__':
    unittest.main()
            
