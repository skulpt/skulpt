def test(x,y):
    print x
    return y
test('a', 1) or test('b', 1) and test('c', 0)
