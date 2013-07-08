class F():
    def __init__(self):
        self.a = 1
        self.b = 2
        self.d = 4

f = F()

print getattr(f,'a')
print getattr(f,'b')
print getattr(f,'c',3)
print getattr(f,'d')
