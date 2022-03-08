# TODO include the rest of the tests for this file
import sys
import unittest
import math
import time

from test_grammar import (VALID_UNDERSCORE_LITERALS, INVALID_UNDERSCORE_LITERALS)


INF = float("inf")
NAN = float("nan")



class FloatSubclass(float):
    pass

class OtherFloatSubclass(float):
    pass
class GeneralFloatCases(unittest.TestCase):
    def test_floatconversion(self):
        # Make sure that calls to __float__() work properly
        class Foo1(object):
            def __float__(self):
                return 42.

        class Foo2(float):
            def __float__(self):
                return 42.

        class Foo3(float):
            def __new__(cls, value=0.):
                return float.__new__(cls, 2*value)

            def __float__(self):
                return self

        class Foo4(float):
            def __float__(self):
                return 42

        # Issue 5759: __float__ not called on str subclasses (though it is on
        # unicode subclasses).
        class FooStr(str):
            def __float__(self):
                return float(str(self)) + 1

        self.assertEqual(float(Foo1()), 42.)
        self.assertEqual(float(Foo2()), 42.)
        # with self.assertWarns(DeprecationWarning):
        #     self.assertEqual(float(Foo3(21)), 42.)
        self.assertRaises(TypeError, float, Foo4(42))
        self.assertEqual(float(FooStr('8')), 9.)

        class Foo5:
            def __float__(self):
                return ""
        self.assertRaises(TypeError, time.sleep, Foo5())

        # Issue #24731
        class F:
            def __float__(self):
                return OtherFloatSubclass(42.)
        # with self.assertWarns(DeprecationWarning):
        #     self.assertEqual(float(F()), 42.)
        # with self.assertWarns(DeprecationWarning):
        #     self.assertIs(type(float(F())), float)
        # with self.assertWarns(DeprecationWarning):
        #     self.assertEqual(FloatSubclass(F()), 42.)
        # with self.assertWarns(DeprecationWarning):
        #     self.assertIs(type(FloatSubclass(F())), FloatSubclass)

        class MyIndex:
            def __init__(self, value):
                self.value = value
            def __index__(self):
                return self.value

        self.assertEqual(float(MyIndex(42)), 42.0)
        self.assertRaises(OverflowError, float, MyIndex(2**2000))

        class MyInt:
            def __int__(self):
                return 42

        self.assertRaises(TypeError, float, MyInt())


class FloatTestCases(unittest.TestCase):
    def test_conjugate(self):
        self.assertEqual(float(3.0).conjugate(), 3.0)
        self.assertEqual(int(-3.0).conjugate(), -3.0)
        
    def test_underscores(self):
        for lit in VALID_UNDERSCORE_LITERALS:
            if not any(ch in lit for ch in 'jJxXoObB'):
                # self.assertEqual(float(lit), eval(lit))
                self.assertEqual(float(lit), float(lit.replace('_', '')))
        for lit in INVALID_UNDERSCORE_LITERALS:
            if lit in ('0_7', '09_99'):  # octals are not recognized here
                continue
            if not any(ch in lit for ch in 'jJxXoObB'):
                self.assertRaises(ValueError, float, lit)
        # Additional test cases; nan and inf are never valid as literals,
        # only in the float() constructor, but we don't allow underscores
        # in or around them.
        self.assertRaises(ValueError, float, '_NaN')
        self.assertRaises(ValueError, float, 'Na_N')
        self.assertRaises(ValueError, float, 'IN_F')
        self.assertRaises(ValueError, float, '-_INF')
        self.assertRaises(ValueError, float, '-INF_')
        # Check that we handle bytes values correctly.
        # self.assertRaises(ValueError, float, b'0_.\xff9')

    def test_inf(self):
        self.assertTrue(math.isinf(float('Inf')))
        self.assertFalse(math.isinf(42))
        self.assertFalse(math.isinf(42.1))
        self.assertRaises(TypeError, lambda: math.isinf("42"))
        self.assertTrue(math.isinf(float('inf')))
        self.assertTrue(math.isinf(float('-inf')))

    def test_type_conversion(self):
        self.assertEqual(int(3.0),3)
        self.assertEqual(float(3), 3.0)
        self.assertEqual(type(float(1)), float)
        self.assertEqual(float("12.3"), 12.3)
        self.assertEqual(float("0."+"123456789"*3), 0.12345678912345678)
        self.assertEqual(float("123456789"*3), 1.2345678912345679e+26)

    def test_nan(self):
        self.assertTrue(math.isnan(float('nan')))
        self.assertTrue(math.isnan(float('-nan')))
        self.assertTrue(math.isnan(float('NAN')))
        self.assertTrue(math.isnan(float('-NAN')))
        self.assertTrue(math.isnan(float('+nAn')))

    def test_repr(self):
        self.assertEqual(repr(1.5), '1.5')

    def test_overflow(self):
        self.assertRaises(OverflowError, float, 2**1024)
        self.assertRaises(OverflowError, float, -2**1024)
        self.assertEqual(float('inf'), float(str(2**1024)))

class FormatTestCase(unittest.TestCase):

    def test_format(self):
        # these should be rewritten to use both format(x, spec) and
        # x.__format__(spec)

        self.assertEqual(format(0.0, 'f'), '0.000000')

        # the default is 'g', except for empty format spec
        self.assertEqual(format(0.0, ''), '0.0')
        self.assertEqual(format(0.01, ''), '0.01')
        self.assertEqual(format(0.01, 'g'), '0.01')

        # @TODO Skulpt doesn't handle this correctly - the precision is overrident to 6 when it shouldn't be
        # empty presentation type should format in the same way as str
        # (issue 5920)
        x = 100/7.
        # self.assertEqual(format(x, ''), str(x))
        # self.assertEqual(format(x, '-'), str(x))
        # self.assertEqual(format(x, '>'), str(x))
        # self.assertEqual(format(x, '2'), str(x))

        self.assertEqual(format(1.0, 'f'), '1.000000')

        self.assertEqual(format(-1.0, 'f'), '-1.000000')

        self.assertEqual(format( 1.0, ' f'), ' 1.000000')
        self.assertEqual(format(-1.0, ' f'), '-1.000000')
        self.assertEqual(format( 1.0, '+f'), '+1.000000')
        self.assertEqual(format(-1.0, '+f'), '-1.000000')

        # % formatting
        self.assertEqual(format(-1.0, '%'), '-100.000000%')

        # conversion to string should fail
        self.assertRaises(ValueError, format, 3.0, "s")

        # other format specifiers shouldn't work on floats,
        #  in particular int specifiers
        for format_spec in ([chr(x) for x in range(ord('a'), ord('z')+1)] +
                            [chr(x) for x in range(ord('A'), ord('Z')+1)]):
            if not format_spec in 'eEfFgGn%':
                self.assertRaises(ValueError, format, 0.0, format_spec)
                self.assertRaises(ValueError, format, 1.0, format_spec)
                self.assertRaises(ValueError, format, -1.0, format_spec)
                self.assertRaises(ValueError, format, 1e100, format_spec)
                self.assertRaises(ValueError, format, -1e100, format_spec)
                self.assertRaises(ValueError, format, 1e-100, format_spec)
                self.assertRaises(ValueError, format, -1e-100, format_spec)

        # @TODO Skulpt doesn't capitalize
        # issue 3382
        self.assertEqual(format(NAN, 'f'), 'nan')
        # self.assertEqual(format(NAN, 'F'), 'NAN')
        self.assertEqual(format(INF, 'f'), 'inf')
        # self.assertEqual(format(INF, 'F'), 'INF')

    # @support.requires_IEEE_754
    # def test_format_testfile(self):
    #     with open(format_testfile) as testfile:
    #         for line in testfile:
    #             if line.startswith('--'):
    #                 continue
    #             line = line.strip()
    #             if not line:
    #                 continue

    #             lhs, rhs = map(str.strip, line.split('->'))
    #             fmt, arg = lhs.split()
    #             self.assertEqual(fmt % float(arg), rhs)
    #             self.assertEqual(fmt % -float(arg), '-' + rhs)

    def test_issue5864(self):
        # @TODO - skulpt mishandles these
        self.assertEqual(format(123.456, '.4'), '123.5')
        # self.assertEqual(format(1234.56, '.4'), '1.235e+03')
        # self.assertEqual(format(12345.6, '.4'), '1.235e+04')

    def test_issue35560(self):
        self.assertEqual(format(123.0, '00'), '123.0')
        self.assertEqual(format(123.34, '00f'), '123.340000')
        self.assertEqual(format(123.34, '00e'), '1.233400e+02')
        self.assertEqual(format(123.34, '00g'), '123.34')
        self.assertEqual(format(123.34, '00.10f'), '123.3400000000')
        self.assertEqual(format(123.34, '00.10e'), '1.2334000000e+02')
        self.assertEqual(format(123.34, '00.10g'), '123.34')
        self.assertEqual(format(123.34, '01f'), '123.340000')

        self.assertEqual(format(-123.0, '00'), '-123.0')
        self.assertEqual(format(-123.34, '00f'), '-123.340000')
        self.assertEqual(format(-123.34, '00e'), '-1.233400e+02')
        self.assertEqual(format(-123.34, '00g'), '-123.34')
        self.assertEqual(format(-123.34, '00.10f'), '-123.3400000000')
        self.assertEqual(format(-123.34, '00.10f'), '-123.3400000000')
        self.assertEqual(format(-123.34, '00.10e'), '-1.2334000000e+02')
        self.assertEqual(format(-123.34, '00.10g'), '-123.34')

if __name__ == '__main__':
    unittest.main()
