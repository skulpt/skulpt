# import abc
# import builtins
# import collections
# import collections.abc
import copy
from itertools import permutations, chain
# import pickle
from random import choice
import sys
# from test import support
# import threading
import time
# import typing
import unittest
# import unittest.mock
# import os
# from weakref import proxy
# import contextlib

# from test.support.script_helper import assert_python_ok

import functools

# py_functools = support.import_fresh_module('functools', blocked=['_functools'])
# c_functools = support.import_fresh_module('functools', fresh=['_functools'])
py_functools = functools
c_functools = functools

# decimal = support.import_fresh_module('decimal', fresh=['_decimal'])

# @contextlib.contextmanager
# def replaced_module(name, replacement):
#     original_module = sys.modules[name]
#     sys.modules[name] = replacement
#     try:
#         yield
#     finally:
#         sys.modules[name] = original_module

def capture(*args, **kw):
    """capture all positional and keyword arguments"""
    return args, kw


def signature(part):
    """ return the signature of a partial object """
    return (part.func, part.args, part.keywords, part.__dict__)

class MyTuple(tuple):
    pass

class BadTuple(tuple):
    def __add__(self, other):
        return list(self) + list(other)

class MyDict(dict):
    pass


class TestPartial:

    def test_basic_examples(self):
        p = self.partial(capture, 1, 2, a=10, b=20)
        self.assertTrue(callable(p))
        self.assertEqual(p(3, 4, b=30, c=40),
                         ((1, 2, 3, 4), dict(a=10, b=30, c=40)))
        p = self.partial(map, lambda x: x*10)
        self.assertEqual(list(p([1,2,3,4])), [10, 20, 30, 40])

    def test_attributes(self):
        p = self.partial(capture, 1, 2, a=10, b=20)
        # attributes should be readable
        self.assertEqual(p.func, capture)
        self.assertEqual(p.args, (1, 2))
        self.assertEqual(p.keywords, dict(a=10, b=20))

    def test_argument_checking(self):
        self.assertRaises(TypeError, self.partial)     # need at least a func arg
        try:
            self.partial(2)()
        except TypeError:
            pass
        else:
            self.fail('First arg not checked for callability')

    def test_protection_of_callers_dict_argument(self):
        # a caller's dictionary should not be altered by partial
        def func(a=10, b=20):
            return a
        d = {'a':3}
        p = self.partial(func, a=5)
        self.assertEqual(p(**d), 3)
        self.assertEqual(d, {'a':3})
        p(b=7)
        self.assertEqual(d, {'a':3})

    def test_kwargs_copy(self):
        # Issue #29532: Altering a kwarg dictionary passed to a constructor
        # should not affect a partial object after creation
        d = {'a': 3}
        p = self.partial(capture, **d)
        self.assertEqual(p(), ((), {'a': 3}))
        d['a'] = 5
        self.assertEqual(p(), ((), {'a': 3}))

    def test_arg_combinations(self):
        # exercise special code paths for zero args in either partial
        # object or the caller
        p = self.partial(capture)
        self.assertEqual(p(), ((), {}))
        self.assertEqual(p(1,2), ((1,2), {}))
        p = self.partial(capture, 1, 2)
        self.assertEqual(p(), ((1,2), {}))
        self.assertEqual(p(3,4), ((1,2,3,4), {}))

    def test_kw_combinations(self):
        # exercise special code paths for no keyword args in
        # either the partial object or the caller
        p = self.partial(capture)
        self.assertEqual(p.keywords, {})
        self.assertEqual(p(), ((), {}))
        self.assertEqual(p(a=1), ((), {'a':1}))
        p = self.partial(capture, a=1)
        self.assertEqual(p.keywords, {'a':1})
        self.assertEqual(p(), ((), {'a':1}))
        self.assertEqual(p(b=2), ((), {'a':1, 'b':2}))
        # keyword args in the call override those in the partial object
        self.assertEqual(p(a=3, b=2), ((), {'a':3, 'b':2}))

    def test_positional(self):
        # make sure positional arguments are captured correctly
        for args in [(), (0,), (0,1), (0,1,2), (0,1,2,3)]:
            p = self.partial(capture, *args)
            expected = args + ('x',)
            got, empty = p('x')
            self.assertTrue(expected == got and empty == {})

    def test_keyword(self):
        # make sure keyword arguments are captured correctly
        for a in ['a', 0, None, 3.5]:
            p = self.partial(capture, a=a)
            expected = {'a':a,'x':None}
            empty, got = p(x=None)
            self.assertTrue(expected == got and empty == ())

    def test_no_side_effects(self):
        # make sure there are no side effects that affect subsequent calls
        p = self.partial(capture, 0, a=1)
        args1, kw1 = p(1, b=2)
        self.assertTrue(args1 == (0,1) and kw1 == {'a':1,'b':2})
        args2, kw2 = p()
        self.assertTrue(args2 == (0,) and kw2 == {'a':1})

    def test_error_propagation(self):
        def f(x, y):
            x / y
        self.assertRaises(ZeroDivisionError, self.partial(f, 1, 0))
        self.assertRaises(ZeroDivisionError, self.partial(f, 1), 0)
        self.assertRaises(ZeroDivisionError, self.partial(f), 1, 0)
        self.assertRaises(ZeroDivisionError, self.partial(f, y=0), 1)

    # def test_weakref(self):
    #     f = self.partial(int, base=16)
    #     p = proxy(f)
    #     self.assertEqual(f.func, p.func)
    #     f = None
    #     self.assertRaises(ReferenceError, getattr, p, 'func')

    def test_with_bound_and_unbound_methods(self):
        data = list(map(str, range(10)))
        join = self.partial(str.join, '')
        self.assertEqual(join(data), '0123456789')
        join = self.partial(''.join)
        self.assertEqual(join(data), '0123456789')

    def test_nested_optimization(self):
        partial = self.partial
        inner = partial(signature, 'asdf')
        nested = partial(inner, bar=True)
        flat = partial(signature, 'asdf', bar=True)
        self.assertEqual(signature(nested), signature(flat))

    def test_nested_partial_with_attribute(self):
        # see issue 25137
        partial = self.partial

        def foo(bar):
            return bar

        p = partial(foo, 'first')
        p2 = partial(p, 'second')
        p2.new_attr = 'spam'
        self.assertEqual(p2.new_attr, 'spam')

    def test_repr(self):
        args = (object(), object())
        args_repr = ', '.join(repr(a) for a in args)
        kwargs = {'a': object(), 'b': object()}
        kwargs_reprs = ['a={a!r}, b={b!r}'.format(**kwargs),
                        'b={b!r}, a={a!r}'.format(**kwargs)]
        if self.partial in (c_functools.partial, py_functools.partial):
            name = 'functools.partial'
        else:
            name = self.partial.__name__

        f = self.partial(capture)
        self.assertEqual(f'{name}({capture!r})', repr(f))

        f = self.partial(capture, *args)
        self.assertEqual(f'{name}({capture!r}, {args_repr})', repr(f))

        f = self.partial(capture, **kwargs)
        self.assertIn(repr(f),
                      [f'{name}({capture!r}, {kwargs_repr})'
                       for kwargs_repr in kwargs_reprs])

        f = self.partial(capture, *args, **kwargs)
        self.assertIn(repr(f),
                      [f'{name}({capture!r}, {args_repr}, {kwargs_repr})'
                       for kwargs_repr in kwargs_reprs])

    # def test_recursive_repr(self):
    #     if self.partial in (c_functools.partial, py_functools.partial):
    #         name = 'functools.partial'
    #     else:
    #         name = self.partial.__name__

    #     f = self.partial(capture)
    #     f.__setstate__((f, (), {}, {}))
    #     try:
    #         self.assertEqual(repr(f), '%s(...)' % (name,))
    #     finally:
    #         f.__setstate__((capture, (), {}, {}))

    #     f = self.partial(capture)
    #     f.__setstate__((capture, (f,), {}, {}))
    #     try:
    #         self.assertEqual(repr(f), '%s(%r, ...)' % (name, capture,))
    #     finally:
    #         f.__setstate__((capture, (), {}, {}))

    #     f = self.partial(capture)
    #     f.__setstate__((capture, (), {'a': f}, {}))
    #     try:
    #         self.assertEqual(repr(f), '%s(%r, a=...)' % (name, capture,))
    #     finally:
    #         f.__setstate__((capture, (), {}, {}))

    # def test_pickle(self):
    #     with self.AllowPickle():
    #         f = self.partial(signature, ['asdf'], bar=[True])
    #         f.attr = []
    #         for proto in range(pickle.HIGHEST_PROTOCOL + 1):
    #             f_copy = pickle.loads(pickle.dumps(f, proto))
    #             self.assertEqual(signature(f_copy), signature(f))

    def test_copy(self):
        f = self.partial(signature, ['asdf'], bar=[True])
        f.attr = []
        f_copy = copy.copy(f)
        self.assertEqual(signature(f_copy), signature(f))
        self.assertIs(f_copy.attr, f.attr)
        self.assertIs(f_copy.args, f.args)
        self.assertIs(f_copy.keywords, f.keywords)

    # def test_deepcopy(self):
    #     f = self.partial(signature, ['asdf'], bar=[True])
    #     f.attr = []
    #     f_copy = copy.deepcopy(f)
    #     self.assertEqual(signature(f_copy), signature(f))
    #     self.assertIsNot(f_copy.attr, f.attr)
    #     self.assertIsNot(f_copy.args, f.args)
    #     self.assertIsNot(f_copy.args[0], f.args[0])
    #     self.assertIsNot(f_copy.keywords, f.keywords)
    #     self.assertIsNot(f_copy.keywords['bar'], f.keywords['bar'])

    # def test_setstate(self):
    #     f = self.partial(signature)
    #     f.__setstate__((capture, (1,), dict(a=10), dict(attr=[])))

    #     self.assertEqual(signature(f),
    #                      (capture, (1,), dict(a=10), dict(attr=[])))
    #     self.assertEqual(f(2, b=20), ((1, 2), {'a': 10, 'b': 20}))

    #     f.__setstate__((capture, (1,), dict(a=10), None))

    #     self.assertEqual(signature(f), (capture, (1,), dict(a=10), {}))
    #     self.assertEqual(f(2, b=20), ((1, 2), {'a': 10, 'b': 20}))

    #     f.__setstate__((capture, (1,), None, None))
    #     #self.assertEqual(signature(f), (capture, (1,), {}, {}))
    #     self.assertEqual(f(2, b=20), ((1, 2), {'b': 20}))
    #     self.assertEqual(f(2), ((1, 2), {}))
    #     self.assertEqual(f(), ((1,), {}))

    #     f.__setstate__((capture, (), {}, None))
    #     self.assertEqual(signature(f), (capture, (), {}, {}))
    #     self.assertEqual(f(2, b=20), ((2,), {'b': 20}))
    #     self.assertEqual(f(2), ((2,), {}))
    #     self.assertEqual(f(), ((), {}))

    # def test_setstate_errors(self):
    #     f = self.partial(signature)
    #     self.assertRaises(TypeError, f.__setstate__, (capture, (), {}))
    #     self.assertRaises(TypeError, f.__setstate__, (capture, (), {}, {}, None))
    #     self.assertRaises(TypeError, f.__setstate__, [capture, (), {}, None])
    #     self.assertRaises(TypeError, f.__setstate__, (None, (), {}, None))
    #     self.assertRaises(TypeError, f.__setstate__, (capture, None, {}, None))
    #     self.assertRaises(TypeError, f.__setstate__, (capture, [], {}, None))
    #     self.assertRaises(TypeError, f.__setstate__, (capture, (), [], None))

    # def test_setstate_subclasses(self):
    #     f = self.partial(signature)
    #     f.__setstate__((capture, MyTuple((1,)), MyDict(a=10), None))
    #     s = signature(f)
    #     self.assertEqual(s, (capture, (1,), dict(a=10), {}))
    #     self.assertIs(type(s[1]), tuple)
    #     self.assertIs(type(s[2]), dict)
    #     r = f()
    #     self.assertEqual(r, ((1,), {'a': 10}))
    #     self.assertIs(type(r[0]), tuple)
    #     self.assertIs(type(r[1]), dict)

    #     f.__setstate__((capture, BadTuple((1,)), {}, None))
    #     s = signature(f)
    #     self.assertEqual(s, (capture, (1,), {}, {}))
    #     self.assertIs(type(s[1]), tuple)
    #     r = f(2)
    #     self.assertEqual(r, ((1, 2), {}))
    #     self.assertIs(type(r[0]), tuple)

    # def test_recursive_pickle(self):
    #     with self.AllowPickle():
    #         f = self.partial(capture)
    #         f.__setstate__((f, (), {}, {}))
    #         try:
    #             for proto in range(pickle.HIGHEST_PROTOCOL + 1):
    #                 with self.assertRaises(RecursionError):
    #                     pickle.dumps(f, proto)
    #         finally:
    #             f.__setstate__((capture, (), {}, {}))

    #         f = self.partial(capture)
    #         f.__setstate__((capture, (f,), {}, {}))
    #         try:
    #             for proto in range(pickle.HIGHEST_PROTOCOL + 1):
    #                 f_copy = pickle.loads(pickle.dumps(f, proto))
    #                 try:
    #                     self.assertIs(f_copy.args[0], f_copy)
    #                 finally:
    #                     f_copy.__setstate__((capture, (), {}, {}))
    #         finally:
    #             f.__setstate__((capture, (), {}, {}))

    #         f = self.partial(capture)
    #         f.__setstate__((capture, (), {'a': f}, {}))
    #         try:
    #             for proto in range(pickle.HIGHEST_PROTOCOL + 1):
    #                 f_copy = pickle.loads(pickle.dumps(f, proto))
    #                 try:
    #                     self.assertIs(f_copy.keywords['a'], f_copy)
    #                 finally:
    #                     f_copy.__setstate__((capture, (), {}, {}))
    #         finally:
    #             f.__setstate__((capture, (), {}, {}))

    # # Issue 6083: Reference counting bug
    # def test_setstate_refcount(self):
    #     class BadSequence:
    #         def __len__(self):
    #             return 4
    #         def __getitem__(self, key):
    #             if key == 0:
    #                 return max
    #             elif key == 1:
    #                 return tuple(range(1000000))
    #             elif key in (2, 3):
    #                 return {}
    #             raise IndexError

    #     f = self.partial(object)
    #     self.assertRaises(TypeError, f.__setstate__, BadSequence())

# @unittest.skipUnless(c_functools, 'requires the C _functools module')
class TestPartialC(TestPartial, unittest.TestCase):
    if c_functools:
        partial = c_functools.partial

    class AllowPickle:
        def __enter__(self):
            return self
        def __exit__(self, type, value, tb):
            return False

    def test_attributes_unwritable(self):
        # attributes should not be writable
        p = self.partial(capture, 1, 2, a=10, b=20)
        self.assertRaises(AttributeError, setattr, p, 'func', map)
        self.assertRaises(AttributeError, setattr, p, 'args', (1, 2))
        self.assertRaises(AttributeError, setattr, p, 'keywords', dict(a=1, b=2))

        p = self.partial(hex)
        try:
            del p.__dict__
        except TypeError:
            pass
        else:
            self.fail('partial object allowed __dict__ to be deleted')

    def test_manually_adding_non_string_keyword(self):
        p = self.partial(capture)
        # Adding a non-string/unicode keyword to partial kwargs
        p.keywords[1234] = 'value'
        r = repr(p)
        self.assertIn('1234', r)
        self.assertIn("'value'", r)
        with self.assertRaises(TypeError):
            p()

    def test_keystr_replaces_value(self):
        p = self.partial(capture)

        class MutatesYourDict(object):
            def __str__(self):
                p.keywords[self] = ['sth2']
                return 'astr'

        # Replacing the value during key formatting should keep the original
        # value alive (at least long enough).
        p.keywords[MutatesYourDict()] = ['sth']
        r = repr(p)
        self.assertIn('astr', r)
        self.assertIn("['sth']", r)


# class TestPartialPy(TestPartial, unittest.TestCase):
#     partial = py_functools.partial

#     class AllowPickle:
#         def __init__(self):
#             self._cm = replaced_module("functools", py_functools)
#         def __enter__(self):
#             return self._cm.__enter__()
#         def __exit__(self, type, value, tb):
#             return self._cm.__exit__(type, value, tb)

if c_functools:
    class CPartialSubclass(c_functools.partial):
        pass

# class PyPartialSubclass(py_functools.partial):
#     pass

# @unittest.skipUnless(c_functools, 'requires the C _functools module')
class TestPartialCSubclass(TestPartialC):
    if c_functools:
        partial = CPartialSubclass

    # partial subclasses are not optimized for nested calls
    test_nested_optimization = lambda *args: None

# class TestPartialPySubclass(TestPartialPy):
#     partial = PyPartialSubclass

class TestPartialMethod(unittest.TestCase):

    class A(object):
        nothing = functools.partialmethod(capture)
        positional = functools.partialmethod(capture, 1)
        keywords = functools.partialmethod(capture, a=2)
        both = functools.partialmethod(capture, 3, b=4)
        spec_keywords = functools.partialmethod(capture, self=1, func=2)

        nested = functools.partialmethod(positional, 5)

        over_partial = functools.partialmethod(functools.partial(capture, c=6), 7)

        static = functools.partialmethod(staticmethod(capture), 8)
        cls = functools.partialmethod(classmethod(capture), d=9)

    a = A()

    def test_arg_combinations(self):
        self.assertEqual(self.a.nothing(), ((self.a,), {}))
        self.assertEqual(self.a.nothing(5), ((self.a, 5), {}))
        self.assertEqual(self.a.nothing(c=6), ((self.a,), {'c': 6}))
        self.assertEqual(self.a.nothing(5, c=6), ((self.a, 5), {'c': 6}))

        self.assertEqual(self.a.positional(), ((self.a, 1), {}))
        self.assertEqual(self.a.positional(5), ((self.a, 1, 5), {}))
        self.assertEqual(self.a.positional(c=6), ((self.a, 1), {'c': 6}))
        self.assertEqual(self.a.positional(5, c=6), ((self.a, 1, 5), {'c': 6}))

        self.assertEqual(self.a.keywords(), ((self.a,), {'a': 2}))
        self.assertEqual(self.a.keywords(5), ((self.a, 5), {'a': 2}))
        self.assertEqual(self.a.keywords(c=6), ((self.a,), {'a': 2, 'c': 6}))
        self.assertEqual(self.a.keywords(5, c=6), ((self.a, 5), {'a': 2, 'c': 6}))

        self.assertEqual(self.a.both(), ((self.a, 3), {'b': 4}))
        self.assertEqual(self.a.both(5), ((self.a, 3, 5), {'b': 4}))
        self.assertEqual(self.a.both(c=6), ((self.a, 3), {'b': 4, 'c': 6}))
        self.assertEqual(self.a.both(5, c=6), ((self.a, 3, 5), {'b': 4, 'c': 6}))

        self.assertEqual(self.A.both(self.a, 5, c=6), ((self.a, 3, 5), {'b': 4, 'c': 6}))

        self.assertEqual(self.a.spec_keywords(), ((self.a,), {'self': 1, 'func': 2}))

    def test_nested(self):
        self.assertEqual(self.a.nested(), ((self.a, 1, 5), {}))
        self.assertEqual(self.a.nested(6), ((self.a, 1, 5, 6), {}))
        self.assertEqual(self.a.nested(d=7), ((self.a, 1, 5), {'d': 7}))
        self.assertEqual(self.a.nested(6, d=7), ((self.a, 1, 5, 6), {'d': 7}))

        self.assertEqual(self.A.nested(self.a, 6, d=7), ((self.a, 1, 5, 6), {'d': 7}))

    def test_over_partial(self):
        self.assertEqual(self.a.over_partial(), ((self.a, 7), {'c': 6}))
        self.assertEqual(self.a.over_partial(5), ((self.a, 7, 5), {'c': 6}))
        self.assertEqual(self.a.over_partial(d=8), ((self.a, 7), {'c': 6, 'd': 8}))
        self.assertEqual(self.a.over_partial(5, d=8), ((self.a, 7, 5), {'c': 6, 'd': 8}))

        self.assertEqual(self.A.over_partial(self.a, 5, d=8), ((self.a, 7, 5), {'c': 6, 'd': 8}))

    def test_bound_method_introspection(self):
        obj = self.a
        self.assertIs(obj.both.__self__, obj)
        self.assertIs(obj.nested.__self__, obj)
        self.assertIs(obj.over_partial.__self__, obj)
        self.assertIs(obj.cls.__self__, self.A)
        self.assertIs(self.A.cls.__self__, self.A)

    def test_unbound_method_retrieval(self):
        obj = self.A
        self.assertFalse(hasattr(obj.both, "__self__"))
        self.assertFalse(hasattr(obj.nested, "__self__"))
        self.assertFalse(hasattr(obj.over_partial, "__self__"))
        self.assertFalse(hasattr(obj.static, "__self__"))
        self.assertFalse(hasattr(self.a.static, "__self__"))

    def test_descriptors(self):
        for obj in [self.A, self.a]:
            # with self.subTest(obj=obj):
                self.assertEqual(obj.static(), ((8,), {}))
                self.assertEqual(obj.static(5), ((8, 5), {}))
                self.assertEqual(obj.static(d=8), ((8,), {'d': 8}))
                self.assertEqual(obj.static(5, d=8), ((8, 5), {'d': 8}))

                self.assertEqual(obj.cls(), ((self.A,), {'d': 9}))
                self.assertEqual(obj.cls(5), ((self.A, 5), {'d': 9}))
                self.assertEqual(obj.cls(c=8), ((self.A,), {'c': 8, 'd': 9}))
                self.assertEqual(obj.cls(5, c=8), ((self.A, 5), {'c': 8, 'd': 9}))

    def test_overriding_keywords(self):
        self.assertEqual(self.a.keywords(a=3), ((self.a,), {'a': 3}))
        self.assertEqual(self.A.keywords(self.a, a=3), ((self.a,), {'a': 3}))

    def test_invalid_args(self):
        with self.assertRaises(TypeError):
            class B(object):
                method = functools.partialmethod(None, 1)
        with self.assertRaises(TypeError):
            class B:
                method = functools.partialmethod()
        with self.assertRaises(TypeError):
            class B:
                method = functools.partialmethod(func=capture, a=1)

    def test_repr(self):
        self.assertEqual(repr(self.A.__dict__['both']),
                         'functools.partialmethod({}, 3, b=4)'.format(capture))

    # def test_abstract(self):
    #     class Abstract(abc.ABCMeta):

    #         @abc.abstractmethod
    #         def add(self, x, y):
    #             pass

    #         add5 = functools.partialmethod(add, 5)

    #     self.assertTrue(Abstract.add.__isabstractmethod__)
    #     self.assertTrue(Abstract.add5.__isabstractmethod__)

    #     for func in [self.A.static, self.A.cls, self.A.over_partial, self.A.nested, self.A.both]:
    #         self.assertFalse(getattr(func, '__isabstractmethod__', False))

    # def test_positional_only(self):
    #     def f(a, b, /):
    #         return a + b

    #     p = functools.partial(f, 1)
    #     self.assertEqual(p(2), f(1, 2))


class TestUpdateWrapper(unittest.TestCase):

    def check_wrapper(self, wrapper, wrapped,
                      assigned=functools.WRAPPER_ASSIGNMENTS,
                      updated=functools.WRAPPER_UPDATES):
        # Check attributes were assigned
        for name in assigned:
            self.assertIs(getattr(wrapper, name), getattr(wrapped, name))
        # Check attributes were updated
        for name in updated:
            wrapper_attr = getattr(wrapper, name)
            wrapped_attr = getattr(wrapped, name)
            for key in wrapped_attr:
                if name == "__dict__" and key == "__wrapped__":
                    # __wrapped__ is overwritten by the update code
                    continue
                self.assertIs(wrapped_attr[key], wrapper_attr[key])
        # Check __wrapped__
        self.assertIs(wrapper.__wrapped__, wrapped)


    def _default_update(self):
        def f(a:'This is a new annotation'):
            """This is a test"""
            pass
        f.attr = 'This is also a test'
        f.__wrapped__ = "This is a bald faced lie"
        f.__doc__ = 'This is a test' # skulpt does not yet parse docstrings
        def wrapper(b:'This is the prior annotation'):
            pass
        functools.update_wrapper(wrapper, f)
        return wrapper, f

    def test_default_update(self):
        wrapper, f = self._default_update()
        self.check_wrapper(wrapper, f)
        self.assertIs(wrapper.__wrapped__, f)
        self.assertEqual(wrapper.__name__, 'f')
        self.assertEqual(wrapper.__qualname__, f.__qualname__)
        self.assertEqual(wrapper.attr, 'This is also a test')
        # self.assertEqual(wrapper.__annotations__['a'], 'This is a new annotation')
        # self.assertNotIn('b', wrapper.__annotations__)

    # @unittest.skipIf(sys.flags.optimize >= 2,
    #                  "Docstrings are omitted with -O2 and above")
    def test_default_update_doc(self):
        wrapper, f = self._default_update()
        self.assertEqual(wrapper.__doc__, 'This is a test')

    def test_no_update(self):
        def f():
            """This is a test"""
            pass
        f.attr = 'This is also a test'
        def wrapper():
            pass
        functools.update_wrapper(wrapper, f, (), ())
        self.check_wrapper(wrapper, f, (), ())
        self.assertEqual(wrapper.__name__, 'wrapper')
        self.assertNotEqual(wrapper.__qualname__, f.__qualname__)
        self.assertEqual(wrapper.__doc__, None)
        # self.assertEqual(wrapper.__annotations__, {})
        self.assertFalse(hasattr(wrapper, 'attr'))

    def test_selective_update(self):
        def f():
            pass
        f.attr = 'This is a different test'
        f.dict_attr = dict(a=1, b=2, c=3)
        def wrapper():
            pass
        wrapper.dict_attr = {}
        assign = ('attr',)
        update = ('dict_attr',)
        functools.update_wrapper(wrapper, f, assign, update)
        self.check_wrapper(wrapper, f, assign, update)
        self.assertEqual(wrapper.__name__, 'wrapper')
        self.assertNotEqual(wrapper.__qualname__, f.__qualname__)
        self.assertEqual(wrapper.__doc__, None)
        self.assertEqual(wrapper.attr, 'This is a different test')
        self.assertEqual(wrapper.dict_attr, f.dict_attr)

    def test_missing_attributes(self):
        def f():
            pass
        def wrapper():
            pass
        wrapper.dict_attr = {}
        assign = ('attr',)
        update = ('dict_attr',)
        # Missing attributes on wrapped object are ignored
        functools.update_wrapper(wrapper, f, assign, update)
        self.assertNotIn('attr', wrapper.__dict__)
        self.assertEqual(wrapper.dict_attr, {})
        # Wrapper must have expected attributes for updating
        del wrapper.dict_attr
        with self.assertRaises(AttributeError):
            functools.update_wrapper(wrapper, f, assign, update)
        wrapper.dict_attr = 1
        with self.assertRaises(AttributeError):
            functools.update_wrapper(wrapper, f, assign, update)

    # @support.requires_docstrings
    # @unittest.skipIf(sys.flags.optimize >= 2,
    #                  "Docstrings are omitted with -O2 and above")
    def test_builtin_update(self):
        # Test for bug #1576241
        def wrapper():
            pass
        functools.update_wrapper(wrapper, max)
        self.assertEqual(wrapper.__name__, 'max')
        self.assertTrue(wrapper.__doc__.startswith('max('))
        # self.assertEqual(wrapper.__annotations__, {})


class TestWraps(TestUpdateWrapper):

    def _default_update(self):
        def f():
            """This is a test"""
            pass
        f.attr = 'This is also a test'
        f.__wrapped__ = "This is still a bald faced lie"
        f.__doc__ = "This is a test" # skulpt does not yet parse docstrings
        @functools.wraps(f)
        def wrapper():
            pass
        return wrapper, f

    def test_default_update(self):
        wrapper, f = self._default_update()
        self.check_wrapper(wrapper, f)
        self.assertEqual(wrapper.__name__, 'f')
        self.assertEqual(wrapper.__qualname__, f.__qualname__)
        self.assertEqual(wrapper.attr, 'This is also a test')

    # @unittest.skipIf(sys.flags.optimize >= 2,
    #                  "Docstrings are omitted with -O2 and above")
    def test_default_update_doc(self):
        wrapper, _ = self._default_update()
        self.assertEqual(wrapper.__doc__, 'This is a test')

    def test_no_update(self):
        def f():
            """This is a test"""
            pass
        f.attr = 'This is also a test'
        @functools.wraps(f, (), ())
        def wrapper():
            pass
        self.check_wrapper(wrapper, f, (), ())
        self.assertEqual(wrapper.__name__, 'wrapper')
        self.assertNotEqual(wrapper.__qualname__, f.__qualname__)
        self.assertEqual(wrapper.__doc__, None)
        self.assertFalse(hasattr(wrapper, 'attr'))

    def test_selective_update(self):
        def f():
            pass
        f.attr = 'This is a different test'
        f.dict_attr = dict(a=1, b=2, c=3)
        def add_dict_attr(f):
            f.dict_attr = {}
            return f
        assign = ('attr',)
        update = ('dict_attr',)
        @functools.wraps(f, assign, update)
        @add_dict_attr
        def wrapper():
            pass
        self.check_wrapper(wrapper, f, assign, update)
        self.assertEqual(wrapper.__name__, 'wrapper')
        self.assertNotEqual(wrapper.__qualname__, f.__qualname__)
        self.assertEqual(wrapper.__doc__, None)
        self.assertEqual(wrapper.attr, 'This is a different test')
        self.assertEqual(wrapper.dict_attr, f.dict_attr)


class TestReduce:
    def test_reduce(self):
        class Squares:
            def __init__(self, max):
                self.max = max
                self.sofar = []

            def __len__(self):
                return len(self.sofar)

            def __getitem__(self, i):
                if not 0 <= i < self.max: raise IndexError
                n = len(self.sofar)
                while n <= i:
                    self.sofar.append(n*n)
                    n += 1
                return self.sofar[i]
        def add(x, y):
            return x + y
        self.assertEqual(self.reduce(add, ['a', 'b', 'c'], ''), 'abc')
        self.assertEqual(
            self.reduce(add, [['a', 'c'], [], ['d', 'w']], []),
            ['a','c','d','w']
        )
        self.assertEqual(self.reduce(lambda x, y: x*y, range(2,8), 1), 5040)
        self.assertEqual(
            self.reduce(lambda x, y: x*y, range(2,21), 1),
            2432902008176640000
        )
        self.assertEqual(self.reduce(add, Squares(10)), 285)
        self.assertEqual(self.reduce(add, Squares(10), 0), 285)
        self.assertEqual(self.reduce(add, Squares(0), 0), 0)
        self.assertRaises(TypeError, self.reduce)
        self.assertRaises(TypeError, self.reduce, 42, 42)
        self.assertRaises(TypeError, self.reduce, 42, 42, 42)
        self.assertEqual(self.reduce(42, "1"), "1") # func is never called with one item
        self.assertEqual(self.reduce(42, "", "1"), "1") # func is never called with one item
        self.assertRaises(TypeError, self.reduce, 42, (42, 42))
        self.assertRaises(TypeError, self.reduce, add, []) # arg 2 must not be empty sequence with no initial value
        self.assertRaises(TypeError, self.reduce, add, "")
        self.assertRaises(TypeError, self.reduce, add, ())
        self.assertRaises(TypeError, self.reduce, add, object())

        class TestFailingIter:
            def __iter__(self):
                raise RuntimeError
        self.assertRaises(RuntimeError, self.reduce, add, TestFailingIter())

        self.assertEqual(self.reduce(add, [], None), None)
        self.assertEqual(self.reduce(add, [], 42), 42)

        class BadSeq:
            def __getitem__(self, index):
                raise ValueError
        self.assertRaises(ValueError, self.reduce, 42, BadSeq())

    # Test reduce()'s use of iterators.
    def test_iterator_usage(self):
        class SequenceClass:
            def __init__(self, n):
                self.n = n
            def __getitem__(self, i):
                if 0 <= i < self.n:
                    return i
                else:
                    raise IndexError

        from operator import add
        self.assertEqual(self.reduce(add, SequenceClass(5)), 10)
        self.assertEqual(self.reduce(add, SequenceClass(5), 42), 52)
        self.assertRaises(TypeError, self.reduce, add, SequenceClass(0))
        self.assertEqual(self.reduce(add, SequenceClass(0), 42), 42)
        self.assertEqual(self.reduce(add, SequenceClass(1)), 0)
        self.assertEqual(self.reduce(add, SequenceClass(1), 42), 42)

        d = {"one": 1, "two": 2, "three": 3}
        self.assertEqual(self.reduce(add, d), "".join(d.keys()))


# @unittest.skipUnless(c_functools, 'requires the C _functools module')
class TestReduceC(TestReduce, unittest.TestCase):
    if c_functools:
        reduce = c_functools.reduce


# class TestReducePy(TestReduce, unittest.TestCase):
#     reduce = staticmethod(py_functools.reduce)


class TestCmpToKey:

    def test_cmp_to_key(self):
        def cmp1(x, y):
            return (x > y) - (x < y)
        key = self.cmp_to_key(cmp1)
        self.assertEqual(key(3), key(3))
        self.assertGreater(key(3), key(1))
        self.assertGreaterEqual(key(3), key(3))

        def cmp2(x, y):
            return int(x) - int(y)
        key = self.cmp_to_key(cmp2)
        self.assertEqual(key(4.0), key('4'))
        self.assertLess(key(2), key('35'))
        self.assertLessEqual(key(2), key('35'))
        self.assertNotEqual(key(2), key('35'))

    def test_cmp_to_key_arguments(self):
        def cmp1(x, y):
            return (x > y) - (x < y)
        key = self.cmp_to_key(mycmp=cmp1)
        self.assertEqual(key(obj=3), key(obj=3))
        self.assertGreater(key(obj=3), key(obj=1))
        with self.assertRaises((TypeError, AttributeError)):
            key(3) > 1    # rhs is not a K object
        with self.assertRaises((TypeError, AttributeError)):
            1 < key(3)    # lhs is not a K object
        with self.assertRaises(TypeError):
            key = self.cmp_to_key()             # too few args
        with self.assertRaises(TypeError):
            key = self.cmp_to_key(cmp1, None)   # too many args
        key = self.cmp_to_key(cmp1)
        with self.assertRaises(TypeError):
            key()                                    # too few args
        with self.assertRaises(TypeError):
            key(None, None)                          # too many args

    def test_bad_cmp(self):
        def cmp1(x, y):
            raise ZeroDivisionError
        key = self.cmp_to_key(cmp1)
        with self.assertRaises(ZeroDivisionError):
            key(3) > key(1)

        class BadCmp:
            def __lt__(self, other):
                raise ZeroDivisionError
        def cmp1(x, y):
            return BadCmp()
        with self.assertRaises(ZeroDivisionError):
            key(3) > key(1)

    def test_obj_field(self):
        def cmp1(x, y):
            return (x > y) - (x < y)
        key = self.cmp_to_key(mycmp=cmp1)
        self.assertEqual(key(50).obj, 50)

    def test_sort_int(self):
        def mycmp(x, y):
            return y - x
        self.assertEqual(sorted(range(5), key=self.cmp_to_key(mycmp)),
                         [4, 3, 2, 1, 0])

    def test_sort_int_str(self):
        def mycmp(x, y):
            x, y = int(x), int(y)
            return (x > y) - (x < y)
        values = [5, '3', 7, 2, '0', '1', 4, '10', 1]
        values = sorted(values, key=self.cmp_to_key(mycmp))
        self.assertEqual([int(value) for value in values],
                         [0, 1, 1, 2, 3, 4, 5, 7, 10])

    def test_hash(self):
        def mycmp(x, y):
            return y - x
        key = self.cmp_to_key(mycmp)
        k = key(10)
        self.assertRaises(TypeError, hash, k)
        # self.assertNotIsInstance(k, collections.abc.Hashable)


# @unittest.skipUnless(c_functools, 'requires the C _functools module')
class TestCmpToKeyC(TestCmpToKey, unittest.TestCase):
    if c_functools:
        cmp_to_key = c_functools.cmp_to_key


# class TestCmpToKeyPy(TestCmpToKey, unittest.TestCase):
#     cmp_to_key = staticmethod(py_functools.cmp_to_key)

class TestTotalOrdering(unittest.TestCase):

    def test_total_ordering_lt(self):
        @functools.total_ordering
        class A:
            def __init__(self, value):
                self.value = value
            def __lt__(self, other):
                return self.value < other.value
            def __eq__(self, other):
                return self.value == other.value
        self.assertTrue(A(1) < A(2))
        self.assertTrue(A(2) > A(1))
        self.assertTrue(A(1) <= A(2))
        self.assertTrue(A(2) >= A(1))
        self.assertTrue(A(2) <= A(2))
        self.assertTrue(A(2) >= A(2))
        self.assertFalse(A(1) > A(2))

    def test_total_ordering_le(self):
        @functools.total_ordering
        class A:
            def __init__(self, value):
                self.value = value
            def __le__(self, other):
                return self.value <= other.value
            def __eq__(self, other):
                return self.value == other.value
        self.assertTrue(A(1) < A(2))
        self.assertTrue(A(2) > A(1))
        self.assertTrue(A(1) <= A(2))
        self.assertTrue(A(2) >= A(1))
        self.assertTrue(A(2) <= A(2))
        self.assertTrue(A(2) >= A(2))
        self.assertFalse(A(1) >= A(2))

    def test_total_ordering_gt(self):
        @functools.total_ordering
        class A:
            def __init__(self, value):
                self.value = value
            def __gt__(self, other):
                return self.value > other.value
            def __eq__(self, other):
                return self.value == other.value
        self.assertTrue(A(1) < A(2))
        self.assertTrue(A(2) > A(1))
        self.assertTrue(A(1) <= A(2))
        self.assertTrue(A(2) >= A(1))
        self.assertTrue(A(2) <= A(2))
        self.assertTrue(A(2) >= A(2))
        self.assertFalse(A(2) < A(1))

    def test_total_ordering_ge(self):
        @functools.total_ordering
        class A:
            def __init__(self, value):
                self.value = value
            def __ge__(self, other):
                return self.value >= other.value
            def __eq__(self, other):
                return self.value == other.value
        self.assertTrue(A(1) < A(2))
        self.assertTrue(A(2) > A(1))
        self.assertTrue(A(1) <= A(2))
        self.assertTrue(A(2) >= A(1))
        self.assertTrue(A(2) <= A(2))
        self.assertTrue(A(2) >= A(2))
        self.assertFalse(A(2) <= A(1))

    def test_total_ordering_no_overwrite(self):
        # new methods should not overwrite existing
        @functools.total_ordering
        class A(int):
            pass
        self.assertTrue(A(1) < A(2))
        self.assertTrue(A(2) > A(1))
        self.assertTrue(A(1) <= A(2))
        self.assertTrue(A(2) >= A(1))
        self.assertTrue(A(2) <= A(2))
        self.assertTrue(A(2) >= A(2))

    def test_no_operations_defined(self):
        with self.assertRaises(ValueError):
            @functools.total_ordering
            class A:
                pass

    def test_type_error_when_not_implemented(self):
        # bug 10042; ensure stack overflow does not occur
        # when decorated types return NotImplemented
        @functools.total_ordering
        class ImplementsLessThan:
            def __init__(self, value):
                self.value = value
            def __eq__(self, other):
                if isinstance(other, ImplementsLessThan):
                    return self.value == other.value
                return False
            def __lt__(self, other):
                if isinstance(other, ImplementsLessThan):
                    return self.value < other.value
                return NotImplemented

        @functools.total_ordering
        class ImplementsGreaterThan:
            def __init__(self, value):
                self.value = value
            def __eq__(self, other):
                if isinstance(other, ImplementsGreaterThan):
                    return self.value == other.value
                return False
            def __gt__(self, other):
                if isinstance(other, ImplementsGreaterThan):
                    return self.value > other.value
                return NotImplemented

        @functools.total_ordering
        class ImplementsLessThanEqualTo:
            def __init__(self, value):
                self.value = value
            def __eq__(self, other):
                if isinstance(other, ImplementsLessThanEqualTo):
                    return self.value == other.value
                return False
            def __le__(self, other):
                if isinstance(other, ImplementsLessThanEqualTo):
                    return self.value <= other.value
                return NotImplemented

        @functools.total_ordering
        class ImplementsGreaterThanEqualTo:
            def __init__(self, value):
                self.value = value
            def __eq__(self, other):
                if isinstance(other, ImplementsGreaterThanEqualTo):
                    return self.value == other.value
                return False
            def __ge__(self, other):
                if isinstance(other, ImplementsGreaterThanEqualTo):
                    return self.value >= other.value
                return NotImplemented

        @functools.total_ordering
        class ComparatorNotImplemented:
            def __init__(self, value):
                self.value = value
            def __eq__(self, other):
                if isinstance(other, ComparatorNotImplemented):
                    return self.value == other.value
                return False
            def __lt__(self, other):
                return NotImplemented

        with self.assertRaises(TypeError):
            ImplementsLessThan(-1) < 1

        with self.assertRaises(TypeError):
            ImplementsLessThan(0) < ImplementsLessThanEqualTo(0)

        with self.assertRaises(TypeError):
            ImplementsLessThan(1) < ImplementsGreaterThan(1)

        with self.assertRaises(TypeError):
            ImplementsLessThanEqualTo(2) <= ImplementsLessThan(2)

        with self.assertRaises(TypeError):
            ImplementsLessThanEqualTo(3) <= ImplementsGreaterThanEqualTo(3)

        with self.assertRaises(TypeError):
            ImplementsGreaterThan(4) > ImplementsGreaterThanEqualTo(4)

        with self.assertRaises(TypeError):
            ImplementsGreaterThan(5) > ImplementsLessThan(5)

        with self.assertRaises(TypeError):
            ImplementsGreaterThanEqualTo(6) >= ImplementsGreaterThan(6)

        with self.assertRaises(TypeError):
            ImplementsGreaterThanEqualTo(7) >= ImplementsLessThanEqualTo(7)

        # with self.subTest("GE when equal"):
        a = ComparatorNotImplemented(8)
        b = ComparatorNotImplemented(8)
        self.assertEqual(a, b)
        with self.assertRaises(TypeError):
            a >= b

        # with self.subTest("LE when equal"):
        a = ComparatorNotImplemented(9)
        b = ComparatorNotImplemented(9)
        self.assertEqual(a, b)
        with self.assertRaises(TypeError):
            a <= b

#     def test_pickle(self):
#         for proto in range(pickle.HIGHEST_PROTOCOL + 1):
#             for name in '__lt__', '__gt__', '__le__', '__ge__':
#                 with self.subTest(method=name, proto=proto):
#                     method = getattr(Orderable_LT, name)
#                     method_copy = pickle.loads(pickle.dumps(method, proto))
#                     self.assertIs(method_copy, method)

# @functools.total_ordering
# class Orderable_LT:
#     def __init__(self, value):
#         self.value = value
#     def __lt__(self, other):
#         return self.value < other.value
#     def __eq__(self, other):
#         return self.value == other.value

if __name__ == '__main__':
    unittest.main(verbosity=1)
