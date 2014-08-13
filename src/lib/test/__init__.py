__author__ = 'bmiller'

def testEqual(actual, expected):
    if type(expected) == type(1):
        if actual == expected:
            print('Pass')
            return True
    elif type(expected) == type(1.11):
        if abs(actual-expected) < 0.00001:
            print('Pass')
            return True
    else:
        if actual == expected:
            print('Pass')
            return True
    print('Test Failed: expected ' + str(expected) + ' but got ' + str(actual))
    return False

def testNotEqual(actual, expected):
    pass

