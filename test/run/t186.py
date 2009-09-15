def funky():
    print "cheese"

def gen():
    i = 0
    funky()
    yield 1
    i += 1

g = gen()
print g.next()
