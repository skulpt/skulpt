def f():
    pool = (8, 9)
    print type(pool)
    yield list(pool[i] for i in range(2))
    print type(pool)

print list(f())
