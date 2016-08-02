"""
This file was modified from CPython.
Copyright (c) 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010,
2011, 2012, 2013, 2014, 2015, 2016 Python Software Foundation; All Rights Reserved
"""
import copy, unittest
from operator import le, lt, ge, gt, eq, ne

class C:
    def __init__(self, foo):
        self.foo = foo
    def __copy__(self):
        return C(self.foo)

class ReduceEx(object):
    def __reduce_ex__(self, proto):
        c.append(1)
        return ""
    def __reduce__(self):
        self.fail("shouldn't call this")
c = []

class Reduce(object):
    def __reduce__(self):
        d.append(1)
        return ""
d = []

class InstVan:
    def __init__(self, foo):
        self.foo = foo
    # def __eq__(self, other):
    #   return self.foo == other.foo

class Copy_eq:
    def __init__(self, foo):
        self.foo = foo
    def __copy__(self):
        return C(self.foo)
    def __eq__(self, other):
        return self.foo == other.foo

class User_def:
    def __init__(self, name):
        self.name = name
    def rename(self,newname):
        self.name = newname

class NewArgs(int):
    def __new__(cls, foo):
        self = int.__new__(cls)
        self.foo = foo
        return self
    def __getnewargs__(self):
        return self.foo,
    def __eq__(self, other):
        return self.foo == other.foo

class TestCopy(unittest.TestCase):
    def test_exceptions(self):
        self.assertIs(copy.Error, copy.error)
        self.assertTrue(issubclass(copy.Error, Exception))

    # The copy() method

    def test_copy_basic(self):
        x = 42
        y = copy.copy(x)
        self.assertEqual(x, y)

    def test_copy_copy(self):
        x = C(42)
        y = copy.copy(x)
        self.assertEqual(y.__class__, x.__class__)
        self.assertEqual(y.foo, x.foo)

    def test_copy_inst(self):
        x = User_def("One")
        y = copy.copy(x)
        self.assertEqual(x.name, "One")
        self.assertFalse(x==y)
        self.assertFalse(x is y)
        self.assertTrue(x.name is y.name)
        x.rename("Two")
        self.assertFalse(x==y)
        self.assertFalse(x is y)
        self.assertEqual(x.name, "Two")
        self.assertEqual(y.name, "One")

    def test_copy_cant(self):
        class Cant:
            def __getattribute__(self, name):
                pass
                # if name.startswith("__reduce"):
                #   raise AttributeError(name)
                # return object.__getattribute__(self, name)
        x = Cant()
        self.assertRaises(TypeError, copy.copy, x)

    def test_copy_atomic(self):
        class Classic:
            pass
        def f():
            pass
        # class WithMetaclass(metaclass=abc.ABCMeta):
        #   pass
        tests = [None, 42, 3.14, True, False,
                 "hello", "hello\u1234", Classic]
        #None, .../, NotImplemented,
                 # 42, 2**100, 3.14, True, False, 1j,
                 # "hello", "hello\u1234", f.__code__,
                 # b"world", bytes(range(256)), slice(1, 10, 2),
                 # NewStyle, Classic, max, WithMetaclass]
        for x in tests:
            self.assertIs(copy.copy(x), x)

    def test_copy_list(self):
        x = [1, 2, 3]
        y = copy.copy(x)
        self.assertEqual(y, x)
        self.assertIsNot(y, x)
        x = []
        y = copy.copy(x)
        self.assertEqual(y, x)
        self.assertIsNot(y, x)
    def test_copy_mixed_set(self):
        class FooSet:
            def bar(self):
                pass
        a = set([1,2,3])
        b = copy.deepcopy(a)
        a = set([1,2,3])
        b = copy.deepcopy(a)
        self.assertTrue(a == b)
        self.assertFalse(a is b)
        mixed = set([(1,2), FooSet.bar])
        mixedcopy = copy.deepcopy(mixed)
        self.assertTrue(mixed == mixedcopy)
        self.assertFalse(mixed is mixedcopy)
        mixed.add(9)
        mixedcopy2 = copy.deepcopy(mixed)
        self.assertTrue(mixed == mixedcopy2)
        self.assertFalse(mixed is mixedcopy2)
        mixed.add(9)
        self.assertFalse(mixed == mixedcopy)
        mixedcopy2 = copy.copy(mixed)
        self.assertTrue(mixed == mixedcopy2)

    def test_copy_tuple(self):
        x = (1, 2, 3)
        self.assertIs(copy.copy(x), x)
        x = ()
        self.assertIs(copy.copy(x), x)
        x = (1, 2, 3, [])
        self.assertIs(copy.copy(x), x)

    # def test_copy_registry(self):
    #   class C:
    #       def __new__(cls, foo):
    #           obj = object.__new__(cls)
    #           obj.foo = foo
    #           return obj
    #   def pickle_C(obj):
    #       return (C, (obj.foo,))
    #   x = C(42)
    #   self.assertRaises(TypeError, copy.copy, x)
        # copyreg.pickle(C, pickle_C, C)
        # y = copy.copy(x)

    def test_copy_reduce_ex(self):
        x = ReduceEx()
        y = copy.copy(x)
        self.assertIs(y, x)
        self.assertEqual(c, [1])

    def test_copy_reduce(self):
        x = Reduce()
        y = copy.copy(x)
        self.assertIs(y, x)
        self.assertEqual(d, [1])

    def test_copy_list(self):
        x = [1, 2, 3]
        y = copy.copy(x)
        self.assertEqual(y, x)
        self.assertIsNot(y, x)
        x = []
        y = copy.copy(x)
        self.assertEqual(y, x)
        self.assertIsNot(y, x)
    def test_copy_tuple(self):
        x = (1, 2, 3)
        self.assertIs(copy.copy(x), x)
        x = ()
        self.assertIs(copy.copy(x), x)
        x = (1, 2, 3, [])
        self.assertIs(copy.copy(x), x)

    def test_copy_dict(self):
        x = {"foo": 1, "bar": 2}
        y = copy.copy(x)
        self.assertEqual(y, x)
        self.assertIsNot(y, x)
        x = {}
        y = copy.copy(x)
        self.assertEqual(y, x)
        self.assertIsNot(y, x)

    def test_copy_set(self):
        x = {1, 2, 3}
        y = copy.copy(x)
        self.assertEqual(y, x)
        self.assertIsNot(y, x)
        x = set()
        y = copy.copy(x)
        self.assertEqual(y, x)
        self.assertIsNot(y, x)
    # # def test_copy_frozenset(self):
    # #     x = frozenset({1, 2, 3})
    # #     self.assertIs(copy.copy(x), x)
    # #     x = frozenset()
    # #     self.assertIs(copy.copy(x), x)
    
    # # def test_copy_bytearray(self):
    # #     x = bytearray(b'abc')
    # #     y = copy.copy(x)
    # #     self.assertEqual(y, x)
    # #     self.assertIsNot(y, x)
    # #     x = bytearray()
    # #     y = copy.copy(x)
    # #     self.assertEqual(y, x)
    # #     self.assertIsNot(y, x)

    def test_copy_inst_vanilla(self):
        x = InstVan(42)
        # print x == copy.copy(x)
        self.assertFalse(copy.copy(x) == x)

    def test_copy_inst_copy(self):
        x = Copy_eq(42)
        self.assertEqual(copy.copy(x), x)
        
    def test_copy_inst_getinitargs(self):
        class C:
            def __init__(self, foo):
                self.foo = foo
            def __getinitargs__(self):
                return (self.foo,)
            def __eq__(self, other):
                return self.foo == other.foo
        x = C(42)
        self.assertRaises(NotImplementedError, copy.copy, x)
        # self.assertEqual(copy.copy(x), x)

    # def test_copy_inst_getnewargs(self):
    #   # class NewArgs(int):
    #   #   def __new__(cls, foo):
    #   #       self = int.__new__(cls)
    #   #       self.foo = foo
    #   #       return self
    #   #   def __getnewargs__(self):
    #   #       return self.foo,
    #   #   def __eq__(self, other):
    #   #       return self.foo == other.foo
    #   x = NewArgs(42)
    #   y = copy.copy(x)
    #   self.assertIsInstance(y, NewArgs)
    #   self.assertEqual(y, x)
    #   self.assertIsNot(y, x)
    #   self.assertEqual(y.foo, x.foo)
    # def test_copy_inst_getnewargs_ex(self):
    #   class C(int):
    #       def __new__(cls, *, foo):
    #           self = int.__new__(cls)
    #           self.foo = foo
    #           return self
    #       def __getnewargs_ex__(self):
    #           return (), {'foo': self.foo}
    #       def __eq__(self, other):
    #           return self.foo == other.foo
    #   x = C(foo=42)
    #   y = copy.copy(x)
    #   self.assertIsInstance(y, C)
    #   self.assertEqual(y, x)
    #   self.assertIsNot(y, x)
    #   self.assertEqual(y.foo, x.foo)

    def test_copy_inst_getstate(self):
        class C:
            def __init__(self, foo):
                self.foo = foo
            def __getstate__(self):
                return {"foo": self.foo}
            def __eq__(self, other):
                return self.foo == other.foo
        x = C(42)
        self.assertRaises(NotImplementedError, copy.copy, x)
        # self.assertEqual(copy.copy(x), x)

    def test_copy_inst_setstate(self):
        class C:
            def __init__(self, foo):
                self.foo = foo
            def __setstate__(self, state):
                self.foo = state["foo"]
            def __eq__(self, other):
                return self.foo == other.foo
        x = C(42)
        self.assertRaises(NotImplementedError, copy.copy, x)
    #   self.assertEqual(copy.copy(x), x)

    def test_copy_inst_getstate_setstate(self):
        class C:
            def __init__(self, foo):
                self.foo = foo
            def __getstate__(self):
                return self.foo
            def __setstate__(self, state):
                self.foo = state
            def __eq__(self, other):
                return self.foo == other.foo
        x = C(42)
        self.assertRaises(NotImplementedError, copy.copy, x)

        # self.assertEqual(copy.copy(x), x)
        # # State with boolean value is false (issue #25718)
        # x = C(0.0)
        # self.assertEqual(copy.copy(x), x)

if __name__ == "__main__":
    unittest.main()