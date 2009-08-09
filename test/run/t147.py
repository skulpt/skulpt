class A:
    def __init__(self):
        print "at0"
        self.a = 'O'
        self.b = 'x'
    def test(self):
        print "KO"
class B(A):
    def __init__(self):
        print "at1"
        A.__init__(self)
        self.b = 'K'
    def test(self):
        print self.a + self.b
print "at2"
B().test()
print "at3"
