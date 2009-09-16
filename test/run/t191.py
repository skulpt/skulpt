def f():
    for i in 1,2,3,4,5:
        if i == 3: break
        yield i 
print list(f())
