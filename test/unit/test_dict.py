import unittest

'''
    source: https://bitbucket.org/pypy/pypy/src/d7777f2ccd3f0c1a4720d5e6fc3c6b8da4547ea7/lib-python/2.7/test/test_dict.py?at=default
'''
class DictTest(unittest.TestCase):
    def test_constructor(self):
        # calling built-in types without argument must return empty
        self.assertEqual(dict(), {})
        self.assertIsNot(dict(), {})

    def test_bool(self):
        self.assertIs(not {}, True)
        self.assertTrue({1: 2})
        self.assertIs(bool({}), False)
        self.assertIs(bool({1: 2}), True)

    def test_keys(self):
        d = {}
        self.assertEqual(d.keys(), [])
        d = {'a': 1, 'b': 2}
        k = d.keys()
        self.assertEqual(set(k), {'a', 'b'})
        self.assertIn('a', k)
        self.assertIn('b', k)
        self.assertTrue(d.has_key('a'))
        self.assertTrue(d.has_key('b'))
        self.assertRaises(TypeError, d.keys, None)

    def test_values(self):
        d = {}
        self.assertEqual(d.values(), [])
        d = {1:2}
        self.assertEqual(d.values(), [2])

        self.assertRaises(TypeError, d.values, None)

    def test_items(self):
        d = {}
        self.assertEqual(d.items(), [])

        d = {1:2}
        self.assertEqual(d.items(), [(1, 2)])

        self.assertRaises(TypeError, d.items, None)

    def test_has_key(self):
        d = {}
        self.assertFalse(d.has_key('a'))
        d = {'a': 1, 'b': 2}
        k = d.keys()
        k.sort()
        self.assertEqual(k, ['a', 'b'])

        self.assertRaises(TypeError, d.has_key)

    def test_contains(self):
        d = {}
        self.assertNotIn('a', d)
        self.assertFalse('a' in d)
        self.assertTrue('a' not in d)
        d = {'a': 1, 'b': 2}
        self.assertIn('a', d)
        self.assertIn('b', d)
        self.assertNotIn('c', d)
        '''
            The direct call of __contains__ on a dict is currently not working
            in skulpt
        '''
        self.assertRaises(TypeError, d.__contains__)

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

    def test_attrib(self):
        d = {}
        def do_set():
            d.x = 42
        self.assertRaises(AttributeError, do_set)
        self.assertRaises(AttributeError, lambda: d.x)

if __name__ == '__main__':
    unittest.main()
