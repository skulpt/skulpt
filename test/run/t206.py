class Stuff:
    def __init__(self):
        self.a = 0
        self.b = 'b'
        self.c = [1,2,3]
        self.d = 100000000000000

s = Stuff()
s.a += 10
s.b += 'dog'
s.c += [9,10]
s.d += 10000

print s.a
print s.b
print s.c
print s.d
