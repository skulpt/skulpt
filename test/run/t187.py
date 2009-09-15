def gen():
    i = 0
    funky()
    yield 1
    i += 1

def funky():
    print "cheese"

g = gen()
print g.next()
