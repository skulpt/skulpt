import random

print "\nrandom.seed([x])"
random.seed(1234); print random.random()
random.seed(5678); print random.random()
random.seed('hello'); print random.random()
random.seed((1,2,3,4)); print random.random()
random.seed("world"); print random.random()
random.seed((5,6,7,8)); print random.random()
random.seed(""); print random.random()
random.seed(()); print random.random()

print "\nrandom.randrange([start],stop[,step])"
random.seed(1)
print random.randrange(100)
print random.randrange(90,100)
print random.randrange(10,101,10)

print "\nrandom.randint(a,b)"
print random.randint(1,100)
print random.randint(-10,0)

print "\nrandom.choice(seq)"
print random.choice([1,2,3,4,5])
print random.choice("hello world")
print random.choice((1,2,3,4,5))

print "\nrandom.shuffle(x[,random])"
l = [1,2,3,4,5]
random.shuffle(l); print l
random.shuffle(l); print l
random.shuffle(l); print l
random.shuffle(l); print l
random.shuffle(l); print l

print "\nrandom.random()"
print random.random()
print random.random()
print random.random()
print random.random()
print random.random()
