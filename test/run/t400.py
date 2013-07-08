import random

random.seed(0)

lst = [0,0,0,0,0]
for i in range(1000):
    lst[random.randint(0,4)] += 1
print lst
print sum(lst)
