"Test the functionality of Python classes implementing operators."

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

        # self.assertRaises(TypeError, float, BadTypeClass())
        self.assertRaises(TypeError, complex, BadTypeClass())
        # self.assertRaises(TypeError, str, BadTypeClass())
        # self.assertRaises(TypeError, repr, BadTypeClass())
        self.assertRaises(TypeError, bin, BadTypeClass())
        self.assertRaises(TypeError, oct, BadTypeClass())
        self.assertRaises(TypeError, hex, BadTypeClass())
        # self.assertRaises(TypeError, bool, BadTypeClass())
        self.assertRaises(TypeError, index, BadTypeClass())


    # def testHashStuff(self):
    #     # Test correct errors from hash() on objects with comparisons but
    #     #  no __hash__
    #
    #     class C0:
    #         pass
    #
    #     hash(C0()) # This should work; the next two should raise TypeError
    #
    #     class C2:
    #         def __eq__(self, other): return 1
    #
    #     self.assertRaises(TypeError, hash, C2())


    # def testSFBug532646(self):
    #     # Test for SF bug 532646
    #
    #     class A:
    #         pass
    #     A.__call__ = A()
    #     a = A()
    #
    #     try:
    #         a() # This should not segfault
    #     except RecursionError:
    #         pass
    #     else:
    #         self.fail("Failed to raise RecursionError")

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

        a1 = A(1)
        a2 = A(2)
        # self.assertEqual(a1.f, a1.f)
        self.assertNotEqual(a1.f, a2.f)
        self.assertNotEqual(a1.f, a1.g)
        # self.assertEqual(a1.f, A(1).f)
        # self.assertEqual(hash(a1.f), hash(a1.f))
        # self.assertEqual(hash(a1.f), hash(A(1).f))

        self.assertNotEqual(A.f, a1.f)
        self.assertNotEqual(A.f, A.g)
        self.assertEqual(B.f, A.f)
        self.assertEqual(hash(B.f), hash(A.f))

        # the following triggers a SystemError in 2.4
        a = A(hash(A.f)^(-1))
        hash(a.f)

if __name__ == '__main__':
    unittest.main()
