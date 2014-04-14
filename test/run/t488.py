a = [2,1,-4,3,0,6]
a.sort()
print a
b = "rksdubtheynjmpwqzlfiovxgac"
print sorted(b,None,lambda x: ord(x))
c = [2,1,-4,3,0,6]
print sorted(c)
print sorted(c, lambda x, y: y - x);

class Test:
    def __init__(self, id, value):
        self.id = id
        self.value = value
    def __repr__(self):
        return "id: " + str(self.id) + " value: " + self.value

d = [ Test(4, "test"), Test(3, "test"), Test(6, "test"), Test(1, "test"), Test(2, "test"), Test(9, "test"), Test(0, "test") ]
print sorted(d, lambda x, y: y - x, lambda x: x.id, True)

print c
print sorted(c, None, None, True)

c.sort(reverse=True)
print c
c.sort()
print c
c.sort(lambda x, y: y - x, lambda x: pow(x, 2), True)
print c

L = [7, 3, -2, 4]
d = {'a': 5, 'b': 9}

def g(k):
    return d[k]

print(g('a'))
print(sorted(d.keys(), None, g))

print(sorted(d.keys(), None, None))

print(sorted(d.keys(), None, lambda x: d[x]))

def myabs(x):
    return abs(x)

print(sorted(L, None, myabs))
print(sorted(L, None, lambda x: myabs(x)))

print(sorted(L, None, lambda x: abs(x)))

print(sorted(L, None, abs))

print(sorted(L, key=lambda x: -x, reverse=True))

print(sorted(L, key=lambda x: -x))