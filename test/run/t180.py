def f(n):
    i = 0
    while i < n:
        yield i
        i = 100
        yield i
        i += 1

for i in f(50):
    print i
