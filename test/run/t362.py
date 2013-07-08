def f(x):
    print "f(%s) called" % x
    return True

def g():
    l = []
    if f(3):
        l.append(3)
    print l

g()
