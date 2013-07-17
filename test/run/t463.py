import math

class F():
    def __init__(self):
        self.a = 1
        self.b = 2
        self.d = 4

f = F()

print hasattr(f,'a')
print hasattr(f,'c')
print hasattr(f,'D')

try:
    print hasattr(f,b)
    print "You shouldn't see this."
except:
    print hasattr(f,'b')
print
print hasattr(str,'center');
print hasattr(str,'ljust');
print
print hasattr(math,'pi');
print hasattr(math,'tau');

try:
    print hasattr(math,None);
    print "You shouldn't see this."
except:
    print hasattr(F,'a');
