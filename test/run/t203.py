class Stuff(object):
    def __cmp__(self, rhs):
        print "stuff cmp"
        return 0

class Things(object):
    def __cmp__(self, rhs):
        print "things cmp"
        return 0

class Other(object): pass

Stuff() < Things()
Stuff() <= Things()
Stuff() > Things()
Stuff() >= Things()
Stuff() == Things()
Stuff() != Things()

Things() < Stuff()
Things() <= Stuff()
Things() > Stuff()
Things() >= Stuff()
Things() == Stuff()
Things() != Stuff()

Stuff() < Other()
Stuff() <= Other()
Stuff() > Other()
Stuff() >= Other()
Stuff() == Other()
Stuff() != Other()

Other() < Stuff()
Other() <= Stuff()
Other() > Stuff()
Other() >= Stuff()
Other() == Stuff()
Other() != Stuff()
