""" Unit testing for frozensets (2)"""
import unittest
from random import randrange, shuffle


s = frozenset(range(9))
s1 = frozenset(range(5))
s2 = frozenset(range(4,9))

class FrozenSetTests(unittest.TestCase):
    def test_basic(self):
        s = frozenset([1, 2, 3, 4])
        self.assertEqual(frozenset(), frozenset([]))
        l = [1, 2, 3, 4]
        self.assertEqual(frozenset(l), s)
        t = (1, 2, 3, 4)
        self.assertEqual(frozenset(t), s)
        d = {1:2, 3:4}
        self.assertEqual(frozenset(d), frozenset([1, 3]))
        self.assertEqual(frozenset(d.keys()), frozenset([1, 3]))
        self.assertEqual(frozenset(d.values()), frozenset([2, 4]))

        self.assertEqual(len(frozenset([])), 0)
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
        s = frozenset([2,3,4])
        t = frozenset([4,5,6])
        u = frozenset([1,2,3,4,5])
        a = s.union(t)
        b = s.union(u)
        c = t.union(s)
        d = t.union(u)
        e = u.union(s)
        f = u.union(t)
        self.assertEqual(a, c)
        self.assertEqual(a, frozenset([2,3,4,5,6]))
        self.assertEqual(b, e)
        self.assertEqual(b, frozenset([1,2,3,4,5]))
        self.assertEqual(d, f)
        self.assertEqual(d, frozenset([1,2,3,4,5,6]))

        a = s.union(t, u)
        b = s.union(u, t)
        c = t.union(s, u)
        d = t.union(u, s)
        e = u.union(s, t)
        f = u.union(t, s)
        self.assertEqual(f, frozenset([1, 2, 3, 4, 5, 6]))
        self.assertEqual(a, frozenset([1,2,3,4,5,6]))
        self.assertEqual(a, b)
        self.assertEqual(a, c)
        self.assertEqual(a, d)
        self.assertEqual(a, e)
        self.assertEqual(a, f)

        self.assertEqual(frozenset([]).union(s1), s1)
        self.assertEqual(s1.union(frozenset([])), s1)
        self.assertEqual(s1.union(s2), frozenset([0, 1, 2, 3, 4, 5, 6, 7, 8]))
        self.assertEqual(s1.union(s2,frozenset([4,5,6])), frozenset([0, 1, 2, 3, 4, 5, 6, 7, 8]))

    def test_symm_difference(self):
        s = frozenset([1,2,3])
        t = frozenset([3,4,5])
        a = s.symmetric_difference(t)
        b = t.symmetric_difference(s)
        self.assertEqual(a, frozenset([1, 2, 4, 5]))
        self.assertEqual(a, b)
        self.assertEqual(a, frozenset([1,2,4,5]))


    def test_intersection(self):
        s = frozenset([2,3,4])
        t = frozenset([3,4,5])
        u = frozenset([1,3,5])
        a = s.intersection(t)
        b = u.intersection(s)
        c = u.intersection(t)
        self.assertEqual(a, frozenset([3, 4]))
        self.assertEqual(b, frozenset([3]))
        self.assertEqual(c, frozenset([3, 5]))
        d = s.intersection(t, u)
        self.assertEqual(d, frozenset([3]))

        self.assertEqual(frozenset([]).intersection(s1), frozenset([]))
        self.assertEqual(s1.intersection(frozenset([])), frozenset([]))
        self.assertEqual(s1.intersection(s2), frozenset([4]))
        self.assertEqual(s.intersection(s1,s2), frozenset([4]))

    def test_copy(self):
        s = frozenset([1,2,3])
        copy_s = s.copy()
        new_s = frozenset(s)

        self.assertEqual(s, frozenset([1, 2, 3]))
        self.assertEqual(s, copy_s)
        self.assertEqual(frozenset([]).copy(), frozenset([]))

        s1 = frozenset(range(5))
        self.assertEqual(s1.copy(), s1)
        s3 = s1.copy()
        s1 = frozenset(range(1,5))
        self.assertNotEqual(s1, s3)
        

    def test_difference(self):
        s = frozenset([2,3,4])
        t = frozenset([3,4,5])
        u = frozenset([1,3,5])

        a = s.difference(t)
        b = u.difference(s)
        c = u.difference(t)
        self.assertEqual(a, frozenset([2]))
        self.assertEqual(b, frozenset([1, 5]))
        self.assertEqual(c, frozenset([1]))
        d = s.difference(t, u)
        self.assertEqual(d, frozenset([2]))


    def test_compare(self):
        self.assertFalse(frozenset([]) == [])
        self.assertFalse(frozenset(["a"]) == ["a"])
        self.assertFalse(frozenset(["a", "b"]) == ["a", "b"])
        self.assertFalse(frozenset(["b", "a"]) == ["a", "b"])
        self.assertFalse(frozenset(["a", "c", "b"]) == ["c", "b", "a"])
        self.assertTrue(frozenset(['a']) == frozenset(['a']))

        set_1 = frozenset([(), (1,), (5,), (1, 2), (2, 2), (1, 2, 2)])
        set_2 = frozenset([(), (1,), (2,), (1, 2), (2, 2), (1, 2, 2)])
        self.assertFalse(set_1 == set_2)
        self.assertTrue(set_1 != set_2)
        set_1 = frozenset([(), (1,), (2,), (1, 2), (2, 2), (1, 2, 2)])
        set_2 = frozenset([(), (1,), (2,), (1, 2), (2, 2), (1, 2, 2)])
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
        self.assertTrue(s1.isdisjoint(frozenset(range(5,10))))

    def test_issubset(self):
        self.assertTrue(s1.issubset(s1))
        self.assertTrue(s1.issubset(s))
        self.assertFalse(s1.issubset(s2))

    # Copy from set unit test
    def test_ops(self):
        a = frozenset(range(5))
        b = frozenset(range(3, 8))
        c = list(b)
        self.assertEqual(a & b, frozenset(range(3, 5)))
        self.assertEqual(a | b, frozenset(range(8)))
        self.assertEqual(a ^ b, frozenset([0, 1, 2, 5, 6, 7]))
        self.assertEqual(a - b, frozenset([0, 1, 2]))
        self.assertRaises(TypeError, lambda: a & c)
        self.assertRaises(TypeError, lambda: a | c)
        self.assertRaises(TypeError, lambda: a ^ c)
        self.assertRaises(TypeError, lambda: a - c)


    thetype = frozenset
    def test_hash(self):
        self.assertEqual(hash(self.thetype('abcdeb')),
                         hash(self.thetype('ebecda')))

        # make sure that all permutations give the same hash value
        n = 100
        seq = [randrange(n) for i in range(n)]
        results = set()
        for i in range(200):
            shuffle(seq)
            results.add(hash(self.thetype(seq)))
        self.assertEqual(len(results), 1)

    def test_frozen_as_dictkey(self):
        seq = list(range(10)) + list('abcdefg') + ['apple']
        key1 = self.thetype(seq)
        key2 = self.thetype(reversed(seq))
        self.assertEqual(key1, key2)
        self.assertNotEqual(id(key1), id(key2))
        d = {}
        d[key1] = 42
        self.assertEqual(d[key2], 42)

    def test_hash_caching(self):
        f = self.thetype('abcdcda')
        self.assertEqual(hash(f), hash(f))

    def test_hash_effectiveness(self):
        n = 13
        hashvalues = set()
        addhashvalue = hashvalues.add
        elemmasks = [(i+1, 1<<i) for i in range(n)]
        for i in range(2**n):
            addhashvalue(hash(frozenset([e for e, m in elemmasks if m&i])))
        self.assertEqual(len(hashvalues), 2**n)
   

if __name__ == '__main__':
    unittest.main()
   
