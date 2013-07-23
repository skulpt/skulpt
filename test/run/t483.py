def divide(x, y):
    try:
        result = x / y
    except ZeroDivisionError:
        print "division by zero!"
    else:
        print "result is", result

divide(2, 1)
divide(2, 0)
try:
    divide("2", "1")
except TypeError as e:
    print e
