# Test set unions
# sets are un-ordered, though python seems to sort them sometimes...
# hence the testing for equality to known sets rather than printing.
s = set([2,3,4])
t = set([4,5,6])
u = set([1,2,3,4,5])
print s
print t
print u
print '# pair unions'
a = s.union(t)
b = s.union(u)
c = t.union(s)
d = t.union(u)
e = u.union(s)
f = u.union(t)
print a == c
print a == set([2,3,4,5,6])
print b == e
print b == set([1,2,3,4,5])
print d == f
print d == set([1,2,3,4,5,6])

print '# triple unions'
a = s.union(t, u)
b = s.union(u, t)
c = t.union(s, u)
d = t.union(u, s)
e = u.union(s, t)
f = u.union(t, s)

print f
print a == set([1,2,3,4,5,6])
print a == b
print a == c
print a == d
print a == e
print a == f

