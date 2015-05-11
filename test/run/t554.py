from time import sleep

class A:
  def __getitem__(self, item):
    if isinstance(item, str):
      print "item is a string, as it should be"

    print "Getting " + item
    return 42

  def __setitem__(self, item, value):
    if isinstance(item, str):
      print "attr is a string, as it should be"

    print "Intercepted attempt to set " + item + " to " + str(value)


a = A()
a["x"] = 0
print "a[\"x\"] = " + str(a["x"])



class B:
  def __getitem__(self, item):
    print "Getting " + item
    sleep(0.01)
    return 42

  def __setitem__(self, item, value):
    print "Intercepted attempt to set " + item + " to " + str(value)
    sleep(0.01)

b = B()
b["x"] = 0
print "b[\"x\"] = " + str(b["x"])

b["x"] += 1
print "b[\"x\"] = " + str(b["x"])

