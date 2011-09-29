__author__ = 'bmiller'

def testEqual(actual, expected):
    if type(expected) == int:
        if actual == expected:
            print('.')
            return True
    elif type(expected) == float:
        if abs(actual-expected) < 0.00001:
            print('.')
            return True
    else:
        if actual == expected:
            print('.')
            return True
    print('F')
    return False
