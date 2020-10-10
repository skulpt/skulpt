import unittest
import random
import sys
import math
from operator import neg

def add_one(num):
    """function for testing"""
    if num != 2 and num != 6.0 and num != -151.5:
        return num + 1

str1 = 'ABCD'
str2 = 'xy'
str3 = 'ABCDE'
str4 = 'abcde'
lst1 = [1, 2, 3, 4, 5]
lst2 = [2, 4, 6, 8, 10]
lst3 = [-150, -151, -151.49, -151.50000, -151.500001, -152.0]
gen1 = (letter for letter in str4)
gen2 = (num for num in lst1)

class Squares:
    """class for testing, creates list of squares from 0 to i - 1"""

    def __init__(self, max):
        self.max = max
        self.sofar = []

    def __len__(self): return len(self.sofar)

    def __getitem__(self, i):
        if not 0 <= i < self.max: raise IndexError
        n = len(self.sofar)
        while n <= i:
            self.sofar.append(n*n)
            n += 1
        return self.sofar[i]

class BitBucket:
    def write(self, line):
        pass

class TestFailingBool:
    def __bool__(self):
        raise RuntimeError

class TestFailingIter:
    def __iter__(self):
        raise RuntimeError

def filter_char(arg):
    return ord(arg) > ord("d")

def map_char(arg):
    return chr(ord(arg) + 1)

class AttrTest(unittest.TestCase):

    def test_range_contains(self):
        self.assertEqual(10 in range(11), True)
        self.assertEqual(-4 in range(-10, -1), True)
        self.assertEqual(1000000 in range(0, 1000001, 10), True)
        self.assertEqual(range(-5, 0).__contains__(-3), True)
        self.assertEqual(range(1000).__contains__(782), True)
        self.assertEqual(range(-1, -8, -2).__contains__(-7), True)


    # def test_generator_next(self):
    #     self.assertRaises(AttributeError, lambda: gen1.next())
    #     self.assertRaises(AttributeError, lambda: gen2.next())


class BuiltinTest(unittest.TestCase):

    def test_abs(self):
        # int
        self.assertEqual(abs(0), 0)
        self.assertEqual(abs(1234), 1234)
        self.assertEqual(abs(-1234), 1234)
        self.assertTrue(abs(-sys.maxsize-1) > 0)
        # float
        self.assertEqual(abs(0.0), 0.0)
        self.assertEqual(abs(3.14), 3.14)
        self.assertEqual(abs(-3.14), 3.14)
        # # str
        # self.assertRaises(TypeError, abs, 'a')
        # bool
        self.assertEqual(abs(True), 1)
        self.assertEqual(abs(False), 0)
        # other
        # self.assertRaises(TypeError, abs)
        # self.assertRaises(TypeError, abs, None)
        class AbsClass(object):
            def __abs__(self):
                return -5
        self.assertEqual(abs(AbsClass()), -5)

    def test_all(self):
        self.assertEqual(all([2, 4, 6]), True)
        self.assertEqual(all([2, None, 6]), False)
        self.assertTrue(all([1,2,3]))
        self.assertFalse(all([1,2,0]))
        self.assertTrue(all(('a','b','c')))
        self.assertFalse(all(('a','','c')))
        self.assertFalse(all([0,False,1,True]))
        self.assertFalse(all({0:True,1:False}))
        # self.assertRaises(RuntimeError, all, [2, TestFailingBool(), 6])
        self.assertRaises(RuntimeError, all, TestFailingIter())
        self.assertRaises(TypeError, all, 10)               # Non-iterable
        self.assertRaises(TypeError, all)                   # No args
        self.assertRaises(TypeError, all, [2, 4, 6], [])    # Too many args
        self.assertEqual(all([]), True)                     # Empty iterator
        self.assertEqual(all([0, TestFailingBool()]), False)# Short-circuit
        S = [50, 60]
        self.assertEqual(all(x > 42 for x in S), True)
        S = [50, 40, 60]
        self.assertEqual(all(x > 42 for x in S), False)

    def test_any(self):
        self.assertEqual(any([None, None, None]), False)
        self.assertEqual(any([None, 4, None]), True)
        self.assertTrue(any([1,2,0]))
        self.assertFalse(any(["","",""]))
        self.assertTrue(any(('a','','c')))
        self.assertFalse(any([]))
        self.assertTrue(any([True,1,5.0,-33,'hello',(3,4,5),[-6,7,10.0],{17:'true',-11:True},False]))
        self.assertFalse(any([None,False,0,0.0,'',(),[],{}]))
        self.assertFalse(any((0,0.0,)))
        self.assertFalse(any({0:False,0.0:None}))
        # self.assertRaises(RuntimeError, any, [None, TestFailingBool(), 6])
        self.assertRaises(RuntimeError, any, TestFailingIter())
        self.assertRaises(TypeError, any, 10)               # Non-iterable
        self.assertRaises(TypeError, any)                   # No args
        self.assertRaises(TypeError, any, [2, 4, 6], [])    # Too many args
        self.assertEqual(any([]), False)                    # Empty iterator
        self.assertEqual(any([1, TestFailingBool()]), True) # Short-circuit
        S = [40, 60, 30]
        self.assertEqual(any(x > 42 for x in S), True)
        S = [10, 20, 30]
        self.assertEqual(any(x > 42 for x in S), False)

    # def test_ascii(self):
    #     self.assertEqual(ascii(''), '\'\'')
    #     self.assertEqual(ascii(0), '0')
    #     self.assertEqual(ascii(()), '()')
    #     self.assertEqual(ascii([]), '[]')
    #     self.assertEqual(ascii({}), '{}')
    #     a = []
    #     a.append(a)
    #     self.assertEqual(ascii(a), '[[...]]')
    #     a = {}
    #     a[0] = a
    #     self.assertEqual(ascii(a), '{0: {...}}')
    #     # Advanced checks for unicode strings
    #     def _check_uni(s):
    #         self.assertEqual(ascii(s), repr(s))
    #     _check_uni("'")
    #     _check_uni('"')
    #     _check_uni('"\'')
    #     _check_uni('\0')
    #     _check_uni('\r\n\t .')
    #     # Unprintable non-ASCII characters
    #     _check_uni('\x85')
    #     _check_uni('\u1fff')
    #     _check_uni('\U00012fff')
    #     # Lone surrogates
    #     _check_uni('\ud800')
    #     _check_uni('\udfff')
    #     # Issue #9804: surrogates should be joined even for printable
    #     # wide characters (UCS-2 builds).
    #     self.assertEqual(ascii('\U0001d121'), "'\\U0001d121'")
    #     # All together
    #     s = "'\0\"\n\r\t abcd\x85é\U00012fff\uD800\U0001D121xxx."
    #     self.assertEqual(ascii(s),
    #         r"""'\'\x00"\n\r\t abcd\x85\xe9\U00012fff\ud800\U0001d121xxx.'""")

    def test_bin(self):
        self.assertEqual(bin(0), '0b0')
        self.assertEqual(bin(1), '0b1')
        self.assertEqual(bin(-1), '-0b1')
        self.assertEqual(bin(2**65), '0b1' + '0' * 65)
        self.assertEqual(bin(2**65-1), '0b' + '1' * 65)
        self.assertEqual(bin(-(2**65)), '-0b1' + '0' * 65)
        self.assertEqual(bin(-(2**65-1)), '-0b' + '1' * 65)
        self.assertEqual(str(0b1010), '10')

    def test_callable(self):
        self.assertTrue(callable(len))
        self.assertFalse(callable("a"))
        self.assertTrue(callable(callable))
        self.assertTrue(callable(lambda x, y: x + y))
        # self.assertFalse(callable(__builtins__))
        def f(): pass
        self.assertTrue(callable(f))

        class C1:
            def meth(self): pass
        self.assertTrue(callable(C1))
        c = C1()
        self.assertTrue(callable(c.meth))
        self.assertFalse(callable(c))

    def test_chr(self):
        self.assertEqual(chr(97), 'a')
        # self.assertEqual(chr(1114111), '􏿿')
        # self.assertEqual(chr(256), 'Ā')
        self.assertEqual(chr(255), 'ÿ')
        self.assertRaises(ValueError, chr, -3)

    def test_ord(self):
        self.assertEqual(ord('H'), 72)
        self.assertEqual(ord('h'), 104)
        self.assertEqual(ord('e'), 101)
        self.assertEqual(ord('!'), 33)
        correct = True
        for x in range(256):
            if x != ord(chr(x)):
                correct = False
        self.assertTrue(correct)

    # def test_construct_singletons(self):
    #     for const in None, Ellipsis, NotImplemented:
    #         tp = type(const)
    #         self.assertIs(tp(), const)
    #         self.assertRaises(TypeError, tp, 1, 2)
    #         self.assertRaises(TypeError, tp, a=1, b=2)

    def test_delattr(self):
        sys.spam = 1
        delattr(sys, 'spam')
        self.assertRaises(TypeError, delattr)

    def test_dir(self):
        # dir(wrong number of arguments)
        self.assertRaises(TypeError, dir, 42, 42)

        # dir() - local scope
        local_var = 1
        # self.assertIn('local_var', dir())

        # dir(module)
        # self.assertIn('exit', dir(sys))

        # dir(module_with_invalid__dict__)
        # class Foo(types.ModuleType):
        #     __dict__ = 8
        # f = Foo("foo")
        # self.assertRaises(TypeError, dir, f)

        # dir(type)
        # self.assertIn("strip", dir(str))
        self.assertNotIn("__mro__", dir(str))

        # dir(obj)
        class Foo(object):
            def __init__(self):
                self.x = 7
                self.y = 8
                self.z = 9
        f = Foo()
        self.assertIn("y", dir(f))

        # dir(obj_no__dict__)
        # class Foo(object):
        #     __slots__ = []
        # f = Foo()
        # self.assertIn("__repr__", dir(f))

        # dir(obj_no__class__with__dict__)
        # (an ugly trick to cause getattr(f, "__class__") to fail)
        class Foo(object):
            __slots__ = ["__class__", "__dict__"]
            def __init__(self):
                self.bar = "wow"
        f = Foo()
        # self.assertNotIn("__repr__", dir(f))
        self.assertIn("bar", dir(f))

        # dir(obj_using __dir__)
        class Foo(object):
            def __dir__(self):
                return ["kan", "ga", "roo"]
        f = Foo()
        self.assertTrue(dir(f) == ["ga", "kan", "roo"])

        # dir(obj__dir__tuple)
        class Foo(object):
            def __dir__(self):
                return ("b", "c", "a")
        res = dir(Foo())
        self.assertIsInstance(res, list)
        self.assertTrue(res == ["a", "b", "c"])

        # dir(obj__dir__not_sequence)
        class Foo(object):
            def __dir__(self):
                return 7
        f = Foo()
        self.assertRaises(TypeError, dir, f)

        # dir(traceback)
        # try:
        #     raise IndexError
        # except:
        #     self.assertEqual(len(dir(sys.exc_info()[2])), 4)

        # test that object has a __dir__()
        # self.assertEqual(sorted([].__dir__()), dir([]))
        class A(object):
            def __init__(self):
                self.a = 1
                self.b = 2
                self.c = 3

        class B(A):
            def __init__(self):
                A.__init__(self)
                self.d = 4

        class C(B):
            def __init__(self):
                B.__init__(self)
            def __dir__(self):
                return ['a','b','c','d']

    def test_divmod(self):
        self.assertEqual(divmod(12, 7), (1, 5))
        self.assertEqual(divmod(-12, 7), (-2, 2))
        self.assertEqual(divmod(12, -7), (-2, -2))
        self.assertEqual(divmod(-12, -7), (1, -5))

        self.assertEqual(divmod(-sys.maxsize-1, -1), (sys.maxsize+1, 0))

        for num, denom, exp_result in [ (3.25, 1.0, (3.0, 0.25)),
                                        (-3.25, 1.0, (-4.0, 0.75)),
                                        (3.25, -1.0, (-4.0, -0.75)),
                                        (-3.25, -1.0, (3.0, -0.25))]:
            result = divmod(num, denom)
            self.assertAlmostEqual(result[0], exp_result[0])
            self.assertAlmostEqual(result[1], exp_result[1])

        # self.assertRaises(TypeError, divmod)

        # class X:
        #     def __getitem__(self, key):
        #         raise ValueError
        # self.assertRaises(ValueError, eval, "foo", {}, X())


    # def test_eval(self):
    #     self.assertEqual(eval('1+1'), 2)
    #     self.assertEqual(eval(' 1+1\n'), 2)
    #     globals = {'a': 1, 'b': 2}
    #     locals = {'b': 200, 'c': 300}
    #     self.assertEqual(eval('a', globals) , 1)
    #     self.assertEqual(eval('a', globals, locals), 1)
    #     self.assertEqual(eval('b', globals, locals), 200)
    #     self.assertEqual(eval('c', globals, locals), 300)
    #     globals = {'a': 1, 'b': 2}
    #     locals = {'b': 200, 'c': 300}
    #     self.assertEqual(eval('"\xe5"', globals), "\xe5")
    #     self.assertRaises(TypeError, eval)
    #     self.assertRaises(TypeError, eval, ())

    def test_filter(self):
        self.assertEqual(list(filter(lambda c: 'a' <= c <= 'z', 'Hello World')), list('elloorld'))
        self.assertEqual(list(filter(None, [1, 'hello', [], [3], '', None, 9, 0])), [1, 'hello', [3], 9])
        self.assertEqual(list(filter(lambda x: x > 0, [1, -3, 9, 0, 2])), [1, 9, 2])
        self.assertEqual(list(filter(None, Squares(10))), [1, 4, 9, 16, 25, 36, 49, 64, 81])
        self.assertEqual(list(filter(lambda x: x%2, Squares(10))), [1, 9, 25, 49, 81])
        self.assertEqual(list(filter(add_one, lst1)), [1, 3, 4, 5])
        # self.assertEqual(str(filter(add_one, lst1))[:7], "<filter")
        self.assertEqual(list(filter(add_one, lst2)), [4, 8, 10])
        # self.assertEqual(str(filter(add_one, lst2))[:7], "<filter")
        self.assertEqual(list(filter(add_one, lst3)), [-150, -151, -151.49, -151.500001, -152])
        # self.assertEqual(str(filter(add_one, lst3))[:7], "<filter")
        def identity(item):
            return 1
        filter(identity, Squares(5))
        self.assertRaises(TypeError, filter)
        self.assertRaises(TypeError, filter, None, 8)
        class BadSeq(object):
            def __getitem__(self, index):
                if index<4:
                    return 42
                raise ValueError
        # self.assertRaises(ValueError, list, filter(lambda x: x, BadSeq()))
        def badfunc():
            pass
        # self.assertRaises(TypeError, list, filter(badfunc, range(5)))

        # test bltinmodule.c::filtertuple()
        self.assertEqual(list(filter(None, (1, 2))), [1, 2])
        self.assertEqual(list(filter(lambda x: x>=3, (1, 2, 3, 4))), [3, 4])
        d = filter(lambda x: x ==1, [1])
        self.assertEqual(type(d), filter)
        self.assertEqual(str(d), '<filter object>')
        # self.assertRaises(TypeError, list, filter(42, (1, 2)))


    def test_format(self):
        # Test the basic machinery of the format() builtin.  Don't test
        #  the specifics of the various formatters
        # self.assertEqual(format(3, ''), '3')

        # Returns some classes to use for various tests.  There's
        #  an old-style version, and a new-style version
        def classes_new():
            class A(object):
                def __init__(self, x):
                    self.x = x
                def __format__(self, format_spec):
                    return str(self.x) + format_spec
            class DerivedFromA(A):
                pass

            class Simple(object): pass
            class DerivedFromSimple(Simple):
                def __init__(self, x):
                    self.x = x
                def __format__(self, format_spec):
                    return str(self.x) + format_spec
            class DerivedFromSimple2(DerivedFromSimple): pass
            return A, DerivedFromA, DerivedFromSimple, DerivedFromSimple2

        def class_test(A, DerivedFromA, DerivedFromSimple, DerivedFromSimple2):
            self.assertEqual(format(A(3), 'spec'), '3spec')
            self.assertEqual(format(DerivedFromA(4), 'spec'), '4spec')
            self.assertEqual(format(DerivedFromSimple(5), 'abc'), '5abc')
            self.assertEqual(format(DerivedFromSimple2(10), 'abcdef'),
                             '10abcdef')

        class_test(*classes_new())

        def empty_format_spec(value):
            # test that:
            #  format(x, '') == str(x)
            #  format(x) == str(x)
            self.assertEqual(format(value, ""), str(value))
            self.assertEqual(format(value), str(value))

        # for builtin types, format(x, "") == str(x)
        empty_format_spec(17**13)
        empty_format_spec(1.0)
        empty_format_spec(3.1415e104)
        empty_format_spec(-3.1415e104)
        empty_format_spec(3.1415e-104)
        empty_format_spec(-3.1415e-104)
        empty_format_spec(object)
        # empty_format_spec(None)

        # TypeError because self.__format__ returns the wrong type
        class BadFormatResult:
            def __format__(self, format_spec):
                return 1.0
        self.assertRaises(TypeError, format, BadFormatResult(), "")

        # TypeError because format_spec is not unicode or str
        self.assertRaises(TypeError, format, object(), 4)
        self.assertRaises(TypeError, format, object(), object())

        # # tests for object.__format__ really belong elsewhere, but
        # #  there's no good place to put them
        # x = object().__format__('')
        # self.assertTrue(x.startswith('<object object at'))
        #
        # # first argument to object.__format__ must be string
        self.assertRaises(TypeError, object().__format__, 3)
        self.assertRaises(TypeError, object().__format__, object())
        self.assertRaises(TypeError, object().__format__, None)

        # --------------------------------------------------------------------
        # Issue #7994: object.__format__ with a non-empty format string is
        # disallowed
        class A:
            def __format__(self, fmt_str):
                return format('', fmt_str)

        self.assertEqual(format(A()), '')
        self.assertEqual(format(A(), ''), '')
        self.assertEqual(format(A(), 's'), '')

    # def test_general_eval(self):
    #     # Tests that general mappings can be used for the locals argument
    #
    #     class M:
    #         "Test mapping interface versus possible calls from eval()."
    #         def __getitem__(self, key):
    #             if key == 'a':
    #                 return 12
    #             raise KeyError
    #         def keys(self):
    #             return list('xyz')
    #
    #     m = M()
    #     g = globals()
    #     self.assertEqual(eval('a', g, m), 12)
    #     self.assertRaises(NameError, eval, 'b', g, m)
    #     self.assertEqual(eval('dir()', g, m), list('xyz'))
    #     self.assertEqual(eval('globals()', g, m), g)
    #     self.assertEqual(eval('locals()', g, m), m)
    #     self.assertRaises(TypeError, eval, 'a', m)
    #     class A:
    #         "Non-mapping"
    #         pass
    #     m = A()
    #     self.assertRaises(TypeError, eval, 'a', g, m)
    #
    #     # Verify that dict subclasses work as well
    #     class D(dict):
    #         def __getitem__(self, key):
    #             if key == 'a':
    #                 return 12
    #             return dict.__getitem__(self, key)
    #         def keys(self):
    #             return list('xyz')
    #
    #     d = D()
    #     self.assertEqual(eval('a', g, d), 12)
    #     self.assertRaises(NameError, eval, 'b', g, d)
    #     self.assertEqual(eval('dir()', g, d), list('xyz'))
    #     self.assertEqual(eval('globals()', g, d), g)
    #     self.assertEqual(eval('locals()', g, d), d)
    #
    #     # Verify locals stores (used by list comps)
    #     eval('[locals() for i in (2,3)]', g, d)
    #     eval('[locals() for i in (2,3)]', g, collections.UserDict())
    #
    #     class SpreadSheet:
    #         "Sample application showing nested, calculated lookups."
    #         _cells = {}
    #         def __setitem__(self, key, formula):
    #             self._cells[key] = formula
    #         def __getitem__(self, key):
    #             return eval(self._cells[key], globals(), self)
    #
    #     ss = SpreadSheet()
    #     ss['a1'] = '5'
    #     ss['a2'] = 'a1*6'
    #     ss['a3'] = 'a2*7'
    #     self.assertEqual(ss['a3'], 210)
    #
    #     # Verify that dir() catches a non-list returned by eval
    #     # SF bug #1004669
    #     class C:
    #         def __getitem__(self, item):
    #             raise KeyError(item)
    #         def keys(self):
    #             return 1 # used to be 'a' but that's no longer an error
    #     self.assertRaises(TypeError, eval, 'dir()', globals(), C())
    #
    #     class frozendict_error(Exception):
    #         pass
    #
    #     class frozendict(dict):
    #         def __setitem__(self, key, value):
    #             raise frozendict_error("frozendict is readonly")

    def test_getattr(self):
        self.assertTrue(getattr(sys, 'stdout') is sys.stdout)
        self.assertRaises(TypeError, getattr, sys, 1)
        self.assertRaises(TypeError, getattr, sys, 1, "foo")
        self.assertRaises(TypeError, getattr)
        # self.assertRaises(AttributeError, getattr, sys, chr(sys.maxunicode))
        # unicode surrogates are not encodable to the default encoding (utf8)
        self.assertRaises(AttributeError, getattr, 1, "\uDAD1\uD51E")
        class F():
            def __init__(self):
                self.a = 1
                self.b = 2
                self.d = 4

        f = F()
        self.assertEqual(getattr(f,'a'), 1)
        self.assertEqual(getattr(f,'b'), 2)
        self.assertEqual(getattr(f,'c',3), 3)
        self.assertEqual(getattr(f,'d'), 4)

    def test_hasattr(self):
        self.assertTrue(hasattr(sys, 'stdout'))
        self.assertRaises(TypeError, hasattr, sys, 1)
        self.assertRaises(TypeError, hasattr)
        # self.assertEqual(False, hasattr(sys, chr(sys.maxunicode)))

        # Check that hasattr propagates all exceptions outside of
        # AttributeError.
        class A:
            def __getattr__(self, what):
                raise SystemExit
        self.assertRaises(SystemExit, hasattr, A(), "b")
        class B:
            def __getattr__(self, what):
                raise ValueError
        self.assertRaises(ValueError, hasattr, B(), "b")

        class F():
            def __init__(self):
                self.a = 1
                self.b = 2
                self.d = 4

        f = F()

        self.assertTrue(hasattr(f,'a'))
        self.assertFalse(hasattr(f,'c'))
        self.assertFalse(hasattr(f,'D'))
        flag = False
        try:
            a = hasattr(f,b)
        except:
            self.assertTrue(hasattr(f, 'b'))
            flag = True
        self.assertTrue(flag)
        self.assertTrue(hasattr(str,'center'))
        self.assertTrue(hasattr(str,'ljust'))
        self.assertTrue(hasattr(math,'pi'))
        flag2 = False
        try:
            a = hasattr(math,None)
        except:
            flag2 = True
        self.assertTrue(flag2)
        self.assertFalse(hasattr(F,'a'))

    def test_hex(self):
        self.assertEqual(hex(16), '0x10')
        self.assertEqual(hex(-16), '-0x10')
        self.assertEqual(hex(72), '0x48')
        self.assertRaises(TypeError, hex, {})

    def test_id(self):
        id(None)
        id(1)
        id(1.0)
        id('spam')
        id((0,1,2,3))
        id([0,1,2,3])
        id({'spam': 1, 'eggs': 2, 'ham': 3})

    # def test_import(self):
    #     __import__('sys')
    #     __import__('time')
    #     __import__('string')
    #     __import__(name='sys')
    #     __import__(name='time', level=0)
    #     self.assertRaises(ImportError, __import__, 'spamspam')
    #     self.assertRaises(TypeError, __import__, 1, 2, 3, 4)
    #     self.assertRaises(ValueError, __import__, '')
    #     self.assertRaises(TypeError, __import__, 'sys', name='sys')

    # Test input() later, alphabetized as if it were raw_input

    def test_iter(self):
        self.assertRaises(TypeError, iter)
        # self.assertRaises(TypeError, iter, 42, 42)
        lists = [("1", "2"), ["1", "2"], "12"]
        for l in lists:
            i = iter(l)
            self.assertEqual(next(i), '1')
            self.assertEqual(next(i), '2')
            self.assertRaises(StopIteration, next, i)

    def test_isinstance(self):
        class C:
            pass
        class D(C):
            pass
        class E:
            pass
        c = C()
        d = D()
        e = E()
        self.assertTrue(isinstance(c, C))
        self.assertTrue(isinstance(d, C))
        self.assertTrue(not isinstance(e, C))
        self.assertTrue(not isinstance(c, D))
        self.assertTrue(not isinstance('foo', E))
        self.assertRaises(TypeError, isinstance, E, 'foo')
        self.assertRaises(TypeError, isinstance)

    def test_issubclass(self):
        class C:
            pass
        class D(C):
            pass
        class E:
            pass
        c = C()
        d = D()
        e = E()
        self.assertTrue(issubclass(D, C))
        self.assertTrue(issubclass(C, C))
        self.assertTrue(not issubclass(C, D))
        # self.assertRaises(TypeError, issubclass, 'foo', E)
        self.assertRaises(TypeError, issubclass, E, 'foo')
        self.assertRaises(TypeError, issubclass)

    def test_len(self):
        self.assertEqual(len('123'), 3)
        self.assertEqual(len(()), 0)
        self.assertEqual(len((1, 2, 3, 4)), 4)
        self.assertEqual(len([1, 2, 3, 4]), 4)
        self.assertEqual(len({}), 0)
        self.assertEqual(len({'a':1, 'b': 2}), 2)
        class BadSeq:
            def __len__(self):
                raise ValueError
        self.assertRaises(ValueError, len, BadSeq())
        class InvalidLen:
            def __len__(self):
                return None
        self.assertRaises(TypeError, len, InvalidLen())
        class FloatLen:
            def __len__(self):
                return 4.5
        self.assertRaises(TypeError, len, FloatLen())
        # # class HugeLen:
        # #     def __len__(self):
        # #         return sys.maxsize + 1
        # # self.assertRaises(OverflowError, len, HugeLen())
        class NoLenMethod(object): pass
        self.assertRaises(TypeError, len, NoLenMethod())

    def test_map(self):
        self.assertEqual(
            list(map(lambda x: x*x, range(1,4))),
            [1, 4, 9]
        )
        try:
            from math import sqrt
        except ImportError:
            def sqrt(x):
                return pow(x, 0.5)
        self.assertEqual(
            list(map(lambda x: list(map(sqrt, x)), [[16, 4], [81, 9]])),
            [[4.0, 2.0], [9.0, 3.0]]
        )
        self.assertEqual(
            list(map(lambda x, y: x+y, [1,3,2], [9,1,4])),
            [10, 4, 6]
        )

        def plus(*v):
            accu = 0
            for i in v: accu = accu + i
            return accu
        self.assertEqual(
            list(map(plus, [1, 3, 7])),
            [1, 3, 7]
        )
        self.assertEqual(
            list(map(plus, [1, 3, 7], [4, 9, 2])),
            [1+4, 3+9, 7+2]
        )
        self.assertEqual(
            list(map(plus, [1, 3, 7], [4, 9, 2], [1, 1, 0])),
            [1+4+1, 3+9+1, 7+2+0]
        )
        self.assertEqual(
            list(map(int, Squares(10))),
            [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
        )
        def Max(a, b):
            if a is None:
                return b
            if b is None:
                return a
            return max(a, b)
        # self.assertEqual(
        #     list(map(Max, Squares(3), Squares(2))),
        #     [0, 1]
        # )
        self.assertRaises(TypeError, map)
        self.assertRaises(TypeError, map, lambda x: x, 42)
        self.assertRaises(TypeError, map, lambda x: x, False)
        class BadSeq:
            def __iter__(self):
                raise ValueError
                yield None
        # self.assertRaises(ValueError, list, map(lambda x: x, BadSeq()))
        def badfunc(x):
            raise RuntimeError
        # self.assertRaises(RuntimeError, list, map(badfunc, range(5)))
        l1 = [1,3,2]
        l2 = [9,1,4]
        def foo(x,y):
            return x + y
        f = map(foo, l1, l2)
        a = []
        for i in f:
            a.append(i)
        z = map(foo, l1, l2)
        self.assertEqual(a, [10, 4, 6])
        def foo1(x):
            return x
        self.assertRaises(TypeError, foo1, l1, l2)
        self.assertEqual(type(f), map)
        self.assertEqual(str(f), '<map object>')

    def test_max(self):
        self.assertEqual(max('123123'), '3')
        self.assertEqual(max(1, 2, 3), 3)
        self.assertEqual(max((1, 2, 3, 1, 2, 3)), 3)
        self.assertEqual(max([1, 2, 3, 1, 2, 3]), 3)

        self.assertEqual(max(1, 2, 3.0), 3.0)
        self.assertEqual(max(1, 2.0, 3), 3)
        self.assertEqual(max(1.0, 2, 3), 3)

        # with self.assertRaisesRegex(
        #     TypeError,
        #     'max expected at least 1 argument, got 0'
        # ):
        #     max()

        with self.assertRaises(TypeError):
            # assertRaisesRegex not supported
            max()

        self.assertRaises(TypeError, max, 42)
        self.assertRaises(ValueError, max, ())
        class BadSeq:
            def __getitem__(self, index):
                raise ValueError
        self.assertRaises(ValueError, max, BadSeq())

        # for stmt in (
        #     "max(key=int)",                 # no args
        #     "max(default=None)",
        #     "max(1, 2, default=None)",      # require container for default
        #     "max(default=None, key=int)",
        #     "max(1, key=int)",              # single arg not iterable
        #     "max(1, 2, keystone=int)",      # wrong keyword
        #     "max(1, 2, key=int, abc=int)",  # two many keywords
        #     "max(1, 2, key=1)",             # keyfunc is not callable
        #     ):
        #     try:
        #         exec(stmt, globals())
        #     except TypeError:
        #         pass
        #     else:
        #         self.fail(stmt)
        # exec not supported - rewritten tests:
        with self.assertRaises(TypeError):
            max(key=int)
        with self.assertRaises(TypeError):
            max(default=None)         
        with self.assertRaises(TypeError):
            max(1, 2, default=None)
        with self.assertRaises(TypeError):
            max(default=None, key=int)
        with self.assertRaises(TypeError):
            max(1, key=int)       
        with self.assertRaises(TypeError):
            max(1, 2, keystone=int)       
        with self.assertRaises(TypeError):
            max(1, 2, key=int, abc=int)
        with self.assertRaises(TypeError):
            max(1, 2, key=1)         

        self.assertEqual(max((1,), key=neg), 1)     # one elem iterable
        self.assertEqual(max((1,2), key=neg), 1)    # two elem iterable
        self.assertEqual(max(1, 2, key=neg), 1)     # two elems

        self.assertEqual(max((), default=None), None)    # zero elem iterable
        self.assertEqual(max((1,), default=None), 1)     # one elem iterable
        self.assertEqual(max((1,2), default=None), 2)    # two elem iterable

        self.assertEqual(max((), default=1, key=neg), 1)
        self.assertEqual(max((1, 2), default=3, key=neg), 1)

        self.assertEqual(max((1, 2), key=None), 2)

        data = [random.randrange(200) for i in range(100)]
        keys = dict((elem, random.randrange(50)) for elem in data)
        f = keys.__getitem__
        self.assertEqual(max(data, key=f),
                         sorted(reversed(data), key=f)[-1])

    def test_min(self):
        self.assertEqual(min('123123'), '1')
        self.assertEqual(min(1, 2, 3), 1)
        self.assertEqual(min((1, 2, 3, 1, 2, 3)), 1)
        self.assertEqual(min([1, 2, 3, 1, 2, 3]), 1)

        self.assertEqual(min(1, 2, 3.0), 1)
        self.assertEqual(min(1, 2.0, 3), 1)
        self.assertEqual(min(1.0, 2, 3), 1.0)

        # with self.assertRaisesRegex(
        #     TypeError,
        #     'min expected at least 1 argument, got 0'
        # ):
        #     min()
        with self.assertRaises(TypeError):
            # assertRaisesRegex not supported
            min()

        self.assertRaises(TypeError, min, 42)
        self.assertRaises(ValueError, min, ())
        class BadSeq:
            def __getitem__(self, index):
                raise ValueError
        self.assertRaises(ValueError, min, BadSeq())

        # for stmt in (
        #     "min(key=int)",                 # no args
        #     "min(default=None)",
        #     "min(1, 2, default=None)",      # require container for default
        #     "min(default=None, key=int)",
        #     "min(1, key=int)",              # single arg not iterable
        #     "min(1, 2, keystone=int)",      # wrong keyword
        #     "min(1, 2, key=int, abc=int)",  # two many keywords
        #     "min(1, 2, key=1)",             # keyfunc is not callable
        #     ):
        #     try:
        #         exec(stmt, globals())
        #     except TypeError:
        #         pass
        #     else:
        #         self.fail(stmt)
        # exec not supported rewritten tests:
        with self.assertRaises(TypeError):
            min(key=int)
        with self.assertRaises(TypeError):
            min(default=None)         
        with self.assertRaises(TypeError):
            min(1, 2, default=None)
        with self.assertRaises(TypeError):
            min(default=None, key=int)
        with self.assertRaises(TypeError):
            min(1, key=int)       
        with self.assertRaises(TypeError):
            min(1, 2, keystone=int)       
        with self.assertRaises(TypeError):
            min(1, 2, key=int, abc=int)
        with self.assertRaises(TypeError):
            min(1, 2, key=1)   
 
        self.assertEqual(min((1,), key=neg), 1)     # one elem iterable
        self.assertEqual(min((1,2), key=neg), 2)    # two elem iterable
        self.assertEqual(min(1, 2, key=neg), 2)     # two elems

        self.assertEqual(min((), default=None), None)    # zero elem iterable
        self.assertEqual(min((1,), default=None), 1)     # one elem iterable
        self.assertEqual(min((1,2), default=None), 1)    # two elem iterable

        self.assertEqual(min((), default=1, key=neg), 1)
        self.assertEqual(min((1, 2), default=1, key=neg), 2)

        self.assertEqual(min((1, 2), key=None), 1)

        data = [random.randrange(200) for i in range(100)]
        keys = dict((elem, random.randrange(50)) for elem in data)
        f = keys.__getitem__
        self.assertEqual(min(data, key=f),
                         sorted(data, key=f)[0])

    def test_neg(self):
        x = -sys.maxsize-1
        # self.assertTrue(isinstance(x, int))
        self.assertEqual(-x, sys.maxsize+1)

    def test_next(self):
        it = iter(range(2))
        self.assertEqual(next(it), 0)
        self.assertEqual(next(it), 1)
        self.assertRaises(StopIteration, next, it)
        self.assertRaises(StopIteration, next, it)
        self.assertEqual(next(it, 42), 42)

        class Iter(object):
            def __iter__(self):
                return self
            def __next__(self):
                raise StopIteration

        # it = iter(Iter())
        # self.assertEqual(next(it, 42), 42)
        # self.assertRaises(StopIteration, next, it)

        def gen():
            yield 1
            return

        it = gen()
        self.assertEqual(next(it), 1)
        self.assertRaises(StopIteration, next, it)
        self.assertEqual(next(it, 42), 42)

    def test_oct(self):
        self.assertEqual(oct(100), '0o144')
        self.assertEqual(oct(-100), '-0o144')
        self.assertEqual(oct(72), '0o110')
        self.assertRaises(TypeError, oct, ())

    def test_pow(self):
        self.assertEqual(pow(0,0), 1)
        self.assertEqual(pow(0,1), 0)
        self.assertEqual(pow(1,0), 1)
        self.assertEqual(pow(1,1), 1)

        self.assertEqual(pow(2,0), 1)
        self.assertEqual(pow(2,10), 1024)
        self.assertEqual(pow(2,20), 1024*1024)
        self.assertEqual(pow(2,30), 1024*1024*1024)
        self.assertEqual(pow(4, 5), 1024)
        self.assertEqual(pow(4, 5, None), 1024)

        self.assertEqual(pow(-2,0), 1)
        self.assertEqual(pow(-2,1), -2)
        self.assertEqual(pow(-2,2), 4)
        self.assertEqual(pow(-2,3), -8)
        self.assertEqual(pow(2, 9999, 13), 8)

        self.assertAlmostEqual(pow(0.,0), 1.)
        self.assertAlmostEqual(pow(0.,1), 0.)
        self.assertAlmostEqual(pow(1.,0), 1.)
        self.assertAlmostEqual(pow(1.,1), 1.)

        self.assertAlmostEqual(pow(2.,0), 1.)
        self.assertAlmostEqual(pow(2.,10), 1024.)
        self.assertAlmostEqual(pow(2.,20), 1024.*1024.)
        self.assertAlmostEqual(pow(2.,30), 1024.*1024.*1024.)

        self.assertAlmostEqual(pow(-2.,0), 1.)
        self.assertAlmostEqual(pow(-2.,1), -2.)
        self.assertAlmostEqual(pow(-2.,2), 4.)
        self.assertAlmostEqual(pow(-2.,3), -8.)


        for x in 2, 2.0:
            for y in 10, 10.0:
                for z in 1000, 1000.0:
                    if isinstance(x, float) or \
                       isinstance(y, float) or \
                       isinstance(z, float):
                        self.assertRaises(TypeError, pow, x, y, z)
                    else:
                        self.assertAlmostEqual(pow(x, y, z), 24.0)

        # self.assertAlmostEqual(pow(-1, 0.5), 1j)
        # self.assertAlmostEqual(pow(-1, 1/3), 0.5 + 0.8660254037844386j)

        self.assertRaises(ValueError, lambda: pow(-1, -2, 3))
        self.assertRaises(ValueError, pow, 1, 2, 0)

        self.assertRaises(TypeError, pow)
        self.assertRaises(TypeError, pow, [1,2], '34', 5)
        self.assertRaises(TypeError, pow, 4.0, 5.0, 3)
        self.assertRaises(ValueError, pow, 4, -3, 2)

    def test_range(self):
        # self.assertEqual(str(range(5)), 'range(0, 5)')
        self.assertEqual(list(range(5)), [0, 1, 2, 3, 4])
        # self.assertEqual(str(type(range(5))), "<class 'range'>")
        # self.assertEqual(str(range(1, 5)), 'range(1, 5)')
        self.assertEqual(list(range(1, 5)), [1, 2, 3, 4])
        # self.assertEqual(str(type(range(1, 5))), "<class 'range'>")
        # self.assertEqual(str(range(1, 8, 2)), 'range(1, 8, 2)')
        self.assertEqual(list(range(1, 8, 2)), [1, 3, 5, 7])
        # self.assertEqual(str(type(range(1, 8, 2))), "<class 'range'>")

    def test_repr(self):
        self.assertEqual(repr(''), '\'\'')
        self.assertEqual(repr(0), '0')
        self.assertEqual(repr(()), '()')
        self.assertEqual(repr([]), '[]')
        self.assertEqual(repr({}), '{}')
        a = []
        a.append(a)
        self.assertEqual(repr(a), '[[...]]')
        a = {}
        a[0] = a
        self.assertEqual(repr(a), '{0: {...}}')

    def test_round(self):
        self.assertEqual(round(0.0), 0.0)
        self.assertEqual(type(round(0.0)), int)
        self.assertEqual(round(1.0), 1.0)
        self.assertEqual(round(10.0), 10.0)
        self.assertEqual(round(1000000000.0), 1000000000.0)
        self.assertEqual(round(1e20), 1e20)
        self.assertEqual(round(1e20), 100000000000000000000)
        self.assertEqual(type(round(1e20)), int)

        self.assertEqual(round(0.5), 0)
        self.assertEqual(round(-0.5), 0)
        self.assertEqual(round(1.5), 2)
        self.assertEqual(round(-1.5), -2)
        self.assertEqual(round(0.49999999), 0)
        self.assertEqual(round(-0.49999999), 0)
        self.assertEqual(round(0.500000001), 1)
        self.assertEqual(round(-0.500000001), -1)
        # the next two fail:
        # self.assertEqual(round(2.675, 2), 2.67)
        # self.assertEqual(round(-2.675, 2), -2.67)
        self.assertEqual(round(12, -1), 10)
        self.assertEqual(round(15, -1), 20)
        self.assertEqual(round(18, -1), 20)
        self.assertEqual(round(-12, -1), -10)
        self.assertEqual(round(-15, -1), -20)
        self.assertEqual(round(-18, -1), -20)
        self.assertEqual(round(250, -2), 200)
        self.assertEqual(round(251, -2), 300)
        self.assertEqual(round(-250, -2), -200)
        self.assertEqual(round(-251, -2), -300)

        self.assertEqual(round(-1.0), -1.0)
        self.assertEqual(round(-10.0), -10.0)
        self.assertEqual(round(-1000000000.0), -1000000000.0)
        self.assertEqual(round(-1e20), -1e20)

        self.assertEqual(round(0.1), 0.0)
        self.assertEqual(round(1.1), 1.0)
        self.assertEqual(round(10.1), 10.0)
        self.assertEqual(round(1000000000.1), 1000000000.0)

        self.assertEqual(round(-1.1), -1.0)
        self.assertEqual(round(-10.1), -10.0)
        self.assertEqual(round(-1000000000.1), -1000000000.0)

        self.assertEqual(round(0.9), 1.0)
        self.assertEqual(round(9.9), 10.0)
        self.assertEqual(round(999999999.9), 1000000000.0)

        self.assertEqual(round(-0.9), -1.0)
        self.assertEqual(round(-9.9), -10.0)
        self.assertEqual(round(-999999999.9), -1000000000.0)

        self.assertEqual(round(-8.0, -1), -10.0)
        self.assertEqual(type(round(-8.0, -1)), float)

        self.assertEqual(type(round(-8.0, 0)), float)
        self.assertEqual(type(round(-8.0, 1)), float)

        self.assertEqual(round(6.7), 7)
        self.assertEqual(6.7.__round__(), 7)
        self.assertEqual(type(6.7.__round__()), int)
        self.assertEqual(type(round(6.7)), int)
        self.assertEqual(type(round(6.7, 0)), float)

        self.assertEqual(round(5.5), 6)
        self.assertEqual(type(round(5.5)), int)
        self.assertEqual(round(6.5, 0), 6.0)
        self.assertEqual(type(round(6.5, 0)), float)
        self.assertEqual(round(6, -1), 10)
        self.assertEqual(type(round(6, -1)), int)
        self.assertEqual(round(5, -1), 0)
        self.assertEqual(type(round(5, -1)), int)
        self.assertEqual(round(51), 51)
        self.assertEqual(type(round(51)), int)
        self.assertEqual(round(51, 2), 51)
        self.assertEqual(type(round(51, 2)), int)
        self.assertEqual(round(51, -1), 50)
        self.assertEqual(type(round(51, -1)), int)

        num = 5.67
        self.assertEqual(num.__round__(), 6)
        self.assertEqual(type(num.__round__()), int)
        self.assertEqual(num.__round__(0), 6.0)
        self.assertEqual(type(num.__round__(0)), float)
        self.assertEqual(num.__round__(1), 5.7)
        self.assertEqual(type(num.__round__(1)), float)
        self.assertEqual(num.__round__(-1), 10.0)
        self.assertEqual(type(num.__round__(-1)), float)
        num2 = 3
        self.assertEqual(round(3), 3)
        self.assertEqual(type(round(3)), int)
        self.assertEqual(round(num2), 3)
        self.assertEqual(type(round(num2)), int)
        self.assertEqual(num2.__round__(), 3)
        self.assertEqual(type(num2.__round__()), int)

        # Check even / odd rounding behaviour
        self.assertEqual(round(5.5), 6)
        self.assertEqual(round(6.5), 6)
        self.assertEqual(round(-5.5), -6)
        self.assertEqual(round(-6.5), -6)

        # Check behavior on ints
        self.assertEqual(round(0), 0)
        self.assertEqual(round(8), 8)
        self.assertEqual(round(-8), -8)
        self.assertEqual(type(round(0)), int)
        self.assertEqual(type(round(-8, -1)), int)
        self.assertEqual(type(round(-8, 0)), int)
        self.assertEqual(type(round(-8, 1)), int)

        # a list of the numbers that Skulpt has trouble rounding correctly
        bugs = [-0.5,-0.025,-0.055,0.045,-0.0025,-0.0035,0.0045,0.0055,-250,-350,-450,-550]
        roundedbugs = [round(i) for i in bugs]
        self.assertEqual(roundedbugs, [0, 0, 0, 0, 0, 0, 0, 0, -250, -350, -450, -550])
        diffs = []
        def helper(iterable,expect,n=None):
            if n:
                for i in iterable:
                    r = round(i,n)
                    if abs(r-expect) > (1/10.0**(n+1)) and i not in bugs:
                        diffs.extend([i, expect, r])
            else:
                for i in iterable:
                    r = round(i)
                    if abs(r-expect) > 0.000001 and i not in bugs:
                        diffs.extend([i, expect, r])

        helper([x/10.0 for x in range(-5,-15,-1)],-1)
        helper([x/10.0 for x in range(4,-5,-1)],0)
        helper([x/10.0 for x in range(5,15)],1)
        helper([x/100.0 for x in range(-50,-150,-1)],-1)
        helper([x/100.0 for x in range(40,-50,-1)],0)
        helper([x/100.0 for x in range(50,150)],1)
        helper([x/1000.0 for x in range(-25,-35,-1)],-0.03,2)
        helper([x/1000.0 for x in range(-35,-46,-1)],-0.04,2)
        helper([x/1000.0 for x in range(-46,-55,-1)],-0.05,2)
        helper([x/1000.0 for x in range(-55,-65,-1)],-0.06,2)
        helper([x/1000.0 for x in range(25,35)],0.03,2)
        helper([x/1000.0 for x in range(35,46)],0.04,2)
        helper([x/1000.0 for x in range(46,55)],0.05,2)
        helper([x/1000.0 for x in range(55,65)],0.06,2)
        helper([x/10000.0 for x in range(-25,-35,-1)],-0.003,3)
        helper([x/10000.0 for x in range(-35,-46,-1)],-0.004,3)
        helper([x/10000.0 for x in range(-46,-56,-1)],-0.005,3)
        helper([x/10000.0 for x in range(-56,-65,-1)],-0.006,3)
        helper([x/10000.0 for x in range(25,35)],0.003,3)
        helper([x/10000.0 for x in range(35,46)],0.004,3)
        helper([x/10000.0 for x in range(46,56)],0.005,3)
        helper([x/10000.0 for x in range(56,65)],0.006,3)
        helper(range(-250,-350,-1),-300,-2)
        helper(range(-350,-450,-1),-400,-2)
        helper(range(-450,-550,-1),-500,-2)
        helper(range(-550,-650,-1),-600,-2)
        helper(range(250,350),300,-2)
        helper(range(350,450),400,-2)
        helper(range(450,550),500,-2)
        helper(range(550,650),600,-2)
        #self.assertEqual(diffs, [0.5, 1, 0, 0.5, 1, 0, 250, 300, 200, 450, 500, 400])

        # # test new kwargs
        # self.assertEqual(round(number=-8.0, ndigits=-1), -10.0)

        self.assertRaises(TypeError, round)

        # test generic rounding delegation for reals
        class TestRound:
            def __round__(self):
                return 23

        class TestNoRound:
            pass

        self.assertEqual(round(TestRound()), 23)

        self.assertRaises(TypeError, round, 1, 2, 3)
        self.assertRaises(TypeError, round, TestNoRound())

        t = TestNoRound()
        t.__round__ = lambda *args: args
        self.assertRaises(TypeError, round, t)
        self.assertRaises(TypeError, round, t, 0)

    def test_round_large(self):
        # Issue #1869: integral floats should remain unchanged
        self.assertEqual(round(5e15-1), 5e15-1)
        self.assertEqual(round(5e15), 5e15)
        self.assertEqual(round(5e15+1), 5e15+1)
        self.assertEqual(round(5e15+2), 5e15+2)
        self.assertEqual(round(5e15+3), 5e15+3)

    def test_setattr(self):
        setattr(sys, 'spam', 1)
        self.assertEqual(sys.spam, 1)
        self.assertRaises(TypeError, setattr, sys, 1, 'spam')
        self.assertRaises(TypeError, setattr)
        for builtin_type in (int, float, Exception, object, type, super):
            self.assertRaises(TypeError, setattr, builtin_type, 'foo', 'bar')
            with self.assertRaises(TypeError):
                builtin_type.foo = 'bar'

    # test_str(): see test_unicode.py and test_bytes.py for str() tests.

    def test_sum(self):
        self.assertEqual(sum([]), 0)
        self.assertEqual(sum(list(range(2,8))), 27)
        self.assertEqual(sum(iter(list(range(2,8)))), 27)
        self.assertEqual(sum(Squares(10)), 285)
        self.assertEqual(sum(iter(Squares(10))), 285)
        self.assertEqual(sum([[1], [2], [3]], []), [1, 2, 3])


        self.assertRaises(TypeError, sum)
        self.assertRaises(TypeError, sum, 42)
        self.assertRaises(TypeError, sum, ['a', 'b', 'c'])
        self.assertRaises(TypeError, sum, ['a', 'b', 'c'], '')
        self.assertRaises(TypeError, sum, [[1], [2], [3]])
        self.assertRaises(TypeError, sum, [{2:3}])
        self.assertRaises(TypeError, sum, [{2:3}]*2, {2:3})

        d = {1:2,3:4}
        self.assertEqual(sum({}),0)
        self.assertEqual(sum({},5), 5)
        self.assertEqual(sum({1:2,3:4}), 4)
        self.assertEqual(sum(d.keys()), 4)
        self.assertEqual(sum(d.values()), 6)
        self.assertEqual(sum(d,5), 9)

        class BadSeq:
            def __getitem__(self, index):
                raise ValueError
        self.assertRaises(ValueError, sum, BadSeq())

        empty = []
        sum(([x] for x in range(10)), empty)
        self.assertEqual(empty, [])

    def test_type(self):
        self.assertEqual(type(''),  type('123'))
        # self.assertNotEqual(type(''), type(()))

    # # We don't want self in vars(), so these are static methods
    #
    # @staticmethod
    # def get_vars_f0():
    #     return vars()
    #
    # @staticmethod
    # def get_vars_f2():
    #     BuiltinTest.get_vars_f0()
    #     a = 1
    #     b = 2
    #     return vars()
    #
    # class C_get_vars(object):
    #     def getDict(self):
    #         return {'a':2}
    #     __dict__ = property(fget=getDict)
    #
    # def test_vars(self):
    #     self.assertEqual(set(vars()), set(dir()))
    #     self.assertEqual(set(vars(sys)), set(dir(sys)))
    #     self.assertEqual(self.get_vars_f0(), {})
    #     self.assertEqual(self.get_vars_f2(), {'a': 1, 'b': 2})
    #     self.assertRaises(TypeError, vars, 42, 42)
    #     self.assertRaises(TypeError, vars, 42)
    #     self.assertEqual(vars(self.C_get_vars()), {'a':2})

    def test_zip(self):
        self.assertEqual(list(zip(str1, str2)), [('A', 'x'), ('B', 'y')])
        self.assertEqual(str(zip(str1, str2))[1:11], "zip object")
        self.assertEqual(str(type(zip(str1, str2))), "<class 'zip'>")
        self.assertEqual(list(zip(lst1, str3, str4)), [(1, 'A', 'a'), (2, 'B', 'b'), (3, 'C', 'c'), (4, 'D', 'd'), (5, 'E', 'e')])
        self.assertEqual(str(zip(lst1, str3, str4))[1:11], "zip object")
        self.assertEqual(str(type(zip(lst1, str3, str4))), "<class 'zip'>")
        lst1b, str3b, str4b = zip(*zip(lst1, str3, str4))
        self.assertEqual(list(lst1b), lst1)
        self.assertEqual(''.join(str3b), str3)
        self.assertEqual(''.join(str4b), str4)
        a = (1, 2, 3)
        b = (4, 5, 6)
        t = [(1, 4), (2, 5), (3, 6)]
        self.assertEqual(list(zip(a, b)), t)
        b = [4, 5, 6]
        self.assertEqual(list(zip(a, b)), t)
        b = (4, 5, 6, 7)
        self.assertEqual(list(zip(a, b)), t)
        class I:
            def __getitem__(self, i):
                if i < 0 or i > 2: raise IndexError
                return i + 4
        self.assertEqual(list(zip(a, I())), t)
        self.assertEqual(list(zip()), [])
        self.assertEqual(list(zip(*[])), [])
        self.assertRaises(TypeError, zip, None)
        class G:
            pass
        self.assertRaises(TypeError, zip, a, G())
        self.assertRaises(RuntimeError, zip, a, TestFailingIter())

        # Make sure zip doesn't try to allocate a billion elements for the
        # result list when one of its arguments doesn't say how long it is.
        # A MemoryError is the most likely failure mode.
        class SequenceWithoutALength:
            def __getitem__(self, i):
                if i == 5:
                    raise IndexError
                else:
                    return i
        self.assertEqual(list(zip(SequenceWithoutALength(), range(2**10))), list(enumerate(range(5))))
        a = zip([1], [2])
        self.assertEqual(type(a), zip)
        l = [1,2,3,4]
        t = (1,2,3,4)
        d = {1:2,3:4}
        s = "1234"
        z = zip(l,t,s)
        self.assertEqual(list(zip(*z)), [(1, 2, 3, 4), (1, 2, 3, 4), ('1', '2', '3', '4')])
        z = zip(l,t,s,d)
        self.assertEqual(list(zip(*z)), [(1, 2), (1, 2), ('1', '2'), (1, 3)])

class DepreciatedTest(unittest.TestCase):

    def test_basestring(self):
        self.assertRaises(NameError, lambda: isinstance(str1, basestring))
        self.assertRaises(NameError, lambda: isinstance(str4, basestring))
        self.assertRaises(NameError, lambda: isinstance('ā', basestring))

    def test_cmp(self):
        self.assertRaises(NameError, lambda: cmp(4, 5))
        self.assertRaises(NameError, lambda: cmp(-15.5, -9.743902))
        self.assertRaises(NameError, lambda: cmp(22, -.0001))

    # def test_execfile(self):
    #     self.assertRaises(NameError, lambda: execfile("./filename"))
    #
    # def test_file(self):
    #     self.assertRaises(NameError, lambda: isinstance("filename", file))
    #
    # def test_long(self):
    #     self.assertRaises(NameError, lambda: long(8923.322))
    #     self.assertRaises(NameError, lambda: long(-3289))
    #
    # def test_raw_input(self):
    #     self.assertRaises(NameError, lambda: raw_input("What is your name?"))
    #     self.assertRaises(NameError, lambda: raw_input("Who is your dog?"))
    #
    # def test_reduce(self):
    #     self.assertRaises(NameError, lambda: reduce(lambda x, y: x + y, [1, 2, 3, 4, 5]))

    # def test_unichr(self):
    #     self.assertRaises(NameError, lambda: unichr(97))
    #     self.assertRaises(NameError, lambda: unichr(-2))

    def test_unicode(self):
        self.assertRaises(NameError, lambda: unicode('abcdef'))

    # def test_xrange(self):
    #     self.assertRaises(NameError, lambda: xrange(10))
    #     self.assertRaises(NameError, lambda: xrange(0, 9, 2))
    #     self.assertRaises(NameError, lambda: xrange(-10, 0))


class DictMethodsTest(unittest.TestCase):

    def test_dict_methods(self):
        animals = {"cats": 1, "dogs": 2, "horses": 0}
        # self.assertEqual(str(animals.keys())[:9], 'dict_keys')
        self.assertEqual(list(animals.keys()), ['cats', 'dogs', 'horses'])
        # self.assertEqual(str(animals.values())[:11], 'dict_values')
        self.assertEqual(list(animals.values()), [1, 2, 0])
        # self.assertEqual(str(animals.items())[:10], 'dict_items')
        self.assertEqual(list(animals.items()), [('cats', 1), ('dogs', 2), ('horses', 0)])


class DivTest(unittest.TestCase):

    def test_int_div(self):
        self.assertEqual(3 / 2, 1.5)
        self.assertEqual(1 / 8, 0.125)
        self.assertEqual(200 / -800, -0.25)


# class ForLoopTest(unittest.TestCase):
#
#     def test_loop_vars(self):
#         i = 1
#         [i for i in range(5)]
#         self.assertEqual(i, 1)
#
#
# class TypeTest(unittest.TestCase):
#
#     def test_type_compare(self):
#         self.assertRaises(TypeError, lambda: [1, 2] > 'foo')
#         self.assertRaises(TypeError, lambda: (1, 2) > 'foo')
#         self.assertRaises(TypeError, lambda: [1, 2] > (1, 2))

class TestSorted(unittest.TestCase):

    def test_baddecorator(self):
        data = 'The quick Brown fox Jumped over The lazy Dog'.split()
        self.assertRaises(TypeError, sorted, data, None, lambda x, y: 0)

    def test_basic(self):
        data = list(range(100))
        copy = data[:]
        random.shuffle(copy)
        self.assertEqual(data, sorted(copy))
        self.assertNotEqual(data, copy)

        data.reverse()
        random.shuffle(copy)
        self.assertEqual(data, sorted(copy, key=lambda x: -x))
        self.assertNotEqual(data, copy)
        random.shuffle(copy)
        self.assertEqual(data, sorted(copy, reverse=1))
        self.assertNotEqual(data, copy)

        b = "rksdubtheyn"
        self.assertEqual(sorted(b, key = lambda x: ord(x)), ['b', 'd', 'e', 'h', 'k', 'n', 'r', 's', 't', 'u', 'y'])
        c = [2,1,-4,3,0,6]
        c.sort(reverse=True)
        self.assertEqual(c, [6, 3, 2, 1, 0, -4])
        c.sort()
        self.assertEqual(c, [-4, 0, 1, 2, 3, 6])

        def makeset(lst):
            result = {}
            for a in lst:
                if not (a in result.keys()):
                    result[a] = []

                result[a].append(True)
            return result

        def sorttest(lst1):
            lst2 = lst1[:]
            lst2.sort()
            assert len(lst1) == len(lst2)
            assert makeset(lst1) == makeset(lst2)
            position = {}
            i = 0
            err = False
            for a in lst1:
                if not (a in position.keys()):
                    position[a] = []
                position[a].append(i)
                i += 1
            for i in range(len(lst2)-1):
                a, b = lst2[i], lst2[i+1]
                if not a <= b:
                    print("resulting list is not sorted")
                    err = True
                if a == b:
                    if not position[a][0] < position[b][-1]:
                        print("not stable")
                        err = True
            if not err:
                return 1
            else:
                return 0
        sum0 = 0
        for v in range(20):
            up = 1 + int(v * random.random() * 2.7)
            lst1 = [random.randrange(0, up) for i in range(v)]
            sum0 += sorttest(lst1)
        self.assertEqual(sum0, 20)



    def test_bad_arguments(self):
        # Issue #29327: The first argument is positional-only.
        sorted([])
        self.assertRaises(TypeError, lambda: sorted(iterable=[]))
        # Other arguments are keyword-only
        sorted([], key=None)
        # self.assertRaises(TypeError, lambda: sorted([], None))

    def test_inputtypes(self):
        s = 'abracadabra'
        types = [list, tuple, str]
        for T in types:
            self.assertEqual(sorted(s), sorted(T(s)))

        s = ''.join(set(s))  # unique letters only
        types = [str, set, frozenset, list, tuple, dict.fromkeys]
        # for T in types:
        #     self.assertEqual(sorted(s), sorted(T(s)))

class TestType(unittest.TestCase):


    def test_new_type(self):
        A = type('A', (), {})
        self.assertEqual(A.__name__, 'A')
        # self.assertEqual(A.__qualname__, 'A')
        self.assertEqual(A.__module__, __name__)
        # self.assertEqual(A.__bases__, (object,))
        # self.assertIs(A.__base__, object)
        x = A()
        self.assertIs(type(x), A)
        self.assertIs(x.__class__, A)

        class B:
            def ham(self):
                return 'ham%d' % self

        # test __dict__ is not self referencing
        b = B()
        self.assertEqual(b.__dict__, {})
        b.x = 3
        self.assertEqual(b.__dict__, {'x':3})
        self.assertIn('x', b.__dict__)
        self.assertNotIn('__dict__', b.__dict__)
        
        # C = type('C', (B, int), {'spam': lambda self: 'spam%s' % self})
        # self.assertEqual(C.__name__, 'C')
        # self.assertEqual(C.__qualname__, 'C')
        # self.assertEqual(C.__module__, __name__)
        # self.assertEqual(C.__bases__, (B, int))
        # self.assertIs(C.__base__, int)
        # self.assertIn('spam', C.__dict__)
        # self.assertNotIn('ham', C.__dict__)
        # x = C(42)
        # self.assertEqual(x, 42)
        # self.assertIs(type(x), C)
        # self.assertIs(x.__class__, C)
        # self.assertEqual(x.ham(), 'ham42')
        # self.assertEqual(x.spam(), 'spam42')
        # self.assertEqual(x.to_bytes(2, 'little'), b'\x2a\x00')

    # def test_type_nokwargs(self):
    #     self.assertRaises(TypeError, lambda: type('a', (), {}, x=5))
    #     self.assertRaises(TypeError, lambda: type('a', (), dict={}))


    def test_type_qualname(self):
        A = type('A', (), {'__qualname__': 'B.C'})
        self.assertEqual(A.__name__, 'A')
        self.assertEqual(A.__qualname__, 'B.C')
        self.assertEqual(A.__module__, __name__)
        self.assertEqual(A.__qualname__, 'B.C')
        A.__qualname__ = 'D.E'
        self.assertEqual(A.__name__, 'A')
        self.assertEqual(A.__qualname__, 'D.E')
        self.assertEqual(A.__qualname__, 'D.E')

    def test_bad_args(self):
        # self.assertRaises(TypeError, lambda: type())
        # self.assertRaises(TypeError, lambda: type('A', ()))
        # self.assertRaises(TypeError, lambda: type('A', (), {}, ()))
        # self.assertRaises(TypeError, lambda: type('A', (), dict={}))
        self.assertRaises(TypeError, lambda: type('A', [], {}))
        # self.assertRaises(TypeError, lambda: type('A', (), types.MappingProxyType({})))
        # self.assertRaises(TypeError, lambda: type('A', (None,), {}))
        # self.assertRaises(TypeError, lambda: type('A', (bool,), {}))
        self.assertRaises(TypeError, lambda: type('A', (int, str), {}))


    # def test_bad_slots(self):
    #     self.assertRaises(TypeError, lambda: type('A', (int,), {'__slots__': 'x'}))
    #     self.assertRaises(TypeError, lambda: type('A', (), {'__slots__': ''}))
    #     self.assertRaises(TypeError, lambda: type('A', (), {'__s lots__': '42'}))
    #     self.assertRaises(TypeError, lambda: type('A', (), {'__slots__': 'x\x00y'}))
    #     self.assertRaises(ValueError, lambda: type('A', (), {'__slots__': 'x', 'x': 0}))
    #     self.assertRaises(TypeError, lambda: type('A', (), {'__slots__': ('__dict__', '__dict__')}))
    #     self.assertRaises(TypeError, lambda: type('A', (), {'__slots__': ('__weakref__', '__weakref__')}))
    #
    #     class B:
    #         pass
    #     self.assertRaises(TypeError, lambda: type('A', (B,), {'__slots__': '__dict__'}))
    #     self.assertRaises(TypeError, lambda: type('A', (B,), {'__slots__': '__weakref__'}))


class HasClassMethod(object):
    @classmethod
    def foo(cls, *args, **kwargs):
        return (cls, args, kwargs)


class AlsoHasClassMethod(HasClassMethod):
    pass


class TestMisc(unittest.TestCase):
    def test_classmethod(self):
        self.assertEqual(HasClassMethod().foo(1, x=2), (HasClassMethod, (1,), {'x': 2}))
        self.assertEqual(AlsoHasClassMethod().foo(1, x=2), (AlsoHasClassMethod, (1,), {'x': 2}))


if __name__ == "__main__":
    unittest.main()