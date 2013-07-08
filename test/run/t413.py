print "EVALUATE TO TRUE"
print isinstance('hello',str)
print isinstance(1234,int)
print isinstance(56L,long)
print isinstance(7.89,float)

class A:
    def __init__(self): pass

class B(A):
    def __init__(self): pass

class C(B):
    def __init__(self): pass

class D:
    def __init__(self): pass

a = A()

print isinstance(a,A)
print isinstance(A(),A)
print isinstance(B(),A)
print isinstance(C(),A)
print isinstance(C(),(D,A))

print "EVALUATE TO FALSE"
print isinstance(D(),A)
print isinstance(A(),(B,C))
print isinstance(A(),(D,(B,C)))
print isinstance('hello',int)
