# Python test set -- built-in functions

import unittest
from operator import neg
import sys

class Squares:

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

class TestFailingIter:
    def __iter__(self):
        raise RuntimeError

class BuiltinTest(unittest.TestCase):

    def test_getattr(self):
        import sys
        self.assertTrue(getattr(sys, 'maxint') is sys.maxint)
        self.assertRaises(TypeError, getattr, sys, 1)
        self.assertRaises(TypeError, getattr)

    def test_hasattr(self):
        import sys
        self.assertTrue(hasattr(sys, 'maxint'))
        self.assertRaises(TypeError, hasattr, sys, 1)
        self.assertRaises(TypeError, hasattr)

        class A:
            def __init__(self):
                self.undef_self = None

            def undefxz(self):
                return None

            def __getattr__(self, name):
                if name == 'undef':
                    return None
                if name == 'one':
                    return 1
                raise AttributeError

        class NoGAtt:
            def __init__(self):
                self.undef_self = None

            def undefxz(self):
                return None
        a = A()
        b = NoGAtt()
        self.assertTrue(hasattr(a, 'undefxz'))
        self.assertTrue(hasattr(a, 'undef_self'))
        self.assertTrue(hasattr(a, 'one'))
        self.assertTrue(hasattr(a, 'undef'))
        self.assertFalse(hasattr(a, "Robyn"))
        self.assertTrue(hasattr(b, 'undefxz'))
        self.assertTrue(hasattr(b, 'undef_self'))
        self.assertFalse(hasattr(b, 'one'))
        self.assertFalse(hasattr(b, 'undef'))
        self.assertFalse(hasattr(a, "Robyn"))

    def test_setattr(self):
        setattr(sys, 'spam', 1)
        self.assertEqual(sys.spam, 1)
        self.assertRaises(TypeError, setattr, sys, 1, 'spam')
        self.assertRaises(AttributeError, setattr, 1, 'spam', 9)
        self.assertRaises(TypeError, setattr)

    def test_delattr(self):
        class NoName:
            def color(self):
                return "green"
        x = NoName()
        y = NoName
        setattr(NoName, "shape", "square")
        self.assertEqual(getattr(NoName, "shape"), "square")
        self.assertTrue(hasattr(NoName, "shape"))
        self.assertEqual(getattr(NoName(), "shape"), "square")
        self.assertTrue(hasattr(NoName(), "shape"))
        self.assertRaises(AttributeError, delattr, NoName(), "shape")
        self.assertEqual(getattr(x, "shape"), "square")
        self.assertEqual(getattr(y, "shape"), "square")
        setattr(y, "shape", "circle")
        setattr(x, "shape", "square")
        self.assertEqual(getattr(NoName, "shape"), "circle")
        self.assertEqual(getattr(NoName(), "shape"), "circle")
        self.assertEqual(getattr(x, "shape"), "square")
        self.assertEqual(getattr(y, "shape"), "circle")
        delattr(NoName, "shape")
        self.assertEqual(getattr(x, "shape"), "square")
        self.assertRaises(AttributeError, delattr, y, "shape")
        self.assertRaises(AttributeError, delattr, NoName(), "shape")
        self.assertRaises(AttributeError, delattr, NoName, "shape")
        self.assertEqual(getattr(x, "color")(), "green")
        self.assertEqual(getattr(NoName(), "color")(), "green")
        self.assertEqual(getattr(x, "color")(), "green")
        setattr(x, "color", "red")
        self.assertEqual(x.color, "red")
        delattr(NoName, "color")
        self.assertEqual(x.color, "red")
        self.assertRaises(AttributeError, delattr, NoName, "color")
        self.assertEqual(x.color, "red")
        self.assertRaises(AttributeError, delattr, NoName, "color")
        self.assertRaises(TypeError, delattr, list, "append")
        self.assertRaises(TypeError, setattr, dict, "k", "v")

    def test_dir_subclasses(self):
        class Base:
            def method1(self):
                pass

        class Sub(Base):
            def method2(self):
                pass

        self.assertIn("method1", dir(Sub))
        self.assertIn("method2", dir(Sub))
        sub = Sub()
        self.assertIn("method1", dir(sub))
        self.assertIn("method2", dir(sub))

    def test_all(self):
        self.assertEqual(all([2, 4, 6]), True)
        self.assertEqual(all([2, None, 6]), False)
        # self.assertRaises(RuntimeError, all, [2, TestFailingBool(), 6])
        self.assertRaises(RuntimeError, all, TestFailingIter())
        self.assertRaises(TypeError, all, 10)               # Non-iterable
        self.assertRaises(TypeError, all)                   # No args
        self.assertRaises(TypeError, all, [2, 4, 6], [])    # Too many args
        self.assertEqual(all([]), True)                     # Empty iterator
        # self.assertEqual(all([0, TestFailingBool()]), False)# Short-circuit
        S = [50, 60]
        self.assertEqual(all(x > 42 for x in S), True)
        S = [50, 40, 60]
        self.assertEqual(all(x > 42 for x in S), False)

    def test_any(self):
        self.assertEqual(any([None, None, None]), False)
        self.assertEqual(any([None, 4, None]), True)
        # self.assertRaises(RuntimeError, any, [None, TestFailingBool(), 6])
        self.assertRaises(RuntimeError, any, TestFailingIter())
        self.assertRaises(TypeError, any, 10)               # Non-iterable
        self.assertRaises(TypeError, any)                   # No args
        self.assertRaises(TypeError, any, [2, 4, 6], [])    # Too many args
        self.assertEqual(any([]), False)                    # Empty iterator
        # self.assertEqual(any([1, TestFailingBool()]), True) # Short-circuit
        S = [40, 60, 30]
        self.assertEqual(any(x > 42 for x in S), True)
        S = [10, 20, 30]
        self.assertEqual(any(x > 42 for x in S), False)

    def test_sum(self):
        self.assertEqual(sum([]), 0)
        self.assertEqual(sum(list(range(2,8))), 27)
        # self.assertEqual(sum(iter(list(range(2,8)))), 27)
        self.assertEqual(sum(Squares(10)), 285)
        # self.assertEqual(sum(iter(Squares(10))), 285)
        self.assertEqual(sum([[1], [2], [3]], []), [1, 2, 3])

        self.assertRaises(TypeError, sum)
        self.assertRaises(TypeError, sum, 42)
        self.assertRaises(TypeError, sum, ['a', 'b', 'c'])
        self.assertRaises(TypeError, sum, ['a', 'b', 'c'], '')
        self.assertRaises(TypeError, sum, [[1], [2], [3]])
        self.assertRaises(TypeError, sum, [{2:3}])

        self.assertRaises(TypeError, sum, [{2:3}]*2, {2:3})

        class BadSeq:
            def __getitem__(self, index):
                raise ValueError
        self.assertRaises(ValueError, sum, BadSeq())


        empty = []
        sum(([x] for x in range(10)), empty)
        self.assertEqual(empty, [])

    def test_zip(self):
        a = (1, 2, 3)
        b = (4, 5, 6)
        t = [(1, 4), (2, 5), (3, 6)]
        self.assertEqual(zip(a, b), t)
        b = [4, 5, 6]
        self.assertEqual(zip(a, b), t)
        b = (4, 5, 6, 7)
        self.assertEqual(zip(a, b), t)
        class I:
            def __getitem__(self, i):
                if i < 0 or i > 2: raise IndexError
                return i + 4
        self.assertEqual(zip(a, I()), t)
        self.assertEqual(zip(), [])
        self.assertEqual(zip(*[]), [])
        self.assertRaises(TypeError, zip, None)
        class G:
            pass
        self.assertRaises(TypeError, zip, a, G())

        # Make sure zip doesn't try to allocate a billion elements for the
        # result list when one of its arguments doesn't say how long it is.
        # A MemoryError is the most likely failure mode.
        class SequenceWithoutALength:
            def __getitem__(self, i):
                if i == 5:
                    raise IndexError
                else:
                    return i
        self.assertEqual(
            #zip(SequenceWithoutALength(), xrange(2**30)),
            zip(SequenceWithoutALength(), xrange(2**8)), # no working xrange
            list(enumerate(range(5)))
        )

        class BadSeq:
            def __getitem__(self, i):
                if i == 5:
                    raise ValueError
                else:
                    return i
        self.assertRaises(ValueError, zip, BadSeq(), BadSeq())

    def test_map(self):
        self.assertEqual(
            map(None, 'hello world'),
            ['h','e','l','l','o',' ','w','o','r','l','d']
        )
        self.assertEqual(
            map(None, 'abcd', 'efg'),
            [('a', 'e'), ('b', 'f'), ('c', 'g'), ('d', None)]
        )
        self.assertEqual(
            map(None, range(10)),
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
        )
        self.assertEqual(
            map(lambda x: x*x, range(1,4)),
            [1, 4, 9]
        )
        try:
            from math import sqrt
        except ImportError:
            def sqrt(x):
                return pow(x, 0.5)
        self.assertEqual(
            map(lambda x: map(sqrt,x), [[16, 4], [81, 9]]),
            [[4.0, 2.0], [9.0, 3.0]]
        )
        self.assertEqual(
            map(lambda x, y: x+y, [1,3,2], [9,1,4]),
            [10, 4, 6]
        )

        def plus(*v):
            accu = 0
            for i in v: accu = accu + i
            return accu
        self.assertEqual(
            map(plus, [1, 3, 7]),
            [1, 3, 7]
        )
        self.assertEqual(
            map(plus, [1, 3, 7], [4, 9, 2]),
            [1+4, 3+9, 7+2]
        )
        self.assertEqual(
            map(plus, [1, 3, 7], [4, 9, 2], [1, 1, 0]),
            [1+4+1, 3+9+1, 7+2+0]
        )
        self.assertEqual(
            map(None, Squares(10)),
            [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
        )
        self.assertEqual(
            map(int, Squares(10)),
            [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
        )
        self.assertEqual(
            map(None, Squares(3), Squares(2)),
            [(0,0), (1,1), (4,None)]
        )
        self.assertEqual(
            map(max, Squares(3), Squares(2)),
            [0, 1, 4]
        )
        self.assertRaises(TypeError, map)
        self.assertRaises(TypeError, map, lambda x: x, 42)
        self.assertEqual(map(None, [42]), [42])
        class BadSeq:
            def __getitem__(self, index):
                raise ValueError
        self.assertRaises(ValueError, map, lambda x: x, BadSeq())
        def badfunc(x):
            raise RuntimeError
        self.assertRaises(RuntimeError, map, badfunc, range(5))

    def test_abs(self):
        class TestAbs:

            def __init__(self):
                self.foo = -3

            def __abs__(self):
                return -self.foo

        bar = TestAbs()
        self.assertEqual(abs(bar), 3)
        self.assertEqual(abs(-3), 3)

    def test_reversed(self):
        class TestReversed:
            def __reversed__(self):
                return [5, 4, 3, 2, 1]

        self.assertEqual(list(reversed([1, 2, 3])), [3, 2, 1])

        obj = TestReversed()
        self.assertEqual(reversed(obj), [5, 4, 3, 2, 1])

    def test_reduce(self):
        add = lambda x, y: x+y
        self.assertEqual(reduce(add, ['a', 'b', 'c'], ''), 'abc')
        self.assertEqual(
            reduce(add, [['a', 'c'], [], ['d', 'w']], []),
            ['a','c','d','w']
        )
        self.assertEqual(reduce(lambda x, y: x*y, range(2,8), 1), 5040)
        self.assertEqual(
            reduce(lambda x, y: x*y, range(2,21), 1L),
            2432902008176640000L
        )
        self.assertEqual(reduce(add, Squares(10)), 285)
        self.assertEqual(reduce(add, Squares(10), 0), 285)
        self.assertEqual(reduce(add, Squares(0), 0), 0)
        self.assertRaises(TypeError, reduce)
        self.assertRaises(TypeError, reduce, 42)
        self.assertRaises(TypeError, reduce, 42, 42)
        self.assertRaises(TypeError, reduce, 42, 42, 42)
        self.assertRaises(TypeError, reduce, None, range(5))
        self.assertRaises(TypeError, reduce, add, 42)
        self.assertEqual(reduce(42, "1"), "1") # func is never called with one item
        self.assertEqual(reduce(42, "", "1"), "1") # func is never called with one item
        self.assertRaises(TypeError, reduce, 42, (42, 42))
        self.assertRaises(TypeError, reduce, add, []) # arg 2 must not be empty sequence with no initial value
        self.assertRaises(TypeError, reduce, add, "")
        self.assertRaises(TypeError, reduce, add, ())
        self.assertEqual(reduce(add, [], None), None)
        self.assertEqual(reduce(add, [], 42), 42)

        class BadSeq:
            def __getitem__(self, index):
                raise ValueError
        self.assertRaises(ValueError, reduce, 42, BadSeq())

    def test_filter(self):
        self.assertEqual(filter(lambda c: 'a' <= c <= 'z', 'Hello World'), 'elloorld')
        self.assertEqual(filter(None, [1, 'hello', [], [3], '', None, 9, 0]), [1, 'hello', [3], 9])
        self.assertEqual(filter(lambda x: x > 0, [1, -3, 9, 0, 2]), [1, 9, 2])
        self.assertEqual(filter(None, Squares(10)), [1, 4, 9, 16, 25, 36, 49, 64, 81])
        self.assertEqual(filter(lambda x: x%2, Squares(10)), [1, 9, 25, 49, 81])
        def identity(item):
            return 1
        filter(identity, Squares(5))
        self.assertRaises(TypeError, filter)

        class BadSeq(object):
            def __getitem__(self, index):
                if index<4:
                    return 42
                raise ValueError
        self.assertRaises(ValueError, filter, lambda x: x, BadSeq())
        def badfunc():
            pass
        self.assertRaises(TypeError, filter, badfunc, range(5))

        # test bltinmodule.c::filtertuple()
        self.assertEqual(filter(None, (1, 2)), (1, 2))
        self.assertEqual(filter(lambda x: x>=3, (1, 2, 3, 4)), (3, 4))
        self.assertRaises(TypeError, filter, 42, (1, 2))

        # test bltinmodule.c::filterstring()
        self.assertEqual(filter(None, "12"), "12")
        self.assertEqual(filter(lambda x: x>="3", "1234"), "34")
        self.assertRaises(TypeError, filter, 42, "12")

        # class badstr(str):
        #     def __getitem__(self, index):
        #         raise ValueError
        # self.assertRaises(ValueError, filter, lambda x: x >="3", badstr("1234"))

        # class badstr2(str):
        #     def __getitem__(self, index):
        #         return 42
        # self.assertRaises(TypeError, filter, lambda x: x >=42, badstr2("1234"))

        # class weirdstr(str):
        #     def __getitem__(self, index):
        #         return weirdstr(2*str.__getitem__(self, index))
        # self.assertEqual(filter(lambda x: x>="33", weirdstr("1234")), "3344")

        # class shiftstr(str):
        #     def __getitem__(self, index):
        #         return chr(ord(str.__getitem__(self, index))+1)
        # self.assertEqual(filter(lambda x: x>="3", shiftstr("1234")), "345")

    def test_callable(self):
        self.assertTrue(callable(len))                            # builtin
        self.assertFalse(callable("a"))
        self.assertTrue(callable(callable))                       # builtin
        self.assertTrue(callable(lambda x, y: x + y))             # python lambda
        def f(): pass
        self.assertTrue(callable(f))                              # python func
        class C1(object):
            def meth(self): pass
        self.assertTrue(callable(C1))                               # class
        c = C1()
        self.assertTrue(callable(c.meth))                           # method (instance)
        # __call__ is looked up on the class, not the instance
        c.__call__ = None
        self.assertFalse(callable(c))                               # class instance without __call__ in class
        class C2(object):
            def __call__(self): pass
        c2 = C2()
        self.assertTrue(callable(c2))                               # class instance with __call__ in class
        self.assertFalse(callable(False))                                       # bool
        self.assertFalse(callable(["this is a list"]))                          # list        
        self.assertFalse(callable(["this is a list with a function", f]))       # list containing function
        self.assertFalse(callable({}))                                          # dict
        self.assertFalse(callable(None))                                        # nonetype
        self.assertFalse(callable(1))                                           # number
        self.assertTrue(callable(float))                                        # float builtin
        self.assertFalse(callable(float()))                                     # function call
        self.assertFalse(callable(float(1)))                                    # float type
        self.assertFalse(callable("+"))                                         # string containing symbol
        self.assertFalse(callable(4+7))                                         # expression
        self.assertFalse(callable(enumerate(['a', 'b', 'c', 'd'])))             # list created by callable function
        self.assertFalse(callable(()))                                          # tuple                                        
        # generators are callable
        def squares(n):
            '''Yields the squares from 0 to n-1 squared.'''
            for i in range(n):
                yield i * i
        self.assertTrue(callable(squares))                                      # generator
        class SuperClass(object): #superclass
            def getName(self):
                raise NotImplementedError
        class LittleClass(SuperClass): #subclass/ inherited from SuperClass
                def __call__(self):
                    return "LittleClass"
        big = SuperClass()
        big.__call__ = "call me super"
        self.assertFalse(callable(big))                                             # checking callable by class (not instances)
        class_inst = LittleClass()                                                  # class instances are not callable unless they have a .__call__ method
        self.assertTrue(callable(class_inst)) 
        #### nested classes
        class Outer(object):
            def __init__(self):
                self.y = 0

            class Inner(object):
                def __init__(self):
                    self.x = 1
        self.assertTrue(callable(Outer.Inner))                                 # function object
        self.assertTrue(callable(Outer.Inner.__init__))
    
    def test_next(self):
        itera = iter([1,2,3])                                 # iterator
        self.assertEqual(next(itera), 1)
        self.assertEqual(next(itera), 2)
        self.assertEqual(next(itera), 3)
        self.assertEqual(next(itera, "stop please"), "stop please") # test default
        self.assertRaises(StopIteration, next, itera)               # causes StopIteration
        self.assertRaises(TypeError, next, [1,2,3,4])               # type errors "not an iterator" : list
        self.assertRaises(TypeError, next, (1,2,3,4))               # tuple
        self.assertRaises(TypeError, next, "hello")                 # string
        self.assertEqual(next(iter("hello")), "h")                  # iterator from a string
        self.assertRaises(TypeError, next, False)                   # Type Error: bool object is not an iterator
        self.assertRaises(TypeError, next, {1:2})                   # TypeError: dict object is not an iterator
        self.assertRaises(TypeError, next, 1)                       # TypeError: int object is not an iterator
        class Noniter:
            def __init__(self, num):
                self.mynum = num
        noniterb = Noniter(1)                                           # "class instance without __iter__ method"   
        self.assertRaises(TypeError, next, noniterb)                    # TypeError: instance has no next() method
        self.assertRaises(TypeError, next, noniterb, "defaultreturn")   # class instance without __iter__ method, has default
        iterc = Noniter(2)
        iterc.__iter__ = iter([1,2,3])                                  # class instance with __iter__ method
        self.assertRaises(TypeError, next, iterc)                       # TypeError: instance has no next() method                   # stop iteration
        self.assertEqual(next(iterc.__iter__), 1)                 # iterator class without __iter__, instance with __iter__... should raise StopIteration error
        self.assertEqual(next(iterc.__iter__), 2)
        self.assertEqual(next(iterc.__iter__), 3)
        self.assertRaises(StopIteration, next, iterc.__iter__)
        class Iterb:
            def __init__(self, lst):
                self.lst = lst
                self.iter = iter(self.lst)

            def __iter__(self):
                return self.iter
        iterb = Iterb((1, 2))
        self.assertRaises(TypeError, next, iterb)                  # TypeError: instance has no next() method
        self.assertEqual(next(iterb.__iter__()), 1)                 # class with __iter__ method
        self.assertEqual(next(iterb.__iter__()), 2)  
        self.assertRaises(StopIteration, next, iterb.__iter__())
        self.assertRaises(StopIteration, next, iterb.__iter__())
        iterstr = Iterb("str")
        self.assertEqual(next(iterstr.__iter__(), "ing"), "s")      # iterator class with string and default
        self.assertEqual(next(iterstr.__iter__(), "ing"), "t")
        self.assertEqual(next(iterstr.__iter__(), "ing"), "r")
        self.assertEqual(next(iterstr.__iter__(), "ing"), "ing")    # class instance with __iter__ method, testing default
        self.assertEqual(next(iterstr.__iter__(), "ing"), "ing")
        self.assertEqual(next(iterstr.__iter__(), "ing"), "ing")
        self.assertRaises(StopIteration, next, iterb.__iter__())    # class instance with __iter__ method, testing stop/no default
        spellcow = iter("cow")                                      # tuple iterator
        self.assertEqual(next(spellcow, "moo"), "c")                # sring, with defaul
        self.assertEqual(next(spellcow, "moo"), "o")
        self.assertEqual(next(spellcow, "moo"), "w")
        self.assertEqual(next(spellcow, "moo"), "moo")
        iterd = iter([])                                            # empty iterator
        self.assertRaises(StopIteration, next, iterd)

        class HasNext:
            def __init__(self, num):
                self.mynum = num

            def next(self):
                return "this is the next value"
        hasnext1 = HasNext(123)
        self.assertEqual(next(hasnext1), "this is the next value")  # has a "next" method

        class NoNext:
            def __iter__(self):
                return self
        NoNextinst = NoNext()
        self.assertRaises(TypeError, next, NoNextinst.__iter__)     # TypeError: instancemethod object is not an iterator
        self.assertRaises(TypeError, next, NoNextinst.__iter__())

        it = iter(range(2))                                         # cpython testing
        self.assertEqual(next(it), 0)
        self.assertEqual(next(it), 1)
        self.assertRaises(StopIteration, next, it)
        self.assertRaises(StopIteration, next, it)
        self.assertEqual(next(it, 42), 42)

        class Iter:
            def __iter__(self):
                return self

            def next(self):
                raise StopIteration

        it = iter(Iter())
        self.assertEqual(next(it, 42), 42)
        self.assertRaises(StopIteration, next, it)

        def gen():
            yield 1
            return

        it = gen()
        self.assertEqual(next(it), 1)
        self.assertRaises(StopIteration, next, it)
        self.assertEqual(next(it, 42), 42)

if __name__ == "__main__":
    unittest.main()
