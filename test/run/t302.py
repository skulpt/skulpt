# Test that re-setting the value in a dict doesn't mess with its length
d = {'foo':2}
print len(d), d
d['foo'] = 13
print len(d), d
