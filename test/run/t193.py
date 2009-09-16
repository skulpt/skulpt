def f(l):
    for i in 1,2,3,4,5:
        yield l, i
a, b = f("a"), f("b")
print a.next()
print a.next()
print b.next()
print b.next()
print b.next()
print a.next()
print b.next()
print a.next()
