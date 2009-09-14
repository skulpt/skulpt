def f():
    y = 0
    while y == 0:
        y += 1
        yield y

for i in f():
    print i
