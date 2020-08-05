""" Unit testing for builtin objects filter, map, and zip"""
import unittest
#examples for testing
def add_one(num):
    """function for testing"""
    if num != 2 and num != 6.0 and num != -151.5:
        return num + 1

lst1 = [1, 2, 3, 4, 5]
lst2 = [2, 4, 6, 8, 10]
lst3 = [-150, -151, -151.49, -151.50000, -151.500001, -152.0]
str1 = 'ABCD'
str2 = 'xy'
str3 = 'ABCDE'
str4 = 'abcde'

class Squares:
    """class for testing, creates list of squares from 0 to i - 1"""

    def __init__(self, max):
        self.max = max
        self.sofar = []

    def __len__(self): return len(self.sofar)

    def __getitem__(self, i):
        if not 0 <= i < self.max: raise IndexError
        n = len(self.sofar)
        while n <= i:
            self.sofar.append(n*n)
            n += 1
        return self.sofar[i]

class BasicIterClass:
        def __init__(self, low, high):
            self.current = low
            self.low = low
            self.high = high

        def __next__(self):
            #res = self.i
            if self.current > self.high:
                self.current = self.low
                raise StopIteration
            else:
                self.current += 1
                return self.current - 1

        def __iter__(self):
            return self

        def change_high(self, y):
            self.high = y
            self.current = self.low

class TestFailingIter:
    def __iter__(self):
        raise RuntimeError

class FilterTest(unittest.TestCase):
    def test_filter(self):
        self.assertEqual(list(filter(lambda c: 'a' <= c <= 'z', 'Hello World')), list('elloorld'))
        self.assertEqual(list(filter(None, [1, 'hello', [], [3], '', None, 9, 0])), [1, 'hello', [3], 9])
        self.assertEqual(list(filter(lambda x: x > 0, [1, -3, 9, 0, 2])), [1, 9, 2])
        self.assertEqual(list(filter(None, Squares(10))), [1, 4, 9, 16, 25, 36, 49, 64, 81])
        self.assertEqual(list(filter(lambda x: x%2, Squares(10))), [1, 9, 25, 49, 81])
        self.assertEqual(list(filter(add_one, lst1)), [1, 3, 4, 5])
        def identity(item):
            return 1
        filter(identity, Squares(5))
        self.assertRaises(TypeError, filter)
        class BadSeq(object):
            def __getitem__(self, index):
                if index<4:
                    return 42
                raise ValueError
        self.assertRaises(ValueError, list, filter(lambda x: x, BadSeq()))
        def badfunc():
            pass
        self.assertRaises(TypeError, list, filter(badfunc, range(5)))

        # test bltinmodule.c::filtertuple()
        self.assertEqual(list(filter(None, (1, 2))), [1, 2])
        self.assertEqual(list(filter(lambda x: x>=3, (1, 2, 3, 4))), [3, 4])
        self.assertRaises(TypeError, list, filter(42, (1, 2)))

        self.assertEqual(str(filter(add_one, lst1))[:7], "<filter")
        self.assertEqual(list(filter(add_one, lst2)), [4, 8, 10])
        self.assertEqual(str(filter(add_one, lst2))[:7], "<filter")
        self.assertEqual(list(filter(add_one, lst3)), [-150, -151, -151.49, -151.500001, -152])
        self.assertEqual(str(filter(add_one, lst3))[:7], "<filter")
        self.assertEqual(type(filter(add_one, lst3)), filter)

        a = BasicIterClass(0, 6)
        def foo(x):
            return x % 2 == 0
        f = filter(foo, a)
        self.assertEqual(list(f), [0, 2, 4, 6])
        a.change_high(8)
        self.assertEqual(list(f), [0, 2, 4, 6, 8])

        self.assertRaises(TypeError, filter, foo, 2)

    def test_map(self):
        self.assertEqual(
            list(map(lambda x: x*x, range(1,4))),
            [1, 4, 9])
        try:
            from math import sqrt
        except ImportError:
            def sqrt(x):
                return pow(x, 0.5)
        self.assertEqual(
            list(map(lambda x: list(map(sqrt, x)), [[16, 4], [81, 9]])),
            [[4.0, 2.0], [9.0, 3.0]])
        self.assertEqual(
            list(map(lambda x, y: x+y, [1,3,2], [9,1,4])),
            [10, 4, 6])

        def plus(*v):
            accu = 0
            for i in v: accu = accu + i
            return accu
        self.assertEqual(
            list(map(plus, [1, 3, 7])),
            [1, 3, 7])
        self.assertEqual(
            list(map(plus, [1, 3, 7], [4, 9, 2])),
            [1+4, 3+9, 7+2])
        self.assertEqual(
            list(map(plus, [1, 3, 7], [4, 9, 2], [1, 1, 0])),
            [1+4+1, 3+9+1, 7+2+0])
        self.assertEqual(
            list(map(int, Squares(10))),
            [0, 1, 4, 9, 16, 25, 36, 49, 64, 81])
        def Max(a, b):
            if a is None:
                return b
            if b is None:
                return a
            return max(a, b)
        # self.assertEqual(
        #     list(map(Max, Squares(3), Squares(2))),
        #     [0, 1]
        # )
        a = [1,2,3]
        b = map(lambda x: x**2, a)
        self.assertEqual(str(b)[:4], '<map')
        self.assertEqual(type(b), map)

        self.assertRaises(TypeError, map)
        self.assertRaises(TypeError, map, lambda x: x, 42)
        class BadSeq:
            def __iter__(self):
                raise ValueError
                yield None
        self.assertRaises(ValueError, list, map(lambda x: x, BadSeq()))
        def badfunc(x):
            raise RuntimeError
        self.assertRaises(RuntimeError, list, map(badfunc, range(5)))

        a = BasicIterClass(0, 6)
        def foo(x):
            return x**2
        m = map(foo, a)
        self.assertEqual(list(m), [0, 1, 4, 9, 16, 25, 36])
        a.change_high(8)
        self.assertEqual(list(m), [0, 1, 4, 9, 16, 25, 36, 49,  64])

        self.assertRaises(TypeError, map, foo, 1)
        self.assertRaises(TypeError, map, foo, [1], 1)

    def test_zip(self):
        self.assertEqual(list(zip(str1, str2)), [('A', 'x'), ('B', 'y')])
        self.assertEqual(str(zip(str1, str2))[1:11], "zip object")
        self.assertEqual(str(type(zip(str1, str2))), "<class 'zip'>")
        self.assertEqual(list(zip(lst1, str3, str4)), [(1, 'A', 'a'), (2, 'B', 'b'), (3, 'C', 'c'), (4, 'D', 'd'), (5, 'E', 'e')])
        self.assertEqual(str(zip(lst1, str3, str4))[1:11], "zip object")
        self.assertEqual(str(type(zip(lst1, str3, str4))), "<class 'zip'>")
        lst1b, str3b, str4b = zip(*zip(lst1, str3, str4))
        self.assertEqual(list(lst1b), lst1)
        self.assertEqual(''.join(str3b), str3)
        self.assertEqual(''.join(str4b), str4)
        a = (1, 2, 3)
        b = (4, 5, 6)
        t = [(1, 4), (2, 5), (3, 6)]
        self.assertEqual(list(zip(a, b)), t)
        b = [4, 5, 6]
        self.assertEqual(list(zip(a, b)), t)
        b = (4, 5, 6, 7)
        self.assertEqual(list(zip(a, b)), t)
        class I:
            def __getitem__(self, i):
                if i < 0 or i > 2: raise IndexError
                return i + 4
        self.assertEqual(list(zip(a, I())), t)
        self.assertEqual(list(zip()), [])
        self.assertEqual(list(zip(*[])), [])
        self.assertRaises(TypeError, zip, None)
        class G:
            pass
        self.assertRaises(TypeError, zip, a, G())
        self.assertRaises(RuntimeError, zip, a, TestFailingIter())

        # Make sure zip doesn't try to allocate a billion elements for the
        # result list when one of its arguments doesn't say how long it is.
        # A MemoryError is the most likely failure mode.
        class SequenceWithoutALength:
            def __getitem__(self, i):
                if i == 5:
                    raise IndexError
                else:
                    return i
        self.assertEqual(list(zip(SequenceWithoutALength(), range(2**10))), list(enumerate(range(5))))

        a = BasicIterClass(0,6)
        b = BasicIterClass(10, 16)
        z = zip(a, b)
        self.assertEqual(list(z), [(0, 10), (1, 11), (2, 12), (3, 13), (4, 14), (5, 15), (6, 16)])
        a.change_high(8)
        b.change_high(18)
        self.assertEqual(list(z), [(0, 10), (1, 11), (2, 12), (3, 13), (4, 14), (5, 15), (6, 16), (7, 17), (8, 18)])
        self.assertEqual(type(z), zip)

        self.assertRaises(TypeError, zip, 1)
        self.assertRaises(TypeError, zip, [1], 1)

if __name__ == '__main__':
    unittest.main()
            
