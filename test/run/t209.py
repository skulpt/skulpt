class X:
    def __init__(self):
        self.px = 3
    def y(self):
        l = "xyz"
        if len(l) == self.px:
            print "OK"
x = X()
x.y()
