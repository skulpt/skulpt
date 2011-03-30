s = set([2,3,4])
t = set([3,4,5])
u = set([1,3,5])

a = s.intersection(t)
b = u.intersection(s)
c = u.intersection(t)

print a
print b
print c

print a == set([3, 4])
print b == set([3])
print c == set([3, 5])

d = s.intersection(t, u)
print d
print d == set([3])

