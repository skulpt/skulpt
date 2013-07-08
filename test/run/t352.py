class Silly:
    def __init__(self, x):
        self.h = x

    def __hash__(self):
        return 3

    def __str__(self):
        return str(self.h)

a = Silly(1)
b = Silly(2)
c = Silly(3)

print hash(a)
print hash(b)
print hash(c)
