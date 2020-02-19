"""Unit testing for Counter"""
import unittest
import collections

class CounterTests(unittest.TestCase):
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

    def test_basic(self):
        a = collections.Counter()
        self.assertEqual(str(a), "Counter()")
        b = collections.Counter('gallahad')
        self.assertEqual(b, collections.Counter({'a': 3, 'l': 2, 'g': 1, 'h': 1, 'd': 1}))
        c =  collections.Counter({'red': 4, 'blue': 2})
        self.assertEqual(c['green'], 0)
        self.assertEqual(str(c), "Counter({'red': 4, 'blue': 2})")
        
        x = collections.Counter('hello world!')
        self.assertEqual(x, collections.Counter({'l': 3, 'o': 2, 'h': 1, 'e': 1, ' ': 1, 'w': 1, 'r': 1, 'd': 1, '!': 1}))
        for i in 'hello universe!':
            x[i] += 1
        self.assertEqual(x, collections.Counter({'l': 5, 'e': 4, 'o': 3, 'h': 2, ' ': 2, 'r': 2, '!': 2, 'w': 1, 'd': 1, 'u': 1, 'n': 1, 'i': 1, 'v': 1, 's': 1}))
        l = list(x.elements())
        l.sort()
        self.assertEqual(l, [' ', ' ', '!', '!', 'd', 'e', 'e', 'e', 'e', 'h', 'h', 'i', 'l', 'l', 'l', 'l', 'l', 'n', 'o', 'o', 'o', 'r', 'r', 's', 'u', 'v', 'w'])
        
    def test_most_common(self):
        x = collections.Counter({'l': 5, 'e': 4, 'o': 3, 'h': 2, ' ': 2, 'r': 2, '!': 2, 'w': 1, 'd': 1, 'u': 1, 'n': 1, 'i': 1, 'v': 1, 's': 1})
        self.assertEqual(x.most_common(2), [('l', 5), ('e', 4)])
        self.assertTrue(self._mc_compare(x.most_common(), [('l', 5), ('e', 4), ('o', 3), ('h', 2), (' ', 2), ('r', 2), ('!', 2), ('w', 1), ('d', 1), ('u', 1), ('n', 1), ('i', 1), ('v', 1), ('s', 1)]))

    def test_subtract(self):
        a = collections.Counter({1:6, 2:4, 3:3})
        a.subtract({1:5, 2:-2, 4:7})
        self.assertEqual(a, collections.Counter({2: 6, 3: 3, 1: 1, 4: -7}))
        a.subtract([1, 1])
        self.assertEqual(a, collections.Counter({2: 6, 3: 3, 1: -1, 4: -7}))
        a.subtract(collections.Counter({1:-8, 3:2}))
        self.assertEqual(a, collections.Counter({1: 7, 2: 6, 3: 1, 4: -7}))
        c = collections.Counter("hello world")
        c.subtract("hello")
        self.assertEqual(c, collections.Counter({'l': 1, 'o': 1, ' ': 1, 'w': 1, 'r': 1, 'd': 1, 'h': 0, 'e': 0}))
        c.subtract()
        self.assertEqual(c, collections.Counter({'l': 1, 'o': 1, ' ': 1, 'w': 1, 'r': 1, 'd': 1, 'h': 0, 'e': 0}))
        c.update("hello")
        self.assertEqual(c, collections.Counter({'l': 3, 'o': 2, 'h': 1, 'e': 1, ' ': 1, 'w': 1, 'r': 1, 'd': 1}))
        c.update()
        self.assertEqual(c, collections.Counter({'l': 3, 'o': 2, 'h': 1, 'e': 1, ' ': 1, 'w': 1, 'r': 1, 'd': 1}))
        

    def test_update(self):
        a = collections.Counter({1: 7, 2: 6, 3: 1, 4: -7})
        a.update({1:5, 2:-2, 4:7})
        self.assertEqual(a, collections.Counter({1: 12, 2: 4, 3: 1, 4: 0}))
        a.update([1, 1])
        self.assertEqual(a, collections.Counter({1: 14, 2: 4, 3: 1, 4: 0}))
        a.update(collections.Counter({1:-8, 3:2}))
        self.assertEqual(a, collections.Counter({1: 6, 2: 4, 3: 3, 4: 0}))

    def test_errors(self):
        c = collections.Counter('hello')
        self.assertRaises(TypeError, collections.Counter, 3)
        self.assertRaises(TypeError, c.elements, 5)
        self.assertRaises(TypeError, c.most_common, 2, 5)
        self.assertRaises(TypeError, c.most_common, "hello")
        self.assertEqual(c.most_common(-5), [])
        self.assertTrue(self._mc_compare(c.most_common(200), [('l', 2), ('h', 1), ('e', 1), ('o', 1)]))
        self.assertRaises(TypeError, c.update, 1, 3)
        self.assertRaises(TypeError, c.update, 13)
        self.assertRaises(TypeError, c.subtract, 4, 5)
        self.assertRaises(TypeError, c.subtract, 12.4)

if __name__ == '__main__':
    unittest.main()
            
