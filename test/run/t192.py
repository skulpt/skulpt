def f():
    for i in 1,2,3,4,5:
        if i == 4: return
        yield i
print list(f())
