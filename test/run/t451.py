d1 = {1:2, 3:4}
d2 = {}
d2[1] = 2
d2[3] = 4

print d1[1]
print d2[3]

print 1 in d1
print 2 in d1

print d1 == d2
del d1[3]
print d1 == d2
