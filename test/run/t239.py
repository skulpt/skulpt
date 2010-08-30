class Base(object):
    def myfunc(self):
        print "Base.myfunc"

    def stuff(self):
        print "Base.stuff"
        self.myfunc()

class Derived(Base):
    def myfunc(self):
        Base.myfunc(self)
        print "Derived.myfunc"

d = Derived()
d.myfunc()

b = Derived()
b.stuff()
