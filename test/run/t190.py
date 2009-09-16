def f():
    for i in 1,2,3,4,5:
        if i % 2 == 0: continue
        yield i

print list(f())
