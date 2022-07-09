import unittest
from time import sleep

def sleeping_gen(x):
    for i in x:
        sleep(.01)
        yield i

def sleeping_f(x):
    sleep(.01)
    return x

class SleepingEmptyIter:
    def __iter__(self):
      return self
    def __next__(self):
      sleep(.01)
      raise StopIteration

class SleepingClass:
    def __bytes__ (self):
        sleep(.01)
        return b'abc'
    def __contains__(self, key):
        sleep(.01)
        return bool(key)

class SleepingDunderFail:
    # __iter__ can't suspend (__next__ can)
    def __iter__(self):
        sleep(0.01)
        return iter([0, 1, 2])

class Test_Suspensions(unittest.TestCase):
    def test_min_max(self):
        x = [4, 1, 5]
        self.assertEqual(min(sleeping_gen(x)), 1)
        self.assertEqual(min(sleeping_gen(x), key=sleeping_f), 1)
        self.assertRaises(ValueError, min, SleepingEmptyIter())
        with self.assertRaises(ValueError):
            min(SleepingEmptyIter(), key=sleeping_f)

        self.assertEqual(max(sleeping_gen(x)), 5)
        self.assertEqual(max(sleeping_gen(x), key=sleeping_f), 5)
        self.assertRaises(ValueError, max, SleepingEmptyIter())
        with self.assertRaises(ValueError):
            max(SleepingEmptyIter(), key=sleeping_f)
    def test_any(self):
        self.assertEqual(any(sleeping_gen([0, 5, 0])), True)
        self.assertEqual(any(sleeping_gen([0, 0, 0])), False)
        self.assertEqual(all(sleeping_gen([4, 1, 5])), True)
        self.assertEqual(all(sleeping_gen([4, 0, 5])), False)
    def test_sum(self):
        self.assertEqual(sum(sleeping_gen([1, 2, 3])), 6)
        self.assertEqual(sum(sleeping_gen([1, 2.0, 3])), 6.0)
        self.assertEqual(sum(sleeping_gen([[1], [2]]), []), [1, 2])

    def test_builtin_types(self):
        self.assertEqual(list(sleeping_gen([1, 2, 3])), [1, 2, 3])
        self.assertEqual(tuple(sleeping_gen([1, 2, 3])), (1, 2, 3))

    def test_bytes(self):
        self.assertEqual(bytes(sleeping_gen([1,2,3])), bytes([1,2,3]))
        self.assertEqual(bytes(SleepingClass()), b'abc')

    def test_starred_assignment(self):
        x = [1,2,3]
        a, b, c = sleeping_gen(x)
        self.assertEqual([a, b, c], x)
        a, b, *c = sleeping_gen(x)
        self.assertEqual((a, b, c), (1, 2, [3]))
        *a, = sleeping_gen(x)
        self.assertEqual(a, x)

    def test_dunders(self):
        x = SleepingClass()
        # __contains__
        self.assertFalse(0 in x)
        self.assertTrue(1 in x)
    
    def test_suspension_error(self):
        x = SleepingDunderFail()
        with self.assertRaises(Exception) as e:
            for i in x:
                pass
        self.assertIn("Cannot call a function that blocks or suspends", str(e.exception))
        self.assertTrue(repr(e.exception).startswith("SuspensionError"))



if __name__ == '__main__':
    unittest.main()
