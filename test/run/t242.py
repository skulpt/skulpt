class O(object): pass
class A(O): pass
class B(O): pass
class C(O): pass
class D(O): pass
class E(O): pass
class K1(A,B,C): pass
class K2(D,B,E): pass
class K3(D,A): pass
class Z(K1,K2,K3): pass
print K1.__mro__
print K2.__mro__
print K3.__mro__
print Z.__mro__
