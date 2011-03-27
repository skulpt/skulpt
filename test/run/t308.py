s = set([1,2,3])
t = set([3,4,5])
a = s.symmetric_difference(t)
b = t.symmetric_difference(s)
print a
print a == b
print a == set([1,2,4,5])
