"""LC_TIME tests, adapted from CPython's test_locale and test_calendar.

Locale availability and presentation come from Intl rather than libc.
Numeric and monetary formatting have their own test_locale_formatting suite;
Windows aliases and POSIX modifiers are outside this subset.
"""
import unittest
import locale
import calendar
import time
from datetime import datetime, timedelta, timezone


class LocaleTests(unittest.TestCase):
    def setUp(self):
        self.oldlocale = locale.setlocale(locale.LC_TIME)
        locale.setlocale(locale.LC_TIME, 'C')

    def tearDown(self):
        locale.setlocale(locale.LC_TIME, self.oldlocale)

    def test_getsetlocale_issue1813(self):
        # CPython TestRealLocales: adapt LC_CTYPE to our supported category.
        locale.setlocale(locale.LC_TIME, 'tr_TR')
        loc = locale.getlocale(locale.LC_TIME)
        locale.setlocale(locale.LC_TIME, loc)
        self.assertEqual(loc, locale.getlocale(locale.LC_TIME))

    def test_setlocale_category(self):
        # CPython TestMiscellaneous: unsupported categories fail explicitly.
        locale.setlocale(locale.LC_TIME)
        self.assertRaises(locale.Error, locale.setlocale, 12345)
        for category in (locale.LC_ALL, locale.LC_CTYPE, locale.LC_COLLATE,
                         locale.LC_MESSAGES):
            self.assertRaises(NotImplementedError, locale.setlocale, category)
            self.assertRaises(NotImplementedError, locale.getlocale, category)

    def test_invalid_locale_format_in_localetuple(self):
        # CPython TestMiscellaneous, with LC_TIME in place of LC_ALL.
        self.assertRaises(TypeError, locale.setlocale, locale.LC_TIME, b'fi_FI')

    def test_invalid_iterable_in_localetuple(self):
        # CPython TestMiscellaneous, with LC_TIME in place of LC_ALL.
        self.assertRaises(TypeError, locale.setlocale, locale.LC_TIME,
                          (b'not', b'valid'))

    def test_c_locale_and_restore(self):
        self.assertEqual(locale.getlocale(locale.LC_TIME), (None, None))
        value = datetime(2024, 3, 17, 22, 44, 55)
        original = value.strftime('%A %B %c %x %X')
        for name in ('fr_FR.UTF-8', 'de-DE'):
            locale.setlocale(locale.LC_TIME, name)
            self.assertEqual(locale.setlocale(locale.LC_TIME, (None, None)), 'C')
            self.assertEqual(value.strftime('%A %B %c %x %X'), original)
        self.assertEqual(locale.setlocale(locale.LC_TIME, 'POSIX'), 'C')

    def test_locale_name_forms(self):
        expected = datetime(2024, 3, 17).strftime('%Y-%m-%d')
        for name in ('fr_FR.UTF-8', 'fr_FR', 'fr-FR', ('fr_FR', 'UTF-8')):
            self.assertEqual(locale.setlocale(locale.LC_TIME, name), 'fr_FR.UTF-8')
            self.assertEqual(locale.getlocale(locale.LC_TIME), ('fr_FR', 'UTF-8'))
            self.assertEqual(datetime(2024, 3, 17).strftime('%Y-%m-%d'), expected)

    def test_default_locale(self):
        selected = locale.setlocale(locale.LC_TIME, '')
        self.assertTrue(selected)
        self.assertEqual(locale.setlocale(locale.LC_TIME, None), selected)
        locale.setlocale(locale.LC_TIME, locale.getlocale(locale.LC_TIME))
        self.assertEqual(locale.setlocale(locale.LC_TIME), selected)

    def test_bad_locale_preserves_state(self):
        old = locale.setlocale(locale.LC_TIME, 'de_DE')
        for name in ('invalid_locale', 'xx_XX', 'fr_FR.UTF-8@modifier'):
            self.assertRaises(locale.Error, locale.setlocale, locale.LC_TIME, name)
            self.assertEqual(locale.setlocale(locale.LC_TIME), old)

    def test_localized_datetime(self):
        value = datetime(2024, 3, 17, 22, 44, 55, 123456,
                         timezone(timedelta(hours=5, minutes=30)))
        numeric = value.strftime('%Y-%m-%d %H:%M:%S.%f %z %Z %%')
        for name, words in (('fr_FR', 'dimanche mars'),
                            ('de_DE', 'Sonntag März')):
            locale.setlocale(locale.LC_TIME, name)
            self.assertEqual(value.strftime('%A %B'), words)
            self.assertEqual(value.strftime('%Y-%m-%d %H:%M:%S.%f %z %Z %%'), numeric)
            formatted = value.strftime('%A %d %B %Y %H:%M:%S.%f %z')
            self.assertEqual(datetime.strptime(formatted, '%A %d %B %Y %H:%M:%S.%f %z'), value)

    def test_calendar_locale_is_temporary(self):
        locale.setlocale(locale.LC_TIME, 'fr_FR')
        for cal in (calendar.LocaleTextCalendar(locale='de_DE'),
                    calendar.LocaleHTMLCalendar(locale='de-DE')):
            self.assertIn('März', cal.formatmonthname(2024, 3, 20))
            self.assertEqual(locale.getlocale(locale.LC_TIME), ('fr_FR', 'UTF-8'))
            self.assertEqual(calendar.month_name[3], 'mars')
        cal = calendar.LocaleTextCalendar(locale='xx_XX')
        self.assertRaises(locale.Error, cal.formatmonthname, 2024, 3, 20)
        self.assertEqual(locale.getlocale(locale.LC_TIME), ('fr_FR', 'UTF-8'))


class LocaleCalendarTests(unittest.TestCase):
    def setUp(self):
        self.oldlocale = locale.setlocale(locale.LC_TIME)

    def tearDown(self):
        locale.setlocale(locale.LC_TIME, self.oldlocale)

    # Methods below are copied from CPython Lib/test/test_calendar.py.
    def test_locale_text_calendar(self):
        try:
            cal = calendar.LocaleTextCalendar(locale='')
            local_weekday = cal.formatweekday(1, 10)
            local_weekday_abbr = cal.formatweekday(1, 3)
            local_month = cal.formatmonthname(2010, 10, 10)
        except locale.Error:
            # cannot set the system default locale -- skip rest of test
            raise unittest.SkipTest('cannot set the system default locale')
        self.assertIsInstance(local_weekday, str)
        self.assertIsInstance(local_weekday_abbr, str)
        self.assertIsInstance(local_month, str)
        self.assertEqual(len(local_weekday), 10)
        self.assertEqual(len(local_weekday_abbr), 3)
        self.assertGreaterEqual(len(local_month), 10)

        cal = calendar.LocaleTextCalendar(locale=None)
        local_weekday = cal.formatweekday(1, 10)
        local_weekday_abbr = cal.formatweekday(1, 3)
        local_month = cal.formatmonthname(2010, 10, 10)
        self.assertIsInstance(local_weekday, str)
        self.assertIsInstance(local_weekday_abbr, str)
        self.assertIsInstance(local_month, str)
        self.assertEqual(len(local_weekday), 10)
        self.assertEqual(len(local_weekday_abbr), 3)
        self.assertGreaterEqual(len(local_month), 10)

        cal = calendar.LocaleTextCalendar(locale='C')
        local_weekday = cal.formatweekday(1, 10)
        local_weekday_abbr = cal.formatweekday(1, 3)
        local_month = cal.formatmonthname(2010, 10, 10)
        self.assertIsInstance(local_weekday, str)
        self.assertIsInstance(local_weekday_abbr, str)
        self.assertIsInstance(local_month, str)
        self.assertEqual(len(local_weekday), 10)
        self.assertEqual(len(local_weekday_abbr), 3)
        self.assertGreaterEqual(len(local_month), 10)

    def test_locale_html_calendar(self):
        try:
            cal = calendar.LocaleHTMLCalendar(locale='')
            local_weekday = cal.formatweekday(1)
            local_month = cal.formatmonthname(2010, 10)
        except locale.Error:
            # cannot set the system default locale -- skip rest of test
            raise unittest.SkipTest('cannot set the system default locale')
        self.assertIsInstance(local_weekday, str)
        self.assertIsInstance(local_month, str)

        cal = calendar.LocaleHTMLCalendar(locale=None)
        local_weekday = cal.formatweekday(1)
        local_month = cal.formatmonthname(2010, 10)
        self.assertIsInstance(local_weekday, str)
        self.assertIsInstance(local_month, str)

        cal = calendar.LocaleHTMLCalendar(locale='C')
        local_weekday = cal.formatweekday(1)
        local_month = cal.formatmonthname(2010, 10)
        self.assertIsInstance(local_weekday, str)
        self.assertIsInstance(local_month, str)

    def test_locale_calendars_reset_locale_properly(self):
        # ensure that Locale{Text,HTML}Calendar resets the locale properly
        # (it is still not thread-safe though)
        old_october = calendar.TextCalendar().formatmonthname(2010, 10, 10)
        try:
            cal = calendar.LocaleTextCalendar(locale='')
            local_weekday = cal.formatweekday(1, 10)
            local_weekday_abbr = cal.formatweekday(1, 3)
            local_month = cal.formatmonthname(2010, 10, 10)
        except locale.Error:
            # cannot set the system default locale -- skip rest of test
            raise unittest.SkipTest('cannot set the system default locale')
        self.assertIsInstance(local_weekday, str)
        self.assertIsInstance(local_weekday_abbr, str)
        self.assertIsInstance(local_month, str)
        self.assertEqual(len(local_weekday), 10)
        self.assertEqual(len(local_weekday_abbr), 3)
        self.assertGreaterEqual(len(local_month), 10)

        cal = calendar.LocaleHTMLCalendar(locale='')
        local_weekday = cal.formatweekday(1)
        local_month = cal.formatmonthname(2010, 10)
        self.assertIsInstance(local_weekday, str)
        self.assertIsInstance(local_month, str)

        new_october = calendar.TextCalendar().formatmonthname(2010, 10, 10)
        self.assertEqual(old_october, new_october)

    def test_locale_calendar_formatweekday(self):
        try:
            # formatweekday uses different day names based on the available width.
            cal = calendar.LocaleTextCalendar(locale='en_US')
            # For really short widths, the abbreviated name is truncated.
            self.assertEqual(cal.formatweekday(0, 1), "M")
            self.assertEqual(cal.formatweekday(0, 2), "Mo")
            # For short widths, a centered, abbreviated name is used.
            self.assertEqual(cal.formatweekday(0, 3), "Mon")
            self.assertEqual(cal.formatweekday(0, 5), " Mon ")
            self.assertEqual(cal.formatweekday(0, 8), "  Mon   ")
            # For long widths, the full day name is used.
            self.assertEqual(cal.formatweekday(0, 9), "  Monday ")
            self.assertEqual(cal.formatweekday(0, 10), "  Monday  ")
        except locale.Error:
            raise unittest.SkipTest('cannot set the en_US locale')

    def test_locale_calendar_formatmonthname(self):
        try:
            # formatmonthname uses the same month names regardless of the width argument.
            cal = calendar.LocaleTextCalendar(locale='en_US')
            # For too short widths, a full name (with year) is used.
            self.assertEqual(cal.formatmonthname(2022, 6, 2, withyear=False), "June")
            self.assertEqual(cal.formatmonthname(2022, 6, 2, withyear=True), "June 2022")
            self.assertEqual(cal.formatmonthname(2022, 6, 3, withyear=False), "June")
            self.assertEqual(cal.formatmonthname(2022, 6, 3, withyear=True), "June 2022")
            # For long widths, a centered name is used.
            self.assertEqual(cal.formatmonthname(2022, 6, 10, withyear=False), "   June   ")
            self.assertEqual(cal.formatmonthname(2022, 6, 15, withyear=True), "   June 2022   ")
        except locale.Error:
            raise unittest.SkipTest('cannot set the en_US locale')

    def test_locale_html_calendar_custom_css_class_month_name(self):
        try:
            cal = calendar.LocaleHTMLCalendar(locale='')
            local_month = cal.formatmonthname(2010, 10, 10)
        except locale.Error:
            # cannot set the system default locale -- skip rest of test
            raise unittest.SkipTest('cannot set the system default locale')
        self.assertIn('class="month"', local_month)
        cal.cssclass_month_head = "text-center month"
        local_month = cal.formatmonthname(2010, 10, 10)
        self.assertIn('class="text-center month"', local_month)

    def test_locale_html_calendar_custom_css_class_weekday(self):
        try:
            cal = calendar.LocaleHTMLCalendar(locale='')
            local_weekday = cal.formatweekday(6)
        except locale.Error:
            # cannot set the system default locale -- skip rest of test
            raise unittest.SkipTest('cannot set the system default locale')
        self.assertIn('class="sun"', local_weekday)
        cal.cssclasses_weekday_head = ["mon2", "tue2", "wed2", "thu2", "fri2", "sat2", "sun2"]
        local_weekday = cal.formatweekday(6)
        self.assertIn('class="sun2"', local_weekday)


if __name__ == '__main__':
    unittest.main()
