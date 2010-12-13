def f(*a):
    print a

def g(x, *a):
    print x, a

def h(x, y, *a):
    print x, y, a

def i(x, y=4, *a):
    print x, y, a

f()
f(1)
f(1, 2, 3)
g(1)
g(1, 2, 3)
h(1, 2)
h(1, 2, 3)
h(1, 2, 3, 4)
i(1)
i(1, 2, 3)
i(1, 2, 3, 4)
