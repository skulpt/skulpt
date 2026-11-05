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

class ReprTestCase(unittest.TestCase):
    # CPython Lib/test/test_float.py, ReprTestCase.test_short_repr.
    def test_short_repr(self):
        # Short repr preserves the digits of strings with at most 15
        # significant digits, modulo trailing zeros.
        test_strings = [
            # Include a decimal point or an exponent.
            '0.0',
            '1.0',
            '0.01',
            '0.02',
            '0.03',
            '0.04',
            '0.05',
            '1.23456789',
            '10.0',
            '100.0',
            # Values >= 1e16 get an exponent...
            '1000000000000000.0',
            '9999999999999990.0',
            '1e+16',
            '1e+17',
            # ... and so do values < 1e-4.
            '0.001',
            '0.001001',
            '0.00010000000000001',
            '0.0001',
            '9.999999999999e-05',
            '1e-05',
            '8.72293771110361e+25',
            '7.47005307342313e+26',
            '2.86438000439698e+28',
            '8.89142905246179e+28',
            '3.08578087079232e+35',
        ]
        for s in test_strings:
            negs = '-' + s
            self.assertEqual(s, repr(float(s)))
            self.assertEqual(negs, repr(float(negs)))
            # Since Python 3.2, repr and str are identical.
            self.assertEqual(repr(float(s)), str(float(s)))
            self.assertEqual(repr(float(negs)), str(float(negs)))


class FormatTestCase(unittest.TestCase):

    def test_format(self):
        # these should be rewritten to use both format(x, spec) and
        # x.__format__(spec)

        self.assertEqual(format(0.0, 'f'), '0.000000')

        # the default is 'g', except for empty format spec
        self.assertEqual(format(0.0, ''), '0.0')
        self.assertEqual(format(0.01, ''), '0.01')
        self.assertEqual(format(0.01, 'g'), '0.01')

        # empty presentation type should format in the same way as str
        # (issue 5920)
        x = 100/7.
        self.assertEqual(format(x, ''), str(x))
        self.assertEqual(format(x, '-'), str(x))
        self.assertEqual(format(x, '>'), str(x))
        self.assertEqual(format(x, '2'), str(x))

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

        # issue 3382
        self.assertEqual(format(NAN, 'f'), 'nan')
        self.assertEqual(format(NAN, 'F'), 'NAN')
        self.assertEqual(format(INF, 'f'), 'inf')
        self.assertEqual(format(INF, 'F'), 'INF')

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

    def test_padding_without_grouping(self):
        # CPython Lib/test/test_types.py, test_float__format__:
        # existing zero-padding behaviour and issue 6902 alignment cases.
        for value, spec, expected in (
                (1234.0, '010f', '1234.000000'),
                (1234.0, '011f', '1234.000000'),
                (1234.0, '012f', '01234.000000'),
                (-1234.0, '011f', '-1234.000000'),
                (-1234.0, '012f', '-1234.000000'),
                (-1234.0, '013f', '-01234.000000'),
                (-1234.12341234, '013f', '-01234.123412'),
                (-123456.12341234, '011.2f', '-0123456.12'),
                (12345.6, '0<20', '12345.60000000000000'),
                (12345.6, '1<20', '12345.61111111111111'),
                (12345.6, '*<20', '12345.6*************'),
                (12345.6, '0>20', '000000000000012345.6'),
                (12345.6, '1>20', '111111111111112345.6'),
                (12345.6, '*>20', '*************12345.6'),
                (12345.6, '0=20', '000000000000012345.6'),
                (12345.6, '1=20', '111111111111112345.6'),
                (12345.6, '*=20', '*************12345.6')):
            self.assertEqual(format(value, spec), expected)
            self.assertEqual(value.__format__(spec), expected)

    def test_grouped_zero_padding(self):
        # CPython Lib/test/test_types.py, test_float__format__.
        for value, spec, expected in (
                (1.2, '010,.2', '0,000,001.2'),
                (1234.0, '011,f', '1,234.000000'),
                (1234.0, '012,f', '1,234.000000'),
                (1234.0, '013,f', '01,234.000000'),
                (-1234.0, '012,f', '-1,234.000000'),
                (-1234.0, '013,f', '-1,234.000000'),
                (-1234.0, '014,f', '-01,234.000000'),
                (-12345.0, '015,f', '-012,345.000000'),
                (-123456.0, '016,f', '-0,123,456.000000'),
                (-123456.0, '017,f', '-0,123,456.000000'),
                (-123456.12341234, '017,f', '-0,123,456.123412'),
                (-123456.12341234, '013,.2f', '-0,123,456.12')):
            self.assertEqual(format(value, spec), expected)
            self.assertEqual(value.__format__(spec), expected)

    def test_thousands_separators(self):
        # CPython Lib/test/test_float.py, FormatTestCase.test_format.
        x = 123_456.123_456
        self.assertEqual(format(x, '_f'), '123_456.123456')
        self.assertEqual(format(x, ',f'), '123,456.123456')

    def test_format_specials(self):
        # CPython Lib/test/test_float.py, test_format_specials.
        for code in ('e', 'E', 'f', 'F', 'g', 'G', '%',
                     '.0e', '.6f', '.20g'):
            inf = 'INF' if code in 'EFG' else 'inf'
            nan = 'NAN' if code in 'EFG' else 'nan'
            if code == '%':
                inf += '%'
                nan += '%'
            for value, expected in ((INF, inf), (-INF, '-' + inf),
                                    (NAN, nan), (-NAN, nan)):
                self.assertEqual(format(value, code), expected)
                self.assertEqual(format(value, '+' + code),
                                 expected if value < 0 else '+' + expected)
                self.assertEqual(format(value, ' ' + code),
                                 expected if value < 0 else ' ' + expected)
        self.assertEqual(format(INF, '+08f'), '+0000inf')

    def test_format_without_precision(self):
        # CPython test_format: omitted precision retains the float's full
        # string representation, including the last significant digit.
        for spec in ('', '-', '>', '2'):
            self.assertEqual(format(100 / 7.0, spec), '14.285714285714286')
        for value, spec, expected in (
                (1.5e16, '>', '1.5e+16'),
                (1.5e-5, '>', '1.5e-05'),
                (12.0, '+', '+12.0'),
                (12.0, '08', '000012.0'),
                (-0.0, '>', '-0.0')):
            self.assertEqual(format(value, spec), expected)

    def test_grouping_without_precision(self):
        # Issue #1177: grouping must preserve the fractional digits and must
        # not switch a large fixed-point value to six-digit scientific form.
        for value, expected in ((1234.001, '1,234.001'),
                                (1234567.1234, '1,234,567.1234')):
            self.assertEqual(format(value, ','), expected)
            self.assertEqual('{:,}'.format(value), expected)

if __name__ == '__main__':
    unittest.main()
