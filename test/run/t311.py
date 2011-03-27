s = set([2,3,4])
t = set([3,4,5])
u = set([1,3,5])

print s

s.intersection_update(t)
u.intersection_update(t)

print s
print u

print s == set([3, 4])
print u == set([3, 5])

t.intersection_update(s, u)
print t
print t == set([3])

