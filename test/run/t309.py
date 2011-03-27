s = set([1,2,3])
t = set([3,4,5])
s.symmetric_difference_update(t)
t.symmetric_difference_update(s)
print s
print s == t
print s == set([1,2,4,5])
print s == set([1,2,3])
