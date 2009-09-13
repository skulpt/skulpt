def f(n):
    i = 0
    yield i
    i += 1
    j = i
    yield i
    yield j
    j *= 100
    i += j
    yield j
    yield i
    yield n + i

for i in f(10): # i to conflict with body
    j = 999
    print i
