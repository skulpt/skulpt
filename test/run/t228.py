class X:
    def stuff(self):
        pass
x = X()
f = getattr(x, "stuff")
print f
fu = getattr(X, "stuff")
print fu
