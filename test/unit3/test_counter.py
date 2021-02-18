"""Unit testing for Counter"""
import unittest
import collections
from collections import Counter, OrderedDict
import copy
from random import randrange

def _count_elements(mapping, iterable):
    'Tally elements from the iterable.'
    mapping_get = mapping.get
    for elem in iterable:
        mapping[elem] = mapping_get(elem, 0) + 1
class CounterSubclassWithSetItem(Counter):
    # Test a counter subclass that overrides __setitem__
    def __init__(self, *args, **kwds):
        self.called = False
        Counter.__init__(self, *args, **kwds)
    def __setitem__(self, key, value):
        self.called = True
        Counter.__setitem__(self, key, value)

class CounterSubclassWithGet(Counter):
    # Test a counter subclass that overrides get()
    def __init__(self, *args, **kwds):
        self.called = False
        Counter.__init__(self, *args, **kwds)
    def get(self, key, default):
        self.called = True
        return Counter.get(self, key, default)

class TestCounter(unittest.TestCase):
    def _mc_compare(self, result, expected):
        """
        Compare results of most_common where elements with same count
        can be in arbitrary order.
        """
        if len(result) != len(expected):
            return False

        def split(elements):
            result = {}
            count = None
            curr = set()
            for item in elements:
                if (count == item[1]) or (count == None):
                    count = item[1]
                    if item[0] in curr:
                        return False
                    curr.add(item[0])
                else:
                    if count >= item[1]:
                        return False
                    result[count] = curr
                    count = item[1]
                    curr = set()
                    curr.add(item[0])
            if count != None:
                result[count] = curr

        ritems = split(result)
        eitems = split(expected)

        return ritems == eitems

    def test_basics(self):
        c = Counter('abcaba')
        self.assertEqual(c, Counter({'a':3 , 'b': 2, 'c': 1}))
        self.assertEqual(c, Counter(a=3, b=2, c=1))
        self.assertIsInstance(c, dict)
        # self.assertIsInstance(c, Mapping)
        self.assertTrue(issubclass(Counter, dict))
        # self.assertTrue(issubclass(Counter, Mapping))
        self.assertEqual(len(c), 3)
        self.assertEqual(sum(c.values()), 6)
        self.assertEqual(list(c.values()), [3, 2, 1])
        self.assertEqual(list(c.keys()), ['a', 'b', 'c'])
        self.assertEqual(list(c), ['a', 'b', 'c'])
        self.assertEqual(list(c.items()),
                         [('a', 3), ('b', 2), ('c', 1)])
        self.assertEqual(c['b'], 2)
        self.assertEqual(c['z'], 0)
        self.assertEqual(c.__contains__('c'), True)
        self.assertEqual(c.__contains__('z'), False)
        self.assertEqual(c.get('b', 10), 2)
        self.assertEqual(c.get('z', 10), 10)
        self.assertEqual(c, dict(a=3, b=2, c=1))
        self.assertEqual(repr(c), "Counter({'a': 3, 'b': 2, 'c': 1})")
        self.assertEqual(c.most_common(), [('a', 3), ('b', 2), ('c', 1)])
        for i in range(5):
            self.assertEqual(c.most_common(i),
                             [('a', 3), ('b', 2), ('c', 1)][:i])
        self.assertEqual(''.join(c.elements()), 'aaabbc')
        c['a'] += 1         # increment an existing value
        c['b'] -= 2         # sub existing value to zero
        del c['c']          # remove an entry
        del c['c']          # make sure that del doesn't raise KeyError
        c['d'] -= 2         # sub from a missing value
        c['e'] = -5         # directly assign a missing value
        c['f'] += 4         # add to a missing value
        self.assertEqual(c, dict(a=4, b=0, d=-2, e=-5, f=4))
        self.assertEqual(''.join(c.elements()), 'aaaaffff')
        self.assertEqual(c.pop('f'), 4)
        self.assertNotIn('f', c)
        for i in range(3):
            elem, cnt = c.popitem()
            self.assertNotIn(elem, c)
        c.clear()
        self.assertEqual(c, {})
        self.assertEqual(repr(c), 'Counter()')
        self.assertRaises(NotImplementedError, Counter.fromkeys, 'abc')
        self.assertRaises(TypeError, hash, c)
        c.update(dict(a=5, b=3))
        c.update(c=1)
        c.update(Counter('a' * 50 + 'b' * 30))
        c.update()          # test case with no args
        c.__init__('a' * 500 + 'b' * 300)
        c.__init__('cdc')
        c.__init__()
        self.assertEqual(c, dict(a=555, b=333, c=3, d=1))
        self.assertEqual(c.setdefault('d', 5), 1)
        self.assertEqual(c['d'], 1)
        self.assertEqual(c.setdefault('e', 5), 5)
        self.assertEqual(c['e'], 5)

    def test_init(self):
        self.assertEqual(list(Counter(self=42).items()), [('self', 42)])
        self.assertEqual(list(Counter(iterable=42).items()), [('iterable', 42)])
        self.assertEqual(list(Counter(iterable=None).items()), [('iterable', None)])
        self.assertRaises(TypeError, Counter, 42)
        self.assertRaises(TypeError, Counter, (), ())
        self.assertRaises(TypeError, Counter.__init__)

    def test_order_preservation(self):
        # Input order dictates items() order
        self.assertEqual(list(Counter('abracadabra').items()),
               [('a', 5), ('b', 2), ('r', 2), ('c', 1), ('d', 1)])
        # letters with same count:   ^----------^         ^---------^

        # Verify retention of order even when all counts are equal
        self.assertEqual(list(Counter('xyzpdqqdpzyx').items()),
               [('x', 2), ('y', 2), ('z', 2), ('p', 2), ('d', 2), ('q', 2)])

        # Input order dictates elements() order
        self.assertEqual(list(Counter('abracadabra simsalabim').elements()),
                ['a', 'a', 'a', 'a', 'a', 'a', 'a', 'b', 'b', 'b','r',
                 'r', 'c', 'd', ' ', 's', 's', 'i', 'i', 'm', 'm', 'l'])

        # Math operations order first by the order encountered in the left
        # operand and then by the order encountered in the right operand.
        ps = 'aaabbcdddeefggghhijjjkkl'
        qs = 'abbcccdeefffhkkllllmmnno'
        order = {letter: i for i, letter in enumerate(dict.fromkeys(ps + qs))}
        def correctly_ordered(seq):
            'Return true if the letters occur in the expected order'
            positions = [order[letter] for letter in seq]
            return positions == sorted(positions)

        p, q = Counter(ps), Counter(qs)
        self.assertTrue(correctly_ordered(+p))
        self.assertTrue(correctly_ordered(-p))
        self.assertTrue(correctly_ordered(p + q))
        self.assertTrue(correctly_ordered(p - q))
        self.assertTrue(correctly_ordered(p | q))
        self.assertTrue(correctly_ordered(p & q))

        p, q = Counter(ps), Counter(qs)
        p += q
        self.assertTrue(correctly_ordered(p))

        p, q = Counter(ps), Counter(qs)
        p -= q
        self.assertTrue(correctly_ordered(p))

        p, q = Counter(ps), Counter(qs)
        p |= q
        self.assertTrue(correctly_ordered(p))

        p, q = Counter(ps), Counter(qs)
        p &= q
        self.assertTrue(correctly_ordered(p))

        p, q = Counter(ps), Counter(qs)
        p.update(q)
        self.assertTrue(correctly_ordered(p))

        p, q = Counter(ps), Counter(qs)
        p.subtract(q)
        self.assertTrue(correctly_ordered(p))

    def test_update(self):
        c = Counter()
        c.update(self=42)
        self.assertEqual(list(c.items()), [('self', 42)])
        c = Counter()
        c.update(iterable=42)
        self.assertEqual(list(c.items()), [('iterable', 42)])
        c = Counter()
        c.update(iterable=None)
        self.assertEqual(list(c.items()), [('iterable', None)])
        self.assertRaises(TypeError, Counter().update, 42)
        self.assertRaises(TypeError, Counter().update, {}, {})
        self.assertRaises(TypeError, Counter.update)

    # def test_copying(self):
    #     # Check that counters are copyable, deepcopyable, picklable, and
    #     #have a repr/eval round-trip
    #     words = Counter('which witch had which witches wrist watch'.split())
    #     def check(dup):
    #         msg = "\ncopy: %s\nwords: %s" % (dup, words)
    #         self.assertIsNot(dup, words, msg)
    #         self.assertEqual(dup, words)
    #     check(words.copy())
    #     check(copy.copy(words))
    #     check(copy.deepcopy(words))
    #     for proto in range(pickle.HIGHEST_PROTOCOL + 1):
    #         with self.subTest(proto=proto):
    #             check(pickle.loads(pickle.dumps(words, proto)))
    #     check(eval(repr(words)))
    #     update_test = Counter()
    #     update_test.update(words)
    #     check(update_test)
    #     check(Counter(words))

    # def test_copy_subclass(self):
    #     class MyCounter(Counter):
    #         pass
    #     c = MyCounter('slartibartfast')
    #     d = c.copy()
    #     self.assertEqual(d, c)
    #     self.assertEqual(len(d), len(c))
    #     self.assertEqual(type(d), type(c))

    def test_conversions(self):
        # Convert to: set, list, dict
        s = 'she sells sea shells by the sea shore'
        self.assertEqual(sorted(Counter(s).elements()), sorted(s))
        self.assertEqual(sorted(Counter(s)), sorted(set(s)))
        self.assertEqual(dict(Counter(s)), dict(Counter(s).items()))
        self.assertEqual(set(Counter(s)), set(s))

    def test_invariant_for_the_in_operator(self):
        c = Counter(a=10, b=-2, c=0)
        for elem in c:
            self.assertTrue(elem in c)
            self.assertIn(elem, c)

    def test_multiset_operations(self):
        # Verify that adding a zero counter will strip zeros and negatives
        c = Counter(a=10, b=-2, c=0) + Counter()
        self.assertEqual(dict(c), dict(a=10))

        elements = 'abcd'
        for i in range(100):
            # test random pairs of multisets
            p = Counter(dict((elem, randrange(-2,4)) for elem in elements))
            p.update(e=1, f=-1, g=0)
            q = Counter(dict((elem, randrange(-2,4)) for elem in elements))
            q.update(h=1, i=-1, j=0)
            for counterop, numberop in [
                (Counter.__add__, lambda x, y: max(0, x+y)),
                (Counter.__sub__, lambda x, y: max(0, x-y)),
                (Counter.__or__, lambda x, y: max(0,x,y)),
                (Counter.__and__, lambda x, y: max(0, min(x,y))),
            ]:
                result = counterop(p, q)
                for x in elements:
                    self.assertEqual(numberop(p[x], q[x]), result[x],
                                     (counterop, x, p, q))
                # verify that results exclude non-positive counts
                self.assertTrue(x>0 for x in result.values())

        elements = 'abcdef'
        for i in range(100):
            # verify that random multisets with no repeats are exactly like sets
            p = Counter(dict((elem, randrange(0, 2)) for elem in elements))
            q = Counter(dict((elem, randrange(0, 2)) for elem in elements))
            for counterop, setop in [
                (Counter.__sub__, set.__sub__),
                (Counter.__or__, set.__or__),
                (Counter.__and__, set.__and__),
            ]:
                counter_result = counterop(p, q)
                set_result = setop(set(p.elements()), set(q.elements()))
                self.assertEqual(counter_result, dict.fromkeys(set_result, 1))

    def test_subset_superset_not_implemented(self):
        # Verify that multiset comparison operations are not implemented.

        # These operations were intentionally omitted because multiset
        # comparison semantics conflict with existing dict equality semantics.

        # For multisets, we would expect that if p<=q and p>=q are both true,
        # then p==q.  However, dict equality semantics require that p!=q when
        # one of sets contains an element with a zero count and the other
        # doesn't.

        p = Counter(a=1, b=0)
        q = Counter(a=1, c=0)
        self.assertNotEqual(p, q)
        with self.assertRaises(TypeError):
            p < q
        with self.assertRaises(TypeError):
            p <= q
        with self.assertRaises(TypeError):
            p > q
        with self.assertRaises(TypeError):
            p >= q

    def test_inplace_operations(self):
        elements = 'abcd'
        for i in range(100):
            # test random pairs of multisets
            p = Counter(dict((elem, randrange(-2,4)) for elem in elements))
            p.update(e=1, f=-1, g=0)
            q = Counter(dict((elem, randrange(-2,4)) for elem in elements))
            q.update(h=1, i=-1, j=0)
            for inplace_op, regular_op in [
                (Counter.__iadd__, Counter.__add__),
                (Counter.__isub__, Counter.__sub__),
                (Counter.__ior__, Counter.__or__),
                (Counter.__iand__, Counter.__and__),
            ]:
                c = p.copy()
                c_id = id(c)
                regular_result = regular_op(c, q)
                inplace_result = inplace_op(c, q)
                self.assertEqual(inplace_result, regular_result)
                self.assertEqual(id(inplace_result), c_id)

    def test_subtract(self):
        c = Counter(a=-5, b=0, c=5, d=10, e=15,g=40)
        c.subtract(a=1, b=2, c=-3, d=10, e=20, f=30, h=-50)
        self.assertEqual(c, Counter(a=-6, b=-2, c=8, d=0, e=-5, f=-30, g=40, h=50))
        c = Counter(a=-5, b=0, c=5, d=10, e=15,g=40)
        c.subtract(Counter(a=1, b=2, c=-3, d=10, e=20, f=30, h=-50))
        self.assertEqual(c, Counter(a=-6, b=-2, c=8, d=0, e=-5, f=-30, g=40, h=50))
        c = Counter('aaabbcd')
        c.subtract('aaaabbcce')
        self.assertEqual(c, Counter(a=-1, b=0, c=-1, d=1, e=-1))

        c = Counter()
        c.subtract(self=42)
        self.assertEqual(list(c.items()), [('self', -42)])
        c = Counter()
        c.subtract(iterable=42)
        self.assertEqual(list(c.items()), [('iterable', -42)])
        self.assertRaises(TypeError, Counter().subtract, 42)
        self.assertRaises(TypeError, Counter().subtract, {}, {})
        self.assertRaises(TypeError, Counter.subtract)

    def test_unary(self):
        c = Counter(a=-5, b=0, c=5, d=10, e=15,g=40)
        self.assertEqual(dict(+c), dict(c=5, d=10, e=15, g=40))
        self.assertEqual(dict(-c), dict(a=5))

    def test_repr_nonsortable(self):
        c = Counter(a=2, b=None)
        r = repr(c)
        self.assertIn("'a': 2", r)
        self.assertIn("'b': None", r)

    def test_helper_function(self):
        # two paths, one for real dicts and one for other mappings
        elems = list('abracadabra')

        d = dict()
        _count_elements(d, elems)
        self.assertEqual(d, {'a': 5, 'r': 2, 'b': 2, 'c': 1, 'd': 1})

        m = OrderedDict()
        _count_elements(m, elems)
        self.assertEqual(m,
             OrderedDict([('a', 5), ('b', 2), ('r', 2), ('c', 1), ('d', 1)]))

        # test fidelity to the pure python version
        c = CounterSubclassWithSetItem('abracadabra')
        self.assertTrue(c.called)
        self.assertEqual(dict(c), {'a': 5, 'b': 2, 'c': 1, 'd': 1, 'r':2 })
        c = CounterSubclassWithGet('abracadabra')
        # self.assertTrue(c.called)
        self.assertEqual(dict(c), {'a': 5, 'b': 2, 'c': 1, 'd': 1, 'r':2 })

if __name__ == '__main__':
    unittest.main()
            
