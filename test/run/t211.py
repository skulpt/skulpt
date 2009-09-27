class Stuff:
    def __init__(self):
        self.x = lambda: self.things()
    def things(self):
        print "OK"
y = Stuff()
y.x()
