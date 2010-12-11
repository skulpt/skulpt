class X: pass
x = X()

methodName = "wee"
try:
    stuff = getattr(x, methodName)
except AttributeError:
    raise ValueError, "no such method in %s: %s" % (x.__class__, methodName)
