def f(a, b, **c):
    sortc = [(x,y) for x,y in c.items()]
    sortc.sort()
    print a, b, sortc

f(1, 2, d=4, e=5)
f(1, b=4, e=5)
f(a=1, b=4, e=5, f=6, g=7)
