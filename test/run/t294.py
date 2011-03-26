# Test behaviour of min() and max() on lists and tuples
l = ['b','a','d','c']
m = ['1','0','4','3']
print l
print m
print min(l), max(l)
print min(m), max(m)
print min(l,m), max(l,m)
t = tuple(l)
u = tuple(m)
print t
print min(t), max(t)
print min(u), max(u)
print min(t,u), max(t,u)
