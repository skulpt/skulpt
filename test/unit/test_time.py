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
        time.localtime(self.t)
        time.asctime(time.localtime(self.t))
        self.assertTrue(time.ctime(self.t)
                     == time.asctime(time.localtime(self.t)))
        self.assertTrue(long(time.mktime(time.localtime(self.t)))
                     == long(self.t))        

    def _test_sleep(self):
        time.sleep(1.2)

if __name__ == '__main__':
    unittest.main()