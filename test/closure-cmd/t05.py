import goog.math as gm

v0 = gm.Vec2(10, 12)
print "ctor", v0

v1 = gm.Vec2.randomUnit()
print "randomunit", gm.nearlyEquals(v1.magnitude(), 1.0);

v2 = gm.Vec2.random()
# todo; attr access
#print v2.x >= -1 and v2.x <= 1, v2.y >= -1 and v2.y <= 1

v3 = gm.Vec2.fromCoordinate(gm.Coordinate(4, 5))
print "fromcoord", v3

v4 = v3.clone()
print "clone", v4

print "mag", v4.magnitude()
print "magsq", v4.squaredMagnitude()
v4.scale(.5)
print "scaled", v4
v4.invert()
print "inverted", v4
v4.normalize()
print "normalize", v4, v4.magnitude()

v5 = gm.Vec2(10, 1)
v4.add(v5)
print "add", v5, v4

v6 = gm.Vec2(100, 100)
v4.subtract(v6)
print "sub", v6, v4

v7 = gm.Vec2(100, 200)
v8 = gm.Vec2(100, 100)
print "equals", v6.equals(v7)
print "equals", v6.equals(v8)

print "dist", gm.Vec2.distance(v6, v7)
print "dist", gm.Vec2.distance(v6, v8)
print "distsq", gm.Vec2.squaredDistance(v6, v8)

print "sum", gm.Vec2.sum(v6, v8)
print "diff", gm.Vec2.difference(v6, v8)

print "dot", gm.Vec2.dot(v6, v7)

print "lerp", gm.Vec2.lerp(v8, v7, .25)
