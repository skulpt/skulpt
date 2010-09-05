print object.__bases__
print object.__mro__
class X(object): pass
class Y(X): pass
print(X.__bases__)
print(X.__mro__)
print(Y.__bases__)
print(Y.__mro__)
