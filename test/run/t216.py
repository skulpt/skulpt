class Stuff:
    def __init__(self):
        def tmp():
            self.things()
        self.x = tmp
    def things(self):
        print "OK"
y = Stuff()
y.x()
