class O(object): pass
class F(O): pass
class E(O): pass
class D(O): pass
class C(D,F): pass
class B(D,E): pass
class A(B,C): pass

print A.__bases__
print A.__mro__
