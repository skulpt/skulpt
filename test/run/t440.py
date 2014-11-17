import math

def isCloseTo(expected, actual, precision):
  return math.fabs(expected - actual) < (math.pow(10, -precision) / 2)

print "\nmath.acos(x)"
print math.acos(1.0)
print math.acos(0.5)
print math.acos(0.0)
print math.acos(-0.5)
print math.acos(-1.0)
print math.acos(-1)

print "\nmath.asin(x)"
print math.asin(1.0)
print math.asin(0.5)
print math.asin(0.0)
print math.asin(-0.5)
print math.asin(-1.0)
print math.asin(-1)

print "\nmath.atan(x)"
print math.atan(1.0)
print math.atan(0.5)
print math.atan(0.0)
print math.atan(-0.5)
print math.atan(-1.0)
print math.atan(-1)

print "\nmath.atan2(y,x)"
print math.atan2(1,1)
print math.atan2(1,-1)
print math.atan2(-1,1)
print math.atan2(-1,-1)
print math.atan2(-5.1,6.3)

print "\nmath.cos(x)"
print math.cos(0.0)
print isCloseTo(0, math.cos(math.pi/2.0), 15)
print math.cos(math.pi)
print math.cos(1)

print "\nmath.sin(x)"
print math.sin(0.0)
print math.sin(math.pi/2.0)
print isCloseTo(0, math.sin(math.pi), 15)
print math.sin(1)

print "\nmath.tan(x)"
print math.tan(0.0)
print isCloseTo(0, math.tan(math.pi), 15)
print math.tan(1)

print "\nmath.degrees(x)"
print math.degrees(0.0)
print math.degrees(0.261799387799)
print math.degrees(0.785398163397)
print math.degrees(1.57079632679)
print math.degrees(3.14159265359)
print math.degrees(4.71238898038)
print math.degrees(6.28318530718)
print math.degrees(0)

print "\nmath.radians(x)"
print math.radians(0)
print math.radians(15)
print math.radians(45)
print math.radians(90)
print math.radians(180)
print math.radians(270)
print math.radians(360)
