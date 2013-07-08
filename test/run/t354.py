class A:
    val1 = "A"

    def __init__(self, v):
        self.val1 = v

    def do(self):
        print self.__class__.val1
        print self.val1

    def update(self, newv):
        self.val1 = newv

print "===A==="
a = A("sa")
a.do()
a.update("sa-new")
a.do()
