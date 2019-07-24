"""Test compiler changes for unary ops (+, -, ~) introduced in Python 2.2"""

import unittest


class IterInheritsTestCase(unittest.TestCase):
    def test_generator(self):
        def counter(low, high):
            current = low
            while current <= high:
                yield current
                current += 1

        l = tuple(counter(1,12))
        t = 4 in l
        self.assertTrue(t)

    def test_getitem(self):
        class Counter:
           def __getitem__(self,idx):
              if idx < 13:
                 return idx
              else:
                 raise StopIteration
        l = tuple(Counter())
        self.assertTrue(5 in l)

    def test_dunderiter(self):
        class Counter:
            def __init__(self, low, high):
                self.current = low
                self.high = high

            def __iter__(self):
                return self

            def __next__(self): # Python 3: def __next__(self)
                if self.current > self.high:
                    raise StopIteration
                else:
                    self.current += 1
                    return self.current - 1

        # l = tuple(Counter(1,12))
        # print(l)
        # self.assertTrue(5 in l)
        #
        # class Foo(Counter):
        #     pass
        #
        # l = tuple(Foo(100,120))
        # print(l)
        # self.assertTrue(105 in l)

    def test_slicing(self):
        a = tuple([1,2,3,4,5,6,7,8])
        b = a[5::-4]
        self.assertEqual(b, (6,2))

    def test_str(self):
        self.assertEqual(str((1,2,3)), "(1, 2, 3)")

    def test_repr(self):
        self.assertEqual(repr((1,2,3)), "(1, 2, 3)")
        self.assertEqual(repr(()), "()")

    def test_multiplication(self):
        self.assertEqual((5,)*10, (5, 5, 5, 5, 5, 5, 5, 5, 5, 5))
        self.assertEqual((1,2,3)*4, (1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3))
        self.assertEqual(10*(5,), (5, 5, 5, 5, 5, 5, 5, 5, 5, 5))
        self.assertEqual(4*(1,2,3), (1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3))

    def test_comparisons(self):
        #equality
        self.assertTrue(() == ())
        self.assertFalse(() == (1,))
        self.assertTrue((1,) == (1,))
        self.assertFalse((1,2) == (3,4))
        self.assertFalse((1,2) == (1,))
        self.assertTrue(() != (1,))
        self.assertFalse(() != ())
        self.assertTrue((1,2) != (1,))
        #greater/less than
        self.assertTrue(() < (1,))
        self.assertTrue((1,2) < (3,4))
        self.assertTrue((1,2) != (1,))
        self.assertTrue(() != (1,))
        self.assertTrue((1,2,3) > (1,2))
        self.assertFalse((1,) > (1,))
        self.assertFalse((1,2,3) < (1,2,3))
        self.assertFalse((1,2) < (1,2))
        self.assertFalse((1,2) > (1,2,3))
        self.assertTrue(() <= (1,))
        self.assertTrue((1,2) <= (1,2))
        self.assertTrue((1,2) <= (1,2,3))
        self.assertFalse((1,2,3) <= (1,2))
        self.assertFalse(() >= (1,))

    def test_index(self):
        self.assertEqual((1, 2, 3).index(2), 1)
        self.assertEqual((1, 2, 3).index(1), 0)

    def test_len(self):
        self.assertEqual(len(()), 0)
        self.assertEqual(len((1,2,3,4)), 4)

    def test_count(self):
        t = (1,2,3,4,2,1)
        self.assertEqual(t.count(1), 2)
        self.assertEqual(t.count(2), 2)
        self.assertEqual(t.count(4), 1)

if __name__ == "__main__":
    unittest.main()
