def foo(x):
    yield len(x)
    yield len(x)

g = foo(range(5))
print g.next()
len = lambda y: 8
print g.next()
