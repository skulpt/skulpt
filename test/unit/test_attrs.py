"""Tests for attributes."""

import unittest

#import datetime

class AttributeGetter(object):
    def __getattribute__(self, attr_name):
        if attr_name == "foo":
            return 42

        try:
            return object.__getattribute__(self, attr_name)
        except AttributeError:
            if attr_name == "bar":
                return 42
            raise



class AttrTestCase(unittest.TestCase):

    def test_attr(self):
        AttrTestCase.foo = 42
        self.assertEqual(AttrTestCase.foo, 42)

    def test_cascading_getattribute(self):
        ag = AttributeGetter()
        self.assertEqual(ag.foo, 42)
        self.assertEqual(ag.bar, 42)
        self.assertRaises(AttributeError, lambda: ag.baz)
        ag.foo = 0
        ag.bar = 0
        ag.baz = 0
        self.assertEqual(ag.foo, 42)
        self.assertEqual(ag.bar, 0)
        self.assertEqual(ag.baz, 0)


AttrTestCase.x = 42

if __name__ == "__main__":
    unittest.main()
