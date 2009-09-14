def f(n):
    i = 0
    while i < n:
        yield i
        yield i * 10
        i += 1

for i in f(10):
    print i
