print "formatting with just %d argument" %1

print "%d %i %o %x %X %e %E %f %F" %(12,-12,-0O7,0x4a,-0x4a,2.3e10,2.3E-10,1.23,-1.23)

print "%g %G %g %G" % (.00000123,.00000123,1.4,-1.4)

print "%r is a repr and %s is a string" %("this","this")

print "I can also use a %(structure)s to format." % {'structure':'dictionary'}
