"""Unit test for conditional statements"""
import unittest

class ConditionalTests(unittest.TestCase):
    def test_if(self):
        flag1 = False
        flag2 = False
        x = 1
        if x == 1:
            flag1 = True
        self.assertTrue(flag1)
        if x == 2:
            flag2 = True
        self.assertFalse(flag2)

    def test_else(self):
        flag1 = False
        flag2 = False
        if 0 == 1:
            flag1 = True
        else:
            flag2 = True
        self.assertFalse(flag1)
        self.assertTrue(flag2)

    def test_elif(self):
        flag1, flag2, flag3 = False, False, False
        if 0 == 1:
            flag1 = True
        elif 1 == 1:
            flag2 = True
        else:
            flag3 = True
        self.assertFalse(flag1)
        self.assertTrue(flag2)
        self.assertFalse(flag3)

    def test_returns(self):
        def f1():
            return "Yes" if True else "No"
        def f2():
            return "Yes" if False else "No"
        self.assertEqual(f1(), "Yes")
        self.assertEqual(f2(), "No")
        def test(self):
            def f():
                return 10
            def g():
                return 20
            retval = True
            def h():
                global retval
                retval = not retval
                return retval
            a = []
            for i in range(3):
                a.append(f() if h() else g())
            self.assertEqual(a, [20, 10, 20])

if __name__ == '__main__':
    unittest.main()
            
        
