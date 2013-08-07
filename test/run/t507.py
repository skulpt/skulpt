import random

l = [None, float('-inf'), -1, False, 0.1, True, 2.7, 123456789123456789123456789L, float('inf'), {1: 2, 3: 4}, [1, 2, 3], 'hello', (1, 2, 3)]

for x in range(10):
    random.shuffle(l)
    l.sort()
    print l
