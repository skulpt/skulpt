import sys
import unittest


class SysTests(unittest.TestCase):
    def test_implementation(self):
        # From CPython Lib/test/test_sys.py, test_implementation.
        # This test applies to all implementations equally.

        levels = {"alpha": 0xA, "beta": 0xB, "candidate": 0xC, "final": 0xF}

        self.assertTrue(hasattr(sys.implementation, "name"))
        self.assertTrue(hasattr(sys.implementation, "version"))
        self.assertTrue(hasattr(sys.implementation, "hexversion"))
        self.assertTrue(hasattr(sys.implementation, "cache_tag"))

        version = sys.implementation.version
        self.assertEqual(version[:2], (version.major, version.minor))

        hexversion = (version.major << 24 | version.minor << 16 |
                      version.micro << 8 | levels[version.releaselevel] << 4 |
                      version.serial << 0)
        self.assertEqual(sys.implementation.hexversion, hexversion)

        # PEP 421 requires that .name be lower case.
        self.assertEqual(sys.implementation.name,
                         sys.implementation.name.lower())


if __name__ == "__main__":
    unittest.main()
