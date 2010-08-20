class Wee:
    def __init__(self):
        self.called = False
    def __iter__(self):
        return self
    def next(self):
        print "in next"
        if not self.called:
            self.called = True
            return "dog"
        raise StopIteration

for i in Wee():
    print i
