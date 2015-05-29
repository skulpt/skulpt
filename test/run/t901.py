import collections

print collections.Counter()
print collections.Counter('gallahad')
c =  collections.Counter({'red': 4, 'blue': 2})
print c
print c['green']
print c
c['green'] = 0
print c

print
print
x = collections.Counter('hello world!')
print x
for i in 'hello universe!':
    x[i] += 1
print x

l = list(x.elements())
l.sort()
print l

print x.most_common(2)
print x.most_common()

a = collections.Counter({1:6, 2:4, 3:3})
print a
a.subtract({1:5, 2:-2, 4:7})
print a
a.subtract([1, 1])
print a
a.subtract(collections.Counter({1:-8, 3:2}))
print a

a.update({1:5, 2:-2, 4:7})
print a
a.update([1, 1])
print a
a.update(collections.Counter({1:-8, 3:2}))
print a

