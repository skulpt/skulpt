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


if __name__ == '__main__':
    unittest.main()
