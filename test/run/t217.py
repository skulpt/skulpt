class Stuff:
    def blah(self, x, y=False):
        print x,y
s = Stuff()
s.blah("x",y="OK")
