
class A(object):
  def __init__(self):
    object.__setattr__(self, "x", 42)

  def __getattr__(self, attr):
    if isinstance(attr, str):
      print "attr is a string, as it should be"

    print "Getting " + attr

    if attr == "y":
      return 41
    else:
      return 43

  def __setattr__(self, attr, value):
    if isinstance(attr, str):
      print "attr is a string, as it should be"

    print "Intercepted attempt to set " + attr + " to " + str(value)


a = A()
print "a.x = " + str(a.x)
print "a.y = " + str(a.y)
print "a.z = " + str(a.z)

a.x = 0
print "a.x = " + str(a.x)
