"""Focused regressions adapted from CPython Lib/test/test_format.py.

The common-format cases exercise str and bytes, which share the formatter.
"""
import unittest


class PercentFormatTests(unittest.TestCase):
    def check_common(self, fmt, value, expected):
        self.assertEqual(fmt % value, expected)
        self.assertEqual(fmt.encode('ascii') % value, expected.encode('ascii'))

    def test_left_aligned_integer_sign_and_prefix(self):
        # FormatTest.test_common_format: retain the sign/prefix before digits.
        big = 123456789012345678901234567890
        self.check_common('%-32d', -big, '-123456789012345678901234567890 ')
        self.check_common('%-032d', -big, '-123456789012345678901234567890 ')
        big = 0x1234567890abcdef12345
        self.check_common('%-23x', -big, '-1234567890abcdef12345 ')
        self.check_common('%#-27x', big, '0x1234567890abcdef12345    ')
        self.check_common('%#-+27.23x', big, '+0x001234567890abcdef12345 ')

    def test_dynamic_width_and_precision(self):
        # CPython test_locale's formatting cases, before locale substitution.
        self.check_common('%10.*f', (2, 1000), '   1000.00')
        self.check_common('%*.*f', (10, 2, 1000), '   1000.00')
        # CPython test_format's %.*d case, with a practical precision.
        self.check_common('%.*d', (4, 42), '0042')
        self.check_common('%*d:%d', (5, 42, 7), '   42:7')
        self.check_common('%*d', (-5, -42), '-42  ')
        self.check_common('%.*f', (-1, 1.25), '1')
        self.check_common('%.*g', (0, 1.25), '1')

    def test_dynamic_format_requires_integer_and_enough_arguments(self):
        # CPython string_tests.test_formatting rejects non-integer stars.
        for fmt, values in (('%*s', ('foo', 'bar')),
                            ('%10.*f', ('foo', 42.)),
                            ('%*d', (1.5, 42)),
                            ('%(foo)s', ('foo',)),
                            ('%*.*f', (10, 2))):
            self.assertRaises(TypeError, lambda: fmt % values)
            self.assertRaises(TypeError, lambda: fmt.encode('ascii') % values)

    def test_empty_precision(self):
        # CPython test_locale.test_integer_grouping/test_integer_nogrouping.
        self.check_common('%20.f', -42, '                 -42')
        self.check_common('%+10.f', -4200, '     -4200')
        self.check_common('%-10.f', 4200, '4200      ')
        self.check_common('%.e', 0.125, '1e-01')
        self.check_common('%.g', 1.25, '1')

    def test_dynamic_format_overflow(self):
        # CPython string_tests.test_formatting rejects oversized star values.
        for fmt, values in (('%*s', (2**100, '')),
                            ('%.*f', (2**100, 1.25))):
            self.assertRaises(OverflowError, lambda: fmt % values)
            self.assertRaises(OverflowError, lambda: fmt.encode('ascii') % values)

    def test_string_precision_and_padding(self):
        # CPython common formatting rules: truncate before applying field width.
        self.assertEqual('%.*s' % (0, 'abc'), '')
        self.assertEqual('%.s' % 'abc', '')
        self.assertEqual('%5.*s' % (2, 'abc'), '   ab')
        self.assertEqual('%*.*s' % (-8, 3, 'abcdef'), 'abc     ')
        self.assertEqual(b'%.*s' % (0, b'abc'), b'')
        self.assertEqual(b'%.s' % b'abc', b'')
        self.assertEqual(b'%5.*s' % (2, b'abc'), b'   ab')
        self.assertEqual(b'%*.*s' % (-8, 3, b'abcdef'), b'abc     ')
        self.check_common('%.*r', (0, 'abc'), '')
        self.check_common('%8.3r', 'abcdef', "     'ab")

    def test_exponent_padding(self):
        self.check_common('%.1g', 1000000, '1e+06')
        self.check_common('%.1G', 1000000, '1E+06')
        self.check_common('%.1e', 1000000, '1.0e+06')
        self.check_common('%.1e', 0.000001, '1.0e-06')

    def test_mapping_key_names(self):
        self.assertEqual('%(total_price).2f' % {'total_price': 1234.5}, '1234.50')
        self.assertEqual('%(total price)d' % {'total price': 42}, '42')
        self.assertEqual(b'%(total_price).2f' % {b'total_price': 1234.5}, b'1234.50')

    def test_unsigned_decimal_conversion(self):
        # CPython %u is an obsolete alias of decimal integer conversion.
        self.check_common('%u', 1234, '1234')
        self.check_common('%u', -1234, '-1234')
        self.check_common('%u', 12.5, '12')

    def test_float_sign_and_padding(self):
        self.check_common('%010.2f', -1234.5, '-001234.50')
        self.check_common('%+10.2f', 1234.5, '  +1234.50')
        self.check_common('% 10.2f', 1234.5, '   1234.50')
        self.check_common('%-+10.2f', 1234.5, '+1234.50  ')
        self.check_common('%010.2f', -0.0, '-000000.00')

    def test_general_float_precision(self):
        # CPython general-format cases, adapted to test presentation without ties.
        self.check_common('%.3g', 1500.0, '1.5e+03')
        self.check_common('%#.3g', 1500.0, '1.50e+03')
        self.check_common('%.12g', 1.5, '1.5')
        self.check_common('%.2G', 1.0, '1')
        self.check_common('%g', 1234567.0, '1.23457e+06')
        self.check_common('%.8f', 0.00000001, '0.00000001')
        self.check_common('%.3g', -0.000012, '-1.2e-05')
        self.check_common('%#.3g', 0.000012, '1.20e-05')


if __name__ == '__main__':
    unittest.main()
