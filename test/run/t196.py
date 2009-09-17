def f():
    if 1 == 2:
        yield -1
    elif 1 == 1:
        yield 3
    else:
        yield -1

print list(f())
