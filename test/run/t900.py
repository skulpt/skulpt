import collections

print collections.defaultdict()
print collections.defaultdict(None)
print collections.defaultdict(None, {})
print collections.defaultdict(None, {1:2})

d = collections.defaultdict(list, {1:2})
print d
print d[1]
print d[2]
d[2].append(5)
print d[2]
print d
print d.default_factory


print d.get(2)


def abc():
    return 6

d = collections.defaultdict(abc)
print d
print d[4]
d[4] += 8
print d


print
print
print
x = {1:2, 4:6}
print x
print x.get(4)
