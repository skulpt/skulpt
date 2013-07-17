print float(), type(float(0))

# integers
print float(1), type(float(1))
print float(3/2), type(float(3/2))
print float(123456789L)

# floating point
print float(1.234)
print float(3/2.0)

# strings
print float("12.3")
print float("  0.5 ")
print float("0."+"123456789"*3)
print float("123456789"*3)

# nan and inf
print float('nan')
print float('-nan')
print float('NAN')
print float('-NAN')
print float('+nAn')
print float('inf')
print float('-inf')
print float('INF')
print float('-INF')
print float('+inF')

try:
    print float("734L")
    print "You shouldn't see this."
except ValueError:
    print float("734")
