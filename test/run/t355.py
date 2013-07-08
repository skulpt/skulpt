class Foo:
    def __init__(self, x):
        self.lst = [x]

    def __eq__(self, other):
        return self.lst == other.lst

f1 = Foo(3)
f2 = Foo(3)
f3 = Foo(4)

print f1 == f1
print f1 == f2
print f1 != f3
print f1 != f2
