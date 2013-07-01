def test(i):
    f = 3
    try:
        return f == 5
    except ValueError:
        return True

if test(12) :
    print "Is true"
else:
    print "Is false"


