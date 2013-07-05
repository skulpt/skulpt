d = {'x':1,'y':2,'z':3}

def a(x,y,z):
    return x,y,z

print "\nFunction"
print a(1,2,3)
print a(z=3,x=1,y=2), a(z=3,y=2,x=1), a(y=2,z=3,x=1), a(y=2,x=1,z=3)

def b(x=0,y=0,z=0):
    return x,y,z

print "\nFunction with defaults"
print b()
print b(1,2,3)
print b(1), b(2), b(3)
print b(x=1), b(y=2), b(z=3)
print b(x=1,z=3), b(z=3,x=1)
print b(x=1,y=2), b(y=2,x=1)
print b(z=3,y=2), b(y=2,z=3)
print b(z=3,x=1,y=2), b(z=3,y=2,x=1), b(y=2,z=3,x=1), b(y=2,x=1,z=3)

class A():
    def __init__(self,x,y,z):
        self.x = x
        self.y = y
        self.z = z
    def __str__(self):
        return str((self.x,self.y,self.z))

print "\nClass"
print A(1,2,3)

class B():
    def __init__(self,x=0,y=0,z=0):
        self.x = x
        self.y = y
        self.z = z
    def __str__(self):
        return str((self.x,self.y,self.z))

print "\nClass with defaults"
print B()
print B(1,2,3)
print B(1), B(2), B(3)
