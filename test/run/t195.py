def foo(value = None):
    for i in [-1,0,1,2,3,4]:
        if i < 0:
            continue
        elif i == 0:
            yield 0
        elif i == 1:
            yield 1
            yield value
            yield 2
        else:
            yield i
print list(foo())
