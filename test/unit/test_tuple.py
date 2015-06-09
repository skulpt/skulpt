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
        print t, l
        self.assertTrue(t)

    def test_getitem(self):
        class Counter:
           def __getitem__(self,idx):
              if idx < 13:
                 return idx
              else:
                 raise StopIteration
        l = tuple(Counter())
        print l
        self.assertTrue(5 in l)

    def test_dunderiter(self):
        class Counter:
            def __init__(self, low, high):
                self.current = low
                self.high = high

            def __iter__(self):
                return self

            def next(self): # Python 3: def __next__(self)
                if self.current > self.high:
                    raise StopIteration
                else:
                    self.current += 1
                    return self.current - 1

        l = tuple(Counter(1,12))
        print l
        self.assertTrue(5 in l)

        class Foo(Counter):
            pass

        l = tuple(Foo(100,120))
        print l
        self.assertTrue(105 in l)





if __name__ == "__main__":
    unittest.main()
