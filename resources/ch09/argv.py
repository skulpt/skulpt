import sys

print "And the command-line arguments are:"

for i in range(len(sys.argv)):
        print "    argument number %d is %s" % (i, sys.argv[i])
