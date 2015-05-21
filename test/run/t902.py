import collections

try:
    print collections.defaultdict(1)
except TypeError as e:
    print e

try:
    print collections.defaultdict(list(), {})
except TypeError as e:
    print e

try:
    print collections.defaultdict(list, 12)
except TypeError as e:
    print e

try:
    d = collections.defaultdict(None)
    print d[5]
except KeyError as e:
    print e

try:
    print d.get(5)
except TypeError as e:
    print e

try:
    d.__missing__(1, 2)
except TypeError as e:
    print e

try:
    d.__missing__({1:2})
except KeyError as e:
    print e
