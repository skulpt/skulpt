# Test that a clone of a list really is distinct
l = [1,2,3]
print l
m = list(l)
print m
m.pop()
print l
print m
