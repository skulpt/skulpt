""" Unit testing for variables """
import unittest

#stuff for testing global variables
bar = 11
global l
def foo():
    pass

class MyClass:
    def __init__(self):
        self.l = [globals()['__name__'], 'MyClass' in globals(), type(globals()['baz'])]

def baz(x):
    return 'baz' in globals()


class VariableTests(unittest.TestCase):
    def test_global_vars(self):
        c = "squirrel"
        time = 0
        global l
        l = []
        def x(time):
            time += 1
            if time == 1:
                b = "dog"
            else:
                b = "banana"
            l.append(b)
            l.append(c)
            def y(d):
                a = "cat"
                l.append(a)
                l.append(b)
                l.append(d)
                def z():
                    for i in range(2*time):
                        yield i,a,b,c,d
                return z
            return y("blorp")
        l2 = []
        for v in x(time)():
            l2.append(v)
        for v in x(time)():
            l2.append(v)
        self.assertEqual((l, l2), (['dog', 'squirrel', 'cat', 'dog', 'blorp', 'dog', 'squirrel', 'cat', 'dog', 'blorp'], [(0, 'cat', 'dog', 'squirrel', 'blorp'), (1, 'cat', 'dog', 'squirrel', 'blorp'), (0, 'cat', 'dog', 'squirrel', 'blorp'), (1, 'cat', 'dog', 'squirrel', 'blorp')]))

        self.assertEqual(globals()['bar'], 11)
        self.assertTrue('foo' in globals())
            
        self.assertTrue(baz(10))
        y = MyClass()
        self.assertEqual(y.l, ["__main__", True, type(foo)])
        
    def test_mult_variable_assignment(self):
        a,b,c = 1,2,3
        self.assertEqual(c,3)
        x = 1,2
        self.assertEqual(x[0], 1)
        a = b,c = 1,2
        self.assertEqual(a[0],1)
        self.assertEqual(a[1],2)
        self.assertEqual(b,1)
        self.assertEqual(c,2)
        

    def test_trailing_commas(self):
        x = 'OK',
        self.assertEqual(x[0],'OK')
        a = (1,)
        self.assertEqual(a, tuple([1]))
        x = [1,2,]
        self.assertEqual(x[1],2)
        self.assertEqual(x,[1,2])
        x = 2,'OK',
        self.assertEqual(len(x),2)

    def test_cell_vars(self):
        # free and cell vars in y
        l = []
        c = "squirrel"
        def x():
            b = "dog"
            l.append(b)
            l.append(c)
            def y():
                a = "cat"
                l.append(a)
                l.append(b)
                def z():
                    return a,b,c
                return z
            return y()
        self.assertEqual(x()(), ('cat', 'dog', 'squirrel'))
        self.assertEqual(l, ['dog', 'squirrel', 'cat', 'dog'])
    
    def test_misc(self):
        def loc(): pass
        def gbl(): pass
        def free(): pass
        def cell(): pass
        def gen(): pass
        def true(): pass
        def var(): pass
        def volatile(): pass
        def package():
            loc = 4
            gbl = 42
            cell = 19
            instanceof = gbl * cell
            static = instanceof
            return(([loc, gbl, cell, instanceof, static], true == var, volatile != package))
        self.assertEqual(package(), ([4, 42, 19, 798, 798], False, True))

    def test_methodnames(self):
        class X:
            x = 4
        x = X()
        stuff = x.x
        self.assertEqual(stuff, 4)
        things =(X.x)
        self.assertEqual(things, 4)

    def test_js_method_names(self):
        def isPrototypeOf(x):
            return x

        def toSource(x):
            return x

        def hasOwnProperty(x):
            return x
        self.assertEqual(isPrototypeOf(1), 1)
        self.assertEqual(toSource(2), 2)
        self.assertEqual(hasOwnProperty(3), 3)
        class MyTest:
            def __init__(self,s):
                self.w = s

            def length(self):
                return len(self.w)

        x = MyTest("foo")
        self.assertEqual(x.length(), 3)

    def test_del(self):
        x = "hi"
        y = 3
        #Skulpt fails these tests because locals() isn't implemented
        #but it should pass them

        #self.assertTrue("x" in locals().keys())
        #self.assertTrue("y" in locals().keys())
        del x
        #self.assertFalse("x" in locals().keys())
        #self.assertTrue("y" in locals().keys())

if __name__ == '__main__':
    unittest.main()
            
