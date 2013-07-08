class HasLen:
    def __init__(self, l):
        self.l = l

    def __len__(self):
        return self.l

class SubLen(HasLen):
    def __init__(self, l):
        HasLen.__init__(self, l)
        
class NoLen:
    def __init__(self, l):
        self.l = l

h = HasLen(42)
print len(h)
h2 = SubLen(43)
print len(h2)
h3 = NoLen(44)
print len(h3)
