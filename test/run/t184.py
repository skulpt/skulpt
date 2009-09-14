def yrange(n):
    for i in range(n):
        yield i

def zrange(n):
    # this 'global' is currently required because the compiler not yet smart
    # enough to tell that 'yrange' is a globally defined function. without the
    # global declaration, yrange accesses will be modified to be part of the
    # generator state, which is of course wrong in this case.
    global yrange
    for y in yrange(n):
        yield y

print list(zrange(5))
