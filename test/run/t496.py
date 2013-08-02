print str(None)
print repr(None)
print type(None)
print isinstance(None, type(None))
print "hello".split(None)
if None:
    print False
else:
    print None

print "\nin/not in with a list"
print None in [1,2,3]
print None in [1,2,3,None]
print None not in [1,2,3]
print None not in [1,2,3,None]

print "\nin/not in with a dict"
print None in {1:2, 3:4}
print None in {1:2, 3:4, None:5}
print None not in {1:2, 3:4}
print None not in {1:2, 3:4, None:5}

print "\nis/is not"
print None is None
print None is not None
print None is 3
print 3 is None
print None is not 3
print 3 is not None

print "\nboolean comparisons with int"
print 3 == None
print None == 3
print 3 != None
print None != 3
print 3 > None
print 3 >= None
print 3 < None
print 3 <= None
print None > 3
print None >= 3
print None < 3
print None <= 3

print "\nboolean comparisons with long"
print 3L == None
print None == 3L
print 3L != None
print None != 3L
print 3L > None
print 3L >= None
print 3L < None
print 3L <= None
print None > 3L
print None >= 3L
print None < 3L
print None <= 3L

print "\nboolean comparisons with None"
print None == None
print None != None
print None > None
print None >= None
print None < None
print None <= None

# these should throw errors
# print abs(None)
# print chr(None)
# print int(None)
# print float(None)
# print long(None)
