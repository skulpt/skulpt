l = [1,2,3,4]
t = (1,2,3,4)
d = {1:2,3:4}

# lists
print "\nlists"
print sum([])
print sum([],5)
print sum([1,2,3,4])
print sum(l,5)

# tuples
print "\ntuples"
print sum(())
print sum((),5)
print sum((1,2,3,4))
print sum(t,5)

# dictionaries
print "\ndictionaries"
print sum({})
print sum({},5)
print sum({1:2,3:4})
print sum(d.keys())
print sum(d.values())
print sum(d,5)
