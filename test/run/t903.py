import collections

try:
    print collections.Counter(3)
except TypeError as e:
    print e

c = collections.Counter('hello')

try:
    print c.elements(5)
except TypeError as e:
    print e

try:
    print c.most_common(2, 5)
except TypeError as e:
    print e

try:
    print c.most_common('hello')
except TypeError as e:
    print e

print c.most_common(-5)
print c.most_common(200)

try:
    c.update(1, 3)
except TypeError as e:
    print e

try:
    c.update(13)
except TypeError as e:
    print e

try:
    c.subtract(4, 5)
except TypeError as e:
    print e

try:
    c.subtract(12.4)
except TypeError as e:
    print e
