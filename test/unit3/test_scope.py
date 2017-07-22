import unittest


class ScopeTests(unittest.TestCase):

    def testSimpleNesting(self):

        def make_adder(x):
            def adder(y):
                return x + y
            return adder

        inc = make_adder(1)
        plus10 = make_adder(10)

        self.assertEqual(inc(1), 2)
        self.assertEqual(plus10(-2), 8)

    # def testExtraNesting(self):
    #
    #     def make_adder2(x):
    #         def extra(): # check freevars passing through non-use scopes
    #             def adder(y):
    #                 return x + y
    #             return adder
    #         return extra()
    #
    #     inc = make_adder2(1)
    #     plus10 = make_adder2(10)
    #
    #     self.assertEqual(inc(1), 2)
    #     self.assertEqual(plus10(-2), 8)

    def testSimpleAndRebinding(self):

        def make_adder3(x):
            def adder(y):
                return x + y
            x = x + 1 # check tracking of assignment to x in defining scope
            return adder

        inc = make_adder3(0)
        plus10 = make_adder3(9)

        self.assertEqual(inc(1), 2)
        self.assertEqual(plus10(-2), 8)

    # def testNestingGlobalNoFree(self):
    #
    #     def make_adder4(): # XXX add exta level of indirection
    #         def nest():
    #             def nest():
    #                 def adder(y):
    #                     return global_x + y # check that plain old globals work
    #                 return adder
    #             return nest()
    #         return nest()
    #
    #     global_x = 1
    #     adder = make_adder4()
    #     self.assertEqual(adder(1), 2)
    #
    #     global_x = 10
    #     self.assertEqual(adder(-2), 8)

    # def testNestingThroughClass(self):
    #
    #     def make_adder5(x):
    #         class Adder:
    #             def __call__(self, y):
    #                 return x + y
    #         return Adder()
    #
    #     inc = make_adder5(1)
    #     plus10 = make_adder5(10)
    #
    #     self.assertEqual(inc(1), 2)
    #     self.assertEqual(plus10(-2), 8)

    def testNestingPlusFreeRefToGlobal(self):

        def make_adder6(x):
            global global_nest_x
            def adder(y):
                return global_nest_x + y
            global_nest_x = x
            return adder

        inc = make_adder6(1)
        plus10 = make_adder6(10)

        self.assertEqual(inc(1), 11) # there's only one global
        self.assertEqual(plus10(-2), 8)

    def testNearestEnclosingScope(self):

        def f(x):
            def g(y):
                x = 42 # check that this masks binding in f()
                def h(z):
                    return x + z
                return h
            return g(2)

        test_func = f(10)
        self.assertEqual(test_func(5), 47)

    # def testMixedFreevarsAndCellvars(self):
    #
    #     def identity(x):
    #         return x
    #
    #     def f(x, y, z):
    #         def g(a, b, c):
    #             a = a + x # 3
    #             def h():
    #                 # z * (4 + 9)
    #                 # 3 * 13
    #                 return identity(z * (b + y))
    #             y = c + z # 9
    #             return h
    #         return g
    #
    #     g = f(1, 2, 3)
    #     h = g(2, 4, 6)
    #     self.assertEqual(h(), 39)

    # def testFreeVarInMethod(self):
    #
    #     def test():
    #         method_and_var = "var"
    #         class Test:
    #             def method_and_var(self):
    #                 return "method"
    #             def test(self):
    #                 return method_and_var
    #             def actual_global(self):
    #                 return str("global")
    #             def str(self):
    #                 return str(self)
    #         return Test()
    #
    #     t = test()
    #     self.assertEqual(t.test(), "var")
    #     self.assertEqual(t.method_and_var(), "method")
    #     self.assertEqual(t.actual_global(), "global")
    #
    #     method_and_var = "var"
    #     class Test:
    #         # this class is not nested, so the rules are different
    #         def method_and_var(self):
    #             return "method"
    #         def test(self):
    #             return method_and_var
    #         def actual_global(self):
    #             return str("global")
    #         def str(self):
    #             return str(self)
    #
    #     t = Test()
    #     self.assertEqual(t.test(), "var")
    #     self.assertEqual(t.method_and_var(), "method")
    #     self.assertEqual(t.actual_global(), "global")

    def testRecursion(self):

        def f(x):
            def fact(n):
                if n == 0:
                    return 1
                else:
                    return n * fact(n - 1)
            if x >= 0:
                return fact(x)
            else:
                raise ValueError("x must be >= 0")

        self.assertEqual(f(6), 720)

    def testLambdas(self):

        f1 = lambda x: lambda y: x + y
        inc = f1(1)
        plus10 = f1(10)
        self.assertEqual(inc(1), 2)
        self.assertEqual(plus10(5), 15)

        # f2 = lambda x: (lambda : lambda y: x + y)()
        # inc = f2(1)
        # plus10 = f2(10)
        # self.assertEqual(inc(1), 2)
        # self.assertEqual(plus10(5), 15)
        #
        # f3 = lambda x: lambda y: global_x + y
        # global_x = 1
        # inc = f3(None)
        # self.assertEqual(inc(2), 3)
        #
        # f8 = lambda x, y, z: lambda a, b, c: lambda : z * (b + y)
        # g = f8(1, 2, 3)
        # h = g(2, 4, 6)
        # self.assertEqual(h(), 18)

    # def testUnboundLocal(self):
    #
    #     def errorInOuter():
    #         print(y)
    #         def inner():
    #             return y
    #         y = 1
    #
    #     def errorInInner():
    #         def inner():
    #             return y
    #         inner()
    #         y = 1
    #
    #     # self.assertRaises(UnboundLocalError, errorInOuter)
    #     self.assertRaises(NameError, errorInInner)

    # def testLeaks(self):
    #
    #     class Foo:
    #         count = 0
    #
    #         def __init__(self):
    #             Foo.count += 1
    #
    #         def __del__(self):
    #             Foo.count -= 1
    #
    #     def f1():
    #         x = Foo()
    #         def f2():
    #             return x
    #         f2()
    #
    #     for i in range(100):
    #         f1()
    #
    #     self.assertEqual(Foo.count, 0)


    # def testLocalsFunction(self):
    #
    #     def f(x):
    #         def g(y):
    #             def h(z):
    #                 return y + z
    #             w = x + y
    #             y += 3
    #             # return locals()
    #         return g
    #
    #     d = f(2)(4)
    #     # self.assertIn('h', d)
    #     del d['h']
    #     # self.assertEqual(d, {'x': 2, 'y': 7, 'w': 6})

    # def testLocalsClass(self):
        # This test verifies that calling locals() does not pollute
        # the local namespace of the class with free variables.  Old
        # versions of Python had a bug, where a free variable being
        # passed through a class namespace would be inserted into
        # locals() by locals() or exec or a trace function.
        #
        # The real bug lies in frame code that copies variables
        # between fast locals and the locals dict, e.g. when executing
        # a trace function.

        # def f(x):
        #     class C:
        #         x = 12
        #         def m(self):
        #             return x
        #         locals()
        #     return C
        #
        # self.assertEqual(f(1).x, 12)
        #
        # def f(x):
        #     class C:
        #         y = x
        #         def m(self):
        #             return x
        #         z = list(locals())
        #     return C
        #
        # varnames = f(1).z
        # self.assertNotIn("x", varnames)
        # self.assertIn("y", varnames)

    # def testLocalsClass_WithTrace(self):
    #     # Issue23728: after the trace function returns, the locals()
    #     # dictionary is used to update all variables, this used to
    #     # include free variables. But in class statements, free
    #     # variables are not inserted...
    #     import sys
    #     self.addCleanup(sys.settrace, sys.gettrace())
    #     sys.settrace(lambda a,b,c:None)
    #     x = 12
    #
    #     class C:
    #         def f(self):
    #             return x
    #
    #     self.assertEqual(x, 12) # Used to raise UnboundLocalError

    # def testBoundAndFree(self):
    #     # var is bound and free in class
    #
    #     def f(x):
    #         class C:
    #             def m(self):
    #                 return x
    #             a = x
    #         return C
    #
    #     inst = f(3)()
    #     self.assertEqual(inst.a, inst.m())

    # def testEvalExecFreeVars(self):
    #
    #     def f(x):
    #         return lambda: x + 1
    #
    #     g = f(3)
    #     self.assertRaises(TypeError, eval, g.__code__)
    #
    #     try:
    #         exec(g.__code__, {})
    #     except TypeError:
    #         pass
    #     else:
    #         self.fail("exec should have failed, because code contained free vars")

    # def testListCompLocalVars(self):
    #
    #     try:
    #         print(bad)
    #     except NameError:
    #         pass
    #     else:
    #         print("bad should not be defined")
    #
    #     def x():
    #         [bad for s in 'a b' for bad in s.split()]
    #
    #     x()
    #     try:
    #         print(bad)
    #     except NameError:
    #         pass

    # def testEvalFreeVars(self):
    #
    #     def f(x):
    #         def g():
    #             x
    #             eval("x + 1")
    #         return g
    #
    #     f(4)()

    # def testFreeingCell(self):
    #     # Test what happens when a finalizer accesses
    #     # the cell where the object was stored.
    #     class Special:
    #         def __del__(self):
    #             nestedcell_get()
    #
    #     inc, dec = f(0)
    #     self.assertEqual(inc(), 1)
    #     self.assertEqual(inc(), 2)
    #     self.assertEqual(dec(), 1)
    #     self.assertEqual(dec(), 0)

    # def testGlobalInParallelNestedFunctions(self):
    #     # A symbol table bug leaked the global statement from one
    #     # function to other nested functions in the same block.
    #     # This test verifies that a global statement in the first
    #     # function does not affect the second function.
    #     local_ns = {}
    #     global_ns = {}
    #     exec("""if 1:
    #         def f():
    #             y = 1
    #             def g():
    #                 global y
    #                 return y
    #             def h():
    #                 return y + 1
    #             return g, h
    #         y = 9
    #         g, h = f()
    #         result9 = g()
    #         result2 = h()
    #         """, local_ns, global_ns)
    #     self.assertEqual(2, global_ns["result2"])
    #     self.assertEqual(9, global_ns["result9"])

    # def testClassNamespaceOverridesClosure(self):
    #     # See #17853.
    #     x = 42
    #     class X:
    #         locals()["x"] = 43
    #         y = x
    #     self.assertEqual(X.y, 43)
    #     class X:
    #         locals()["x"] = 43
    #         del x
    #     self.assertFalse(hasattr(X, "x"))
    #     self.assertEqual(x, 42)

    # def testCellLeak(self):
    #     # Issue 17927.
    #     #
    #     # The issue was that if self was part of a cycle involving the
    #     # frame of a method call, *and* the method contained a nested
    #     # function referencing self, thereby forcing 'self' into a
    #     # cell, setting self to None would not be enough to break the
    #     # frame -- the frame had another reference to the instance,
    #     # which could not be cleared by the code running in the frame
    #     # (though it will be cleared when the frame is collected).
    #     # Without the lambda, setting self to None is enough to break
    #     # the cycle.
    #     class Tester:
    #         def dig(self):
    #             if 0:
    #                 lambda: self
    #             try:
    #                 1/0
    #             except Exception as exc:
    #                 self.exc = exc
    #             self = None  # Break the cycle
    #     tester = Tester()
    #     tester.dig()
    #     ref = weakref.ref(tester)
    #     del tester
    #     self.assertIsNone(ref())


if __name__ == '__main__':
    unittest.main()
