import unittest

from random import random
from math import atan2, isnan, copysign
import operator

INF = float("inf")
NAN = float("nan")
# These tests ensure that complex math does the right thing

class ComplexTest(unittest.TestCase):

    def assertAlmostEqual(self, a, b):
        if isinstance(a, complex):
            if isinstance(b, complex):
                unittest.TestCase.assertAlmostEqual(self, a.real, b.real)
                unittest.TestCase.assertAlmostEqual(self, a.imag, b.imag)
            else:
                unittest.TestCase.assertAlmostEqual(self, a.real, b)
                unittest.TestCase.assertAlmostEqual(self, a.imag, 0.)
        else:
            if isinstance(b, complex):
                unittest.TestCase.assertAlmostEqual(self, a, b.real)
                unittest.TestCase.assertAlmostEqual(self, 0., b.imag)
            else:
                unittest.TestCase.assertAlmostEqual(self, a, b)

    def assertCloseAbs(self, x, y, eps=1e-9):
        """Return true iff floats x and y "are close"."""
        # put the one with larger magnitude second
        if abs(x) > abs(y):
            x, y = y, x
        if y == 0:
            return abs(x) < eps
        if x == 0:
            return abs(y) < eps
        # check that relative difference < eps
        self.assertTrue(abs((x-y)/y) < eps)

    def assertFloatsAreIdentical(self, x, y):
        """assert that floats x and y are identical, in the sense that:
        (1) both x and y are nans, or
        (2) both x and y are infinities, with the same sign, or
        (3) both x and y are zeros, with the same sign, or
        (4) x and y are both finite and nonzero, and x == y

        """
        msg = 'floats {!r} and {!r} are not identical'

        if isnan(x) or isnan(y):
            if isnan(x) and isnan(y):
                return
        elif x == y:
            if x != 0.0:
                return
            # both zero; check that signs match
            elif copysign(1.0, x) == copysign(1.0, y):
                return
            else:
                msg += ': zeros have different signs'
        self.fail(msg.format(x, y))

    def assertClose(self, x, y, eps=1e-9):
        """Return true iff complexes x and y "are close"."""
        self.assertCloseAbs(x.real, y.real, eps)
        self.assertCloseAbs(x.imag, y.imag, eps)

    def check_div(self, x, y):
        """Compute complex z=x*y, and check that z/x==y and z/y==x."""
        z = x * y
        if x != 0:
            q = z / x
            self.assertClose(q, y)
            q = z.__truediv__(x)
            self.assertClose(q, y)
        if y != 0:
            q = z / y
            self.assertClose(q, x)
            q = z.__truediv__(y)
            self.assertClose(q, x)

    def test_truediv(self):
        simple_real = [float(i) for i in range(-5, 6)]
        simple_complex = [complex(x, y) for x in simple_real for y in simple_real]
        for x in simple_complex:
            for y in simple_complex:
                self.check_div(x, y)

        # A naive complex division algorithm (such as in 2.0) is very prone to
        # nonsense errors for these (overflows and underflows).
        self.check_div(complex(1e200, 1e200), 1+0j)
        self.check_div(complex(1e-200, 1e-200), 1+0j)

        # Just for fun.
        for i in range(100):
            self.check_div(complex(random(), random()),
                           complex(random(), random()))

        self.assertRaises(ZeroDivisionError, complex.__truediv__, 1+1j, 0+0j)
        # FIXME: The following currently crashes on Alpha
        # self.assertRaises(OverflowError, pow, 1e200+1j, 1e200+1j)

        self.assertAlmostEqual(complex.__truediv__(2+0j, 1+1j), 1-1j)
        self.assertRaises(ZeroDivisionError, complex.__truediv__, 1+1j, 0+0j)

        for denom_real, denom_imag in [(0, NAN), (NAN, 0), (NAN, NAN)]:
            z = complex(0, 0) / complex(denom_real, denom_imag)
            self.assertTrue(isnan(z.real))
            self.assertTrue(isnan(z.imag))

    def test_floordiv(self):
        self.assertRaises(TypeError, complex.__floordiv__, 3+0j, 1.5+0j)
        self.assertRaises(TypeError, complex.__floordiv__, 3+0j, 0+0j)

    def test_richcompare(self):
        self.assertIs(complex.__eq__(1+1j, 1 << 10000), False)
        self.assertRaises(TypeError, complex.__lt__, 1+1j, None)
        self.assertIs(complex.__eq__(1+1j, 1+1j), True)
        self.assertIs(complex.__eq__(1+1j, 2+2j), False)
        self.assertIs(complex.__ne__(1+1j, 1+1j), False)
        self.assertIs(complex.__ne__(1+1j, 2+2j), True)
        self.assertFalse(complex.__eq__(1j, None), False)
        self.assertFalse(complex.__eq__(1j, NotImplemented), False)

        for i in range(1, 100):
            f = i / 100.0
            self.assertIs(complex.__eq__(f+0j, f), True)
            self.assertIs(complex.__ne__(f+0j, f), False)
            self.assertIs(complex.__eq__(complex(f, f), f), False)
            self.assertIs(complex.__ne__(complex(f, f), f), True)
        self.assertRaises(TypeError, complex.__lt__, 1+1j, 2+2j)
        self.assertRaises(TypeError, complex.__le__, 1+1j, 2+2j)
        self.assertRaises(TypeError, complex.__gt__, 1+1j, 2+2j)
        self.assertRaises(TypeError, complex.__ge__, 1+1j, 2+2j)
        self.assertRaises(TypeError, operator.lt, 1+1j, 2+2j)
        self.assertRaises(TypeError, operator.le, 1+1j, 2+2j)
        self.assertRaises(TypeError, operator.gt, 1+1j, 2+2j)
        self.assertRaises(TypeError, operator.ge, 1+1j, 2+2j)
        self.assertIs(operator.eq(1+1j, 1+1j), True)
        self.assertIs(operator.eq(1+1j, 2+2j), False)
        self.assertIs(operator.ne(1+1j, 1+1j), False)
        self.assertIs(operator.ne(1+1j, 2+2j), True)

    #def test_richcompare_boundaries(self):
        #def check(n, deltas, is_equal, imag=0.0):
            #for delta in deltas:
               # i = n + delta
                #z = complex(i, imag)
                #self.assertIs(complex.__eq__(z, i), is_equal(delta))
                #self.assertIs(complex.__ne__(z, i), not is_equal(delta))
        # currently failing, though normal ones are working, maybe due to
        # currently buggy div operation
        # For IEEE-754 doubles the following should hold:
        #    x in [2 ** (52 + i), 2 ** (53 + i + 1)] -> x mod 2 ** i == 0
        # where the interval is representable, of course.
        #for i in range(1, 10):
        #    pow = 52 + i
        #    mult = 2 ** i
        #    check(2 ** pow, range(1, 101), lambda delta: delta % mult == 0)
        #    check(2 ** pow, range(1, 101), lambda delta: False, float(i))
        #check(2 ** 53, range(-100, 0), lambda delta: True)

    def test_mod(self):
        # % is no longer supported on complex numbers
        self.assertRaises(TypeError, (1+1j).__mod__, 0+0j)
        self.assertRaises(TypeError, lambda: (3.33+4.43j) % 0)
        self.assertRaises(TypeError, (1+1j).__mod__, 4.3j)

    def test_divmod(self):
        # actually divmod is deprecated, though we have still the impl.
        #self.assertRaises(TypeError, divmod, 1+1j, 1+0j)
        #self.assertRaises(TypeError, divmod, 1+1j, 0+0j)
        # dummy test
        c = 1+1j
        self.assertEqual(str(c.__divmod__), "<bound method complex.<native JS> of (1.0000000000000000+1.0000000000000000j)>")


    def test_pow(self):
        self.assertAlmostEqual(pow(1+1j, 0+0j), 1.0)
        self.assertAlmostEqual(pow(0+0j, 2+0j), 0.0)
        self.assertRaises(ZeroDivisionError, pow, 0+0j, 1j)
        self.assertAlmostEqual(pow(1j, -1), 1/1j)
        self.assertAlmostEqual(pow(1j, 200), 1)
        self.assertRaises(ValueError, pow, 1+1j, 1+1j, 1+1j)

        a = 3.33+4.43j
        self.assertEqual(a ** 0j, 1)
        self.assertEqual(a ** 0.+0.j, 1)

        self.assertEqual(3j ** 0j, 1)
        self.assertEqual(3j ** 0, 1)

        try:
            0j ** a
        except ZeroDivisionError:
            pass
        else:
            self.fail("should fail 0.0 to negative or complex power")

        try:
            0j ** (3-2j)
        except ZeroDivisionError:
            pass
        else:
            self.fail("should fail 0.0 to negative or complex power")

        # The following is used to exercise certain code paths
        self.assertEqual(a ** 105, a ** 105)
        self.assertEqual(a ** -105, a ** -105)
        self.assertEqual(a ** -30, a ** -30)

        self.assertEqual(0.0j ** 0, 1)

        b = 5.1+2.3j
        self.assertRaises(ValueError, pow, a, b, 0)

    def test_boolcontext(self):
        for i in range(100):
            self.assertTrue(complex(random() + 1e-6, random() + 1e-6))
        self.assertTrue(not complex(0.0, 0.0))

    def test_conjugate(self):
        self.assertClose(complex(5.3, 9.8).conjugate(), 5.3-9.8j)

    def test_constructor(self):
        class OS:
            def __init__(self, value): self.value = value
            def __complex__(self): return self.value
        class NS(object):
            def __init__(self, value): self.value = value
            def __complex__(self): return self.value
        self.assertEqual(complex(OS(1+10j)), 1+10j)
        self.assertEqual(complex(NS(1+10j)), 1+10j)
        self.assertRaises(TypeError, complex, OS(None))
        self.assertRaises(TypeError, complex, NS(None))
        self.assertRaises(TypeError, complex, {})
        self.assertRaises(TypeError, complex, NS(1.5))
        self.assertRaises(TypeError, complex, NS(1))

        self.assertAlmostEqual(complex("1+10j"), 1+10j)
        self.assertAlmostEqual(complex(10), 10+0j)
        self.assertAlmostEqual(complex(10.0), 10+0j)
        self.assertAlmostEqual(complex(10), 10+0j)
        self.assertAlmostEqual(complex(10+0j), 10+0j)
        self.assertAlmostEqual(complex(1, 10), 1+10j)
        self.assertAlmostEqual(complex(1, 10), 1+10j)
        self.assertAlmostEqual(complex(1, 10.0), 1+10j)
        self.assertAlmostEqual(complex(1, 10), 1+10j)
        self.assertAlmostEqual(complex(1, 10), 1+10j)
        self.assertAlmostEqual(complex(1, 10.0), 1+10j)
        self.assertAlmostEqual(complex(1.0, 10), 1+10j)
        self.assertAlmostEqual(complex(1.0, 10), 1+10j)
        self.assertAlmostEqual(complex(1.0, 10.0), 1+10j)
        self.assertAlmostEqual(complex(3.14+0j), 3.14+0j)
        self.assertAlmostEqual(complex(3.14), 3.14+0j)
        self.assertAlmostEqual(complex(314), 314.0+0j)
        self.assertAlmostEqual(complex(314), 314.0+0j)
        self.assertAlmostEqual(complex(3.14+0j, 0j), 3.14+0j)
        self.assertAlmostEqual(complex(3.14, 0.0), 3.14+0j)
        self.assertAlmostEqual(complex(314, 0), 314.0+0j)
        self.assertAlmostEqual(complex(314, 0), 314.0+0j)
        self.assertAlmostEqual(complex(0j, 3.14j), -3.14+0j)
        self.assertAlmostEqual(complex(0.0, 3.14j), -3.14+0j)
        self.assertAlmostEqual(complex(0j, 3.14), 3.14j)
        self.assertAlmostEqual(complex(0.0, 3.14), 3.14j)
        self.assertAlmostEqual(complex("1"), 1+0j)
        self.assertAlmostEqual(complex("1j"), 1j)
        self.assertAlmostEqual(complex(),  0)
        self.assertAlmostEqual(complex("-1"), -1)
        self.assertAlmostEqual(complex("+1"), +1)
        self.assertAlmostEqual(complex("(1+2j)"), 1+2j)
        self.assertAlmostEqual(complex("(1.3+2.2j)"), 1.3+2.2j)
        self.assertAlmostEqual(complex("3.14+1J"), 3.14+1j)
        self.assertAlmostEqual(complex(" ( +3.14-6J )"), 3.14-6j)
        self.assertAlmostEqual(complex(" ( +3.14-J )"), 3.14-1j)
        self.assertAlmostEqual(complex(" ( +3.14+j )"), 3.14+1j)
        self.assertAlmostEqual(complex("J"), 1j)
        self.assertAlmostEqual(complex("( j )"), 1j)
        self.assertAlmostEqual(complex("+J"), 1j)
        self.assertAlmostEqual(complex("( -j)"), -1j)
        self.assertAlmostEqual(complex('1e-500'), 0.0 + 0.0j)
        self.assertAlmostEqual(complex('-1e-500j'), 0.0 - 0.0j)
        self.assertAlmostEqual(complex('-1e-500+1e-500j'), -0.0 + 0.0j)

        # class complex2(complex): pass
        # self.assertAlmostEqual(complex(complex2(1+1j)), 1+1j)
        # currently no support for keyword arguments
        #self.assertAlmostEqual(complex(real=17, imag=23), 17+23j)
        #self.assertAlmostEqual(complex(real=17+23j), 17+23j)
        #self.assertAlmostEqual(complex(real=17+23j, imag=23), 17+46j)
        #self.assertAlmostEqual(complex(real=1+2j, imag=3+4j), -3+5j)

        # check that the sign of a zero in the real or imaginary part
        # is preserved when constructing from two floats.  (These checks
        # are harmless on systems without support for signed zeros.)
        def split_zeros(x):
            """Function that produces different results for 0. and -0."""
            return atan2(x, -1.)

        self.assertEqual(split_zeros(complex(1., 0.).imag), split_zeros(0.))
        self.assertEqual(split_zeros(complex(1., -0.).imag), split_zeros(-0.))
        self.assertEqual(split_zeros(complex(0., 1.).real), split_zeros(0.))
        self.assertEqual(split_zeros(complex(-0., 1.).real), split_zeros(-0.))

        c = 3.14 + 1j
        self.assertTrue(complex(c) is c)
        del c

        self.assertRaises(TypeError, complex, "1", "1")
        self.assertRaises(TypeError, complex, 1, "1")

        # SF bug 543840:  complex(string) accepts strings with \0
        # Fixed in 2.3.
        self.assertRaises(ValueError, complex, '1+1j\0j')

        self.assertRaises(TypeError, int, 5+3j)
        self.assertRaises(TypeError, int, 5+3j)
        self.assertRaises(TypeError, float, 5+3j)
        self.assertRaises(ValueError, complex, "")
        self.assertRaises(TypeError, complex, None)
        #self.assertRaisesRegex(TypeError, "not 'NoneType'", complex, None)
        self.assertRaises(ValueError, complex, "\0")
        self.assertRaises(ValueError, complex, "3\09")
        self.assertRaises(TypeError, complex, "1", "2")
        self.assertRaises(TypeError, complex, "1", 42)
        self.assertRaises(TypeError, complex, 1, "2")
        self.assertRaises(ValueError, complex, "1+")
        self.assertRaises(ValueError, complex, "1+1j+1j")
        self.assertRaises(ValueError, complex, "--")
        self.assertRaises(ValueError, complex, "(1+2j")
        self.assertRaises(ValueError, complex, "1+2j)")
        self.assertRaises(ValueError, complex, "1+(2j)")
        self.assertRaises(ValueError, complex, "(1+2j)123")
        self.assertRaises(ValueError, complex, "x")
        self.assertRaises(ValueError, complex, "1j+2")
        self.assertRaises(ValueError, complex, "1e1ej")
        self.assertRaises(ValueError, complex, "1e++1ej")
        self.assertRaises(ValueError, complex, ")1+2j(")
        # the following three are accepted by Python 2.6
        self.assertRaises(ValueError, complex, "1..1j")
        self.assertRaises(ValueError, complex, "1.11.1j")
        self.assertRaises(ValueError, complex, "1e1.1j")

        # check that complex accepts long unicode strings
        self.assertEqual(type(complex("1"*500)), complex)
        # check whitespace processing
        # self.assertEqual(complex('\N{EM SPACE}(\N{EN SPACE}1+1j ) '), 1+1j)

        # FIXME: subclassing exceptions is not really working!
        #class EvilExc(Exception):
        #    pass
        #
        #class evilcomplex:
        #    def __complex__(self):
        #        raise EvilExc

        #self.assertRaises(EvilExc, complex, evilcomplex())

        class float2:
            def __init__(self, value):
                self.value = value
            def __float__(self):
                return self.value

        # FIXME: currently complex does not call internal __float__ method
        # FIXME: complex does not support keyword args
        self.assertAlmostEqual(complex(float2(42.)), 42)
        #self.assertAlmostEqual(complex(real=float2(17.), imag=float2(23.)), 17+23j)
        #self.assertRaises(TypeError, complex, float2(None))

        #class complex0(complex):
        #    """Test usage of __complex__() when inheriting from 'complex'"""
        #    def __complex__(self):
        #        return 42j

        #class complex1(complex):
        #    """Test usage of __complex__() with a __new__() method"""
        #   def __new__(self, value=0j):
        #        return complex.__new__(self, 2*value)
        #    def __complex__(self):
        #        return self

        #class complex2(complex):
        #    """Make sure that __complex__() calls fail if anything other than a
        #    complex is returned"""
        #    def __complex__(self):
        #        return None

        #self.assertAlmostEqual(complex(complex0(1j)), 42j)
        #self.assertAlmostEqual(complex(complex1(1j)), 2j)
        #self.assertRaises(TypeError, complex, complex2(1j))

    def test_hash(self):
        for x in range(-30, 30):
            self.assertEqual(hash(x), hash(complex(x, 0)))
            x /= 3.0    # now check against floating point
            self.assertEqual(hash(x), hash(complex(x, 0.)))

    def test_abs(self):
        nums = [complex(x/3., y/7.) for x in range(-9, 9) for y in range(-9, 9)]
        for num in nums:
            self.assertAlmostEqual((num.real**2 + num.imag**2) ** 0.5, abs(num))

    def test_repr_str(self):
        # this test case is actually working but failing nevertheless o.O?
        #self.assertNotEqual(len(str(-(1+0j))), len('(-1+-0j)'))

        self.assertEqual(str(complex(1., INF)), "(1+infj)")
        self.assertEqual(str(complex(1., -INF)), "(1-infj)")
        self.assertEqual(str(complex(INF, 1)), "(inf+1j)")
        self.assertEqual(str(complex(-INF, INF)), "(-inf+infj)")
        self.assertEqual(str(complex(NAN, 1)), "(nan+1j)")
        self.assertEqual(str(complex(1, NAN)), "(1+nanj)")
        self.assertEqual(str(complex(NAN, NAN)), "(nan+nanj)")

        self.assertEqual(str(complex(0, INF)), "infj")
        self.assertEqual(str(complex(0, -INF)), "-infj")
        self.assertEqual(str(complex(0, NAN)), "nanj")

    def test_neg(self):
        self.assertEqual(-(1+6j), -1-6j)

    def test_getnewargs(self):
        self.assertEqual((1+2j).__getnewargs__(), (1.0, 2.0))
        self.assertEqual((1-2j).__getnewargs__(), (1.0, -2.0))
        self.assertEqual((2j).__getnewargs__(), (0.0, 2.0))
        self.assertEqual((-0j).__getnewargs__(), (0.0, -0.0))
        self.assertEqual(complex(0, INF).__getnewargs__(), (0.0, INF))
        self.assertEqual(complex(INF, 0).__getnewargs__(), (INF, 0.0))

    def test_plus_minus_0j(self):
        # test that -0j and 0j literals are not identified
        z1, z2 = 0j, -0j
        self.assertEqual(atan2(z1.imag, -1.), atan2(0., -1.))
        self.assertEqual(atan2(z2.imag, -1.), atan2(-0., -1.))

    def test_negated_imaginary_literal(self):
        z0 = -0j
        z1 = -7j
        z2 = -1e1000j
        # Note: In versions of Python < 3.2, a negated imaginary literal
        # accidentally ended up with real part 0.0 instead of -0.0, thanks to a
        # modification during CST -> AST translation (see issue #9011).  That's
        # fixed in Python 3.2.
        self.assertFloatsAreIdentical(z0.real, -0.0)
        self.assertFloatsAreIdentical(z0.imag, -0.0)
        self.assertFloatsAreIdentical(z1.real, -0.0)
        self.assertFloatsAreIdentical(z1.imag, -7.0)
        self.assertFloatsAreIdentical(z2.real, -0.0)
        self.assertFloatsAreIdentical(z2.imag, -INF)

    def test_overflow(self):
        self.assertEqual(complex("1e500"), complex(INF, 0.0))
        self.assertEqual(complex("-1e500j"), complex(0.0, -INF))
        self.assertEqual(complex("-1e500+1.8e308j"), complex(-INF, INF))

    def test_repr_roundtrip(self):
        vals = [0.0, 1e-500, 1e-315, 1e-200, 0.0123, 3.1415, 1e50, INF, NAN]
        vals += [-v for v in vals]

        # complex(repr(z)) should recover z exactly, even for complex
        # numbers involving an infinity, nan, or negative zero
        for x in vals:
            for y in vals:
                z = complex(x, y)
                roundtrip = complex(repr(z))
                self.assertFloatsAreIdentical(z.real, roundtrip.real)
                self.assertFloatsAreIdentical(z.imag, roundtrip.imag)

        # Removed some tests that require eval()

def test_main():
      unittest.main()

if __name__ == "__main__":
    test_main()
