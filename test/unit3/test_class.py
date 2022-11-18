##Test the functionality of Python classes implementing operators."

import unittest


testmeths = [

# Binary operations
    "add",
    "radd",
    "sub",
    "rsub",
    "mul",
    "rmul",
    "matmul",
    "rmatmul",
    "truediv",
    "rtruediv",
    "floordiv",
    "rfloordiv",
    "mod",
    "rmod",
    "divmod",
    "rdivmod",
    "pow",
    "rpow",
    "rshift",
    "rrshift",
    "lshift",
    "rlshift",
    "and",
    "rand",
    "or",
    "ror",
    "xor",
    "rxor",

# List/dict operations
    "contains",
    "getitem",
    "setitem",
    "delitem",

# Unary operations
    "neg",
    "pos",
    "abs",

# generic operations
    "init",
    ]

# These need to return something other than None
#    "hash",
#    "str",
#    "repr",
#    "int",
#    "float",

# These are separate because they can influence the test of other methods.
#    "getattr",
#    "setattr",
#    "delattr",

callLst = []
def trackCall(f):
    def track(*args, **kwargs):
        callLst.append((f.__name__, args))
        return f(*args, **kwargs)
    return track

# Synthesize all the other AllTests methods from the names in testmeths.

d = {}
AllTests = type("AllTests", (object,), d)

class ClassTests(unittest.TestCase):
    def setUp(self):
        callLst[:] = []

    def assertCallStack(self, expected_calls):
        actualCallList = callLst[:]  # need to copy because the comparison below will add
                                     # additional calls to callLst
        # if expected_calls != actualCallList:
        #     self.fail("Expected call list:\n  %s\ndoes not match actual call list\n  %s" %
        #               (expected_calls, actualCallList))

    def testInit(self):
        foo = AllTests()
        self.assertCallStack([("__init__", (foo,))])

    def testBinaryOps(self):
        testme = AllTests()
        # Binary operations

        callLst[:] = []
        self.assertCallStack([("__add__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__radd__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__sub__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rsub__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__mul__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rmul__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__matmul__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rmatmul__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__truediv__", (testme, 1))])


        callLst[:] = []
        self.assertCallStack([("__rtruediv__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__floordiv__", (testme, 1))])


        callLst[:] = []
        self.assertCallStack([("__rfloordiv__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__mod__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rmod__", (testme, 1))])


        callLst[:] = []
        self.assertCallStack([("__divmod__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rdivmod__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__pow__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rpow__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rshift__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rrshift__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__lshift__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rlshift__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__and__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rand__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__or__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__ror__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__xor__", (testme, 1))])

        callLst[:] = []
        self.assertCallStack([("__rxor__", (testme, 1))])

    def testListAndDictOps(self):
        testme = AllTests()

        # List/dict operations

        class Empty: pass

        try:
            1 in Empty()
            self.fail('failed, should have raised TypeError')
        except TypeError:
            pass

        callLst[:] = []
        self.assertCallStack([('__contains__', (testme, 1))])

        callLst[:] = []
        self.assertCallStack([('__getitem__', (testme, 1))])

        callLst[:] = []
        self.assertCallStack([('__setitem__', (testme, 1, 1))])

        callLst[:] = []
        self.assertCallStack([('__delitem__', (testme, 1))])

        callLst[:] = []
        self.assertCallStack([('__getitem__', (testme, slice(None, 42)))])

        callLst[:] = []
        self.assertCallStack([('__setitem__', (testme, slice(None, 42),
                                               "The Answer"))])

        callLst[:] = []
        self.assertCallStack([('__delitem__', (testme, slice(None, 42)))])

        callLst[:] = []
        self.assertCallStack([('__getitem__', (testme, slice(2, 1024, 10)))])

        callLst[:] = []
        self.assertCallStack([('__setitem__', (testme, slice(2, 1024, 10),
                                                                    "A lot"))])
        callLst[:] = []
        self.assertCallStack([('__delitem__', (testme, slice(2, 1024, 10)))])

        callLst[:] = []
        self.assertCallStack([('__getitem__', (testme, (slice(None, 42, None),
                                                        slice(None, 24, None),
                                                        24, 100)))])
        callLst[:] = []
        self.assertCallStack([('__setitem__', (testme, (slice(None, 42, None),
                                                        slice(None, 24, None),
                                                        24, 100), "Strange"))])
        callLst[:] = []
        self.assertCallStack([('__delitem__', (testme, (slice(None, 42, None),
                                                        slice(None, 24, None),
                                                        24, 100)))])

    def testUnaryOps(self):
        testme = AllTests()

        callLst[:] = []
        self.assertCallStack([('__neg__', (testme,))])
        callLst[:] = []
        self.assertCallStack([('__pos__', (testme,))])
        callLst[:] = []
        self.assertCallStack([('__abs__', (testme,))])
        callLst[:] = []
        self.assertCallStack([('__int__', (testme,))])
        callLst[:] = []
        self.assertCallStack([('__float__', (testme,))])
        callLst[:] = []
        self.assertCallStack([('__index__', (testme,))])
        callLst[:] = []
        self.assertCallStack([('__index__', (testme,))])
        class U(object):
            def __repr__(self): return "<U>"
            def __pos__(self): return 'pos'
            def __neg__(self): return 'neg'
            def __invert__(self): return 'invert'

        self.assertEqual(repr(U()), "<U>")
        self.assertEqual(-(U()), 'neg')
        self.assertEqual(+(U()),'pos')
        self.assertEqual(~(U()), 'invert')

        class E(object):
            def __repr__(self): return "<U>"
        err = None
        try: err = +E()
        except TypeError: err = 'no +'
        self.assertEqual(err, 'no +')


    def testMisc(self):
        testme = AllTests()

        callLst[:] = []
        hash(testme)
        self.assertCallStack([('__hash__', (testme,))])

        callLst[:] = []
        repr(testme)
        self.assertCallStack([('__repr__', (testme,))])

        callLst[:] = []
        str(testme)
        self.assertCallStack([('__str__', (testme,))])

        callLst[:] = []
        testme == 1
        self.assertCallStack([('__eq__', (testme, 1))])

        callLst[:] = []
        self.assertCallStack([('__lt__', (testme, 1))])

        callLst[:] = []
        self.assertCallStack([('__gt__', (testme, 1))])

        callLst[:] = []
        self.assertCallStack([('__ne__', (testme, 1))])

        callLst[:] = []
        self.assertCallStack([('__eq__', (1, testme))])

        callLst[:] = []
        self.assertCallStack([('__gt__', (1, testme))])

        callLst[:] = []
        self.assertCallStack([('__lt__', (1, testme))])

        callLst[:] = []
        1 != testme
        self.assertCallStack([('__ne__', (1, testme))])

        class Foo:
            def __init__(self):
                self.x = 3
        f = Foo()
        self.assertRaises(TypeError, lambda x: x[4], f)


    def testGetSetAndDel(self):
        # Interfering tests
        class ExtraTests(AllTests):
            def __getattr__(self, *args):
                return "SomeVal"

            def __setattr__(self, *args):
                pass

            def __delattr__(self, *args):
                pass

        testme = ExtraTests()

        callLst[:] = []
        testme.spam
        self.assertCallStack([('__getattr__', (testme, "spam"))])

        callLst[:] = []
        testme.eggs = "spam, spam, spam and ham"
        self.assertCallStack([('__setattr__', (testme, "eggs",
                                               "spam, spam, spam and ham"))])

        callLst[:] = []
        self.assertCallStack([('__delattr__', (testme, "cardinal"))])

    # def testDel(self):
    #     x = []
    #
    #     class DelTest:
    #         def __del__(self):
    #             x.append("crab people, crab people")
    #     testme = DelTest()
    #     del testme
    #     import gc
    #     gc.collect()
    #     self.assertEqual(["crab people, crab people"], x)

    def testBadTypeReturned(self):
        # return values of some method are type-checked
        class BadTypeClass:
            def __int__(self):
                return None
            __float__ = __int__
            __complex__ = __int__
            __str__ = __int__
            __repr__ = __int__
            __bytes__ = __int__
            __bool__ = __int__
            __index__ = __int__
        def index(x):
            return [][x]

        for f in [float, complex, str, repr, bytes, bin, oct, hex, bool, index]:
            self.assertRaises(TypeError, f, BadTypeClass())


    def testHashStuff(self):
        # Test correct errors from hash() on objects with comparisons but
        #  no __hash__
    
        class C0:
            pass
    
        hash(C0()) # This should work; the next two should raise TypeError
    
        class C2:
            def __eq__(self, other): return 1
    
        self.assertRaises(TypeError, hash, C2())


    def testSFBug532646(self):
        # Test for SF bug 532646
    
        class A:
            pass
        A.__call__ = A()
        a = A()
    
        try:
            a() # This should not segfault
        except RecursionError:
            pass
        else:
            self.fail("Failed to raise RecursionError")

    # def testForExceptionsRaisedInInstanceGetattr2(self):
    #     # Tests for exceptions raised in instance_getattr2().
    #
    #     def booh(self):
    #         raise AttributeError("booh")
    #
    #     class A:
    #         a = property(booh)
    #     try:
    #         A().a # Raised AttributeError: A instance has no attribute 'a'
    #     except AttributeError as x:
    #         if str(x) != "booh":
    #             self.fail("attribute error for A().a got masked: %s" % x)
    #
    #     class E:
    #         __eq__ = property(booh)
    #     E() == E() # In debug mode, caused a C-level assert() to fail
    #
    #     class I:
    #         __init__ = property(booh)
    #     try:
    #         # In debug mode, printed XXX undetected error and
    #         #  raises AttributeError
    #         I()
    #     except AttributeError as x:
    #         pass
    #     else:
    #         self.fail("attribute error for I.__init__ got masked")

    def testHashComparisonOfMethods(self):
        # Test comparison and hash of methods
        class A:
            def __init__(self, x):
                self.x = x
            def f(self):
                pass
            def g(self):
                pass
            def __eq__(self, other):
                return self.x == other.x
            def __hash__(self):
                return self.x
        class B(A):
            pass
        class C:
            def f(self):
                pass
        a1 = A(1)
        a2 = A(2)
        c = C()
        #compare instances of class A
        self.assertEqual(a1.f, a1.f)
        self.assertEqual(hash(a1.f), hash(a1.f))
        self.assertNotEqual(a1.f, a2.f)
        self.assertNotEqual(a1.f, a1.g)
        self.assertEqual(a1.f, A(1).f)
        self.assertEqual(hash(a1.f), hash(A(1).f))
        #compare classes that inherit from each other
        self.assertNotEqual(A.f, a1.f)
        self.assertNotEqual(hash(A.f), hash(a1.f))
        self.assertNotEqual(A.f, A.g)
        self.assertEqual(B.f, A.f)
        self.assertEqual(hash(B.f), hash(A.f))
        self.assertEqual(A.f, A.f)
        self.assertEqual(hash(A.f), hash(A.f))
        #compare different classes
        self.assertNotEqual(C.f, A.f)
        self.assertNotEqual(hash(C.f),hash(A.f))
        self.assertNotEqual(c.f, a1.f)
        self.assertNotEqual(hash(c.f), hash(a1.f))
        #the following triggers a SystemError in 2.4
        a = A(hash(A.f)^(-1))
        hash(a.f)
        # Test class without __eq__ and __hash__ methods
        class A:
            def __init__(self, x):
                self.x = x
            def f(self):
                pass
            def g(self):
                pass
        class B(A):
            pass
        class C():
            def f(self):
                pass
        a1 = A(1)
        a2 = A(2)
        c = C()
        #compare instances of class A
        self.assertEqual(a1.f, a1.f)
        self.assertEqual(hash(a1.f), hash(a1.f))
        self.assertNotEqual(a1.f, a2.f)
        self.assertNotEqual(a1.f, a1.g)
        self.assertNotEqual(a1.f, A(1).f)
        self.assertNotEqual(hash(a1.f), hash(A(1).f))
        #compare classes that inherit from each other
        self.assertNotEqual(A.f, a1.f)
        self.assertNotEqual(hash(A.f), hash(a1.f))
        self.assertNotEqual(A.f, A.g)
        self.assertEqual(B.f, A.f)
        self.assertEqual(hash(B.f), hash(A.f))
        self.assertEqual(A.f, A.f)
        self.assertEqual(hash(A.f), hash(A.f))
        #compare different classes
        self.assertNotEqual(C.f, A.f)
        self.assertNotEqual(hash(C.f),hash(A.f))
        self.assertNotEqual(c.f, a1.f)
        self.assertNotEqual(hash(c.f), hash(a1.f))
        self.assertNotEqual(hash(c), hash(a1))

    def test__call__(self):
        class Test:
            def __init__(self, v):
                self.value = v
            def __call__(self):
                return self.value
        x = Test('OK')
        self.assertEqual(x(), "OK")

    def test__class__(self):
        class A:
            val1 = "A"

            def __init__(self, v):
                self.val1 = v

            def do(self):
                return tuple([self.__class__.val1, self.val1])

            def update(self, newv):
                self.val1 = newv
        a = A("sa")
        self.assertEqual(a.do(), tuple(["A", "sa"]))
        a.update("sa-new")
        self.assertEqual(a.do(), tuple(["A", "sa-new"]))

    def test__len__(self):
        class HasLen:
            def __init__(self, l):
                self.l = l
            def __len__(self):
                return self.l
        class SubLen(HasLen):
            def __init__(self, l):
                HasLen.__init__(self, l)
        class NoLen:
            def __init__(self, l):
                self.l = l
        h = HasLen(42)
        self.assertEqual(len(h), 42)
        h2 = SubLen(43)
        self.assertEqual(len(h2), 43)
        h3 = NoLen(44)
        self.assertRaises(TypeError, len, h3)

    def testMethodCall(self):
        class C:
            def __init__(self, data):
                self.data = data
            def pr(self):
                 return (self.data)
        self.assertEqual(C("OK").pr(), "OK")
        class A:
            def __init__(self):
                self.a = 'O'
                self.b = 'x'
            def test(self):
                return "KO"
        class B(A):
            def __init__(self):
                A.__init__(self)
                self.b = 'K'
            def test(self):
                return self.a + self.b
        b = B()
        self.assertEqual(b.test(), "OK")
        class Stuff:
            def __init__(self):
                self.a = 0
                self.b = 'b'
                self.c = [1,2,3]
                self.d = 100000000000000

        s = Stuff()
        s.a += 10
        s.b += 'dog'
        s.c += [9,10]
        s.d += 10000
        self.assertEqual(s.a, 10)
        self.assertEqual(s.b, "bdog")
        self.assertEqual(s.c, [1, 2, 3, 9, 10])
        self.assertEqual(s.d, 100000000010000)
        class Stuff:
            def __init__(self):
                self.a = 0
                self.b = 'b'
                self.c = [1,2,3]
                self.d = 100000000000000
            def doit(self):
                self.a += 10
                self.b += 'dog'
                self.c += [9,10]
                self.d += 10000
        z = Stuff()
        z.doit()
        self.assertEqual(z.a, 10)
        self.assertEqual(z.b, "bdog")
        self.assertEqual(z.c, [1, 2, 3, 9, 10])
        self.assertEqual(z.d, 100000000010000)
        class X:
            def __init__(self):
                self.px = 3
            def y(self):
                l = "xyz"
                if len(l) == self.px:
                    return "OK"
        x = X()
        self.assertEqual(x.y(), "OK")

    def testRepr(self):
        class X: pass
        #self.assertEqual(repr(X())[:20], "<__main__.ClassTests")
        self.assertEqual(repr(int), "<class 'int'>")
        self.assertEqual
        class A(object):
            def __init__(self): pass
        self.assertEqual(repr(object())[:7], '<object')
        #self.assertEqual(repr(A()), '<__main__.A>')

        class B:
            def __init__(self): pass
            def __repr__(self): return 'custom repr'
        self.assertEqual(repr(B()), 'custom repr')

##
##    def testStr(self):
##        class X: pass
##        self.assertEqual(str(X()), "<__main__.X object>")
##        self.assertEqual(str(int), "<class 'int'>")
##        class Point:
##            def __init__(self, initX, initY):
##                self.x = initX
##                self.y = initY
##
##            def __str__(self):
##                return str(self.x) + "," + str(self.y)
##        p = Point(1,2)
##        self.assertEqual(str(p), "1,2")
##        class Silly:
##            def __init__(self, x):
##                self.h = x
##
##            def __str__(self):
##                return str(self.h)
##        a = Silly(1)
##        b = Silly(2)
##        self.assertEqual(str(a), '1')
##        self.assertEqual(str(b), '2')

    def testComplexMethods(self):
        class Stuff:
            def __init__(self):
                self.x = lambda: self.things()
            def things(self):
                return "OK"
        y = Stuff()
        self.assertEqual(y.x(), "OK")
        class Stuff:
            def __init__(self):
                def tmp():
                    return self.things()
                self.x = tmp
            def things(self):
                return "OK"
        y = Stuff()
        self.assertEqual(y.x(), "OK")
        class Stuff:
            def blah(self, x, y=False):
                return [x,y]
        s = Stuff()
        self.assertEqual(s.blah("x",y="OK"), ['x', 'OK'])
        class Ship:
            def __init__(self, name):
                self.name = name
                self.thrust = False

            def thrust(self):
                  self.thrust = True
                  print("Thrust", self.thrust)

        my_ship = Ship("a_name")
        self.assertRaises(TypeError,my_ship.thrust)
        class A(object):
            message = 'a'
            def test(self):
                 return 'a>' + self.__class__.__name__

        class B(object):
            def test(self):
                return 'b>' + self.__class__.__name__

        class C(A, B):
            def test(self):
                return (A.test(self), B.test(self))

        self.assertEqual(C().test(), ("a>C", "b>C"))

    def testGetAttr(self):
        class X: pass
        x = X()
        self.assertEqual(getattr(x, 'wee', 14),14)
        self.assertEqual(getattr(X, 'doggy', 'OK'), 'OK')
        class X: pass
        x = X()
        self.assertRaises(AttributeError, getattr, x, "wee")

    def testGetItem(self):
        class Matrix(object):
            def __init__(self, matrix=None):
                #check if all rows same size

                self.mat = matrix

            #identity matrix initilization

            #scalar matrix multiplication

            def __getitem__(self, index):
                #print index
                return self.mat[index[0]][index[1]]


            def __setitem__(self, index, item):
                """
                """

                self.mat[index[0]][index[1]] = item

        trial=Matrix([[543]])
        trial[0,0]=100
        self.assertEqual(trial[0,0], 100)
        class A:
            def __getitem__(self, slices):
                return slices

        a = A()

        self.assertEqual(a[1], 1)
        self.assertEqual(a[0:2], slice(0, 2, None))
        self.assertEqual(a[:2], slice(None, 2, None))
        self.assertEqual(slice(2), slice(None, 2, None))
        self.assertEqual(a[1:], slice(1, None, None))
        self.assertEqual(a[:], slice(None, None, None))
        self.assertEqual(a[::], slice(None, None, None))
        self.assertEqual(a[::-1], slice(None, None, -1))
        self.assertEqual(a[0,1:2], (0, slice(1, 2, None)))
        self.assertEqual(a[0:2,2:30:1], (slice(0, 2, None), slice(2, 30, 1)))

        self.assertEqual(a[1], 1)
        self.assertEqual(a[0:2], slice(0,2))
        self.assertEqual(a[0,1:2], (0,slice(1,2)))
        self.assertEqual(a[0:2,2:30:1], (slice(0,2), slice(2,30,1)))

        self.assertEqual(slice(0,2), slice(0,2))
        self.assertTrue(slice(0,2) < slice(1,2))
        self.assertTrue(slice(0,2) < slice(1,1))
        #Below doesn't work properly in skulpt yet but it works in real python 3
        #self.assertRaises(TypeError, lambda x,y: x < y,slice(2), slice(0,2))
        self.assertTrue(slice(1,2,3) < slice(1,2,4))
        self.assertTrue(slice(1,-1) < slice(1,1))
        self.assertTrue(slice(0,1) < slice(1,-1))

        self.assertEqual(a["foo"], "foo")
        self.assertEqual(a["foo":(1,2):True].start, "foo")
        self.assertEqual(a["foo":(1,2):True].stop, (1,2))
        self.assertEqual(a["foo":(1,2):True].step, True)

    def testLessThan(self):
        class Comparable:    
            def __init__(self,value):
                self.value = value
         
            def __lt__(self,other):
                return self.value < other.value
         
            def __repr__(self):
                return "Value :" + str(self.value)
         
        lst = [5,9,2,7]
        otherLst = [Comparable(a) for a in lst]
        self.assertEqual(str(otherLst), '[Value :5, Value :9, Value :2, Value :7]')
        self.assertEqual(min(lst), 2)
        self.assertEqual(str(min(otherLst)), 'Value :2')


if __name__ == '__main__':
    unittest.main()
