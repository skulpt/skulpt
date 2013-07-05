print repr(1)
print repr(100L)
print repr(1.5)
print repr([])
print repr([1,2,3,4])
print repr(())
print repr((1,2,3,4))
print repr({})
print repr({1:2,3:4})
print repr('')
print repr('hello world')
print repr(object())

class A(object):
    def __init__(self): pass

print repr(A())

class B:
    def __init__(self): pass
    def __repr__(self): return 'custom repr'

print repr(B())
