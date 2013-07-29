print "\nintegers"
print pow(0, 0)
print pow(0, 3)
print pow(12, 0)
print pow(2, 3)
print pow(-2, 3)
print pow(2, -3)
print pow(-2, -3)
print pow(4, 5, 3)
print pow(-4, 5, 3)
print pow(-4, 5, -3)

print "\nlong integers"
print pow(0L, 0L)
print pow(0L, 3L)
print pow(12L, 0L)
print pow(2L, 3L)
print pow(-2L, 3L)
print pow(2L, -3L)
print pow(-2L, -3L)
print pow(4L, 5L, 3L)
print pow(-4L, 5L, 3L)
print pow(-4L, 5L, -3L)

print "\nfloating point"
print pow(0.0, 0.0)
print pow(0.0, 3.1)
print pow(12.0, 0.0)
print pow(2.5, 3.7)

print "\nintegers and long integers"
print pow(2L, 3),  type(pow(2L, 3))
print pow(-2, 3L),  type(pow(-2, 3L))
print pow(2L, -3),  type(pow(2L, -3))
print pow(-2, -3L),  type(pow(-2, -3L))
print pow(2, 3, 5L),  type(pow(2, 3, 5L))
print pow(2, 3L, 5),  type(pow(2, 3L, 5))

print "\nintegers and floating point"
print pow(2.5, 3),  type(pow(2.5, 3))
print pow(2, 3.5),  type(pow(2, 3.5))
print pow(2.5, -3),  type(pow(2.5, -3))
print pow(2, -3.5),  type(pow(2, -3.5))

print "\nfloating point and long integers"
print pow(2.5, 3L),  type(pow(2.5, 3L))
print pow(2L, 3.5),  type(pow(2L, 3.5))
print pow(2.5, -3L),  type(pow(2.5, -3L))
print pow(2L, -3.5),  type(pow(2L, -3.5))

print "\nERROR CHECKING:"
try:
    print pow([1, 2],  '34')
    print "you shouldn't see this"
except TypeError as e:
    print e

try:
    print pow([1, 2],  '34',  5)
    print "you shouldn't see this"
except TypeError as e:
    print e

try:
    print pow(-2.5, 3.7)
    print "you shouldn't see this"
except ValueError as e:
    print e

try:
    print pow(4.0, 5.0, 3)
    print "you shouldn't see this"
except TypeError as e:
    print e

try:
    print pow(4, -3, 2)
    print "you shouldn't see this"
except TypeError as e:
    print e
