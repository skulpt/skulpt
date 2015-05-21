__author__ = 'Jacco Kulman'

import unittest
import time

class TimeTestCase(unittest.TestCase):
    def setup(self):
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

    def _test_sleep(self):
        time.sleep(1.2)

    def test_dir(self):
        self.assertEqual(dir(time), [
            '__doc__', 
            '__file__', 
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

    def test_doc(self):
        doc = time.__doc__
        attr = ['accept2dyear', 'daylight', 'timezone', 'altzone', 'tzname']
        for name in dir(time):
            if name[:2] != '__' and name not in attr:
                func = getattr(time, name)
                doc = func.__doc__
        for name in dir(time.struct_time):
            func = getattr(time.struct_time, name)
            doc = func.__doc__

if __name__ == '__main__':
    unittest.main()