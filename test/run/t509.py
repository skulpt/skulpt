try:
    raise TypeError, "abc"
except TypeError as e:
    print "caught", repr(e)

try:
    try:
        raise TypeError("abc")
    except TypeError as e:
        print "caught", repr(e)
        raise
except TypeError as e:
    print "caught re-raise: ", repr(e)

try:
    raise TypeError
except TypeError as e:
    print "caught", repr(e)

try:
    x = TypeError("abc")
    raise x
except TypeError as e:
    print "caught", repr(e)
