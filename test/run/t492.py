
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

print B(x=1), B(y=2), B(z=3)
print B(x=1,z=3), B(z=3,x=1)
print B(x=1,y=2), B(y=2,x=1)
print B(z=3,y=2), B(y=2,z=3)
print B(z=3,x=1,y=2), B(z=3,y=2,x=1), B(y=2,z=3,x=1), B(y=2,x=1,z=3)
