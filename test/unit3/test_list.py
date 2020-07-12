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
        l1 = [1,2,3]
        self.assertEqual(l1, list([1,2,3]))
        self.assertEqual(list(tuple([1,2,3])), l1)

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

            def __next__(self): # Python 3: def __next__(self)
                if self.current > self.high:
                    raise StopIteration
                else:
                    self.current += 1
                    return self.current - 1

        # l = list(Counter(1,12))
        # self.assertTrue(5 in l)

        # class Foo(Counter):
        #     pass
        #
        # l = list(Foo(100,120))
        # self.assertTrue(105 in l)

    def test_str(self):
        l = list("this is a sequence")
        self.assertTrue("q" in l)
        x = ["hello"]
        y = list(x)
        x[0] = "hi"
        self.assertEqual(y[0], "hello")

    def test_str_func(self):
        self.assertEqual(str([1,2,3]),  "[1, 2, 3]")

    def test_repr(self):
        a = repr([1,2,3])
        self.assertEqual(a, "[1, 2, 3]")

    def test_len(self):
        self.assertEqual(len([]), 0)
        self.assertEqual(len([1,2,3]), 3)
        self.assertEqual(len([0]*10), 10)
        
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
        b = [1,2,3,4]
        del b[:]
        self.assertEqual(b,[])

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

    def test_assignment(self):
        x = [2,4,6]
        self.assertEqual(x[1], 4)
        x[0] = 5
        self.assertEqual(x, [5,4,6])
        x[0] = [1,2]
        self.assertEqual(x,[[1,2],4,6])
        #assign multiple indices
        a = [1,2,3,4,5,6]
        b = [9,9,9]
        a[1:5] = b
        self.assertEqual(a, [1, 9, 9, 9, 6])
        x = [1,2,3,4,5,6]
        y = [9,9,9]
        x[1:2] = y
        self.assertEqual(x, [1, 9, 9, 9, 3, 4, 5, 6])
        mylist = ['a', 'b', 'c', 'd']
        d = {'1':1,'2':2}
        mylist[0:2] = d
        self.assertEqual(mylist, ['1', '2', 'c', 'd'])
        mylist[1:3] = 'temp'
        self.assertEqual(mylist, ['1', 't', 'e', 'm', 'p', 'd'])
        mylist[:] = ['g','o','o','d']
        self.assertEqual(mylist, ['g', 'o', 'o', 'd'])
        e = [1,2,3,4,5,6]
        f = [9,10,11]
        e[::2] = f
        self.assertEqual(e, [9, 2, 10, 4, 11, 6])
        x = [10] * 5
        x[:3] += [100,100]
        self.assertEqual(x, [10, 10, 10, 100, 100, 10, 10])
        a = [1, 2, 3]
        a[1] += 4
        self.assertEqual(a, [1, 6, 3])

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

        l1 = [42]
        l2 = l1
        l1 += [99]
        self.assertEqual(l1, l2)
        self.assertEqual(l1, [42, 99])
        l1 += l1
        self.assertEqual(l1, [42, 99, 42, 99])

        self.assertRaises(TypeError, a.extend, None)
        m = [[1,2,3],2,3]
        m.extend(m)
        self.assertEqual(m, [[1, 2, 3], 2, 3, [1, 2, 3], 2, 3])
        self.assertRaises(TypeError, lambda x: x + 1, [1])

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

        things = ['hi', 'a', 'b', 'c']
        things.insert(len(things), 'bye')
        self.assertEqual(things, ['hi', 'a', 'b', 'c', 'bye'])
        things.insert(len(things)+3, 'surpise')
        self.assertEqual(things, ['hi', 'a', 'b', 'c', 'bye', 'surpise'])
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
        x = [0, 1, 2]
        x.insert(2, x.pop(0))
        self.assertEqual(x, [1, 2, 0])

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

    def test_shallow_copy(self):
        a = [0,[1]]
        b = a.copy()
        self.assertEqual(a,b)
        a[1][0] = 2
        self.assertEqual(a,b)
        a[0] = 5
        self.assertNotEqual(a,b)
        l = [1,[2],3]
        m = list(l)
        self.assertEqual(l,m)
        l[1][0] = 3
        self.assertEqual(l,m)
        m[0] = 10
        self.assertNotEqual(l,m)
        
    def test_clear(self):
        a = [1,2,3]
        b = a
        a.clear()
        self.assertEqual(b,a)
        self.assertEqual(a, [])
        
    def test_copy(self):
        u = self.type2test([1, 2, 3])
        v = u.copy()
        self.assertEqual(v, [1, 2, 3])

        u = self.type2test([])
        v = u.copy()
        self.assertEqual(v, [])

        # test that it's indeed a copy and not a reference
        u = self.type2test(['a', 'b'])
        v = u.copy()
        v.append('i')
        self.assertEqual(u, ['a', 'b'])
        self.assertEqual(v, u + ['i'])

        # test that it's a shallow, not a deep copy
        u = self.type2test([1, 2, [3, 4], 5])
        v = u.copy()
        self.assertEqual(u, v)
        self.assertIs(v[3], u[3])

        self.assertRaises(TypeError, u.copy, None)
        
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
        myList = [1, 2, 3, "foo", 4, 5, True, False]
        self.assertEqual(myList.index("foo"), 3)
        self.assertEqual(myList.index(True), 0)
        l = ['h','e','l','l','o']

        self.assertRaises(ValueError, l.index, "l", 4)
        self.assertRaises(ValueError, l.index, "l", -1)
        self.assertRaises(ValueError, l.index, "l", 2, 2)
        self.assertRaises(ValueError, l.index, "l", 3, 2)
        self.assertRaises(ValueError, l.index, "l", 3, -2)
        self.assertRaises(ValueError, l.index, "l", 3, 0)
        self.assertRaises(TypeError, l.index, "l", 4.3)
        self.assertRaises(TypeError, l.index, "l", 3, 0.6)

        def foo(lst):
            i = 0
            while lst[i] != 0:
                i += 2

        self.assertRaises(IndexError, foo, [2,2,2,2])
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

    def test_slicing(self):
        b = [1,2,"OK",4]
        self.assertEqual(b[-3:3][1], "OK")

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
        x = [1,2,3,4,5]
        y = x[::-1]
        self.assertEqual(y, [5, 4, 3, 2, 1])
        l = [0,1,2,3,4]
        self.assertTrue(l[0:3] == l[:3] == l[None:3] == [0,1,2])
        self.assertTrue(l[0:] == l[0:None] == l[:] == [0,1,2,3,4])
        l = [0, 1, 2, 3]
        error1, error2, = None, None

        def foo(x, y):
            return l[x: : y]
        self.assertRaises(ValueError, foo, 1, 0)
        def foo2(x, y, z):
            return l[x : y : z]
        self.assertRaises(ValueError, foo2, 1, 3, 0)

    def test_contains(self):
        a = self.type2test(range(15))
        self.assertIn(12, a)
        self.assertTrue(4 in a)
        self.assertTrue(a.__contains__(8))
        self.assertNotIn(42, a)
        self.assertFalse(-3 in a)
        self.assertFalse(a.__contains__(17))
        myList = [1, 2, 3, "foo", 4, 5, True, False]
        self.assertTrue("foo" in myList)
        self.assertTrue(2  in myList)

    def test_listcomprehension(self):
        a = [x*x for x in range(10) if x % 2 == 0]
        self.assertEqual(a, [0, 4, 16, 36, 64])
        b = [x*y for x in range(1,10) for y in range(1,x) if y%2 == 0]
        self.assertEqual(b, [6, 8, 10, 20, 12, 24, 14, 28, 42, 16, 32, 48, 18, 36, 54, 72])
        c = [x*y for x in range(10) if x % 2 == 0 for y in range(10)]
        self.assertEqual(c, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 0, 8, 16, 24, 32, 40, 48, 56, 64, 72])
        d = [x*x for x in range(20) if x > 10 if x % 2 == 0]
        self.assertEqual(d, [144, 196, 256, 324])
        e = [y for x in range(10) for y in range(x)]
        self.assertEqual(e, [0, 0, 1, 0, 1, 2, 0, 1, 2, 3, 0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 6, 0, 1, 2, 3, 4, 5, 6, 7, 0, 1, 2, 3, 4, 5, 6, 7, 8])

    def test_multiplication(self):
        self.assertEqual([5]*10, [5, 5, 5, 5, 5, 5, 5, 5, 5, 5])
        self.assertEqual([1,2,3]*4, [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3])
        self.assertEqual(10*[5], [5, 5, 5, 5, 5, 5, 5, 5, 5, 5])
        self.assertEqual(4*[1,2,3], [1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3])

    def test_comparisons(self):
        l = [1,2,3,1]
        self.assertFalse(l > l)
        self.assertTrue(l >= l)
        self.assertTrue(l == l)
        self.assertFalse(l != l)
        self.assertTrue(l <= l)
        self.assertFalse(l < l)

if __name__ == "__main__":
    unittest.main()
