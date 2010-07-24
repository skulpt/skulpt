# to avoid constant-izing in python compiler
def doadd(a,b):
    return a+b
def dosub(a,b):
    return a-b
print doadd(123, 12345678987654321)
print doadd(-123, 12345678987654321)
print doadd(-123, -12345678987654321)
print doadd(123, -12345678987654321)
print dosub(123, 12345678987654321)
print dosub(12345678987654321, 123)
print dosub(-12345678987654321, 123)
print dosub(-12345678987654321, -123)
