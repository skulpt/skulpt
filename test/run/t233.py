# multiple instances of generator at the same time


def genmaker(a, b):
    z = a*b
    def gen(y):
        for i in range(4):
            yield i,a,b,y,z
    return gen(a*a*b*b)

g1 = genmaker(3, 4)
g2 = genmaker(4, 5)

print g1.next()
print g2.next()
print g1.next()
print g2.next()
print g1.next()
print g2.next()
print g1.next()
print g2.next()
