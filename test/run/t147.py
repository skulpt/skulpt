class A:
    def __init__(self):
        self.a = 'O'
        self.b = 'x'
    def test(self):
        print "KO"
class B(A):
    def __init__(self):
        A.__init__(self)
        self.b = 'K'
    def test(self):
        print self.a + self.b
B().test()
