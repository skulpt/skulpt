class A:
    def __nonzero__(self):
        return "not the right value"

try:
    print bool(A())
except TypeError as e:
    print e

class B:
    def __len__(self):
        return "not the right value"

try:
    print bool(B())
except TypeError as e:
    print e
