## tests for operator module

import operator


print operator.lt(1, 2)
print operator.lt(2, 1)

print operator.le(1, 2)
print operator.le(2, 1)
print operator.le(2, 2)

print operator.eq(2, 2)
print operator.eq(3, 2)

print operator.ne(2, 3)
print operator.ne(2, 2)

print operator.ge(2, 1)
print operator.ge(1, 2)
print operator.ge(2, 2)

print operator.gt(2, 1)
print operator.gt(1, 2)

# Not implemented
# print operator.not_("hello")

print operator.truth(True)
print operator.truth(False)
print operator.truth(1)
print operator.truth(0)


print operator.is_("hello", "hello")
print operator.is_("hello", "goodbye")
print operator.is_(1, 1)
print operator.is_(2, 1)

print operator.is_not("hello", "goodbye")
print operator.is_not("hello", "hello")
print operator.is_not(1, 2)
print operator.is_not(1, 1)

print operator.abs(5)
print operator.abs(-5)
print operator.abs(1.1)
print operator.abs(-1.1)

print operator.add(1, 2)
print operator.add(-4, 2)
print operator.add("he", "llo")

print operator.and_(2, 3)
print operator.and_(5, 3)
print operator.and_(-4, 3)

print operator.div(10, 5)
print operator.div(5, 2)
print operator.div(2.2, 2)
print operator.div(-5.0, 2)

print operator.floordiv(10, 5)
print operator.floordiv(5, 2)
print operator.floordiv(2.2, 2)
print operator.floordiv(-5.0, 2)

# Not implemented
# print operator.index("hello")

# Not implemented
# print operator.invert("hello")

print operator.lshift(5, 2)
print operator.lshift(-5, 3)

print operator.mod(10, 5)
print operator.mod(10, 3)
print operator.mod(15, 4)

print operator.mul(2, 1)
print operator.mul(-2, 1)
print operator.mul(2, -1)
print operator.mul(10, 20)

print operator.neg(-5)
print operator.neg(5)
print operator.neg(True)
print operator.neg(False)

print operator.or_(1, 2)
print operator.or_(4, 3)
print operator.or_(5, 2)

print operator.pos(5)
print operator.pos(-5)
print operator.pos(True)
print operator.pos(False)

print operator.pow(2, 2)
print operator.pow(5, 3)

print operator.rshift(5, 2)
print operator.rshift(-5, 3)

print operator.sub(4, 2)
print operator.sub(2, 4)
print operator.sub(-4, 2)

print operator.xor(4, 2)
print operator.xor(8, 5)

print operator.concat("he", "llo")
print operator.concat([1,2,3,4], [5,6,7])
print operator.concat((1,2), (3,4))

l = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9]
s = "hello world"
t = ("a", "b", "c")
d = {1:1, 2:2, 3:3, 4:4, 5:5}

print operator.contains(l, 2)
print operator.contains(l, 30)
print operator.contains(s, "ll")
print operator.contains(s, "z")
print operator.contains(t, "a")
print operator.contains(t, 2)
print operator.contains(d, 3)
print operator.contains(d, 0)

print operator.countOf(l, 9)
print operator.countOf(l, 30)
print operator.countOf(s, "l")
print operator.countOf(t, "a")

operator.delitem(l, 9)
print l

operator.delitem(l, 0)
print l

l = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9]
s = "hello world"
t = ("a", "b", "c")
d = {1:1, 2:2, 3:3, 4:4, 5:5}

print operator.getitem(l, 2)
print operator.getitem(s, 0)
print operator.getitem(t, 1)
print operator.getitem(d, 4)

print operator.indexOf(l, 5)
print operator.indexOf(s, "l")
print operator.indexOf(t, "a")

operator.setitem(l, 0, 10)
print l

operator.setitem(d, 1, 10)
print d

operator.setitem(d, 6, 6)
print d

