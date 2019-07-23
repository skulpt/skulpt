"""Unit test for logical operators """
import unittest

class Name(unittest.TestCase):
    def test_or(self):
        self.assertFalse(False or False)
        self.assertTrue(True or False)
        self.assertTrue(False or True)
        self.assertTrue(True or True)
        a = [] or 5
        self.assertEqual(a, 5)
        b = ([x for x in range(1,10) if False] or ["hello" for x in range(1,10) if True])
        self.assertEqual(b, ['hello', 'hello', 'hello', 'hello', 'hello', 'hello', 'hello', 'hello', 'hello'])
        self.assertEqual([] or 5, 5)
        self.assertEqual({} or 5, 5)
        self.assertEqual(False or 5, 5)
        self.assertEqual(True or 5, True)
        self.assertEqual(5 or [], 5)
        self.assertEqual(5 or {}, 5)
        self.assertEqual(5 or False, 5)
        self.assertEqual(5 or True, 5)
        self.assertEqual([] or {}, {})
        self.assertEqual({} or [], [])
        self.assertEqual([] or False, False)
        self.assertEqual([] or True, True)

    def test_and(self):
        self.assertTrue(True and True)
        self.assertFalse(True and False)
        self.assertFalse(False and True)
        self.assertFalse(False and False)
        self.assertEqual([] and 5,[])
        self.assertEqual({} and 5, {})
        self.assertEqual(False and 5, False)
        self.assertEqual(True and 5, 5)
        self.assertEqual(5 and [], [])
        self.assertEqual(5 and {}, {})
        self.assertEqual(5 and False, False)
        self.assertEqual(5 and True, True)

    def test_orderofop(self):
        self.assertFalse(False and False or False)
        self.assertFalse(False or False and False)

    def test_None(self):
        self.assertFalse(None == False)
        flag = False
        if not None:
            flag = True
        if None:
            flag = False
        self.assertTrue(flag)

    def test_numbers(self):
        self.assertTrue(False == 0)
        self.assertTrue(True == 1)
        self.assertFalse(True == 2)
        self.assertEqual(~True, -2)
        self.assertEqual(~False, -1)

    def test_not(self):
        self.assertFalse(not True)
        self.assertTrue(not False)
        self.assertEqual(( not True or False ), ( (not True) or False ))
        self.assertEqual(( not False or False ), ( (not False) or False ) )
        self.assertEqual(( not True and True ),( (not True) and True ))
        self.assertEqual(( not False and True ), ( (not False) and True ))
        self.assertEqual(( not True and not False or False ), ( ( (not True) and (not False) ) or False ))

if __name__ == '__main__':
    unittest.main()
            
