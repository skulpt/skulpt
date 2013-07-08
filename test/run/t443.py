'''
Adapted from http://hg.python.org/cpython/file/936621d33c38/Lib/test/test_scope.py
'''

# testSimpleNesting
print "\ntestSimpleNesting"
def make_adder(x):
    def adder(y):
       return x + y
    return adder
    
inc = make_adder(1)
plus10 = make_adder(10)

print inc(1), 2, inc(1)==2
print inc(-4), -3, inc(-4)==-3
print plus10(8), 18, plus10(8)==18
print plus10(-2), 8, plus10(-2)==8

# testSimpleAndRebinding 
print "\ntestSimpleAndRebinding"
def make_adder3(x):
    def adder(y):
        return x + y
    x = x+1 # check tracking of assignment to x in defining scope
    return adder

inc = make_adder3(0)
plus10 = make_adder3(9)

print inc(1), 2, inc(1)==2
print inc(-4), -3, inc(-4)==-3
print plus10(8), 18, plus10(8)==18
print plus10(-2), 8, plus10(-2)==8

# testNestingGlobalNoFree
print "\ntestNestingGlobalNoFree"
def make_adder4():  #XXX add extra level of indrection
    def nest():
        def nest():
            def adder(y):
                return global_x + y #check that globals work
            return adder
        return nest()
    return nest()

global_x = 1
adder = make_adder4()
x = adder(1)
print x, 2, x == 2

global_x = 10
x = adder(-2)
print x, 8, x == 8

# testNestingPlusFreeRefToGlobal
print "\ntestNestingPlusFreeRefToGlobal"

def make_adder6(x):
    global global_nest_x
    def adder(y):
        return global_nest_x + y
    global_nest_x = x
    return adder

inc = make_adder6(1)
print inc(1), 2, inc(1)==2
print inc(-4), -3, inc(-4)==-3

plus10 = make_adder6(10)
print plus10(8), 18, plus10(8)==18
print plus10(-2), 8, plus10(-2)==8

# testNearestEnclosingScope
print "\ntestNearestEnclosingScope"

def f(x):
    def g(y):
        x = 42 # check that this masks binding in f()
        def h(z):
            return x + z
        return h
    return g(2)

test_func = f(10)
print test_func(5), 47, test_func(5)==47

# testMixedFreevarsAndCellvars
print "\ntestMixedFreevarsAndCellvars"

def identity(x):
    return x

def f(x,y,z):
    def g(a,b,c):
        a = a + x # 3
        def h():
            #z * (4+9)
            #3 * 13
            return identity(z*(b+y))
        y = c + z #9
        return h
    return g

g = f(1,2,3)
h = g(2,4,6)
print h(), 39, h() == 39

#testFreeVarInMethod
print "\ntestFreeVarInMethod"

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
print t.test(), "var", t.test() == "var"
print t.method_and_var(), "method", t.method_and_var() == "method"
print t.actual_global(), "global", t.actual_global() == "global"

# testRecursion
print "\ntestRecursion"

def f(x):
    def fact(n):
        if n == 0:
            return 1
        else:
            return n * fact(n-1)
    if x>=0:
        return fact(x)
    else:
        raise ValueError, "x must be >=0"

print f(6), 720, f(6)==720

# testLambdas
print "\ntestLambdas"

f1 = lambda x: lambda y: x + y
inc = f1(1)
plus10 = f1(10)

print inc(1), 2, inc(1)==2
print inc(-4), -3, inc(-4)==-3
print plus10(8), 18, plus10(8)==18
print plus10(-2), 8, plus10(-2)==8

f3 = lambda x: lambda y: global_x + y
global_x = 1
inc = f3(None)
print inc(2), 3, inc(2) == 3

