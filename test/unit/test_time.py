__author__ = 'Jacco Kulman'

import unittest
import time

class TimeTestCase(unittest.TestCase):
    def setUp(self):
        self.t = time.time()
        
    def test_data_attributes(self):
        time.altzone
        time.daylight
        time.timezone
        time.tzname

    def test_clock(self):
        time.clock()

    def test_conversions(self):
        self.assertTrue(time.ctime(self.t)
                     == time.asctime(time.localtime(self.t)))
        self.assertTrue(long(time.mktime(time.localtime(self.t)))
                     == long(self.t))        

    def test_sleep(self):
        time.sleep(0.01)

    def test_strftime(self):
        # TODO: Test timezone handling by using localtime() rather than
        # (or as well as) gmtime().
        # Although we're currently behaving the same as CPython, we don't
        # actually understand why:
        # https://github.com/skulpt/skulpt/issues/908

        self.assertEqual(time.strftime("%b %d %Y %H:%M:%S", time.gmtime(3661)), "Jan 01 1970 01:01:01");

    def test_strptime(self):
        result = time.struct_time((1970, 1, 1, 1, 1, 1, 3, 1, -1))
        self.assertEqual(time.strptime("Jan 01 1970 01:01:01", "%b %d %Y %H:%M:%S"), result);
        
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

if __name__ == '__main__':
    unittest.main()
