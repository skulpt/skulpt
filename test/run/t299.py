# Test the comparison of sets
l = [1,2,3,4,1,1]
print l
s = set(l)
print s

# Test the comparison of sets

print '# self'
print '# forwards'
print s.isdisjoint(s)
print s > s
print s.issuperset(s)
print s >= s
print s == s
print s != s
print s.issubset(s)
print s <= s
print s < s
print '# backwards'
print s.isdisjoint(s)
print s > s
print s.issuperset(s)
print s >= s
print s == s
print s != s
print s.issubset(s)
print s <= s
print s < s
