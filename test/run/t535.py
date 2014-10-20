
from math import *

def differentiate(f, method, h=1.0E-5):
	if method == 'Forward1':
		def Forward1(x):
			return (f(x+h) -f(x)) / h
		return Forward1
	elif method == 'Backward1':
		def Backward1(x):
			return (f(x) -f(x-h)) / h
		return Backward1

mycos = differentiate(sin, 'Forward1')
mysin = differentiate(mycos, 'Backward1', 1.0E-6)
x = pi
print "%.10f %.10f %.5f %.10f" % (mycos(x), cos(x), mysin(x), -sin(x))

