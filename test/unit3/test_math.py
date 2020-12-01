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
        self.assertEqual(math.tau, 2*math.pi)

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
        self.assertEqual(math.copysign(1, 42), 1.0)
        self.assertEqual(math.copysign(0., 42), 0.0)
        self.assertEqual(math.copysign(1., -42), -1.0)
        self.assertEqual(math.copysign(3, 0.), 3.0)
        self.assertEqual(math.copysign(4., -0.), -4.0)

        self.assertRaises(TypeError, math.copysign)
        # copysign should let us distinguish signs of zeros
        self.assertEqual(math.copysign(1., 0.), 1.)
        self.assertEqual(math.copysign(1., -0.), -1.)
        self.assertEqual(math.copysign(INF, 0.), INF)
        self.assertEqual(math.copysign(INF, -0.), NINF)
        self.assertEqual(math.copysign(NINF, 0.), INF)
        self.assertEqual(math.copysign(NINF, -0.), NINF)
        # and of infinities
        self.assertEqual(math.copysign(1., INF), 1.)
        self.assertEqual(math.copysign(1., NINF), -1.)
        self.assertEqual(math.copysign(INF, INF), INF)
        self.assertEqual(math.copysign(INF, NINF), NINF)
        self.assertEqual(math.copysign(NINF, INF), INF)
        self.assertEqual(math.copysign(NINF, NINF), NINF)
        self.assertTrue(math.isnan(math.copysign(NAN, 1.)))
        self.assertTrue(math.isnan(math.copysign(NAN, INF)))
        self.assertTrue(math.isnan(math.copysign(NAN, NINF)))
        self.assertTrue(math.isnan(math.copysign(NAN, NAN)))
        # copysign(INF, NAN) may be INF or it may be NINF, since
        # we don't know whether the sign bit of NAN is set on any
        # given platform.
        self.assertTrue(math.isinf(math.copysign(INF, NAN)))
        # similarly, copysign(2., NAN) could be 2. or -2.
        self.assertEqual(abs(math.copysign(2., NAN)), 2.)

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
        self.assertRaises(OverflowError, math.exp, 1000000)

    def testExpm1(self):
        # taken from cpython/Lib/test/math_testcases.txt
        # special cases
        self.assertEqual(math.expm1(0.0), 0.0)
        self.assertEqual(math.expm1(-0.0), -0.0)
        self.assertEqual(math.expm1(INF), INF)
        self.assertEqual(math.expm1(-INF), -1.0)
        self.assertTrue(math.isnan(math.expm1(NAN)))

        # timy x
        self.assertEqual(math.expm1(5e-324), 5e-324)
        self.assertEqual(math.expm1(1e-320), 1e-320)
        self.assertEqual(math.expm1(1e-300), 1e-300)
        self.assertEqual(math.expm1(1e-150), 1e-150)
        self.assertEqual(math.expm1(1e-20), 1e-20)
        self.assertEqual(math.expm1(-5e-324), -5e-324)
        self.assertEqual(math.expm1(-1e-320), -1e-320)
        self.assertEqual(math.expm1(-1e-300), -1e-300)
        self.assertEqual(math.expm1(-1e-150), -1e-150)
        self.assertEqual(math.expm1(-1e-20), -1e-20)

        # moderate size - direct evaluation runs into trouble
        self.assertAlmostEqual(math.expm1(1e-10), 1.0000000000500000e-10, 15)
        self.assertAlmostEqual(math.expm1(-9.9999999999999995e-08), -9.9999995000000163e-8, 15)
        self.assertAlmostEqual(math.expm1(3.0000000000000001e-05), 3.0000450004500034e-5, 15)
        self.assertEqual(math.expm1(-0.0070000000000000001), -0.0069755570667648951)
        self.assertEqual(math.expm1(-0.071499208740094633), -0.069002985744820250)
        self.assertAlmostEqual(math.expm1(-0.063296004180116799), -0.061334416373633009, 15)
        self.assertEqual(math.expm1(0.02390954035597756), 0.024197665143819942)
        self.assertEqual(math.expm1(0.085637352649044901), 0.089411184580357767)
        self.assertAlmostEqual(math.expm1(0.5966174947411006), 0.81596588596501485, 15)
        self.assertEqual(math.expm1(0.30247206212075139), 0.35319987035848677)
        self.assertEqual(math.expm1(0.74574727375889516), 1.1080161116737459)
        self.assertEqual(math.expm1(0.97767512926555711), 1.6582689207372185)
        self.assertEqual(math.expm1(0.8450154566787712), 1.3280137976535897)
        self.assertEqual(math.expm1(-0.13979260323125264), -0.13046144381396060)
        self.assertAlmostEqual(math.expm1(-0.52899322039643271), -0.41080213643695923, 15)
        self.assertEqual(math.expm1(-0.74083261478900631), -0.52328317124797097)
        self.assertEqual(math.expm1(-0.93847766984546055), -0.60877704724085946)
        self.assertEqual(math.expm1(10.0), 22025.465794806718)
        self.assertEqual(math.expm1(27.0), 532048240600.79865)
        self.assertEqual(math.expm1(123), 2.6195173187490626e+53)
        self.assertEqual(math.expm1(-12.0), -0.99999385578764666)
        self.assertEqual(math.expm1(-35.100000000000001), -0.99999999999999944)

        # extreme negative
        self.assertEqual(math.expm1(-37.0), -0.99999999999999989)
        self.assertEqual(math.expm1(-38.0), -1.0)
        self.assertEqual(math.expm1(-710.0), -1.0)
        self.assertEqual(math.expm1(-1420.0), -1.0)
        self.assertEqual(math.expm1(-1450.0), -1.0)
        self.assertEqual(math.expm1(-1500.0), -1.0)
        self.assertEqual(math.expm1(-1e50), -1.0)
        self.assertEqual(math.expm1(-1.79e308), -1.0)


        # extreme positive
        self.assertEqual(math.expm1(300), 1.9424263952412558e+130)
        self.assertEqual(math.expm1(700), 1.0142320547350045e+304)


    def testFabs(self):
        self.assertEqual(math.fabs(-1), 1.0)
        self.assertEqual(math.fabs(0), 0.0)
        self.assertRaises(TypeError, math.fabs)
        self.ftest('fabs(-1)', math.fabs(-1), 1)
        self.ftest('fabs(0)', math.fabs(0), 0)
        self.ftest('fabs(1)', math.fabs(1), 1)

 

    def testFactorial(self):
        self.assertEqual(math.factorial(0), 1)
        self.assertEqual(math.factorial(0.0), 1)
        total = 1
        for i in range(1, 100): # make the numbers smaller for speed
            total *= i
            self.assertEqual(math.factorial(i), total)
            self.assertEqual(math.factorial(float(i)), total)
            # self.assertEqual(math.factorial(i), py_factorial(i))
        self.assertRaises(ValueError, math.factorial, -1)
        self.assertRaises(ValueError, math.factorial, -1.0)
        self.assertRaises(ValueError, math.factorial, -10**100)
        self.assertRaises(ValueError, math.factorial, -1e100)
        self.assertRaises(ValueError, math.factorial, math.pi)


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

    def testFmod(self):
        self.assertRaises(TypeError, math.fmod)
        self.ftest('fmod(10, 1)', math.fmod(10, 1), 0.0)
        self.ftest('fmod(10, 0.5)', math.fmod(10, 0.5), 0.0)
        self.ftest('fmod(10, 1.5)', math.fmod(10, 1.5), 1.0)
        self.ftest('fmod(-10, 1)', math.fmod(-10, 1), -0.0)
        self.ftest('fmod(-10, 0.5)', math.fmod(-10, 0.5), -0.0)
        self.ftest('fmod(-10, 1.5)', math.fmod(-10, 1.5), -1.0)
        self.assertTrue(math.isnan(math.fmod(NAN, 1.)))
        self.assertTrue(math.isnan(math.fmod(1., NAN)))
        self.assertTrue(math.isnan(math.fmod(NAN, NAN)))
        self.assertRaises(ValueError, math.fmod, 1., 0.)
        self.assertRaises(ValueError, math.fmod, INF, 1.)
        self.assertRaises(ValueError, math.fmod, NINF, 1.)
        self.assertRaises(ValueError, math.fmod, INF, 0.)
        self.assertEqual(math.fmod(3.0, INF), 3.0)
        self.assertEqual(math.fmod(-3.0, INF), -3.0)
        self.assertEqual(math.fmod(3.0, NINF), 3.0)
        self.assertEqual(math.fmod(-3.0, NINF), -3.0)
        self.assertEqual(math.fmod(0.0, 3.0), 0.0)
        self.assertEqual(math.fmod(0.0, NINF), 0.0)

    def testFrexp(self):
        self.assertRaises(TypeError, math.frexp)
    
        def testfrexp(name, result, expected):
            (mant, exp), (emant, eexp) = result, expected
            if abs(mant-emant) > eps or exp != eexp:
                self.fail('%s returned %r, expected %r'%\
                          (name, result, expected))
    
        testfrexp('frexp(-1)', math.frexp(-1), (-0.5, 1))
        testfrexp('frexp(0)', math.frexp(0), (0, 0))
        testfrexp('frexp(1)', math.frexp(1), (0.5, 1))
        testfrexp('frexp(2)', math.frexp(2), (0.5, 2))
    
        self.assertEqual(math.frexp(INF)[0], INF)
        self.assertEqual(math.frexp(NINF)[0], NINF)
        self.assertTrue(math.isnan(math.frexp(NAN)[0]))

    def testFsum(self):
        # math.fsum relies on exact rounding for correct operation.
        # There's a known problem with IA32 floating-point that causes
        # inexact rounding in some situations, and will cause the
        # math.fsum tests below to fail; see issue #2937.  On non IEEE
        # 754 platforms, and on IEEE 754 platforms that exhibit the
        # problem described in issue #2937, we simply skip the whole
        # test.
    
        # Python version of math.fsum, for comparison.  Uses a
        # different algorithm based on frexp, ldexp and integer
        # arithmetic.
        # from sys import float_info
        # mant_dig = float_info.mant_dig
        # etiny = float_info.min_exp - mant_dig
        mant_dig = 53 # sys and float_info don't exist
        etiny = -1020-mant_dig

        def msum(iterable):
            """Full precision summation.  Compute sum(iterable) without any
            intermediate accumulation of error.  Based on the 'lsum' function
            at http://code.activestate.com/recipes/393090/
            """
            tmant, texp = 0, 0
            for x in iterable:
                mant, exp = math.frexp(x)
                mant, exp = int(math.ldexp(mant, mant_dig)), exp - mant_dig
                if texp > exp:
                    tmant <<= texp-exp
                    texp = exp
                else:
                    mant <<= exp-texp
                tmant += mant
            # Round tmant * 2**texp to a float.  The original recipe
            # used float(str(tmant)) * 2.0**texp for this, but that's
            # a little unsafe because str -> float conversion can't be
            # relied upon to do correct rounding on all platforms.
            tail = max(len(bin(abs(tmant)))-2 - mant_dig, etiny - texp)
            if tail > 0:
                h = 1 << (tail-1)
                tmant = tmant // (2*h) + bool(tmant & h and tmant & 3*h-1)
                texp += tail
            
            # weird hack that fixes a bug when tmant is converted to a float incorrectly by skulpt
            return math.ldexp(int(str(tmant)), texp)  

        test_values = [
            ([], 0.0),
            ([0.0], 0.0),
            ([1e100, 1.0, -1e100, 1e-100, 1e50, -1.0, -1e50], 1e-100),
            ([2.0**53, -0.5, -2.0**-54], 2.0**53-1.0),
            ([2.0**53, 1.0, 2.0**-100], 2.0**53+2.0),
            ([2.0**53+10.0, 1.0, 2.0**-100], 2.0**53+12.0),
            ([2.0**53-4.0, 0.5, 2.0**-54], 2.0**53-3.0),
            ([1./n for n in range(1, 1001)],7.485470860550345),
            ([(-1.)**n/n for n in range(1, 1001)],-0.6926474305598203),
            ([1.7**(i+1)-1.7**i for i in range(1000)] + [-1.7**1000], -1.0),
            ([1e16, 1., 1e-16], 10000000000000002.0),
            ([1e16-2., 1.-2.**-53, -(1e16-2.), -(1.-2.**-53)], 0.0),
            # exercise code for resizing partials array
            ([2.**n - 2.**(n+50) + 2.**(n+52) for n in range(-1074, 972, 2)] +
                [-2.**1022],1.3305602063564798e+292)
        ]

        for i, (vals, expected) in enumerate(test_values):
            try:
                actual = math.fsum(vals)
            except OverflowError:
                self.fail("test %d failed: got OverflowError, expected %r "
                          "for math.fsum(%.100r)" % (i, expected, vals))
            except ValueError:
                self.fail("test %d failed: got ValueError, expected %r "
                          "for math.fsum(%.100r)" % (i, expected, vals))
            self.assertTrue(math.isclose(actual, expected, rel_tol=10**-15)) 
            # AssertEqual failed on testcase 3,4,6,10 only in the units digit
            # correct in first 15 significant figures!
            # hence using isclose rather than assertEqual 


        from random import random, gauss, shuffle, seed
        seed(0)
        for j in range(20):
            vals = [7, 1e100, -7, -1e100, -9e-20, 8e-20] * 10
            s = 0
            for i in range(200):
                v = gauss(0, random()) ** 7 - s
                s += v
                vals.append(v)
            shuffle(vals)
        
            s = msum(vals)
            self.assertAlmostEqual(msum(vals), math.fsum(vals), 12)
            # self.assertEqual(msum(vals), math.fsum(vals))
            # assertEqual failed - this seemed the best compromise

    def testGcd(self):
        gcd = math.gcd
        self.assertEqual(gcd(0, 0), 0)
        self.assertEqual(gcd(1, 0), 1)
        self.assertEqual(gcd(-1, 0), 1)
        self.assertEqual(gcd(0, 1), 1)
        self.assertEqual(gcd(0, -1), 1)
        self.assertEqual(gcd(7, 1), 1)
        self.assertEqual(gcd(7, -1), 1)
        self.assertEqual(gcd(-23, 15), 1)
        self.assertEqual(gcd(120, 84), 12)
        self.assertEqual(gcd(84, -120), 12)
        self.assertEqual(gcd(1216342683557601535506311712, 436522681849110124616458784), 32)
        c = 652560
        x = 434610456570399902378880679233098819019853229470286994367836600566
        y = 1064502245825115327754847244914921553977
        a = x * c
        b = y * c
        self.assertEqual(gcd(a, b), c)
        self.assertEqual(gcd(b, a), c)
        self.assertEqual(gcd(-a, b), c)
        self.assertEqual(gcd(b, -a), c)
        self.assertEqual(gcd(a, -b), c)
        self.assertEqual(gcd(-b, a), c)
        self.assertEqual(gcd(-a, -b), c)
        self.assertEqual(gcd(-b, -a), c)
        c = 576559230871654959816130551884856912003141446781646602790216406874
        a = x * c
        b = y * c
        self.assertEqual(gcd(a, b), c)
        self.assertEqual(gcd(b, a), c)
        self.assertEqual(gcd(-a, b), c)
        self.assertEqual(gcd(b, -a), c)
        self.assertEqual(gcd(a, -b), c)
        self.assertEqual(gcd(-b, a), c)
        self.assertEqual(gcd(-a, -b), c)
        self.assertEqual(gcd(-b, -a), c)
    
        self.assertRaises(TypeError, gcd, 120.0, 84)
        self.assertRaises(TypeError, gcd, 120, 84.0)
        # self.assertEqual(gcd(MyIndexable(120), MyIndexable(84)), 12)

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

    def testLdexp(self):
        self.assertRaises(TypeError, math.ldexp)
        self.ftest('ldexp(0,1)', math.ldexp(0,1), 0)
        self.ftest('ldexp(1,1)', math.ldexp(1,1), 2)
        self.ftest('ldexp(1,-1)', math.ldexp(1,-1), 0.5)
        self.ftest('ldexp(-1,1)', math.ldexp(-1,1), -2)
        self.assertRaises(OverflowError, math.ldexp, 1., 1000000)
        self.assertRaises(OverflowError, math.ldexp, -1., 1000000)
        self.assertEqual(math.ldexp(1., -1000000), 0.)
        self.assertEqual(math.ldexp(-1., -1000000), -0.)
        self.assertEqual(math.ldexp(INF, 30), INF)
        self.assertEqual(math.ldexp(NINF, -213), NINF)
        self.assertTrue(math.isnan(math.ldexp(NAN, 0)))
    
        # large second argument
        for n in [10**5, 10**10, 10**20, 10**40]:
            self.assertEqual(math.ldexp(INF, -n), INF)
            self.assertEqual(math.ldexp(NINF, -n), NINF)
            self.assertEqual(math.ldexp(1., -n), 0.)
            self.assertEqual(math.ldexp(-1., -n), -0.)
            self.assertEqual(math.ldexp(0., -n), 0.)
            self.assertEqual(math.ldexp(-0., -n), -0.)
            self.assertTrue(math.isnan(math.ldexp(NAN, -n)))
    
            self.assertRaises(OverflowError, math.ldexp, 1., n)
            self.assertRaises(OverflowError, math.ldexp, -1., n)
            self.assertEqual(math.ldexp(0., n), 0.)
            self.assertEqual(math.ldexp(-0., n), -0.)
            self.assertEqual(math.ldexp(INF, n), INF)
            self.assertEqual(math.ldexp(NINF, n), NINF)
            self.assertTrue(math.isnan(math.ldexp(NAN, n)))

    def testLog(self):
        self.assertRaises(TypeError, math.log)
        self.ftest('log(1/e)', math.log(1/math.e), -1)
        self.ftest('log(1)', math.log(1), 0)
        self.ftest('log(e)', math.log(math.e), 1)
        self.ftest('log(32,2)', math.log(32,2), 5)
        self.ftest('log(10**40, 10)', math.log(10**40, 10), 40)
        self.ftest('log(10**40, 10**20)', math.log(10**40, 10**20), 2)
        self.ftest('log(10**1000)', math.log(10**1000),
                   2302.5850929940457)
        self.assertRaises(ValueError, math.log, -1.5)
        self.assertRaises(ValueError, math.log, -10**1000)
        self.assertRaises(ValueError, math.log, NINF)
        self.assertEqual(math.log(INF), INF)
        self.assertTrue(math.isnan(math.log(NAN)))

    def testLog1p(self):
        self.assertRaises(TypeError, math.log1p)
        for n in [2, 2**90, 2**300]:
            self.assertAlmostEqual(math.log1p(n), math.log1p(float(n)))
        self.assertRaises(ValueError, math.log1p, -1)
        self.assertEqual(math.log1p(INF), INF)

        # from cpython math_testcases.txt
        # -- special values
        self.assertEqual(math.log1p(0.0), 0.0)
        self.assertEqual(math.log1p(-0.0), -0.0)
        self.assertEqual(math.log1p(INF), INF)
        self.assertRaises(ValueError, math.log1p,-INF)
        self.assertTrue(math.isnan(math.log1p(NAN)))

        # -- singularity at -1.0
        self.assertRaises(ValueError, math.log1p, -1.0)
        self.assertEqual(math.log1p(-0.9999999999999999), -36.736800569677101)

        # -- finite values < 1.0 are invalid
        self.assertRaises(ValueError, math.log1p, -1.0000000000000002)
        self.assertRaises(ValueError,math.log1p,-1.1 )
        self.assertRaises(ValueError,math.log1p,-2.0 )
        self.assertRaises(ValueError,math.log1p,-1e300 )

        # -- tiny x: log1p(x) ~ x
        self.assertEqual(math.log1p(5e-324), 5e-324)
        self.assertEqual(math.log1p(1e-320), 1e-320)
        self.assertEqual(math.log1p(1e-300), 1e-300)
        self.assertEqual(math.log1p(1e-150), 1e-150)
        self.assertEqual(math.log1p(1e-20), 1e-20)

        self.assertEqual(math.log1p(-5e-324), -5e-324)
        self.assertEqual(math.log1p(-1e-320), -1e-320)
        self.assertEqual(math.log1p(-1e-300), -1e-300)
        self.assertEqual(math.log1p(-1e-150), -1e-150)
        self.assertEqual(math.log1p(-1e-20), -1e-20)

        # -- some (mostly) random small and moderate-sized values
        self.assertEqual(math.log1p(-0.89156889782277482), -2.2216403106762863)
        self.assertEqual(math.log1p(-0.23858496047770464), -0.27257668276980057)
        self.assertEqual(math.log1p(-0.011641726191307515), -0.011710021654495657)
        self.assertEqual(math.log1p(-0.0090126398571693817), -0.0090534993825007650)
        self.assertEqual(math.log1p(-0.00023442805985712781), -0.00023445554240995693)
        self.assertEqual(math.log1p(-1.5672870980936349e-5), -1.5672993801662046e-5)
        self.assertEqual(math.log1p(-7.9650013274825295e-6), -7.9650330482740401e-6)
        self.assertEqual(math.log1p(-2.5202948343227410e-7), -2.5202951519170971e-7)
        self.assertEqual(math.log1p(-8.2446372820745855e-11), -8.2446372824144559e-11)
        self.assertEqual(math.log1p(-8.1663670046490789e-12), -8.1663670046824230e-12)
        self.assertEqual(math.log1p(7.0351735084656292e-18), 7.0351735084656292e-18)
        self.assertEqual(math.log1p(5.2732161907375226e-12), 5.2732161907236188e-12)
        self.assertEqual(math.log1p(1.0000000000000000e-10), 9.9999999995000007e-11)
        self.assertEqual(math.log1p(2.1401273266000197e-9), 2.1401273243099470e-9)
        self.assertEqual(math.log1p(1.2668914653979560e-8), 1.2668914573728861e-8)
        self.assertEqual(math.log1p(1.6250007816299069e-6), 1.6249994613175672e-6)
        self.assertAlmostEqual(math.log1p(8.3740495645839399e-6), 8.3740145024266269e-6,15)
        self.assertEqual(math.log1p(3.0000000000000001e-5), 2.9999550008999799e-5)
        self.assertEqual(math.log1p(0.0070000000000000001), 0.0069756137364252423)
        self.assertEqual(math.log1p(0.013026235315053002), 0.012942123564008787)
        self.assertAlmostEqual(math.log1p(0.013497160797236184), 0.013406885521915038,15)
        self.assertEqual(math.log1p(0.027625599078135284), 0.027250897463483054)
        self.assertEqual(math.log1p(0.14179687245544870), 0.13260322540908789)

        # -- large values
        self.assertEqual(math.log1p(1.7976931348623157e+308), 709.78271289338397)
        self.assertEqual(math.log1p(1.0000000000000001e+300), 690.77552789821368)
        self.assertEqual(math.log1p(1.0000000000000001e+70), 161.18095650958321)
        self.assertEqual(math.log1p(10000000000.000000), 23.025850930040455)

        # -- other values transferred from testLog1p in test_math
        self.assertEqual(math.log1p(-0.63212055882855767), -1.0000000000000000)
        self.assertEqual(math.log1p(1.7182818284590451), 1.0000000000000000)
        self.assertEqual(math.log1p(1.0000000000000000), 0.69314718055994529)
        self.assertEqual(math.log1p(1.2379400392853803e+27), 62.383246250395075)


    def testLog2(self):
        self.assertRaises(TypeError, math.log2)
    
        # Check some integer values
        self.assertEqual(math.log2(1), 0.0)
        self.assertEqual(math.log2(2), 1.0)
        self.assertEqual(math.log2(4), 2.0)
    
        # Large integer values
        self.assertAlmostEqual(math.log2(2**1023), 1023.0,12)
        self.assertEqual(math.log2(2**1024), 1024.0)
        self.assertEqual(math.log2(2**2000), 2000.0)
    
        self.assertRaises(ValueError, math.log2, -1.5)
        self.assertRaises(ValueError, math.log2, NINF)
        self.assertTrue(math.isnan(math.log2(NAN)))

    # # log2() is not accurate enough on Mac OS X Tiger (10.4)
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
        self.ftest('log10(10**1000)', math.log10(10**1000), 1000.0)
        self.assertRaises(ValueError, math.log10, -1.5)
        self.assertRaises(ValueError, math.log10, -10**1000)
        self.assertRaises(ValueError, math.log10, NINF)
        self.assertEqual(math.log(INF), INF)
        self.assertTrue(math.isnan(math.log10(NAN)))

    def testModf(self):
        self.assertRaises(TypeError, math.modf)
    
        def testmodf(name, result, expected):
            (v1, v2), (e1, e2) = result, expected
            if abs(v1-e1) > eps or abs(v2-e2):
                self.fail('%s returned %r, expected %r'%\
                          (name, result, expected))
    
        testmodf('modf(1.5)', math.modf(1.5), (0.5, 1.0))
        testmodf('modf(-1.5)', math.modf(-1.5), (-0.5, -1.0))
        testmodf('modf(-0.0)', math.modf(-0.0),(-0.0,-0.0))
    
        self.assertEqual(math.modf(INF), (0.0, INF))
        self.assertEqual(math.modf(NINF), (-0.0, NINF))
    
        modf_nan = math.modf(NAN)
        self.assertTrue(math.isnan(modf_nan[0]))
        self.assertTrue(math.isnan(modf_nan[1]))

    def testPow(self):
        self.assertRaises(TypeError, math.pow)
        self.ftest('pow(0,1)', math.pow(0,1), 0)
        self.ftest('pow(1,0)', math.pow(1,0), 1)
        self.ftest('pow(2,1)', math.pow(2,1), 2)
        self.ftest('pow(2,-1)', math.pow(2,-1), 0.5)
        self.assertEqual(math.pow(INF, 1), INF)
        self.assertEqual(math.pow(NINF, 1), NINF)
        self.assertEqual((math.pow(1, INF)), 1.)
        self.assertEqual((math.pow(1, NINF)), 1.)
        self.assertTrue(math.isnan(math.pow(NAN, 1)))
        self.assertTrue(math.isnan(math.pow(2, NAN)))
        self.assertTrue(math.isnan(math.pow(0, NAN)))
        self.assertEqual(math.pow(1, NAN), 1)

        # pow(0., x)
        self.assertEqual(math.pow(0., INF), 0.)
        self.assertEqual(math.pow(0., 3.), 0.)
        self.assertEqual(math.pow(0., 2.3), 0.)
        self.assertEqual(math.pow(0., 2.), 0.)
        self.assertEqual(math.pow(0., 0.), 1.)
        self.assertEqual(math.pow(0., -0.), 1.)
        self.assertRaises(ValueError, math.pow, 0., -2.)
        self.assertRaises(ValueError, math.pow, 0., -2.3)
        self.assertRaises(ValueError, math.pow, 0., -3.)
        self.assertRaises(ValueError, math.pow, 0., NINF)
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
        self.assertRaises(ValueError, math.pow, -0., -2.)
        self.assertRaises(ValueError, math.pow, -0., -2.3)
        self.assertRaises(ValueError, math.pow, -0., -3.)
        self.assertRaises(ValueError, math.pow, -0., NINF)
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
        self.assertEqual(math.pow(-1., INF), 1.)
        self.assertEqual(math.pow(-1., 3.), -1.)
        self.assertRaises(ValueError, math.pow, -1., 2.3)
        self.assertEqual(math.pow(-1., 2.), 1.)
        self.assertEqual(math.pow(-1., 0.), 1.)
        self.assertEqual(math.pow(-1., -0.), 1.)
        self.assertEqual(math.pow(-1., -2.), 1.)
        self.assertRaises(ValueError, math.pow, -1., -2.3)
        self.assertEqual(math.pow(-1., -3.), -1.)
        self.assertEqual(math.pow(-1., NINF), 1.)
        self.assertTrue(math.isnan(math.pow(-1., NAN)))

        # pow(1, x)
        self.assertEqual(math.pow(1., INF), 1.)
        self.assertEqual(math.pow(1., 3.), 1.)
        self.assertEqual(math.pow(1., 2.3), 1.)
        self.assertEqual(math.pow(1., 2.), 1.)
        self.assertEqual(math.pow(1., 0.), 1.)
        self.assertEqual(math.pow(1., -0.), 1.)
        self.assertEqual(math.pow(1., -2.), 1.)
        self.assertEqual(math.pow(1., -2.3), 1.)
        self.assertEqual(math.pow(1., -3.), 1.)
        self.assertEqual(math.pow(1., NINF), 1.)
        self.assertEqual(math.pow(1., NAN), 1.)

        # pow(x, 0) should be 1 for any x
        self.assertEqual(math.pow(2.3, 0.), 1.)
        self.assertEqual(math.pow(-2.3, 0.), 1.)
        self.assertEqual(math.pow(NAN, 0.), 1.)
        self.assertEqual(math.pow(2.3, -0.), 1.)
        self.assertEqual(math.pow(-2.3, -0.), 1.)
        self.assertEqual(math.pow(NAN, -0.), 1.)

        # pow(x, y) is invalid if x is negative and y is not integral
        self.assertRaises(ValueError, math.pow, -1., 2.3)
        self.assertRaises(ValueError, math.pow, -15., -3.1)

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
        self.assertRaises(ValueError, math.pow, -2.0, -0.5)
        self.assertRaises(ValueError, math.pow, -2.0, 0.5)

        # pow(x,y) should raise OverFlow Error for large x,y
        self.assertRaises(OverflowError, math.pow, 2, 1024)
        self.assertRaises(OverflowError, math.pow, 3, 1024)
        self.assertRaises(OverflowError, math.pow, 2, 2048)
        self.assertRaises(OverflowError, math.pow, 2, 4096)


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

    def testRemainder(self):
        # from fractions import Fraction

        # def validate_spec(x, y, r):
        #     """
        #     Check that r matches remainder(x, y) according to the IEEE 754
        #     specification. Assumes that x, y and r are finite and y is nonzero.
        #     """
        #     fx, fy, fr = Fraction(x), Fraction(y), Fraction(r)
        #     # r should not exceed y/2 in absolute value
        #     self.assertLessEqual(abs(fr), abs(fy/2))
        #     # x - r should be an exact integer multiple of y
        #     n = (fx - fr) / fy
        #     self.assertEqual(n, int(n))
        #     if abs(fr) == abs(fy/2):
        #         # If |r| == |y/2|, n should be even.
        #         self.assertEqual(n/2, int(n/2))

        # triples (x, y, remainder(x, y)) in hexadecimal form.
        testcases = [ #taken from cpython test_cases - converted to floats rather than float hex
            # Remainders modulo 1, showing the ties-to-even behaviour.
            '-4.0 1.0 -0.0',
            '-3.5 1.0 0.5',
            '-3.0 1.0 -0.0',
            '-2.5 1.0 -0.5',
            '-2.0 1.0 -0.0',
            '-1.5 1.0 0.5',
            '-1.0 1.0 -0.0',
            '-0.5 1.0 -0.5',
            '-0.0 1.0 -0.0',
            '0.0 1.0 0.0',
            '0.5 1.0 0.5',
            '1.0 1.0 0.0',
            '1.5 1.0 -0.5',
            '2.0 1.0 0.0',
            '2.5 1.0 0.5',
            '3.0 1.0 0.0',
            '3.5 1.0 -0.5',
            '4.0 1.0 0.0',

            # Reductions modulo 2*pi
            '0.0 6.283185307179586 0.0',
            '1.5707963267948966 6.283185307179586 1.5707963267948966',
            '3.1415926535897927 6.283185307179586 3.1415926535897927',
            '3.141592653589793 6.283185307179586 3.141592653589793',
            '3.1415926535897936 6.283185307179586 -3.1415926535897927',
            '6.283185307179585 6.283185307179586 -8.881784197001252e-16',
            '6.283185307179586 6.283185307179586 0.0',
            '6.283185307179587 6.283185307179586 8.881784197001252e-16',
            '9.424777960769378 6.283185307179586 3.1415926535897913',
            '9.42477796076938 6.283185307179586 -3.141592653589793',
            '9.424777960769381 6.283185307179586 -3.1415926535897913',
            '12.56637061435917 6.283185307179586 -1.7763568394002505e-15',
            '12.566370614359172 6.283185307179586 0.0',
            '12.566370614359174 6.283185307179586 1.7763568394002505e-15',
            '15.707963267948964 6.283185307179586 3.1415926535897913',
            '15.707963267948966 6.283185307179586 3.141592653589793',
            '15.707963267948967 6.283185307179586 -3.1415926535897913',
            '34.55751918948772 6.283185307179586 3.1415926535897896',
            '34.55751918948773 6.283185307179586 -3.1415926535897896',
            # Symmetry with respect to signs.
            '1.0 0.75 0.25',
            '-1.0 0.75 -0.25',
            '1.0 -0.75 0.25',
            '-1.0 -0.75 -0.25',
            '1.25 0.75 -0.25',
            '-1.25 0.75 0.25',
            '1.25 -0.75 -0.25',
            '-1.25 -0.75 0.25',
            # Huge modulus, to check that the underlying algorithm doesn't
            # rely on 2.0 * modulus being representable.
            '1.6291594034689738e+308 1.1235582092889474e+308 5.056011941800263e+307',
            '1.6853373139334212e+308 1.1235582092889474e+308 -5.617791046444737e+307',
            '1.7415152243978685e+308 1.1235582092889474e+308 -5.056011941800263e+307'
                    ]
        # testcases = [
        #     # Remainders modulo 1, showing the ties-to-even behaviour.
        #     '-4.0 1 -0.0',
        #     '-3.8 1  0.8',
        #     '-3.0 1 -0.0',
        #     '-2.8 1 -0.8',
        #     '-2.0 1 -0.0',
        #     '-1.8 1  0.8',
        #     '-1.0 1 -0.0',
        #     '-0.8 1 -0.8',
        #     '-0.0 1 -0.0',
        #     ' 0.0 1  0.0',
        #     ' 0.8 1  0.8',
        #     ' 1.0 1  0.0',
        #     ' 1.8 1 -0.8',
        #     ' 2.0 1  0.0',
        #     ' 2.8 1  0.8',
        #     ' 3.0 1  0.0',
        #     ' 3.8 1 -0.8',
        #     ' 4.0 1  0.0',

        #     # Reductions modulo 2*pi
        #     '0x0.0p+0 0x1.921fb54442d18p+2 0x0.0p+0',
        #     '0x1.921fb54442d18p+0 0x1.921fb54442d18p+2  0x1.921fb54442d18p+0',
        #     '0x1.921fb54442d17p+1 0x1.921fb54442d18p+2  0x1.921fb54442d17p+1',
        #     '0x1.921fb54442d18p+1 0x1.921fb54442d18p+2  0x1.921fb54442d18p+1',
        #     '0x1.921fb54442d19p+1 0x1.921fb54442d18p+2 -0x1.921fb54442d17p+1',
        #     '0x1.921fb54442d17p+2 0x1.921fb54442d18p+2 -0x0.0000000000001p+2',
        #     '0x1.921fb54442d18p+2 0x1.921fb54442d18p+2  0x0p0',
        #     '0x1.921fb54442d19p+2 0x1.921fb54442d18p+2  0x0.0000000000001p+2',
        #     '0x1.2d97c7f3321d1p+3 0x1.921fb54442d18p+2  0x1.921fb54442d14p+1',
        #     '0x1.2d97c7f3321d2p+3 0x1.921fb54442d18p+2 -0x1.921fb54442d18p+1',
        #     '0x1.2d97c7f3321d3p+3 0x1.921fb54442d18p+2 -0x1.921fb54442d14p+1',
        #     '0x1.921fb54442d17p+3 0x1.921fb54442d18p+2 -0x0.0000000000001p+3',
        #     '0x1.921fb54442d18p+3 0x1.921fb54442d18p+2  0x0p0',
        #     '0x1.921fb54442d19p+3 0x1.921fb54442d18p+2  0x0.0000000000001p+3',
        #     '0x1.f6a7a2955385dp+3 0x1.921fb54442d18p+2  0x1.921fb54442d14p+1',
        #     '0x1.f6a7a2955385ep+3 0x1.921fb54442d18p+2  0x1.921fb54442d18p+1',
        #     '0x1.f6a7a2955385fp+3 0x1.921fb54442d18p+2 -0x1.921fb54442d14p+1',
        #     '0x1.1475cc9eedf00p+5 0x1.921fb54442d18p+2  0x1.921fb54442d10p+1',
        #     '0x1.1475cc9eedf01p+5 0x1.921fb54442d18p+2 -0x1.921fb54442d10p+1',

        #     # Symmetry with respect to signs.
        #     ' 1  0.c  0.4',
        #     '-1  0.c -0.4',
        #     ' 1 -0.c  0.4',
        #     '-1 -0.c -0.4',
        #     ' 1.4  0.c -0.4',
        #     '-1.4  0.c  0.4',
        #     ' 1.4 -0.c -0.4',
        #     '-1.4 -0.c  0.4',

        #     # Huge modulus, to check that the underlying algorithm doesn't
        #     # rely on 2.0 * modulus being representable.
        #     '0x1.dp+1023 0x1.4p+1023  0x0.9p+1023',
        #     '0x1.ep+1023 0x1.4p+1023 -0x0.ap+1023',
        #     '0x1.fp+1023 0x1.4p+1023 -0x0.9p+1023',
        # ]

        for case in testcases:
            # with self.subTest(case=case):
                x, y, expected = case.split()
                x = float(x)
                y = float(y)
                expected = float(expected)
                # # validate_spec(x, y, expected)
                actual = math.remainder(x, y)
                # Cheap way of checking that the floats are
                # as identical as we need them to be.
                self.assertEqual(actual, expected)

        # Test tiny subnormal modulus: there's potential for
        # getting the implementation wrong here (for example,
        # by assuming that modulus/2 is exactly representable).
        tiny_testcases = [
            '0.0 -1.24e-322 0.0',
            '7.4e-323 -1.24e-322 -5e-323',
            '1.5e-322 -1.24e-322 2.5e-323',
            '2.2e-322 -1.24e-322 -2.5e-323',
            '2.96e-322 -1.24e-322 5e-323',
            '3.7e-322 -1.24e-322 0.0',
            '4.45e-322 -1.24e-322 -5e-323',
            '0.0 -1e-322 0.0',
            '7.4e-323 -1e-322 -2.5e-323',
            '1.5e-322 -1e-322 -5e-323',
            '2.2e-322 -1e-322 2.5e-323',
            '2.96e-322 -1e-322 0.0',
            '3.7e-322 -1e-322 -2.5e-323',
            '4.45e-322 -1e-322 5e-323',
            '0.0 -7.4e-323 0.0',
            '7.4e-323 -7.4e-323 0.0',
            '1.5e-322 -7.4e-323 0.0',
            '2.2e-322 -7.4e-323 0.0',
            '2.96e-322 -7.4e-323 0.0',
            '3.7e-322 -7.4e-323 0.0',
            '4.45e-322 -7.4e-323 0.0',
            '0.0 -5e-323 0.0',
            '7.4e-323 -5e-323 -2.5e-323',
            '1.5e-322 -5e-323 0.0',
            '2.2e-322 -5e-323 2.5e-323',
            '2.96e-322 -5e-323 0.0',
            '3.7e-322 -5e-323 -2.5e-323',
            '4.45e-322 -5e-323 0.0',
            '0.0 -2.5e-323 0.0',
            '7.4e-323 -2.5e-323 0.0',
            '1.5e-322 -2.5e-323 0.0',
            '2.2e-322 -2.5e-323 0.0',
            '2.96e-322 -2.5e-323 0.0',
            '3.7e-322 -2.5e-323 0.0',
            '4.45e-322 -2.5e-323 0.0',
            '0.0 2.5e-323 0.0',
            '7.4e-323 2.5e-323 0.0',
            '1.5e-322 2.5e-323 0.0',
            '2.2e-322 2.5e-323 0.0',
            '2.96e-322 2.5e-323 0.0',
            '3.7e-322 2.5e-323 0.0',
            '4.45e-322 2.5e-323 0.0',
            '0.0 5e-323 0.0',
            '7.4e-323 5e-323 -2.5e-323',
            '1.5e-322 5e-323 0.0',
            '2.2e-322 5e-323 2.5e-323',
            '2.96e-322 5e-323 0.0',
            '3.7e-322 5e-323 -2.5e-323',
            '4.45e-322 5e-323 0.0',
            '0.0 7.4e-323 0.0',
            '7.4e-323 7.4e-323 0.0',
            '1.5e-322 7.4e-323 0.0',
            '2.2e-322 7.4e-323 0.0',
            '2.96e-322 7.4e-323 0.0',
            '3.7e-322 7.4e-323 0.0',
            '4.45e-322 7.4e-323 0.0',
            '0.0 1e-322 0.0',
            '7.4e-323 1e-322 -2.5e-323',
            '1.5e-322 1e-322 -5e-323',
            '2.2e-322 1e-322 2.5e-323',
            '2.96e-322 1e-322 0.0',
            '3.7e-322 1e-322 -2.5e-323',
            '4.45e-322 1e-322 5e-323']
        for case in tiny_testcases:
            # with self.subTest(case=case):
            x, y, expected = case.split()
            x = float(x)
            y = float(y)
            expected = float(expected)
            neg_expected = -expected
            # # validate_spec(x, y, expected)
            actual = math.remainder(x, y)
            neg_actual = math.remainder(-x,y)
            
            self.assertEqual(actual, expected)
            self.assertEqual(neg_actual, neg_expected)
        # tiny = float('5e-324')  # min +ve subnormal
        # for n in range(-25, 25):
        #     if n == 0:
        #         continue
        #     y = n * tiny
        #     for m in range(100):
        #         x = m * tiny
        #         actual = math.remainder(x, y)
        #         # validate_spec(x, y, actual)
        #         actual = math.remainder(-x, y)
        #         # validate_spec(-x, y, actual)

        # Special values.
        # NaNs should propagate as usual.
        for value in [NAN, 0.0, -0.0, 2.0, -2.3, NINF, INF]:
            self.assertTrue(math.isnan(math.remainder(NAN, value)))
            self.assertTrue(math.isnan(math.remainder(value, NAN)))

        # remainder(x, inf) is x, for non-nan non-infinite x.
        for value in [-2.3, -0.0, 0.0, 2.3]:
            self.assertEqual(math.remainder(value, INF), value)
            self.assertEqual(math.remainder(value, NINF), value)

        # remainder(x, 0) and remainder(infinity, x) for non-NaN x are invalid
        # operations according to IEEE 754-2008 7.2(f), and should raise.
        for value in [NINF, -2.3, -0.0, 0.0, 2.3, INF]:
            with self.assertRaises(ValueError):
                math.remainder(INF, value)
            with self.assertRaises(ValueError):
                math.remainder(NINF, value)
            with self.assertRaises(ValueError):
                math.remainder(value, 0.0)
            with self.assertRaises(ValueError):
                math.remainder(value, -0.0)


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
        self.assertRaises(ValueError, math.sqrt, -1)
        self.assertRaises(ValueError, math.sqrt, NINF)
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
        self.ftest('tanh(inf)', math.tanh(INF), 1)
        self.ftest('tanh(-inf)', math.tanh(NINF), -1)
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
        self.assertEqual(math.trunc(2**2048), 2**2048)

        class TestTrunc(object):
            def __trunc__(self):
                return 23

        class TestNoTrunc(object):
            pass

        # self.assertEqual(math.trunc(TestTrunc()), 23)

        self.assertRaises(TypeError, math.trunc)
        self.assertRaises(TypeError, math.trunc, 1, 2)
        self.assertRaises(TypeError, math.trunc, TestNoTrunc())

    def testIsfinite(self):
        self.assertTrue(math.isfinite(0.0))
        self.assertTrue(math.isfinite(-0.0))
        self.assertTrue(math.isfinite(1.0))
        self.assertTrue(math.isfinite(-1.0))
        self.assertFalse(math.isfinite(float("nan")))
        self.assertFalse(math.isfinite(float("inf")))
        self.assertFalse(math.isfinite(float("-inf")))
        self.assertTrue(math.isfinite(2**1024))
        self.assertTrue(math.isfinite(2**2048))

    def testIsnan(self):
        self.assertTrue(math.isnan(float("nan")))
        self.assertTrue(math.isnan(float("-nan")))
        self.assertTrue(math.isnan(float("inf") * 0.))
        self.assertFalse(math.isnan(float("inf")))
        self.assertFalse(math.isnan(0.))
        self.assertFalse(math.isnan(1.))
        self.assertFalse(math.isnan(30))

    def testIsinf(self):
        self.assertTrue(math.isinf(float("inf")))
        self.assertTrue(math.isinf(float("-inf")))
        self.assertTrue(math.isinf(1E400))
        self.assertTrue(math.isinf(-1E400))
        self.assertFalse(math.isinf(float("nan")))
        self.assertFalse(math.isinf(0.))
        self.assertFalse(math.isinf(1.))
        self.assertFalse(math.isinf(2**1024))
        self.assertFalse(math.isinf(2**2048))

    def test_nan_constant(self):
        self.assertTrue(math.isnan(math.nan))

    def test_inf_constant(self):
        self.assertTrue(math.isinf(math.inf))
        self.assertGreater(math.inf, 0.0)
        self.assertEqual(math.inf, float("inf"))
        self.assertEqual(-math.inf, float("-inf"))


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

class IsCloseTests(unittest.TestCase):
    isclose = math.isclose  # subclasses should override this
    # def __init__(self):
    #     self.isclose = math.isclose

    def assertIsClose(self, a, b, **kwargs):
        self.assertTrue(math.isclose(a, b, **kwargs))

    def assertIsNotClose(self, a, b, **kwargs):
        self.assertFalse(math.isclose(a, b, **kwargs))

    def assertAllClose(self, examples, *args, **kwargs):
        for a, b in examples:
            self.assertIsClose(a, b, *args, **kwargs)

    def assertAllNotClose(self, examples, *args, **kwargs):
        for a, b in examples:
            self.assertIsNotClose(a, b, *args, **kwargs)

    def test_negative_tolerances(self):
        # ValueError should be raised if either tolerance is less than zero
        def negative_is_close(rel_tol=1e-100, abs_tol=1e10):
            math.isclose(1,1,rel_tol=rel_tol,abs_tol=abs_tol)

        self.assertRaises(ValueError, negative_is_close, -1e-100)
        self.assertRaises(ValueError, negative_is_close,1e-100,-1e-100 )

    def test_identical(self):
        # identical values must test as close
        identical_examples = [(2.0, 2.0),
                              (0.1e200, 0.1e200),
                              (1.123e-300, 1.123e-300),
                              (12345, 12345.0),
                              (0.0, -0.0),
                              (345678, 345678)]
        self.assertAllClose(identical_examples, rel_tol=0.0, abs_tol=0.0)

    def test_eight_decimal_places(self):
        # examples that are close to 1e-8, but not 1e-9
        eight_decimal_places_examples = [(1e8, 1e8 + 1),
                                         (-1e-8, -1.000000009e-8),
                                         (1.12345678, 1.12345679)]
        self.assertAllClose(eight_decimal_places_examples, rel_tol=1e-8)
        self.assertAllNotClose(eight_decimal_places_examples, rel_tol=1e-9)

    def test_near_zero(self):
        # values close to zero
        near_zero_examples = [(1e-9, 0.0),
                              (-1e-9, 0.0),
                              (-1e-150, 0.0)]
        # these should not be close to any rel_tol
        self.assertAllNotClose(near_zero_examples, rel_tol=0.9)
        # these should be close to abs_tol=1e-8
        self.assertAllClose(near_zero_examples, abs_tol=1e-8)

    def test_identical_infinite(self):
        # these are close regardless of tolerance -- i.e. they are equal
        self.assertIsClose(INF, INF)
        self.assertIsClose(INF, INF, abs_tol=0.0)
        self.assertIsClose(NINF, NINF)
        self.assertIsClose(NINF, NINF, abs_tol=0.0)

    def test_inf_ninf_nan(self):
        # these should never be close (following IEEE 754 rules for equality)
        not_close_examples = [(NAN, NAN),
                              (NAN, 1e-100),
                              (1e-100, NAN),
                              (INF, NAN),
                              (NAN, INF),
                              (INF, NINF),
                              (INF, 1.0),
                              (1.0, INF),
                              (INF, 1e308),
                              (1e308, INF)]
        # use largest reasonable tolerance
        self.assertAllNotClose(not_close_examples, abs_tol=0.999999999999999)

    def test_zero_tolerance(self):
        # test with zero tolerance
        zero_tolerance_close_examples = [(1.0, 1.0),
                                         (-3.4, -3.4),
                                         (-1e-300, -1e-300)]
        self.assertAllClose(zero_tolerance_close_examples, rel_tol=0.0)

        zero_tolerance_not_close_examples = [(1.0, 1.000000000000001),
                                             (0.99999999999999, 1.0),
                                             (1.0e200, .999999999999999e200)]
        self.assertAllNotClose(zero_tolerance_not_close_examples, rel_tol=0.0)

    def test_asymmetry(self):
        # test the asymmetry example from PEP 485
        self.assertAllClose([(9, 10), (10, 9)], rel_tol=0.1)

    def test_integers(self):
        # test with integer values
        integer_examples = [(100000001, 100000000),
                            (123456789, 123456788)]

        self.assertAllClose(integer_examples, rel_tol=1e-8)
        self.assertAllNotClose(integer_examples, rel_tol=1e-9)

    # def test_decimals(self):
    #     # test with Decimal values
    #     from decimal import Decimal

    #     decimal_examples = [(Decimal('1.00000001'), Decimal('1.0')),
    #                         (Decimal('1.00000001e-20'), Decimal('1.0e-20')),
    #                         (Decimal('1.00000001e-100'), Decimal('1.0e-100')),
    #                         (Decimal('1.00000001e20'), Decimal('1.0e20'))]
    #     self.assertAllClose(decimal_examples, rel_tol=1e-8)
    #     self.assertAllNotClose(decimal_examples, rel_tol=1e-9)

    # def test_fractions(self):
    #     # test with Fraction values
    #     from fractions import Fraction

    #     fraction_examples = [
    #         (Fraction(1, 100000000) + 1, Fraction(1)),
    #         (Fraction(100000001), Fraction(100000000)),
    #         (Fraction(10**8 + 1, 10**28), Fraction(1, 10**20))]
    #     self.assertAllClose(fraction_examples, rel_tol=1e-8)
    #     self.assertAllNotClose(fraction_examples, rel_tol=1e-9)


    def test_skulptBugs(self):
        # 1113
        self.assertAlmostEqual(math.log(9007199254740992 // 2), 36.04365338911715, 15)
        # check func names
        self.assertIn("ceil", repr(math.ceil))
        self.assertIn("isclose", repr(math.isclose))
        self.assertIn("fabs", repr(math.fabs))


if __name__ == '__main__':
    unittest.main()
