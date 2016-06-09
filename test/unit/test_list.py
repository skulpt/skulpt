"""Test compiler changes for unary ops (+, -, ~) introduced in Python 2.2"""

import unittest


class IterInheritsTestCase(unittest.TestCase):
    def setUp(self):
        self.type2test = list

    def test_generator(self):
        def counter(low, high):
            current = low
            while current <= high:
                yield current
                current += 1

        l = list(counter(1,12))
        t = 4 in l
        self.assertTrue(t)

    def test_getitem(self):
        class Counter:
           def __getitem__(self,idx):
              if idx < 13:
                 return idx
              else:
                 raise StopIteration
        l = list(Counter())
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

        l = list(Counter(1,12))
        self.assertTrue(5 in l)

        class Foo(Counter):
            pass

        l = list(Foo(100,120))
        self.assertTrue(105 in l)

    def test_str(self):
        l = list("this is a sequence")
        self.assertTrue("q" in l)


    def test_reversed(self):
        a = list(range(20))
        r = sorted(a,reverse=True)
        self.assertEqual(list(r), list(range(19, -1, -1)))

    def test_explicit_not_reversed(self):
        a = list(range(20))
        r = sorted(a,reverse=False)
        self.assertEqual(r, a)

    def test_delitem(self):
        self.type2test = list
        a = self.type2test([0, 1])
        del a[1]
        self.assertEqual(a, [0])
        del a[0]
        self.assertEqual(a, [])

        a = self.type2test([0, 1])
        del a[-2]
        self.assertEqual(a, [1])
        del a[-1]
        self.assertEqual(a, [])

        # todo: why __delitem__ not found?
        # a = self.type2test([0, 1])
        # self.assertRaises(IndexError, a.__delitem__, -3)
        # self.assertRaises(IndexError, a.__delitem__, 2)
        #
        # a = self.type2test([])
        # self.assertRaises(IndexError, a.__delitem__, 0)
        #
        # self.assertRaises(TypeError, a.__delitem__)

    def test_set_subscript(self):
        self.type2test = list
        a = self.type2test(range(20))
        # todo: again __setitem__ not found
        # self.assertRaises(ValueError, a.__setitem__, slice(0, 10, 0), [1,2,3])
        # self.assertRaises(TypeError, a.__setitem__, slice(0, 10), 1)
        # self.assertRaises(ValueError, a.__setitem__, slice(0, 10, 2), [1,2])
        # self.assertRaises(TypeError, a.__getitem__, 'x', 1)
        a[slice(2,10,3)] = [1,2,3]
        self.assertEqual(a, self.type2test([0, 1, 1, 3, 4, 2, 6, 7, 3,
                                            9, 10, 11, 12, 13, 14, 15,
                                            16, 17, 18, 19]))

    def test_append(self):
        self.type2test = list
        a = self.type2test([])
        a.append(0)
        a.append(1)
        a.append(2)
        self.assertEqual(a, self.type2test([0, 1, 2]))

        self.assertRaises(TypeError, a.append)

    def test_extend(self):
        self.type2test = list
        a1 = self.type2test([0])
        a2 = self.type2test((0, 1))
        a = a1[:]
        a.extend(a2)
        self.assertEqual(a, a1 + a2)

        a.extend(self.type2test([]))
        self.assertEqual(a, a1 + a2)

        a.extend(a)
        self.assertEqual(a, self.type2test([0, 0, 1, 0, 0, 1]))

        a = self.type2test("spam")
        a.extend("eggs")
        self.assertEqual(a, list("spameggs"))

        self.assertRaises(TypeError, a.extend, None)

    def test_insert(self):
        a = self.type2test([0, 1, 2])
        a.insert(0, -2)
        a.insert(1, -1)
        a.insert(2, 0)
        self.assertEqual(a, [-2, -1, 0, 0, 1, 2])

        b = a[:]
        b.insert(-2, "foo")
        b.insert(-200, "left")
        b.insert(200, "right")
        self.assertEqual(b, self.type2test(["left",-2,-1,0,0,"foo",1,2,"right"]))

        self.assertRaises(TypeError, a.insert)

    def test_pop(self):
        a = self.type2test([-1, 0, 1])
        a.pop()
        self.assertEqual(a, [-1, 0])
        a.pop(0)
        self.assertEqual(a, [0])
        self.assertRaises(IndexError, a.pop, 5)
        a.pop(0)
        self.assertEqual(a, [])
        self.assertRaises(IndexError, a.pop)
        self.assertRaises(TypeError, a.pop, 42, 42)
        a = self.type2test([0, 10, 20, 30, 40])

    def test_remove(self):
        a = self.type2test([0, 0, 1])
        a.remove(1)
        self.assertEqual(a, [0, 0])
        a.remove(0)
        self.assertEqual(a, [0])
        a.remove(0)
        self.assertEqual(a, [])

        self.assertRaises(ValueError, a.remove, 0)

        self.assertRaises(TypeError, a.remove)

    def test_count(self):
        a = self.type2test([0, 1, 2])*3
        self.assertEqual(a.count(0), 3)
        self.assertEqual(a.count(1), 3)
        self.assertEqual(a.count(3), 0)

        self.assertRaises(TypeError, a.count)

        # class BadExc(Exception):
        #     pass
        #
        # class BadCmp:
        #     def __eq__(self, other):
        #         if other == 2:
        #             raise BadExc()
        #         return False
        #
        # self.assertRaises(BadExc, a.count, BadCmp())

    def test_index(self):
        u = self.type2test([0, 1])
        self.assertEqual(u.index(0), 0)
        self.assertEqual(u.index(1), 1)
        self.assertRaises(ValueError, u.index, 2)

        u = self.type2test([-2, -1, 0, 0, 1, 2])
        self.assertEqual(u.count(0), 2)
        self.assertEqual(u.index(0), 2)
        self.assertEqual(u.index(0, 2), 2)
        self.assertEqual(u.index(-2, -10), 0)
        self.assertEqual(u.index(0, 3), 3)
        self.assertEqual(u.index(0, 3, 4), 3)
        self.assertRaises(ValueError, u.index, 2, 0, -10)

        self.assertRaises(TypeError, u.index)

        # class BadExc(Exception):
        #     pass
        #
        # class BadCmp:
        #     def __eq__(self, other):
        #         if other == 2:
        #             raise BadExc()
        #         return False
        #
        # a = self.type2test([0, 1, 2, 3])
        # self.assertRaises(BadExc, a.index, BadCmp())

    def test_slice(self):
        u = self.type2test("spam")
        u[:2] = "h"
        self.assertEqual(u, list("ham"))

    def test_extendedslicing(self):
        #  subscript
        a = self.type2test([0,1,2,3,4])

        #  deletion
        del a[::2]
        self.assertEqual(a, self.type2test([1,3]))
        a = self.type2test(range(5))
        del a[1::2]
        self.assertEqual(a, self.type2test([0,2,4]))
        a = self.type2test(range(5))
        del a[1::-2]
        self.assertEqual(a, self.type2test([0,2,3,4]))
        a = self.type2test(range(10))
        del a[::1000]
        self.assertEqual(a, self.type2test([1, 2, 3, 4, 5, 6, 7, 8, 9]))
        #  assignment
        a = self.type2test(range(10))
        a[::2] = [-1]*5
        self.assertEqual(a, self.type2test([-1, 1, -1, 3, -1, 5, -1, 7, -1, 9]))
        a = self.type2test(range(10))
        a[::-4] = [10]*3
        self.assertEqual(a, self.type2test([0, 10, 2, 3, 4, 10, 6, 7, 8 ,10]))
        # todo:  this odd test fails
        # a = self.type2test(range(4))
        # a[::-1] = a
        # self.assertEqual(a, self.type2test([3, 2, 1, 0]))
        a = self.type2test(range(10))
        b = a[:]
        c = a[:]
        a[2:3] = self.type2test(["two", "elements"])
        b[slice(2,3)] = self.type2test(["two", "elements"])
        c[2:3:] = self.type2test(["two", "elements"])
        self.assertEqual(a, b)
        self.assertEqual(a, c)
        a = self.type2test(range(10))
        a[::2] = tuple(range(5))
        self.assertEqual(a, self.type2test([0, 1, 1, 3, 2, 5, 3, 7, 4, 9]))
        # test issue7788
        a = self.type2test(range(10))
        del a[9::1<<333]


if __name__ == "__main__":
    unittest.main(verbosity=2)
