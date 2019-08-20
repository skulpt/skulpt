""" Unit test for functions"""
import unittest

class FunctionTests(unittest.TestCase):
    def test_variable_assignment(self):
        def test():
            return 1
        x = test
        self.assertEqual(x(), 1)

    def test_output(self):
        def test(x):
            return x
        y = test(1)*2 + test(3)*4 + test(5)*6
        self.assertEqual(y, 44)
        def adder(a,b):
            return a + b
        z = adder(1,1) + adder(1,1)
        self.assertEqual(z, 4)
        def f(x):
            return None
        self.assertRaises(TypeError, lambda x: f(1) + x, 3)

    def test_function_element(self):
        def test():
            return 3
        x = [1, test, 2]
        self.assertEqual(x[1](), 3)

    def test_variable_scope(self):
        X = "OK"
        def test():
            X = 4
            return(X)
        test()
        self.assertEqual(X, "OK")
        a = 4
        def test2(z):
            for i in range(0,a):
                z += i
            return z
        self.assertEqual(test2(1), 7)
        y = "OK"
        def test3(): return y
        self.assertEqual(test3(),"OK")

    def test_global_vars(self):
        def test():
            global x
            x = "OK"
        test()
        self.assertEqual(x, "OK")

    def test_default_args(self):
        def test(y='K',x='Z'): return x + y
        self.assertEqual(test('O'), 'ZO')
        def wee(waa, woo=True, wii=False):
            return [waa, woo, wii]
        self.assertEqual(wee("OK"), ["OK", True, False])
        def wee(waa, woo=False, wii=True):
            return ["OK", waa, woo, wii]
        self.assertEqual(wee("stuff"), ['OK', 'stuff', False, True])
        self.assertEqual(wee("stuff", "dog"), ['OK', 'stuff', 'dog', True])
        self.assertEqual(wee("stuff", "dog", "cat"), ['OK', 'stuff', 'dog', 'cat'])
        self.assertEqual(wee("stuff", wii="lamma"), ['OK', 'stuff', False, 'lamma'])
        self.assertEqual(wee(wii="lamma", waa="pocky"), ['OK', 'pocky', False, 'lamma'])
        self.assertEqual(wee(wii="lamma", waa="pocky", woo="blorp"), ['OK', 'pocky', 'blorp', 'lamma'])
        wee = lambda waa, woo=False, wii=True: ("OK", waa, woo, wii)
        self.assertEqual(wee("stuff"), ('OK', 'stuff', False, True))
        self.assertEqual(wee("stuff", "dog"),('OK', 'stuff', 'dog', True))
        self.assertEqual(wee("stuff", "dog", "cat"),('OK', 'stuff', 'dog', 'cat'))
        self.assertEqual(wee("stuff", wii="lamma"),('OK', 'stuff', False, 'lamma'))
        self.assertEqual(wee(wii="lamma", waa="pocky"),('OK', 'pocky', False, 'lamma'))
        self.assertEqual(wee(wii="lamma", waa="pocky", woo="blorp"),('OK', 'pocky', 'blorp', 'lamma'))
        def default_outside(x=[]):
            return x
        a = default_outside()
        a.append(1)
        self.assertEqual(a, [1])
        b = default_outside()
        b.append(2)
        self.assertEqual(b, [1,2])

        d = {'x':1,'y':2,'z':3}

        def a(x,y,z):
            return x,y,z

        self.assertEqual(a(1,2,3), (1, 2, 3))
        self.assertEqual([a(z=3,x=1,y=2), a(z=3,y=2,x=1), a(y=2,z=3,x=1), a(y=2,x=1,z=3)], [(1, 2, 3), (1, 2, 3), (1, 2, 3), (1, 2, 3)])

        def b(x=0,y=0,z=0):
            return x,y,z

        self.assertEqual(b(), (0, 0, 0))
        self.assertEqual(b(1,2,3), (1, 2, 3))
        self.assertEqual([b(1), b(2), b(3)], [(1, 0, 0), (2, 0, 0), (3, 0, 0)])
        self.assertEqual([b(x=1), b(y=2), b(z=3)], [(1, 0, 0), (0, 2, 0), (0, 0, 3)])
        self.assertEqual([b(x=1,z=3), b(z=3,x=1)], [(1, 0, 3), (1, 0, 3)])
        self.assertEqual([b(x=1,y=2), b(y=2,x=1)], [(1, 2, 0), (1, 2, 0)])
        self.assertEqual([b(z=3,y=2), b(y=2,z=3)], [(0, 2, 3), (0, 2, 3)])
        self.assertEqual([b(z=3,x=1,y=2), b(z=3,y=2,x=1), b(y=2,z=3,x=1), b(y=2,x=1,z=3)], [(1, 2, 3), (1, 2, 3), (1, 2, 3), (1, 2, 3)])

        class A():
            def __init__(self,x,y,z):
                self.x = x
                self.y = y
                self.z = z
            def __str__(self):
                return str((self.x,self.y,self.z))

        self.assertEqual(str(A(1,2,3)), '(1, 2, 3)')

        class B():
            def __init__(self,x=0,y=0,z=0):
                self.x = x
                self.y = y
                self.z = z
            def __str__(self):
                return str((self.x,self.y,self.z))

        self.assertEqual(str(B()), '(0, 0, 0)')
        self.assertEqual(str(B(1,2,3)), '(1, 2, 3)')
        self.assertEqual([str(B(1)), str(B(2)), str(B(3))], ['(1, 0, 0)', '(2, 0, 0)', '(3, 0, 0)'])
        
        class B():
            def __init__(self,x=0,y=0,z=0):
                self.x = x
                self.y = y
                self.z = z
            def __str__(self):
                return str((self.x,self.y,self.z))

        self.assertEqual([str(B(1)), str(B(2)), str(B(3))], ['(1, 0, 0)', '(2, 0, 0)', '(3, 0, 0)'])
        self.assertEqual([str(B(x=1)), str(B(y=2)), str(B(z=3))], ['(1, 0, 0)', '(0, 2, 0)', '(0, 0, 3)'])
        self.assertEqual([str(B(x=1,z=3)), str(B(z=3,x=1))], ['(1, 0, 3)', '(1, 0, 3)'])
        self.assertEqual([str(B(x=1,y=2)), str(B(y=2,x=1))], ['(1, 2, 0)', '(1, 2, 0)'])
        self.assertEqual([str(B(z=3,y=2)), str(B(y=2,z=3))], ['(0, 2, 3)', '(0, 2, 3)'])
        self.assertEqual([str(B(z=3,x=1,y=2)), str(B(z=3,y=2,x=1)), str(B(y=2,z=3,x=1)), str(B(y=2,x=1,z=3))], ['(1, 2, 3)', '(1, 2, 3)', '(1, 2, 3)', '(1, 2, 3)'])
        class MyClass:
            def my_method(self, mandatory_arg, x=0, y=0, **more_args):
                return ["Hello! x = " + str(x), "Hello! bla = " + str(more_args['bla'])]

            def my_method2(self):
                return self.my_method("hi", y=2, bla='from method2')
        k = MyClass()
        self.assertEqual(k.my_method('test', x=5, bla='seven'), ['Hello! x = 5', 'Hello! bla = seven'])
        self.assertEqual(k.my_method2(), ['Hello! x = 0', 'Hello! bla = from method2'])

    def test_variable_number_args(self):
        def f(*a):
            return a

        def g(x, *a):
            return x, a

        def h(x, y, *a):
            return x, y, a

        def i(x, y=4, *a):
            return x, y, a
        self.assertTrue(f() == ())
        self.assertTrue(f(1) == (1,))
        self.assertTrue(f(1, 2, 3) == (1, 2, 3))
        self.assertTrue(g(1) == (1, ()))
        self.assertTrue(g(1, 2, 3) == (1, (2, 3)))
        self.assertTrue(h(1, 2) == (1, 2, ()))
        self.assertTrue(h(1, 2, 3) == (1, 2, (3,)))
        self.assertTrue(h(1, 2, 3, 4) == (1, 2, (3, 4)))
        self.assertTrue(i(1) == (1, 4, ()))
        self.assertTrue(i(1, 2, 3) == (1, 2, (3,)))
        self.assertTrue(i(1, 2, 3, 4) == (1, 2, (3, 4))) 
        def f(a, b, c):
            return a, b, c
        args = [5, 6, 7]
        self.assertEqual(f(*args), (5, 6, 7))
        def f(a, b):
            return (a, b)
        self.assertEqual(f(1, 2), (1, 2))
        self.assertEqual(f(*[1, 2]), (1, 2))
        self.assertEqual(f(*(1, 2)), (1, 2))
        def g(a, b, *c):
            return (a, b, c)
        self.assertEqual(g(1, 2, 3), (1, 2, (3,)))
        self.assertEqual(g(1, 2, 3, 4, 5, 6), (1, 2, (3, 4, 5, 6)))
        self.assertEqual(g(*[1, 2]), (1, 2, ()))
        self.assertEqual(g(*[1, 2, 3, 4]), (1, 2, (3, 4)))
        self.assertEqual(g(*[1, 2, 3, 4, 5, 6, 7]), (1, 2, (3, 4, 5, 6, 7)))
        self.assertEqual(g(*(1, 2, 3, 4, 5, 6, 7)), (1, 2, (3, 4, 5, 6, 7)))
        self.assertEqual(g(1, *[7]), (1, 7, ()))
        self.assertEqual(g(1, *[7, 8, 9]), (1, 7, (8, 9)))
        self.assertEqual(g(1, 2, *(7,)), (1, 2, (7,)))
        self.assertEqual(g(1, 2, 3, *(7, 8, 9)), (1, 2, (3, 7, 8, 9)))

    def test_variable_number_kwargs(self):
        def f(**kw):
            return kw
        self.assertEqual(f(a=4, b=5), {'a': 4, 'b': 5})
        def f(a, b, **c):
            sortc = [(x,y) for x,y in c.items()]
            sortc.sort()
            return (a, b, sortc)
        self.assertEqual(f(1, 2, d=4, e=5),(1, 2, [('d', 4), ('e', 5)]))
        self.assertEqual(f(1, b=4, e=5), (1, 4, [('e', 5)]))
        self.assertEqual(f(a=1, b=4, e=5, f=6, g=7), (1, 4, [('e', 5), ('f', 6), ('g', 7)]))
        def f(a,b,c=10,d=20,*e,**f):
            sortf = [(x,y) for x,y in f.items()]
            sortf.sort()
            return (a,b,c,d,e,sortf)
        self.assertEqual(f(1,2), (1, 2, 10, 20, (), []))
        self.assertEqual(f(1,2,3), (1, 2, 3, 20, (), []))
        self.assertEqual(f(1,2,3,5), (1, 2, 3, 5, (), []))
        self.assertEqual(f(1,2,d=3,c=5), (1, 2, 5, 3, (), []))
        self.assertEqual(f(1,2,e=['x','y','z']), (1, 2, 10, 20, (), [('e', ['x', 'y', 'z'])]))
        self.assertEqual(f(1,2,d=3,c=5,e=['x','y','z']), (1, 2, 5, 3, (), [('e', ['x', 'y', 'z'])]))
        self.assertEqual(f(1,2,3,5,['x','y','z']), (1, 2, 3, 5, (['x', 'y', 'z'],), []))
        self.assertEqual(f(1,2,3,5,['x','y','z'],z=5,y=9), (1, 2, 3, 5, (['x', 'y', 'z'],), [('y', 9), ('z', 5)]))
        self.assertEqual(f(1,2,3,5,['x','y','z'],'blorp','wee',z=5,y=9), (1, 2, 3, 5, (['x', 'y', 'z'], 'blorp', 'wee'), [('y', 9), ('z', 5)]))

    def test_empty_return(self):
        def test(): return
        x = 1
        self.assertEqual(test(), None)

    def test_pass(self):
        def test(): pass
        x = 1
        self.assertEqual(test(), None)

    def test_linebreak(self):
        def test():
            x = "OK"; return x
        self.assertEqual(test(), "OK")

    def test_nested_funcs(self):
        def test():
            def func():
                global x
                x = 3
            func()
        test()
        self.assertEqual(x, 3)

    def test_lambda(self):
        z = lambda x: x
        self.assertEqual(z(4),4)
        self.assertEqual(z("stuff"), "stuff")
        def x():
            y = lambda x,y,z: x*y+z
            return y(5, 10, 15)
        self.assertEqual(x(), 65)
        square = lambda x:x**2
        def test1(f,x):
            return f(x)

        def test2(f,x,y):
            return f(x,y)

        self.assertEqual(square(2), test1(square,2))
        self.assertEqual((lambda x:x+5)(4), test1(lambda x:x+5,4))
        self.assertEqual((lambda x,y:x-y)(5,4), test2(lambda x,y:x-y,5,4))
        self.assertEqual((lambda x,y:x[y]*2)([0,1,2,3,4],4), test2(lambda x,y:x[y]*2,[0,1,2,3,4],4))

        def test3(f,g,x,y):
            return f(x), f(y), g(x,y), g(f(x),f(y)), f(g(x,y)), f(g(y,x))

        f = lambda x:x*27
        g = lambda x,y: y+12*x

        h = lambda x:f(x)
        i = lambda x,y:g(x,y)

        self.assertEqual((f(3),f(4),g(3,4),g(f(3),f(4)),f(g(3,4)),f(g(4,3))), test3(f,g,3,4))
        self.assertEqual(test3(f,g,3,4), test3(h,i,3,4))

        j = lambda lst,num,func:lst[func(lst,num)]*(lambda y:10*y)(num)
        k = lambda x,y:len(x)-y

        def test4(f,x,y,z):
            return f(x,y,z)
        self.assertEqual(j([1,2,3,4,5,6],2,k), test4(j,[1,2,3,4,5,6],2,k))

    def test_iter_input(self):
        def f(iter):
            a = []
            for v in iter:
                a.append(v)
            return a
        self.assertEqual(f(x*y for x in range(10) for y in range(x)), [0, 0, 2, 0, 3, 6, 0, 4, 8, 12, 0, 5, 10, 15, 20, 0, 6, 12, 18, 24, 30, 0, 7, 14, 21, 28, 35, 42, 0, 8, 16, 24, 32, 40, 48, 56, 0, 9, 18, 27, 36, 45, 54, 63, 72])     

    def test_docstring(self):
        class Stuff:
            def __init__(self):
                self.x = 0
            """
            weewaa

            """
            def thing(self):
                return self.x
        self.assertEqual(Stuff().thing(), 0)

    def test_misc(self):
        # using obj[token] in JS doesn't work as a generic string dict
        # make sure to use *both* hasOwnProperty and then get it, otherwise object
        # builtins will return existence.
        def toString():
            return "wee"

        class stuff:
            def toString(self):
                return "waa"
            def valueOf(self):
                return "stuff"
        s = stuff()
        self.assertEqual([toString(), s.toString(), s.valueOf()], ['wee', 'waa', 'stuff']) 

    def test_send(self):
        z = []
        def mygen(upto):
           for i in range(0, upto):
               z.append(i)
               got = yield i
        handle = mygen(3)
        first = True
        a = []
        b = []
        for num in handle:
           a.append(num)
           if first:
               foo = handle.send('sig')
               b.append(foo)
               first = False
        self.assertEqual((a,b,z), ([0, 2], [1], [0, 1, 2]))

    def test_scope_cpython(self):
        '''
        Adapted from http://hg.python.org/cpython/file/936621d33c38/Lib/test/test_scope.py
        '''
        #Skulpt fails a lot of the following tests (commented out), it shouldn't
        # testSimpleNesting
        def make_adder(x):
            def adder(y):
               return x + y
            return adder
            
        inc = make_adder(1)
        plus10 = make_adder(10)
        self.assertEqual(inc(1), 2)
        self.assertEqual(inc(-4), -3)
        self.assertEqual(plus10(8), 18)
        self.assertEqual(plus10(-2), 8)
        # testSimpleAndRebinding 
        def make_adder3(x):
            def adder(y):
                return x + y
            x = x+1 # check tracking of assignment to x in defining scope
            return adder
        inc = make_adder3(0)
        plus10 = make_adder3(9)
        self.assertEqual(inc(1), 2)
        self.assertEqual(inc(-4), -3)
        self.assertEqual(plus10(8), 18)
        self.assertEqual(plus10(-2), 8)
        # testNestingGlobalNoFree
        #Skulpt throws an error on line 370, it shouldn't
##        def make_adder4():  #XXX add extra level of indrection
##            def nest():
##                def nest():
##                    def adder(y):
##                        return global_x + y #check that globals work
##                    return adder
##                return nest()
##            return nest()
##        global_x = 1
##        adder = make_adder4()
##        x = adder(1)
##        self.assertEqual(x, 2)
##        global_x = 10
##        x = adder(-2)
##        self.assertEqual(x, 8)
        # testNestingPlusFreeRefToGlobal
        def make_adder6(x):
            global global_nest_x
            def adder(y):
                return global_nest_x + y
            global_nest_x = x
            return adder
        inc = make_adder6(1)
        self.assertEqual(inc(1), 2)
        self.assertEqual(inc(-4), -3)
        plus10 = make_adder6(10)
        self.assertEqual(plus10(8), 18)
        self.assertEqual(plus10(-2), 8)
        # testNearestEnclosingScope
        def f(x):
            def g(y):
                x = 42 # check that this masks binding in f()
                def h(z):
                    return x + z
                return h
            return g(2)
        test_func = f(10)
        self.assertEqual(test_func(5), 47)
        #Skulpt throws an error in this block as well
##        # testMixedFreevarsAndCellvars
##        def identity(x):
##            return x
##        def f(x,y,z):
##            def g(a,b,c):
##                a = a + x # 3
##                def h():
##                    #z * (4+9)
##                    #3 * 13
##                    return identity(z*(b+y))
##                y = c + z #9
##                return h
##            return g
##        g = f(1,2,3)
##        h = g(2,4,6)
##        self.assertEqual(h(), 39)
        #testFreeVarInMethod
        method_and_var = "var"
        class Test:
            # this class is not nested, so the rules are different
            def method_and_var(self):
                return "method"
            def test(self):
                return method_and_var
            def actual_global(self):
                return str("global")
            def str(self):
                return str(self)

        t = Test()
        self.assertEqual(t.test(), "var")
        self.assertEqual(t.method_and_var(), "method")
        self.assertEqual(t.actual_global(), "global")
        #Skulpt throws an error in this block as well
##        # testRecursion
##        def f(x):
##            def fact(n):
##                if n == 0:
##                    return 1
##                else:
##                    return n * fact(n-1)
##            if x>=0:
##                return fact(x)
##            else:
##                raise ValueError
##        self.assertEqual(f(6), 720)
##        # testLambdas
##        f1 = lambda x: lambda y: x + y
##        inc = f1(1)
##        plus10 = f1(10)
##        self.assertEqual(inc(1), 2)
##        self.assertEqual(inc(-4), -3)
##        self.assertEqual(plus10(8), 18)
##        self.assertEqual(plus10(-2), 8)
##        f3 = lambda x: lambda y: global_x + y
##        global_x = 1
##        inc = f3(None)
##        self.assertEqual(inc(2), 3)

if __name__ == '__main__':
    unittest.main()
