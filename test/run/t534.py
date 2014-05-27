class U(object):
    def __repr__(self): return "<U>"
    def __pos__(self): return 'pos'
    def __neg__(self): return 'neg'
    def __invert__(self): return 'invert'


print U()
print -(U())
print +(U())
print ~(U())

class E(object):
    def __repr__(self): return "<U>"


try: print +E()
except TypeError: print 'no +'
