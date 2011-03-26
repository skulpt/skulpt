# Test the behaviour of sets
l = [1,2,3,4,1,1]
print l
s = set(l)

# Test the addition and removal of items
print len(s), s
s.add(100)
print len(s), s
s.discard(2)
print len(s), s
