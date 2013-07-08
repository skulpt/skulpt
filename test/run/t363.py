for x in enumerate(range(3)):
    print x

for i, v in enumerate(range(4, 8)):
    print i, v

for x in enumerate([14, 8, 2, "abc", -7], 2):
    print x

print enumerate

e = enumerate([4, 8, 12], -3)

print e
print repr(e)
print e.next()

d = {e: 3}
print d

for x in e:
    print x

for y in e:
    print y
