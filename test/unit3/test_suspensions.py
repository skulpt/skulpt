import unittest
from time import sleep

def sleeping_gen():
    for i in [4, 1, 5]:
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
        self.assertEqual(min(sleeping_gen()), 1)
        self.assertEqual(min(sleeping_gen(), key=sleeping_f), 1)
        self.assertRaises(ValueError, min, sleepingEmptyIter())
        with self.assertRaises(ValueError):
            min(sleepingEmptyIter(), key=sleeping_f)

        self.assertEqual(max(sleeping_gen()), 5)
        self.assertEqual(max(sleeping_gen(), key=sleeping_f), 5)
        self.assertRaises(ValueError, max, sleepingEmptyIter())
        with self.assertRaises(ValueError):
            max(sleepingEmptyIter(), key=sleeping_f)


if __name__ == '__main__':
    unittest.main()
