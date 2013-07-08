import random

random.seed(0)

print "randint"
print random.randint(4, 9)
print random.randint(4, 9)
print random.randint(4, 9)
print random.randint(4, 9)
print random.randint(4, 9)
print random.randint(4, 9)

print "randrange"
print random.randrange(4, 9)
print random.randrange(4, 9)
print random.randrange(4, 9)
print random.randrange(4, 9)
print random.randrange(4, 9)
print random.randrange(4, 9)

print "step -2"
print random.randrange(8, -4, -2)
print random.randrange(8, -4, -2)
print random.randrange(8, -4, -2)
print random.randrange(8, -4, -2)
print random.randrange(8, -4, -2)
print random.randrange(8, -4, -2)
print random.randrange(8, -4, -2)
print random.randrange(8, -4, -2)

print "step 3"
print random.randrange(5, 15, 3)
print random.randrange(5, 15, 3)
print random.randrange(5, 15, 3)
print random.randrange(5, 15, 3)
print random.randrange(5, 15, 3)
print random.randrange(5, 15, 3)
print random.randrange(5, 15, 3)
print random.randrange(5, 15, 3)

print "list"
l = range(9)

print random.choice(l)
random.shuffle(l)
print l
print random.choice(l)
random.shuffle(l)
print l
print random.choice(l)
random.shuffle(l)
print l
print random.choice(l)
random.shuffle(l)
print l
print random.choice(l)
random.shuffle(l)
print l
print random.choice(l)
random.shuffle(l)
print l
print random.choice(l)
random.shuffle(l)
print l
print random.choice(l)
random.shuffle(l)
print l
print random.choice(l)
random.shuffle(l)
print l
