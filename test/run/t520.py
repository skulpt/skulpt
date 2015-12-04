x = any([1,2])
print x, type(x)

y = all([1,2])
print x, type(x)

z = isinstance(5, int)
print z, type(z)

print hash(True), type(hash(True))
print hash(None), type(hash(None))
print hash("hello") > 0, type(hash("hello"))

a = hasattr("hello", "not_a_method")
print a, type(a)
