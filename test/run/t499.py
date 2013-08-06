from e2ga import *

def explain(m):
    print str(m) + " is " + repr(m)
    return m

def showValue(name, m):
    print name + " => " + str(m)
    return m

zero  = Euclidean2(0, 0, 0, 0)
one   = Euclidean2(1, 0, 0, 0)
two   = Euclidean2(2, 0, 0, 0)
i     = Euclidean2(0, 1, 0, 0)
j     = Euclidean2(0, 0, 1, 0)
I     = Euclidean2(0, 0, 0, 1)

blades = [zero, one, two, i, j, I]

sum = one + i + j + I

print "----------"
print "repr"
print "----------"
print repr(zero)
print repr(one)
print repr(two)
print repr(i)
print repr(j)
print repr(I)
print "----------"
print "str"
print "----------"
print str(zero)
print str(one)
print str(two)
print str(i)
print str(j)
print str(I)
print "----------"
print "Addition +"
print "----------"
for a in blades:
    for b in blades:
        showValue(str(a) + " + " + str(b), a + b)
    print ""
print "----------"
print "Addition +="
print "----------"
for a in blades:
    x = Euclidean2(0, 0, 0, 0)
    x += a
    showValue("0 += " + str(a), x)
print ""
print "----------"
print "Subtraction -"
print "----------"
for a in blades:
    for b in blades:
        showValue(str(a) + " - " + str(b), a - b)
    print ""
print "----------"
print "Subtraction -="
print "----------"
for a in blades:
    x = Euclidean2(0, 0, 0, 0)
    x -= a
    showValue("0 -= " + str(a), x)
print ""
print "----------"
print "Multiplication *"
print "----------"
for a in blades:
    for b in blades:
        showValue(str(a) + " * " + str(b), a * b)
    print ""
print "----------"
print "Multiplication *="
print "----------"
for a in blades:
    before = Euclidean2(1, 1, 1, 1)
    after =  Euclidean2(before.w, before.x, before.y, before.xy)
    after *= a
    showValue(str(before) + " *= " + str(a), after)
print ""
print "----------"
print "Division /"
print "----------"
for a in blades:
    for b in blades:
        showValue(str(a) + " / " + str(b), a / b)
    print ""
print "----------"
print "Division /="
print "----------"
for a in blades:
    before = Euclidean2(1, 1, 1, 1)
    after =  Euclidean2(before.w, before.x, before.y, before.xy)
    after /= a
    showValue(str(before) + " /= " + str(a), after)
print ""
print "----------"
print "Extension ^"
print "----------"
for a in blades:
    for b in blades:
        showValue(str(a) + " ^ " + str(b), a ^ b)
    print ""
print "----------"
print "Extension ^="
print "----------"
for a in blades:
    before = Euclidean2(1, 1, 1, 1)
    after =  Euclidean2(before.w, before.x, before.y, before.xy)
    after ^= a
    showValue(str(before) + " ^= " + str(a), after)
print ""
print "----------"
print "Left Contraction <<"
print "----------"
for a in blades:
    for b in blades:
        showValue(str(a) + " << " + str(b), a << b)
    print ""
print "----------"
print "Left Contraction <<="
print "----------"
for a in blades:
    before = Euclidean2(1, 1, 1, 1)
    after =  Euclidean2(before.w, before.x, before.y, before.xy)
    after <<= a
    showValue(str(before) + " <<= " + str(a), after)
print ""
print "----------"
print "Right Contraction >>"
print "----------"
for a in blades:
    for b in blades:
        showValue(str(a) + " >> " + str(b), a >> b)
    print ""
print "----------"
print "Right Contraction >>="
print "----------"
for a in blades:
    before = Euclidean2(1, 1, 1, 1)
    after =  Euclidean2(before.w, before.x, before.y, before.xy)
    after >>= a
    showValue(str(before) + " >>= " + str(a), after)
print ""
