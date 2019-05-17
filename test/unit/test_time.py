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
        self.assertEqual(time.strftime("%b %d %Y %H:%M:%S", time.localtime(3661 + time.timezone)), "Jan 01 1970 01:01:01");

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
