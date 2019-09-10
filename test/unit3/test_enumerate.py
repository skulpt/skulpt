import unittest
import operator
import sys

class G:
    'Sequence using __getitem__'
    def __init__(self, seqn):
        self.seqn = seqn
    def __getitem__(self, i):
        return self.seqn[i]

class I:
    'Sequence using iterator protocol'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __iter__(self):
        return self
    def __next__(self):
        if self.i >= len(self.seqn): raise StopIteration
        v = self.seqn[self.i]
        self.i += 1
        return v

class Ig:
    'Sequence using iterator protocol defined with a generator'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __iter__(self):
        for val in self.seqn:
            yield val

class X:
    'Missing __getitem__ and __iter__'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __next__(self):
        if self.i >= len(self.seqn): raise StopIteration
        v = self.seqn[self.i]
        self.i += 1
        return v

class E:
    'Test propagation of exceptions'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __iter__(self):
        return self
    def __next__(self):
        3 // 0

class N:
    'Iterator missing __next__()'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __iter__(self):
        return self

class EnumerateTestCase(unittest.TestCase):

    enum = enumerate
    seq, res = 'abc', [(0,'a'), (1,'b'), (2,'c')]

    def test_basicfunction(self):
        self.assertEqual(type(self.enum(self.seq)), self.enum)
        e = self.enum(self.seq)
        self.assertEqual(iter(e), e)
        self.assertEqual(list(self.enum(self.seq)), self.res)
        # self.enum.__doc__
        a = []
        for x in enumerate([14, 8, 2, "abc", -7], 2):
            a.append(x)
        self.assertEqual(a, [(2, 14), (3, 8), (4, 2), (5, 'abc'), (6, -7)])
        def enumerate_helper(iterable,start=0):
            x = []
            for i in enumerate(iterable,start):
                x.append(i)
            return x
        # list
        self.assertEqual(enumerate_helper([1,2,3,4]), [(0, 1), (1, 2), (2, 3), (3, 4)])
        self.assertEqual(enumerate_helper([1,2,3,4],10), [(10, 1), (11, 2), (12, 3), (13, 4)])

        # string
        self.assertEqual(enumerate_helper("hello"), [(0, 'h'), (1, 'e'), (2, 'l'), (3, 'l'), (4, 'o')])
        self.assertEqual(enumerate_helper("WORLD",2), [(2, 'W'), (3, 'O'), (4, 'R'), (5, 'L'), (6, 'D')])

        # tuple
        self.assertEqual(enumerate_helper((1,2,3,)), [(0, 1), (1, 2), (2, 3)])
        self.assertEqual(enumerate_helper((1,2,3,),-1), [(-1, 1), (0, 2), (1, 3)])

        # dict
        self.assertEqual(enumerate_helper({1:'a',2:'b',3:'c'}), [(0, 1), (1, 2), (2, 3)])
        self.assertEqual(enumerate_helper({1:'a',2:'b',3:'c'},5), [(5, 1), (6, 2), (7, 3)])

        # start and list
        self.assertEqual(enumerate_helper(range(1, 4), start=1), [(1, 1), (2, 2), (3, 3)])
        grocery = ['bread', 'milk', 'butter']  # issue 954
        self.assertEqual(list(enumerate(grocery, start=10)), [(10, "bread"), (11, "milk"), (12, "butter")])
    # def test_getitemseqn(self):
    #     self.assertEqual(list(self.enum(G(self.seq))), self.res)
    #     e = self.enum(G(''))
    #     self.assertRaises(StopIteration, next, e)

    # def test_iteratorseqn(self):
    #     self.assertEqual(list(self.enum(I(self.seq))), self.res)
    #     e = self.enum(I(''))
    #     self.assertRaises(StopIteration, next, e)

    # def test_iteratorgenerator(self):
    #     self.assertEqual(list(self.enum(Ig(self.seq))), self.res)
    #     e = self.enum(Ig(''))
    #     self.assertRaises(StopIteration, next, e)

    # def test_noniterable(self):
    #     self.assertRaises(TypeError, self.enum, X(self.seq))

    # def test_illformediterable(self):
    #     self.assertRaises(TypeError, self.enum, N(self.seq))

    # def test_exception_propagation(self):
    #     self.assertRaises(ZeroDivisionError, list, self.enum(E(self.seq)))

    def test_argumentcheck(self):
        # self.assertRaises(TypeError, self.enum) # no arguments
        # self.assertRaises(TypeError, self.enum, 1) # wrong type (not iterable)
        self.assertRaises(TypeError, self.enum, 'abc', 'a') # wrong type
        # self.assertRaises(TypeError, self.enum, 'abc', 2, 3) # too many arguments

    def test_tuple_reuse(self):
        # Tests an implementation detail where tuple is reused
        # whenever nothing else holds a reference to it
        self.assertEqual(len(set(map(id, list(enumerate(self.seq))))), len(self.seq))
        # self.assertEqual(len(set(map(id, enumerate(self.seq)))), min(1,len(self.seq)))

    def test_repr(self):
        self.assertEqual(str(enumerate), "<class 'enumerate'>")
        e = enumerate([4, 8, 12], -3)
        self.assertEqual(repr(e), "<enumerate object>")

class MyEnum(enumerate):
    pass

class SubclassTestCase(EnumerateTestCase):

    enum = MyEnum

class TestEmpty(EnumerateTestCase):

    seq, res = '', []

class TestBig(EnumerateTestCase):

    seq = range(10,20000,2)
    res = list(zip(range(20000), seq))

class TestReversed(unittest.TestCase):

    # def test_simple(self):
    #     class A:
    #         def __getitem__(self, i):
    #             if i < 5:
    #                 return str(i)
    #             raise StopIteration
    #         def __len__(self):
    #             return 5
    #     for data in 'abc', range(5), tuple(enumerate('abc')), A(), range(1,17,5):
    #         self.assertEqual(list(data)[::-1], list(reversed(data)))
    #     self.assertRaises(TypeError, reversed, {})
    #     # don't allow keyword arguments
    #     self.assertRaises(TypeError, reversed, [], a=1)

    # def test_range_optimization(self):
    #     x = range(1)
    #     self.assertEqual(type(reversed(x)), type(iter(x)))

    # def test_len(self):
    #     for s in ('hello', tuple('hello'), list('hello'), range(5)):
    #         self.assertEqual(operator.length_hint(reversed(s)), len(s))
    #         r = reversed(s)
    #         list(r)
    #         self.assertEqual(operator.length_hint(r), 0)
    #     class SeqWithWeirdLen:
    #         called = False
    #         def __len__(self):
    #             if not self.called:
    #                 self.called = True
    #                 return 10
    #             raise ZeroDivisionError
    #         def __getitem__(self, index):
    #             return index
    #     r = reversed(SeqWithWeirdLen())
    #     self.assertRaises(ZeroDivisionError, operator.length_hint, r)


    # def test_gc(self):
    #     class Seq:
    #         def __len__(self):
    #             return 10
    #         def __getitem__(self, index):
    #             return index
    #     s = Seq()
    #     r = reversed(s)
    #     s.r = r

    def test_args(self):
        self.assertRaises(TypeError, reversed)
        self.assertRaises(TypeError, reversed, [], 'extra')

    # def test_bug1229429(self):
    #     # this bug was never in reversed, it was in
    #     # PyObject_CallMethod, and reversed_new calls that sometimes.
    #     def f():
    #         pass
    #     r = f.__reversed__ = object()
    #     rc = sys.getrefcount(r)
    #     for i in range(10):
    #         try:
    #             reversed(f)
    #         except TypeError:
    #             pass
    #         else:
    #             self.fail("non-callable __reversed__ didn't raise!")
    #     self.assertEqual(rc, sys.getrefcount(r))

    def test_objmethods(self):
        # Objects must have __len__() and __getitem__() implemented.
        class NoLen(object):
            def __getitem__(self, i): return 1
        nl = NoLen()
        self.assertRaises(TypeError, reversed, nl)

        class NoGetItem(object):
            def __len__(self): return 2
        ngi = NoGetItem()
        self.assertRaises(TypeError, reversed, ngi)

        class Blocked(object):
            def __getitem__(self, i): return 1
            def __len__(self): return 2
            __reversed__ = None
        b = Blocked()
        self.assertRaises(TypeError, reversed, b)

# class EnumerateStartTestCase(EnumerateTestCase):
#
#     def test_basicfunction(self):
#         e = self.enum(self.seq)
#         self.assertEqual(iter(e), e)
#         self.assertEqual(list(self.enum(self.seq)), self.res)
#
#
# class TestStart(EnumerateStartTestCase):
#
#     enum = lambda self, i: enumerate(i, start=11)
#     seq, res = 'abc', [(11, 'a'), (12, 'b'), (13, 'c')]
#
#
# class TestLongStart(EnumerateStartTestCase):
#
#     enum = lambda self, i: enumerate(i, start=sys.maxsize+1)
#     seq, res = 'abc', [(sys.maxsize+1,'a'), (sys.maxsize+2,'b'),
#                        (sys.maxsize+3,'c')]


if __name__ == "__main__":
    unittest.main()
