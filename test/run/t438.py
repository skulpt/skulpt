import math

print "\nmath.ceil(x)"
print math.ceil(0.0) == 0
print math.ceil(-0.1) == 0
print math.ceil(-0.4) == 0
print math.ceil(-0.5) == 0
print math.ceil(-0.9) == 0
print math.ceil(0.1) == 1
print math.ceil(0.4) == 1
print math.ceil(0.5) == 1
print math.ceil(0.9) == 1

print "\nmath.fabs(x)"
print math.fabs(-1) == 1.0
print math.fabs(1) == 1.0
print math.fabs(0) == 0.0

print "\nmath.floor(x)"
print math.floor(0.0) == 0
print math.floor(-0.1) == -1
print math.floor(-0.4) == -1
print math.floor(-0.5) == -1
print math.floor(-0.9) == -1
print math.floor(0.1) == 0
print math.floor(0.4) == 0
print math.floor(0.5) == 0
print math.floor(0.9) == 0

print "\nmath.trunc(x)"
print math.trunc(12.34) == 12
print math.trunc(-12.34) == -12
print math.trunc(5.67e+8) == 567000000
print math.trunc(-5.67e+8) == -567000000
print math.trunc(5.67e-8) == 0
print math.trunc(-5.67e-8) == 0 
