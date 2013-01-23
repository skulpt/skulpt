x = "Please make startswith and endswith work"
if x.startswith("Please") :
    print "Starts with Please"
else:
    print "Not good"

if x.endswith("work") :
    print "Ends with work"
else:
    print "Not good"

if x.startswith("please") :
    print "Not good"
else:
    print "Does not start with please"

if x.endswith("please") :
    print "Not good"
else:
    print "Does not end with please"

