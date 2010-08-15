def f(n):
    for i in range(n):
        yield i
g = f(5)
print g.next()
print g.next()
print g.next()
print g.next()
