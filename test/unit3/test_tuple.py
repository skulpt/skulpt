import unittest
import seq_tests
from seq_tests import ALWAYS_EQ, NEVER_EQ

"""
Tests common to tuple, list and UserList.UserList
From Cpython seq_tests.py
"""

# import unittest
import sys
# import pickle
# from test import support
# from test.support import ALWAYS_EQ, NEVER_EQ

# Various iterables
# This is used for checking the constructor (here and in test_deque.py)
def iterfunc(seqn):
    'Regular generator'
    for i in seqn:
        yield i

class Sequence:
    'Sequence using __getitem__'
    def __init__(self, seqn):
        self.seqn = seqn
    def __getitem__(self, i):
        return self.seqn[i]

class IterFunc:
    'Sequence using iterator protocol'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __iter__(self):
        return self
    def __next__(self):
        if self.i >= len(self.seqn): raise StopIteration
        v = self.seqn[self.i]
        self.i += 1
        return v

class IterGen:
    'Sequence using iterator protocol defined with a generator'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __iter__(self):
        for val in self.seqn:
            yield val

class IterNextOnly:
    'Missing __getitem__ and __iter__'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __next__(self):
        if self.i >= len(self.seqn): raise StopIteration
        v = self.seqn[self.i]
        self.i += 1
        return v

class IterNoNext:
    'Iterator missing __next__()'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __iter__(self):
        return self

class IterGenExc:
    'Test propagation of exceptions'
    def __init__(self, seqn):
        self.seqn = seqn
        self.i = 0
    def __iter__(self):
        return self
    def __next__(self):
        3 // 0

class IterFuncStop:
    'Test immediate stop'
    def __init__(self, seqn):
        pass
    def __iter__(self):
        return self
    def __next__(self):
        raise StopIteration

from itertools import chain
def itermulti(seqn):
    'Test multiple tiers of iterators'
    return chain(map(lambda x:x, iterfunc(IterGen(Sequence(seqn)))))

class LyingTuple(tuple):
    def __iter__(self):
        yield 1

class LyingList(list):
    def __iter__(self):
        yield 1

class CommonTest:
    # The type to be tested
    type2test = None

    def test_constructors(self):
        l0 = []
        l1 = [0]
        l2 = [0, 1]

        u = self.type2test()
        u0 = self.type2test(l0)
        u1 = self.type2test(l1)
        u2 = self.type2test(l2)

        uu = self.type2test(u)
        uu0 = self.type2test(u0)
        uu1 = self.type2test(u1)
        uu2 = self.type2test(u2)

        v = self.type2test(tuple(u))
        class OtherSeq:
            def __init__(self, initseq):
                self.__data = initseq
            def __len__(self):
                return len(self.__data)
            def __getitem__(self, i):
                return self.__data[i]
        s = OtherSeq(u0)
        v0 = self.type2test(s)
        self.assertEqual(len(v0), len(s))

        s = "this is also a sequence"
        vv = self.type2test(s)
        self.assertEqual(len(vv), len(s))

        # Create from various iteratables
        for s in ("123", "", range(1000), ('do', 1.2), range(2000,2200,5)):
            for g in (Sequence, IterFunc, IterGen,
                      itermulti, iterfunc):
                self.assertEqual(self.type2test(g(s)), self.type2test(s))
            self.assertEqual(self.type2test(IterFuncStop(s)), self.type2test())
            self.assertEqual(self.type2test(c for c in "123"), self.type2test("123"))
            self.assertRaises(TypeError, self.type2test, IterNextOnly(s))
            self.assertRaises(TypeError, self.type2test, IterNoNext(s))
            self.assertRaises(ZeroDivisionError, self.type2test, IterGenExc(s))

        # Issue #23757
        self.assertEqual(self.type2test(LyingTuple((2,))), self.type2test((1,)))
        self.assertEqual(self.type2test(LyingList([2])), self.type2test([1]))

    def test_truth(self):
        self.assertFalse(self.type2test())
        self.assertTrue(self.type2test([42]))

    def test_getitem(self):
        u = self.type2test([0, 1, 2, 3, 4])
        for i in range(len(u)):
            self.assertEqual(u[i], i)
            self.assertEqual(u[int(i)], i)
        for i in range(-len(u), -1):
            self.assertEqual(u[i], len(u)+i)
            self.assertEqual(u[int(i)], len(u)+i)
        self.assertRaises(IndexError, u.__getitem__, -len(u)-1)
        self.assertRaises(IndexError, u.__getitem__, len(u))
        self.assertRaises(ValueError, u.__getitem__, slice(0,10,0))

        u = self.type2test()
        self.assertRaises(IndexError, u.__getitem__, 0)
        self.assertRaises(IndexError, u.__getitem__, -1)

        self.assertRaises(TypeError, u.__getitem__)

        a = self.type2test([10, 11])
        self.assertEqual(a[0], 10)
        self.assertEqual(a[1], 11)
        self.assertEqual(a[-2], 10)
        self.assertEqual(a[-1], 11)
        self.assertRaises(IndexError, a.__getitem__, -3)
        self.assertRaises(IndexError, a.__getitem__, 3)

    def test_getslice(self):
        l = [0, 1, 2, 3, 4]
        u = self.type2test(l)

        self.assertEqual(u[0:0], self.type2test())
        self.assertEqual(u[1:2], self.type2test([1]))
        self.assertEqual(u[-2:-1], self.type2test([3]))
        self.assertEqual(u[-1000:1000], u)
        self.assertEqual(u[1000:-1000], self.type2test([]))
        self.assertEqual(u[:], u)
        self.assertEqual(u[1:None], self.type2test([1, 2, 3, 4]))
        self.assertEqual(u[None:3], self.type2test([0, 1, 2]))

        # Extended slices
        self.assertEqual(u[::], u)
        self.assertEqual(u[::2], self.type2test([0, 2, 4]))
        self.assertEqual(u[1::2], self.type2test([1, 3]))
        self.assertEqual(u[::-1], self.type2test([4, 3, 2, 1, 0]))
        self.assertEqual(u[::-2], self.type2test([4, 2, 0]))
        self.assertEqual(u[3::-2], self.type2test([3, 1]))
        self.assertEqual(u[3:3:-2], self.type2test([]))
        self.assertEqual(u[3:2:-2], self.type2test([3]))
        self.assertEqual(u[3:1:-2], self.type2test([3]))
        self.assertEqual(u[3:0:-2], self.type2test([3, 1]))
        self.assertEqual(u[::-100], self.type2test([4]))
        self.assertEqual(u[100:-100:], self.type2test([]))
        self.assertEqual(u[-100:100:], u)
        self.assertEqual(u[100:-100:-1], u[::-1])
        self.assertEqual(u[-100:100:-1], self.type2test([]))
        self.assertEqual(u[-100:100:2], self.type2test([0, 2, 4]))

        # Test extreme cases with long ints
        a = self.type2test([0,1,2,3,4])
        self.assertEqual(a[ -pow(2,128): 3 ], self.type2test([0,1,2]))
        self.assertEqual(a[ 3: pow(2,145) ], self.type2test([3,4]))
        self.assertEqual(a[3::sys.maxsize], self.type2test([3]))

    def test_contains(self):
        u = self.type2test([0, 1, 2])
        for i in u:
            self.assertIn(i, u)
        for i in min(u)-1, max(u)+1:
            self.assertNotIn(i, u)

        self.assertRaises(TypeError, u.__contains__)

    def test_contains_fake(self):
        # Sequences must use rich comparison against each item
        # (unless "is" is true, or an earlier item answered)
        # So ALWAYS_EQ must be found in all non-empty sequences.
        self.assertNotIn(ALWAYS_EQ, self.type2test([]))
        self.assertIn(ALWAYS_EQ, self.type2test([1]))
        self.assertIn(1, self.type2test([ALWAYS_EQ]))
        self.assertNotIn(NEVER_EQ, self.type2test([]))
        self.assertNotIn(ALWAYS_EQ, self.type2test([NEVER_EQ]))
        self.assertIn(NEVER_EQ, self.type2test([ALWAYS_EQ]))

    def test_contains_order(self):
        # Sequences must test in-order.  If a rich comparison has side
        # effects, these will be visible to tests against later members.
        # In this test, the "side effect" is a short-circuiting raise.
        class DoNotTestEq(Exception):
            pass
        class StopCompares:
            def __eq__(self, other):
                raise DoNotTestEq

        checkfirst = self.type2test([1, StopCompares()])
        self.assertIn(1, checkfirst)
        checklast = self.type2test([StopCompares(), 1])
        self.assertRaises(DoNotTestEq, checklast.__contains__, 1)

    def test_len(self):
        self.assertEqual(len(self.type2test()), 0)
        self.assertEqual(len(self.type2test([])), 0)
        self.assertEqual(len(self.type2test([0])), 1)
        self.assertEqual(len(self.type2test([0, 1, 2])), 3)

    def test_minmax(self):
        u = self.type2test([0, 1, 2])
        self.assertEqual(min(u), 0)
        self.assertEqual(max(u), 2)

    def test_addmul(self):
        u1 = self.type2test([0])
        u2 = self.type2test([0, 1])
        self.assertEqual(u1, u1 + self.type2test())
        self.assertEqual(u1, self.type2test() + u1)
        self.assertEqual(u1 + self.type2test([1]), u2)
        self.assertEqual(self.type2test([-1]) + u1, self.type2test([-1, 0]))
        self.assertEqual(self.type2test(), u2*0)
        self.assertEqual(self.type2test(), 0*u2)
        self.assertEqual(self.type2test(), u2*0)
        self.assertEqual(self.type2test(), 0*u2)
        self.assertEqual(u2, u2*1)
        self.assertEqual(u2, 1*u2)
        self.assertEqual(u2, u2*1)
        self.assertEqual(u2, 1*u2)
        self.assertEqual(u2+u2, u2*2)
        self.assertEqual(u2+u2, 2*u2)
        self.assertEqual(u2+u2, u2*2)
        self.assertEqual(u2+u2, 2*u2)
        self.assertEqual(u2+u2+u2, u2*3)
        self.assertEqual(u2+u2+u2, 3*u2)

        class subclass(self.type2test):
            pass
        u3 = subclass([0, 1])
        self.assertEqual(u3, u3*1)
        self.assertIsNot(u3, u3*1)

    def test_iadd(self):
        u = self.type2test([0, 1])
        u += self.type2test()
        self.assertEqual(u, self.type2test([0, 1]))
        u += self.type2test([2, 3])
        self.assertEqual(u, self.type2test([0, 1, 2, 3]))
        u += self.type2test([4, 5])
        self.assertEqual(u, self.type2test([0, 1, 2, 3, 4, 5]))

        u = self.type2test("spam")
        u += self.type2test("eggs")
        self.assertEqual(u, self.type2test("spameggs"))

    def test_imul(self):
        u = self.type2test([0, 1])
        u *= 3
        self.assertEqual(u, self.type2test([0, 1, 0, 1, 0, 1]))
        u *= 0
        self.assertEqual(u, self.type2test([]))

    def test_getitemoverwriteiter(self):
        # Verify that __getitem__ overrides are not recognized by __iter__
        class T(self.type2test):
            def __getitem__(self, key):
                return str(key) + '!!!'
        self.assertEqual(next(iter(T((1,2)))), 1)

    def test_repeat(self):
        for m in range(4):
            s = tuple(range(m))
            for n in range(-3, 5):
                self.assertEqual(self.type2test(s*n), self.type2test(s)*n)
            self.assertEqual(self.type2test(s)*(-4), self.type2test([]))
            self.assertEqual(id(s), id(s*1))

    def test_bigrepeat(self):
        if sys.maxsize <= 2147483647:
            x = self.type2test([0])
            x *= 2**16
            self.assertRaises(MemoryError, x.__mul__, 2**16)
            if hasattr(x, '__imul__'):
                self.assertRaises(MemoryError, x.__imul__, 2**16)

    def test_subscript(self):
        a = self.type2test([10, 11])
        self.assertEqual(a.__getitem__(0), 10)
        self.assertEqual(a.__getitem__(1), 11)
        self.assertEqual(a.__getitem__(-2), 10)
        self.assertEqual(a.__getitem__(-1), 11)
        self.assertRaises(IndexError, a.__getitem__, -3)
        self.assertRaises(IndexError, a.__getitem__, 3)
        self.assertEqual(a.__getitem__(slice(0,1)), self.type2test([10]))
        self.assertEqual(a.__getitem__(slice(1,2)), self.type2test([11]))
        self.assertEqual(a.__getitem__(slice(0,2)), self.type2test([10, 11]))
        self.assertEqual(a.__getitem__(slice(0,3)), self.type2test([10, 11]))
        self.assertEqual(a.__getitem__(slice(3,5)), self.type2test([]))
        self.assertRaises(ValueError, a.__getitem__, slice(0, 10, 0))
        self.assertRaises(TypeError, a.__getitem__, 'x')

    def test_count(self):
        a = self.type2test([0, 1, 2])*3
        self.assertEqual(a.count(0), 3)
        self.assertEqual(a.count(1), 3)
        self.assertEqual(a.count(3), 0)

        self.assertEqual(a.count(ALWAYS_EQ), 9)
        self.assertEqual(self.type2test([ALWAYS_EQ, ALWAYS_EQ]).count(1), 2)
        self.assertEqual(self.type2test([ALWAYS_EQ, ALWAYS_EQ]).count(NEVER_EQ), 2)
        self.assertEqual(self.type2test([NEVER_EQ, NEVER_EQ]).count(ALWAYS_EQ), 0)

        self.assertRaises(TypeError, a.count)

        class BadExc(Exception):
            pass

        class BadCmp:
            def __eq__(self, other):
                if other == 2:
                    raise BadExc()
                return False

        self.assertRaises(BadExc, a.count, BadCmp())

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

        self.assertEqual(u.index(ALWAYS_EQ), 0)
        self.assertEqual(self.type2test([ALWAYS_EQ, ALWAYS_EQ]).index(1), 0)
        self.assertEqual(self.type2test([ALWAYS_EQ, ALWAYS_EQ]).index(NEVER_EQ), 0)
        self.assertRaises(ValueError, self.type2test([NEVER_EQ, NEVER_EQ]).index, ALWAYS_EQ)

        self.assertRaises(TypeError, u.index)

        class BadExc(Exception):
            pass

        class BadCmp:
            def __eq__(self, other):
                if other == 2:
                    raise BadExc()
                return False

        a = self.type2test([0, 1, 2, 3])
        self.assertRaises(BadExc, a.index, BadCmp())

        a = self.type2test([-2, -1, 0, 0, 1, 2])
        self.assertEqual(a.index(0), 2)
        self.assertEqual(a.index(0, 2), 2)
        self.assertEqual(a.index(0, -4), 2)
        self.assertEqual(a.index(-2, -10), 0)
        self.assertEqual(a.index(0, 3), 3)
        self.assertEqual(a.index(0, -3), 3)
        self.assertEqual(a.index(0, 3, 4), 3)
        self.assertEqual(a.index(0, -3, -2), 3)
        self.assertEqual(a.index(0, -4*sys.maxsize, 4*sys.maxsize), 2)
        self.assertRaises(ValueError, a.index, 0, 4*sys.maxsize,-4*sys.maxsize)
        self.assertRaises(ValueError, a.index, 2, 0, -10)

    # def test_pickle(self):
    #     lst = self.type2test([4, 5, 6, 7])
    #     for proto in range(pickle.HIGHEST_PROTOCOL + 1):
    #         lst2 = pickle.loads(pickle.dumps(lst, proto))
    #         self.assertEqual(lst2, lst)
    #         self.assertNotEqual(id(lst2), id(lst))

    # def test_free_after_iterating(self):
    #     support.check_free_after_iterating(self, iter, self.type2test)
    #     support.check_free_after_iterating(self, reversed, self.type2test)


"""
From Cpython test_tuple.py

"""

# from test import support, seq_tests
import unittest

# import gc
# import pickle

# For tuple hashes, we normally only run a test to ensure that we get
# the same results across platforms in a handful of cases.  If that's
# so, there's no real point to running more.  Set RUN_ALL_HASH_TESTS to
# run more anyway.  That's usually of real interest only when analyzing,
# or changing, the hash algorithm.  In which case it's usually also
# most useful to set JUST_SHOW_HASH_RESULTS, to see all the results
# instead of wrestling with test "failures".  See the bottom of the
# file for extensive notes on what we're testing here and why.
RUN_ALL_HASH_TESTS = False
JUST_SHOW_HASH_RESULTS = False # if RUN_ALL_HASH_TESTS, just display

class TupleTest(seq_tests.CommonTest, unittest.TestCase):
    type2test = tuple

    def test_getitem_error(self):
        t = ()
        msg = "tuple indices must be integers or slices"
        with self.assertRaises(TypeError) as c:
            t['a']
        self.assertIn(msg, c.exception.args[0])

    def test_constructors(self):
        super().test_constructors()
        # calling built-in types without argument must return empty
        self.assertEqual(tuple(), ())
        t0_3 = (0, 1, 2, 3)
        t0_3_bis = tuple(t0_3)
        self.assertTrue(t0_3 is t0_3_bis)
        self.assertEqual(tuple([]), ())
        self.assertEqual(tuple([0, 1, 2, 3]), (0, 1, 2, 3))
        self.assertEqual(tuple(''), ())
        self.assertEqual(tuple('spam'), ('s', 'p', 'a', 'm'))
        self.assertEqual(tuple(x for x in range(10) if x % 2),
                         (1, 3, 5, 7, 9))

    def test_keyword_args(self):
        with self.assertRaises(TypeError) as c:
            tuple(sequence=())
        self.assertIn('keyword argument', c.exception.args[0])

    def test_truth(self):
        super().test_truth()
        self.assertTrue(not ())
        self.assertTrue((42, ))

    def test_len(self):
        super().test_len()
        self.assertEqual(len(()), 0)
        self.assertEqual(len((0,)), 1)
        self.assertEqual(len((0, 1, 2)), 3)

    def test_iadd(self):
        super().test_iadd()
        u = (0, 1)
        u2 = u
        u += (2, 3)
        self.assertTrue(u is not u2)

    def test_imul(self):
        super().test_imul()
        u = (0, 1)
        u2 = u
        u *= 3
        self.assertTrue(u is not u2)

    def test_tupleresizebug(self):
        # Check that a specific bug in _PyTuple_Resize() is squashed.
        def f():
            for i in range(1000):
                yield i
        self.assertEqual(list(tuple(f())), list(range(1000)))

    # We expect tuples whose base components have deterministic hashes to
    # have deterministic hashes too - and, indeed, the same hashes across
    # platforms with hash codes of the same bit width.
    # Skulpt @TODO imporove tuple hash function

    # def test_hash_exact(self):
    #     def check_one_exact(t, e32, e64):
    #         got = hash(t)
    #         expected = e32 #if support.NHASHBITS == 32 else e64
    #         if got != expected:
    #             msg = f"FAIL hash({t!r}) == {got} != {expected}"
    #             self.fail(msg)

    #     check_one_exact((), 750394483, 5740354900026072187)
    #     check_one_exact((0,), 1214856301, -8753497827991233192)
    #     check_one_exact((0, 0), -168982784, -8458139203682520985)
    #     check_one_exact((0.5,), 2077348973, -408149959306781352)
    #     check_one_exact((0.5, (), (-2, 3, (4, 6))), 714642271,
    #                     -1845940830829704396)

    # # Various tests for hashing of tuples to check that we get few collisions.
    # # Does something only if RUN_ALL_HASH_TESTS is true.
    # #
    # # Earlier versions of the tuple hash algorithm had massive collisions
    # # reported at:
    # # - https://bugs.python.org/issue942952
    # # - https://bugs.python.org/issue34751
    # def test_hash_optional(self):
    #     from itertools import product

    #     if not RUN_ALL_HASH_TESTS:
    #         return

    #     # If specified, `expected` is a 2-tuple of expected
    #     # (number_of_collisions, pileup) values, and the test fails if
    #     # those aren't the values we get.  Also if specified, the test
    #     # fails if z > `zlimit`.
    #     def tryone_inner(tag, nbins, hashes, expected=None, zlimit=None):
    #         from collections import Counter

    #         nballs = len(hashes)
    #         mean, sdev = support.collision_stats(nbins, nballs)
    #         c = Counter(hashes)
    #         collisions = nballs - len(c)
    #         z = (collisions - mean) / sdev
    #         pileup = max(c.values()) - 1
    #         del c
    #         got = (collisions, pileup)
    #         failed = False
    #         prefix = ""
    #         if zlimit is not None and z > zlimit:
    #             failed = True
    #             prefix = f"FAIL z > {zlimit}; "
    #         if expected is not None and got != expected:
    #             failed = True
    #             prefix += f"FAIL {got} != {expected}; "
    #         if failed or JUST_SHOW_HASH_RESULTS:
    #             msg = f"{prefix}{tag}; pileup {pileup:,} mean {mean:.1f} "
    #             msg += f"coll {collisions:,} z {z:+.1f}"
    #             if JUST_SHOW_HASH_RESULTS:
    #                 import sys
    #                 print(msg, file=sys.__stdout__)
    #             else:
    #                 self.fail(msg)

    #     def tryone(tag, xs,
    #                native32=None, native64=None, hi32=None, lo32=None,
    #                zlimit=None):
    #         NHASHBITS = support.NHASHBITS
    #         hashes = list(map(hash, xs))
    #         tryone_inner(tag + f"; {NHASHBITS}-bit hash codes",
    #                      1 << NHASHBITS,
    #                      hashes,
    #                      native32 if NHASHBITS == 32 else native64,
    #                      zlimit)

    #         if NHASHBITS > 32:
    #             shift = NHASHBITS - 32
    #             tryone_inner(tag + "; 32-bit upper hash codes",
    #                          1 << 32,
    #                          [h >> shift for h in hashes],
    #                          hi32,
    #                          zlimit)

    #             mask = (1 << 32) - 1
    #             tryone_inner(tag + "; 32-bit lower hash codes",
    #                          1 << 32,
    #                          [h & mask for h in hashes],
    #                          lo32,
    #                          zlimit)

    #     # Tuples of smallish positive integers are common - nice if we
    #     # get "better than random" for these.
    #     tryone("range(100) by 3", list(product(range(100), repeat=3)),
    #            (0, 0), (0, 0), (4, 1), (0, 0))

    #     # A previous hash had systematic problems when mixing integers of
    #     # similar magnitude but opposite sign, obscurely related to that
    #     # j ^ -2 == -j when j is odd.
    #     cands = list(range(-10, -1)) + list(range(9))

    #     # Note:  -1 is omitted because hash(-1) == hash(-2) == -2, and
    #     # there's nothing the tuple hash can do to avoid collisions
    #     # inherited from collisions in the tuple components' hashes.
    #     tryone("-10 .. 8 by 4", list(product(cands, repeat=4)),
    #            (0, 0), (0, 0), (0, 0), (0, 0))
    #     del cands

    #     # The hashes here are a weird mix of values where all the
    #     # variation is in the lowest bits and across a single high-order
    #     # bit - the middle bits are all zeroes. A decent hash has to
    #     # both propagate low bits to the left and high bits to the
    #     # right.  This is also complicated a bit in that there are
    #     # collisions among the hashes of the integers in L alone.
    #     L = [n << 60 for n in range(100)]
    #     tryone("0..99 << 60 by 3", list(product(L, repeat=3)),
    #            (0, 0), (0, 0), (0, 0), (324, 1))
    #     del L

    #     # Used to suffer a massive number of collisions.
    #     tryone("[-3, 3] by 18", list(product([-3, 3], repeat=18)),
    #            (7, 1), (0, 0), (7, 1), (6, 1))

    #     # And even worse.  hash(0.5) has only a single bit set, at the
    #     # high end. A decent hash needs to propagate high bits right.
    #     tryone("[0, 0.5] by 18", list(product([0, 0.5], repeat=18)),
    #            (5, 1), (0, 0), (9, 1), (12, 1))

    #     # Hashes of ints and floats are the same across platforms.
    #     # String hashes vary even on a single platform across runs, due
    #     # to hash randomization for strings.  So we can't say exactly
    #     # what this should do.  Instead we insist that the # of
    #     # collisions is no more than 4 sdevs above the theoretically
    #     # random mean.  Even if the tuple hash can't achieve that on its
    #     # own, the string hash is trying to be decently pseudo-random
    #     # (in all bit positions) on _its_ own.  We can at least test
    #     # that the tuple hash doesn't systematically ruin that.
    #     tryone("4-char tuples",
    #            list(product("abcdefghijklmnopqrstuvwxyz", repeat=4)),
    #            zlimit=4.0)

    #     # The "old tuple test".  See https://bugs.python.org/issue942952.
    #     # Ensures, for example, that the hash:
    #     #   is non-commutative
    #     #   spreads closely spaced values
    #     #   doesn't exhibit cancellation in tuples like (x,(x,y))
    #     N = 50
    #     base = list(range(N))
    #     xp = list(product(base, repeat=2))
    #     inps = base + list(product(base, xp)) + \
    #                  list(product(xp, base)) + xp + list(zip(base))
    #     tryone("old tuple test", inps,
    #            (2, 1), (0, 0), (52, 49), (7, 1))
    #     del base, xp, inps

    #     # The "new tuple test".  See https://bugs.python.org/issue34751.
    #     # Even more tortured nesting, and a mix of signed ints of very
    #     # small magnitude.
    #     n = 5
    #     A = [x for x in range(-n, n+1) if x != -1]
    #     B = A + [(a,) for a in A]
    #     L2 = list(product(A, repeat=2))
    #     L3 = L2 + list(product(A, repeat=3))
    #     L4 = L3 + list(product(A, repeat=4))
    #     # T = list of testcases. These consist of all (possibly nested
    #     # at most 2 levels deep) tuples containing at most 4 items from
    #     # the set A.
    #     T = A
    #     T += [(a,) for a in B + L4]
    #     T += product(L3, B)
    #     T += product(L2, repeat=2)
    #     T += product(B, L3)
    #     T += product(B, B, L2)
    #     T += product(B, L2, B)
    #     T += product(L2, B, B)
    #     T += product(B, repeat=4)
    #     assert len(T) == 345130
    #     tryone("new tuple test", T,
    #            (9, 1), (0, 0), (21, 5), (6, 1))

    def test_repr(self):
        l0 = tuple()
        l2 = (0, 1, 2)
        a0 = self.type2test(l0)
        a2 = self.type2test(l2)

        self.assertEqual(str(a0), repr(l0))
        self.assertEqual(str(a2), repr(l2))
        self.assertEqual(repr(a0), "()")
        self.assertEqual(repr(a2), "(0, 1, 2)")

    # def _not_tracked(self, t):
    #     # Nested tuples can take several collections to untrack
    #     gc.collect()
    #     gc.collect()
    #     self.assertFalse(gc.is_tracked(t), t)

    # def _tracked(self, t):
    #     self.assertTrue(gc.is_tracked(t), t)
    #     gc.collect()
    #     gc.collect()
    #     self.assertTrue(gc.is_tracked(t), t)

    # @support.cpython_only
    # def test_track_literals(self):
    #     # Test GC-optimization of tuple literals
    #     x, y, z = 1.5, "a", []

    #     self._not_tracked(())
    #     self._not_tracked((1,))
    #     self._not_tracked((1, 2))
    #     self._not_tracked((1, 2, "a"))
    #     self._not_tracked((1, 2, (None, True, False, ()), int))
    #     self._not_tracked((object(),))
    #     self._not_tracked(((1, x), y, (2, 3)))

    #     # Tuples with mutable elements are always tracked, even if those
    #     # elements are not tracked right now.
    #     self._tracked(([],))
    #     self._tracked(([1],))
    #     self._tracked(({},))
    #     self._tracked((set(),))
    #     self._tracked((x, y, z))

    # def check_track_dynamic(self, tp, always_track):
    #     x, y, z = 1.5, "a", []

    #     check = self._tracked if always_track else self._not_tracked
    #     check(tp())
    #     check(tp([]))
    #     check(tp(set()))
    #     check(tp([1, x, y]))
    #     check(tp(obj for obj in [1, x, y]))
    #     check(tp(set([1, x, y])))
    #     check(tp(tuple([obj]) for obj in [1, x, y]))
    #     check(tuple(tp([obj]) for obj in [1, x, y]))

    #     self._tracked(tp([z]))
    #     self._tracked(tp([[x, y]]))
    #     self._tracked(tp([{x: y}]))
    #     self._tracked(tp(obj for obj in [x, y, z]))
    #     self._tracked(tp(tuple([obj]) for obj in [x, y, z]))
    #     self._tracked(tuple(tp([obj]) for obj in [x, y, z]))

    # @support.cpython_only
    # def test_track_dynamic(self):
    #     # Test GC-optimization of dynamically constructed tuples.
    #     self.check_track_dynamic(tuple, False)

    # @support.cpython_only
    # def test_track_subtypes(self):
    #     # Tuple subtypes must always be tracked
    #     class MyTuple(tuple):
    #         pass
    #     self.check_track_dynamic(MyTuple, True)

    # @support.cpython_only
    # def test_bug7466(self):
    #     # Trying to untrack an unfinished tuple could crash Python
    #     self._not_tracked(tuple(gc.collect() for i in range(101)))

    def test_repr_large(self):
        # Check the repr of large list objects
        def check(n):
            l = (0,) * n
            s = repr(l)
            self.assertEqual(s,
                '(' + ', '.join(['0'] * n) + ')')
        check(10)       # check our checking code
        check(1000000)

    # def test_iterator_pickle(self):
    #     # Userlist iterators don't support pickling yet since
    #     # they are based on generators.
    #     data = self.type2test([4, 5, 6, 7])
    #     for proto in range(pickle.HIGHEST_PROTOCOL + 1):
    #         itorg = iter(data)
    #         d = pickle.dumps(itorg, proto)
    #         it = pickle.loads(d)
    #         self.assertEqual(type(itorg), type(it))
    #         self.assertEqual(self.type2test(it), self.type2test(data))

    #         it = pickle.loads(d)
    #         next(it)
    #         d = pickle.dumps(it, proto)
    #         self.assertEqual(self.type2test(it), self.type2test(data)[1:])

    # def test_reversed_pickle(self):
    #     data = self.type2test([4, 5, 6, 7])
    #     for proto in range(pickle.HIGHEST_PROTOCOL + 1):
    #         itorg = reversed(data)
    #         d = pickle.dumps(itorg, proto)
    #         it = pickle.loads(d)
    #         self.assertEqual(type(itorg), type(it))
    #         self.assertEqual(self.type2test(it), self.type2test(reversed(data)))

    #         it = pickle.loads(d)
    #         next(it)
    #         d = pickle.dumps(it, proto)
    #         self.assertEqual(self.type2test(it), self.type2test(reversed(data))[1:])

    def test_no_comdat_folding(self):
        # Issue 8847: In the PGO build, the MSVC linker's COMDAT folding
        # optimization causes failures in code that relies on distinct
        # function addresses.
        class T(tuple): pass
        with self.assertRaises(TypeError):
            [3,] + T((1,2))

    def test_lexicographic_ordering(self):
        # Issue 21100
        a = self.type2test([1, 2])
        b = self.type2test([1, 2, 0])
        c = self.type2test([1, 3])
        self.assertLess(a, b)
        self.assertLess(b, c)

# Notes on testing hash codes.  The primary thing is that Python doesn't
# care about "random" hash codes.  To the contrary, we like them to be
# very regular when possible, so that the low-order bits are as evenly
# distributed as possible.  For integers this is easy: hash(i) == i for
# all not-huge i except i==-1.
#
# For tuples of mixed type there's really no hope of that, so we want
# "randomish" here instead.  But getting close to pseudo-random in all
# bit positions is more expensive than we've been willing to pay for.
#
# We can tolerate large deviations from random - what we don't want is
# catastrophic pileups on a relative handful of hash codes.  The dict
# and set lookup routines remain effective provided that full-width hash
# codes for not-equal objects are distinct.
#
# So we compute various statistics here based on what a "truly random"
# hash would do, but don't automate "pass or fail" based on those
# results.  Instead those are viewed as inputs to human judgment, and the
# automated tests merely ensure we get the _same_ results across
# platforms.  In fact, we normally don't bother to run them at all -
# set RUN_ALL_HASH_TESTS to force it.
#
# When global JUST_SHOW_HASH_RESULTS is True, the tuple hash statistics
# are just displayed to stdout.  A typical output line looks like:
#
# old tuple test; 32-bit upper hash codes; \
#             pileup 49 mean 7.4 coll 52 z +16.4
#
# "old tuple test" is just a string name for the test being run.
#
# "32-bit upper hash codes" means this was run under a 64-bit build and
# we've shifted away the lower 32 bits of the hash codes.
#
# "pileup" is 0 if there were no collisions across those hash codes.
# It's 1 less than the maximum number of times any single hash code was
# seen.  So in this case, there was (at least) one hash code that was
# seen 50 times:  that hash code "piled up" 49 more times than ideal.
#
# "mean" is the number of collisions a perfectly random hash function
# would have yielded, on average.
#
# "coll" is the number of collisions actually seen.
#
# "z" is "coll - mean" divided by the standard deviation of the number
# of collisions a perfectly random hash function would suffer.  A
# positive value is "worse than random", and negative value "better than
# random".  Anything of magnitude greater than 3 would be highly suspect
# for a hash function that claimed to be random.  It's essentially
# impossible that a truly random function would deliver a result 16.4
# sdevs "worse than random".
#
# But we don't care here!  That's why the test isn't coded to fail.
# Knowing something about how the high-order hash code bits behave
# provides insight, but is irrelevant to how the dict and set lookup
# code performs.  The low-order bits are much more important to that,
# and on the same test those did "just like random":
#
# old tuple test; 32-bit lower hash codes; \
#            pileup 1 mean 7.4 coll 7 z -0.2
#
# So there are always tradeoffs to consider.  For another:
#
# 0..99 << 60 by 3; 32-bit hash codes; \
#            pileup 0 mean 116.4 coll 0 z -10.8
#
# That was run under a 32-bit build, and is spectacularly "better than
# random".  On a 64-bit build the wider hash codes are fine too:
#
# 0..99 << 60 by 3; 64-bit hash codes; \
#             pileup 0 mean 0.0 coll 0 z -0.0
#
# but their lower 32 bits are poor:
#
# 0..99 << 60 by 3; 32-bit lower hash codes; \
#             pileup 1 mean 116.4 coll 324 z +19.2
#
# In a statistical sense that's waaaaay too many collisions, but (a) 324
# collisions out of a million hash codes isn't anywhere near being a
# real problem; and, (b) the worst pileup on a single hash code is a measly
# 1 extra.  It's a relatively poor case for the tuple hash, but still
# fine for practical use.
#
# This isn't, which is what Python 3.7.1 produced for the hashes of
# itertools.product([0, 0.5], repeat=18).  Even with a fat 64-bit
# hashcode, the highest pileup was over 16,000 - making a dict/set
# lookup on one of the colliding values thousands of times slower (on
# average) than we expect.
#
# [0, 0.5] by 18; 64-bit hash codes; \
#            pileup 16,383 mean 0.0 coll 262,128 z +6073641856.9
# [0, 0.5] by 18; 32-bit lower hash codes; \
#            pileup 262,143 mean 8.0 coll 262,143 z +92683.6

if __name__ == "__main__":
    unittest.main()
