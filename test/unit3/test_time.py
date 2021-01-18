__author__ = 'Jacco Kulman'

import unittest
import re
import time

class TimeTestCase(unittest.TestCase):
    def setUp(self):
        self.t = time.time()
        
    def test_data_attributes(self):
        time.altzone
        time.daylight
        time.timezone
        time.tzname

    def test_conversions(self):
        self.assertTrue(time.ctime(self.t)
                     == time.asctime(time.localtime(self.t)))
        self.assertTrue(int(time.mktime(time.localtime(self.t)))
                     == int(self.t))
        # changed long to int

    def test_sleep(self):
        time.sleep(0.01)

        class A(object):
                def __getattr__(self, name):
                        time.sleep(0.001)
                        return name

                def __setattr__(self, name, value):
                        time.sleep(0.001)
                        object.__setattr__(self, name, value)

        class B(A):
                pass


        class C(A):
                def __getattribute__(self, name):
                        time.sleep(0.001)
                        return "FOO"
        b = B()
        self.assertEqual(b.x, "x")
        b.x = "BAR"
        self.assertEqual(b.x, "BAR")
        c = C()
        c.x = "BAR"
        self.assertEqual(c.x, "FOO")

        class A(object):
          def __init__(self):
            object.__setattr__(self, "x", 42)

          def __getattr__(self, attr):
            if attr == "y":
              return 41
            else:
              return 43

        a = A()
        self.assertEqual(str(a.x), "42")
        self.assertEqual(str(a.y), "41")
        self.assertEqual(str(a.z), "43")
        # Should not touch __getattr__ or __setattr__ at all
        A.foo = "bar"

        class B(object):
          def __getattr__(self, attr):
            time.sleep(0.01)
            return object.__getattr__(self, attr)
          
          def __setattr__(self, attr, value):
            time.sleep(0.01)
            return object.__setattr__(self, attr, value)

        b = B()
        b.x = 42
        self.assertEqual(str(b.x), "42")
        b.x += 1
        self.assertEqual(str(b.x), "43")

        class GeneratorClass:
            def __init__(self):
                pass
            def generator(self):
                for i in range(10):
                    yield i
            def sleeping_generator(self):
                for i in range(10):
                    time.sleep(0.01)
                    yield i

        gen = GeneratorClass()

        self.assertEqual(list(gen.generator()), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        self.assertEqual(list(gen.sleeping_generator()), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
        self.assertEqual([x*2 for x in gen.generator()], [0, 2, 4, 6, 8, 10, 12, 14, 16, 18])
        self.assertEqual([x*2 for x in gen.sleeping_generator()], [0, 2, 4, 6, 8, 10, 12, 14, 16, 18])

    def test_strftime(self):
        # Skulpt computes the timezone offset in 2002, so use a date
        # in that year.  The following number was computed by running
        #
        #     import datetime
        #     print((datetime.date(2002, 2, 3) - datetime.date(1970, 1, 1)).days)
        #
        # in CPython.
        #
        days_to_20020203 = 11721
        seconds_within_day = 3661  # One hour + one minute + one second
        timestamp_to_test = (
            days_to_20020203 * 24 * 60 * 60  # Unix timestamps ignore leap seconds
            + seconds_within_day
            + time.timezone
        )
        self.assertEqual(
            time.strftime("%b %d %Y %H:%M:%S", time.localtime(timestamp_to_test)),
            "Feb 03 2002 01:01:01"
        );

    def test_strftime_format_arg_only(self):
        year_str = time.strftime("%Y")
        self.assertEqual(year_str[:2], "20")

    def _test_dir(self):
        # this test fails because the compare 
        self.assertEqual(dir(time), [
            '__file__'
            '__name__', 
            '__package__', 
            'accept2dyear', 
            'altzone', 
            'asctime', 
            'clock', 
            'ctime', 
            'daylight', 
            'gmtime', 
            'localtime', 
            'mktime', 
            'sleep', 
            'strftime', 
            'strptime', 
            'struct_time', 
            'time', 
            'timezone', 
            'tzname', 
            'tzset']);


class BadTimeFunctionArgsLength(unittest.TestCase):
    def setUp(self):
        self.t = 1606419201
        self.t_struct = time.gmtime(self.t)

    def assertFailsArgsLengthCheck(self, regex, fun, *args):
        # TODO: assertRaisesRegex() would be useful here.
        with self.assertRaises(TypeError) as raise_context:
            fun(*args)
        if raise_context.exception is not None:
            exception_msg = str(raise_context.exception)
            if not re.search(regex, exception_msg):
                self.fail(f"exception matching '{regex}' not raised:"
                          f" '{exception_msg}'")

    def test_asctime(self):
        # asctime([t])
        self.assertFailsArgsLengthCheck(
            "at most 1 argument",
            time.asctime, self.t_struct, "arg 2")

    def test_ctime(self):
        # ctime([secs])
        self.assertFailsArgsLengthCheck(
            "at most 1 argument",
            time.ctime, self.t, "arg 2")

    def test_gmtime(self):
        # gmtime([secs])
        self.assertFailsArgsLengthCheck(
            "at most 1 argument",
            time.gmtime, self.t, "arg 2")

    def test_localtime(self):
        # localtime([secs])
        self.assertFailsArgsLengthCheck(
            "at most 1 argument",
            time.localtime, self.t, "arg 2")

    def test_mktime(self):
        # mktime(t)
        self.assertFailsArgsLengthCheck(
            "exactly 1 argument",
            time.mktime)  # no args
        self.assertFailsArgsLengthCheck(
            "exactly 1 argument",
            time.mktime, self.t_struct, "arg 2")

    def test_strftime(self):
        # strftime(format[, t])
        self.assertFailsArgsLengthCheck(
            "at least 1 argument",
            time.strftime)  # no args
        self.assertFailsArgsLengthCheck(
            "at most 2 arguments",
            time.strftime, "%Y%m%d", self.t_struct, "arg 3")

    def test_strptime(self):
        # strptime(string[, format])
        self.assertFailsArgsLengthCheck(
            "at least 1 argument",
            time.strptime)  # no args
        self.assertFailsArgsLengthCheck(
            "at most 2 arguments",
            time.strptime, "2020-11-26", "%Y-%m-%d", "arg 3")


if __name__ == '__main__':
    unittest.main()
