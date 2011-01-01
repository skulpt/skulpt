def f():
    print "in f"
    return 10

def g():
    print "in g"
    return 20

retval = True

def h():
    global retval
    retval = not retval
    return retval

for i in range(3):
    print f() if h() else g()
