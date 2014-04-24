lst = [3, 6, 2, 1, 0]
lst2 = [1, 2]

print map(bool, lst)

def outer():
    def inner(item):
        return 2 * item
    print map(inner, lst)

outer()

print map(None, lst, lst2)

#filter with builtin functions
print filter(bool, [0,1,"",False,42,[1]])

#reduce with global variables
adder = 100

def add(x, y):
    return x + y + adder

print reduce(add, [3, -7, 1], 100)
