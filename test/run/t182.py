def yrange(n):
    for i in range(n):
        yield i
print list(yrange(5))
