try:
    print "a" * "b"
except TypeError as e:
    print e

try:
    print "a" * 3.4
except TypeError as e:
    print e

try:
    print 3.4 * "b"
except TypeError as e:
    print e

try:
    print "a" * [2]
except TypeError as e:
    print e

try:
    print [2] * "b"
except TypeError as e:
    print e




