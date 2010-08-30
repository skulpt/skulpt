import goog.math as gm

c1 = gm.Coordinate()
c2 = gm.Coordinate(1)
c3 = gm.Coordinate(1, 2)
print c1.toString()
print c2.toString()
print c3.toString()
c4 = gm.Coordinate(1, 2)
c5 = gm.Coordinate(3, 4)
print gm.Coordinate.equals(c3, c4)
print gm.Coordinate.equals(c3, c5)

c6 = c4.clone()
c7 = c6.clone()
print gm.Coordinate.equals(c6, c7)
print gm.Coordinate.equals(c1, c7)

print gm.Coordinate.distance(c4, c5)
print gm.Coordinate.squaredDistance(c4, c5)
print gm.Coordinate.difference(c4, c5)
print gm.Coordinate.sum(c4, c5)
