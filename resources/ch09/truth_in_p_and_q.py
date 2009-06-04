from sys import argv

def truth_table(expression):
    print "\n p      q      %s"  % expression
    length = len( " p      q      %s"  % expression)
    print length*"="

    for p in True, False:
        for q in True, False:
            print "%-7s %-7s %-7s" % (p, q, eval(expression))
    print

if len(argv) != 2:
    print "Invalid input, enter a quoted string containing a boolean"
    print "expression in p and q."
else:
    truth_table(argv[1])
