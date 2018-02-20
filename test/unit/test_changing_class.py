__author__ = 'Paul Prescod'

# unit test files should be named test_<your name here>.py
# this ensures they will automatically be included in the
# ./skulpt.py test or ./skulpt.py dist testing procedures
#

import unittest

class ChangingClass(unittest.TestCase):
    def setUp(self):
        # run prior to each test
        pass
        
    def tearDown(self):
        # run after each test
        pass
        
    def testClassAssignment(self):
        # tests must follow the naming convention of starting with test
        class A:
            def isa_A(self):
                pass

        class B: pass

        b = B()
        assert b.__class__ == B
        b.__class__ = A
        b.isa_A()
        assert b.__class__ ==  A

    def testClassAssignmentExceptions(self):
        class B: pass

        b = B()

        try:
            b.__class__ = lambda x: 5
        except TypeError: pass
        else:
            assert False, "This should have thrown an exception"

        try:
            b.__class__ = 5
        except TypeError: pass
        else:
            assert False, "This should have thrown an exception"

if __name__ == '__main__':
    unittest.main()
