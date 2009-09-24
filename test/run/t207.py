class Stuff:
    def __init__(self):
        self.a = 0
        self.b = 'b'
        self.c = [1,2,3]
        self.d = 100000000000000
    def doit(self):
        self.a += 10
        self.b += 'dog'
        self.c += [9,10]
        self.d += 10000

s = Stuff()
s.doit()

print s.a
print s.b
print s.c
print s.d
