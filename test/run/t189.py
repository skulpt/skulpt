def f(n):
    yield 1
    a, b = n, n + 1
    yield 2
    yield a
    yield b
a = 9999
b = 9999
for i in f(20):
    print i
