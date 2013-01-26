l = list()
print l
l.append(1)
print l
d = dict()
print d
d["zap"] = 1
print d

# Make sure this still works
l2 = list(l)
print l2

l3 = list(d)
print l3

# It would be nice to make this work
# But that would be a separate issue
# d2 = dict(d.items())
# print d2

