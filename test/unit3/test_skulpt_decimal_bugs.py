"""Focused regressions supplementing the CPython tests in test_decimal.py."""
import unittest
from decimal import (Decimal, Context, localcontext, getcontext, setcontext,
                     DivisionByZero, InvalidOperation, Inexact, Rounded, FloatOperation,
                     Overflow, Underflow, Subnormal, Clamped,
                     ROUND_HALF_EVEN, ROUND_DOWN, ROUND_UP, ROUND_FLOOR,
                     ROUND_CEILING, ROUND_HALF_UP, ROUND_HALF_DOWN, ROUND_05UP)


class DecimalRegressionTests(unittest.TestCase):
    def setUp(self):
        self.saved_context = getcontext()
        setcontext(Context(prec=28, rounding=ROUND_HALF_EVEN))

    def tearDown(self):
        setcontext(self.saved_context)

    def test_arithmetic_signals_and_traps(self):
        # CPython _pydecimal.Context._raise_error and Decimal special cases.
        c = getcontext()
        self.assertRaises(DivisionByZero, lambda: Decimal(1) / 0)
        self.assertTrue(c.flags[DivisionByZero])
        c.clear_flags()
        for operation in (lambda: Decimal(0) / 0,
                          lambda: Decimal('Infinity') + Decimal('-Infinity'),
                          lambda: Decimal('Infinity') * 0):
            self.assertRaises(InvalidOperation, operation)
            self.assertTrue(c.flags[InvalidOperation])
            c.clear_flags()
        c.clear_traps()
        self.assertEqual(Decimal(1) / 0, Decimal('Infinity'))
        self.assertTrue((Decimal(0) / 0).is_qnan())
        self.assertTrue((Decimal('sNaN42') + 1).is_qnan())
        self.assertEqual(str(Decimal('sNaN42') + 1), 'NaN42')
        self.assertTrue(c.flags[InvalidOperation])

    def test_context_precision_and_rounding(self):
        # CPython _pydecimal.Decimal._fix and __truediv__.
        c = getcontext()
        c.prec = 3
        self.assertEqual(Decimal('1.234') + Decimal('2.345'), Decimal('3.58'))
        self.assertEqual(Decimal('1.234') * Decimal('2.345'), Decimal('2.89'))
        self.assertEqual(Decimal(1) / 6, Decimal('0.167'))
        self.assertTrue(c.flags[Inexact])
        self.assertTrue(c.flags[Rounded])
        for mode, expected in ((ROUND_DOWN, '0.166'), (ROUND_UP, '0.167'),
                               (ROUND_FLOOR, '0.166'), (ROUND_CEILING, '0.167'),
                               (ROUND_HALF_UP, '0.167'), (ROUND_HALF_DOWN, '0.167'),
                               (ROUND_HALF_EVEN, '0.167'), (ROUND_05UP, '0.166')):
            c.rounding = mode
            self.assertEqual(c.divide(1, 6), Decimal(expected))
        c.rounding = ROUND_HALF_EVEN
        c.clear_flags()
        self.assertEqual(str(Decimal(1) / 2), '0.5')
        self.assertFalse(c.flags[Inexact])
        self.assertFalse(c.flags[Rounded])
        self.assertEqual(+Decimal('1.234'), Decimal('1.23'))
        self.assertEqual(c.create_decimal('1.234'), Decimal('1.23'))
        c.traps[Inexact] = True
        self.assertRaises(Inexact, lambda: Decimal(1) / 6)

    def test_integer_division_and_remainder(self):
        # CPython Decimal._divide: truncate, preserve dividend sign, no rounding of q.
        for a, b, q, r in ((-7, 4, -1, -3), (7, -4, -1, 3),
                            (-7, -4, 1, -3), (7, 4, 1, 3)):
            self.assertEqual(Decimal(a) // b, Decimal(q))
            self.assertEqual(Decimal(a) % b, Decimal(r))
            self.assertEqual(divmod(Decimal(a), b), (Decimal(q), Decimal(r)))
        c = getcontext()
        c.prec = 2
        self.assertEqual(divmod(Decimal('9.99'), 1), (Decimal(9), Decimal('.99')))
        self.assertFalse(c.flags[Inexact])
        self.assertRaises(InvalidOperation, lambda: Decimal(1000) // 1)
        self.assertRaises(InvalidOperation, lambda: Decimal(1) % 0)

    def test_context_exponent_limits(self):
        # CPython Decimal._fix: overflow, subnormal rounding, and clamping.
        c = Context(prec=3, Emin=-2, Emax=2)
        self.assertRaises(Overflow, c.multiply, Decimal('9.99e2'), 10)
        self.assertTrue(c.flags[Overflow])
        c.clear_traps()
        self.assertEqual(c.multiply(Decimal('9.99e2'), 10), Decimal('Infinity'))
        self.assertTrue(c.flags[Inexact])
        self.assertTrue(c.flags[Rounded])
        c.clear_flags()
        self.assertEqual(c.divide(Decimal('0.001'), 3), Decimal('0.0003'))
        for signal in (Underflow, Subnormal, Inexact, Rounded):
            self.assertTrue(c.flags[signal])
        c.clear_flags()
        self.assertEqual(str(c.divide(Decimal('0.0001'), 10)), '0.0000')
        self.assertTrue(c.flags[Clamped])
        c.clamp = 1
        c.clear_flags()
        self.assertEqual(str(c.create_decimal('1e2')), '100')
        self.assertTrue(c.flags[Clamped])

    def test_integer_power_and_modulus(self):
        c = getcontext()
        c.prec = 3
        self.assertEqual(c.power(2, 5, 3), Decimal(2))
        self.assertEqual(c.power(-2, 5, -3), Decimal(-2))
        self.assertEqual(c.power(Decimal('2.0'), Decimal('5.0'), 3), Decimal(2))
        self.assertRaises(InvalidOperation, c.power, 2, 5, 0)
        self.assertRaises(InvalidOperation, c.power, 2, -5, 3)
        self.assertRaises(InvalidOperation, c.power, 0, 0)
        self.assertEqual(Decimal('1.234') ** 3, Decimal('1.88'))
        self.assertEqual(Decimal(2) ** -3, Decimal('0.125'))

    def test_fractional_power_is_explicitly_unsupported(self):
        # Skulpt's partial implementation must not silently use binary floats.
        try:
            result = Decimal(2) ** Decimal('0.5')
        except NotImplementedError:
            return
        # CPython supports this operation and supplies the reference value.
        self.assertEqual(result, Decimal('1.414213562373095048801688724'))

    def test_wildcard_import_and_decimal_tuple(self):
        namespace = {}
        exec('from decimal import *', namespace)
        tuple_type = namespace['DecimalTuple']
        value = Decimal('-1.20').as_tuple()
        self.assertIsInstance(value, tuple_type)
        self.assertEqual((value.sign, value.digits, value.exponent), (1, (1, 2, 0), -2))
        self.assertEqual(tuple_type(sign=1, digits=(1, 2, 0), exponent=-2), value)

    def test_equal_numbers_are_interchangeable_dict_keys(self):
        from fractions import Fraction
        for value, other in ((Decimal('0.5'), 0.5), (Decimal('0.1'), Fraction(1, 10)),
                              (Decimal('-0.1'), Fraction(-1, 10)), (Decimal('1e20'), 10**20)):
            self.assertEqual(value, other)
            self.assertEqual(hash(value), hash(other))
            self.assertEqual({value: 'found'}.get(other), 'found')

    def test_context_unary_operations_and_zero_signs(self):
        c = Context(prec=3)
        for name, expected in (('plus', '1.23'), ('minus', '-1.23'), ('abs', '1.23')):
            operation = getattr(c, name)
            self.assertEqual(operation(Decimal('1.2345')), Decimal(expected))
            self.assertRaises(InvalidOperation, operation, Decimal('sNaN'))
        self.assertEqual(str(+Decimal('-0')), '0')
        self.assertEqual(str(-Decimal('0')), '0')
        getcontext().rounding = ROUND_FLOOR
        self.assertEqual(str(+Decimal('-0')), '-0')
        self.assertEqual(str(-Decimal('0')), '-0')

    def test_addition_quantum_and_cancellation(self):
        self.assertEqual(str(Decimal('1') + Decimal('0.00')), '1.00')
        self.assertEqual(str(Decimal('0.00') + Decimal('1')), '1.00')
        c = getcontext()
        c.rounding = ROUND_FLOOR
        self.assertEqual(str(Decimal(1) - Decimal(1)), '-0')
        self.assertEqual(str(Decimal('0') + Decimal('-0')), '-0')
        c.prec = 3
        c.rounding = ROUND_HALF_EVEN
        self.assertEqual(Decimal('1.005') + Decimal('1e-10000'), Decimal('1.01'))
        self.assertEqual(Decimal('1.005') - Decimal('1e-10000'), Decimal('1.00'))
        self.assertEqual(str(Decimal('1e10000') + 1), '1.00E+10000')

    def test_context_comparison_and_extrema(self):
        c = Context(prec=3)
        self.assertRaises(InvalidOperation, c.compare, Decimal('sNaN'), 1)
        self.assertEqual(str(c.compare(Decimal('NaN42'), 1)), 'NaN42')
        for name in ('max', 'min', 'max_mag', 'min_mag'):
            operation = getattr(c, name)
            self.assertRaises(InvalidOperation, operation, Decimal('sNaN'), 0)
            self.assertEqual(operation(Decimal('1.2345'), Decimal('NaN')), Decimal('1.23'))
            self.assertEqual(str(operation(Decimal('NaN42'), Decimal('NaN'))), 'NaN42')
        self.assertEqual(str(c.max(Decimal('-0'), Decimal('0'))), '0')
        self.assertEqual(str(c.min(Decimal('0'), Decimal('-0'))), '-0')
        self.assertEqual(str(c.max(Decimal('1.00'), Decimal('1'))), '1')
        self.assertEqual(str(c.min(Decimal('1.00'), Decimal('1'))), '1.00')
        self.assertEqual(c.max_mag(-2, 2), Decimal(2))
        self.assertEqual(c.min_mag(2, -2), Decimal(-2))

    def test_integral_rounding_uses_context_without_inexact(self):
        getcontext().rounding = ROUND_FLOOR
        for name in ('to_integral', 'to_integral_value'):
            operation = getattr(Decimal('1.9'), name)
            self.assertEqual(operation(), Decimal(1))
            self.assertEqual(operation(rounding=ROUND_UP), Decimal(2))
            self.assertEqual(operation(context=Context(rounding=ROUND_CEILING)), Decimal(2))
            self.assertFalse(getcontext().flags[Inexact])
            self.assertFalse(getcontext().flags[Rounded])
            self.assertRaises(InvalidOperation, getattr(Decimal('sNaN'), name))

    def test_special_results_obey_context(self):
        # Minimized from CPython differential cases for special result handling.
        c = Context(prec=1, Emin=-5, Emax=5, traps=[])
        self.assertEqual(str(c.divide(0, Decimal('1e6'))), '0.00000')
        self.assertTrue(c.flags[Clamped])
        c.clear_flags()
        self.assertEqual(str(c.divide(1, Decimal('-Infinity'))), '-0.00000')
        self.assertTrue(c.flags[Clamped])
        self.assertEqual(str(c.add(1, Decimal('sNaN42'))), 'NaN2')
        self.assertEqual(str(c.subtract(1, Decimal('sNaN42'))), 'NaN2')
        self.assertEqual(str(c.subtract(1, Decimal('NaN'))), 'NaN')

    def test_float_operation_signals(self):
        c = getcontext()
        c.traps[FloatOperation] = True
        self.assertRaises(FloatOperation, Decimal, 0.5)
        self.assertRaises(FloatOperation, lambda: Decimal('0.5') < 0.6)
        self.assertTrue(c.flags[FloatOperation])
        c.clear_flags()
        self.assertEqual(Decimal('0.5'), 0.5)
        self.assertTrue(c.flags[FloatOperation])
        c.clear_flags()
        self.assertEqual(Decimal.from_float(0.5), Decimal('0.5'))
        self.assertFalse(c.flags[FloatOperation])

    def test_context_signal_configuration(self):
        from decimal import DefaultContext
        original = DefaultContext.traps[InvalidOperation]
        try:
            DefaultContext.traps[InvalidOperation] = False
            self.assertFalse(Context().traps[InvalidOperation])
        finally:
            DefaultContext.traps[InvalidOperation] = original
        self.assertRaises(TypeError, Context, traps=42)
        self.assertRaises(KeyError, Context, flags=[ValueError])
        self.assertRaises(KeyError, Context, flags={Inexact: True})
        c = Context()
        self.assertRaises(TypeError, setattr, c, 'traps', 42)
        self.assertTrue(c.traps[InvalidOperation])

    def test_modular_power_through_python_protocol(self):
        self.assertEqual(Decimal(2).__pow__(5, 3), Decimal(2))
        self.assertEqual(pow(Decimal(2), 5, 3), Decimal(2))
        class ModularPower:
            def __pow__(self, exponent, modulus=None):
                return (exponent, modulus)
        self.assertEqual(pow(ModularPower(), 5, 3), (5, 3))
        from fractions import Fraction
        self.assertRaises(TypeError, pow, Fraction(2), 5, 3)

    def test_normalize_rounds_before_removing_zeros(self):
        # CPython _pydecimal.Decimal.normalize: round first, then reduce.
        self.assertEqual(str(Decimal('32.100').normalize()), '32.1')
        self.assertEqual(str(Decimal('-0.000').normalize()), '-0')
        c = Context(prec=3)
        self.assertEqual(str(Decimal('9.999').normalize(context=c)), '1E+1')
        self.assertTrue(c.flags[Inexact])
        self.assertTrue(c.flags[Rounded])
        self.assertEqual(str(c.normalize(1000)), '1E+3')
        c = Context(prec=3, Emax=2, clamp=1)
        self.assertEqual(str(c.normalize(Decimal('1e2'))), '100')
        self.assertTrue(c.flags[Clamped])
        self.assertEqual(str(c.normalize(Decimal('Infinity'))), 'Infinity')
        self.assertEqual(str(c.normalize(Decimal('NaN42'))), 'NaN42')
        self.assertRaises(InvalidOperation, c.normalize, Decimal('sNaN'))
        self.assertRaises(TypeError, Decimal('1').normalize, context=42)

    def test_quantize_preserves_scale_and_reports_lost_digits(self):
        c = Context(prec=3)
        self.assertEqual(str(Decimal('1.2').quantize(Decimal('.01'), context=c)), '1.20')
        self.assertFalse(c.flags[Rounded])
        self.assertEqual(str(c.quantize(Decimal('1.200'), Decimal('.01'))), '1.20')
        self.assertTrue(c.flags[Rounded])
        self.assertFalse(c.flags[Inexact])
        self.assertEqual(str(c.quantize(Decimal('-0.001'), Decimal('.01'))), '-0.00')
        self.assertTrue(c.flags[Inexact])
        self.assertRaises(InvalidOperation, c.quantize, Decimal('9.999'), Decimal('.01'))
        self.assertRaises(TypeError, Decimal(1).quantize, '.01')
        self.assertRaises(TypeError, Decimal(1).quantize, Decimal('.01'), context=42)
        self.assertRaises(TypeError, Decimal(1).quantize, Decimal('.01'), rounding='invalid')

    def test_quantize_subnormal_does_not_signal_underflow(self):
        # Decimal.quantize deliberately differs from ordinary arithmetic here.
        c = Context(prec=3, Emin=-2, Emax=2, traps=[Underflow, InvalidOperation])
        self.assertEqual(c.quantize(Decimal('.00123'), Decimal('.0001')), Decimal('.0012'))
        self.assertTrue(c.flags[Subnormal])
        self.assertTrue(c.flags[Inexact])
        self.assertTrue(c.flags[Rounded])
        self.assertFalse(c.flags[Underflow])
        self.assertRaises(InvalidOperation, c.quantize, Decimal(0), Decimal('1e-5'))
        self.assertRaises(InvalidOperation, c.quantize, Decimal('Infinity'), Decimal(1))
        self.assertEqual(str(c.quantize(Decimal('-Infinity'), Decimal('Infinity'))), '-Infinity')
        self.assertEqual(str(c.quantize(Decimal('NaN42'), Decimal(1))), 'NaN42')
        self.assertRaises(InvalidOperation, c.quantize, Decimal('sNaN'), Decimal(1))


if __name__ == '__main__':
    unittest.main()
