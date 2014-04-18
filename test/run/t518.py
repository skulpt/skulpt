list = [0, 1, 2, 3] 
try:
    print list[1 : : 0]
except ValueError as e:
    print e

try:
    print list[1 : 3 : 0]
except ValueError as e:
    print e
