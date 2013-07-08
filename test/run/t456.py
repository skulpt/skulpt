ctr = 0
def f():
    global ctr
    ctr += 1
    return ctr

lst = range(4)

lst[f()] += 3
print lst
