l = ['h','e','l','l','o']

print l.index('l')
print l.index('l', 2)
print l.index('l', 3)
print l.index('l', 2, 3)
print l.index('l', 3, 4)
print l.index('l', 2, -1)
print l.index('l', 2, -2)
print l.index('l', 3, -1)

try:
    print l.index('l', 4)
except ValueError as e:
    print e

try:
    print l.index('l', -1)
except ValueError as e:
    print e

try:
    print l.index('l', 2, 2)
except ValueError as e:
    print e

try:
    print l.index('l', 3, 2)
except ValueError as e:
    print e

try:
    print l.index('l', 3, -2)
except ValueError as e:
    print e

try:
    print l.index('l', 3, 0)
except ValueError as e:
    print e

try:
    print l.index('l', 4.3)
except TypeError as e:
    print e

try:
    print l.index('l', 3, 0.6)
except TypeError as e:
    print e
