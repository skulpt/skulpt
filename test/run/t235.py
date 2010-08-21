import pkga.pkgb.modc
import pkga.pkgb.modc # only one print

print "a name", pkga.__name__
print "a.b name", pkga.pkgb.__name__
print "a.b.c name", pkga.pkgb.modc.__name__
print "stuff", pkga.pkgb.modc.stuff
print "things", pkga.pkgb.modc.things
