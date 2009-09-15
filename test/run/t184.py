def yrange(n):
    for i in range(n):
        yield i

def zrange(n):
    for y in yrange(n):
        yield y

print list(zrange(5))
