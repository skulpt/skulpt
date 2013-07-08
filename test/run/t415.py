print list()

# lists
l = [1,2,3,4]
print list([])
print list([1,2,3,4])
l2 = list(l)
l[3] = 10
print l, l2

# tuples
t = (1,2,3,4)
print list(())
print list((1,2,3,4))
print list(t)

# dictionaries
d = {1:2,3:4}
print list({})
print list(d)
print list(d.keys())
print list(d.values())
