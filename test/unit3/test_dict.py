import unittest

'''
    source: https://bitbucket.org/pypy/pypy/src/d7777f2ccd3f0c1a4720d5e6fc3c6b8da4547ea7/lib-python/2.7/test/test_dict.py?at=default
'''
class DictTest(unittest.TestCase):
    def test_constructor(self):
        # calling built-in types without argument must return empty
        self.assertEqual(dict(), {})
        self.assertIsNot(dict(), {})
        d = {1: 2, 3: 4}
        self.assertEqual(d, dict(d))
        d1 = { 1: 4, 1.0: 5 }
        self.assertEqual(d1, {1:5})

    def test_bool(self):
        self.assertIs(not {}, True)
        self.assertTrue({1: 2})
        self.assertIs(bool({}), False)
        self.assertIs(bool({1: 2}), True)

    def test_assignment(self):
        x = {}
        x[1] = 2
        self.assertEqual(x, {1:2})
        y = {3:4}
        self.assertEqual(y[3], 4)
        d = {}
        d["__proto__"]="testing"
        self.assertEqual(d, {'__proto__': 'testing'})

    def test_len(self):
        self.assertEqual(len({1:2}),2)
        # Test that re-setting the value in a dict doesn't mess with its length
        d = {'foo':2}
        x = len(d)
        d['foo'] = 13
        self.assertEqual(x, len(d))

    def test_keys(self):
        d = {}
        self.assertEqual(list(d.keys()), [])
        # changed from self.assertEqual(d.keys(), [])
        d = {'a': 1, 'b': 2}
        k = d.keys()
        self.assertEqual(set(k), {'a', 'b'})
        self.assertIn('a', k)
        self.assertIn('b', k)
        # self.assertTrue(d.has_key('a'))
        # self.assertTrue(d.has_key('b'))
        # has_key depreciated in Python 3
        self.assertRaises(TypeError, d.keys, None)

    def test_values(self):
        d = {}
        self.assertEqual(list(d.values()), [])
        # changed from self.assertEqual(d.values(), [])
        d = {1:2}
        self.assertEqual(list(d.values()), [2])
        # changed from self.assertEqual(d.values(), [2])

        self.assertRaises(TypeError, d.values, None)

    def test_items(self):
        d = {}
        self.assertEqual(list(d.items()), [])
        # changed from self.assertEqual(d.items(), [])
        d = {1:2}
        self.assertEqual(list(d.items()), [(1, 2)])
        # changed from self.assertEqual(d.items(), [(1, 2)])

        self.assertRaises(TypeError, d.items, None)

    # def test_has_key(self):
    #     d = {}
    #     self.assertFalse('a' in d)
    #     # has_key replaced with "in"
    #     d = {'a': 1, 'b': 2}
    #     k = d.keys()
    #     k_list = list(k)
    #     k_list.sort()
    #     # changed from k.sort()
    #     self.assertEqual(k_list, ['a', 'b'])
    #     # changed comparison from k to k_list
    #
    #     self.assertRaises(TypeError, d.has_key)
    #     # don't know what to do about this

    def test_contains(self):
        d = {}
        self.assertNotIn('a', d)
        self.assertFalse('a' in d)
        self.assertTrue('a' not in d)
        self.assertFalse(d.__contains__('a'))
        d = {'a': 1, 'b': 2}
        self.assertIn('a', d)
        self.assertIn('b', d)
        self.assertNotIn('c', d)
        self.assertTrue(d.__contains__('a'))
        self.assertFalse(d.__contains__('c'))
        self.assertFalse(1 in d)

    def test_len(self):
        d = {}
        self.assertEqual(len(d), 0)
        d = {'a': 1, 'b': 2}
        self.assertEqual(len(d), 2)

    def test_clear(self):
        d = {1:1, 2:2, 3:3}
        d.clear()
        self.assertEqual(d, {})

        self.assertRaises(TypeError, d.clear, None)

    def test_delitem(self):
        x = {1:2}
        del x[1]
        self.assertEqual(x, {})

    def test_update(self):
        d = {}
        d.update({1:100})
        d.update({2:20})
        d.update({1:1, 2:2, 3:3})
        self.assertEqual(d, {1:1, 2:2, 3:3})

        d.update()
        self.assertEqual(d, {1:1, 2:2, 3:3})

        self.assertRaises(TypeError, d.update, None)

        class SimpleUserDict:
            def __init__(self):
                self.d = {1:1, 2:2, 3:3}
            def keys(self):
                return self.d.keys()
            def __getitem__(self, i):
                return self.d[i]
        d.clear()
        d.update(SimpleUserDict())
        self.assertEqual(d, {1:1, 2:2, 3:3})

        d.clear()
        class FailingUserDict:
            def keys(self):
                raise KeyError
        self.assertRaises(KeyError, d.update, FailingUserDict())

        # skulpt seems not to support this kind of behavior
        # especially defining this inner iter
        # hence test is disabled
        class FailingUserDict:
            def keys(self):
                class BogonIter:
                    def __init__(self):
                        self.i = 1
                    def __iter__(self):
                        return self
                    def next(self):
                        if self.i:
                            self.i = 0
                            return 'a'
                        raise Exception
                return BogonIter()
            def __getitem__(self, key):
                return key
        self.assertRaises(Exception, d.update, FailingUserDict())

        class FailingUserDict:
            def keys(self):
                class BogonIter:
                    def __init__(self):
                        self.i = ord('a')
                    def __iter__(self):
                        return self
                    def next(self):
                        if self.i <= ord('z'):
                            rtn = chr(self.i)
                            self.i += 1
                            return rtn
                        raise StopIteration
                return BogonIter()
            def __getitem__(self, key):
                raise Exception
        self.assertRaises(Exception, d.update, FailingUserDict())

        class badseq(object):
            def __iter__(self):
                return self
            def next(self):
                raise Exception()

        self.assertRaises(Exception, {}.update, badseq())

        self.assertRaises(ValueError, {}.update, [(1, 2, 3)])

    def test_repr(self):
        d = {}
        self.assertEqual(repr(d), '{}')
        d[1] = 2
        self.assertEqual(repr(d), '{1: 2}')
        d = {}
        d[1] = d
        self.assertEqual(repr(d), '{1: {...}}')

        # we cannot subclass Exceptions -.-
        '''
        class Exc(Exception): pass

        class BadRepr(object):
            def __repr__(self):
                raise Exc()

        d = {1: BadRepr()}
        #self.assertRaises(Exc, repr, d)
        '''

    def test_str(self):
        self.assertEqual(str({1:'ok', 2:'stuff'}), "{1: 'ok', 2: 'stuff'}")

    def test_get(self):
        d = {}
        self.assertIs(d.get('c'), None)
        self.assertEqual(d.get('c', 3), 3)
        d = {'a': 1, 'b': 2}
        self.assertIs(d.get('c'), None)
        self.assertEqual(d.get('c', 3), 3)
        self.assertEqual(d.get('a'), 1)
        self.assertEqual(d.get('a', 3), 1)
        self.assertRaises(TypeError, d.get)
        self.assertRaises(TypeError, d.get, None, None, None)
    def test_getitem(self):
        class Foo:

            def __init__(self, arg):
                self.x = None

            def __getitem__(self,key):
                return self.x

        x = Foo(5)
        self.assertEqual(x[1], None)

    def test_attrib(self):
        d = {}
        def do_set():
            d.x = 42
        self.assertRaises(AttributeError, do_set)
        self.assertRaises(AttributeError, lambda: d.x)
                         
    def test_key_types(self):
        x = (1,3)
        d1 = {x:"OK"}
        self.assertEqual(d1[x], "OK")
        y = (1,3)
        self.assertEqual(d1[y], "OK")
        def keyassn(x):
            return {x:1}
        self.assertRaises(TypeError, keyassn, [4,5])
        self.assertRaises(TypeError, keyassn, {1:2})
        a = {1:2}
        self.assertRaises(KeyError, lambda x: a[x], 2)

    def test_nesting(self):
        a = {'a':[1,2,3], 'b':(5,6,7)}
        a[999] = {'ok':1, 'stuff':2}
        self.assertEqual(a, {'a':[1,2,3], 'b':(5,6,7), 999: {'ok':1, 'stuff':2}})

    def test_max_min(self):
        d = {'foo':2, 'bar':3, 'abc':4}
        self.assertEqual(min(d), 'abc')
        self.assertEqual(max(d), 'foo')
    def test_comprehension(self):
        s = { i*i for i in range(100) if i&1 == 1 }
        self.assertEqual(s, {1, 3969, 4225, 9, 3721, 4489, 5625, 529, 1681, 7569, 25, 3481, 4761, 289, 2209, 6561, 169, 2601, 5929, 49, 3249, 5041, 2809, 441, 1849, 7225, 961, 1089, 9025, 9409, 841, 1225, 8649, 9801, 81, 3025, 5329, 1369, 729, 8281, 225, 2401, 6241, 361, 2025, 6889, 625, 1521, 7921, 121})
        s2 = { 2*y + x + 1 for x in (0,) for y in (1,) }
        self.assertEqual(s2, {3})

if __name__ == '__main__':
    unittest.main()
