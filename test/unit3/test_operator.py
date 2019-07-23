"""Unit Test for operator module"""
import unittest
import operator

class OperatorTests(unittest.TestCase):
    def test_compare(self):
        self.assertTrue(operator.lt(1, 2))
        self.assertFalse(operator.lt(2, 1))
        self.assertTrue(operator.le(1, 2))
        self.assertFalse(operator.le(2, 1))
        self.assertTrue(operator.le(2, 2))
        self.assertTrue(operator.eq(2, 2))
        self.assertFalse(operator.eq(3, 2))
        self.assertTrue(operator.ne(2, 3))
        self.assertFalse(operator.ne(2, 2))
        self.assertTrue(operator.ge(2, 1))
        self.assertFalse(operator.ge(1, 2))
        self.assertTrue(operator.ge(2, 2))
        self.assertTrue(operator.gt(2, 1))
        self.assertFalse(operator.gt(1, 2))

    def test_truth(self):
        self.assertTrue(operator.truth(True))
        self.assertFalse(operator.truth(False))
        self.assertTrue(operator.truth(1))
        self.assertFalse(operator.truth(0))

    def test_is_(self):
        self.assertTrue(operator.is_("hello", "hello"))
        self.assertFalse(operator.is_("hello", "goodbye"))
        self.assertTrue(operator.is_(1, 1))
        self.assertFalse(operator.is_(2, 1))

    def test_is_not(self):
        self.assertTrue(operator.is_not("hello", "goodbye"))
        self.assertFalse(operator.is_not("hello", "hello"))
        self.assertTrue(operator.is_not(1, 2))
        self.assertFalse(operator.is_not(1, 1))

    def test_abs(self):
        self.assertEqual(operator.abs(5), 5)
        self.assertEqual(operator.abs(-5), 5)
        self.assertEqual(operator.abs(1.1), 1.1)
        self.assertEqual(operator.abs(-1.1), 1.1)

    def test_add(self):
        self.assertEqual(operator.add(1, 2), 3)
        self.assertEqual(operator.add(-4, 2), -2)
        self.assertEqual(operator.add("he", "llo"), "hello")

    def test_and_(self):
        self.assertEqual(operator.and_(2, 3), 2)
        self.assertEqual(operator.and_(5, 3), 1)
        self.assertEqual(operator.and_(-4, 3), 0)

    def test_floordiv(self):
        self.assertEqual(operator.floordiv(10, 5), 2)
        self.assertEqual(operator.floordiv(5, 2), 2)
        self.assertEqual(operator.floordiv(2.2, 2),  1.0)
        self.assertEqual(operator.floordiv(-5.0, 2), -3.0)

    def test_lshift(self):
        self.assertEqual(operator.lshift(5, 2), 20)
        self.assertEqual(operator.lshift(-5, 3), -40)

    def test_mod(self):
        self.assertEqual(operator.mod(10, 5), 0)
        self.assertEqual(operator.mod(10, 3), 1)
        self.assertEqual(operator.mod(15, 4), 3)

    def test_mul(self):
        self.assertEqual(operator.mul(2, 1), 2)
        self.assertEqual(operator.mul(-2, 1), -2)
        self.assertEqual(operator.mul(2, -1), -2)
        self.assertEqual(operator.mul(10, 20), 200)

    def test_neg(self):
        self.assertEqual(operator.neg(-5), 5)
        self.assertEqual(operator.neg(5), -5)
        self.assertEqual(operator.neg(True), -1)
        self.assertEqual(operator.neg(False), 0)

    def test_or_(self):
        self.assertEqual(operator.or_(1, 2), 3)
        self.assertEqual(operator.or_(4, 3), 7)
        self.assertEqual(operator.or_(5, 2), 7)

    def test_pos(self):
        self.assertEqual(operator.pos(5), 5)
        self.assertEqual(operator.pos(-5), -5)
        self.assertEqual(operator.pos(True), 1)
        self.assertEqual(operator.pos(False), 0)

    def test_pow(self):
        self.assertEqual(operator.pow(2, 2), 4)
        self.assertEqual(operator.pow(5, 3), 125)

    def test_rshift(self):
        self.assertEqual(operator.rshift(5, 2), 1)
        self.assertEqual(operator.rshift(-5, 3), -1)

    def test_sub(self):
        self.assertEqual(operator.sub(4, 2), 2)
        self.assertEqual(operator.sub(2, 4), -2)
        self.assertEqual(operator.sub(-4, 2), -6)

    def test_xor(self):
        self.assertEqual(operator.xor(4, 2), 6)
        self.assertEqual(operator.xor(8, 5), 13)

    def test_concat(self):
        self.assertEqual(operator.concat("he", "llo"), "hello")
        self.assertEqual(operator.concat([1,2,3,4], [5,6,7]), [1, 2, 3, 4, 5, 6, 7])
        self.assertEqual(operator.concat((1,2), (3,4)), (1, 2, 3, 4))

    def test_contains(self):
        l = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9]
        s = "hello world"
        t = ("a", "b", "c")
        d = {1:1, 2:2, 3:3, 4:4, 5:5}
        self.assertTrue(operator.contains(l, 2))
        self.assertFalse(operator.contains(l, 30))
        self.assertTrue(operator.contains(s, "ll"))
        self.assertFalse(operator.contains(s, "z"))
        self.assertTrue(operator.contains(t, "a"))
        self.assertFalse(operator.contains(t, 2))
        self.assertTrue(operator.contains(d, 3))
        self.assertFalse(operator.contains(d, 0))

    def test_countOf(self):
        l = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9]
        s = "hello world"
        t = ("a", "b", "c")
        d = {1:1, 2:2, 3:3, 4:4, 5:5}
        self.assertEqual(operator.countOf(l, 9), 4)
        self.assertEqual(operator.countOf(l, 30), 0)
        self.assertEqual(operator.countOf(s, "l"), 3)
        self.assertEqual(operator.countOf(t, "a"), 1)

    def test_delitem(self):
        l = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9]
        s = "hello world"
        t = ("a", "b", "c")
        d = {1:1, 2:2, 3:3, 4:4, 5:5}
        operator.delitem(l, 9)
        self.assertEqual(l, [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9])
        operator.delitem(l, 0)
        self.assertEqual(l, [2, 3, 4, 5, 6, 7, 8, 9, 9, 9])

    def test_getitem(self):
        l = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9]
        s = "hello world"
        t = ("a", "b", "c")
        d = {1:1, 2:2, 3:3, 4:4, 5:5}
        self.assertEqual(operator.getitem(l, 2), 3)
        self.assertEqual(operator.getitem(s, 0), "h")
        self.assertEqual(operator.getitem(t, 1), "b")
        self.assertEqual(operator.getitem(d, 4), 4)

    def test_indexOf(self):
        l = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9]
        s = "hello world"
        t = ("a", "b", "c")
        d = {1:1, 2:2, 3:3, 4:4, 5:5}
        self.assertEqual(operator.indexOf(l, 5), 4)
        self.assertEqual(operator.indexOf(s, "l"), 2)
        self.assertEqual(operator.indexOf(t, "a"), 0)

    def test_setitem(self):
        l = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9]
        s = "hello world"
        t = ("a", "b", "c")
        d = {1:1, 2:2, 3:3, 4:4, 5:5}
        operator.setitem(l, 0, 10)
        self.assertEqual(l, [10, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9])
        operator.setitem(d, 1, 10)
        self.assertEqual(d, {1: 10, 2: 2, 3: 3, 4: 4, 5: 5})
        operator.setitem(d, 6, 6)
        self.assertEqual(d, {1: 10, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6})

if __name__ == '__main__':
    unittest.main()
            
