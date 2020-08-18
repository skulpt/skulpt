""" Unit testing for sets (2)"""
import unittest

s = set(range(9))
s1 = set(range(5))
s2 = set(range(4,9))

class SetTests(unittest.TestCase):
    def test_basic(self):
        s = set([1, 2, 3, 4])
        self.assertEqual(set(), set([]))
        l = [1, 2, 3, 4]
        self.assertEqual(set(l), s)
        t = (1, 2, 3, 4)
        self.assertEqual(set(t), s)
        d = {1:2, 3:4}
        self.assertEqual(set(d), set([1, 3]))
        self.assertEqual(set(d.keys()), set([1, 3]))
        self.assertEqual(set(d.values()), set([2, 4]))

        self.assertEqual(len(set([])), 0)
        self.assertEqual(len(s), 4)
        self.assertEqual(len(s), 4)
        self.assertTrue(4 in s1)
        self.assertTrue(4 in s2)
        self.assertFalse(8 in s1)
        self.assertFalse(1 in s2)
        self.assertFalse(1 not in s1)
        self.assertFalse(8 not in s2)
        self.assertTrue(8 not in s1)
        self.assertTrue(1 not in s2)

    def test_union(self):
        s = set([2,3,4])
        t = set([4,5,6])
        u = set([1,2,3,4,5])
        a = s.union(t)
        b = s.union(u)
        c = t.union(s)
        d = t.union(u)
        e = u.union(s)
        f = u.union(t)
        self.assertEqual(a, c)
        self.assertEqual(a, set([2,3,4,5,6]))
        self.assertEqual(b, e)
        self.assertEqual(b, set([1,2,3,4,5]))
        self.assertEqual(d, f)
        self.assertEqual(d, set([1,2,3,4,5,6]))

        a = s.union(t, u)
        b = s.union(u, t)
        c = t.union(s, u)
        d = t.union(u, s)
        e = u.union(s, t)
        f = u.union(t, s)
        self.assertEqual(f, set([1, 2, 3, 4, 5, 6]))
        self.assertEqual(a, set([1,2,3,4,5,6]))
        self.assertEqual(a, b)
        self.assertEqual(a, c)
        self.assertEqual(a, d)
        self.assertEqual(a, e)
        self.assertEqual(a, f)

        self.assertEqual(set([]).union(s1), s1)
        self.assertEqual(s1.union(set([])), s1)
        self.assertEqual(s1.union(s2), set([0, 1, 2, 3, 4, 5, 6, 7, 8]))
        self.assertEqual(s1.union(s2,set([4,5,6])), set([0, 1, 2, 3, 4, 5, 6, 7, 8]))

    def test_symm_difference(self):
        s = set([1,2,3])
        t = set([3,4,5])
        a = s.symmetric_difference(t)
        b = t.symmetric_difference(s)
        self.assertEqual(a, set([1, 2, 4, 5]))
        self.assertEqual(a, b)
        self.assertEqual(a, set([1,2,4,5]))

        s.symmetric_difference_update(t)
        t.symmetric_difference_update(s)
        self.assertEqual(s, set([1, 2, 4, 5]))
        self.assertNotEqual(s, t)
        self.assertNotEqual(s, set([1, 2, 3]))

    def test_intersection(self):
        s = set([2,3,4])
        t = set([3,4,5])
        u = set([1,3,5])
        a = s.intersection(t)
        b = u.intersection(s)
        c = u.intersection(t)
        self.assertEqual(a, set([3, 4]))
        self.assertEqual(b, set([3]))
        self.assertEqual(c, set([3, 5]))
        d = s.intersection(t, u)
        self.assertEqual(d, set([3]))

        s.intersection_update(t)
        u.intersection_update(t)
        self.assertEqual(s, set([3, 4]))
        self.assertEqual(u, set([3, 5]))
        t.intersection_update(s, u)
        self.assertEqual(t, set([3]))

        self.assertEqual(set([]).intersection(s1), set([]))
        self.assertEqual(s1.intersection(set([])), set([]))
        self.assertEqual(s1.intersection(s2), set([4]))
        self.assertEqual(s.intersection(s1,s2), set([4]))

    def test_copy(self):
        s = set([1,2,3])
        copy_s = s.copy()
        new_s = set(s)
        copy_s.add(42)
        new_s.add(13)
        self.assertEqual(s, set([1, 2, 3]))
        self.assertEqual(copy_s, set([1, 2, 3, 42]))
        self.assertEqual(new_s, set([1, 2, 3, 13]))
        self.assertEqual(set([]).copy(), set([]))

        s1 = set(range(5))
        self.assertEqual(s1.copy(), s1)
        s3 = s1.copy()
        s1 = set(range(1,5))
        self.assertNotEqual(s1, s3)
        s3 = s1.copy()
        s1.add(0)
        self.assertNotEqual(s1, s3)

    def test_difference(self):
        s = set([2,3,4])
        t = set([3,4,5])
        u = set([1,3,5])

        a = s.difference(t)
        b = u.difference(s)
        c = u.difference(t)
        self.assertEqual(a, set([2]))
        self.assertEqual(b, set([1, 5]))
        self.assertEqual(c, set([1]))
        d = s.difference(t, u)
        self.assertEqual(d, set([2]))

        s.difference_update(t)
        u.difference_update(t)
        self.assertEqual(s, set([2]))
        self.assertEqual(u, set([1]))
        s = set([2,3,4])
        t = set([3,4,5])
        t.difference_update(s, u)
        self.assertEqual(t, set([5]))

    def test_compare(self):
        self.assertFalse(set([]) == [])
        self.assertFalse(set(["a"]) == ["a"])
        self.assertFalse(set(["a", "b"]) == ["a", "b"])
        self.assertFalse(set(["b", "a"]) == ["a", "b"])
        self.assertFalse(set(["a", "c", "b"]) == ["c", "b", "a"])
        self.assertTrue(set(['a']) == set(['a']))

        set_1 = set([(), (1,), (5,), (1, 2), (2, 2), (1, 2, 2)])
        set_2 = set([(), (1,), (2,), (1, 2), (2, 2), (1, 2, 2)])
        self.assertFalse(set_1 == set_2)
        self.assertTrue(set_1 != set_2)
        set_1 = set([(), (1,), (2,), (1, 2), (2, 2), (1, 2, 2)])
        set_2 = set([(), (1,), (2,), (1, 2), (2, 2), (1, 2, 2)])
        self.assertTrue(set_1 == set_2)
        self.assertFalse(set_1 != set_2)

        self.assertTrue(s1 <= s)
        self.assertTrue(s2 <= s)
        self.assertTrue(s <= s)
        self.assertFalse(s1 <= s2)
        self.assertTrue(s1 < s)
        self.assertTrue(s2 < s)
        self.assertFalse(s < s)
        self.assertFalse(s1 < s2)
        self.assertTrue(s >= s1)
        self.assertTrue(s >= s2)
        self.assertTrue(s >= s)
        self.assertFalse(s1 >= s2)
        self.assertTrue(s > s1)
        self.assertTrue(s > s2)
        self.assertFalse(s > s)
        self.assertFalse(s1 > s2)

    def test_isdisjoint(self):
        self.assertFalse(s1.isdisjoint(s2))
        self.assertTrue(s1.isdisjoint(set(range(5,10))))

    def test_issubset(self):
        self.assertTrue(s1.issubset(s1))
        self.assertTrue(s1.issubset(s))
        self.assertFalse(s1.issubset(s2))

    def test_update(self):
        empty = set([])
        empty.update(s1)
        self.assertEqual(empty, s1)
        empty.update(set([]))
        self.assertEqual(empty, s1)
        empty.update(s2)
        self.assertEqual(empty, s)
        empty.update(s1,s2,set([4,5,6]))
        self.assertEqual(empty, s)

    def test_add(self):
        empty = set([])
        empty.add(1)
        self.assertEqual(empty, set([1]))
        a = set(range(5))
        a.add(5)
        self.assertEqual(a, set([0,1,2,3,4,5]))

    def test_remove(self):
        empty = set([1])
        empty.remove(1)
        self.assertEqual(empty, set([]))
        a = set(range(6))
        a.remove(5)
        self.assertEqual(a, set([0, 1, 2, 3, 4]))
        self.assertRaises(KeyError, set('abc').remove, 'Q')

    def test_remove_keyerror_unpacking(self):
        # bug:  www.python.org/sf/1576657
        s = set('simsalabim')
        for v1 in ['Q', (1,)]:
            try:
                s.remove(v1)
            except KeyError as e:
                v2 = e.args[0]
                self.assertEqual(v1, v2)
            else:
                self.fail()

    def test_remove_absent(self):
        s = set('simsalabim')
        try:
            s.remove("d")
            self.fail("Removing missing element should have raised LookupError")
        except LookupError:
            pass


    def test_discard(self):
        empty = set([])
        empty.discard(500)
        self.assertEqual(empty, set([]))

    def test_pop(self):
        a = set(range(4))
        b = set([0,1,2,3])
        self.assertTrue(a.pop() in b)
        self.assertTrue(a.pop() in b)
        self.assertTrue(a.pop() in b)
        self.assertTrue(a.pop() in b)
        self.assertEqual(len(a), 0)

    def test_ops(self):
        a = set(range(5))
        b = set(range(3, 8))
        c = list(b)
        self.assertEqual(a & b, set(range(3, 5)))
        self.assertEqual(a | b, set(range(8)))
        self.assertEqual(a ^ b, set([0, 1, 2, 5, 6, 7]))
        self.assertEqual(a - b, set([0, 1, 2]))
        self.assertRaises(TypeError, lambda: a & c)
        self.assertRaises(TypeError, lambda: a | c)
        self.assertRaises(TypeError, lambda: a ^ c)
        self.assertRaises(TypeError, lambda: a - c)
        
if __name__ == '__main__':
    unittest.main()
            
