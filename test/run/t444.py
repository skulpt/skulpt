global a
a = set([])
b = set([])

def A(x):
    a.add(x)

def B(x):
    b.update(a)
    b.add(x)

A(5)
A(6)
B(4)
print
print "a: ",a
print "b: ",b

def C(x):
    global c
    c = set([])
    def D(x):
        if x not in b:        
            c.add(x)
    for n in range(x):
        D(n)
    a.update(c)

C(10)
print
print "a: ",a
print "b: ",b
print "c: ",c

def D(x):
    a.remove(x)
    b.update(a)
    a.intersection_update(c)

D(7)
print
print "a: ",a
print "b: ",b
print "c: ",c

def E(x):
    A(x)
    B(x)
    C(x)
    D(x)

E(10)
print
print "a: ",a
print "b: ",b
print "c: ",c
