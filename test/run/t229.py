class X: pass
x = X()
print getattr(x, 'wee', 14)
print getattr(X, 'doggy', 'OK')
