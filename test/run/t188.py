def f():
    a = "dog"
    print "f", a
    def g():
        a = "cat"
        print "g", a
    g()
    print "f2", a
    def h():
        print "h",a
    h()

f()
