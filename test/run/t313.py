s = set([2,3,4])
t = set([3,4,5])
u = set([1,3,5])

a = s.difference(t)
b = u.difference(s)
c = u.difference(t)

print a
print b
print c

print a == set([2])
print b == set([1,5])
print c == set([1])

d = s.difference(t, u)
print d
print d == set([2])

