""" Unit test for type() function """
import unittest

class TypeFunctionTest(unittest.TestCase):
    def test_int(self):
        self.assertTrue(type(1) == int)
        self.assertTrue(type(2**10) == int)
        self.assertTrue(type(2**1024) == int)
        lst2 = [1, 2, 3, 4]
        check = lst2.index(2)
        self.assertEqual(type(check), int)
        check = lst2.count(3)
        self.assertEqual(type(check), int)
        t = (1, 2, 3)
        check = t.index(2)
        self.assertEqual(type(check), int)
        check = t.count(3)
        self.assertEqual(type(check), int)
        s = "abcabcabc"
        check = s.count('a')
        self.assertEqual(type(check), int)
        check = s.find('bc')
        self.assertEqual(type(check), int)
        check = s.index('cab')
        self.assertEqual(type(check), int)
        check = s.rfind('bc')
        self.assertEqual(type(check), int)
        check = s.rindex('cab')
        self.assertEqual(type(check), int)
        self.assertEqual(type(hash(True)), int)
        self.assertEqual(type(hash(None)), int)
        self.assertEqual(type(hash("hello")), int)
        x = (1,2,3)
        self.assertEqual(type(hash(x)), int)

    def test_string(self):
        self.assertTrue((type("wee") == str))

    def test_float(self):
        self.assertEqual(type(4.5), float)
        self.assertNotEqual(type(4444), float)

    def test_classes(self):
        class X: pass
        self.assertEqual(type(X), type(type))
        x = X()
        self.assertEqual(str(type(x)), "<class '__main__.X'>")
        class Y(): pass
        self.assertEqual(type(Y), type(type))
        y = Y() # changed since y takes no arguments
        self.assertEqual(str(type(y)), "<class '__main__.Y'>")

    def test_bool(self):
        lst = [1, 2, 3]
        check = 1 in lst
        self.assertEqual(type(check), bool)
        d = {1: 2}
        check = 3 in d
        self.assertEqual(type(check), bool)
        s = set([1, 2, 3])
        check = s.isdisjoint(s)
        self.assertEqual(type(check), bool)
        s = set([1, 2, 3])
        check = s.issubset(s)
        self.assertEqual(type(check), bool)
        z = isinstance(5, int)
        self.assertEqual(type(z), bool)
        a = hasattr("hello", "not_a_method")
        self.assertEqual(type(a), bool)

    def test_nonetype(self):
        lst2 = [1, 2, 3, 4]
        lst = [1, 2, 3]
        check = lst2.reverse()
        self.assertEqual(type(check), type(None))
        check = lst2.append(8)
        self.assertEqual(type(check), type(None))
        check = lst2.insert(2, 3)
        self.assertEqual(type(check), type(None))
        check = lst2.extend(lst)
        self.assertEqual(type(check), type(None))
        check = lst2.remove(4)
        self.assertEqual(type(check), type(None))
        s = set([1, 2, 3])
        check = s.update(s)
        self.assertEqual(type(check), type(None))
        s2 = set([2, 3])
        check = s.intersection_update(s2)
        self.assertEqual(type(check), type(None))
        check = s.difference_update(s2)
        self.assertEqual(type(check), type(None))
        check = s.symmetric_difference_update(s2)
        self.assertEqual(type(check), type(None))
        check = s.add(4)
        self.assertEqual(type(check), type(None))
        check = s.discard(4)
        self.assertEqual(type(check), type(None))
        check = s.remove(3)
        self.assertEqual(type(check), type(None))
        
if __name__ == '__main__':
    unittest.main()
            
