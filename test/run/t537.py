try:
    min(3)
except TypeError:
    print "min(3) raises type error"

try:
    max(3)
except TypeError:
    print "max(3) raises type error"

try:
    min([])
except ValueError:
    print "min([]) raises value error"

try:
    max(tuple())
except ValueError:
    print "max(tuple()) raises value error"

print max(i for i in range(7))
print min(j for j in range(4, 1, -1))
