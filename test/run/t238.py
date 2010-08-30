# using obj[token] in JS doesn't work as a generic string dict
# make sure to use *both* hasOwnProperty and then get it, otherwise object
# builtins will return existence.
def toString():
    print "wee"

class stuff:
    def toString(self):
        return "waa"
    def valueOf(self):
        return "stuff"

toString()
s = stuff()
print s.toString()
print s.valueOf()
