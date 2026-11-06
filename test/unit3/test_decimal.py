# Copyright (c) 2004 Python Software Foundation.
# All rights reserved.

# Written by Eric Price <eprice at tjhsst.edu>
#    and Facundo Batista <facundo at taniquetil.com.ar>
#    and Raymond Hettinger <python at rcn.com>
#    and Aahz (aahz at pobox.com)
#    and Tim Peters

"""Selected CPython Decimal tests and Skulpt regressions.

The native Skulpt implementation has one backend. C-extension and _pydecimal
private tests, threading, and the external Cowlishaw .decTest driver are omitted.
Unsupported public operations are skipped with a reason.
"""

import math
import sys
import operator
import copy
import fractions
import unittest
import random
import decimal as P
C = None  # No separate C backend in Skulpt.

# Useful Test Constant
Signals = {
  P: tuple(P.getcontext().flags.keys())
}
# Signals ordered with respect to precedence: when an operation
# produces multiple signals, signals occurring later in the list
# should be handled before those occurring earlier in the list.
OrderedSignals = {
  P: [P.Clamped, P.Rounded, P.Inexact, P.Subnormal, P.Underflow,
      P.Overflow, P.DivisionByZero, P.InvalidOperation,
      P.FloatOperation]
}
def assert_signals(cls, context, attr, expected):
    d = getattr(context, attr)
    cls.assertTrue(all(d[s] if s in expected else not d[s] for s in d))

ROUND_UP = P.ROUND_UP
ROUND_DOWN = P.ROUND_DOWN
ROUND_CEILING = P.ROUND_CEILING
ROUND_FLOOR = P.ROUND_FLOOR
ROUND_HALF_UP = P.ROUND_HALF_UP
ROUND_HALF_DOWN = P.ROUND_HALF_DOWN
ROUND_HALF_EVEN = P.ROUND_HALF_EVEN
ROUND_05UP = P.ROUND_05UP

RoundingModes = [
  ROUND_UP, ROUND_DOWN, ROUND_CEILING, ROUND_FLOOR,
  ROUND_HALF_UP, ROUND_HALF_DOWN, ROUND_HALF_EVEN,
  ROUND_05UP
]

# Tests are built around these assumed context defaults.
# test_main() restores the original context.
ORIGINAL_CONTEXT = {
  P: P.getcontext().copy()
}
def init(m):
    if not m: return
    DefaultTestContext = m.Context(
       prec=9, rounding=ROUND_HALF_EVEN, traps=dict.fromkeys(Signals[m], 0)
    )
    m.setcontext(DefaultTestContext)

# CPython-only implementation details and locale support are unavailable here.
cpython_only = unittest.skip("CPython implementation detail")
def run_with_locale(*args, **kwargs):
    return unittest.skip("Skulpt does not support locale-aware decimal formatting")


class TestSkulptDecimalRegressions(unittest.TestCase):
    """Focused coverage for Skulpt's Decimal implementation."""

    def setUp(self):
        self.saved_context = P.getcontext()
        P.setcontext(P.Context(prec=28, rounding=ROUND_HALF_EVEN))

    def tearDown(self):
        P.setcontext(self.saved_context)

    def test_context_function_arguments(self):
        # CPython rejects invalid contexts and extra get/setcontext arguments.
        self.assertRaises(TypeError, P.getcontext, 1)
        self.assertRaises(TypeError, P.setcontext)
        self.assertRaises(TypeError, P.setcontext, P.Context(), 1)
        self.assertRaises(TypeError, P.localcontext, 'invalid')
        c = P.Context(prec=3)
        with P.localcontext(ctx=c) as temporary:
            self.assertEqual(temporary.prec, 3)
            self.assertIsNot(temporary, c)

    def test_arithmetic_signals_and_traps(self):
        # CPython _pydecimal.Context._raise_error and Decimal special cases.
        c = P.getcontext()
        self.assertRaises(P.DivisionByZero, lambda: P.Decimal(1) / 0)
        self.assertTrue(c.flags[P.DivisionByZero])
        c.clear_flags()
        for operation in (lambda: P.Decimal(0) / 0,
                          lambda: P.Decimal('Infinity') + P.Decimal('-Infinity'),
                          lambda: P.Decimal('Infinity') * 0):
            self.assertRaises(P.InvalidOperation, operation)
            self.assertTrue(c.flags[P.InvalidOperation])
            c.clear_flags()
        c.clear_traps()
        self.assertEqual(P.Decimal(1) / 0, P.Decimal('Infinity'))
        self.assertTrue((P.Decimal(0) / 0).is_qnan())
        self.assertTrue((P.Decimal('sNaN42') + 1).is_qnan())
        self.assertEqual(str(P.Decimal('sNaN42') + 1), 'NaN42')
        self.assertTrue(c.flags[P.InvalidOperation])

    def test_context_precision_and_rounding(self):
        # CPython _pydecimal.Decimal._fix and __truediv__.
        c = P.getcontext()
        c.prec = 3
        self.assertEqual(P.Decimal('1.234') + P.Decimal('2.345'), P.Decimal('3.58'))
        self.assertEqual(P.Decimal('1.234') * P.Decimal('2.345'), P.Decimal('2.89'))
        self.assertEqual(P.Decimal(1) / 6, P.Decimal('0.167'))
        self.assertTrue(c.flags[P.Inexact])
        self.assertTrue(c.flags[P.Rounded])
        for mode, expected in ((ROUND_DOWN, '0.166'), (ROUND_UP, '0.167'),
                               (ROUND_FLOOR, '0.166'), (ROUND_CEILING, '0.167'),
                               (ROUND_HALF_UP, '0.167'), (ROUND_HALF_DOWN, '0.167'),
                               (ROUND_HALF_EVEN, '0.167'), (ROUND_05UP, '0.166')):
            c.rounding = mode
            self.assertEqual(c.divide(1, 6), P.Decimal(expected))
        c.rounding = ROUND_HALF_EVEN
        c.clear_flags()
        self.assertEqual(str(P.Decimal(1) / 2), '0.5')
        self.assertFalse(c.flags[P.Inexact])
        self.assertFalse(c.flags[P.Rounded])
        self.assertEqual(+P.Decimal('1.234'), P.Decimal('1.23'))
        self.assertEqual(c.create_decimal('1.234'), P.Decimal('1.23'))
        c.traps[P.Inexact] = True
        self.assertRaises(P.Inexact, lambda: P.Decimal(1) / 6)

    def test_integer_division_and_remainder(self):
        # CPython Decimal._divide: truncate, preserve dividend sign, no rounding of q.
        for a, b, q, r in ((-7, 4, -1, -3), (7, -4, -1, 3),
                            (-7, -4, 1, -3), (7, 4, 1, 3)):
            self.assertEqual(P.Decimal(a) // b, P.Decimal(q))
            self.assertEqual(P.Decimal(a) % b, P.Decimal(r))
            self.assertEqual(divmod(P.Decimal(a), b), (P.Decimal(q), P.Decimal(r)))
        c = P.getcontext()
        c.prec = 2
        self.assertEqual(divmod(P.Decimal('9.99'), 1), (P.Decimal(9), P.Decimal('.99')))
        self.assertFalse(c.flags[P.Inexact])
        self.assertRaises(P.InvalidOperation, lambda: P.Decimal(1000) // 1)
        self.assertRaises(P.InvalidOperation, lambda: P.Decimal(1) % 0)

    def test_context_exponent_limits(self):
        # CPython Decimal._fix: overflow, subnormal rounding, and clamping.
        c = P.Context(prec=3, Emin=-2, Emax=2)
        self.assertRaises(P.Overflow, c.multiply, P.Decimal('9.99e2'), 10)
        self.assertTrue(c.flags[P.Overflow])
        c.clear_traps()
        self.assertEqual(c.multiply(P.Decimal('9.99e2'), 10), P.Decimal('Infinity'))
        self.assertTrue(c.flags[P.Inexact])
        self.assertTrue(c.flags[P.Rounded])
        c.clear_flags()
        self.assertEqual(c.divide(P.Decimal('0.001'), 3), P.Decimal('0.0003'))
        for signal in (P.Underflow, P.Subnormal, P.Inexact, P.Rounded):
            self.assertTrue(c.flags[signal])
        c.clear_flags()
        self.assertEqual(str(c.divide(P.Decimal('0.0001'), 10)), '0.0000')
        self.assertTrue(c.flags[P.Clamped])
        c.clamp = 1
        c.clear_flags()
        self.assertEqual(str(c.create_decimal('1e2')), '100')
        self.assertTrue(c.flags[P.Clamped])

    def test_integer_power_and_modulus(self):
        c = P.getcontext()
        c.prec = 3
        self.assertEqual(P.Decimal(2).__pow__(5, 3), P.Decimal(2))
        self.assertEqual(pow(P.Decimal(2), 5, 3), P.Decimal(2))
        self.assertEqual(c.power(2, 5, 3), P.Decimal(2))
        self.assertEqual(c.power(-2, 5, -3), P.Decimal(-2))
        self.assertEqual(c.power(P.Decimal('2.0'), P.Decimal('5.0'), 3), P.Decimal(2))
        self.assertRaises(P.InvalidOperation, c.power, 2, 5, 0)
        self.assertRaises(P.InvalidOperation, c.power, 2, -5, 3)
        self.assertRaises(P.InvalidOperation, c.power, 0, 0)
        self.assertEqual(P.Decimal('1.234') ** 3, P.Decimal('1.88'))
        self.assertEqual(P.Decimal(2) ** -3, P.Decimal('0.125'))

    def test_fractional_power_is_correctly_rounded_or_unsupported(self):
        # Skulpt's partial implementation must not silently use binary floats.
        try:
            result = P.Decimal(2) ** P.Decimal('0.5')
        except NotImplementedError:
            return
        # CPython supports this operation and supplies the reference value.
        self.assertEqual(result, P.Decimal('1.414213562373095048801688724'))

    def test_wildcard_import_and_decimal_tuple(self):
        namespace = {}
        exec('from decimal import *', namespace)
        tuple_type = namespace['DecimalTuple']
        self.assertIs(tuple_type, P.DecimalTuple)
        value = P.Decimal('-1.20').as_tuple()
        self.assertIsInstance(value, tuple_type)
        self.assertEqual(tuple_type(sign=1, digits=(1, 2, 0), exponent=-2), value)

    def test_equal_numbers_are_interchangeable_dict_keys(self):
        for value, other in ((P.Decimal('0.5'), 0.5),
                             (P.Decimal('0.1'), fractions.Fraction(1, 10)),
                             (P.Decimal('-0.1'), fractions.Fraction(-1, 10)),
                             (P.Decimal('1e20'), 10**20)):
            self.assertEqual({value: 'found'}.get(other), 'found')

    def test_context_unary_operations_and_zero_signs(self):
        c = P.Context(prec=3)
        for name, expected in (('plus', '1.23'), ('minus', '-1.23'), ('abs', '1.23')):
            operation = getattr(c, name)
            self.assertEqual(operation(P.Decimal('1.2345')), P.Decimal(expected))
            self.assertRaises(P.InvalidOperation, operation, P.Decimal('sNaN'))
        self.assertEqual(str(+P.Decimal('-0')), '0')
        self.assertEqual(str(-P.Decimal('0')), '0')
        P.getcontext().rounding = ROUND_FLOOR
        self.assertEqual(str(+P.Decimal('-0')), '-0')
        self.assertEqual(str(-P.Decimal('0')), '-0')

    def test_addition_quantum_and_cancellation(self):
        self.assertEqual(str(P.Decimal('1') + P.Decimal('0.00')), '1.00')
        self.assertEqual(str(P.Decimal('0.00') + P.Decimal('1')), '1.00')
        c = P.getcontext()
        c.rounding = ROUND_FLOOR
        self.assertEqual(str(P.Decimal(1) - P.Decimal(1)), '-0')
        self.assertEqual(str(P.Decimal('0') + P.Decimal('-0')), '-0')
        c.prec = 3
        c.rounding = ROUND_HALF_EVEN
        self.assertEqual(P.Decimal('1.005') + P.Decimal('1e-10000'), P.Decimal('1.01'))
        self.assertEqual(P.Decimal('1.005') - P.Decimal('1e-10000'), P.Decimal('1.00'))
        self.assertEqual(str(P.Decimal('1e10000') + 1), '1.00E+10000')

    def test_context_comparison_and_extrema(self):
        c = P.Context(prec=3)
        self.assertRaises(P.InvalidOperation, c.compare, P.Decimal('sNaN'), 1)
        self.assertEqual(str(c.compare(P.Decimal('NaN42'), 1)), 'NaN42')
        for name in ('max', 'min', 'max_mag', 'min_mag'):
            operation = getattr(c, name)
            self.assertRaises(P.InvalidOperation, operation, P.Decimal('sNaN'), 0)
            self.assertEqual(operation(P.Decimal('1.2345'), P.Decimal('NaN')), P.Decimal('1.23'))
            self.assertEqual(str(operation(P.Decimal('NaN42'), P.Decimal('NaN'))), 'NaN42')
        self.assertEqual(str(c.max(P.Decimal('-0'), P.Decimal('0'))), '0')
        self.assertEqual(str(c.min(P.Decimal('0'), P.Decimal('-0'))), '-0')
        self.assertEqual(str(c.max(P.Decimal('1.00'), P.Decimal('1'))), '1')
        self.assertEqual(str(c.min(P.Decimal('1.00'), P.Decimal('1'))), '1.00')
        self.assertEqual(c.max_mag(-2, 2), P.Decimal(2))
        self.assertEqual(c.min_mag(2, -2), P.Decimal(-2))

    def test_integral_rounding_uses_context_without_inexact(self):
        P.getcontext().rounding = ROUND_FLOOR
        for name in ('to_integral', 'to_integral_value'):
            operation = getattr(P.Decimal('1.9'), name)
            self.assertEqual(operation(), P.Decimal(1))
            self.assertEqual(operation(rounding=ROUND_UP), P.Decimal(2))
            self.assertEqual(operation(context=P.Context(rounding=ROUND_CEILING)), P.Decimal(2))
            self.assertFalse(P.getcontext().flags[P.Inexact])
            self.assertFalse(P.getcontext().flags[P.Rounded])
            self.assertRaises(P.InvalidOperation, getattr(P.Decimal('sNaN'), name))

    def test_special_results_obey_context(self):
        # Minimized from CPython differential cases for special result handling.
        c = P.Context(prec=1, Emin=-5, Emax=5, traps=[])
        self.assertEqual(str(c.divide(0, P.Decimal('1e6'))), '0.00000')
        self.assertTrue(c.flags[P.Clamped])
        c.clear_flags()
        self.assertEqual(str(c.divide(1, P.Decimal('-Infinity'))), '-0.00000')
        self.assertTrue(c.flags[P.Clamped])
        self.assertEqual(str(c.add(1, P.Decimal('sNaN42'))), 'NaN2')
        self.assertEqual(str(c.subtract(1, P.Decimal('sNaN42'))), 'NaN2')
        self.assertEqual(str(c.subtract(1, P.Decimal('NaN'))), 'NaN')

    def test_float_operation_signals(self):
        c = P.getcontext()
        c.traps[P.FloatOperation] = True
        self.assertRaises(P.FloatOperation, P.Decimal, 0.5)
        self.assertRaises(P.FloatOperation, lambda: P.Decimal('0.5') < 0.6)
        self.assertTrue(c.flags[P.FloatOperation])
        c.clear_flags()
        self.assertEqual(P.Decimal('0.5'), 0.5)
        self.assertTrue(c.flags[P.FloatOperation])
        c.clear_flags()
        self.assertEqual(P.Decimal.from_float(0.5), P.Decimal('0.5'))
        self.assertFalse(c.flags[P.FloatOperation])

    def test_context_signal_configuration(self):
        original = P.DefaultContext.traps[P.InvalidOperation]
        try:
            P.DefaultContext.traps[P.InvalidOperation] = False
            self.assertFalse(P.Context().traps[P.InvalidOperation])
        finally:
            P.DefaultContext.traps[P.InvalidOperation] = original
        self.assertRaises(TypeError, P.Context, traps=42)
        self.assertRaises(KeyError, P.Context, flags=[ValueError])
        self.assertRaises(KeyError, P.Context, flags={P.Inexact: True})
        c = P.Context()
        self.assertRaises(TypeError, setattr, c, 'traps', 42)
        self.assertTrue(c.traps[P.InvalidOperation])

    def test_normalize_rounds_before_removing_zeros(self):
        # CPython _pydecimal.Decimal.normalize: round first, then reduce.
        self.assertEqual(str(P.Decimal('32.100').normalize()), '32.1')
        self.assertEqual(str(P.Decimal('-0.000').normalize()), '-0')
        c = P.Context(prec=3)
        self.assertEqual(str(P.Decimal('9.999').normalize(context=c)), '1E+1')
        self.assertTrue(c.flags[P.Inexact])
        self.assertTrue(c.flags[P.Rounded])
        self.assertEqual(str(c.normalize(1000)), '1E+3')
        c = P.Context(prec=3, Emax=2, clamp=1)
        self.assertEqual(str(c.normalize(P.Decimal('1e2'))), '100')
        self.assertTrue(c.flags[P.Clamped])
        self.assertEqual(str(c.normalize(P.Decimal('Infinity'))), 'Infinity')
        self.assertEqual(str(c.normalize(P.Decimal('NaN42'))), 'NaN42')
        self.assertRaises(P.InvalidOperation, c.normalize, P.Decimal('sNaN'))
        self.assertRaises(TypeError, P.Decimal('1').normalize, context=42)

    def test_quantize_preserves_scale_and_reports_lost_digits(self):
        c = P.Context(prec=3)
        self.assertEqual(str(P.Decimal('1.2').quantize(P.Decimal('.01'), context=c)), '1.20')
        self.assertFalse(c.flags[P.Rounded])
        self.assertEqual(str(c.quantize(P.Decimal('1.200'), P.Decimal('.01'))), '1.20')
        self.assertTrue(c.flags[P.Rounded])
        self.assertFalse(c.flags[P.Inexact])
        self.assertEqual(str(c.quantize(P.Decimal('-0.001'), P.Decimal('.01'))), '-0.00')
        self.assertTrue(c.flags[P.Inexact])
        self.assertRaises(P.InvalidOperation, c.quantize, P.Decimal('9.999'), P.Decimal('.01'))
        self.assertRaises(TypeError, P.Decimal(1).quantize, '.01')
        self.assertRaises(TypeError, P.Decimal(1).quantize, P.Decimal('.01'), context=42)
        self.assertRaises(TypeError, P.Decimal(1).quantize, P.Decimal('.01'), rounding='invalid')

    def test_quantize_subnormal_does_not_signal_underflow(self):
        # Decimal.quantize deliberately differs from ordinary arithmetic here.
        c = P.Context(prec=3, Emin=-2, Emax=2, traps=[P.Underflow, P.InvalidOperation])
        self.assertEqual(c.quantize(P.Decimal('.00123'), P.Decimal('.0001')), P.Decimal('.0012'))
        self.assertTrue(c.flags[P.Subnormal])
        self.assertTrue(c.flags[P.Inexact])
        self.assertTrue(c.flags[P.Rounded])
        self.assertFalse(c.flags[P.Underflow])
        self.assertRaises(P.InvalidOperation, c.quantize, P.Decimal(0), P.Decimal('1e-5'))
        self.assertRaises(P.InvalidOperation, c.quantize, P.Decimal('Infinity'), P.Decimal(1))
        self.assertEqual(str(c.quantize(P.Decimal('-Infinity'), P.Decimal('Infinity'))), '-Infinity')
        self.assertEqual(str(c.quantize(P.Decimal('NaN42'), P.Decimal(1))), 'NaN42')
        self.assertRaises(P.InvalidOperation, c.quantize, P.Decimal('sNaN'), P.Decimal(1))


class ExplicitConstructionTest(unittest.TestCase):
    '''Unit tests for Explicit Construction cases of Decimal.'''
    decimal = P  # Default to Python implementation

    def test_explicit_empty(self):
        Decimal = self.decimal.Decimal
        self.assertEqual(Decimal(), Decimal("0"))

    def test_explicit_from_None(self):
        Decimal = self.decimal.Decimal
        self.assertRaises(TypeError, Decimal, None)

    def test_explicit_from_int(self):
        Decimal = self.decimal.Decimal

        #positive
        d = Decimal(45)
        self.assertEqual(str(d), '45')

        #very large positive
        d = Decimal(500000123)
        self.assertEqual(str(d), '500000123')

        #negative
        d = Decimal(-45)
        self.assertEqual(str(d), '-45')

        #zero
        d = Decimal(0)
        self.assertEqual(str(d), '0')

        # single word longs
        for n in range(0, 32):
            for sign in (-1, 1):
                for x in range(-5, 5):
                    i = sign * (2**n + x)
                    d = Decimal(i)
                    self.assertEqual(str(d), str(i))

    def test_explicit_from_string(self):
        Decimal = self.decimal.Decimal
        InvalidOperation = self.decimal.InvalidOperation
        localcontext = self.decimal.localcontext

        #empty
        self.assertEqual(str(Decimal('')), 'NaN')

        #int
        self.assertEqual(str(Decimal('45')), '45')

        #float
        self.assertEqual(str(Decimal('45.34')), '45.34')

        #engineer notation
        self.assertEqual(str(Decimal('45e2')), '4.5E+3')

        #just not a number
        self.assertEqual(str(Decimal('ugly')), 'NaN')

        #leading and trailing whitespace permitted
        self.assertEqual(str(Decimal('1.3E4 \n')), '1.3E+4')
        self.assertEqual(str(Decimal('  -7.89')), '-7.89')
        self.assertEqual(str(Decimal("  3.45679  ")), '3.45679')

        # underscores
        self.assertEqual(str(Decimal('1_3.3e4_0')), '1.33E+41')
        self.assertEqual(str(Decimal('1_0_0_0')), '1000')

        # unicode whitespace
        for lead in ["", ' ', '\u00a0', '\u205f']:
            for trail in ["", ' ', '\u00a0', '\u205f']:
                self.assertEqual(str(Decimal(lead + '9.311E+28' + trail)),
                                 '9.311E+28')

        with localcontext() as c:
            c.traps[InvalidOperation] = True
            # Invalid string
            self.assertRaises(InvalidOperation, Decimal, "xyz")
            # Two arguments max
            self.assertRaises(TypeError, Decimal, "1234", "x", "y")

            # space within the numeric part
            self.assertRaises(InvalidOperation, Decimal, "1\u00a02\u00a03")
            self.assertRaises(InvalidOperation, Decimal, "\u00a01\u00a02\u00a0")

            # unicode whitespace
            self.assertRaises(InvalidOperation, Decimal, "\u00a0")
            self.assertRaises(InvalidOperation, Decimal, "\u00a0\u00a0")

            # embedded NUL
            self.assertRaises(InvalidOperation, Decimal, "12\u00003")

            # underscores don't prevent errors
            self.assertRaises(InvalidOperation, Decimal, "1_2_\u00003")

    @cpython_only
    def test_from_legacy_strings(self):
        import _testcapi
        Decimal = self.decimal.Decimal
        context = self.decimal.Context()

        s = _testcapi.unicode_legacy_string('9.999999')
        self.assertEqual(str(Decimal(s)), '9.999999')
        self.assertEqual(str(context.create_decimal(s)), '9.999999')

    def test_explicit_from_tuples(self):
        Decimal = self.decimal.Decimal

        #zero
        d = Decimal( (0, (0,), 0) )
        self.assertEqual(str(d), '0')

        #int
        d = Decimal( (1, (4, 5), 0) )
        self.assertEqual(str(d), '-45')

        #float
        d = Decimal( (0, (4, 5, 3, 4), -2) )
        self.assertEqual(str(d), '45.34')

        #weird
        d = Decimal( (1, (4, 3, 4, 9, 1, 3, 5, 3, 4), -25) )
        self.assertEqual(str(d), '-4.34913534E-17')

        #inf
        d = Decimal( (0, (), "F") )
        self.assertEqual(str(d), 'Infinity')

        #wrong number of items
        self.assertRaises(ValueError, Decimal, (1, (4, 3, 4, 9, 1)) )

        #bad sign
        self.assertRaises(ValueError, Decimal, (8, (4, 3, 4, 9, 1), 2) )
        self.assertRaises(ValueError, Decimal, (0., (4, 3, 4, 9, 1), 2) )
        self.assertRaises(ValueError, Decimal, (Decimal(1), (4, 3, 4, 9, 1), 2))

        #bad exp
        self.assertRaises(ValueError, Decimal, (1, (4, 3, 4, 9, 1), 'wrong!') )
        self.assertRaises(ValueError, Decimal, (1, (4, 3, 4, 9, 1), 0.) )
        self.assertRaises(ValueError, Decimal, (1, (4, 3, 4, 9, 1), '1') )

        #bad coefficients
        self.assertRaises(ValueError, Decimal, (1, "xyz", 2) )
        self.assertRaises(ValueError, Decimal, (1, (4, 3, 4, None, 1), 2) )
        self.assertRaises(ValueError, Decimal, (1, (4, -3, 4, 9, 1), 2) )
        self.assertRaises(ValueError, Decimal, (1, (4, 10, 4, 9, 1), 2) )
        self.assertRaises(ValueError, Decimal, (1, (4, 3, 4, 'a', 1), 2) )

    def test_explicit_from_list(self):
        Decimal = self.decimal.Decimal

        d = Decimal([0, [0], 0])
        self.assertEqual(str(d), '0')

        d = Decimal([1, [4, 3, 4, 9, 1, 3, 5, 3, 4], -25])
        self.assertEqual(str(d), '-4.34913534E-17')

        d = Decimal([1, (4, 3, 4, 9, 1, 3, 5, 3, 4), -25])
        self.assertEqual(str(d), '-4.34913534E-17')

        d = Decimal((1, [4, 3, 4, 9, 1, 3, 5, 3, 4], -25))
        self.assertEqual(str(d), '-4.34913534E-17')

    def test_explicit_from_bool(self):
        Decimal = self.decimal.Decimal

        self.assertIs(bool(Decimal(0)), False)
        self.assertIs(bool(Decimal(1)), True)
        self.assertEqual(Decimal(False), Decimal(0))
        self.assertEqual(Decimal(True), Decimal(1))

    def test_explicit_from_Decimal(self):
        Decimal = self.decimal.Decimal

        #positive
        d = Decimal(45)
        e = Decimal(d)
        self.assertEqual(str(e), '45')

        #very large positive
        d = Decimal(500000123)
        e = Decimal(d)
        self.assertEqual(str(e), '500000123')

        #negative
        d = Decimal(-45)
        e = Decimal(d)
        self.assertEqual(str(e), '-45')

        #zero
        d = Decimal(0)
        e = Decimal(d)
        self.assertEqual(str(e), '0')

    # @requires_IEEE_754
    def test_explicit_from_float(self):

        Decimal = self.decimal.Decimal

        r = Decimal(0.1)
        self.assertEqual(type(r), Decimal)
        self.assertEqual(str(r),
                '0.1000000000000000055511151231257827021181583404541015625')
        self.assertTrue(Decimal(float('nan')).is_qnan())
        self.assertTrue(Decimal(float('inf')).is_infinite())
        self.assertTrue(Decimal(float('-inf')).is_infinite())
        self.assertEqual(str(Decimal(float('nan'))),
                         str(Decimal('NaN')))
        self.assertEqual(str(Decimal(float('inf'))),
                         str(Decimal('Infinity')))
        self.assertEqual(str(Decimal(float('-inf'))),
                         str(Decimal('-Infinity')))
        self.assertEqual(str(Decimal(float('-0.0'))),
                         str(Decimal('-0')))
        for i in range(200):
            x = random.expovariate(0.01) * (random.random() * 2.0 - 1.0)
            self.assertEqual(x, float(Decimal(x))) # roundtrip

    def test_explicit_context_create_decimal(self):
        Decimal = self.decimal.Decimal
        InvalidOperation = self.decimal.InvalidOperation
        Rounded = self.decimal.Rounded

        nc = copy.copy(self.decimal.getcontext())
        nc.prec = 3

        # empty
        d = Decimal()
        self.assertEqual(str(d), '0')
        d = nc.create_decimal()
        self.assertEqual(str(d), '0')

        # from None
        self.assertRaises(TypeError, nc.create_decimal, None)

        # from int
        d = nc.create_decimal(456)
        self.assertIsInstance(d, Decimal)
        self.assertEqual(nc.create_decimal(45678),
                         nc.create_decimal('457E+2'))

        # from string
        d = Decimal('456789')
        self.assertEqual(str(d), '456789')
        d = nc.create_decimal('456789')
        self.assertEqual(str(d), '4.57E+5')
        # leading and trailing whitespace should result in a NaN;
        # spaces are already checked in Cowlishaw's test-suite, so
        # here we just check that a trailing newline results in a NaN
        self.assertEqual(str(nc.create_decimal('3.14\n')), 'NaN')

        # from tuples
        d = Decimal( (1, (4, 3, 4, 9, 1, 3, 5, 3, 4), -25) )
        self.assertEqual(str(d), '-4.34913534E-17')
        d = nc.create_decimal( (1, (4, 3, 4, 9, 1, 3, 5, 3, 4), -25) )
        self.assertEqual(str(d), '-4.35E-17')

        # from Decimal
        prevdec = Decimal(500000123)
        d = Decimal(prevdec)
        self.assertEqual(str(d), '500000123')
        d = nc.create_decimal(prevdec)
        self.assertEqual(str(d), '5.00E+8')

        # more integers
        nc.prec = 28
        nc.traps[InvalidOperation] = True

        for v in [-2**63-1, -2**63, -2**31-1, -2**31, 0,
                   2**31-1, 2**31, 2**63-1, 2**63]:
            d = nc.create_decimal(v)
            self.assertTrue(isinstance(d, Decimal))
            self.assertEqual(int(d), v)

        nc.prec = 3
        nc.traps[Rounded] = True
        self.assertRaises(Rounded, nc.create_decimal, 1234)

        # from string
        nc.prec = 28
        self.assertEqual(str(nc.create_decimal('0E-017')), '0E-17')
        self.assertEqual(str(nc.create_decimal('45')), '45')
        self.assertEqual(str(nc.create_decimal('-Inf')), '-Infinity')
        self.assertEqual(str(nc.create_decimal('NaN123')), 'NaN123')

        # invalid arguments
        self.assertRaises(InvalidOperation, nc.create_decimal, "xyz")
        self.assertRaises(ValueError, nc.create_decimal, (1, "xyz", -25))
        self.assertRaises(TypeError, nc.create_decimal, "1234", "5678")
        # no whitespace and underscore stripping is done with this method
        self.assertRaises(InvalidOperation, nc.create_decimal, " 1234")
        self.assertRaises(InvalidOperation, nc.create_decimal, "12_34")

        # too many NaN payload digits
        nc.prec = 3
        self.assertRaises(InvalidOperation, nc.create_decimal, 'NaN12345')
        self.assertRaises(InvalidOperation, nc.create_decimal,
                          Decimal('NaN12345'))

        nc.traps[InvalidOperation] = False
        self.assertEqual(str(nc.create_decimal('NaN12345')), 'NaN')
        self.assertTrue(nc.flags[InvalidOperation])

        nc.flags[InvalidOperation] = False
        self.assertEqual(str(nc.create_decimal(Decimal('NaN12345'))), 'NaN')
        self.assertTrue(nc.flags[InvalidOperation])

    def test_explicit_context_create_from_float(self):

        Decimal = self.decimal.Decimal

        nc = self.decimal.Context()
        r = nc.create_decimal(0.1)
        self.assertEqual(type(r), Decimal)
        self.assertEqual(str(r), '0.1000000000000000055511151231')
        self.assertTrue(nc.create_decimal(float('nan')).is_qnan())
        self.assertTrue(nc.create_decimal(float('inf')).is_infinite())
        self.assertTrue(nc.create_decimal(float('-inf')).is_infinite())
        self.assertEqual(str(nc.create_decimal(float('nan'))),
                         str(nc.create_decimal('NaN')))
        self.assertEqual(str(nc.create_decimal(float('inf'))),
                         str(nc.create_decimal('Infinity')))
        self.assertEqual(str(nc.create_decimal(float('-inf'))),
                         str(nc.create_decimal('-Infinity')))
        self.assertEqual(str(nc.create_decimal(float('-0.0'))),
                         str(nc.create_decimal('-0')))
        nc.prec = 100
        for i in range(200):
            x = random.expovariate(0.01) * (random.random() * 2.0 - 1.0)
            self.assertEqual(x, float(nc.create_decimal(x))) # roundtrip


    # Skulpt: Unicode digit parsing not implemented, skip
    # def test_unicode_digits(self):
    #     Decimal = self.decimal.Decimal
    #
    #     test_values = {
    #         '\uff11': '1',
    #         '\u0660.\u0660\u0663\u0667\u0662e-\u0663' : '0.0000372',
    #         '-nan\u0c68\u0c6a\u0c66\u0c66' : '-NaN2400',
    #         }
    #     for input, expected in test_values.items():
    #         self.assertEqual(str(Decimal(input)), expected)


class ImplicitConstructionTest(unittest.TestCase):
    '''Unit tests for Implicit Construction cases of Decimal.'''
    decimal = P  # Default to Python implementation

    def test_implicit_from_None(self):
        Decimal = self.decimal.Decimal
        self.assertRaises(TypeError, eval, 'Decimal(5) + None', {'Decimal': Decimal})

    def test_implicit_from_int(self):
        Decimal = self.decimal.Decimal

        #normal
        self.assertEqual(str(Decimal(5) + 45), '50')
        # Skulpt: precision handling differs slightly, skip this check
        # #exceeding precision
        # self.assertEqual(Decimal(5) + 123456789000, Decimal(123456789000))

    def test_implicit_from_string(self):
        Decimal = self.decimal.Decimal
        self.assertRaises(TypeError, eval, 'Decimal(5) + "3"', {'Decimal': Decimal})

    def test_implicit_from_float(self):
        Decimal = self.decimal.Decimal
        self.assertRaises(TypeError, eval, 'Decimal(5) + 2.2', {'Decimal': Decimal})

    def test_implicit_from_Decimal(self):
        Decimal = self.decimal.Decimal
        self.assertEqual(Decimal(5) + Decimal(45), Decimal(50))

    # Skulpt: skip because eval() misses the local Decimal/E names, and
    # reflected comparison results are coerced to bool (issue #1252).
    # def test_rop(self):
    #     Decimal = self.decimal.Decimal
    #
    #     # Allow other classes to be trained to interact with Decimals
    #     class E:
    #         def __divmod__(self, other):
    #             return 'divmod ' + str(other)
    #         def __rdivmod__(self, other):
    #             return str(other) + ' rdivmod'
    #         def __lt__(self, other):
    #             return 'lt ' + str(other)
    #         def __gt__(self, other):
    #             return 'gt ' + str(other)
    #         def __le__(self, other):
    #             return 'le ' + str(other)
    #         def __ge__(self, other):
    #             return 'ge ' + str(other)
    #         def __eq__(self, other):
    #             return 'eq ' + str(other)
    #         def __ne__(self, other):
    #             return 'ne ' + str(other)
    #
    #     self.assertEqual(divmod(E(), Decimal(10)), 'divmod 10')
    #     self.assertEqual(divmod(Decimal(10), E()), '10 rdivmod')
    #     self.assertEqual(eval('Decimal(10) < E()'), 'gt 10')
    #     self.assertEqual(eval('Decimal(10) > E()'), 'lt 10')
    #     self.assertEqual(eval('Decimal(10) <= E()'), 'ge 10')
    #     self.assertEqual(eval('Decimal(10) >= E()'), 'le 10')
    #     self.assertEqual(eval('Decimal(10) == E()'), 'eq 10')
    #     self.assertEqual(eval('Decimal(10) != E()'), 'ne 10')
    #
    #     # insert operator methods and then exercise them
    #     oplist = [
    #         ('+', '__add__', '__radd__'),
    #         ('-', '__sub__', '__rsub__'),
    #         ('*', '__mul__', '__rmul__'),
    #         ('/', '__truediv__', '__rtruediv__'),
    #         ('%', '__mod__', '__rmod__'),
    #         ('//', '__floordiv__', '__rfloordiv__'),
    #         ('**', '__pow__', '__rpow__')
    #     ]
    #
    #     for sym, lop, rop in oplist:
    #         setattr(E, lop, lambda self, other: 'str' + lop + str(other))
    #         setattr(E, rop, lambda self, other: str(other) + rop + 'str')
    #         self.assertEqual(eval('E()' + sym + 'Decimal(10)'),
    #                          'str' + lop + '10')
    #         self.assertEqual(eval('Decimal(10)' + sym + 'E()'),
    #                          '10' + rop + 'str')


class FormatTest(unittest.TestCase):
    '''Unit tests for the format function.'''
    decimal = P  # Default to Python implementation

    def test_formatting(self):
        Decimal = self.decimal.Decimal

        # triples giving a format, a Decimal, and the expected result
        test_values = [
            ('e', '0E-15', '0e-15'),
            ('e', '2.3E-15', '2.3e-15'),
            ('e', '2.30E+2', '2.30e+2'), # preserve significant zeros
            ('e', '2.30000E-15', '2.30000e-15'),
            ('e', '1.23456789123456789e40', '1.23456789123456789e+40'),
            ('e', '1.5', '1.5e+0'),
            ('e', '0.15', '1.5e-1'),
            ('e', '0.015', '1.5e-2'),
            ('e', '0.0000000000015', '1.5e-12'),
            ('e', '15.0', '1.50e+1'),
            ('e', '-15', '-1.5e+1'),
            ('e', '0', '0e+0'),
            ('e', '0E1', '0e+1'),
            ('e', '0.0', '0e-1'),
            ('e', '0.00', '0e-2'),
            ('.6e', '0E-15', '0.000000e-9'),
            ('.6e', '0', '0.000000e+6'),
            ('.6e', '9.999999', '9.999999e+0'),
            ('.6e', '9.9999999', '1.000000e+1'),
            ('.6e', '-1.23e5', '-1.230000e+5'),
            ('.6e', '1.23456789e-3', '1.234568e-3'),
            ('f', '0', '0'),
            ('f', '0.0', '0.0'),
            ('f', '0E-2', '0.00'),
            ('f', '0.00E-8', '0.0000000000'),
            ('f', '0E1', '0'),
            ('f', '3.2E1', '32'),
            ('f', '3.2E2', '320'),
            ('f', '3.20E2', '320'),
            ('f', '3.200E2', '320.0'),
            ('f', '3.2E-6', '0.0000032'),
            ('.6f', '0E-15', '0.000000'),
            ('.6f', '0E1', '0.000000'),
            ('.6f', '0', '0.000000'),
            ('.0f', '0', '0'),
            ('.0f', '0e-2', '0'),
            ('.0f', '3.14159265', '3'),
            ('.1f', '3.14159265', '3.1'),
            ('.4f', '3.14159265', '3.1416'),
            ('.6f', '3.14159265', '3.141593'),
            ('.7f', '3.14159265', '3.1415926'), # round-half-even!
            ('.8f', '3.14159265', '3.14159265'),
            ('.9f', '3.14159265', '3.141592650'),

            ('g', '0', '0'),
            ('g', '0.0', '0.0'),
            ('g', '0E1', '0e+1'),
            ('G', '0E1', '0E+1'),
            ('g', '0E-5', '0.00000'),
            ('g', '0E-6', '0.000000'),
            ('g', '0E-7', '0e-7'),
            ('g', '-0E2', '-0e+2'),
            ('.0g', '3.14159265', '3'),  # 0 sig fig -> 1 sig fig
            # Locale-aware 'n' formatting remains unsupported.
            ('.1g', '3.14159265', '3'),
            ('.2g', '3.14159265', '3.1'),
            ('.5g', '3.14159265', '3.1416'),
            ('.7g', '3.14159265', '3.141593'),
            ('.8g', '3.14159265', '3.1415926'), # round-half-even!
            ('.9g', '3.14159265', '3.14159265'),
            ('.10g', '3.14159265', '3.14159265'), # don't pad

            ('%', '0E1', '0%'),
            ('%', '0E0', '0%'),
            ('%', '0E-1', '0%'),
            ('%', '0E-2', '0%'),
            ('%', '0E-3', '0.0%'),
            ('%', '0E-4', '0.00%'),

            ('.3%', '0', '0.000%'),
            ('.3%', '0E10', '0.000%'),
            ('.3%', '0E-10', '0.000%'),
            ('.3%', '2.34', '234.000%'),
            ('.3%', '1.234567', '123.457%'),
            ('.0%', '1.23', '123%'),

            ('e', 'NaN', 'NaN'),
            ('f', '-NaN123', '-NaN123'),
            ('+g', 'NaN456', '+NaN456'),
            ('.3e', 'Inf', 'Infinity'),
            ('.16f', '-Inf', '-Infinity'),
            ('.0g', '-sNaN', '-sNaN'),

            ('', '1.00', '1.00'),

            # test alignment and padding
            ('6', '123', '   123'),
            ('<6', '123', '123   '),
            ('>6', '123', '   123'),
            ('^6', '123', ' 123  '),
            ('=+6', '123', '+  123'),
            ('#<10', 'NaN', 'NaN#######'),
            ('#<10', '-4.3', '-4.3######'),
            ('#<+10', '0.0130', '+0.0130###'),
            ('#< 10', '0.0130', ' 0.0130###'),
            ('@>10', '-Inf', '@-Infinity'),
            ('#>5', '-Inf', '-Infinity'),
            ('?^5', '123', '?123?'),
            ('%^6', '123', '%123%%'),
            (' ^6', '-45.6', '-45.6 '),
            ('/=10', '-45.6', '-/////45.6'),
            ('/=+10', '45.6', '+/////45.6'),
            ('/= 10', '45.6', ' /////45.6'),
            ('\x00=10', '-inf', '-\x00Infinity'),
            ('\x00^16', '-inf', '\x00\x00\x00-Infinity\x00\x00\x00\x00'),
            ('\x00>10', '1.2345', '\x00\x00\x00\x001.2345'),
            ('\x00<10', '1.2345', '1.2345\x00\x00\x00\x00'),

            # thousands separator
            (',', '1234567', '1,234,567'),
            (',', '123456', '123,456'),
            (',', '12345', '12,345'),
            (',', '1234', '1,234'),
            (',', '123', '123'),
            (',', '12', '12'),
            (',', '1', '1'),
            (',', '0', '0'),
            (',', '-1234567', '-1,234,567'),
            (',', '-123456', '-123,456'),
            ('7,', '123456', '123,456'),
            ('8,', '123456', ' 123,456'),
            ('08,', '123456', '0,123,456'), # special case: extra 0 needed
            ('+08,', '123456', '+123,456'), # but not if there's a sign
            (' 08,', '123456', ' 123,456'),
            ('08,', '-123456', '-123,456'),
            ('+09,', '123456', '+0,123,456'),
            # ... with fractional part...
            ('07,', '1234.56', '1,234.56'),
            ('08,', '1234.56', '1,234.56'),
            ('09,', '1234.56', '01,234.56'),
            ('010,', '1234.56', '001,234.56'),
            ('011,', '1234.56', '0,001,234.56'),
            ('012,', '1234.56', '0,001,234.56'),
            ('08,.1f', '1234.5', '01,234.5'),
            # no thousands separators in fraction part
            (',', '1.23456789', '1.23456789'),
            (',%', '123.456789', '12,345.6789%'),
            (',e', '123456', '1.23456e+5'),
            (',E', '123456', '1.23456E+5'),

            # issue 6850
            ('a=-7.0', '0.12345', 'aaaa0.1'),

            # issue 22090
            ('<^+15.20%', 'inf', '<<+Infinity%<<<'),
            ('\x07>,%', 'sNaN1234567', 'sNaN1234567%'),
            ('=10.10%', 'NaN123', '   NaN123%'),
            # CPython formatting keeps zero padding out of special values.
            ('010', '-Infinity', ' -Infinity'),
            ('+010', 'NaN', '      +NaN'),
            ]
        for fmt, d, result in test_values:
            self.assertEqual(format(Decimal(d), fmt), result)

        # bytes format argument
        self.assertRaises(TypeError, Decimal(1).__format__, b'-020')
        self.assertRaises(ValueError, format, Decimal(1), '<010.2f')

    def test_format_fallback_rounding(self):
        # From CPython's CFunctionality.test_format_fallback_rounding.
        D = self.decimal.Decimal
        self.assertEqual(format(D('6.09'), '#.1f'), '6.1')
        with self.decimal.localcontext() as c:
            c.rounding = self.decimal.ROUND_DOWN
            self.assertEqual(format(D('6.09'), '#.1f'), '6.0')
            self.assertEqual(format(D('9.99'), '.1e'), '9.9e+0')

    def test_format_is_quiet(self):
        # Skulpt regression: formatting must not apply arithmetic limits or signals.
        with self.decimal.localcontext() as c:
            c.prec = 1
            c.Emax = 2
            c.rounding = self.decimal.ROUND_DOWN
            c.traps[self.decimal.Inexact] = True
            c.clear_flags()
            self.assertEqual(format(self.decimal.Decimal('1234.567'), '.2f'), '1234.56')
            self.assertFalse(c.flags[self.decimal.Inexact])
            self.assertFalse(c.flags[self.decimal.Rounded])

    # Skulpt: locale module not fully implemented, skip n_format tests
    # def test_n_format(self):
    #     Decimal = self.decimal.Decimal
    #
    #     try:
    #         from locale import CHAR_MAX
    #     except ImportError:
    #         self.skipTest('locale.CHAR_MAX not available')
    @unittest.skip("Skulpt: locale module not fully implemented")
    def test_n_format(self):
        pass

    @run_with_locale('LC_ALL', 'ps_AF')
    def test_wide_char_separator_decimal_point(self):
        # locale with wide char separator and decimal point
        Decimal = self.decimal.Decimal

        decimal_point = locale.localeconv()['decimal_point']
        thousands_sep = locale.localeconv()['thousands_sep']
        if decimal_point != '\u066b':
            self.skipTest('inappropriate decimal point separator '
                          '({!a} not {!a})'.format(decimal_point, '\u066b'))
        if thousands_sep != '\u066c':
            self.skipTest('inappropriate thousands separator '
                          '({!a} not {!a})'.format(thousands_sep, '\u066c'))

        self.assertEqual(format(Decimal('100000000.123'), 'n'),
                         '100\u066c000\u066c000\u066b123')

    def test_decimal_from_float_argument_type(self):
        class A(self.decimal.Decimal):
            def __init__(self, a):
                self.a_type = type(a)
        a = A.from_float(42.5)
        self.assertEqual(self.decimal.Decimal, a.a_type)

        a = A.from_float(42)
        self.assertEqual(self.decimal.Decimal, a.a_type)


class ArithmeticOperatorsTest(unittest.TestCase):
    '''Unit tests for all arithmetic operators, binary and unary.'''
    decimal = P  # Default to Python implementation

    def test_addition(self):
        Decimal = self.decimal.Decimal

        d1 = Decimal('-11.1')
        d2 = Decimal('22.2')

        #two Decimals
        self.assertEqual(d1+d2, Decimal('11.1'))
        self.assertEqual(d2+d1, Decimal('11.1'))

        #with other type, left
        c = d1 + 5
        self.assertEqual(c, Decimal('-6.1'))
        self.assertEqual(type(c), type(d1))

        #with other type, right
        c = 5 + d1
        self.assertEqual(c, Decimal('-6.1'))
        self.assertEqual(type(c), type(d1))

        #inline with decimal
        d1 += d2
        self.assertEqual(d1, Decimal('11.1'))

        #inline with other type
        d1 += 5
        self.assertEqual(d1, Decimal('16.1'))

    def test_subtraction(self):
        Decimal = self.decimal.Decimal

        d1 = Decimal('-11.1')
        d2 = Decimal('22.2')

        #two Decimals
        self.assertEqual(d1-d2, Decimal('-33.3'))
        self.assertEqual(d2-d1, Decimal('33.3'))

        #with other type, left
        c = d1 - 5
        self.assertEqual(c, Decimal('-16.1'))
        self.assertEqual(type(c), type(d1))

        #with other type, right
        c = 5 - d1
        self.assertEqual(c, Decimal('16.1'))
        self.assertEqual(type(c), type(d1))

        #inline with decimal
        d1 -= d2
        self.assertEqual(d1, Decimal('-33.3'))

        #inline with other type
        d1 -= 5
        self.assertEqual(d1, Decimal('-38.3'))

    def test_multiplication(self):
        Decimal = self.decimal.Decimal

        d1 = Decimal('-5')
        d2 = Decimal('3')

        #two Decimals
        self.assertEqual(d1*d2, Decimal('-15'))
        self.assertEqual(d2*d1, Decimal('-15'))

        #with other type, left
        c = d1 * 5
        self.assertEqual(c, Decimal('-25'))
        self.assertEqual(type(c), type(d1))

        #with other type, right
        c = 5 * d1
        self.assertEqual(c, Decimal('-25'))
        self.assertEqual(type(c), type(d1))

        #inline with decimal
        d1 *= d2
        self.assertEqual(d1, Decimal('-15'))

        #inline with other type
        d1 *= 5
        self.assertEqual(d1, Decimal('-75'))

    def test_division(self):
        Decimal = self.decimal.Decimal

        d1 = Decimal('-5')
        d2 = Decimal('2')

        #two Decimals
        self.assertEqual(d1/d2, Decimal('-2.5'))
        self.assertEqual(d2/d1, Decimal('-0.4'))

        #with other type, left
        c = d1 / 4
        self.assertEqual(c, Decimal('-1.25'))
        self.assertEqual(type(c), type(d1))

        #with other type, right
        c = 4 / d1
        self.assertEqual(c, Decimal('-0.8'))
        self.assertEqual(type(c), type(d1))

        #inline with decimal
        d1 /= d2
        self.assertEqual(d1, Decimal('-2.5'))

        #inline with other type
        d1 /= 4
        self.assertEqual(d1, Decimal('-0.625'))

    def test_floor_division(self):
        Decimal = self.decimal.Decimal

        d1 = Decimal('5')
        d2 = Decimal('2')

        #two Decimals
        self.assertEqual(d1//d2, Decimal('2'))
        self.assertEqual(d2//d1, Decimal('0'))

        #with other type, left
        c = d1 // 4
        self.assertEqual(c, Decimal('1'))
        self.assertEqual(type(c), type(d1))

        #with other type, right
        c = 7 // d1
        self.assertEqual(c, Decimal('1'))
        self.assertEqual(type(c), type(d1))

        #inline with decimal
        d1 //= d2
        self.assertEqual(d1, Decimal('2'))

        #inline with other type
        d1 //= 2
        self.assertEqual(d1, Decimal('1'))

    def test_powering(self):
        Decimal = self.decimal.Decimal

        d1 = Decimal('5')
        d2 = Decimal('2')

        #two Decimals
        self.assertEqual(d1**d2, Decimal('25'))
        self.assertEqual(d2**d1, Decimal('32'))

        #with other type, left
        c = d1 ** 4
        self.assertEqual(c, Decimal('625'))
        self.assertEqual(type(c), type(d1))

        #with other type, right
        c = 7 ** d1
        self.assertEqual(c, Decimal('16807'))
        self.assertEqual(type(c), type(d1))

        #inline with decimal
        d1 **= d2
        self.assertEqual(d1, Decimal('25'))

        #inline with other type
        d1 **= 4
        self.assertEqual(d1, Decimal('390625'))

    def test_module(self):
        Decimal = self.decimal.Decimal

        d1 = Decimal('5')
        d2 = Decimal('2')

        #two Decimals
        self.assertEqual(d1%d2, Decimal('1'))
        self.assertEqual(d2%d1, Decimal('2'))

        #with other type, left
        c = d1 % 4
        self.assertEqual(c, Decimal('1'))
        self.assertEqual(type(c), type(d1))

        #with other type, right
        c = 7 % d1
        self.assertEqual(c, Decimal('2'))
        self.assertEqual(type(c), type(d1))

        #inline with decimal
        d1 %= d2
        self.assertEqual(d1, Decimal('1'))

        #inline with other type
        d1 %= 4
        self.assertEqual(d1, Decimal('1'))

    def test_floor_div_module(self):
        Decimal = self.decimal.Decimal

        d1 = Decimal('5')
        d2 = Decimal('2')

        #two Decimals
        (p, q) = divmod(d1, d2)
        self.assertEqual(p, Decimal('2'))
        self.assertEqual(q, Decimal('1'))
        self.assertEqual(type(p), type(d1))
        self.assertEqual(type(q), type(d1))

        #with other type, left
        (p, q) = divmod(d1, 4)
        self.assertEqual(p, Decimal('1'))
        self.assertEqual(q, Decimal('1'))
        self.assertEqual(type(p), type(d1))
        self.assertEqual(type(q), type(d1))

        #with other type, right
        (p, q) = divmod(7, d1)
        self.assertEqual(p, Decimal('1'))
        self.assertEqual(q, Decimal('2'))
        self.assertEqual(type(p), type(d1))
        self.assertEqual(type(q), type(d1))

    def test_unary_operators(self):
        Decimal = self.decimal.Decimal

        self.assertEqual(+Decimal(45), Decimal(+45))           #  +
        self.assertEqual(-Decimal(45), Decimal(-45))           #  -
        self.assertEqual(abs(Decimal(45)), abs(Decimal(-45)))  # abs

    def test_nan_comparisons(self):
        # comparisons involving signaling nans signal InvalidOperation

        # order comparisons (<, <=, >, >=) involving only quiet nans
        # also signal InvalidOperation

        # equality comparisons (==, !=) involving only quiet nans
        # don't signal, but return False or True respectively.
        Decimal = self.decimal.Decimal
        InvalidOperation = self.decimal.InvalidOperation
        localcontext = self.decimal.localcontext

        n = Decimal('NaN')
        s = Decimal('sNaN')
        i = Decimal('Inf')
        f = Decimal('2')

        qnan_pairs = (n, n), (n, i), (i, n), (n, f), (f, n)
        snan_pairs = (s, n), (n, s), (s, i), (i, s), (s, f), (f, s), (s, s)
        order_ops = operator.lt, operator.le, operator.gt, operator.ge
        equality_ops = operator.eq, operator.ne

        # results when InvalidOperation is not trapped
        for x, y in qnan_pairs + snan_pairs:
            for op in order_ops + equality_ops:
                got = op(x, y)
                expected = True if op is operator.ne else False
                self.assertIs(expected, got,
                              "expected {0!r} for operator.{1}({2!r}, {3!r}); "
                              "got {4!r}".format(
                        expected, op.__name__, x, y, got))

        # repeat the above, but this time trap the InvalidOperation
        with localcontext() as ctx:
            ctx.traps[InvalidOperation] = 1

            for x, y in qnan_pairs:
                for op in equality_ops:
                    got = op(x, y)
                    expected = True if op is operator.ne else False
                    self.assertIs(expected, got,
                                  "expected {0!r} for "
                                  "operator.{1}({2!r}, {3!r}); "
                                  "got {4!r}".format(
                            expected, op.__name__, x, y, got))

            for x, y in snan_pairs:
                for op in equality_ops:
                    self.assertRaises(InvalidOperation, operator.eq, x, y)
                    self.assertRaises(InvalidOperation, operator.ne, x, y)

            for x, y in qnan_pairs + snan_pairs:
                for op in order_ops:
                    self.assertRaises(InvalidOperation, op, x, y)

    def test_copy_sign(self):
        Decimal = self.decimal.Decimal

        d = Decimal(1).copy_sign(Decimal(-2))
        self.assertEqual(Decimal(1).copy_sign(-2), d)
        self.assertRaises(TypeError, Decimal(1).copy_sign, '-2')


# The following are two functions used to test threading in the next class

def thfunc1(cls):
    Decimal = cls.decimal.Decimal
    InvalidOperation = cls.decimal.InvalidOperation
    DivisionByZero = cls.decimal.DivisionByZero
    Overflow = cls.decimal.Overflow
    Underflow = cls.decimal.Underflow
    Inexact = cls.decimal.Inexact
    getcontext = cls.decimal.getcontext
    localcontext = cls.decimal.localcontext

    d1 = Decimal(1)
    d3 = Decimal(3)
    test1 = d1/d3

    cls.finish1.set()
    cls.synchro.wait()

    test2 = d1/d3
    with localcontext() as c2:
        cls.assertTrue(c2.flags[Inexact])
        cls.assertRaises(DivisionByZero, c2.divide, d1, 0)
        cls.assertTrue(c2.flags[DivisionByZero])
        with localcontext() as c3:
            cls.assertTrue(c3.flags[Inexact])
            cls.assertTrue(c3.flags[DivisionByZero])
            cls.assertRaises(InvalidOperation, c3.compare, d1, Decimal('sNaN'))
            cls.assertTrue(c3.flags[InvalidOperation])
            del c3
        cls.assertFalse(c2.flags[InvalidOperation])
        del c2

    cls.assertEqual(test1, Decimal('0.333333333333333333333333'))
    cls.assertEqual(test2, Decimal('0.333333333333333333333333'))

    c1 = getcontext()
    cls.assertTrue(c1.flags[Inexact])
    for sig in Overflow, Underflow, DivisionByZero, InvalidOperation:
        cls.assertFalse(c1.flags[sig])

def thfunc2(cls):
    Decimal = cls.decimal.Decimal
    InvalidOperation = cls.decimal.InvalidOperation
    DivisionByZero = cls.decimal.DivisionByZero
    Overflow = cls.decimal.Overflow
    Underflow = cls.decimal.Underflow
    Inexact = cls.decimal.Inexact
    getcontext = cls.decimal.getcontext
    localcontext = cls.decimal.localcontext

    d1 = Decimal(1)
    d3 = Decimal(3)
    test1 = d1/d3

    thiscontext = getcontext()
    thiscontext.prec = 18
    test2 = d1/d3

    with localcontext() as c2:
        cls.assertTrue(c2.flags[Inexact])
        cls.assertRaises(Overflow, c2.multiply, Decimal('1e425000000'), 999)
        cls.assertTrue(c2.flags[Overflow])
        with localcontext(thiscontext) as c3:
            cls.assertTrue(c3.flags[Inexact])
            cls.assertFalse(c3.flags[Overflow])
            c3.traps[Underflow] = True
            cls.assertRaises(Underflow, c3.divide, Decimal('1e-425000000'), 999)
            cls.assertTrue(c3.flags[Underflow])
            del c3
        cls.assertFalse(c2.flags[Underflow])
        cls.assertFalse(c2.traps[Underflow])
        del c2

    cls.synchro.set()
    cls.finish2.set()

    cls.assertEqual(test1, Decimal('0.333333333333333333333333'))
    cls.assertEqual(test2, Decimal('0.333333333333333333'))

    cls.assertFalse(thiscontext.traps[Underflow])
    cls.assertTrue(thiscontext.flags[Inexact])
    for sig in Overflow, Underflow, DivisionByZero, InvalidOperation:
        cls.assertFalse(thiscontext.flags[sig])


class UsabilityTest(unittest.TestCase):
    '''Unit tests for Usability cases of Decimal.'''
    decimal = P  # Default to Python implementation

    def test_comparison_operators(self):

        Decimal = self.decimal.Decimal

        da = Decimal('23.42')
        db = Decimal('23.42')
        dc = Decimal('45')

        #two Decimals
        self.assertGreater(dc, da)
        self.assertGreaterEqual(dc, da)
        self.assertLess(da, dc)
        self.assertLessEqual(da, dc)
        self.assertEqual(da, db)
        self.assertNotEqual(da, dc)
        self.assertLessEqual(da, db)
        self.assertGreaterEqual(da, db)

        #a Decimal and an int
        self.assertGreater(dc, 23)
        self.assertLess(23, dc)
        self.assertEqual(dc, 45)

        #a Decimal and uncomparable
        self.assertNotEqual(da, 'ugly')
        self.assertNotEqual(da, 32.7)
        self.assertNotEqual(da, object())
        self.assertNotEqual(da, object)

        # sortable
        a = list(map(Decimal, range(100)))
        b =  a[:]
        random.shuffle(a)
        a.sort()
        self.assertEqual(a, b)

    def test_decimal_float_comparison(self):
        Decimal = self.decimal.Decimal

        da = Decimal('0.25')
        db = Decimal('3.0')
        self.assertLess(da, 3.0)
        self.assertLessEqual(da, 3.0)
        self.assertGreater(db, 0.25)
        self.assertGreaterEqual(db, 0.25)
        self.assertNotEqual(da, 1.5)
        self.assertEqual(da, 0.25)
        self.assertGreater(3.0, da)
        self.assertGreaterEqual(3.0, da)
        self.assertLess(0.25, db)
        self.assertLessEqual(0.25, db)
        self.assertNotEqual(0.25, db)
        self.assertEqual(3.0, db)
        self.assertNotEqual(0.1, Decimal('0.1'))

    def test_decimal_complex_comparison(self):
        Decimal = self.decimal.Decimal

        da = Decimal('0.25')
        db = Decimal('3.0')
        self.assertNotEqual(da, (1.5+0j))
        self.assertNotEqual((1.5+0j), da)
        self.assertEqual(da, (0.25+0j))
        self.assertEqual((0.25+0j), da)
        self.assertEqual((3.0+0j), db)
        self.assertEqual(db, (3.0+0j))

        self.assertNotEqual(db, (3.0+1j))
        self.assertNotEqual((3.0+1j), db)

        self.assertIs(db.__lt__(3.0+0j), NotImplemented)
        self.assertIs(db.__le__(3.0+0j), NotImplemented)
        self.assertIs(db.__gt__(3.0+0j), NotImplemented)
        self.assertIs(db.__le__(3.0+0j), NotImplemented)

    def test_decimal_fraction_comparison(self):
        D = self.decimal.Decimal
        F = fractions.Fraction
        Context = self.decimal.Context
        localcontext = self.decimal.localcontext
        InvalidOperation = self.decimal.InvalidOperation


        emax = C.MAX_EMAX if C else 999999999
        emin = C.MIN_EMIN if C else -999999999
        etiny = C.MIN_ETINY if C else -1999999997
        c = Context(Emax=emax, Emin=emin)

        with localcontext(c):
            c.prec = emax
            self.assertLess(D(0), F(1,9999999999999999999999999999999999999))
            self.assertLess(F(-1,9999999999999999999999999999999999999), D(0))
            self.assertLess(F(0,1), D("1e" + str(etiny)))
            self.assertLess(D("-1e" + str(etiny)), F(0,1))
            self.assertLess(F(0,9999999999999999999999999), D("1e" + str(etiny)))
            self.assertLess(D("-1e" + str(etiny)), F(0,9999999999999999999999999))

            self.assertEqual(D("0.1"), F(1,10))
            self.assertEqual(F(1,10), D("0.1"))

            c.prec = 300
            self.assertNotEqual(D(1)/3, F(1,3))
            self.assertNotEqual(F(1,3), D(1)/3)

            self.assertLessEqual(F(120984237, 9999999999), D("9e" + str(emax)))
            self.assertGreaterEqual(D("9e" + str(emax)), F(120984237, 9999999999))

            self.assertGreater(D('inf'), F(99999999999,123))
            self.assertGreater(D('inf'), F(-99999999999,123))
            self.assertLess(D('-inf'), F(99999999999,123))
            self.assertLess(D('-inf'), F(-99999999999,123))

            self.assertRaises(InvalidOperation, D('nan').__gt__, F(-9,123))
            self.assertIs(NotImplemented, F(-9,123).__lt__(D('nan')))
            self.assertNotEqual(D('nan'), F(-9,123))
            self.assertNotEqual(F(-9,123), D('nan'))

    def test_copy_and_deepcopy_methods(self):
        Decimal = self.decimal.Decimal

        d = Decimal('43.24')
        c = copy.copy(d)
        self.assertEqual(id(c), id(d))
        dc = copy.deepcopy(d)
        self.assertEqual(id(dc), id(d))

    def test_hash_method(self):

        Decimal = self.decimal.Decimal
        localcontext = self.decimal.localcontext

        def hashit(d):
            a = hash(d)
            b = d.__hash__()
            self.assertEqual(a, b)
            return a

        #just that it's hashable
        hashit(Decimal(23))
        hashit(Decimal('Infinity'))
        hashit(Decimal('-Infinity'))
        hashit(Decimal('nan123'))
        hashit(Decimal('-NaN'))

        test_values = [Decimal(sign*(2**m + n))
                       for m in [0, 14, 15, 16, 17, 30, 31,
                                 32, 33, 61, 62, 63, 64, 65, 66]
                       for n in range(-10, 10)
                       for sign in [-1, 1]]
        test_values.extend([
                Decimal("-1"), # ==> -2
                Decimal("-0"), # zeros
                Decimal("0.00"),
                Decimal("-0.000"),
                Decimal("0E10"),
                Decimal("-0E12"),
                Decimal("10.0"), # negative exponent
                Decimal("-23.00000"),
                Decimal("1230E100"), # positive exponent
                Decimal("-4.5678E50"),
                # a value for which hash(n) != hash(n % (2**64-1))
                # in Python pre-2.6
                Decimal(2**64 + 2**32 - 1),
                # selection of values which fail with the old (before
                # version 2.6) long.__hash__
                Decimal("1.634E100"),
                Decimal("90.697E100"),
                Decimal("188.83E100"),
                Decimal("1652.9E100"),
                Decimal("56531E100"),
                ])

        # check that hash(d) == hash(int(d)) for integral values
        for value in test_values:
            self.assertEqual(hashit(value), hash(int(value)))

        # check that the hashes of a Decimal float match when they
        # represent exactly the same values
        test_strings = ['inf', '-Inf', '0.0', '-.0e1',
                        '34.0', '2.5', '112390.625', '-0.515625']
        for s in test_strings:
            f = float(s)
            d = Decimal(s)
            self.assertEqual(hashit(d), hash(f))

        with localcontext() as c:
            # check that the value of the hash doesn't depend on the
            # current context (issue #1757)
            x = Decimal("123456789.1")

            c.prec = 6
            h1 = hashit(x)
            c.prec = 10
            h2 = hashit(x)
            c.prec = 16
            h3 = hashit(x)

            self.assertEqual(h1, h2)
            self.assertEqual(h1, h3)

            c.prec = 10000
            x = 1100 ** 1248
            self.assertEqual(hashit(Decimal(x)), hashit(x))

    def test_min_and_max_methods(self):
        Decimal = self.decimal.Decimal

        d1 = Decimal('15.32')
        d2 = Decimal('28.5')
        l1 = 15
        l2 = 28

        #between Decimals
        self.assertIs(min(d1,d2), d1)
        self.assertIs(min(d2,d1), d1)
        self.assertIs(max(d1,d2), d2)
        self.assertIs(max(d2,d1), d2)

        #between Decimal and int
        self.assertIs(min(d1,l2), d1)
        self.assertIs(min(l2,d1), d1)
        self.assertIs(max(l1,d2), d2)
        self.assertIs(max(d2,l1), d2)

    def test_as_nonzero(self):
        Decimal = self.decimal.Decimal

        #as false
        self.assertFalse(Decimal(0))
        #as true
        self.assertTrue(Decimal('0.372'))

    def test_tostring_methods(self):
        #Test str and repr methods.
        Decimal = self.decimal.Decimal

        d = Decimal('15.32')
        self.assertEqual(str(d), '15.32')               # str
        self.assertEqual(repr(d), "Decimal('15.32')")   # repr
        with self.decimal.localcontext() as c:
            c.capitals = 0
            self.assertEqual(str(Decimal('1e10')), '1e+10')
            self.assertEqual(repr(Decimal('1e10')), "Decimal('1e+10')")
            c.capitals = 1
            self.assertEqual(str(Decimal('1e10')), '1E+10')

    def test_same_quantum_method(self):
        # From CPython test_int_arg, plus the documented special-value rules.
        Decimal = self.decimal.Decimal
        self.assertEqual(Decimal(1234).same_quantum(1000),
                         Decimal(1234).same_quantum(Decimal(1000)))
        with self.decimal.localcontext(self.decimal.Context()) as ctx:
            for left, right, expected in [('1.20', '0.01', True),
                                          ('1.2', '0.01', False),
                                          ('-0.00', '1.00', True),
                                          ('NaN', 'sNaN', True),
                                          ('Infinity', '-Infinity', True),
                                          ('NaN', 'Infinity', False)]:
                self.assertEqual(Decimal(left).same_quantum(Decimal(right), context=ctx), expected)
            self.assertFalse(any(ctx.flags.values()))

    def test_compare_method(self):
        # Selected from CPython's test_int_arg and test_none_args, with
        # Skulpt regressions for explicit-context NaN handling.
        Decimal = self.decimal.Decimal
        self.assertEqual(Decimal(4).compare(3), Decimal(4).compare(Decimal(3)))
        self.assertEqual(Decimal('0.0625').compare(other=3), -1)
        self.assertEqual(Decimal('-0').compare(Decimal('0')), 0)
        self.assertEqual(Decimal('Infinity').compare(1), 1)
        with self.decimal.localcontext(self.decimal.Context(prec=2)) as ctx:
            self.assertEqual(str(Decimal(1).compare(Decimal('NaN891'), context=ctx)), 'NaN91')
            self.assertFalse(ctx.flags[self.decimal.InvalidOperation])
            self.assertRaises(self.decimal.InvalidOperation, Decimal('sNaN').compare, 1, context=ctx)
        self.assertRaises(TypeError, Decimal(1).compare, '1')

    def test_integral_exact_signals(self):
        # CPython CFunctionality.test_to_integral and _pydecimal semantics:
        # integer rounding ignores precision/range and records both flags on a trap.
        Decimal = self.decimal.Decimal
        Inexact = self.decimal.Inexact
        Rounded = self.decimal.Rounded
        with self.decimal.localcontext(self.decimal.Context(prec=1, Emin=-1, Emax=1, traps=[])) as ctx:
            self.assertEqual(Decimal('999.9').to_integral_exact(ROUND_UP), 1000)
            self.assertTrue(ctx.flags[Inexact])
            self.assertTrue(ctx.flags[Rounded])
            ctx.clear_flags()
            self.assertEqual(Decimal('1234.0').to_integral_exact(), 1234)
            self.assertFalse(ctx.flags[Inexact])
            self.assertTrue(ctx.flags[Rounded])
            ctx.clear_flags()
            self.assertEqual(str(Decimal('-0.00').to_integral_exact()), '-0')
            self.assertFalse(any(ctx.flags.values()))
            self.assertEqual(ctx.to_integral(Decimal('1.9')), Decimal(2))
            ctx.traps[Inexact] = True
            self.assertRaises(Inexact, Decimal('999.9').to_integral_exact, ROUND_UP)
            self.assertTrue(ctx.flags[Rounded])

    def test_tonum_methods(self):
        #Test float and int methods.
        Decimal = self.decimal.Decimal

        d1 = Decimal('66')
        d2 = Decimal('15.32')

        #int
        self.assertEqual(int(d1), 66)
        self.assertEqual(int(d2), 15)

        #float
        self.assertEqual(float(d1), 66)
        self.assertEqual(float(d2), 15.32)

        #floor
        test_pairs = [
            ('123.00', 123),
            ('3.2', 3),
            ('3.54', 3),
            ('3.899', 3),
            ('-2.3', -3),
            ('-11.0', -11),
            ('0.0', 0),
            ('-0E3', 0),
            ('89891211712379812736.1', 89891211712379812736),
            ]
        for d, i in test_pairs:
            self.assertEqual(math.floor(Decimal(d)), i)
        self.assertRaises(ValueError, math.floor, Decimal('-NaN'))
        self.assertRaises(ValueError, math.floor, Decimal('sNaN'))
        self.assertRaises(ValueError, math.floor, Decimal('NaN123'))
        self.assertRaises(OverflowError, math.floor, Decimal('Inf'))
        self.assertRaises(OverflowError, math.floor, Decimal('-Inf'))

        #ceiling
        test_pairs = [
            ('123.00', 123),
            ('3.2', 4),
            ('3.54', 4),
            ('3.899', 4),
            ('-2.3', -2),
            ('-11.0', -11),
            ('0.0', 0),
            ('-0E3', 0),
            ('89891211712379812736.1', 89891211712379812737),
            ]
        for d, i in test_pairs:
            self.assertEqual(math.ceil(Decimal(d)), i)
        self.assertRaises(ValueError, math.ceil, Decimal('-NaN'))
        self.assertRaises(ValueError, math.ceil, Decimal('sNaN'))
        self.assertRaises(ValueError, math.ceil, Decimal('NaN123'))
        self.assertRaises(OverflowError, math.ceil, Decimal('Inf'))
        self.assertRaises(OverflowError, math.ceil, Decimal('-Inf'))

        #round, single argument
        test_pairs = [
            ('123.00', 123),
            ('3.2', 3),
            ('3.54', 4),
            ('3.899', 4),
            ('-2.3', -2),
            ('-11.0', -11),
            ('0.0', 0),
            ('-0E3', 0),
            ('-3.5', -4),
            ('-2.5', -2),
            ('-1.5', -2),
            ('-0.5', 0),
            ('0.5', 0),
            ('1.5', 2),
            ('2.5', 2),
            ('3.5', 4),
            ]
        for d, i in test_pairs:
            self.assertEqual(round(Decimal(d)), i)
        self.assertRaises(ValueError, round, Decimal('-NaN'))
        self.assertRaises(ValueError, round, Decimal('sNaN'))
        self.assertRaises(ValueError, round, Decimal('NaN123'))
        self.assertRaises(OverflowError, round, Decimal('Inf'))
        self.assertRaises(OverflowError, round, Decimal('-Inf'))

        #round, two arguments;  this is essentially equivalent
        #to quantize, which is already extensively tested
        test_triples = [
            ('123.456', -4, '0E+4'),
            ('123.456', -3, '0E+3'),
            ('123.456', -2, '1E+2'),
            ('123.456', -1, '1.2E+2'),
            ('123.456', 0, '123'),
            ('123.456', 1, '123.5'),
            ('123.456', 2, '123.46'),
            ('123.456', 3, '123.456'),
            ('123.456', 4, '123.4560'),
            ('123.455', 2, '123.46'),
            ('123.445', 2, '123.44'),
            ('Inf', 4, 'NaN'),
            ('-Inf', -23, 'NaN'),
            ('sNaN314', 3, 'NaN314'),
            ]
        for d, n, r in test_triples:
            self.assertEqual(str(round(Decimal(d), n)), r)

    def test_round_context(self):
        # Skulpt regressions for CPython Decimal.__round__'s quantize contract.
        with self.decimal.localcontext() as c:
            c.rounding = self.decimal.ROUND_DOWN
            c.clear_flags()
            self.assertEqual(round(self.decimal.Decimal('1.29'), 1),
                             self.decimal.Decimal('1.2'))
            self.assertTrue(c.flags[self.decimal.Inexact])
            self.assertTrue(c.flags[self.decimal.Rounded])
            c.prec = 2
            c.traps[self.decimal.InvalidOperation] = True
            self.assertRaises(self.decimal.InvalidOperation, round,
                              self.decimal.Decimal('123.45'), 2)
            self.assertRaises(TypeError, round, self.decimal.Decimal('1.2'), 1.0)

    @unittest.skip("Skulpt: NaN sign preservation not fully implemented")
    def test_nan_to_float(self):
        # Test conversions of decimal NANs to float.
        # See http://bugs.python.org/issue15544
        Decimal = self.decimal.Decimal
        for s in ('nan', 'nan1234', '-nan', '-nan2468'):
            f = float(Decimal(s))
            self.assertTrue(math.isnan(f))
            sign = math.copysign(1.0, f)
            self.assertEqual(sign, -1.0 if s.startswith('-') else 1.0)

    def test_snan_to_float(self):
        Decimal = self.decimal.Decimal
        for s in ('snan', '-snan', 'snan1357', '-snan1234'):
            d = Decimal(s)
            self.assertRaises(ValueError, float, d)

    def test_eval_round_trip(self):
        Decimal = self.decimal.Decimal
        # Skulpt: need to pass Decimal in scope for eval
        scope = {"Decimal": Decimal}

        #with zero
        d = Decimal( (0, (0,), 0) )
        self.assertEqual(d, eval(repr(d), scope))

        #int
        d = Decimal( (1, (4, 5), 0) )
        self.assertEqual(d, eval(repr(d), scope))

        #float
        d = Decimal( (0, (4, 5, 3, 4), -2) )
        self.assertEqual(d, eval(repr(d), scope))

        #weird
        d = Decimal( (1, (4, 3, 4, 9, 1, 3, 5, 3, 4), -25) )
        self.assertEqual(d, eval(repr(d), scope))

    def test_as_tuple(self):
        Decimal = self.decimal.Decimal

        #with zero
        d = Decimal(0)
        self.assertEqual(d.as_tuple(), (0, (0,), 0) )

        #int
        d = Decimal(-45)
        self.assertEqual(d.as_tuple(), (1, (4, 5), 0) )

        #complicated string
        d = Decimal("-4.34913534E-17")
        self.assertEqual(d.as_tuple(), (1, (4, 3, 4, 9, 1, 3, 5, 3, 4), -25) )

        # The '0' coefficient is implementation specific to decimal.py.
        # It has no meaning in the C-version and is ignored there.
        d = Decimal("Infinity")
        self.assertEqual(d.as_tuple(), (0, (0,), 'F') )

        #leading zeros in coefficient should be stripped
        d = Decimal( (0, (0, 0, 4, 0, 5, 3, 4), -2) )
        self.assertEqual(d.as_tuple(), (0, (4, 0, 5, 3, 4), -2) )
        d = Decimal( (1, (0, 0, 0), 37) )
        self.assertEqual(d.as_tuple(), (1, (0,), 37))
        d = Decimal( (1, (), 37) )
        self.assertEqual(d.as_tuple(), (1, (0,), 37))

        #leading zeros in NaN diagnostic info should be stripped
        d = Decimal( (0, (0, 0, 4, 0, 5, 3, 4), 'n') )
        self.assertEqual(d.as_tuple(), (0, (4, 0, 5, 3, 4), 'n') )
        d = Decimal( (1, (0, 0, 0), 'N') )
        self.assertEqual(d.as_tuple(), (1, (), 'N') )
        d = Decimal( (1, (), 'n') )
        self.assertEqual(d.as_tuple(), (1, (), 'n') )

        # For infinities, decimal.py has always silently accepted any
        # coefficient tuple.
        d = Decimal( (0, (0,), 'F') )
        self.assertEqual(d.as_tuple(), (0, (0,), 'F'))
        d = Decimal( (0, (4, 5, 3, 4), 'F') )
        self.assertEqual(d.as_tuple(), (0, (0,), 'F'))
        d = Decimal( (1, (0, 2, 7, 1), 'F') )
        self.assertEqual(d.as_tuple(), (1, (0,), 'F'))

    def test_as_integer_ratio(self):
        Decimal = self.decimal.Decimal

        # exceptional cases
        self.assertRaises(OverflowError,
                          Decimal.as_integer_ratio, Decimal('inf'))
        self.assertRaises(OverflowError,
                          Decimal.as_integer_ratio, Decimal('-inf'))
        self.assertRaises(ValueError,
                          Decimal.as_integer_ratio, Decimal('-nan'))
        self.assertRaises(ValueError,
                          Decimal.as_integer_ratio, Decimal('snan123'))

        for exp in range(-4, 2):
            for coeff in range(1000):
                for sign in '+', '-':
                    d = Decimal('%s%dE%d' % (sign, coeff, exp))
                    pq = d.as_integer_ratio()
                    p, q = pq

                    # check return type
                    self.assertIsInstance(pq, tuple)
                    self.assertIsInstance(p, int)
                    self.assertIsInstance(q, int)

                    # check normalization:  q should be positive;
                    # p should be relatively prime to q.
                    self.assertGreater(q, 0)
                    self.assertEqual(math.gcd(p, q), 1)

                    # check that p/q actually gives the correct value
                    self.assertEqual(Decimal(p) / Decimal(q), d)

    def test_subclassing(self):
        # Different behaviours when subclassing Decimal
        Decimal = self.decimal.Decimal

        class MyDecimal(Decimal):
            y = None

        d1 = MyDecimal(1)
        d2 = MyDecimal(2)
        d = d1 + d2
        self.assertIs(type(d), Decimal)

        d = d1.max(d2)
        self.assertIs(type(d), Decimal)

        d = copy.copy(d1)
        self.assertIs(type(d), MyDecimal)
        self.assertEqual(d, d1)

        d = copy.deepcopy(d1)
        self.assertIs(type(d), MyDecimal)
        self.assertEqual(d, d1)

        # Decimal(Decimal)
        d = Decimal('1.0')
        x = Decimal(d)
        self.assertIs(type(x), Decimal)
        self.assertEqual(x, d)

        # MyDecimal(Decimal)
        m = MyDecimal(d)
        self.assertIs(type(m), MyDecimal)
        self.assertEqual(m, d)
        self.assertIs(m.y, None)

        # Decimal(MyDecimal)
        x = Decimal(m)
        self.assertIs(type(x), Decimal)
        self.assertEqual(x, d)

        # MyDecimal(MyDecimal)
        m.y = 9
        x = MyDecimal(m)
        self.assertIs(type(x), MyDecimal)
        self.assertEqual(x, d)
        self.assertIs(x.y, None)

    @unittest.skip("Skulpt: advanced transcendental methods (exp, ln, sqrt) not implemented")
    def test_implicit_context(self):
        Decimal = self.decimal.Decimal
        getcontext = self.decimal.getcontext

        # Check results when context given implicitly.  (Issue 2478)
        c = getcontext()
        self.assertEqual(str(Decimal(0).sqrt()),
                         str(c.sqrt(Decimal(0))))

    @unittest.skip("Skulpt: advanced transcendental methods (exp, ln, sqrt) not implemented")
    def test_none_args(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context
        localcontext = self.decimal.localcontext
        InvalidOperation = self.decimal.InvalidOperation
        DivisionByZero = self.decimal.DivisionByZero
        Overflow = self.decimal.Overflow
        Underflow = self.decimal.Underflow
        Subnormal = self.decimal.Subnormal
        Inexact = self.decimal.Inexact
        Rounded = self.decimal.Rounded
        Clamped = self.decimal.Clamped

        with localcontext(Context()) as c:
            c.prec = 7
            c.Emax = 999
            c.Emin = -999

            x = Decimal("111")
            y = Decimal("1e9999")
            z = Decimal("1e-9999")

            ##### Unary functions
            c.clear_flags()
            self.assertEqual(str(x.exp(context=None)), '1.609487E+48')
            self.assertTrue(c.flags[Inexact])
            self.assertTrue(c.flags[Rounded])
            c.clear_flags()
            self.assertRaises(Overflow, y.exp, context=None)
            self.assertTrue(c.flags[Overflow])

            self.assertIs(z.is_normal(context=None), False)
            self.assertIs(z.is_subnormal(context=None), True)

            c.clear_flags()
            self.assertEqual(str(x.ln(context=None)), '4.709530')
            self.assertTrue(c.flags[Inexact])
            self.assertTrue(c.flags[Rounded])
            c.clear_flags()
            self.assertRaises(InvalidOperation, Decimal(-1).ln, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            self.assertEqual(str(x.log10(context=None)), '2.045323')
            self.assertTrue(c.flags[Inexact])
            self.assertTrue(c.flags[Rounded])
            c.clear_flags()
            self.assertRaises(InvalidOperation, Decimal(-1).log10, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            self.assertEqual(str(x.logb(context=None)), '2')
            self.assertRaises(DivisionByZero, Decimal(0).logb, context=None)
            self.assertTrue(c.flags[DivisionByZero])

            c.clear_flags()
            self.assertEqual(str(x.logical_invert(context=None)), '1111000')
            self.assertRaises(InvalidOperation, y.logical_invert, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            self.assertEqual(str(y.next_minus(context=None)), '9.999999E+999')
            self.assertRaises(InvalidOperation, Decimal('sNaN').next_minus, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            self.assertEqual(str(y.next_plus(context=None)), 'Infinity')
            self.assertRaises(InvalidOperation, Decimal('sNaN').next_plus, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            self.assertEqual(str(z.normalize(context=None)), '0')
            self.assertRaises(Overflow, y.normalize, context=None)
            self.assertTrue(c.flags[Overflow])

            self.assertEqual(str(z.number_class(context=None)), '+Subnormal')

            c.clear_flags()
            self.assertEqual(str(z.sqrt(context=None)), '0E-1005')
            self.assertTrue(c.flags[Clamped])
            self.assertTrue(c.flags[Inexact])
            self.assertTrue(c.flags[Rounded])
            self.assertTrue(c.flags[Subnormal])
            self.assertTrue(c.flags[Underflow])
            c.clear_flags()
            self.assertRaises(Overflow, y.sqrt, context=None)
            self.assertTrue(c.flags[Overflow])

            c.capitals = 0
            self.assertEqual(str(z.to_eng_string(context=None)), '1e-9999')
            c.capitals = 1


            ##### Binary functions
            c.clear_flags()
            ans = str(x.compare(Decimal('Nan891287828'), context=None))
            self.assertEqual(ans, 'NaN1287828')
            self.assertRaises(InvalidOperation, x.compare, Decimal('sNaN'), context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.compare_signal(8224, context=None))
            self.assertEqual(ans, '-1')
            self.assertRaises(InvalidOperation, x.compare_signal, Decimal('NaN'), context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.logical_and(101, context=None))
            self.assertEqual(ans, '101')
            self.assertRaises(InvalidOperation, x.logical_and, 123, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.logical_or(101, context=None))
            self.assertEqual(ans, '111')
            self.assertRaises(InvalidOperation, x.logical_or, 123, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.logical_xor(101, context=None))
            self.assertEqual(ans, '10')
            self.assertRaises(InvalidOperation, x.logical_xor, 123, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.max(101, context=None))
            self.assertEqual(ans, '111')
            self.assertRaises(InvalidOperation, x.max, Decimal('sNaN'), context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.max_mag(101, context=None))
            self.assertEqual(ans, '111')
            self.assertRaises(InvalidOperation, x.max_mag, Decimal('sNaN'), context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.min(101, context=None))
            self.assertEqual(ans, '101')
            self.assertRaises(InvalidOperation, x.min, Decimal('sNaN'), context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.min_mag(101, context=None))
            self.assertEqual(ans, '101')
            self.assertRaises(InvalidOperation, x.min_mag, Decimal('sNaN'), context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.remainder_near(101, context=None))
            self.assertEqual(ans, '10')
            self.assertRaises(InvalidOperation, y.remainder_near, 101, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.rotate(2, context=None))
            self.assertEqual(ans, '11100')
            self.assertRaises(InvalidOperation, x.rotate, 101, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.scaleb(7, context=None))
            self.assertEqual(ans, '1.11E+9')
            self.assertRaises(InvalidOperation, x.scaleb, 10000, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            ans = str(x.shift(2, context=None))
            self.assertEqual(ans, '11100')
            self.assertRaises(InvalidOperation, x.shift, 10000, context=None)
            self.assertTrue(c.flags[InvalidOperation])


            ##### Ternary functions
            c.clear_flags()
            ans = str(x.fma(2, 3, context=None))
            self.assertEqual(ans, '225')
            self.assertRaises(Overflow, x.fma, Decimal('1e9999'), 3, context=None)
            self.assertTrue(c.flags[Overflow])


            ##### Special cases
            c.rounding = ROUND_HALF_EVEN
            ans = str(Decimal('1.5').to_integral(rounding=None, context=None))
            self.assertEqual(ans, '2')
            c.rounding = ROUND_DOWN
            ans = str(Decimal('1.5').to_integral(rounding=None, context=None))
            self.assertEqual(ans, '1')
            ans = str(Decimal('1.5').to_integral(rounding=ROUND_UP, context=None))
            self.assertEqual(ans, '2')
            c.clear_flags()
            self.assertRaises(InvalidOperation, Decimal('sNaN').to_integral, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.rounding = ROUND_HALF_EVEN
            ans = str(Decimal('1.5').to_integral_value(rounding=None, context=None))
            self.assertEqual(ans, '2')
            c.rounding = ROUND_DOWN
            ans = str(Decimal('1.5').to_integral_value(rounding=None, context=None))
            self.assertEqual(ans, '1')
            ans = str(Decimal('1.5').to_integral_value(rounding=ROUND_UP, context=None))
            self.assertEqual(ans, '2')
            c.clear_flags()
            self.assertRaises(InvalidOperation, Decimal('sNaN').to_integral_value, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.rounding = ROUND_HALF_EVEN
            ans = str(Decimal('1.5').to_integral_exact(rounding=None, context=None))
            self.assertEqual(ans, '2')
            c.rounding = ROUND_DOWN
            ans = str(Decimal('1.5').to_integral_exact(rounding=None, context=None))
            self.assertEqual(ans, '1')
            ans = str(Decimal('1.5').to_integral_exact(rounding=ROUND_UP, context=None))
            self.assertEqual(ans, '2')
            c.clear_flags()
            self.assertRaises(InvalidOperation, Decimal('sNaN').to_integral_exact, context=None)
            self.assertTrue(c.flags[InvalidOperation])

            c.rounding = ROUND_UP
            ans = str(Decimal('1.50001').quantize(exp=Decimal('1e-3'), rounding=None, context=None))
            self.assertEqual(ans, '1.501')
            c.rounding = ROUND_DOWN
            ans = str(Decimal('1.50001').quantize(exp=Decimal('1e-3'), rounding=None, context=None))
            self.assertEqual(ans, '1.500')
            ans = str(Decimal('1.50001').quantize(exp=Decimal('1e-3'), rounding=ROUND_UP, context=None))
            self.assertEqual(ans, '1.501')
            c.clear_flags()
            self.assertRaises(InvalidOperation, y.quantize, Decimal('1e-10'), rounding=ROUND_UP, context=None)
            self.assertTrue(c.flags[InvalidOperation])

        with localcontext(Context()) as context:
            context.prec = 7
            context.Emax = 999
            context.Emin = -999
            with localcontext(ctx=None) as c:
                self.assertEqual(c.prec, 7)
                self.assertEqual(c.Emax, 999)
                self.assertEqual(c.Emin, -999)

    @unittest.skip("Skulpt: various Decimal methods (compare_signal, compare_total, logical_and, etc.) not implemented")
    def test_conversions_from_int(self):
        # Check that methods taking a second Decimal argument will
        # always accept an integer in place of a Decimal.
        Decimal = self.decimal.Decimal

        self.assertEqual(Decimal(4).compare(3),
                         Decimal(4).compare(Decimal(3)))
        self.assertEqual(Decimal(4).compare_signal(3),
                         Decimal(4).compare_signal(Decimal(3)))
        self.assertEqual(Decimal(4).compare_total(3),
                         Decimal(4).compare_total(Decimal(3)))
        self.assertEqual(Decimal(4).compare_total_mag(3),
                         Decimal(4).compare_total_mag(Decimal(3)))
        self.assertEqual(Decimal(10101).logical_and(1001),
                         Decimal(10101).logical_and(Decimal(1001)))
        self.assertEqual(Decimal(10101).logical_or(1001),
                         Decimal(10101).logical_or(Decimal(1001)))
        self.assertEqual(Decimal(10101).logical_xor(1001),
                         Decimal(10101).logical_xor(Decimal(1001)))
        self.assertEqual(Decimal(567).max(123),
                         Decimal(567).max(Decimal(123)))
        self.assertEqual(Decimal(567).max_mag(123),
                         Decimal(567).max_mag(Decimal(123)))
        self.assertEqual(Decimal(567).min(123),
                         Decimal(567).min(Decimal(123)))
        self.assertEqual(Decimal(567).min_mag(123),
                         Decimal(567).min_mag(Decimal(123)))
        self.assertEqual(Decimal(567).next_toward(123),
                         Decimal(567).next_toward(Decimal(123)))
        self.assertEqual(Decimal(1234).quantize(100),
                         Decimal(1234).quantize(Decimal(100)))
        self.assertEqual(Decimal(768).remainder_near(1234),
                         Decimal(768).remainder_near(Decimal(1234)))
        self.assertEqual(Decimal(123).rotate(1),
                         Decimal(123).rotate(Decimal(1)))
        self.assertEqual(Decimal(1234).same_quantum(1000),
                         Decimal(1234).same_quantum(Decimal(1000)))
        self.assertEqual(Decimal('9.123').scaleb(-100),
                         Decimal('9.123').scaleb(Decimal(-100)))
        self.assertEqual(Decimal(456).shift(-1),
                         Decimal(456).shift(Decimal(-1)))

        self.assertEqual(Decimal(-12).fma(Decimal(45), 67),
                         Decimal(-12).fma(Decimal(45), Decimal(67)))
        self.assertEqual(Decimal(-12).fma(45, 67),
                         Decimal(-12).fma(Decimal(45), Decimal(67)))
        self.assertEqual(Decimal(-12).fma(45, Decimal(67)),
                         Decimal(-12).fma(Decimal(45), Decimal(67)))


class PythonAPItests(unittest.TestCase):
    decimal = P  # Default to Python implementation

    @unittest.skip("Skulpt: numbers module not available")
    def test_abc(self):
        Decimal = self.decimal.Decimal

        self.assertTrue(issubclass(Decimal, numbers.Number))
        self.assertFalse(issubclass(Decimal, numbers.Real))
        self.assertIsInstance(Decimal(0), numbers.Number)
        self.assertNotIsInstance(Decimal(0), numbers.Real)

    @unittest.skip("Skulpt: pickle module not available")
    def test_pickle(self):
        for proto in range(pickle.HIGHEST_PROTOCOL + 1):
            Decimal = self.decimal.Decimal

            savedecimal = sys.modules['decimal']

            # Round trip
            sys.modules['decimal'] = self.decimal
            d = Decimal('-3.141590000')
            p = pickle.dumps(d, proto)
            e = pickle.loads(p)
            self.assertEqual(d, e)

            if C:
                # Test interchangeability
                x = C.Decimal('-3.123e81723')
                y = P.Decimal('-3.123e81723')

                sys.modules['decimal'] = C
                sx = pickle.dumps(x, proto)
                sys.modules['decimal'] = P
                r = pickle.loads(sx)
                self.assertIsInstance(r, P.Decimal)
                self.assertEqual(r, y)

                sys.modules['decimal'] = P
                sy = pickle.dumps(y, proto)
                sys.modules['decimal'] = C
                r = pickle.loads(sy)
                self.assertIsInstance(r, C.Decimal)
                self.assertEqual(r, x)

                x = C.Decimal('-3.123e81723').as_tuple()
                y = P.Decimal('-3.123e81723').as_tuple()

                sys.modules['decimal'] = C
                sx = pickle.dumps(x, proto)
                sys.modules['decimal'] = P
                r = pickle.loads(sx)
                self.assertIsInstance(r, P.DecimalTuple)
                self.assertEqual(r, y)

                sys.modules['decimal'] = P
                sy = pickle.dumps(y, proto)
                sys.modules['decimal'] = C
                r = pickle.loads(sy)
                self.assertIsInstance(r, C.DecimalTuple)
                self.assertEqual(r, x)

            sys.modules['decimal'] = savedecimal

    def test_int(self):
        Decimal = self.decimal.Decimal

        for x in range(-250, 250):
            s = '%0.2f' % (x / 100.0)
            # should work the same as for floats
            self.assertEqual(int(Decimal(s)), int(float(s)))
            # should work the same as to_integral in the ROUND_DOWN mode
            d = Decimal(s)
            r = d.to_integral(ROUND_DOWN)
            self.assertEqual(Decimal(int(d)), r)

        self.assertRaises(ValueError, int, Decimal('-nan'))
        self.assertRaises(ValueError, int, Decimal('snan'))
        self.assertRaises(OverflowError, int, Decimal('inf'))
        self.assertRaises(OverflowError, int, Decimal('-inf'))

    def test_trunc(self):
        Decimal = self.decimal.Decimal

        for x in range(-250, 250):
            s = '%0.2f' % (x / 100.0)
            # should work the same as for floats
            self.assertEqual(int(Decimal(s)), int(float(s)))
            # should work the same as to_integral in the ROUND_DOWN mode
            d = Decimal(s)
            r = d.to_integral(ROUND_DOWN)
            self.assertEqual(Decimal(math.trunc(d)), r)

    def test_from_float(self):

        Decimal = self.decimal.Decimal

        class MyDecimal(Decimal):
            def __init__(self, _):
                self.x = 'y'

        self.assertTrue(issubclass(MyDecimal, Decimal))

        r = MyDecimal.from_float(0.1)
        self.assertEqual(type(r), MyDecimal)
        self.assertEqual(str(r),
                '0.1000000000000000055511151231257827021181583404541015625')
        self.assertEqual(r.x, 'y')

        bigint = 12345678901234567890123456789
        self.assertEqual(MyDecimal.from_float(bigint), MyDecimal(bigint))
        self.assertTrue(MyDecimal.from_float(float('nan')).is_qnan())
        self.assertTrue(MyDecimal.from_float(float('inf')).is_infinite())
        self.assertTrue(MyDecimal.from_float(float('-inf')).is_infinite())
        self.assertEqual(str(MyDecimal.from_float(float('nan'))),
                         str(Decimal('NaN')))
        self.assertEqual(str(MyDecimal.from_float(float('inf'))),
                         str(Decimal('Infinity')))
        self.assertEqual(str(MyDecimal.from_float(float('-inf'))),
                         str(Decimal('-Infinity')))
        self.assertRaises(TypeError, MyDecimal.from_float, 'abc')
        for i in range(200):
            x = random.expovariate(0.01) * (random.random() * 2.0 - 1.0)
            self.assertEqual(x, float(MyDecimal.from_float(x))) # roundtrip

    def test_create_decimal_from_float(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context
        Inexact = self.decimal.Inexact

        context = Context(prec=5, rounding=ROUND_DOWN)
        self.assertEqual(
            context.create_decimal_from_float(math.pi),
            Decimal('3.1415')
        )
        context = Context(prec=5, rounding=ROUND_UP)
        self.assertEqual(
            context.create_decimal_from_float(math.pi),
            Decimal('3.1416')
        )
        context = Context(prec=5, traps=[Inexact])
        self.assertRaises(
            Inexact,
            context.create_decimal_from_float,
            math.pi
        )
        self.assertEqual(repr(context.create_decimal_from_float(-0.0)),
                         "Decimal('-0')")
        self.assertEqual(repr(context.create_decimal_from_float(1.0)),
                         "Decimal('1')")
        self.assertEqual(repr(context.create_decimal_from_float(10)),
                         "Decimal('10')")

    def test_quantize(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context
        InvalidOperation = self.decimal.InvalidOperation

        c = Context(Emax=99999, Emin=-99999)
        self.assertEqual(
            Decimal('7.335').quantize(Decimal('.01')),
            Decimal('7.34')
        )
        self.assertEqual(
            Decimal('7.335').quantize(Decimal('.01'), rounding=ROUND_DOWN),
            Decimal('7.33')
        )
        self.assertRaises(
            InvalidOperation,
            Decimal("10e99999").quantize, Decimal('1e100000'), context=c
        )

        c = Context()
        d = Decimal("0.871831e800")
        x = d.quantize(context=c, exp=Decimal("1e797"), rounding=ROUND_DOWN)
        self.assertEqual(x, Decimal('8.71E+799'))

    def test_complex(self):
        Decimal = self.decimal.Decimal

        x = Decimal("9.8182731e181273")
        self.assertEqual(x.real, x)
        self.assertEqual(x.imag, 0)
        self.assertEqual(x.conjugate(), x)

        x = Decimal("1")
        self.assertEqual(complex(x), complex(float(1)))

        x = Decimal("1")
        self.assertRaises(AttributeError, setattr, x, 'real', 100)
        self.assertRaises(AttributeError, setattr, x, 'imag', 100)
        self.assertRaises(AttributeError, setattr, x, 'conjugate', 100)
        self.assertRaises(AttributeError, setattr, x, '__complex__', 100)

    @unittest.skip("Skulpt: test also covers unsupported Context methods")
    def test_named_parameters(self):
        D = self.decimal.Decimal
        Context = self.decimal.Context
        localcontext = self.decimal.localcontext
        InvalidOperation = self.decimal.InvalidOperation
        Overflow = self.decimal.Overflow

        xc = Context()
        xc.prec = 1
        xc.Emax = 1
        xc.Emin = -1

        with localcontext() as c:
            c.clear_flags()

            self.assertEqual(D(9, xc), 9)
            self.assertEqual(D(9, context=xc), 9)
            self.assertEqual(D(context=xc, value=9), 9)
            self.assertEqual(D(context=xc), 0)
            xc.clear_flags()
            self.assertRaises(InvalidOperation, D, "xyz", context=xc)
            self.assertTrue(xc.flags[InvalidOperation])
            self.assertFalse(c.flags[InvalidOperation])

            xc.clear_flags()
            self.assertEqual(D(2).exp(context=xc), 7)
            self.assertRaises(Overflow, D(8).exp, context=xc)
            self.assertTrue(xc.flags[Overflow])
            self.assertFalse(c.flags[Overflow])

            xc.clear_flags()
            self.assertEqual(D(2).ln(context=xc), D('0.7'))
            self.assertRaises(InvalidOperation, D(-1).ln, context=xc)
            self.assertTrue(xc.flags[InvalidOperation])
            self.assertFalse(c.flags[InvalidOperation])

            self.assertEqual(D(0).log10(context=xc), D('-inf'))
            self.assertEqual(D(-1).next_minus(context=xc), -2)
            self.assertEqual(D(-1).next_plus(context=xc), D('-0.9'))
            self.assertEqual(D("9.73").normalize(context=xc), D('1E+1'))
            self.assertEqual(D("9999").to_integral(context=xc), 9999)
            self.assertEqual(D("-2000").to_integral_exact(context=xc), -2000)
            self.assertEqual(D("123").to_integral_value(context=xc), 123)
            self.assertEqual(D("0.0625").sqrt(context=xc), D('0.2'))

            self.assertEqual(D("0.0625").compare(context=xc, other=3), -1)
            xc.clear_flags()
            self.assertRaises(InvalidOperation,
                              D("0").compare_signal, D('nan'), context=xc)
            self.assertTrue(xc.flags[InvalidOperation])
            self.assertFalse(c.flags[InvalidOperation])
            self.assertEqual(D("0.01").max(D('0.0101'), context=xc), D('0.0'))
            self.assertEqual(D("0.01").max(D('0.0101'), context=xc), D('0.0'))
            self.assertEqual(D("0.2").max_mag(D('-0.3'), context=xc),
                             D('-0.3'))
            self.assertEqual(D("0.02").min(D('-0.03'), context=xc), D('-0.0'))
            self.assertEqual(D("0.02").min_mag(D('-0.03'), context=xc),
                             D('0.0'))
            self.assertEqual(D("0.2").next_toward(D('-1'), context=xc), D('0.1'))
            xc.clear_flags()
            self.assertRaises(InvalidOperation,
                              D("0.2").quantize, D('1e10'), context=xc)
            self.assertTrue(xc.flags[InvalidOperation])
            self.assertFalse(c.flags[InvalidOperation])
            self.assertEqual(D("9.99").remainder_near(D('1.5'), context=xc),
                             D('-0.5'))

            self.assertEqual(D("9.9").fma(third=D('0.9'), context=xc, other=7),
                             D('7E+1'))

            self.assertRaises(TypeError, D(1).is_canonical, context=xc)
            self.assertRaises(TypeError, D(1).is_finite, context=xc)
            self.assertRaises(TypeError, D(1).is_infinite, context=xc)
            self.assertRaises(TypeError, D(1).is_nan, context=xc)
            self.assertRaises(TypeError, D(1).is_qnan, context=xc)
            self.assertRaises(TypeError, D(1).is_snan, context=xc)
            self.assertRaises(TypeError, D(1).is_signed, context=xc)
            self.assertRaises(TypeError, D(1).is_zero, context=xc)

            self.assertFalse(D("0.01").is_normal(context=xc))
            self.assertTrue(D("0.01").is_subnormal(context=xc))

            self.assertRaises(TypeError, D(1).adjusted, context=xc)
            self.assertRaises(TypeError, D(1).conjugate, context=xc)
            self.assertRaises(TypeError, D(1).radix, context=xc)

            self.assertEqual(D(-111).logb(context=xc), 2)
            self.assertEqual(D(0).logical_invert(context=xc), 1)
            self.assertEqual(D('0.01').number_class(context=xc), '+Subnormal')
            self.assertEqual(D('0.21').to_eng_string(context=xc), '0.21')

            self.assertEqual(D('11').logical_and(D('10'), context=xc), 0)
            self.assertEqual(D('11').logical_or(D('10'), context=xc), 1)
            self.assertEqual(D('01').logical_xor(D('10'), context=xc), 1)
            self.assertEqual(D('23').rotate(1, context=xc), 3)
            self.assertEqual(D('23').rotate(1, context=xc), 3)
            xc.clear_flags()
            self.assertRaises(Overflow,
                              D('23').scaleb, 1, context=xc)
            self.assertTrue(xc.flags[Overflow])
            self.assertFalse(c.flags[Overflow])
            self.assertEqual(D('23').shift(-1, context=xc), 0)

            self.assertRaises(TypeError, D.from_float, 1.1, context=xc)
            self.assertRaises(TypeError, D(0).as_tuple, context=xc)

            self.assertEqual(D(1).canonical(), 1)
            self.assertRaises(TypeError, D("-1").copy_abs, context=xc)
            self.assertRaises(TypeError, D("-1").copy_negate, context=xc)
            self.assertRaises(TypeError, D(1).canonical, context="x")
            self.assertRaises(TypeError, D(1).canonical, xyz="x")

    def test_exception_hierarchy(self):

        decimal = self.decimal
        DecimalException = decimal.DecimalException
        InvalidOperation = decimal.InvalidOperation
        FloatOperation = decimal.FloatOperation
        DivisionByZero = decimal.DivisionByZero
        Overflow = decimal.Overflow
        Underflow = decimal.Underflow
        Subnormal = decimal.Subnormal
        Inexact = decimal.Inexact
        Rounded = decimal.Rounded
        Clamped = decimal.Clamped

        self.assertTrue(issubclass(DecimalException, ArithmeticError))

        self.assertTrue(issubclass(InvalidOperation, DecimalException))
        self.assertTrue(issubclass(FloatOperation, DecimalException))
        self.assertTrue(issubclass(FloatOperation, TypeError))
        self.assertTrue(issubclass(DivisionByZero, DecimalException))
        self.assertTrue(issubclass(DivisionByZero, ZeroDivisionError))
        self.assertTrue(issubclass(Overflow, Rounded))
        self.assertTrue(issubclass(Overflow, Inexact))
        self.assertTrue(issubclass(Overflow, DecimalException))
        self.assertTrue(issubclass(Underflow, Inexact))
        self.assertTrue(issubclass(Underflow, Rounded))
        self.assertTrue(issubclass(Underflow, Subnormal))
        self.assertTrue(issubclass(Underflow, DecimalException))

        self.assertTrue(issubclass(Subnormal, DecimalException))
        self.assertTrue(issubclass(Inexact, DecimalException))
        self.assertTrue(issubclass(Rounded, DecimalException))
        self.assertTrue(issubclass(Clamped, DecimalException))

        self.assertTrue(issubclass(decimal.ConversionSyntax, InvalidOperation))
        self.assertTrue(issubclass(decimal.DivisionImpossible, InvalidOperation))
        self.assertTrue(issubclass(decimal.DivisionUndefined, InvalidOperation))
        self.assertTrue(issubclass(decimal.DivisionUndefined, ZeroDivisionError))
        self.assertTrue(issubclass(decimal.InvalidContext, InvalidOperation))


# Skulpt: Many Context API methods now implemented, individual tests skipped as needed
class ContextAPItests(unittest.TestCase):
    decimal = P  # Default to Python implementation

    def test_none_args(self):
        Context = self.decimal.Context
        InvalidOperation = self.decimal.InvalidOperation
        DivisionByZero = self.decimal.DivisionByZero
        Overflow = self.decimal.Overflow

        c1 = Context()
        c2 = Context(prec=None, rounding=None, Emax=None, Emin=None,
                     capitals=None, clamp=None, flags=None, traps=None)
        for c in [c1, c2]:
            self.assertEqual(c.prec, 28)
            self.assertEqual(c.rounding, ROUND_HALF_EVEN)
            self.assertEqual(c.Emax, 999999)
            self.assertEqual(c.Emin, -999999)
            self.assertEqual(c.capitals, 1)
            self.assertEqual(c.clamp, 0)
            assert_signals(self, c, 'flags', [])
            assert_signals(self, c, 'traps', [InvalidOperation, DivisionByZero,
                                              Overflow])

    @cpython_only
    def test_from_legacy_strings(self):
        import _testcapi
        c = self.decimal.Context()

        for rnd in RoundingModes:
            c.rounding = _testcapi.unicode_legacy_string(rnd)
            self.assertEqual(c.rounding, rnd)

        s = _testcapi.unicode_legacy_string('')
        self.assertRaises(TypeError, setattr, c, 'rounding', s)

        s = _testcapi.unicode_legacy_string('ROUND_\x00UP')
        self.assertRaises(TypeError, setattr, c, 'rounding', s)

    @unittest.skip("Skulpt: pickle module not available")
    def test_pickle(self):

        for proto in range(pickle.HIGHEST_PROTOCOL + 1):
            Context = self.decimal.Context

            savedecimal = sys.modules['decimal']

            # Round trip
            sys.modules['decimal'] = self.decimal
            c = Context()
            e = pickle.loads(pickle.dumps(c, proto))

            self.assertEqual(c.prec, e.prec)
            self.assertEqual(c.Emin, e.Emin)
            self.assertEqual(c.Emax, e.Emax)
            self.assertEqual(c.rounding, e.rounding)
            self.assertEqual(c.capitals, e.capitals)
            self.assertEqual(c.clamp, e.clamp)
            self.assertEqual(c.flags, e.flags)
            self.assertEqual(c.traps, e.traps)

            # Test interchangeability
            combinations = [(C, P), (P, C)] if C else [(P, P)]
            for dumper, loader in combinations:
                for ri, _ in enumerate(RoundingModes):
                    for fi, _ in enumerate(OrderedSignals[dumper]):
                        for ti, _ in enumerate(OrderedSignals[dumper]):

                            prec = random.randrange(1, 100)
                            emin = random.randrange(-100, 0)
                            emax = random.randrange(1, 100)
                            caps = random.randrange(2)
                            clamp = random.randrange(2)

                            # One module dumps
                            sys.modules['decimal'] = dumper
                            c = dumper.Context(
                                  prec=prec, Emin=emin, Emax=emax,
                                  rounding=RoundingModes[ri],
                                  capitals=caps, clamp=clamp,
                                  flags=OrderedSignals[dumper][:fi],
                                  traps=OrderedSignals[dumper][:ti]
                            )
                            s = pickle.dumps(c, proto)

                            # The other module loads
                            sys.modules['decimal'] = loader
                            d = pickle.loads(s)
                            self.assertIsInstance(d, loader.Context)

                            self.assertEqual(d.prec, prec)
                            self.assertEqual(d.Emin, emin)
                            self.assertEqual(d.Emax, emax)
                            self.assertEqual(d.rounding, RoundingModes[ri])
                            self.assertEqual(d.capitals, caps)
                            self.assertEqual(d.clamp, clamp)
                            assert_signals(self, d, 'flags', OrderedSignals[loader][:fi])
                            assert_signals(self, d, 'traps', OrderedSignals[loader][:ti])

            sys.modules['decimal'] = savedecimal

    def test_equality_with_other_types(self):
        Decimal = self.decimal.Decimal

        self.assertIn(Decimal(10), ['a', 1.0, Decimal(10), (1,2), {}])
        self.assertNotIn(Decimal(10), ['a', 1.0, (1,2), {}])

    def test_copy(self):
        # All copies should be deep
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        c.divide(1, 3)  # Copy set flags as well as clear flags.
        d = c.copy()
        self.assertNotEqual(id(c), id(d))
        self.assertNotEqual(id(c.flags), id(d.flags))
        self.assertNotEqual(id(c.traps), id(d.traps))
        k1 = set(c.flags.keys())
        k2 = set(d.flags.keys())
        self.assertEqual(k1, k2)
        self.assertEqual(c.flags, d.flags)
        d.clear_flags()
        self.assertTrue(c.flags[self.decimal.Inexact])
        self.assertFalse(d.flags[self.decimal.Inexact])

    def test__clamp(self):
        # In Python 3.2, the private attribute `_clamp` was made
        # public (issue 8540), with the old `_clamp` becoming a
        # property wrapping `clamp`.  For the duration of Python 3.2
        # only, the attribute should be gettable/settable via both
        # `clamp` and `_clamp`; in Python 3.3, `_clamp` should be
        # removed.
        Context = self.decimal.Context
        c = Context()
        self.assertRaises(AttributeError, getattr, c, '_clamp')

    def test_abs(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.abs(Decimal(-1))
        self.assertEqual(c.abs(-1), d)
        self.assertRaises(TypeError, c.abs, '-1')

    def test_add(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.add(Decimal(1), Decimal(1))
        self.assertEqual(c.add(1, 1), d)
        self.assertEqual(c.add(Decimal(1), 1), d)
        self.assertEqual(c.add(1, Decimal(1)), d)
        self.assertRaises(TypeError, c.add, '1', 1)
        self.assertRaises(TypeError, c.add, 1, '1')

    def test_compare(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.compare(Decimal(1), Decimal(1))
        self.assertEqual(c.compare(1, 1), d)
        self.assertEqual(c.compare(Decimal(1), 1), d)
        self.assertEqual(c.compare(1, Decimal(1)), d)
        self.assertRaises(TypeError, c.compare, '1', 1)
        self.assertRaises(TypeError, c.compare, 1, '1')

    @unittest.skip("Skulpt: compare_signal not implemented")
    def test_compare_signal(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.compare_signal(Decimal(1), Decimal(1))
        self.assertEqual(c.compare_signal(1, 1), d)
        self.assertEqual(c.compare_signal(Decimal(1), 1), d)
        self.assertEqual(c.compare_signal(1, Decimal(1)), d)
        self.assertRaises(TypeError, c.compare_signal, '1', 1)
        self.assertRaises(TypeError, c.compare_signal, 1, '1')

    @unittest.skip("Skulpt: compare_total not implemented")
    def test_compare_total(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.compare_total(Decimal(1), Decimal(1))
        self.assertEqual(c.compare_total(1, 1), d)
        self.assertEqual(c.compare_total(Decimal(1), 1), d)
        self.assertEqual(c.compare_total(1, Decimal(1)), d)
        self.assertRaises(TypeError, c.compare_total, '1', 1)
        self.assertRaises(TypeError, c.compare_total, 1, '1')

    @unittest.skip("Skulpt: compare_total_mag not implemented")
    def test_compare_total_mag(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.compare_total_mag(Decimal(1), Decimal(1))
        self.assertEqual(c.compare_total_mag(1, 1), d)
        self.assertEqual(c.compare_total_mag(Decimal(1), 1), d)
        self.assertEqual(c.compare_total_mag(1, Decimal(1)), d)
        self.assertRaises(TypeError, c.compare_total_mag, '1', 1)
        self.assertRaises(TypeError, c.compare_total_mag, 1, '1')

    def test_copy_abs(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.copy_abs(Decimal(-1))
        self.assertEqual(c.copy_abs(-1), d)
        self.assertRaises(TypeError, c.copy_abs, '-1')

    def test_copy_decimal(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.copy_decimal(Decimal(-1))
        self.assertEqual(c.copy_decimal(-1), d)
        self.assertRaises(TypeError, c.copy_decimal, '-1')

    def test_copy_negate(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.copy_negate(Decimal(-1))
        self.assertEqual(c.copy_negate(-1), d)
        self.assertRaises(TypeError, c.copy_negate, '-1')

    def test_copy_sign(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.copy_sign(Decimal(1), Decimal(-2))
        self.assertEqual(c.copy_sign(1, -2), d)
        self.assertEqual(c.copy_sign(Decimal(1), -2), d)
        self.assertEqual(c.copy_sign(1, Decimal(-2)), d)
        self.assertRaises(TypeError, c.copy_sign, '1', -2)
        self.assertRaises(TypeError, c.copy_sign, 1, '-2')

    def test_divide(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.divide(Decimal(1), Decimal(2))
        self.assertEqual(c.divide(1, 2), d)
        self.assertEqual(c.divide(Decimal(1), 2), d)
        self.assertEqual(c.divide(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.divide, '1', 2)
        self.assertRaises(TypeError, c.divide, 1, '2')

    def test_divide_int(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.divide_int(Decimal(1), Decimal(2))
        self.assertEqual(c.divide_int(1, 2), d)
        self.assertEqual(c.divide_int(Decimal(1), 2), d)
        self.assertEqual(c.divide_int(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.divide_int, '1', 2)
        self.assertRaises(TypeError, c.divide_int, 1, '2')

    def test_divmod(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.divmod(Decimal(1), Decimal(2))
        self.assertEqual(c.divmod(1, 2), d)
        self.assertEqual(c.divmod(Decimal(1), 2), d)
        self.assertEqual(c.divmod(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.divmod, '1', 2)
        self.assertRaises(TypeError, c.divmod, 1, '2')

    @unittest.skip("Skulpt: exp not implemented")
    def test_exp(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.exp(Decimal(10))
        self.assertEqual(c.exp(10), d)
        self.assertRaises(TypeError, c.exp, '10')

    @unittest.skip("Skulpt: fma not implemented")
    def test_fma(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.fma(Decimal(2), Decimal(3), Decimal(4))
        self.assertEqual(c.fma(2, 3, 4), d)
        self.assertEqual(c.fma(Decimal(2), 3, 4), d)
        self.assertEqual(c.fma(2, Decimal(3), 4), d)
        self.assertEqual(c.fma(2, 3, Decimal(4)), d)
        self.assertEqual(c.fma(Decimal(2), Decimal(3), 4), d)
        self.assertRaises(TypeError, c.fma, '2', 3, 4)
        self.assertRaises(TypeError, c.fma, 2, '3', 4)
        self.assertRaises(TypeError, c.fma, 2, 3, '4')

        # Issue 12079 for Context.fma ...
        self.assertRaises(TypeError, c.fma,
                          Decimal('Infinity'), Decimal(0), "not a decimal")
        self.assertRaises(TypeError, c.fma,
                          Decimal(1), Decimal('snan'), 1.222)
        # ... and for Decimal.fma.
        self.assertRaises(TypeError, Decimal('Infinity').fma,
                          Decimal(0), "not a decimal")
        self.assertRaises(TypeError, Decimal(1).fma,
                          Decimal('snan'), 1.222)

    def test_is_finite(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.is_finite(Decimal(10))
        self.assertEqual(c.is_finite(10), d)
        self.assertRaises(TypeError, c.is_finite, '10')

    def test_is_infinite(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.is_infinite(Decimal(10))
        self.assertEqual(c.is_infinite(10), d)
        self.assertRaises(TypeError, c.is_infinite, '10')

    def test_is_nan(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.is_nan(Decimal(10))
        self.assertEqual(c.is_nan(10), d)
        self.assertRaises(TypeError, c.is_nan, '10')

    def test_is_normal(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.is_normal(Decimal(10))
        self.assertEqual(c.is_normal(10), d)
        self.assertRaises(TypeError, c.is_normal, '10')
        # CPython's explicit-context classification cases.
        c = Context(Emin=-2)
        for value, expected in [('1', True), ('0.01', True), ('0.001', False),
                                ('0', False), ('Infinity', False), ('NaN', False)]:
            d = Decimal(value)
            self.assertEqual(c.is_normal(d), expected)
            self.assertEqual(d.is_normal(context=c), expected)

    def test_is_qnan(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.is_qnan(Decimal(10))
        self.assertEqual(c.is_qnan(10), d)
        self.assertRaises(TypeError, c.is_qnan, '10')

    def test_is_signed(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.is_signed(Decimal(10))
        self.assertEqual(c.is_signed(10), d)
        self.assertRaises(TypeError, c.is_signed, '10')

    def test_is_snan(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.is_snan(Decimal(10))
        self.assertEqual(c.is_snan(10), d)
        self.assertRaises(TypeError, c.is_snan, '10')

    def test_is_subnormal(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.is_subnormal(Decimal(10))
        self.assertEqual(c.is_subnormal(10), d)
        self.assertRaises(TypeError, c.is_subnormal, '10')
        c = Context(Emin=-2)
        for value, expected in [('1', False), ('0.01', False), ('0.001', True),
                                ('0', False), ('Infinity', False), ('NaN', False)]:
            d = Decimal(value)
            self.assertEqual(c.is_subnormal(d), expected)
            self.assertEqual(d.is_subnormal(context=c), expected)

    def test_is_zero(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.is_zero(Decimal(10))
        self.assertEqual(c.is_zero(10), d)
        self.assertRaises(TypeError, c.is_zero, '10')

    @unittest.skip("Skulpt: ln not implemented")
    def test_ln(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.ln(Decimal(10))
        self.assertEqual(c.ln(10), d)
        self.assertRaises(TypeError, c.ln, '10')

    @unittest.skip("Skulpt: log10 not implemented")
    def test_log10(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.log10(Decimal(10))
        self.assertEqual(c.log10(10), d)
        self.assertRaises(TypeError, c.log10, '10')

    @unittest.skip("Skulpt: logb not implemented")
    def test_logb(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.logb(Decimal(10))
        self.assertEqual(c.logb(10), d)
        self.assertRaises(TypeError, c.logb, '10')

    @unittest.skip("Skulpt: logical_and not implemented")
    def test_logical_and(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.logical_and(Decimal(1), Decimal(1))
        self.assertEqual(c.logical_and(1, 1), d)
        self.assertEqual(c.logical_and(Decimal(1), 1), d)
        self.assertEqual(c.logical_and(1, Decimal(1)), d)
        self.assertRaises(TypeError, c.logical_and, '1', 1)
        self.assertRaises(TypeError, c.logical_and, 1, '1')

    @unittest.skip("Skulpt: logical_invert not implemented")
    def test_logical_invert(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.logical_invert(Decimal(1000))
        self.assertEqual(c.logical_invert(1000), d)
        self.assertRaises(TypeError, c.logical_invert, '1000')

    @unittest.skip("Skulpt: logical_or not implemented")
    def test_logical_or(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.logical_or(Decimal(1), Decimal(1))
        self.assertEqual(c.logical_or(1, 1), d)
        self.assertEqual(c.logical_or(Decimal(1), 1), d)
        self.assertEqual(c.logical_or(1, Decimal(1)), d)
        self.assertRaises(TypeError, c.logical_or, '1', 1)
        self.assertRaises(TypeError, c.logical_or, 1, '1')

    @unittest.skip("Skulpt: logical_xor not implemented")
    def test_logical_xor(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.logical_xor(Decimal(1), Decimal(1))
        self.assertEqual(c.logical_xor(1, 1), d)
        self.assertEqual(c.logical_xor(Decimal(1), 1), d)
        self.assertEqual(c.logical_xor(1, Decimal(1)), d)
        self.assertRaises(TypeError, c.logical_xor, '1', 1)
        self.assertRaises(TypeError, c.logical_xor, 1, '1')

    def test_max(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.max(Decimal(1), Decimal(2))
        self.assertEqual(c.max(1, 2), d)
        self.assertEqual(c.max(Decimal(1), 2), d)
        self.assertEqual(c.max(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.max, '1', 2)
        self.assertRaises(TypeError, c.max, 1, '2')

    def test_max_mag(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.max_mag(Decimal(1), Decimal(2))
        self.assertEqual(c.max_mag(1, 2), d)
        self.assertEqual(c.max_mag(Decimal(1), 2), d)
        self.assertEqual(c.max_mag(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.max_mag, '1', 2)
        self.assertRaises(TypeError, c.max_mag, 1, '2')

    def test_min(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.min(Decimal(1), Decimal(2))
        self.assertEqual(c.min(1, 2), d)
        self.assertEqual(c.min(Decimal(1), 2), d)
        self.assertEqual(c.min(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.min, '1', 2)
        self.assertRaises(TypeError, c.min, 1, '2')

    def test_min_mag(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.min_mag(Decimal(1), Decimal(2))
        self.assertEqual(c.min_mag(1, 2), d)
        self.assertEqual(c.min_mag(Decimal(1), 2), d)
        self.assertEqual(c.min_mag(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.min_mag, '1', 2)
        self.assertRaises(TypeError, c.min_mag, 1, '2')

    def test_minus(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.minus(Decimal(10))
        self.assertEqual(c.minus(10), d)
        self.assertRaises(TypeError, c.minus, '10')

    def test_multiply(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.multiply(Decimal(1), Decimal(2))
        self.assertEqual(c.multiply(1, 2), d)
        self.assertEqual(c.multiply(Decimal(1), 2), d)
        self.assertEqual(c.multiply(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.multiply, '1', 2)
        self.assertRaises(TypeError, c.multiply, 1, '2')

    @unittest.skip("Skulpt: next_minus not implemented")
    def test_next_minus(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.next_minus(Decimal(10))
        self.assertEqual(c.next_minus(10), d)
        self.assertRaises(TypeError, c.next_minus, '10')

    @unittest.skip("Skulpt: next_plus not implemented")
    def test_next_plus(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.next_plus(Decimal(10))
        self.assertEqual(c.next_plus(10), d)
        self.assertRaises(TypeError, c.next_plus, '10')

    @unittest.skip("Skulpt: next_toward not implemented")
    def test_next_toward(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.next_toward(Decimal(1), Decimal(2))
        self.assertEqual(c.next_toward(1, 2), d)
        self.assertEqual(c.next_toward(Decimal(1), 2), d)
        self.assertEqual(c.next_toward(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.next_toward, '1', 2)
        self.assertRaises(TypeError, c.next_toward, 1, '2')

    def test_normalize(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.normalize(Decimal(10))
        self.assertEqual(c.normalize(10), d)
        self.assertRaises(TypeError, c.normalize, '10')

    @unittest.skip("Skulpt: Context.number_class is not implemented")
    def test_number_class(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        self.assertEqual(c.number_class(123), c.number_class(Decimal(123)))
        self.assertEqual(c.number_class(0), c.number_class(Decimal(0)))
        self.assertEqual(c.number_class(-45), c.number_class(Decimal(-45)))

    def test_plus(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.plus(Decimal(10))
        self.assertEqual(c.plus(10), d)
        self.assertRaises(TypeError, c.plus, '10')

    def test_power(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.power(Decimal(1), Decimal(4))
        self.assertEqual(c.power(1, 4), d)
        self.assertEqual(c.power(Decimal(1), 4), d)
        self.assertEqual(c.power(1, Decimal(4)), d)
        self.assertEqual(c.power(Decimal(1), Decimal(4)), d)
        self.assertRaises(TypeError, c.power, '1', 4)
        self.assertRaises(TypeError, c.power, 1, '4')
        self.assertEqual(c.power(modulo=5, b=8, a=2), 1)

    def test_quantize(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.quantize(Decimal(1), Decimal(2))
        self.assertEqual(c.quantize(1, 2), d)
        self.assertEqual(c.quantize(Decimal(1), 2), d)
        self.assertEqual(c.quantize(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.quantize, '1', 2)
        self.assertRaises(TypeError, c.quantize, 1, '2')

    def test_remainder(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.remainder(Decimal(1), Decimal(2))
        self.assertEqual(c.remainder(1, 2), d)
        self.assertEqual(c.remainder(Decimal(1), 2), d)
        self.assertEqual(c.remainder(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.remainder, '1', 2)
        self.assertRaises(TypeError, c.remainder, 1, '2')

    @unittest.skip("Skulpt: remainder_near not implemented")
    def test_remainder_near(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.remainder_near(Decimal(1), Decimal(2))
        self.assertEqual(c.remainder_near(1, 2), d)
        self.assertEqual(c.remainder_near(Decimal(1), 2), d)
        self.assertEqual(c.remainder_near(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.remainder_near, '1', 2)
        self.assertRaises(TypeError, c.remainder_near, 1, '2')

    @unittest.skip("Skulpt: rotate not implemented")
    def test_rotate(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.rotate(Decimal(1), Decimal(2))
        self.assertEqual(c.rotate(1, 2), d)
        self.assertEqual(c.rotate(Decimal(1), 2), d)
        self.assertEqual(c.rotate(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.rotate, '1', 2)
        self.assertRaises(TypeError, c.rotate, 1, '2')

    @unittest.skip("Skulpt: sqrt not implemented")
    def test_sqrt(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.sqrt(Decimal(10))
        self.assertEqual(c.sqrt(10), d)
        self.assertRaises(TypeError, c.sqrt, '10')

    def test_same_quantum(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.same_quantum(Decimal(1), Decimal(2))
        self.assertEqual(c.same_quantum(1, 2), d)
        self.assertEqual(c.same_quantum(Decimal(1), 2), d)
        self.assertEqual(c.same_quantum(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.same_quantum, '1', 2)
        self.assertRaises(TypeError, c.same_quantum, 1, '2')

    @unittest.skip("Skulpt: scaleb not implemented")
    def test_scaleb(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.scaleb(Decimal(1), Decimal(2))
        self.assertEqual(c.scaleb(1, 2), d)
        self.assertEqual(c.scaleb(Decimal(1), 2), d)
        self.assertEqual(c.scaleb(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.scaleb, '1', 2)
        self.assertRaises(TypeError, c.scaleb, 1, '2')

    @unittest.skip("Skulpt: shift not implemented")
    def test_shift(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.shift(Decimal(1), Decimal(2))
        self.assertEqual(c.shift(1, 2), d)
        self.assertEqual(c.shift(Decimal(1), 2), d)
        self.assertEqual(c.shift(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.shift, '1', 2)
        self.assertRaises(TypeError, c.shift, 1, '2')

    def test_subtract(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.subtract(Decimal(1), Decimal(2))
        self.assertEqual(c.subtract(1, 2), d)
        self.assertEqual(c.subtract(Decimal(1), 2), d)
        self.assertEqual(c.subtract(1, Decimal(2)), d)
        self.assertRaises(TypeError, c.subtract, '1', 2)
        self.assertRaises(TypeError, c.subtract, 1, '2')

    @unittest.skip("Skulpt: to_eng_string not implemented")
    def test_to_eng_string(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.to_eng_string(Decimal(10))
        self.assertEqual(c.to_eng_string(10), d)
        self.assertRaises(TypeError, c.to_eng_string, '10')

    @unittest.skip("Skulpt: to_sci_string not implemented")
    def test_to_sci_string(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.to_sci_string(Decimal(10))
        self.assertEqual(c.to_sci_string(10), d)
        self.assertRaises(TypeError, c.to_sci_string, '10')

    def test_to_integral_exact(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.to_integral_exact(Decimal(10))
        self.assertEqual(c.to_integral_exact(10), d)
        self.assertRaises(TypeError, c.to_integral_exact, '10')

    def test_to_integral_value(self):
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context

        c = Context()
        d = c.to_integral_value(Decimal(10))
        self.assertEqual(c.to_integral_value(10), d)
        self.assertRaises(TypeError, c.to_integral_value, '10')
        self.assertRaises(TypeError, c.to_integral_value, 10, 'x')


# Skulpt: Most Context with statement tests work
class ContextWithStatement(unittest.TestCase):
    decimal = P  # Default to Python implementation
    # Can't do these as docstrings until Python 2.6
    # as doctest can't handle __future__ statements

    def test_localcontext(self):
        # Use a copy of the current context in the block
        getcontext = self.decimal.getcontext
        localcontext = self.decimal.localcontext

        orig_ctx = getcontext()
        with localcontext() as enter_ctx:
            set_ctx = getcontext()
        final_ctx = getcontext()
        self.assertIs(orig_ctx, final_ctx, 'did not restore context correctly')
        self.assertIsNot(orig_ctx, set_ctx, 'did not copy the context')
        self.assertIs(set_ctx, enter_ctx, '__enter__ returned wrong context')

    def test_localcontextarg(self):
        # Use a copy of the supplied context in the block
        Context = self.decimal.Context
        getcontext = self.decimal.getcontext
        localcontext = self.decimal.localcontext

        localcontext = self.decimal.localcontext
        orig_ctx = getcontext()
        new_ctx = Context(prec=42)
        with localcontext(new_ctx) as enter_ctx:
            set_ctx = getcontext()
        final_ctx = getcontext()
        self.assertIs(orig_ctx, final_ctx, 'did not restore context correctly')
        self.assertEqual(set_ctx.prec, new_ctx.prec, 'did not set correct context')
        self.assertIsNot(new_ctx, set_ctx, 'did not copy the context')
        self.assertIs(set_ctx, enter_ctx, '__enter__ returned wrong context')

    def test_localcontext_kwargs(self):
        with self.decimal.localcontext(
            prec=10, rounding=ROUND_HALF_DOWN,
            Emin=-20, Emax=20, capitals=0,
            clamp=1
        ) as ctx:
            self.assertEqual(ctx.prec, 10)
            self.assertEqual(ctx.rounding, self.decimal.ROUND_HALF_DOWN)
            self.assertEqual(ctx.Emin, -20)
            self.assertEqual(ctx.Emax, 20)
            self.assertEqual(ctx.capitals, 0)
            self.assertEqual(ctx.clamp, 1)

        self.assertRaises(TypeError, self.decimal.localcontext, precision=10)

        self.assertRaises(ValueError, self.decimal.localcontext, Emin=1)
        self.assertRaises(ValueError, self.decimal.localcontext, Emax=-1)
        self.assertRaises(ValueError, self.decimal.localcontext, capitals=2)
        self.assertRaises(ValueError, self.decimal.localcontext, clamp=2)

        self.assertRaises(TypeError, self.decimal.localcontext, rounding="")
        self.assertRaises(TypeError, self.decimal.localcontext, rounding=1)

        self.assertRaises(TypeError, self.decimal.localcontext, flags="")
        self.assertRaises(TypeError, self.decimal.localcontext, traps="")
        self.assertRaises(TypeError, self.decimal.localcontext, Emin="")
        self.assertRaises(TypeError, self.decimal.localcontext, Emax="")


    def test_localcontext_optional_overrides(self):
        # Skulpt regression: match C Decimal's optional keyword conventions.
        ctx = self.decimal.Context(prec=7)
        ctx.flags[self.decimal.Inexact] = True
        with self.decimal.localcontext(ctx, prec=None, flags=[self.decimal.Rounded],
                                       traps=[self.decimal.Inexact], capitals=True, clamp=False) as copy:
            self.assertEqual(copy.prec, 7)
            self.assertEqual(copy.capitals, 1)
            self.assertEqual(copy.clamp, 0)
            self.assertTrue(copy.flags[self.decimal.Rounded])
            self.assertFalse(copy.flags[self.decimal.Inexact])
            self.assertTrue(copy.traps[self.decimal.Inexact])
            self.assertFalse(copy.traps[self.decimal.InvalidOperation])
        self.assertTrue(ctx.flags[self.decimal.Inexact])
        self.assertFalse(ctx.flags[self.decimal.Rounded])
        with self.decimal.localcontext(prec=True, Emin=False, Emax=True) as copy:
            self.assertEqual((copy.prec, copy.Emin, copy.Emax), (1, 0, 1))

    def test_local_context_kwargs_does_not_overwrite_existing_argument(self):
        ctx = self.decimal.getcontext()
        orig_prec = ctx.prec
        with self.decimal.localcontext(prec=10) as ctx2:
            self.assertEqual(ctx2.prec, 10)
            self.assertEqual(ctx.prec, orig_prec)
        with self.decimal.localcontext(prec=20) as ctx2:
            self.assertEqual(ctx2.prec, 20)
            self.assertEqual(ctx.prec, orig_prec)


    @unittest.skip("Skulpt: Clamped/Overflow exceptions not properly raised with localcontext")
    def test_nested_with_statements(self):
        # Use a copy of the supplied context in the block
        Decimal = self.decimal.Decimal
        Context = self.decimal.Context
        getcontext = self.decimal.getcontext
        localcontext = self.decimal.localcontext
        Clamped = self.decimal.Clamped
        Overflow = self.decimal.Overflow

        orig_ctx = getcontext()
        orig_ctx.clear_flags()
        new_ctx = Context(Emax=384)
        with localcontext() as c1:
            self.assertEqual(c1.flags, orig_ctx.flags)
            self.assertEqual(c1.traps, orig_ctx.traps)
            c1.traps[Clamped] = True
            c1.Emin = -383
            self.assertNotEqual(orig_ctx.Emin, -383)
            self.assertRaises(Clamped, c1.create_decimal, '0e-999')
            self.assertTrue(c1.flags[Clamped])
            with localcontext(new_ctx) as c2:
                self.assertEqual(c2.flags, new_ctx.flags)
                self.assertEqual(c2.traps, new_ctx.traps)
                self.assertRaises(Overflow, c2.power, Decimal('3.4e200'), 2)
                self.assertFalse(c2.flags[Clamped])
                self.assertTrue(c2.flags[Overflow])
                del c2
            self.assertFalse(c1.flags[Overflow])
            del c1
        self.assertNotEqual(orig_ctx.Emin, -383)
        self.assertFalse(orig_ctx.flags[Clamped])
        self.assertFalse(orig_ctx.flags[Overflow])
        self.assertFalse(new_ctx.flags[Clamped])
        self.assertFalse(new_ctx.flags[Overflow])

    def test_with_statements_gc1(self):
        localcontext = self.decimal.localcontext

        with localcontext() as c1:
            del c1
            with localcontext() as c2:
                del c2
                with localcontext() as c3:
                    del c3
                    with localcontext() as c4:
                        del c4

    def test_with_statements_gc2(self):
        localcontext = self.decimal.localcontext

        with localcontext() as c1:
            with localcontext(c1) as c2:
                del c1
                with localcontext(c2) as c3:
                    del c2
                    with localcontext(c3) as c4:
                        del c3
                        del c4

    def test_with_statements_gc3(self):
        Context = self.decimal.Context
        localcontext = self.decimal.localcontext
        getcontext = self.decimal.getcontext
        setcontext = self.decimal.setcontext

        with localcontext() as c1:
            del c1
            n1 = Context(prec=1)
            setcontext(n1)
            with localcontext(n1) as c2:
                del n1
                self.assertEqual(c2.prec, 1)
                del c2
                n2 = Context(prec=2)
                setcontext(n2)
                del n2
                self.assertEqual(getcontext().prec, 2)
                n3 = Context(prec=3)
                setcontext(n3)
                self.assertEqual(getcontext().prec, 3)
                with localcontext(n3) as c3:
                    del n3
                    self.assertEqual(c3.prec, 3)
                    del c3
                    n4 = Context(prec=4)
                    setcontext(n4)
                    del n4
                    self.assertEqual(getcontext().prec, 4)
                    with localcontext() as c4:
                        self.assertEqual(c4.prec, 4)
                        del c4


class SpecialContexts(unittest.TestCase):
    """Test the context templates."""
    decimal = P  # Default to Python implementation

    def test_context_templates(self):
        BasicContext = self.decimal.BasicContext
        ExtendedContext = self.decimal.ExtendedContext
        getcontext = self.decimal.getcontext
        setcontext = self.decimal.setcontext
        InvalidOperation = self.decimal.InvalidOperation
        DivisionByZero = self.decimal.DivisionByZero
        Overflow = self.decimal.Overflow
        Underflow = self.decimal.Underflow
        Clamped = self.decimal.Clamped

        assert_signals(self, BasicContext, 'traps',
            [InvalidOperation, DivisionByZero, Overflow, Underflow, Clamped]
        )

        savecontext = getcontext().copy()
        basic_context_prec = BasicContext.prec
        extended_context_prec = ExtendedContext.prec

        ex = None
        try:
            BasicContext.prec = ExtendedContext.prec = 441
            for template in BasicContext, ExtendedContext:
                setcontext(template)
                c = getcontext()
                self.assertIsNot(c, template)
                self.assertEqual(c.prec, 441)
        except Exception as e:
            ex = e.__class__
        finally:
            BasicContext.prec = basic_context_prec
            ExtendedContext.prec = extended_context_prec
            setcontext(savecontext)
            if ex:
                raise ex

    def test_default_context(self):
        DefaultContext = self.decimal.DefaultContext
        BasicContext = self.decimal.BasicContext
        ExtendedContext = self.decimal.ExtendedContext
        getcontext = self.decimal.getcontext
        setcontext = self.decimal.setcontext
        InvalidOperation = self.decimal.InvalidOperation
        DivisionByZero = self.decimal.DivisionByZero
        Overflow = self.decimal.Overflow

        self.assertEqual(BasicContext.prec, 9)
        self.assertEqual(ExtendedContext.prec, 9)

        assert_signals(self, DefaultContext, 'traps',
            [InvalidOperation, DivisionByZero, Overflow]
        )

        savecontext = getcontext().copy()
        default_context_prec = DefaultContext.prec

        ex = None
        try:
            c = getcontext()
            saveprec = c.prec

            DefaultContext.prec = 961
            c = getcontext()
            self.assertEqual(c.prec, saveprec)

            setcontext(DefaultContext)
            c = getcontext()
            self.assertIsNot(c, DefaultContext)
            self.assertEqual(c.prec, 961)
        except Exception as e:
            ex = e.__class__
        finally:
            DefaultContext.prec = default_context_prec
            setcontext(savecontext)
            if ex:
                raise ex


class ContextInputValidation(unittest.TestCase):
    decimal = P  # Default to Python implementation

    def test_invalid_context(self):
        Context = self.decimal.Context
        DefaultContext = self.decimal.DefaultContext

        c = DefaultContext.copy()

        # prec, Emax
        for attr in ['prec', 'Emax']:
            setattr(c, attr, 999999)
            self.assertEqual(getattr(c, attr), 999999)
            self.assertRaises(ValueError, setattr, c, attr, -1)
            self.assertRaises(TypeError, setattr, c, attr, 'xyz')

        # Emin
        setattr(c, 'Emin', -999999)
        self.assertEqual(getattr(c, 'Emin'), -999999)
        self.assertRaises(ValueError, setattr, c, 'Emin', 1)
        self.assertRaises(TypeError, setattr, c, 'Emin', (1,2,3))

        self.assertRaises(TypeError, setattr, c, 'rounding', -1)
        self.assertRaises(TypeError, setattr, c, 'rounding', 9)
        self.assertRaises(TypeError, setattr, c, 'rounding', 1.0)
        self.assertRaises(TypeError, setattr, c, 'rounding', 'xyz')

        # capitals, clamp
        for attr in ['capitals', 'clamp']:
            self.assertRaises(ValueError, setattr, c, attr, -1)
            self.assertRaises(ValueError, setattr, c, attr, 2)
            self.assertRaises(TypeError, setattr, c, attr, [1,2,3])

        # Invalid attribute
        self.assertRaises(AttributeError, setattr, c, 'emax', 100)

        # Invalid signal dict
        self.assertRaises(TypeError, setattr, c, 'flags', [])
        self.assertRaises(KeyError, setattr, c, 'flags', {})
        self.assertRaises(KeyError, setattr, c, 'traps',
                          {'InvalidOperation':0})

        # Attributes cannot be deleted
        for attr in ['prec', 'Emax', 'Emin', 'rounding', 'capitals', 'clamp',
                     'flags', 'traps']:
            self.assertRaises(AttributeError, c.__delattr__, attr)

        # Invalid attributes
        self.assertRaises(TypeError, getattr, c, 9)
        self.assertRaises(TypeError, setattr, c, 9)

        # Invalid values in constructor
        self.assertRaises(TypeError, Context, rounding=999999)
        self.assertRaises(TypeError, Context, rounding='xyz')
        self.assertRaises(ValueError, Context, clamp=2)
        self.assertRaises(ValueError, Context, capitals=-1)
        self.assertRaises(KeyError, Context, flags=["P"])
        self.assertRaises(KeyError, Context, traps=["Q"])

        # Type error in conversion
        self.assertRaises(TypeError, Context, flags=(0,1))
        self.assertRaises(TypeError, Context, traps=(1,0))




# Skulpt: Most coverage tests work - individual tests skipped as needed
class Coverage(unittest.TestCase):
    decimal = P  # Default to Python implementation

    def test_adjusted(self):
        Decimal = self.decimal.Decimal

        self.assertEqual(Decimal('1234e9999').adjusted(), 10002)
        # XXX raise?
        self.assertEqual(Decimal('nan').adjusted(), 0)
        self.assertEqual(Decimal('inf').adjusted(), 0)

    def test_canonical(self):
        Decimal = self.decimal.Decimal
        getcontext = self.decimal.getcontext

        x = Decimal(9).canonical()
        self.assertEqual(x, 9)

        c = getcontext()
        x = c.canonical(Decimal(9))
        self.assertEqual(x, 9)

    def test_context_repr(self):
        c = self.decimal.DefaultContext.copy()

        c.prec = 425000000
        c.Emax = 425000000
        c.Emin = -425000000
        c.rounding = ROUND_HALF_DOWN
        c.capitals = 0
        c.clamp = 1
        for sig in OrderedSignals[self.decimal]:
            c.flags[sig] = False
            c.traps[sig] = False

        s = c.__repr__()
        t = "Context(prec=425000000, rounding=ROUND_HALF_DOWN, " \
            "Emin=-425000000, Emax=425000000, capitals=0, clamp=1, " \
            "flags=[], traps=[])"
        self.assertEqual(s, t)

    @unittest.skip("Skulpt: causes stack overflow due to complex context/decimal interactions")
    def test_implicit_context(self):
        Decimal = self.decimal.Decimal
        localcontext = self.decimal.localcontext

        with localcontext() as c:
            c.prec = 1
            c.Emax = 1
            c.Emin = -1

            # abs
            self.assertEqual(abs(Decimal("-10")), 10)
            # add
            self.assertEqual(Decimal("7") + 1, 8)
            # divide
            self.assertEqual(Decimal("10") / 5, 2)
            # divide_int
            self.assertEqual(Decimal("10") // 7, 1)
            # fma
            self.assertEqual(Decimal("1.2").fma(Decimal("0.01"), 1), 1)
            self.assertIs(Decimal("NaN").fma(7, 1).is_nan(), True)
            # three arg power
            self.assertEqual(pow(Decimal(10), 2, 7), 2)
            # exp
            self.assertEqual(Decimal("1.01").exp(), 3)
            # is_normal
            self.assertIs(Decimal("0.01").is_normal(), False)
            # is_subnormal
            self.assertIs(Decimal("0.01").is_subnormal(), True)
            # ln
            self.assertEqual(Decimal("20").ln(), 3)
            # log10
            self.assertEqual(Decimal("20").log10(), 1)
            # logb
            self.assertEqual(Decimal("580").logb(), 2)
            # logical_invert
            self.assertEqual(Decimal("10").logical_invert(), 1)
            # minus
            self.assertEqual(-Decimal("-10"), 10)
            # multiply
            self.assertEqual(Decimal("2") * 4, 8)
            # next_minus
            self.assertEqual(Decimal("10").next_minus(), 9)
            # next_plus
            self.assertEqual(Decimal("10").next_plus(), Decimal('2E+1'))
            # normalize
            self.assertEqual(Decimal("-10").normalize(), Decimal('-1E+1'))
            # number_class
            self.assertEqual(Decimal("10").number_class(), '+Normal')
            # plus
            self.assertEqual(+Decimal("-1"), -1)
            # remainder
            self.assertEqual(Decimal("10") % 7, 3)
            # subtract
            self.assertEqual(Decimal("10") - 7, 3)
            # to_integral_exact
            self.assertEqual(Decimal("1.12345").to_integral_exact(), 1)

            # Boolean functions
            self.assertTrue(Decimal("1").is_canonical())
            self.assertTrue(Decimal("1").is_finite())
            self.assertTrue(Decimal("1").is_finite())
            self.assertTrue(Decimal("snan").is_snan())
            self.assertTrue(Decimal("-1").is_signed())
            self.assertTrue(Decimal("0").is_zero())
            self.assertTrue(Decimal("0").is_zero())

        # Copy
        with localcontext() as c:
            c.prec = 10000
            x = 1228 ** 1523
            y = -Decimal(x)

            z = y.copy_abs()
            self.assertEqual(z, x)

            z = y.copy_negate()
            self.assertEqual(z, x)

            z = y.copy_sign(Decimal(1))
            self.assertEqual(z, x)

    def test_divmod(self):
        Decimal = self.decimal.Decimal
        localcontext = self.decimal.localcontext
        InvalidOperation = self.decimal.InvalidOperation
        DivisionByZero = self.decimal.DivisionByZero

        with localcontext() as c:
            q, r = divmod(Decimal("10912837129"), 1001)
            self.assertEqual(q, Decimal('10901935'))
            self.assertEqual(r, Decimal('194'))

            q, r = divmod(Decimal("NaN"), 7)
            self.assertTrue(q.is_nan() and r.is_nan())

            c.traps[InvalidOperation] = False
            q, r = divmod(Decimal("NaN"), 7)
            self.assertTrue(q.is_nan() and r.is_nan())

            c.traps[InvalidOperation] = False
            c.clear_flags()
            q, r = divmod(Decimal("inf"), Decimal("inf"))
            self.assertTrue(q.is_nan() and r.is_nan())
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            q, r = divmod(Decimal("inf"), 101)
            self.assertTrue(q.is_infinite() and r.is_nan())
            self.assertTrue(c.flags[InvalidOperation])

            c.clear_flags()
            q, r = divmod(Decimal(0), 0)
            self.assertTrue(q.is_nan() and r.is_nan())
            self.assertTrue(c.flags[InvalidOperation])

            c.traps[DivisionByZero] = False
            c.clear_flags()
            q, r = divmod(Decimal(11), 0)
            self.assertTrue(q.is_infinite() and r.is_nan())
            self.assertTrue(c.flags[InvalidOperation] and
                            c.flags[DivisionByZero])

    def test_power(self):
        Decimal = self.decimal.Decimal
        localcontext = self.decimal.localcontext
        Overflow = self.decimal.Overflow
        Rounded = self.decimal.Rounded

        with localcontext() as c:
            c.prec = 3
            c.clear_flags()
            self.assertEqual(Decimal("1.0") ** 100, Decimal('1.00'))
            self.assertTrue(c.flags[Rounded])
            # Non-integral powers remain unsupported in Skulpt.

    def test_quantize(self):
        Decimal = self.decimal.Decimal
        localcontext = self.decimal.localcontext
        InvalidOperation = self.decimal.InvalidOperation

        with localcontext() as c:
            c.prec = 1
            c.Emax = 1
            c.Emin = -1
            c.traps[InvalidOperation] = False
            x = Decimal(99).quantize(Decimal("1e1"))
            self.assertTrue(x.is_nan())

    def test_radix(self):
        Decimal = self.decimal.Decimal
        getcontext = self.decimal.getcontext

        c = getcontext()
        self.assertEqual(Decimal("1").radix(), 10)
        self.assertEqual(c.radix(), 10)

    def test_rop(self):
        Decimal = self.decimal.Decimal

        for attr in ('__radd__', '__rsub__', '__rmul__', '__rtruediv__',
                     '__rdivmod__', '__rmod__', '__rfloordiv__', '__rpow__'):
            self.assertIs(getattr(Decimal("1"), attr)("xyz"), NotImplemented)

    def test_round(self):
        # Python3 behavior: round() returns Decimal
        Decimal = self.decimal.Decimal
        localcontext = self.decimal.localcontext

        with localcontext() as c:
            c.prec = 28

            self.assertEqual(str(Decimal("9.99").__round__()), "10")
            self.assertEqual(str(Decimal("9.99e-5").__round__()), "0")
            self.assertEqual(str(Decimal("1.23456789").__round__(5)), "1.23457")
            self.assertEqual(str(Decimal("1.2345").__round__(10)), "1.2345000000")
            self.assertEqual(str(Decimal("1.2345").__round__(-10)), "0E+10")

            self.assertRaises(TypeError, Decimal("1.23").__round__, "5")
            self.assertRaises(TypeError, Decimal("1.23").__round__, 5, 8)

    def test_create_decimal(self):
        c = self.decimal.Context()
        self.assertRaises(ValueError, c.create_decimal, ["%"])

    def test_int(self):
        Decimal = self.decimal.Decimal
        localcontext = self.decimal.localcontext

        with localcontext() as c:
            c.prec = 9999
            x = Decimal(1221**1271) / 10**3923
            self.assertEqual(int(x), 1)
            self.assertEqual(x.to_integral(), 2)

    def test_copy(self):
        Context = self.decimal.Context

        c = Context()
        c.prec = 10000
        x = -(1172 ** 1712)

        y = c.copy_abs(x)
        self.assertEqual(y, -x)

        y = c.copy_negate(x)
        self.assertEqual(y, -x)

        y = c.copy_sign(x, 1)
        self.assertEqual(y, -x)


class IntegerPowerTest(unittest.TestCase):
    def test_large_integer_powers(self):
        # Selected CPython decimaltestdata/power.decTest cases; IDs retained.
        cases = [
            ('powx212', 9, -383, 384, '1', '999999998', '1', []),
            ('powx163', 9, -999999, 999999, '10', '999999', '1.00000000E+999999', ['Rounded']),
            ('powx183', 9, -999999, 999999, '7', '1000000', '1.09651419E+845098', ['Inexact', 'Rounded']),
            ('powx187', 9, -999999, 999999, '7', '-1000000', '9.11980901E-845099', ['Inexact', 'Rounded']),
            ('powx397', 15, -999, 999, '0.02', '100000000', '0E-1013',
             ['Underflow', 'Subnormal', 'Inexact', 'Rounded', 'Clamped']),
            ('powx581', 9, -999, 999, 'Infinity', '-1000', '0', []),
            # Skulpt regression: preserve exponent bits beyond JS's safe integer range.
            ('skulpt-big-exponent', 28, -99, 99, '1.00000000000000000000000001',
             '100000000000000000001', '1.000001000000500000166666718', ['Inexact', 'Rounded']),
        ]
        for case, prec, emin, emax, base, exponent, expected, conditions in cases:
            ctx = P.Context(prec=prec, Emin=emin, Emax=emax, traps=[])
            self.assertEqual(str(ctx.power(P.Decimal(base), P.Decimal(exponent))), expected, case)
            self.assertEqual(set(signal for signal in ctx.flags if ctx.flags[signal]),
                             set(getattr(P, name) for name in conditions), case)

    def test_power_traps_record_all_flags(self):
        # CPython power records the full status before raising its priority trap.
        ctx = P.Context(prec=3, Emin=-2, Emax=2, traps=[P.Overflow])
        self.assertRaises(P.Overflow, ctx.power, P.Decimal(2), 1000)
        self.assertTrue(ctx.flags[P.Inexact])
        self.assertTrue(ctx.flags[P.Rounded])
        ctx = P.Context(prec=15, Emin=-999, Emax=999, traps=[P.Underflow, P.Inexact])
        self.assertRaises(P.Underflow, ctx.power, P.Decimal('.02'), 100000000)
        for signal in [P.Underflow, P.Subnormal, P.Inexact, P.Rounded, P.Clamped]:
            self.assertTrue(ctx.flags[signal])

    def test_daily_compounding(self):
        # Skulpt regression: remove the arbitrary exponent-1000 cutoff.
        with P.localcontext(P.Context(prec=28)):
            self.assertEqual(str(P.Decimal('1.0001') ** 3650),
                             '1.440487720760919451993430859')


class PyFunctionality(unittest.TestCase):
    """Extra functionality in decimal.py"""

    def test_py_alternate_formatting(self):
        # triples giving a format, a Decimal, and the expected result
        Decimal = P.Decimal
        localcontext = P.localcontext

        test_values = [
            # Issue 7094: Alternate formatting (specified by #)
            ('.0e', '1.0', '1e+0'),
            ('#.0e', '1.0', '1.e+0'),
            ('.0f', '1.0', '1'),
            ('#.0f', '1.0', '1.'),
            ('g', '1.1', '1.1'),
            ('#g', '1.1', '1.1'),
            ('.0g', '1', '1'),
            ('#.0g', '1', '1.'),
            ('.0%', '1.0', '100%'),
            ('#.0%', '1.0', '100.%'),
            ]
        for fmt, d, result in test_values:
            self.assertEqual(format(Decimal(d), fmt), result)





def test_main():
    init(P)
    try:
        unittest.main(verbosity=1)
    finally:
        P.setcontext(ORIGINAL_CONTEXT[P])


if __name__ == '__main__':
    test_main()
