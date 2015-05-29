import collections
c = collections.Counter("hello world")
print c
c.subtract("hello")
print c
c.subtract()
print c
c.update("hello")
print c
c.update()
print c
