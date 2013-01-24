f = 2.515
g = round(f)
# Deal with skulpt not printing whole floats with a ".0"
if ( g == 3.0 ) :
    print "3.0"
else :
    print g
g = round(f,1)
print g
g = round(f,2)
print g
g = round(f,3)
print g
g = round(f,4)
print g

