# Test the comparison of sets
l = [1,2,3,4,1,1]
print l
s = set(l)
print s

print '# equal'
eq = set(l)

print eq

print '# forwards'
print s.isdisjoint(eq)
print s > eq
print s.issuperset(eq)
print s >= eq
print s == eq
print s != eq
print s.issubset(eq)
print s <= eq
print s < eq
print '# backwards'
print eq.isdisjoint(s)
print eq > s
print eq.issuperset(s)
print eq >= s
print eq == s
print eq != s
print eq.issubset(s)
print eq <= s
print eq < s
