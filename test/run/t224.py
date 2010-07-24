# free and cell vars in y

c = "squirrel"
def x():
    b = "dog"
    print b, c
    def y():
        a = "cat"
        print a,b
        def z():
            return a,b,c
        return z
    return y()
print x()()
