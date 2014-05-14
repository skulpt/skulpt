def foo():
    pass
    
bar = 11

print globals()['bar']
print 'foo' in globals()

def baz(x):
    print 'baz' in globals()
    
baz(10)


class MyClass:
    def __init__(self):
        print globals()['__name__']
        print 'MyClass' in globals()
        print type(globals()['baz'])
        
y = MyClass()
