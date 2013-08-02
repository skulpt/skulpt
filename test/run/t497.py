def helper(x, y):
    print
    print 'compare', x, 'and', y
    print x is y, x is not y
    print x == y, x != y
    print x < y, x <= y
    print x > y, x >= y

helper(None, None)
helper(None, True)
helper(None, False)

helper(True, True)
helper(True, False)
helper(True, None)

helper(False, False)
helper(False, True)
helper(False, None)
