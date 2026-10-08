"""Number formatting tests ported from CPython Lib/test/test_locale.py.

Cooked fixtures check Python's formatting rules independently of host ICU data.
Browser-backed integration tests below exercise actual locale selection.
"""
import locale
import unittest
from datetime import datetime

class BaseCookedTest(unittest.TestCase):
    #
    # Base class for tests using cooked localeconv() values
    #

    def setUp(self):
        locale._override_localeconv = self.cooked_values

    def tearDown(self):
        locale._override_localeconv = {}

class CCookedTest(BaseCookedTest):
    # A cooked "C" locale

    cooked_values = {
        'currency_symbol': '',
        'decimal_point': '.',
        'frac_digits': 127,
        'grouping': [],
        'int_curr_symbol': '',
        'int_frac_digits': 127,
        'mon_decimal_point': '',
        'mon_grouping': [],
        'mon_thousands_sep': '',
        'n_cs_precedes': 127,
        'n_sep_by_space': 127,
        'n_sign_posn': 127,
        'negative_sign': '',
        'p_cs_precedes': 127,
        'p_sep_by_space': 127,
        'p_sign_posn': 127,
        'positive_sign': '',
        'thousands_sep': ''
    }

class EnUSCookedTest(BaseCookedTest):
    # A cooked "en_US" locale

    cooked_values = {
        'currency_symbol': '$',
        'decimal_point': '.',
        'frac_digits': 2,
        'grouping': [3, 3, 0],
        'int_curr_symbol': 'USD ',
        'int_frac_digits': 2,
        'mon_decimal_point': '.',
        'mon_grouping': [3, 3, 0],
        'mon_thousands_sep': ',',
        'n_cs_precedes': 1,
        'n_sep_by_space': 0,
        'n_sign_posn': 1,
        'negative_sign': '-',
        'p_cs_precedes': 1,
        'p_sep_by_space': 0,
        'p_sign_posn': 1,
        'positive_sign': '',
        'thousands_sep': ','
    }

class FrFRCookedTest(BaseCookedTest):
    # A cooked "fr_FR" locale with a space character as decimal separator
    # and a non-ASCII currency symbol.

    cooked_values = {
        'currency_symbol': '\u20ac',
        'decimal_point': ',',
        'frac_digits': 2,
        'grouping': [3, 3, 0],
        'int_curr_symbol': 'EUR ',
        'int_frac_digits': 2,
        'mon_decimal_point': ',',
        'mon_grouping': [3, 3, 0],
        'mon_thousands_sep': ' ',
        'n_cs_precedes': 0,
        'n_sep_by_space': 1,
        'n_sign_posn': 1,
        'negative_sign': '-',
        'p_cs_precedes': 0,
        'p_sep_by_space': 1,
        'p_sign_posn': 1,
        'positive_sign': '',
        'thousands_sep': ' '
    }

class BaseFormattingTest(object):
    #
    # Utility functions for formatting tests
    #

    def _test_format_string(self, format, value, out, **format_opts):
        self.assertEqual(
            locale.format_string(format, value, **format_opts), out)

    def _test_currency(self, value, out, **format_opts):
        self.assertEqual(locale.currency(value, **format_opts), out)

class EnUSNumberFormatting(BaseFormattingTest):
    # XXX there is a grouping + padding bug when the thousands separator
    # is empty but the grouping array contains values (e.g. Solaris 10)

    def setUp(self):
        self.sep = locale.localeconv()['thousands_sep']

    def test_grouping(self):
        self._test_format_string("%f", 1024, grouping=1, out='1%s024.000000' % self.sep)
        self._test_format_string("%f", 102, grouping=1, out='102.000000')
        self._test_format_string("%f", -42, grouping=1, out='-42.000000')
        self._test_format_string("%+f", -42, grouping=1, out='-42.000000')

    def test_grouping_and_padding(self):
        self._test_format_string("%20.f", -42, grouping=1, out='-42'.rjust(20))
        if self.sep:
            self._test_format_string("%+10.f", -4200, grouping=1,
                out=('-4%s200' % self.sep).rjust(10))
            self._test_format_string("%-10.f", -4200, grouping=1,
                out=('-4%s200' % self.sep).ljust(10))

    def test_integer_grouping(self):
        self._test_format_string("%d", 4200, grouping=True, out='4%s200' % self.sep)
        self._test_format_string("%+d", 4200, grouping=True, out='+4%s200' % self.sep)
        self._test_format_string("%+d", -4200, grouping=True, out='-4%s200' % self.sep)

    def test_integer_grouping_and_padding(self):
        self._test_format_string("%10d", 4200, grouping=True,
            out=('4%s200' % self.sep).rjust(10))
        self._test_format_string("%-10d", -4200, grouping=True,
            out=('-4%s200' % self.sep).ljust(10))

    def test_simple(self):
        self._test_format_string("%f", 1024, grouping=0, out='1024.000000')
        self._test_format_string("%f", 102, grouping=0, out='102.000000')
        self._test_format_string("%f", -42, grouping=0, out='-42.000000')
        self._test_format_string("%+f", -42, grouping=0, out='-42.000000')

    def test_padding(self):
        self._test_format_string("%20.f", -42, grouping=0, out='-42'.rjust(20))
        self._test_format_string("%+10.f", -4200, grouping=0, out='-4200'.rjust(10))
        self._test_format_string("%-10.f", 4200, grouping=0, out='4200'.ljust(10))

    def test_complex_formatting(self):
        # Spaces in formatting string
        self._test_format_string("One million is %i", 1000000, grouping=1,
            out='One million is 1%s000%s000' % (self.sep, self.sep))
        self._test_format_string("One  million is %i", 1000000, grouping=1,
            out='One  million is 1%s000%s000' % (self.sep, self.sep))
        # Dots in formatting string
        self._test_format_string(".%f.", 1000.0, out='.1000.000000.')
        # Padding
        if self.sep:
            self._test_format_string("-->  %10.2f", 4200, grouping=1,
                out='-->  ' + ('4%s200.00' % self.sep).rjust(10))
        # Asterisk formats
        self._test_format_string("%10.*f", (2, 1000), grouping=0,
            out='1000.00'.rjust(10))
        if self.sep:
            self._test_format_string("%*.*f", (10, 2, 1000), grouping=1,
                out=('1%s000.00' % self.sep).rjust(10))
        # Test more-in-one
        if self.sep:
            self._test_format_string("int %i float %.2f str %s",
                (1000, 1000.0, 'str'), grouping=1,
                out='int 1%s000 float 1%s000.00 str str' %
                (self.sep, self.sep))

        self._test_format_string("total=%i%%", 100, out='total=100%')
        self._test_format_string("newline: %i\n", 3, out='newline: 3\n')
        self._test_format_string("extra: %ii", 3, out='extra: 3i')

class TestLocaleFormatString(unittest.TestCase):
    """General tests on locale.format_string"""

    def test_percent_escape(self):
        self.assertEqual(locale.format_string('%f%%', 1.0), '%f%%' % 1.0)
        self.assertEqual(locale.format_string('%d %f%%d', (1, 1.0)),
            '%d %f%%d' % (1, 1.0))
        self.assertEqual(locale.format_string('%(foo)s %%d', {'foo': 'bar'}),
            ('%(foo)s %%d' % {'foo': 'bar'}))

    def test_mapping(self):
        self.assertEqual(locale.format_string('%(foo)s bing.', {'foo': 'bar'}),
            ('%(foo)s bing.' % {'foo': 'bar'}))
        self.assertEqual(locale.format_string('%(foo)s', {'foo': 'bar'}),
            ('%(foo)s' % {'foo': 'bar'}))

class TestEnUSNumberFormatting(EnUSCookedTest, EnUSNumberFormatting):
    # Test number formatting with a cooked "en_US" locale.

    def setUp(self):
        EnUSCookedTest.setUp(self)
        EnUSNumberFormatting.setUp(self)

    def test_currency(self):
        self._test_currency(50000, "$50000.00")
        self._test_currency(50000, "$50,000.00", grouping=True)
        self._test_currency(50000, "USD 50,000.00",
            grouping=True, international=True)

class TestCNumberFormatting(CCookedTest, BaseFormattingTest):
    # Test number formatting with a cooked "C" locale.

    def test_grouping(self):
        self._test_format_string("%.2f", 12345.67, grouping=True, out='12345.67')

    def test_grouping_and_padding(self):
        self._test_format_string("%9.2f", 12345.67, grouping=True, out=' 12345.67')

class TestFrFRNumberFormatting(FrFRCookedTest, BaseFormattingTest):
    # Test number formatting with a cooked "fr_FR" locale.

    def test_decimal_point(self):
        self._test_format_string("%.2f", 12345.67, out='12345,67')

    def test_grouping(self):
        self._test_format_string("%.2f", 345.67, grouping=True, out='345,67')
        self._test_format_string("%.2f", 12345.67, grouping=True, out='12 345,67')

    def test_grouping_and_padding(self):
        self._test_format_string("%6.2f", 345.67, grouping=True, out='345,67')
        self._test_format_string("%7.2f", 345.67, grouping=True, out=' 345,67')
        self._test_format_string("%8.2f", 12345.67, grouping=True, out='12 345,67')
        self._test_format_string("%9.2f", 12345.67, grouping=True, out='12 345,67')
        self._test_format_string("%10.2f", 12345.67, grouping=True, out=' 12 345,67')
        self._test_format_string("%-6.2f", 345.67, grouping=True, out='345,67')
        self._test_format_string("%-7.2f", 345.67, grouping=True, out='345,67 ')
        self._test_format_string("%-8.2f", 12345.67, grouping=True, out='12 345,67')
        self._test_format_string("%-9.2f", 12345.67, grouping=True, out='12 345,67')
        self._test_format_string("%-10.2f", 12345.67, grouping=True, out='12 345,67 ')

    def test_integer_grouping(self):
        self._test_format_string("%d", 200, grouping=True, out='200')
        self._test_format_string("%d", 4200, grouping=True, out='4 200')

    def test_integer_grouping_and_padding(self):
        self._test_format_string("%4d", 4200, grouping=True, out='4 200')
        self._test_format_string("%5d", 4200, grouping=True, out='4 200')
        self._test_format_string("%10d", 4200, grouping=True, out='4 200'.rjust(10))
        self._test_format_string("%-4d", 4200, grouping=True, out='4 200')
        self._test_format_string("%-5d", 4200, grouping=True, out='4 200')
        self._test_format_string("%-10d", 4200, grouping=True, out='4 200'.ljust(10))

    def test_currency(self):
        euro = '\u20ac'
        self._test_currency(50000, "50000,00 " + euro)
        self._test_currency(50000, "50 000,00 " + euro, grouping=True)
        self._test_currency(50000, "50 000,00 EUR",
            grouping=True, international=True)

class BaseDelocalizeTest(unittest.TestCase):

    def _test_delocalize(self, value, out):
        self.assertEqual(locale.delocalize(value), out)

    def _test_atof(self, value, out):
        self.assertEqual(locale.atof(value), out)

    def _test_atoi(self, value, out):
        self.assertEqual(locale.atoi(value), out)

class TestEnUSDelocalize(EnUSCookedTest, BaseDelocalizeTest):

    def test_delocalize(self):
        self._test_delocalize('50000.00', '50000.00')
        self._test_delocalize('50,000.00', '50000.00')

    def test_atof(self):
        self._test_atof('50000.00', 50000.)
        self._test_atof('50,000.00', 50000.)

    def test_atoi(self):
        self._test_atoi('50000', 50000)
        self._test_atoi('50,000', 50000)

class TestCDelocalizeTest(CCookedTest, BaseDelocalizeTest):

    def test_delocalize(self):
        self._test_delocalize('50000.00', '50000.00')

    def test_atof(self):
        self._test_atof('50000.00', 50000.)

    def test_atoi(self):
        self._test_atoi('50000', 50000)

class TestfrFRDelocalizeTest(FrFRCookedTest, BaseDelocalizeTest):

    def test_delocalize(self):
        self._test_delocalize('50000,00', '50000.00')
        self._test_delocalize('50 000,00', '50000.00')

    def test_atof(self):
        self._test_atof('50000,00', 50000.)
        self._test_atof('50 000,00', 50000.)

    def test_atoi(self):
        self._test_atoi('50000', 50000)
        self._test_atoi('50 000', 50000)

class BaseLocalizeTest(unittest.TestCase):

    def _test_localize(self, value, out, grouping=False):
        self.assertEqual(locale.localize(value, grouping=grouping), out)

class TestEnUSLocalize(EnUSCookedTest, BaseLocalizeTest):

    def test_localize(self):
        self._test_localize('50000.00', '50000.00')
        # Decimal inputs are not available in this Skulpt branch.
        # Exact string precision is tested through localize below.

class TestCLocalize(CCookedTest, BaseLocalizeTest):

    def test_localize(self):
        self._test_localize('50000.00', '50000.00')

class TestfrFRLocalize(FrFRCookedTest, BaseLocalizeTest):

    def test_localize(self):
        self._test_localize('50000.00', '50000,00')
        self._test_localize('50000.00', '50 000,00', grouping=True)


class BrowserLocaleTests(unittest.TestCase):
    def setUp(self):
        self.categories = (locale.LC_TIME, locale.LC_NUMERIC, locale.LC_MONETARY)
        self.saved = [locale.setlocale(category) for category in self.categories]
        for category in self.categories:
            locale.setlocale(category, 'C')

    def tearDown(self):
        for category, saved in zip(self.categories, self.saved):
            locale.setlocale(category, saved)

    def test_independent_categories(self):
        locale.setlocale(locale.LC_TIME, 'fr_FR')
        locale.setlocale(locale.LC_NUMERIC, 'de_DE')
        locale.setlocale(locale.LC_MONETARY, 'en_US')
        conv = locale.localeconv()
        self.assertEqual(datetime(2024, 3, 17).strftime('%B'), 'mars')
        self.assertEqual(conv['decimal_point'], ',')
        self.assertEqual(conv['mon_decimal_point'], '.')
        self.assertEqual(conv['currency_symbol'], '$')
        self.assertEqual(locale.format_string('%.2f', 1234.5, grouping=True), '1.234,50')
        self.assertEqual(locale.currency(1234.5, grouping=True), '$1,234.50')
        for category in self.categories:
            selection = locale.getlocale(category)
            locale.setlocale(category, selection)
            self.assertEqual(locale.getlocale(category), selection)

    def test_numeric_nl_langinfo(self):
        # CPython test__locale.test_lc_numeric_basic, without unsupported CTYPE.
        for name in ('C', 'en_US', 'de_DE', 'fr_FR', 'hi_IN'):
            locale.setlocale(locale.LC_NUMERIC, name)
            conv = locale.localeconv()
            for info, field in ((locale.RADIXCHAR, 'decimal_point'),
                                (locale.THOUSEP, 'thousands_sep')):
                self.assertEqual(locale.nl_langinfo(info), conv[field])

    def test_date_nl_langinfo(self):
        value = datetime(2024, 3, 17, 22, 44, 55)
        for name in ('C', 'fr_FR', 'de_DE', 'ja_JP'):
            locale.setlocale(locale.LC_TIME, name)
            for info, directive in ((locale.D_FMT, '%x'), (locale.T_FMT, '%X'),
                                    (locale.D_T_FMT, '%c'), (locale.T_FMT_AMPM, '%r')):
                pattern = locale.nl_langinfo(info)
                self.assertEqual(value.strftime(pattern), value.strftime(directive))
                if directive in ('%x', '%X', '%c'):
                    parsed = datetime.strptime(value.strftime(pattern), pattern)
                    if directive == '%x':
                        self.assertEqual(parsed.date(), value.date())
                    elif directive == '%X':
                        self.assertEqual(parsed.time(), value.time())
                    else:
                        self.assertEqual(parsed, value)

    def test_names_nl_langinfo(self):
        for name in ('C', 'fr_FR', 'de_DE'):
            locale.setlocale(locale.LC_TIME, name)
            for month in range(1, 13):
                value = datetime(2001, month, 1)
                for prefix, fmt in (('MON', '%B'), ('ABMON', '%b')):
                    info = getattr(locale, '%s_%d' % (prefix, month))
                    self.assertEqual(locale.nl_langinfo(info), value.strftime(fmt))
            for day in range(1, 8):
                # DAY_1 is Sunday, unlike Python's weekday numbering.
                value = datetime(2001, 1, 6 + day)
                for prefix, fmt in (('DAY', '%A'), ('ABDAY', '%a')):
                    info = getattr(locale, '%s_%d' % (prefix, day))
                    self.assertEqual(locale.nl_langinfo(info), value.strftime(fmt))
            self.assertEqual(locale.nl_langinfo(locale.AM_STR), datetime(2001, 1, 1, 1).strftime('%p'))
            self.assertEqual(locale.nl_langinfo(locale.PM_STR), datetime(2001, 1, 1, 22).strftime('%p'))
        self.assertRaises(ValueError, locale.nl_langinfo, -1)
        self.assertRaises(TypeError, locale.nl_langinfo, 'D_FMT')

    def test_grouping_and_parsing(self):
        for name, expected in (('en_US', '1,234,567.50'),
                               ('de_DE', '1.234.567,50'),
                               ('hi_IN', '12,34,567.50')):
            locale.setlocale(locale.LC_NUMERIC, name)
            formatted = locale.format_string('%.2f', 1234567.5, grouping=True)
            self.assertEqual(formatted, expected)
            self.assertEqual(locale.atof(formatted), 1234567.5)
            integer = locale.format_string('%d', 1234567, grouping=True)
            self.assertEqual(locale.atoi(integer), 1234567)
        locale.setlocale(locale.LC_NUMERIC, 'fr_FR')
        separator = locale.localeconv()['thousands_sep']
        self.assertEqual(locale.format_string('%.2f', 1234567.5, grouping=True),
                         '1%s234%s567,50' % (separator, separator))
        self.assertRaises(ValueError, locale.atof, 'not a number')

    def test_dynamic_width_and_precision(self):
        locale.setlocale(locale.LC_NUMERIC, 'en_US')
        self.assertEqual(locale.format_string('%*.*f', (10, 2, 1234.5), grouping=True), '  1,234.50')
        self.assertEqual(locale.format_string('%.*f', (-1, 1.25)), '1')
        self.assertEqual(locale.format_string('%-+10d', 1234, grouping=True), '+1,234    ')
        self.assertRaises(TypeError, locale.format_string, '%*d', (1.5, 42))
        self.assertRaises(TypeError, locale.format_string, '%*d', ('3', 42))

    def test_percent_formatter_integration(self):
        # Exercise the shared formatter fixes through the locale API.
        locale.setlocale(locale.LC_NUMERIC, 'en_US')
        self.assertEqual(locale.format_string('%.1g', 1000000, grouping=True), '1e+06')
        self.assertEqual(locale.format_string('%u', 1234, grouping=True), '1,234')
        self.assertEqual(locale.format_string('%5.*s', (2, 'abc')), '   ab')
        self.assertEqual(locale.format_string('%010.2f', -1234.5, grouping=True), '-001,234.50')
        self.assertEqual(locale.format_string('%+10.2f', 1234.5, grouping=True), ' +1,234.50')
        locale.setlocale(locale.LC_NUMERIC, 'de_DE')
        self.assertEqual(locale.str(1.5), '1,5')
        self.assertEqual(locale.format_string('%(total_price).2f',
                         {'total_price': 1234.5}, grouping=True), '1.234,50')

    def test_exact_numeric_strings_and_large_integers(self):
        locale.setlocale(locale.LC_NUMERIC, 'de_DE')
        self.assertEqual(locale.localize('12345678901234567890.123456789', grouping=True),
                         '12.345.678.901.234.567.890,123456789')
        value = 123456789012345678901234567890
        formatted = locale.format_string('%d', value, grouping=True)
        self.assertEqual(formatted, '123.456.789.012.345.678.901.234.567.890')
        self.assertEqual(locale.atoi(formatted), value)

    def test_currency_layout_and_sign(self):
        for name, expected in (('en_US', '$1,234.50'),
                               ('de_DE', '1.234,50 €'),
                               ('de_CH', "CHF 1'234.50"),
                               ('fr_CH', "1'234.50 CHF")):
            locale.setlocale(locale.LC_MONETARY, name)
            self.assertEqual(locale.currency(1234.5, grouping=True), expected)
        locale.setlocale(locale.LC_MONETARY, 'de_CH')
        self.assertEqual(locale.currency(-1234.5, grouping=True), "CHF-1'234.50")
        self.assertEqual(locale.currency(-1234.5, symbol=False, grouping=True), "-1'234.50")
        locale.setlocale(locale.LC_MONETARY, 'en_US')
        self.assertEqual(locale.currency(-1234.5, grouping=True), '-$1,234.50')
        self.assertEqual(locale.currency(1234.5, international=True, grouping=True), 'USD 1,234.50')

    def test_currency_fractional_units(self):
        locale.setlocale(locale.LC_MONETARY, 'ja_JP')
        self.assertEqual(locale.localeconv()['int_curr_symbol'], 'JPY ')
        self.assertEqual(locale.localeconv()['frac_digits'], 0)
        self.assertEqual(locale.currency(1234, symbol=False, grouping=True), '1,234')
        self.assertEqual(locale.format_string('%.2f', 1.5, monetary=True), '1.50')
        locale.setlocale(locale.LC_MONETARY, 'ar_BH')
        self.assertEqual(locale.localeconv()['int_curr_symbol'], 'BHD ')
        self.assertEqual(locale.localeconv()['frac_digits'], 3)
        self.assertEqual(locale.currency(1.25, symbol=False), '1.250')

    def test_currency_errors_preserve_state(self):
        self.assertRaises(ValueError, locale.currency, 1234.5)
        selected = locale.setlocale(locale.LC_MONETARY, 'en_US')
        self.assertRaises(locale.Error, locale.setlocale, locale.LC_MONETARY, 'en-001')
        self.assertEqual(locale.setlocale(locale.LC_MONETARY), selected)

    def test_localeconv_returns_fresh_data(self):
        locale.setlocale(locale.LC_NUMERIC, 'hi_IN')
        original = locale.localeconv()
        original['grouping'].append(7)
        original['decimal_point'] = '!'
        self.assertEqual(locale.localeconv()['grouping'], [3, 2, 0])
        self.assertEqual(locale.localeconv()['decimal_point'], '.')


if __name__ == '__main__':
    unittest.main()
