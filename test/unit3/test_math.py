# Python test set -- math module
# XXXX Should not do tests around zero only

import unittest
import math
import sys

eps = 1E-05
NAN = float('nan')
INF = float('inf')
NINF = float('-inf')

# detect evidence of double-rounding: fsum is not always correctly
# rounded on machines that suffer from double rounding.
x, y = 1e16, 2.9999 # use temporary values to defeat peephole optimizer
HAVE_DOUBLE_ROUNDING = (x + y == 1e16 + 4)



# def to_ulps(x):
#     """Convert a non-NaN float x to an integer, in such a way that
#     adjacent floats are converted to adjacent integers.  Then
#     abs(ulps(x) - ulps(y)) gives the difference in ulps between two
#     floats.
#
#     The results from this function will only make sense on platforms
#     where native doubles are represented in IEEE 754 binary64 format.
#
#     Note: 0.0 and -0.0 are converted to 0 and -1, respectively.
#     """
#     n = struct.unpack('<q', struct.pack('<d', x))[0]
#     if n < 0:
#         n = ~(n+2**63)
#     return n


def ulp(x):
    """Return the value of the least significant bit of a
    float x, such that the first float bigger than x is x+ulp(x).
    Then, given an expected result x and a tolerance of n ulps,
    the result y should be such that abs(y-x) <= n * ulp(x).
    The results from this function will only make sense on platforms
    where native doubles are represented in IEEE 754 binary64 format.
    """
    x = abs(float(x))
    if math.isnan(x) or math.isinf(x):
        return x

    # # Find next float up from x.
    # n = struct.unpack('<q', struct.pack('<d', x))[0]
    # x_next = struct.unpack('<d', struct.pack('<q', n + 1))[0]
    # if math.isinf(x_next):
    #     # Corner case: x was the largest finite float. Then it's
    #     # not an exact power of two, so we can take the difference
    #     # between x and the previous float.
    #     x_prev = struct.unpack('<d', struct.pack('<q', n - 1))[0]
    #     return x - x_prev
    # else:
    #     return x_next - x

# Here's a pure Python version of the math.factorial algorithm, for
# documentation and comparison purposes.
#
# Formula:
#
#   factorial(n) = factorial_odd_part(n) << (n - count_set_bits(n))
#
# where
#
#   factorial_odd_part(n) = product_{i >= 0} product_{0 < j <= n >> i; j odd} j
#
# The outer product above is an infinite product, but once i >= n.bit_length,
# (n >> i) < 1 and the corresponding term of the product is empty.  So only the
# finitely many terms for 0 <= i < n.bit_length() contribute anything.
#
# We iterate downwards from i == n.bit_length() - 1 to i == 0.  The inner
# product in the formula above starts at 1 for i == n.bit_length(); for each i
# < n.bit_length() we get the inner product for i from that for i + 1 by
# multiplying by all j in {n >> i+1 < j <= n >> i; j odd}.  In Python terms,
# this set is range((n >> i+1) + 1 | 1, (n >> i) + 1 | 1, 2).

def count_set_bits(n):
    """Number of '1' bits in binary expansion of a nonnnegative integer."""
    return 1 + count_set_bits(n & n - 1) if n else 0

def partial_product(start, stop):
    """Product of integers in range(start, stop, 2), computed recursively.
    start and stop should both be odd, with start <= stop.

    """
    numfactors = (stop - start) >> 1
    if not numfactors:
        return 1
    elif numfactors == 1:
        return start
    else:
        mid = (start + numfactors) | 1
        return partial_product(start, mid) * partial_product(mid, stop)

def ulp_abs_check(expected, got, ulp_tol, abs_tol):
    """Given finite floats `expected` and `got`, check that they're
    approximately equal to within the given number of ulps or the
    given absolute tolerance, whichever is bigger.

    Returns None on success and an error message on failure.
    """
    # ulp_error = abs(to_ulps(expected) - to_ulps(got))
    abs_error = abs(expected - got)

    # Succeed if either abs_error <= abs_tol or ulp_error <= ulp_tol.
    # if abs_error <= abs_tol or ulp_error <= ulp_tol:
    #     return None
    # else:
    #     fmt = ("error = {:.3g} ({:d} ulps); "
    #            "permitted error = {:.3g} or {:d} ulps")
    #     return fmt.format(abs_error, ulp_error, abs_tol, ulp_tol)

def result_check(expected, got, ulp_tol=5, abs_tol=0.0):
    # Common logic of MathTests.(ftest, test_testcases, test_mtestcases)
    """Compare arguments expected and got, as floats, if either
    is a float, using a tolerance expressed in multiples of
    ulp(expected) or absolutely (if given and greater).

    As a convenience, when neither argument is a float, and for
    non-finite floats, exact equality is demanded. Also, nan==nan
    as far as this function is concerned.

    Returns None on success and an error message on failure.
    """

    # Check exactly equal (applies also to strings representing exceptions)
    if got == expected:
        return None

    failure = "not equal"

    # Turn mixed float and int comparison (e.g. floor()) to all-float
    if isinstance(expected, float) and isinstance(got, int):
        got = float(got)
    elif isinstance(got, float) and isinstance(expected, int):
        expected = float(expected)

    if isinstance(expected, float) and isinstance(got, float):
        if math.isnan(expected) and math.isnan(got):
            # Pass, since both nan
            failure = None
        elif math.isinf(expected) or math.isinf(got):
            # We already know they're not equal, drop through to failure
            pass
        else:
            # Both are finite floats (now). Are they close enough?
            failure = ulp_abs_check(expected, got, ulp_tol, abs_tol)

    # arguments are not equal, and if numeric, are too far apart
    if failure is not None:
        fail_fmt = "expected {!r}, got {!r}"
        fail_msg = fail_fmt.format(expected, got)
        fail_msg += ' ({})'.format(failure)
        return fail_msg
    else:
        return None

# Class providing an __index__ method.
class MyIndexable(object):
    def __init__(self, value):
        self.value = value

    def __index__(self):
        return self.value

class MathTests(unittest.TestCase):

    def ftest(self, name, got, expected, ulp_tol=5, abs_tol=0.0):
        """Compare arguments expected and got, as floats, if either
        is a float, using a tolerance expressed in multiples of
        ulp(expected) or absolutely, whichever is greater.

        As a convenience, when neither argument is a float, and for
        non-finite floats, exact equality is demanded. Also, nan==nan
        in this function.
        """
        failure = result_check(expected, got, ulp_tol, abs_tol)
        if failure is not None:
            self.fail("{}: {}".format(name, failure))

    def testConstants(self):
        # Ref: Abramowitz & Stegun (Dover, 1965)
        self.ftest('pi', math.pi, 3.141592653589793238462643)
        self.ftest('e', math.e, 2.718281828459045235360287)
        # self.assertEqual(math.tau, 2*math.pi)

    def testAcos(self):
        self.assertRaises(TypeError, math.acos)
        self.ftest('acos(-1)', math.acos(-1), math.pi)
        self.ftest('acos(0)', math.acos(0), math.pi/2)
        self.ftest('acos(1)', math.acos(1), 0)
        # self.assertRaises(ValueError, math.acos, INF)
        # self.assertRaises(ValueError, math.acos, NINF)
        # self.assertRaises(ValueError, math.acos, 1 + eps)
        # self.assertRaises(ValueError, math.acos, -1 - eps)
        self.assertTrue(math.isnan(math.acos(NAN)))

    def testAcosh(self):
        self.assertRaises(TypeError, math.acosh)
        self.ftest('acosh(1)', math.acosh(1), 0)
        # self.ftest('acosh(2)', math.acosh(2), 1.3169578969248168)
        # self.assertRaises(ValueError, math.acosh, 0)
        # self.assertRaises(ValueError, math.acosh, -1)
        self.assertEqual(math.acosh(INF), INF)
        # self.assertRaises(ValueError, math.acosh, NINF)
        self.assertTrue(math.isnan(math.acosh(NAN)))
        self.assertEqual(math.acosh(2), 1.3169578969248166)
        self.assertAlmostEqual(math.acosh(1.2), 0.6223625037147786, 15)

    def testAsin(self):
        self.assertRaises(TypeError, math.asin)
        self.ftest('asin(-1)', math.asin(-1), -math.pi/2)
        self.ftest('asin(0)', math.asin(0), 0)
        self.ftest('asin(1)', math.asin(1), math.pi/2)
        # self.assertRaises(ValueError, math.asin, INF)
        # self.assertRaises(ValueError, math.asin, NINF)
        # self.assertRaises(ValueError, math.asin, 1 + eps)
        # self.assertRaises(ValueError, math.asin, -1 - eps)
        self.assertTrue(math.isnan(math.asin(NAN)))

    def testAsinh(self):
        self.assertRaises(TypeError, math.asinh)
        self.ftest('asinh(0)', math.asinh(0), 0)
        self.ftest('asinh(1)', math.asinh(1), 0.88137358701954305)
        self.ftest('asinh(-1)', math.asinh(-1), -0.88137358701954305)
        self.assertEqual(math.asinh(INF), INF)
        # self.assertEqual(math.asinh(NINF), NINF)
        self.assertTrue(math.isnan(math.asinh(NAN)))
        self.assertEqual(math.asinh(2), 1.4436354751788103)
        self.assertAlmostEqual(math.asinh(-7.5), -2.712465305184344, 14)
        self.assertEqual(math.asinh(0), 0.0)

    def testAtan(self):
        self.assertRaises(TypeError, math.atan)
        self.ftest('atan(-1)', math.atan(-1), -math.pi/4)
        self.ftest('atan(0)', math.atan(0), 0)
        self.ftest('atan(1)', math.atan(1), math.pi/4)
        self.ftest('atan(inf)', math.atan(INF), math.pi/2)
        self.ftest('atan(-inf)', math.atan(NINF), -math.pi/2)
        self.assertTrue(math.isnan(math.atan(NAN)))

    def testAtanh(self):
        self.assertRaises(TypeError, math.atan)
        self.ftest('atanh(0)', math.atanh(0), 0)
        self.ftest('atanh(0.5)', math.atanh(0.5), 0.54930614433405489)
        self.ftest('atanh(-0.5)', math.atanh(-0.5), -0.54930614433405489)
        # self.assertRaises(ValueError, math.atanh, 1)
        # self.assertRaises(ValueError, math.atanh, -1)
        # self.assertRaises(ValueError, math.atanh, INF)
        # self.assertRaises(ValueError, math.atanh, NINF)
        self.assertTrue(math.isnan(math.atanh(NAN)))
        self.assertAlmostEqual(math.atanh(-0.2), -0.2027325540540822, 15)
        self.assertEqual(math.atanh(0), 0.0)
        self.assertAlmostEqual(math.atanh(0.5), 0.5493061443340549, 15)

    def testAtan2(self):
        self.assertRaises(TypeError, math.atan2)
        self.ftest('atan2(-1, 0)', math.atan2(-1, 0), -math.pi/2)
        self.ftest('atan2(-1, 1)', math.atan2(-1, 1), -math.pi/4)
        self.ftest('atan2(0, 1)', math.atan2(0, 1), 0)
        self.ftest('atan2(1, 1)', math.atan2(1, 1), math.pi/4)
        self.ftest('atan2(1, 0)', math.atan2(1, 0), math.pi/2)

        # math.atan2(0, x)
        self.ftest('atan2(0., -inf)', math.atan2(0., NINF), math.pi)
        self.ftest('atan2(0., -2.3)', math.atan2(0., -2.3), math.pi)
        self.ftest('atan2(0., -0.)', math.atan2(0., -0.), math.pi)
        self.assertEqual(math.atan2(0., 0.), 0.)
        self.assertEqual(math.atan2(0., 2.3), 0.)
        self.assertEqual(math.atan2(0., INF), 0.)
        self.assertTrue(math.isnan(math.atan2(0., NAN)))
        # math.atan2(-0, x)
        self.ftest('atan2(-0., -inf)', math.atan2(-0., NINF), -math.pi)
        self.ftest('atan2(-0., -2.3)', math.atan2(-0., -2.3), -math.pi)
        self.ftest('atan2(-0., -0.)', math.atan2(-0., -0.), -math.pi)
        self.assertEqual(math.atan2(-0., 0.), -0.)
        self.assertEqual(math.atan2(-0., 2.3), -0.)
        self.assertEqual(math.atan2(-0., INF), -0.)
        self.assertTrue(math.isnan(math.atan2(-0., NAN)))
        # math.atan2(INF, x)
        self.ftest('atan2(inf, -inf)', math.atan2(INF, NINF), math.pi*3/4)
        self.ftest('atan2(inf, -2.3)', math.atan2(INF, -2.3), math.pi/2)
        self.ftest('atan2(inf, -0.)', math.atan2(INF, -0.0), math.pi/2)
        self.ftest('atan2(inf, 0.)', math.atan2(INF, 0.0), math.pi/2)
        self.ftest('atan2(inf, 2.3)', math.atan2(INF, 2.3), math.pi/2)
        self.ftest('atan2(inf, inf)', math.atan2(INF, INF), math.pi/4)
        self.assertTrue(math.isnan(math.atan2(INF, NAN)))
        # math.atan2(NINF, x)
        self.ftest('atan2(-inf, -inf)', math.atan2(NINF, NINF), -math.pi*3/4)
        self.ftest('atan2(-inf, -2.3)', math.atan2(NINF, -2.3), -math.pi/2)
        self.ftest('atan2(-inf, -0.)', math.atan2(NINF, -0.0), -math.pi/2)
        self.ftest('atan2(-inf, 0.)', math.atan2(NINF, 0.0), -math.pi/2)
        self.ftest('atan2(-inf, 2.3)', math.atan2(NINF, 2.3), -math.pi/2)
        self.ftest('atan2(-inf, inf)', math.atan2(NINF, INF), -math.pi/4)
        self.assertTrue(math.isnan(math.atan2(NINF, NAN)))
        # math.atan2(+finite, x)
        self.ftest('atan2(2.3, -inf)', math.atan2(2.3, NINF), math.pi)
        self.ftest('atan2(2.3, -0.)', math.atan2(2.3, -0.), math.pi/2)
        self.ftest('atan2(2.3, 0.)', math.atan2(2.3, 0.), math.pi/2)
        self.assertEqual(math.atan2(2.3, INF), 0.)
        self.assertTrue(math.isnan(math.atan2(2.3, NAN)))
        # math.atan2(-finite, x)
        self.ftest('atan2(-2.3, -inf)', math.atan2(-2.3, NINF), -math.pi)
        self.ftest('atan2(-2.3, -0.)', math.atan2(-2.3, -0.), -math.pi/2)
        self.ftest('atan2(-2.3, 0.)', math.atan2(-2.3, 0.), -math.pi/2)
        self.assertEqual(math.atan2(-2.3, INF), -0.)
        self.assertTrue(math.isnan(math.atan2(-2.3, NAN)))
        # math.atan2(NAN, x)
        self.assertTrue(math.isnan(math.atan2(NAN, NINF)))
        self.assertTrue(math.isnan(math.atan2(NAN, -2.3)))
        self.assertTrue(math.isnan(math.atan2(NAN, -0.)))
        self.assertTrue(math.isnan(math.atan2(NAN, 0.)))
        self.assertTrue(math.isnan(math.atan2(NAN, 2.3)))
        self.assertTrue(math.isnan(math.atan2(NAN, INF)))
        self.assertTrue(math.isnan(math.atan2(NAN, NAN)))

    def testCeil(self):
        self.assertRaises(TypeError, math.ceil)
        self.assertEqual(int, type(math.ceil(0.5)))
        self.ftest('ceil(0.5)', math.ceil(0.5), 1)
        self.ftest('ceil(1.0)', math.ceil(1.0), 1)
        self.ftest('ceil(1.5)', math.ceil(1.5), 2)
        self.ftest('ceil(-0.5)', math.ceil(-0.5), 0)
        self.ftest('ceil(-1.0)', math.ceil(-1.0), -1)
        self.ftest('ceil(-1.5)', math.ceil(-1.5), -1)

        class TestCeil:
            def __ceil__(self):
                return 42
        class TestNoCeil:
            pass
        # self.ftest('ceil(TestCeil())', math.ceil(TestCeil()), 42)
        self.assertRaises(TypeError, math.ceil, TestNoCeil())

        t = TestNoCeil()
        t.__ceil__ = lambda *args: args
        self.assertRaises(TypeError, math.ceil, t)
        self.assertRaises(TypeError, math.ceil, t, 0)

    def testCopysign(self):
        # self.assertEqual(math.copysign(1, 42), 1.0)
        # self.assertEqual(math.copysign(0., 42), 0.0)
        # self.assertEqual(math.copysign(1., -42), -1.0)
        # self.assertEqual(math.copysign(3, 0.), 3.0)
        # self.assertEqual(math.copysign(4., -0.), -4.0)

        self.assertRaises(TypeError, math.copysign)
        # copysign should let us distinguish signs of zeros
        # self.assertEqual(math.copysign(1., 0.), 1.)
        # self.assertEqual(math.copysign(1., -0.), -1.)
        # self.assertEqual(math.copysign(INF, 0.), INF)
        # self.assertEqual(math.copysign(INF, -0.), NINF)
        # self.assertEqual(math.copysign(NINF, 0.), INF)
        # self.assertEqual(math.copysign(NINF, -0.), NINF)
        # and of infinities
        # self.assertEqual(math.copysign(1., INF), 1.)
        # self.assertEqual(math.copysign(1., NINF), -1.)
        self.assertEqual(math.copysign(INF, INF), INF)
        self.assertEqual(math.copysign(INF, NINF), NINF)
        # self.assertEqual(math.copysign(NINF, INF), INF)
        self.assertEqual(math.copysign(NINF, NINF), NINF)
        # self.assertTrue(math.isnan(math.copysign(NAN, 1.)))
        # self.assertTrue(math.isnan(math.copysign(NAN, INF)))
        # self.assertTrue(math.isnan(math.copysign(NAN, NINF)))
        self.assertTrue(math.isnan(math.copysign(NAN, NAN)))
        # copysign(INF, NAN) may be INF or it may be NINF, since
        # we don't know whether the sign bit of NAN is set on any
        # given platform.
        self.assertTrue(math.isinf(math.copysign(INF, NAN)))
        # similarly, copysign(2., NAN) could be 2. or -2.
        # self.assertEqual(abs(math.copysign(2., NAN)), 2.)

    def testCos(self):
        self.assertRaises(TypeError, math.cos)
        self.ftest('cos(-pi/2)', math.cos(-math.pi/2), 0, abs_tol=ulp(1))
        self.ftest('cos(0)', math.cos(0), 1)
        self.ftest('cos(pi/2)', math.cos(math.pi/2), 0, abs_tol=ulp(1))
        self.ftest('cos(pi)', math.cos(math.pi), -1)
        try:
            self.assertTrue(math.isnan(math.cos(INF)))
            self.assertTrue(math.isnan(math.cos(NINF)))
        except ValueError:
            self.assertRaises(ValueError, math.cos, INF)
            self.assertRaises(ValueError, math.cos, NINF)
        self.assertTrue(math.isnan(math.cos(NAN)))

    def testCosh(self):
        self.assertRaises(TypeError, math.cosh)
        self.ftest('cosh(0)', math.cosh(0), 1)
        self.ftest('cosh(2)-2*cosh(1)**2', math.cosh(2)-2*math.cosh(1)**2, -1) # Thanks to Lambert
        self.assertEqual(math.cosh(INF), INF)
        self.assertEqual(math.cosh(NINF), INF)
        self.assertTrue(math.isnan(math.cosh(NAN)))
        self.assertAlmostEqual(math.cosh(2), 3.7621956910836314, 15)
        self.assertAlmostEqual(math.cosh(-7.5), 904.0214837702167, 11)
        self.assertEqual(math.cosh(0), 1.0)

    def testDegrees(self):
        self.assertRaises(TypeError, math.degrees)
        self.ftest('degrees(pi)', math.degrees(math.pi), 180.0)
        self.ftest('degrees(pi/2)', math.degrees(math.pi/2), 90.0)
        self.ftest('degrees(-pi/4)', math.degrees(-math.pi/4), -45.0)
        self.ftest('degrees(0)', math.degrees(0), 0)

    def testExp(self):
        self.assertRaises(TypeError, math.exp)
        self.ftest('exp(-1)', math.exp(-1), 1/math.e)
        self.ftest('exp(0)', math.exp(0), 1)
        self.ftest('exp(1)', math.exp(1), math.e)
        self.assertEqual(math.exp(0), 1.0)
        self.assertEqual(math.exp(1), 2.718281828459045)
        self.assertEqual(math.exp(5), 148.4131591025766)
        self.assertEqual(math.exp(-5), 0.006737946999085467)
        self.assertEqual(math.exp(12.3), 219695.9886721379)
        self.assertEqual(math.exp(-21.3), 5.6172989244173e-10)
        self.assertEqual(math.exp(INF), INF)
        self.assertEqual(math.exp(NINF), 0.)
        self.assertTrue(math.isnan(math.exp(NAN)))
        # self.assertRaises(OverflowError, math.exp, 1000000)

    def testFabs(self):
        self.assertEqual(math.fabs(-1), 1.0)
        self.assertEqual(math.fabs(0), 0.0)
        self.assertRaises(TypeError, math.fabs)
        self.ftest('fabs(-1)', math.fabs(-1), 1)
        self.ftest('fabs(0)', math.fabs(0), 0)
        self.ftest('fabs(1)', math.fabs(1), 1)


    def testFloor(self):
        self.assertRaises(TypeError, math.floor)
        self.assertEqual(math.floor(-0.1), -1)
        self.assertEqual(math.floor(-0.9), -1)
        self.assertEqual(math.floor(0.9), 0)
        self.assertEqual(int, type(math.floor(0.5)))
        self.ftest('floor(0.5)', math.floor(0.5), 0)
        self.ftest('floor(1.0)', math.floor(1.0), 1)
        self.ftest('floor(1.5)', math.floor(1.5), 1)
        self.ftest('floor(-0.5)', math.floor(-0.5), -1)
        self.ftest('floor(-1.0)', math.floor(-1.0), -1)
        self.ftest('floor(-1.5)', math.floor(-1.5), -2)
        # pow() relies on floor() to check for integers
        # This fails on some platforms - so check it here
        self.ftest('floor(1.23e167)', math.floor(1.23e167), 1.23e167)
        self.ftest('floor(-1.23e167)', math.floor(-1.23e167), -1.23e167)
        #self.assertEqual(math.ceil(INF), INF)
        #self.assertEqual(math.ceil(NINF), NINF)
        #self.assertTrue(math.isnan(math.floor(NAN)))

        class TestFloor:
            def __floor__(self):
                return 42
        class TestNoFloor:
            pass
        # self.ftest('floor(TestFloor())', math.floor(TestFloor()), 42)
        self.assertRaises(TypeError, math.floor, TestNoFloor())

        t = TestNoFloor()
        t.__floor__ = lambda *args: args
        self.assertRaises(TypeError, math.floor, t)
        self.assertRaises(TypeError, math.floor, t, 0)

    # def testFmod(self):
    #     self.assertRaises(TypeError, math.fmod)
    #     self.ftest('fmod(10, 1)', math.fmod(10, 1), 0.0)
    #     self.ftest('fmod(10, 0.5)', math.fmod(10, 0.5), 0.0)
    #     self.ftest('fmod(10, 1.5)', math.fmod(10, 1.5), 1.0)
    #     self.ftest('fmod(-10, 1)', math.fmod(-10, 1), -0.0)
    #     self.ftest('fmod(-10, 0.5)', math.fmod(-10, 0.5), -0.0)
    #     self.ftest('fmod(-10, 1.5)', math.fmod(-10, 1.5), -1.0)
    #     self.assertTrue(math.isnan(math.fmod(NAN, 1.)))
    #     self.assertTrue(math.isnan(math.fmod(1., NAN)))
    #     self.assertTrue(math.isnan(math.fmod(NAN, NAN)))
    #     self.assertRaises(ValueError, math.fmod, 1., 0.)
    #     self.assertRaises(ValueError, math.fmod, INF, 1.)
    #     self.assertRaises(ValueError, math.fmod, NINF, 1.)
    #     self.assertRaises(ValueError, math.fmod, INF, 0.)
    #     self.assertEqual(math.fmod(3.0, INF), 3.0)
    #     self.assertEqual(math.fmod(-3.0, INF), -3.0)
    #     self.assertEqual(math.fmod(3.0, NINF), 3.0)
    #     self.assertEqual(math.fmod(-3.0, NINF), -3.0)
    #     self.assertEqual(math.fmod(0.0, 3.0), 0.0)
    #     self.assertEqual(math.fmod(0.0, NINF), 0.0)

    # def testFrexp(self):
    #     self.assertRaises(TypeError, math.frexp)
    #
    #     def testfrexp(name, result, expected):
    #         (mant, exp), (emant, eexp) = result, expected
    #         if abs(mant-emant) > eps or exp != eexp:
    #             self.fail('%s returned %r, expected %r'%\
    #                       (name, result, expected))
    #
    #     testfrexp('frexp(-1)', math.frexp(-1), (-0.5, 1))
    #     testfrexp('frexp(0)', math.frexp(0), (0, 0))
    #     testfrexp('frexp(1)', math.frexp(1), (0.5, 1))
    #     testfrexp('frexp(2)', math.frexp(2), (0.5, 2))
    #
    #     self.assertEqual(math.frexp(INF)[0], INF)
    #     self.assertEqual(math.frexp(NINF)[0], NINF)
    #     self.assertTrue(math.isnan(math.frexp(NAN)[0]))

    # def testFsum(self):
    #     # math.fsum relies on exact rounding for correct operation.
    #     # There's a known problem with IA32 floating-point that causes
    #     # inexact rounding in some situations, and will cause the
    #     # math.fsum tests below to fail; see issue #2937.  On non IEEE
    #     # 754 platforms, and on IEEE 754 platforms that exhibit the
    #     # problem described in issue #2937, we simply skip the whole
    #     # test.
    #
    #     # Python version of math.fsum, for comparison.  Uses a
    #     # different algorithm based on frexp, ldexp and integer
    #     # arithmetic.
    #     from sys import float_info
    #     mant_dig = float_info.mant_dig
    #     etiny = float_info.min_exp - mant_dig

        # def msum(iterable):
        #     """Full precision summation.  Compute sum(iterable) without any
        #     intermediate accumulation of error.  Based on the 'lsum' function
        #     at http://code.activestate.com/recipes/393090/
        #
        #     """
        #     tmant, texp = 0, 0
        #     for x in iterable:
        #         mant, exp = math.frexp(x)
        #         mant, exp = int(math.ldexp(mant, mant_dig)), exp - mant_dig
        #         if texp > exp:
        #             tmant <<= texp-exp
        #             texp = exp
        #         else:
        #             mant <<= exp-texp
        #         tmant += mant
        #     # Round tmant * 2**texp to a float.  The original recipe
        #     # used float(str(tmant)) * 2.0**texp for this, but that's
        #     # a little unsafe because str -> float conversion can't be
        #     # relied upon to do correct rounding on all platforms.
        #     tail = max(len(bin(abs(tmant)))-2 - mant_dig, etiny - texp)
        #     if tail > 0:
        #         h = 1 << (tail-1)
        #         tmant = tmant // (2*h) + bool(tmant & h and tmant & 3*h-1)
        #         texp += tail
        #     return math.ldexp(tmant, texp)

        test_values = [
            ([], 0.0),
            ([0.0], 0.0),
            ([1e100, 1.0, -1e100, 1e-100, 1e50, -1.0, -1e50], 1e-100),
            ([2.0**53, -0.5, -2.0**-54], 2.0**53-1.0),
            ([2.0**53, 1.0, 2.0**-100], 2.0**53+2.0),
            ([2.0**53+10.0, 1.0, 2.0**-100], 2.0**53+12.0),
            ([2.0**53-4.0, 0.5, 2.0**-54], 2.0**53-3.0),
            ([1./n for n in range(1, 1001)]),
            ([(-1.)**n/n for n in range(1, 1001)]),
            ([1.7**(i+1)-1.7**i for i in range(1000)] + [-1.7**1000], -1.0),
            ([1e16, 1., 1e-16], 10000000000000002.0),
            ([1e16-2., 1.-2.**-53, -(1e16-2.), -(1.-2.**-53)], 0.0),
            # exercise code for resizing partials array
            ([2.**n - 2.**(n+50) + 2.**(n+52) for n in range(-1074, 972, 2)] +
             [-2.**1022])
            ]

        # from random import random, gauss, shuffle
        # for j in range(1000):
        #     vals = [7, 1e100, -7, -1e100, -9e-20, 8e-20] * 10
        #     s = 0
        #     for i in range(200):
        #         v = gauss(0, random()) ** 7 - s
        #         s += v
        #         vals.append(v)
        #     shuffle(vals)
        #
        #     s = msum(vals)
        #     self.assertEqual(msum(vals), math.fsum(vals))

    # def testGcd(self):
    #     gcd = math.gcd
    #     self.assertEqual(gcd(0, 0), 0)
    #     self.assertEqual(gcd(1, 0), 1)
    #     self.assertEqual(gcd(-1, 0), 1)
    #     self.assertEqual(gcd(0, 1), 1)
    #     self.assertEqual(gcd(0, -1), 1)
    #     self.assertEqual(gcd(7, 1), 1)
    #     self.assertEqual(gcd(7, -1), 1)
    #     self.assertEqual(gcd(-23, 15), 1)
    #     self.assertEqual(gcd(120, 84), 12)
    #     self.assertEqual(gcd(84, -120), 12)
    #     self.assertEqual(gcd(1216342683557601535506311712,
    #                          436522681849110124616458784), 32)
    #     c = 652560
    #     x = 434610456570399902378880679233098819019853229470286994367836600566
    #     y = 1064502245825115327754847244914921553977
    #     a = x * c
    #     b = y * c
    #     self.assertEqual(gcd(a, b), c)
    #     self.assertEqual(gcd(b, a), c)
    #     self.assertEqual(gcd(-a, b), c)
    #     self.assertEqual(gcd(b, -a), c)
    #     self.assertEqual(gcd(a, -b), c)
    #     self.assertEqual(gcd(-b, a), c)
    #     self.assertEqual(gcd(-a, -b), c)
    #     self.assertEqual(gcd(-b, -a), c)
    #     c = 576559230871654959816130551884856912003141446781646602790216406874
    #     a = x * c
    #     b = y * c
    #     self.assertEqual(gcd(a, b), c)
    #     self.assertEqual(gcd(b, a), c)
    #     self.assertEqual(gcd(-a, b), c)
    #     self.assertEqual(gcd(b, -a), c)
    #     self.assertEqual(gcd(a, -b), c)
    #     self.assertEqual(gcd(-b, a), c)
    #     self.assertEqual(gcd(-a, -b), c)
    #     self.assertEqual(gcd(-b, -a), c)
    #
    #     self.assertRaises(TypeError, gcd, 120.0, 84)
    #     self.assertRaises(TypeError, gcd, 120, 84.0)
    #     self.assertEqual(gcd(MyIndexable(120), MyIndexable(84)), 12)

    def testHypot(self):
        self.assertRaises(TypeError, math.hypot)
        self.ftest('hypot(0,0)', math.hypot(0,0), 0)
        self.ftest('hypot(3,4)', math.hypot(3,4), 5)
        # self.assertEqual(math.hypot(NAN, INF), INF)
        # self.assertEqual(math.hypot(INF, NAN), INF)
        # self.assertEqual(math.hypot(NAN, NINF), INF)
        # self.assertEqual(math.hypot(NINF, NAN), INF)
        self.assertTrue(math.isnan(math.hypot(1.0, NAN)))
        self.assertTrue(math.isnan(math.hypot(NAN, -2.0)))

    # def testLdexp(self):
    #     self.assertRaises(TypeError, math.ldexp)
    #     self.ftest('ldexp(0,1)', math.ldexp(0,1), 0)
    #     self.ftest('ldexp(1,1)', math.ldexp(1,1), 2)
    #     self.ftest('ldexp(1,-1)', math.ldexp(1,-1), 0.5)
    #     self.ftest('ldexp(-1,1)', math.ldexp(-1,1), -2)
    #     self.assertRaises(OverflowError, math.ldexp, 1., 1000000)
    #     self.assertRaises(OverflowError, math.ldexp, -1., 1000000)
    #     self.assertEqual(math.ldexp(1., -1000000), 0.)
    #     self.assertEqual(math.ldexp(-1., -1000000), -0.)
    #     self.assertEqual(math.ldexp(INF, 30), INF)
    #     self.assertEqual(math.ldexp(NINF, -213), NINF)
    #     self.assertTrue(math.isnan(math.ldexp(NAN, 0)))
    #
    #     # large second argument
    #     for n in [10**5, 10**10, 10**20, 10**40]:
    #         self.assertEqual(math.ldexp(INF, -n), INF)
    #         self.assertEqual(math.ldexp(NINF, -n), NINF)
    #         self.assertEqual(math.ldexp(1., -n), 0.)
    #         self.assertEqual(math.ldexp(-1., -n), -0.)
    #         self.assertEqual(math.ldexp(0., -n), 0.)
    #         self.assertEqual(math.ldexp(-0., -n), -0.)
    #         self.assertTrue(math.isnan(math.ldexp(NAN, -n)))
    #
    #         self.assertRaises(OverflowError, math.ldexp, 1., n)
    #         self.assertRaises(OverflowError, math.ldexp, -1., n)
    #         self.assertEqual(math.ldexp(0., n), 0.)
    #         self.assertEqual(math.ldexp(-0., n), -0.)
    #         self.assertEqual(math.ldexp(INF, n), INF)
    #         self.assertEqual(math.ldexp(NINF, n), NINF)
    #         self.assertTrue(math.isnan(math.ldexp(NAN, n)))

    def testLog(self):
        self.assertRaises(TypeError, math.log)
        self.ftest('log(1/e)', math.log(1/math.e), -1)
        self.ftest('log(1)', math.log(1), 0)
        self.ftest('log(e)', math.log(math.e), 1)
        self.ftest('log(32,2)', math.log(32,2), 5)
        self.ftest('log(10**40, 10)', math.log(10**40, 10), 40)
        self.ftest('log(10**40, 10**20)', math.log(10**40, 10**20), 2)
        # self.ftest('log(10**1000)', math.log(10**1000),
        #            2302.5850929940457)
        # self.assertRaises(ValueError, math.log, -1.5)
        # self.assertRaises(ValueError, math.log, -10**1000)
        # self.assertRaises(ValueError, math.log, NINF)
        self.assertEqual(math.log(INF), INF)
        self.assertTrue(math.isnan(math.log(NAN)))

    # def testLog1p(self):
    #     self.assertRaises(TypeError, math.log1p)
    #     for n in [2, 2**90, 2**300]:
    #         self.assertAlmostEqual(math.log1p(n), math.log1p(float(n)))
    #     self.assertRaises(ValueError, math.log1p, -1)
    #     self.assertEqual(math.log1p(INF), INF)

    # def testLog2(self):
    #     self.assertRaises(TypeError, math.log2)
    #
    #     # Check some integer values
    #     self.assertEqual(math.log2(1), 0.0)
    #     self.assertEqual(math.log2(2), 1.0)
    #     self.assertEqual(math.log2(4), 2.0)
    #
    #     # Large integer values
    #     self.assertEqual(math.log2(2**1023), 1023.0)
    #     self.assertEqual(math.log2(2**1024), 1024.0)
    #     self.assertEqual(math.log2(2**2000), 2000.0)
    #
    #     self.assertRaises(ValueError, math.log2, -1.5)
    #     self.assertRaises(ValueError, math.log2, NINF)
    #     self.assertTrue(math.isnan(math.log2(NAN)))

    # log2() is not accurate enough on Mac OS X Tiger (10.4)
    # def testLog2Exact(self):
    #     # Check that we get exact equality for log2 of powers of 2.
    #     actual = [math.log2(math.ldexp(1.0, n)) for n in range(-1074, 1024)]
    #     expected = [float(n) for n in range(-1074, 1024)]
    #     self.assertEqual(actual, expected)

    def testLog10(self):
        self.assertRaises(TypeError, math.log10)
        self.ftest('log10(0.1)', math.log10(0.1), -1)
        self.ftest('log10(1)', math.log10(1), 0)
        self.ftest('log10(10)', math.log10(10), 1)
        # self.ftest('log10(10**1000)', math.log10(10**1000), 1000.0)
        # self.assertRaises(ValueError, math.log10, -1.5)
        # self.assertRaises(ValueError, math.log10, -10**1000)
        # self.assertRaises(ValueError, math.log10, NINF)
        self.assertEqual(math.log(INF), INF)
        self.assertTrue(math.isnan(math.log10(NAN)))

    # def testModf(self):
    #     self.assertRaises(TypeError, math.modf)
    #
    #     def testmodf(name, result, expected):
    #         (v1, v2), (e1, e2) = result, expected
    #         if abs(v1-e1) > eps or abs(v2-e2):
    #             self.fail('%s returned %r, expected %r'%\
    #                       (name, result, expected))
    #
    #     testmodf('modf(1.5)', math.modf(1.5), (0.5, 1.0))
    #     testmodf('modf(-1.5)', math.modf(-1.5), (-0.5, -1.0))
    #
    #     self.assertEqual(math.modf(INF), (0.0, INF))
    #     self.assertEqual(math.modf(NINF), (-0.0, NINF))
    #
    #     modf_nan = math.modf(NAN)
    #     self.assertTrue(math.isnan(modf_nan[0]))
    #     self.assertTrue(math.isnan(modf_nan[1]))

    def testPow(self):
        self.assertRaises(TypeError, math.pow)
        self.ftest('pow(0,1)', math.pow(0,1), 0)
        self.ftest('pow(1,0)', math.pow(1,0), 1)
        self.ftest('pow(2,1)', math.pow(2,1), 2)
        self.ftest('pow(2,-1)', math.pow(2,-1), 0.5)
        self.assertEqual(math.pow(INF, 1), INF)
        self.assertEqual(math.pow(NINF, 1), NINF)
        # self.assertEqual((math.pow(1, INF)), 1.)
        # self.assertEqual((math.pow(1, NINF)), 1.)
        self.assertTrue(math.isnan(math.pow(NAN, 1)))
        self.assertTrue(math.isnan(math.pow(2, NAN)))
        self.assertTrue(math.isnan(math.pow(0, NAN)))
        # self.assertEqual(math.pow(1, NAN), 1)

        # pow(0., x)
        self.assertEqual(math.pow(0., INF), 0.)
        self.assertEqual(math.pow(0., 3.), 0.)
        self.assertEqual(math.pow(0., 2.3), 0.)
        self.assertEqual(math.pow(0., 2.), 0.)
        self.assertEqual(math.pow(0., 0.), 1.)
        self.assertEqual(math.pow(0., -0.), 1.)
        # self.assertRaises(ValueError, math.pow, 0., -2.)
        # self.assertRaises(ValueError, math.pow, 0., -2.3)
        # self.assertRaises(ValueError, math.pow, 0., -3.)
        # self.assertRaises(ValueError, math.pow, 0., NINF)
        self.assertTrue(math.isnan(math.pow(0., NAN)))

        # pow(INF, x)
        self.assertEqual(math.pow(INF, INF), INF)
        self.assertEqual(math.pow(INF, 3.), INF)
        self.assertEqual(math.pow(INF, 2.3), INF)
        self.assertEqual(math.pow(INF, 2.), INF)
        self.assertEqual(math.pow(INF, 0.), 1.)
        self.assertEqual(math.pow(INF, -0.), 1.)
        self.assertEqual(math.pow(INF, -2.), 0.)
        self.assertEqual(math.pow(INF, -2.3), 0.)
        self.assertEqual(math.pow(INF, -3.), 0.)
        self.assertEqual(math.pow(INF, NINF), 0.)
        self.assertTrue(math.isnan(math.pow(INF, NAN)))

        # pow(-0., x)
        self.assertEqual(math.pow(-0., INF), 0.)
        self.assertEqual(math.pow(-0., 3.), -0.)
        self.assertEqual(math.pow(-0., 2.3), 0.)
        self.assertEqual(math.pow(-0., 2.), 0.)
        self.assertEqual(math.pow(-0., 0.), 1.)
        self.assertEqual(math.pow(-0., -0.), 1.)
        # self.assertRaises(ValueError, math.pow, -0., -2.)
        # self.assertRaises(ValueError, math.pow, -0., -2.3)
        # self.assertRaises(ValueError, math.pow, -0., -3.)
        # self.assertRaises(ValueError, math.pow, -0., NINF)
        self.assertTrue(math.isnan(math.pow(-0., NAN)))

        # pow(NINF, x)
        self.assertEqual(math.pow(NINF, INF), INF)
        self.assertEqual(math.pow(NINF, 3.), NINF)
        self.assertEqual(math.pow(NINF, 2.3), INF)
        self.assertEqual(math.pow(NINF, 2.), INF)
        self.assertEqual(math.pow(NINF, 0.), 1.)
        self.assertEqual(math.pow(NINF, -0.), 1.)
        self.assertEqual(math.pow(NINF, -2.), 0.)
        self.assertEqual(math.pow(NINF, -2.3), 0.)
        self.assertEqual(math.pow(NINF, -3.), -0.)
        self.assertEqual(math.pow(NINF, NINF), 0.)
        self.assertTrue(math.isnan(math.pow(NINF, NAN)))

        # pow(-1, x)
        # self.assertEqual(math.pow(-1., INF), 1.)
        self.assertEqual(math.pow(-1., 3.), -1.)
        # self.assertRaises(ValueError, math.pow, -1., 2.3)
        self.assertEqual(math.pow(-1., 2.), 1.)
        self.assertEqual(math.pow(-1., 0.), 1.)
        self.assertEqual(math.pow(-1., -0.), 1.)
        self.assertEqual(math.pow(-1., -2.), 1.)
        # self.assertRaises(ValueError, math.pow, -1., -2.3)
        self.assertEqual(math.pow(-1., -3.), -1.)
        # self.assertEqual(math.pow(-1., NINF), 1.)
        self.assertTrue(math.isnan(math.pow(-1., NAN)))

        # pow(1, x)
        # self.assertEqual(math.pow(1., INF), 1.)
        self.assertEqual(math.pow(1., 3.), 1.)
        self.assertEqual(math.pow(1., 2.3), 1.)
        self.assertEqual(math.pow(1., 2.), 1.)
        self.assertEqual(math.pow(1., 0.), 1.)
        self.assertEqual(math.pow(1., -0.), 1.)
        self.assertEqual(math.pow(1., -2.), 1.)
        self.assertEqual(math.pow(1., -2.3), 1.)
        self.assertEqual(math.pow(1., -3.), 1.)
        # self.assertEqual(math.pow(1., NINF), 1.)
        # self.assertEqual(math.pow(1., NAN), 1.)

        # pow(x, 0) should be 1 for any x
        self.assertEqual(math.pow(2.3, 0.), 1.)
        self.assertEqual(math.pow(-2.3, 0.), 1.)
        self.assertEqual(math.pow(NAN, 0.), 1.)
        self.assertEqual(math.pow(2.3, -0.), 1.)
        self.assertEqual(math.pow(-2.3, -0.), 1.)
        self.assertEqual(math.pow(NAN, -0.), 1.)

        # pow(x, y) is invalid if x is negative and y is not integral
        # self.assertRaises(ValueError, math.pow, -1., 2.3)
        # self.assertRaises(ValueError, math.pow, -15., -3.1)

        # pow(x, NINF)
        self.assertEqual(math.pow(1.9, NINF), 0.)
        self.assertEqual(math.pow(1.1, NINF), 0.)
        self.assertEqual(math.pow(0.9, NINF), INF)
        self.assertEqual(math.pow(0.1, NINF), INF)
        self.assertEqual(math.pow(-0.1, NINF), INF)
        self.assertEqual(math.pow(-0.9, NINF), INF)
        self.assertEqual(math.pow(-1.1, NINF), 0.)
        self.assertEqual(math.pow(-1.9, NINF), 0.)

        # pow(x, INF)
        self.assertEqual(math.pow(1.9, INF), INF)
        self.assertEqual(math.pow(1.1, INF), INF)
        self.assertEqual(math.pow(0.9, INF), 0.)
        self.assertEqual(math.pow(0.1, INF), 0.)
        self.assertEqual(math.pow(-0.1, INF), 0.)
        self.assertEqual(math.pow(-0.9, INF), 0.)
        self.assertEqual(math.pow(-1.1, INF), INF)
        self.assertEqual(math.pow(-1.9, INF), INF)

        # pow(x, y) should work for x negative, y an integer
        self.ftest('(-2.)**3.', math.pow(-2.0, 3.0), -8.0)
        self.ftest('(-2.)**2.', math.pow(-2.0, 2.0), 4.0)
        self.ftest('(-2.)**1.', math.pow(-2.0, 1.0), -2.0)
        self.ftest('(-2.)**0.', math.pow(-2.0, 0.0), 1.0)
        self.ftest('(-2.)**-0.', math.pow(-2.0, -0.0), 1.0)
        self.ftest('(-2.)**-1.', math.pow(-2.0, -1.0), -0.5)
        self.ftest('(-2.)**-2.', math.pow(-2.0, -2.0), 0.25)
        self.ftest('(-2.)**-3.', math.pow(-2.0, -3.0), -0.125)
        # self.assertRaises(ValueError, math.pow, -2.0, -0.5)
        # self.assertRaises(ValueError, math.pow, -2.0, 0.5)

        # the following tests have been commented out since they don't
        # really belong here:  the implementation of ** for floats is
        # independent of the implementation of math.pow
        #self.assertEqual(1**NAN, 1)
        #self.assertEqual(1**INF, 1)
        #self.assertEqual(1**NINF, 1)
        #self.assertEqual(1**0, 1)
        #self.assertEqual(1.**NAN, 1)
        #self.assertEqual(1.**INF, 1)
        #self.assertEqual(1.**NINF, 1)
        #self.assertEqual(1.**0, 1)

    def testRadians(self):
        self.assertRaises(TypeError, math.radians)
        self.ftest('radians(180)', math.radians(180), math.pi)
        self.ftest('radians(90)', math.radians(90), math.pi/2)
        self.ftest('radians(-45)', math.radians(-45), -math.pi/4)
        self.ftest('radians(0)', math.radians(0), 0)
        self.assertEqual("%10.5f" % math.radians(180), "   3.14159")
        self.assertEqual("%10.5f" % math.degrees(math.radians(180)), " 180.00000")

    def testSin(self):
        self.assertRaises(TypeError, math.sin)
        self.ftest('sin(0)', math.sin(0), 0)
        self.ftest('sin(pi/2)', math.sin(math.pi/2), 1)
        self.ftest('sin(-pi/2)', math.sin(-math.pi/2), -1)
        try:
            self.assertTrue(math.isnan(math.sin(INF)))
            self.assertTrue(math.isnan(math.sin(NINF)))
        except ValueError:
            self.assertRaises(ValueError, math.sin, INF)
            self.assertRaises(ValueError, math.sin, NINF)
        self.assertTrue(math.isnan(math.sin(NAN)))
        self.assertRaises(TypeError, math.sin, "3")

        def differentiate(f, method, h=1.0E-5):
                if method == 'Forward1':
                        def Forward1(x):
                                return (f(x+h) -f(x)) / h
                        return Forward1
                elif method == 'Backward1':
                        def Backward1(x):
                                return (f(x) -f(x-h)) / h
                        return Backward1

        mycos = differentiate(math.sin, 'Forward1')
        mysin = differentiate(mycos, 'Backward1', 1.0E-6)
        x = math.pi
        self.assertEqual(mycos(x), -0.9999999999898844)
        self.assertEqual(math.cos(x), -1.0)
        self.assertEqual(mysin(x), 4.500066985713147e-06)
        self.assertEqual(-math.sin(x), -1.2246467991473532e-16)

    def testSinh(self):
        self.assertRaises(TypeError, math.sinh)
        self.ftest('sinh(0)', math.sinh(0), 0)
        self.ftest('sinh(1)**2-cosh(1)**2', math.sinh(1)**2-math.cosh(1)**2, -1)
        self.ftest('sinh(1)+sinh(-1)', math.sinh(1)+math.sinh(-1), 0)
        self.assertEqual(math.sinh(INF), INF)
        self.assertEqual(math.sinh(NINF), NINF)
        self.assertTrue(math.isnan(math.sinh(NAN)))
        self.assertEqual(math.sinh(2), 3.6268604078470186)
        self.assertAlmostEqual(math.sinh(-7.5), -904.0209306858466, 11)
        self.assertEqual(math.sinh(0), 0.0)

    def testSqrt(self):
        self.assertRaises(TypeError, math.sqrt)
        self.ftest('sqrt(0)', math.sqrt(0), 0)
        self.ftest('sqrt(1)', math.sqrt(1), 1)
        self.ftest('sqrt(4)', math.sqrt(4), 2)
        self.assertEqual(math.sqrt(INF), INF)
        # self.assertRaises(ValueError, math.sqrt, -1)
        # self.assertRaises(ValueError, math.sqrt, NINF)
        self.assertTrue(math.isnan(math.sqrt(NAN)))

    def testTan(self):
        self.assertRaises(TypeError, math.tan)
        self.ftest('tan(0)', math.tan(0), 0)
        self.ftest('tan(pi/4)', math.tan(math.pi/4), 1)
        self.ftest('tan(-pi/4)', math.tan(-math.pi/4), -1)
        try:
            self.assertTrue(math.isnan(math.tan(INF)))
            self.assertTrue(math.isnan(math.tan(NINF)))
        except:
            self.assertRaises(ValueError, math.tan, INF)
            self.assertRaises(ValueError, math.tan, NINF)
        self.assertTrue(math.isnan(math.tan(NAN)))

    def testTanh(self):
        self.assertRaises(TypeError, math.tanh)
        self.ftest('tanh(0)', math.tanh(0), 0)
        self.ftest('tanh(1)+tanh(-1)', math.tanh(1)+math.tanh(-1), 0,
                   abs_tol=ulp(1))
        # self.ftest('tanh(inf)', math.tanh(INF), 1)
        # self.ftest('tanh(-inf)', math.tanh(NINF), -1)
        self.assertTrue(math.isnan(math.tanh(NAN)))
        self.assertAlmostEqual(math.tanh(2), 0.9640275800758169, 15)
        self.assertAlmostEqual(math.tanh(-7.5), -0.9999993881955461, 15)
        self.assertEqual(math.tanh(0), 0.0)

    def testTanhSign(self):
        # check that tanh(-0.) == -0. on IEEE 754 systems
        self.assertEqual(math.tanh(-0.), -0.)
        self.assertEqual(math.copysign(1., math.tanh(-0.)),
                         math.copysign(1., -0.))

    def test_trunc(self):
        self.assertEqual(math.trunc(1), 1)
        self.assertEqual(math.trunc(-1), -1)
        self.assertEqual(type(math.trunc(1)), int)
        self.assertEqual(type(math.trunc(1.5)), int)
        self.assertEqual(math.trunc(1.5), 1)
        self.assertEqual(math.trunc(-1.5), -1)
        self.assertEqual(math.trunc(1.999999), 1)
        self.assertEqual(math.trunc(-1.999999), -1)
        self.assertEqual(math.trunc(-0.999999), -0)
        self.assertEqual(math.trunc(-100.999), -100)

        class TestTrunc(object):
            def __trunc__(self):
                return 23

        class TestNoTrunc(object):
            pass

        # self.assertEqual(math.trunc(TestTrunc()), 23)

        self.assertRaises(TypeError, math.trunc)
        self.assertRaises(TypeError, math.trunc, 1, 2)
        self.assertRaises(TypeError, math.trunc, TestNoTrunc())

    # def testIsfinite(self):
    #     self.assertTrue(math.isfinite(0.0))
    #     self.assertTrue(math.isfinite(-0.0))
    #     self.assertTrue(math.isfinite(1.0))
    #     self.assertTrue(math.isfinite(-1.0))
    #     self.assertFalse(math.isfinite(float("nan")))
    #     self.assertFalse(math.isfinite(float("inf")))
    #     self.assertFalse(math.isfinite(float("-inf")))

    def testIsnan(self):
        self.assertTrue(math.isnan(float("nan")))
        self.assertTrue(math.isnan(float("-nan")))
        self.assertTrue(math.isnan(float("inf") * 0.))
        self.assertFalse(math.isnan(float("inf")))
        self.assertFalse(math.isnan(0.))
        self.assertFalse(math.isnan(1.))

    def testIsinf(self):
        self.assertTrue(math.isinf(float("inf")))
        self.assertTrue(math.isinf(float("-inf")))
        self.assertTrue(math.isinf(1E400))
        self.assertTrue(math.isinf(-1E400))
        # self.assertFalse(math.isinf(float("nan")))
        self.assertFalse(math.isinf(0.))
        self.assertFalse(math.isinf(1.))

    # def test_nan_constant(self):
    #     self.assertTrue(math.isnan(math.nan))

    # def test_inf_constant(self):
    #     self.assertTrue(math.isinf(math.inf))
    #     self.assertGreater(math.inf, 0.0)
    #     self.assertEqual(math.inf, float("inf"))
    #     self.assertEqual(-math.inf, float("-inf"))

    # RED_FLAG 16-Oct-2000 Tim
    # While 2.0 is more consistent about exceptions than previous releases, it
    # still fails this part of the test on some platforms.  For now, we only
    # *run* test_exceptions() in verbose mode, so that this isn't normally
    # tested.
    def test_exceptions(self):
        try:
            x = math.exp(-1000000000)
        except:
            # mathmodule.c is failing to weed out underflows from libm, or
            # we've got an fp format with huge dynamic range
            self.fail("underflowing exp() should not have raised "
                        "an exception")
        if x != 0:
            self.fail("underflowing exp() should have returned 0")

        # If this fails, probably using a strict IEEE-754 conforming libm, and x
        # is +Inf afterwards.  But Python wants overflows detected by default.
        # try:
        #     x = math.exp(1000000000)
        # except OverflowError:
        #     pass
        # else:
        #     self.fail("overflowing exp() didn't trigger OverflowError")

        # If this fails, it could be a puzzle.  One odd possibility is that
        # mathmodule.c's macros are getting confused while comparing
        # Inf (HUGE_VAL) to a NaN, and artificially setting errno to ERANGE
        # as a result (and so raising OverflowError instead).
        # try:
        #     x = math.sqrt(-1.0)
        # except ValueError:
        #     pass
        # else:
        #     self.fail("sqrt(-1) didn't raise ValueError")


if __name__ == '__main__':
    unittest.main()
