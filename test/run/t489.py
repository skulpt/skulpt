import random

def makeset(lst):
    result = {}
    for a in lst:
        if not result.has_key(a):
            result[a] = []

        result[a].append(True)
    return result

def sorttest(lst1):
    lst2 = lst1[:]
    lst2.sort()
    assert len(lst1) == len(lst2)
    assert makeset(lst1) == makeset(lst2)
    position = {}
    i = 0
    err = False
    for a in lst1:
        if not position.has_key(a):
            position[a] = []
        position[a].append(i)
        i += 1
    for i in range(len(lst2)-1):
        a, b = lst2[i], lst2[i+1]
        if not a <= b:
            print "resulting list is not sorted"
            err = True
        if a == b:
            if not position[a][0] < position[b][-1]:
                print "not stable"
                err = True
    if err:
        print lst1
        print lst2

for v in range(137):
    up = 1 + int(v * random.random() * 2.7)
    lst1 = [random.randrange(0, up) for i in range(v)]
    sorttest(lst1)
    print "everything's fine"