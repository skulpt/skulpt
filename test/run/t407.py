class A(object):
    def __init__(self):
        self.a = 1
        self.b = 2
        self.c = 3

class B(A):
    def __init__(self):
        A.__init__(self)        
        self.d = 4

class C(B):
    def __init__(self):
        B.__init__(self)
    def __dir__(self):
        return ['a','b','c','d']   

print dir(A())
print dir(B())
print dir(C())

