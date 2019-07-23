""" Unit testing for imports"""
import unittest
import t221_sub
import pkga.pkgb.modc as c_me
from pkga.pkgb.modc import stuff as mystuff
from pkga.pkgb.modc import things as mythings

class ImportsTests(unittest.TestCase):
    def test_basic(self):
        self.assertEqual(t221_sub.x, 444)
        self.assertEqual(t221_sub.f("wee"), "OK: wee, 444")

        self.assertEqual(c_me.stuff, 942)
        self.assertEqual(c_me.things, "squirrel")
        self.assertEqual(mystuff, 942)
        self.assertEqual(mythings, "squirrel")

if __name__ == '__main__':
    unittest.main()
            
