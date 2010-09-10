class A: pass
class B: pass
class C: pass
class D(A): pass
class E(A,B): pass
class F(E,C): pass

a,b,c,d,e,f = A(),B(),C(),D(),E(),F()

print isinstance(a, A)
print isinstance(a, B)
print isinstance(a, C)
print isinstance(a, D)
print isinstance(a, E)
print isinstance(a, F)
print "---"
print isinstance(b, A)
print isinstance(b, B)
print isinstance(b, C)
print isinstance(b, D)
print isinstance(b, E)
print isinstance(b, F)
print "---"
print isinstance(c, A)
print isinstance(c, B)
print isinstance(c, C)
print isinstance(c, D)
print isinstance(c, E)
print isinstance(c, F)
print "---"
print isinstance(d, A)
print isinstance(d, B)
print isinstance(d, C)
print isinstance(d, D)
print isinstance(d, E)
print isinstance(d, F)
print "---"
print isinstance(e, A)
print isinstance(e, B)
print isinstance(e, C)
print isinstance(e, D)
print isinstance(e, E)
print isinstance(e, F)
print "---"
print isinstance(f, A)
print isinstance(f, B)
print isinstance(f, C)
print isinstance(f, D)
print isinstance(f, E)
print isinstance(f, F)
print "---"
