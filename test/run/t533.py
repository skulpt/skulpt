def foo():
    pass
    
bar = 11

print sorted(globals())

def baz(x):
    print sorted(globals())
    
baz(10)


class MyClass:
    def __init__(self):
        print sorted(globals())
        
y = MyClass()
