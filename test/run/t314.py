s = set([2,3,4])
t = set([3,4,5])
u = set([1,3,5])

print s

s.difference_update(t)
u.difference_update(t)

print s
print u

print s == set([2])
print u == set([1])

s = set([2,3,4])
t = set([3,4,5])

t.difference_update(s, u)
print t
print t == set([5])

