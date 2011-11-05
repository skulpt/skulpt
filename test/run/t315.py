def default_outside(x=[]):
    return x

a = default_outside()
a.append(1)
print a
b = default_outside()
b.append(2)
print b
