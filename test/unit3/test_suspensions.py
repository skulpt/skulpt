import unittest
from time import sleep

def sleeping_gen(x):
    for i in x:
        sleep(.01)
        yield i

def sleeping_f(x):
    sleep(.01)
    return x

class sleepingEmptyIter:
    def __iter__(self):
      return self
    def __next__(self):
      sleep(.01)
      raise StopIteration


class Test_Suspensions(unittest.TestCase):
    def test_min_max(self):
        x = [4, 1, 5]
        self.assertEqual(min(sleeping_gen(x)), 1)
        self.assertEqual(min(sleeping_gen(x), key=sleeping_f), 1)
        self.assertRaises(ValueError, min, sleepingEmptyIter())
        with self.assertRaises(ValueError):
            min(sleepingEmptyIter(), key=sleeping_f)

        self.assertEqual(max(sleeping_gen(x)), 5)
        self.assertEqual(max(sleeping_gen(x), key=sleeping_f), 5)
        self.assertRaises(ValueError, max, sleepingEmptyIter())
        with self.assertRaises(ValueError):
            max(sleepingEmptyIter(), key=sleeping_f)
    def test_any(self):
        self.assertEqual(any(sleeping_gen([0, 5, 0])), True)
        self.assertEqual(any(sleeping_gen([0, 0, 0])), False)
        self.assertEqual(all(sleeping_gen([4, 1, 5])), True)
        self.assertEqual(all(sleeping_gen([4, 0, 5])), False)
    def test_sum(self):
        self.assertEqual(sum(sleeping_gen([1, 2, 3])), 6)
        self.assertIs(sum(sleeping_gen([1, 2.0, 3])), 6.0)
        self.assertEqual(sum(sleeping_gen([[1], [2]]), []), [1, 2])

    def test_builtin_types(self):
        self.assertEqual(list(sleeping_gen([1, 2, 3])), [1, 2, 3])
        self.assertEqual(tuple(sleeping_gen([1, 2, 3])), (1, 2, 3))

if __name__ == '__main__':
    unittest.main()
