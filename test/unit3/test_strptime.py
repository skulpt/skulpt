"""PyUnit testing against strptime"""

import unittest
import time
# import locale
# import re
# import os
# import sys
# from test import support
# from test.support import skip_if_buggy_ucrt_strfptime
from datetime import date as datetime_date

import _strptime

class LocaleTime_Tests(unittest.TestCase):
    """Tests for _strptime.LocaleTime.

    All values are lower-cased when stored in LocaleTime, so make sure to
    compare values after running ``lower`` on them.

    """

    def setUp(self):
        """Create time tuple based on current time."""
        self.time_tuple = time.localtime()
        self.LT_ins = _strptime.LocaleTime()

    def compare_against_time(self, testing, directive, tuple_position,
                             error_msg):
        """Helper method that tests testing against directive based on the
        tuple_position of time_tuple.  Uses error_msg as error message.

        """
        strftime_output = time.strftime(directive, self.time_tuple).lower()
        comparison = testing[self.time_tuple[tuple_position]]
        self.assertIn(strftime_output, testing,
                      "%s: not found in tuple" % error_msg)
        self.assertEqual(comparison, strftime_output,
                         "%s: position within tuple incorrect; %s != %s" %
                         (error_msg, comparison, strftime_output))

    def test_weekday(self):
        # Make sure that full and abbreviated weekday names are correct in
        # both string and position with tuple
        self.compare_against_time(self.LT_ins.f_weekday, '%A', 6,
                                  "Testing of full weekday name failed")
        self.compare_against_time(self.LT_ins.a_weekday, '%a', 6,
                                  "Testing of abbreviated weekday name failed")

    def test_month(self):
        # Test full and abbreviated month names; both string and position
        # within the tuple
        self.compare_against_time(self.LT_ins.f_month, '%B', 1,
                                  "Testing against full month name failed")
        self.compare_against_time(self.LT_ins.a_month, '%b', 1,
                                  "Testing against abbreviated month name failed")

    def test_am_pm(self):
        # Make sure AM/PM representation done properly
        strftime_output = time.strftime("%p", self.time_tuple).lower()
        self.assertIn(strftime_output, self.LT_ins.am_pm,
                      "AM/PM representation not in tuple")
        if self.time_tuple[3] < 12: position = 0
        else: position = 1
        self.assertEqual(self.LT_ins.am_pm[position], strftime_output,
                         "AM/PM representation in the wrong position within the tuple")

    def test_timezone(self):
        # Make sure timezone is correct
        timezone = time.strftime("%Z", self.time_tuple).lower()
        if timezone:
            self.assertTrue(timezone in self.LT_ins.timezone[0] or
                            timezone in self.LT_ins.timezone[1],
                            "timezone %s not found in %s" %
                            (timezone, self.LT_ins.timezone))

    def test_date_time(self):
        # Check that LC_date_time, LC_date, and LC_time are correct
        # the magic date is used so as to not have issues with %c when day of
        #  the month is a single digit and has a leading space.  This is not an
        #  issue since strptime still parses it correctly.  The problem is
        #  testing these directives for correctness by comparing strftime
        #  output.
        magic_date = (1999, 3, 17, 22, 44, 55, 2, 76, 0)
        strftime_output = time.strftime("%c", magic_date)
        self.assertEqual(time.strftime(self.LT_ins.LC_date_time, magic_date),
                         strftime_output, "LC_date_time incorrect")
        strftime_output = time.strftime("%x", magic_date)
        self.assertEqual(time.strftime(self.LT_ins.LC_date, magic_date),
                         strftime_output, "LC_date incorrect")
        strftime_output = time.strftime("%X", magic_date)
        self.assertEqual(time.strftime(self.LT_ins.LC_time, magic_date),
                         strftime_output, "LC_time incorrect")
        LT = _strptime.LocaleTime()
        LT.am_pm = ('', '')
        self.assertTrue(LT.LC_time, "LocaleTime's LC directives cannot handle "
                                    "empty strings")

    def test_lang(self):
        # Make sure lang is set to what _getlang() returns
        # Assuming locale has not changed between now and when self.LT_ins was created
        self.assertEqual(self.LT_ins.lang, _strptime._getlang())
        

class StrptimeTests(unittest.TestCase):
    """Tests for _strptime.strptime."""

    def setUp(self):
        """Create testing time tuple."""
        self.time_tuple = time.gmtime()

    def test_ValueError(self):
        # Make sure ValueError is raised when match fails or format is bad
        self.assertRaises(ValueError, _strptime._strptime_time, data_string="%d",
                          format="%A")
        for bad_format in ("%", "% ", "%e"):
            try:
                _strptime._strptime_time("2005", bad_format)
            except ValueError:
                continue
            except Exception as err:
                self.fail("'%s' raised %s, not ValueError" %
                            (bad_format, err.__class__.__name__))
            else:
                self.fail("'%s' did not raise ValueError" % bad_format)

        # Ambiguous or incomplete cases using ISO year/week/weekday directives
        # 1. ISO week (%V) is specified, but the year is specified with %Y
        # instead of %G
        with self.assertRaises(ValueError):
            _strptime._strptime("1999 50", "%Y %V")
        # 2. ISO year (%G) and ISO week (%V) are specified, but weekday is not
        with self.assertRaises(ValueError):
            _strptime._strptime("1999 51", "%G %V")
        # 3. ISO year (%G) and weekday are specified, but ISO week (%V) is not
        for w in ('A', 'a', 'w', 'u'):
            with self.assertRaises(ValueError):
                _strptime._strptime("1999 51","%G %{}".format(w))
        # 4. ISO year is specified alone (e.g. time.strptime('2015', '%G'))
        with self.assertRaises(ValueError):
            _strptime._strptime("2015", "%G")
        # 5. Julian/ordinal day (%j) is specified with %G, but not %Y
        with self.assertRaises(ValueError):
            _strptime._strptime("1999 256", "%G %j")


    def test_strptime_exception_context(self):
        # check that this doesn't chain exceptions needlessly (see #17572)
        with self.assertRaises(ValueError) as e:
            _strptime._strptime_time('', '%D')
        # self.assertIs(e.exception.__suppress_context__, True)
        # additional check for IndexError branch (issue #19545)
        with self.assertRaises(ValueError) as e:
            _strptime._strptime_time('19', '%Y %')
        # self.assertIs(e.exception.__suppress_context__, True)

    def test_unconverteddata(self):
        # Check ValueError is raised when there is unconverted data
        self.assertRaises(ValueError, _strptime._strptime_time, "10 12", "%m")

    def helper(self, directive, position):
        """Helper fxn in testing."""
        strf_output = time.strftime("%" + directive, self.time_tuple)
        strp_output = _strptime._strptime_time(strf_output, "%" + directive)
        self.assertTrue(strp_output[position] == self.time_tuple[position],
                        "testing of '%s' directive failed; '%s' -> %s != %s" %
                         (directive, strf_output, strp_output[position],
                          self.time_tuple[position]))

    def test_year(self):
        # Test that the year is handled properly
        for directive in ('y', 'Y'):
            self.helper(directive, 0)
        # Must also make sure %y values are correct for bounds set by Open Group
        for century, bounds in ((1900, ('69', '99')), (2000, ('00', '68'))):
            for bound in bounds:
                strp_output = _strptime._strptime_time(bound, '%y')
                expected_result = century + int(bound)
                self.assertTrue(strp_output[0] == expected_result,
                                "'y' test failed; passed in '%s' "
                                "and returned '%s'" % (bound, strp_output[0]))

    def test_month(self):
        # Test for month directives
        for directive in ('B', 'b', 'm'):
            self.helper(directive, 1)

    def test_day(self):
        # Test for day directives
        self.helper('d', 2)

    def test_hour(self):
        # Test hour directives
        self.helper('H', 3)
        strf_output = time.strftime("%I %p", self.time_tuple)
        strp_output = _strptime._strptime_time(strf_output, "%I %p")
        self.assertTrue(strp_output[3] == self.time_tuple[3],
                        "testing of '%%I %%p' directive failed; '%s' -> %s != %s" %
                         (strf_output, strp_output[3], self.time_tuple[3]))

    def test_minute(self):
        # Test minute directives
        self.helper('M', 4)

    def test_second(self):
        # Test second directives
        self.helper('S', 5)

    def test_fraction(self):
        # Test microseconds
        import datetime
        d = datetime.datetime(2012, 12, 20, 12, 34, 56, 78987)
        tup, frac, _ = _strptime._strptime(str(d), format="%Y-%m-%d %H:%M:%S.%f")
        self.assertEqual(frac, d.microsecond)

    def test_weekday(self):
        # Test weekday directives
        for directive in ('A', 'a', 'w', 'u'):
            self.helper(directive,6)

    def test_julian(self):
        # Test julian directives
        self.helper('j', 7)

    def test_offset(self):
        one_hour = 60 * 60
        half_hour = 30 * 60
        half_minute = 30
        (*_, offset), _, offset_fraction = _strptime._strptime("+0130", "%z")
        self.assertEqual(offset, one_hour + half_hour)
        self.assertEqual(offset_fraction, 0)
        (*_, offset), _, offset_fraction = _strptime._strptime("-0100", "%z")
        self.assertEqual(offset, -one_hour)
        self.assertEqual(offset_fraction, 0)
        (*_, offset), _, offset_fraction = _strptime._strptime("-013030", "%z")
        self.assertEqual(offset, -(one_hour + half_hour + half_minute))
        self.assertEqual(offset_fraction, 0)
        (*_, offset), _, offset_fraction = _strptime._strptime("-013030.000001", "%z")
        self.assertEqual(offset, -(one_hour + half_hour + half_minute))
        self.assertEqual(offset_fraction, -1)
        (*_, offset), _, offset_fraction = _strptime._strptime("+01:00", "%z")
        self.assertEqual(offset, one_hour)
        self.assertEqual(offset_fraction, 0)
        (*_, offset), _, offset_fraction = _strptime._strptime("-01:30", "%z")
        self.assertEqual(offset, -(one_hour + half_hour))
        self.assertEqual(offset_fraction, 0)
        (*_, offset), _, offset_fraction = _strptime._strptime("-01:30:30", "%z")
        self.assertEqual(offset, -(one_hour + half_hour + half_minute))
        self.assertEqual(offset_fraction, 0)
        (*_, offset), _, offset_fraction = _strptime._strptime("-01:30:30.000001", "%z")
        self.assertEqual(offset, -(one_hour + half_hour + half_minute))
        self.assertEqual(offset_fraction, -1)
        (*_, offset), _, offset_fraction = _strptime._strptime("+01:30:30.001", "%z")
        self.assertEqual(offset, one_hour + half_hour + half_minute)
        self.assertEqual(offset_fraction, 1000)
        (*_, offset), _, offset_fraction = _strptime._strptime("Z", "%z")
        self.assertEqual(offset, 0)
        self.assertEqual(offset_fraction, 0)

    def test_bad_offset(self):
        with self.assertRaises(ValueError):
            _strptime._strptime("-01:30:30.", "%z")
        with self.assertRaises(ValueError):
            _strptime._strptime("-0130:30", "%z")
        with self.assertRaises(ValueError):
            _strptime._strptime("-01:30:30.1234567", "%z")
        with self.assertRaises(ValueError):
            _strptime._strptime("-01:30:30:123456", "%z")
        with self.assertRaises(ValueError) as err:
            _strptime._strptime("-01:3030", "%z")
        self.assertEqual("Inconsistent use of : in -01:3030", str(err.exception))

    # @skip_if_buggy_ucrt_strfptime
    def test_timezone(self):
        # Test timezone directives.
        # When gmtime() is used with %Z, entire result of strftime() is empty.
        # Check for equal timezone names deals with bad locale info when this
        # occurs; first found in FreeBSD 4.4.
        strp_output = _strptime._strptime_time("UTC", "%Z")
        self.assertEqual(strp_output.tm_isdst, 0)
        strp_output = _strptime._strptime_time("GMT", "%Z")
        self.assertEqual(strp_output.tm_isdst, 0)
        time_tuple = time.localtime()
        strf_output = time.strftime("%Z")  #UTC does not have a timezone
        strp_output = _strptime._strptime_time(strf_output, "%Z")
        locale_time = _strptime.LocaleTime()
        if time.tzname[0] != time.tzname[1] or not time.daylight:
            self.assertTrue(strp_output[8] == time_tuple[8],
                            "timezone check failed; '%s' -> %s != %s" %
                             (strf_output, strp_output[8], time_tuple[8]))
        else:
            self.assertTrue(strp_output[8] == -1,
                            "LocaleTime().timezone has duplicate values and "
                             "time.daylight but timezone value not set to -1")

    # def test_bad_timezone(self):
    #     # Explicitly test possibility of bad timezone;
    #     # when time.tzname[0] == time.tzname[1] and time.daylight
    #     tz_name = time.tzname[0]
    #     if tz_name.upper() in ("UTC", "GMT"):
    #         self.skipTest('need non-UTC/GMT timezone')

    #     with support.swap_attr(time, 'tzname', (tz_name, tz_name)), \
    #          support.swap_attr(time, 'daylight', 1), \
    #          support.swap_attr(time, 'tzset', lambda: None):
    #         time.tzname = (tz_name, tz_name)
    #         time.daylight = 1
    #         tz_value = _strptime._strptime_time(tz_name, "%Z")[8]
    #         self.assertEqual(tz_value, -1,
    #                 "%s lead to a timezone value of %s instead of -1 when "
    #                 "time.daylight set to %s and passing in %s" %
    #                 (time.tzname, tz_value, time.daylight, tz_name))

    def test_date_time(self):
        # Test %c directive
        for position in range(6):
            self.helper('c', position)

    def test_date(self):
        # Test %x directive
        for position in range(0,3):
            self.helper('x', position)

    def test_time(self):
        # Test %X directive
        for position in range(3,6):
            self.helper('X', position)

    def test_percent(self):
        # Make sure % signs are handled properly
        strf_output = time.strftime("%m %% %Y", self.time_tuple)
        strp_output = _strptime._strptime_time(strf_output, "%m %% %Y")
        self.assertTrue(strp_output[0] == self.time_tuple[0] and
                         strp_output[1] == self.time_tuple[1],
                        "handling of percent sign failed")

    def test_caseinsensitive(self):
        # Should handle names case-insensitively.
        strf_output = time.strftime("%B", self.time_tuple)
        self.assertTrue(_strptime._strptime_time(strf_output.upper(), "%B"),
                        "strptime does not handle ALL-CAPS names properly")
        self.assertTrue(_strptime._strptime_time(strf_output.lower(), "%B"),
                        "strptime does not handle lowercase names properly")
        self.assertTrue(_strptime._strptime_time(strf_output.capitalize(), "%B"),
                        "strptime does not handle capword names properly")

    def test_defaults(self):
        # Default return value should be (1900, 1, 1, 0, 0, 0, 0, 1, 0)
        defaults = (1900, 1, 1, 0, 0, 0, 0, 1, -1)
        strp_output = _strptime._strptime_time('1', '%m')
        self.assertTrue(strp_output == defaults,
                        "Default values for strptime() are incorrect;"
                        " %s != %s" % (strp_output, defaults))

    def test_escaping(self):
        # Make sure all characters that have regex significance are escaped.
        # Parentheses are in a purposeful order; will cause an error of
        # unbalanced parentheses when the regex is compiled if they are not
        # escaped.
        # Test instigated by bug #796149 .
        need_escaping = r".^$*+?{}\[]|)("
        self.assertTrue(_strptime._strptime_time(need_escaping, need_escaping))

    def test_feb29_on_leap_year_without_year(self):
        time.strptime("Feb 29", "%b %d")

    def test_mar1_comes_after_feb29_even_when_omitting_the_year(self):
        self.assertLess(
                time.strptime("Feb 29", "%b %d"),
                time.strptime("Mar 1", "%b %d"))


class JulianTests(unittest.TestCase):
    """Test a _strptime regression that all julian (1-366) are accepted"""

    def test_all_julian_days(self):
        eq = self.assertEqual
        for i in range(1, 367):
            # use 2004, since it is a leap year, we have 366 days
            eq(_strptime._strptime_time('%d 2004' % i, '%j %Y')[7], i)

class CalculationTests(unittest.TestCase):
    """Test that strptime() fills in missing info correctly"""

    def setUp(self):
        self.time_tuple = time.gmtime()

    # @skip_if_buggy_ucrt_strfptime
    def test_julian_calculation(self):
        # Make sure that when Julian is missing that it is calculated
        format_string = "%Y %m %d %H %M %S %w %Z"
        result = _strptime._strptime_time(time.strftime(format_string, self.time_tuple),
                                    format_string)
        self.assertTrue(result.tm_yday == self.time_tuple.tm_yday,
                        "Calculation of tm_yday failed; %s != %s" %
                         (result.tm_yday, self.time_tuple.tm_yday))

    # @skip_if_buggy_ucrt_strfptime
    def test_gregorian_calculation(self):
        # Test that Gregorian date can be calculated from Julian day
        format_string = "%Y %H %M %S %w %j %Z"
        result = _strptime._strptime_time(time.strftime(format_string, self.time_tuple),
                                    format_string)
        self.assertTrue(result.tm_year == self.time_tuple.tm_year and
                         result.tm_mon == self.time_tuple.tm_mon and
                         result.tm_mday == self.time_tuple.tm_mday,
                        "Calculation of Gregorian date failed; "
                         "%s-%s-%s != %s-%s-%s" %
                         (result.tm_year, result.tm_mon, result.tm_mday,
                          self.time_tuple.tm_year, self.time_tuple.tm_mon,
                          self.time_tuple.tm_mday))

    # @skip_if_buggy_ucrt_strfptime
    def test_day_of_week_calculation(self):
        # Test that the day of the week is calculated as needed
        format_string = "%Y %m %d %H %S %j %Z"
        result = _strptime._strptime_time(time.strftime(format_string, self.time_tuple),
                                    format_string)
        self.assertTrue(result.tm_wday == self.time_tuple.tm_wday,
                        "Calculation of day of the week failed; "
                         "%s != %s" % (result.tm_wday, self.time_tuple.tm_wday))

    # if support.is_android:
    #     # Issue #26929: strftime() on Android incorrectly formats %V or %G for
    #     # the last or the first incomplete week in a year.
    #     _ymd_excluded = ((1905, 1, 1), (1906, 12, 31), (2008, 12, 29),
    #                     (1917, 12, 31))
    _formats_excluded = ('%G %V',)
    # else:
    # _ymd_excluded = ()
    # _formats_excluded = ()

    # @unittest.skipIf(sys.platform.startswith('aix'),
    #                  'bpo-29972: broken test on AIX')
    def test_week_of_year_and_day_of_week_calculation(self):
        # Should be able to infer date if given year, week of year (%U or %W)
        # and day of the week
        def test_helper(ymd_tuple, test_reason):
            for year_week_format in ('%Y %W', '%Y %U', '%G %V'):
                if (year_week_format in self._formats_excluded):
                #  and ymd_tuple in self._ymd_excluded):
                    return
                for weekday_format in ('%w', '%u', '%a', '%A'):
                    format_string = year_week_format + ' ' + weekday_format
                    # with self.subTest(test_reason,
                    #                   date=ymd_tuple,
                    #                   format=format_string):
                    dt_date = datetime_date(*ymd_tuple)
                    strp_input = dt_date.strftime(format_string)
                    strp_output = _strptime._strptime_time(strp_input,
                                                            format_string)
                    msg = "%r: %s != %s" % (strp_input,
                                            strp_output[7],
                                            dt_date.timetuple()[7])
                    self.assertEqual(strp_output[:3], ymd_tuple, msg)
        test_helper((1901, 1, 3), "week 0")
        test_helper((1901, 1, 8), "common case")
        test_helper((1901, 1, 13), "day on Sunday")
        test_helper((1901, 1, 14), "day on Monday")
        test_helper((1905, 1, 1), "Jan 1 on Sunday")
        test_helper((1906, 1, 1), "Jan 1 on Monday")
        test_helper((1906, 1, 7), "first Sunday in a year starting on Monday")
        test_helper((1905, 12, 31), "Dec 31 on Sunday")
        test_helper((1906, 12, 31), "Dec 31 on Monday")
        test_helper((2008, 12, 29), "Monday in the last week of the year")
        test_helper((2008, 12, 22), "Monday in the second-to-last week of the "
                                    "year")
        test_helper((1978, 10, 23), "randomly chosen date")
        test_helper((2004, 12, 18), "randomly chosen date")
        test_helper((1978, 10, 23), "year starting and ending on Monday while "
                                        "date not on Sunday or Monday")
        test_helper((1917, 12, 17), "year starting and ending on Monday with "
                                        "a Monday not at the beginning or end "
                                        "of the year")
        test_helper((1917, 12, 31), "Dec 31 on Monday with year starting and "
                                        "ending on Monday")
        test_helper((2007, 1, 7), "First Sunday of 2007")
        test_helper((2007, 1, 14), "Second Sunday of 2007")
        test_helper((2006, 12, 31), "Last Sunday of 2006")
        test_helper((2006, 12, 24), "Second to last Sunday of 2006")

    def test_week_0(self):
        def check(value, format, *expected):
            self.assertEqual(_strptime._strptime_time(value, format)[:-1], expected)
        check('2015 0 0', '%Y %U %w', 2014, 12, 28, 0, 0, 0, 6, 362)
        check('2015 0 0', '%Y %W %w', 2015, 1, 4, 0, 0, 0, 6, 4)
        check('2015 1 1', '%G %V %u', 2014, 12, 29, 0, 0, 0, 0, 363)
        check('2015 0 1', '%Y %U %w', 2014, 12, 29, 0, 0, 0, 0, 363)
        check('2015 0 1', '%Y %W %w', 2014, 12, 29, 0, 0, 0, 0, 363)
        check('2015 1 2', '%G %V %u', 2014, 12, 30, 0, 0, 0, 1, 364)
        check('2015 0 2', '%Y %U %w', 2014, 12, 30, 0, 0, 0, 1, 364)
        check('2015 0 2', '%Y %W %w', 2014, 12, 30, 0, 0, 0, 1, 364)
        check('2015 1 3', '%G %V %u', 2014, 12, 31, 0, 0, 0, 2, 365)
        check('2015 0 3', '%Y %U %w', 2014, 12, 31, 0, 0, 0, 2, 365)
        check('2015 0 3', '%Y %W %w', 2014, 12, 31, 0, 0, 0, 2, 365)
        check('2015 1 4', '%G %V %u', 2015, 1, 1, 0, 0, 0, 3, 1)
        check('2015 0 4', '%Y %U %w', 2015, 1, 1, 0, 0, 0, 3, 1)
        check('2015 0 4', '%Y %W %w', 2015, 1, 1, 0, 0, 0, 3, 1)
        check('2015 1 5', '%G %V %u', 2015, 1, 2, 0, 0, 0, 4, 2)
        check('2015 0 5', '%Y %U %w', 2015, 1, 2, 0, 0, 0, 4, 2)
        check('2015 0 5', '%Y %W %w', 2015, 1, 2, 0, 0, 0, 4, 2)
        check('2015 1 6', '%G %V %u', 2015, 1, 3, 0, 0, 0, 5, 3)
        check('2015 0 6', '%Y %U %w', 2015, 1, 3, 0, 0, 0, 5, 3)
        check('2015 0 6', '%Y %W %w', 2015, 1, 3, 0, 0, 0, 5, 3)
        check('2015 1 7', '%G %V %u', 2015, 1, 4, 0, 0, 0, 6, 4)

        check('2009 0 0', '%Y %U %w', 2008, 12, 28, 0, 0, 0, 6, 363)
        check('2009 0 0', '%Y %W %w', 2009, 1, 4, 0, 0, 0, 6, 4)
        check('2009 1 1', '%G %V %u', 2008, 12, 29, 0, 0, 0, 0, 364)
        check('2009 0 1', '%Y %U %w', 2008, 12, 29, 0, 0, 0, 0, 364)
        check('2009 0 1', '%Y %W %w', 2008, 12, 29, 0, 0, 0, 0, 364)
        check('2009 1 2', '%G %V %u', 2008, 12, 30, 0, 0, 0, 1, 365)
        check('2009 0 2', '%Y %U %w', 2008, 12, 30, 0, 0, 0, 1, 365)
        check('2009 0 2', '%Y %W %w', 2008, 12, 30, 0, 0, 0, 1, 365)
        check('2009 1 3', '%G %V %u', 2008, 12, 31, 0, 0, 0, 2, 366)
        check('2009 0 3', '%Y %U %w', 2008, 12, 31, 0, 0, 0, 2, 366)
        check('2009 0 3', '%Y %W %w', 2008, 12, 31, 0, 0, 0, 2, 366)
        check('2009 1 4', '%G %V %u', 2009, 1, 1, 0, 0, 0, 3, 1)
        check('2009 0 4', '%Y %U %w', 2009, 1, 1, 0, 0, 0, 3, 1)
        check('2009 0 4', '%Y %W %w', 2009, 1, 1, 0, 0, 0, 3, 1)
        check('2009 1 5', '%G %V %u', 2009, 1, 2, 0, 0, 0, 4, 2)
        check('2009 0 5', '%Y %U %w', 2009, 1, 2, 0, 0, 0, 4, 2)
        check('2009 0 5', '%Y %W %w', 2009, 1, 2, 0, 0, 0, 4, 2)
        check('2009 1 6', '%G %V %u', 2009, 1, 3, 0, 0, 0, 5, 3)
        check('2009 0 6', '%Y %U %w', 2009, 1, 3, 0, 0, 0, 5, 3)
        check('2009 0 6', '%Y %W %w', 2009, 1, 3, 0, 0, 0, 5, 3)
        check('2009 1 7', '%G %V %u', 2009, 1, 4, 0, 0, 0, 6, 4)



if __name__ == '__main__':
    unittest.main()