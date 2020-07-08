class A:
    def __len__(self):
        return 0

print bool(A())

class B:
    def __len__(self):
        return False

print bool(B())

class C:
    def __nonzero__(self):
        return 0

print bool(C())

class D:
    def __nonzero__(self):
        return False

print bool(D())

class E:
    def __len__(self):
        return 1

print bool(E())

class F:
    def __nonzero__(self):
        return 1

print bool(F())

class G:
    def __nonzero__ (self):
        return 0

    def __len__ (self):
        return 1

print bool(G())

print bool(A)
print bool(B)
print bool(C)
print bool(D)
print bool(E)
print bool(F)
print bool(G)