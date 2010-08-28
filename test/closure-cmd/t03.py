import goog.math as gm

K = 10000

def main():
    print gm.clamp(408, 10, 100)
    print gm.modulo(-10, 3)
    print gm.lerp(0, 14, 0.25)
    a = 14
    b = 14.0001
    print gm.nearlyEquals(a, b)
    print gm.nearlyEquals(a, b, 0.01)
    print gm.standardAngle(480)
    print gm.toRadians(170)
    print gm.toDegrees(2.967)
    x = gm.angleDx(30, 4)
    y = gm.angleDy(30, 4)
    print x, y
    print x*x + y*y
    print gm.angle(0, 0, 10, 10)
    print gm.angleDifference(30, 40)
    print gm.angleDifference(350, 10)
    print gm.sign(-10), gm.sign(10), gm.sign(0)

    arr1 = [3, 4, 'x', 1, 2, 3]
    arr2 = [1, 3, 5, 'y', 1, 2, 3, 5, 6]
    print gm.longestCommonSubsequence(arr1, arr2)

    def compfn(a, b):
        return a == b
    print gm.longestCommonSubsequence(arr1, arr2, compfn)

    def collectfn(i1, i2):
        return arr1[i1] * arr2[i2] + K
    print gm.longestCommonSubsequence(arr1, arr2, compfn, collectfn)

    # todo; varargs
    #print gm.sum(1, 2, 3, 4)
    #print gm.average(1, 2, 3, 4)
    #print gm.standardDeviation(1, 2, 3, 4)

    print gm.isInt(42)
    print gm.isInt(42.49)

    print gm.isFiniteNumber(422)
    # throws ZeroDivisionError, need another way to get +/-inf
    #print gm.isFiniteNumber(1/0)
    #print gm.isFiniteNumber(-10/0)

main()
