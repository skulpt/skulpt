c = "squirrel"
time = 0
def x():
    global time
    time += 1
    if time == 1:
        b = "dog"
    else:
        b = "banana"
    print b, c
    def y(d):
        a = "cat"
        print a,b,d
        def z():
            for i in range(10*time):
                yield i,a,b,c,d
        return z
    return y("blorp")
for v in x()():
    print v
for v in x()():
    print v
