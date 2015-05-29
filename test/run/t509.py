try:
    raise TypeError, "abc"
except TypeError as e:
    print "caught", e

try:
    try:
        raise TypeError("abc")
    except TypeError as e:
        print "caught", e
        raise
except TypeError as e:
    print "caught re-raise: ", e

try:
    raise TypeError
except TypeError as e:
    print "caught", e

try:
    x = TypeError("abc")
    raise x
except TypeError as e:
    print "caught", e
