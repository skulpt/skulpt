# Test the behaviour of sets
l = [1,2,3,4,1,1]
print l
s = set(l)
print s

# Test the addition and removal of items of a clone set
t = set(s)
print len(t), t
print len(s), s
t.add(100)
print len(t), t
print len(s), s
t.discard(2)
print len(t), t
print len(s), s
