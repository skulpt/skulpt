"""Supporting definitions for the Python regression tests."""

if __name__ != 'test.test_support':
    raise ImportError('test_support must be imported from the test package')

import unittest


# def run_unittest(*classes):
#     """Run tests from unittest.TestCase-derived classes."""
#     valid_types = (unittest.TestSuite, unittest.TestCase)
#     suite = unittest.TestSuite()
#     for cls in classes:
#         if isinstance(cls, str):
#             if cls in sys.modules:
#                 suite.addTest(unittest.findTestCases(sys.modules[cls]))
#             else:
#                 raise ValueError("str arguments must be keys in sys.modules")
#         elif isinstance(cls, valid_types):
#             suite.addTest(cls)
#         else:
#             suite.addTest(unittest.makeSuite(cls))
#     _run_suite(suite)

def run_unittest(*classes):
    """Run tests from unittest.TestCase-derived classes."""
    for cls in classes:
        print cls
        if issubclass(cls, unittest.TestCase):
            cls().main()
        else:
            print "Don't know what to do with ", cls
