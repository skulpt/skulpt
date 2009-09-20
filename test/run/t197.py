def f(iter):
    for v in iter:
        print v
f(x*y for x in range(10) for y in range(x))
