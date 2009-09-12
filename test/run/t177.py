def f():
    yield 1
    yield 2
g = f()
print g.next()
print g.next()
for i in f():
    print i
