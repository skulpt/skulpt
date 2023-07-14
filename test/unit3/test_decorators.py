# Test case for property
# more tests are in test_descr

import sys
import unittest

class PropertyBase(Exception):
    pass

class PropertyGet(PropertyBase):
    pass

class PropertySet(PropertyBase):
    pass

class PropertyDel(PropertyBase):
    pass

class BaseClass(object):
    def __init__(self):
        self._spam = 5

    @property
    def spam(self):
        """BaseClass.getter"""
        return self._spam

    @spam.setter
    def spam(self, value):
        self._spam = value

    @spam.deleter
    def spam(self):
        pass
        #del self._spam

class SubClass(BaseClass):

    @BaseClass.spam.getter
    def spam(self):
        """SubClass.getter"""
        raise PropertyGet(self._spam)

    @spam.setter
    def spam(self, value):
        raise PropertySet(self._spam)

    @spam.deleter
    def spam(self):
        raise PropertyDel(self._spam)

class PropertyDocBase(object):
    _spam = 1
    def _get_spam(self):
        return self._spam
    spam = property(_get_spam, doc="spam spam spam")

class PropertyDocSub(PropertyDocBase):
    @PropertyDocBase.spam.getter
    def spam(self):
        """The decorator does not use this doc string"""
        return self._spam

class PropertySubNewGetter(BaseClass):
    @BaseClass.spam.getter
    def spam(self):
        """new docstring"""
        return 5

class PropertyNewGetter(object):
    @property
    def spam(self):
        """original docstring"""
        return 1
    @spam.getter
    def spam(self):
        """new docstring"""
        return 8

class PropertyTests(unittest.TestCase):
    def test_property_decorator_baseclass(self):
        # see #1620
        base = BaseClass()
        self.assertEqual(base.spam, 5)
        self.assertEqual(base._spam, 5)
        base.spam = 10
        self.assertEqual(base.spam, 10)
        self.assertEqual(base._spam, 10)
        # delattr(base, "spam")
        # self.assertTrue(not hasattr(base, "spam"))
        # self.assertTrue(not hasattr(base, "_spam"))
        base.spam = 20
        self.assertEqual(base.spam, 20)
        self.assertEqual(base._spam, 20)

    def test_property_decorator_subclass(self):
        # see #1620
        sub = SubClass()
        self.assertRaises(PropertyGet, getattr, sub, "spam")
        self.assertRaises(PropertySet, setattr, sub, "spam", None)
        # self.assertRaises(PropertyDel, delattr, sub, "spam")

    # def test_property_decorator_subclass_doc(self):
    #     sub = SubClass()
    #     self.assertEqual(sub.__class__.spam.__doc__, "SubClass.getter")
    #
    # def test_property_decorator_baseclass_doc(self):
    #     base = BaseClass()
    #     self.assertEqual(base.__class__.spam.__doc__, "BaseClass.getter")

    # def test_property_decorator_doc(self):
    #     base = PropertyDocBase()
    #     sub = PropertyDocSub()
    #     self.assertEqual(base.__class__.spam.__doc__, "spam spam spam")
    #     self.assertEqual(sub.__class__.spam.__doc__, "spam spam spam")

    # def test_property_getter_doc_override(self):
    #     newgettersub = PropertySubNewGetter()
    #     self.assertEqual(newgettersub.spam, 5)
    #     self.assertEqual(newgettersub.__class__.spam.__doc__, "new docstring")
    #     newgetter = PropertyNewGetter()
    #     self.assertEqual(newgetter.spam, 8)
    #     self.assertEqual(newgetter.__class__.spam.__doc__, "new docstring")

    # def test_property___isabstractmethod__descriptor(self):
    #     for val in (True, False, [], [1], '', '1'):
    #         class C(object):
    #             def foo(self):
    #                 pass
    #             foo.__isabstractmethod__ = val
    #             foo = property(foo)
    #         self.assertIs(C.foo.__isabstractmethod__, bool(val))
    #
    #     # check that the property's __isabstractmethod__ descriptor does the
    #     # right thing when presented with a value that fails truth testing:
    #     class NotBool(object):
    #         def __bool__(self):
    #             raise ValueError()
    #         __len__ = __bool__
    #     with self.assertRaises(ValueError):
    #         class C(object):
    #             def foo(self):
    #                 pass
    #             foo.__isabstractmethod__ = NotBool()
    #             foo = property(foo)
    #         C.foo.__isabstractmethod__

    # def test_property_builtin_doc_writable(self):
    #     p = property(doc='basic')
    #     self.assertEqual(p.__doc__, 'basic')
    #     p.__doc__= 'extended'
    #     self.assertEqual(p.__doc__, 'extended')

    # def test_property_decorator_doc_writable(self):
    #     class PropertyWritableDoc(object):
    #
    #         @property
    #         def spam(self):
    #             """Eggs"""
    #             return "eggs"
    #
    #     sub = PropertyWritableDoc()
    #     self.assertEqual(sub.__class__.spam.__doc__, 'Eggs')
    #     sub.__class__.spam.__doc__ = 'Spam'
    #     self.assertEqual(sub.__class__.spam.__doc__, 'Spam')

# Issue 5890: subclasses of property do not preserve method __doc__ strings
class PropertySub(property):
    """This is a subclass of property"""

class PropertySubSlots(property):
    """This is a subclass of property that defines __slots__"""
    __slots__ = ()

class Foo(object):
    def __init__(self): self._spam = 1
    @PropertySub
    def spam(self):
        """spam wrapped in property subclass"""
        return self._spam
    @spam.setter
    def spam(self, value):
        """this docstring is ignored"""
        self._spam = value

class FooSub(Foo):
    @Foo.spam.setter
    def spam(self, value):
        """another ignored docstring"""
        self._spam = 'eggs'

class PropertySubclassTests(unittest.TestCase):

    # def test_slots_docstring_copy_exception(self):
    #     try:
    #         class Foo(object):
    #             @PropertySubSlots
    #             def spam(self):
    #                 """Trying to copy this docstring will raise an exception"""
    #                 return 1
    #     except AttributeError:
    #         pass
    #     else:
    #         raise Exception("AttributeError not raised")
    #
    # def test_docstring_copy(self):
    #     class Foo(object):
    #         @PropertySub
    #         def spam(self):
    #             """spam wrapped in property subclass"""
    #             return 1
    #     self.assertEqual(
    #         Foo.spam.__doc__,
    #         "spam wrapped in property subclass")

    def test_property_setter_copies_getter_docstring(self):
        foo = Foo()
        self.assertEqual(foo.spam, 1)
        foo.spam = 2
        self.assertEqual(foo.spam, 2)
        # self.assertEqual(
        #     Foo.spam.__doc__,
        #     "spam wrapped in property subclass")

        foosub = FooSub()
        self.assertEqual(foosub.spam, 1)
        foosub.spam = 7
        self.assertEqual(foosub.spam, 'eggs')
        # self.assertEqual(
        #     FooSub.spam.__doc__,
        #     "spam wrapped in property subclass")

    # def test_property_new_getter_new_docstring(self):
    #
    #     class Foo(object):
    #         @PropertySub
    #         def spam(self):
    #             """a docstring"""
    #             return 1
    #         @spam.getter
    #         def spam(self):
    #             """a new docstring"""
    #             return 2
    #     self.assertEqual(Foo.spam.__doc__, "a new docstring")
    #     class FooBase(object):
    #         @PropertySub
    #         def spam(self):
    #             """a docstring"""
    #             return 1
    #     class Foo2(FooBase):
    #         @FooBase.spam.getter
    #         def spam(self):
    #             """a new docstring"""
    #             return 2
    #     self.assertEqual(Foo.spam.__doc__, "a new docstring")

class TestDecorators(unittest.TestCase):

    def test_single(self):
        class C(object):
            @staticmethod
            def foo(): return 42
        self.assertEqual(C.foo(), 42)
        self.assertEqual(C().foo(), 42)

    def test_staticmethods(self):
        # Testing static methods...
        class C(object):
            def foo(*a): return a
            goo = staticmethod(foo)
        c = C()
        self.assertEqual(C.goo(1), (1,))
        self.assertEqual(c.goo(1), (1,))
        self.assertEqual(c.foo(1), (c, 1,))
        class D(C):
            pass
        d = D()
        self.assertEqual(D.goo(1), (1,))
        self.assertEqual(d.goo(1), (1,))
        self.assertEqual(d.foo(1), (d, 1))
        self.assertEqual(D.foo(d, 1), (d, 1))

    def test_classmethods(self):
        # Testing class methods...
        class C(object):
            def foo(*a): return a
            goo = classmethod(foo)
        c = C()
        self.assertEqual(C.goo(1), (C, 1))
        self.assertEqual(c.goo(1), (C, 1))
        self.assertEqual(c.foo(1), (c, 1))
        class D(C):
            pass
        d = D()
        self.assertEqual(D.goo(1), (D, 1))
        self.assertEqual(d.goo(1), (D, 1))
        self.assertEqual(d.foo(1), (d, 1))
        self.assertEqual(D.foo(d, 1), (d, 1))
        # Test for a specific crash (SF bug 528132)
        def f(cls, arg): return (cls, arg)
        ff = classmethod(f)
        self.assertEqual(ff.__get__(0, int)(42), (int, 42))
        self.assertEqual(ff.__get__(0)(42), (int, 42))

    def test_nested_decorators(self):
        creates = []
        applies = []
        calls = []
        def decorate(call_name):
            creates.append(call_name)
            def wrap(f):
                applies.append(call_name)
                def wrapped(*args, **kwargs):
                    calls.append(call_name)
                    return f(*args, **kwargs)
                return wrapped
            return wrap

        @decorate('outer')
        @decorate('inner')
        def f(x):
            return x

        self.assertEqual(42, f(42))
        self.assertEqual(['outer', 'inner'], creates)
        self.assertEqual(['inner', 'outer'], applies)
        self.assertEqual(['outer', 'inner'], calls)


    def test_class_decorator(self):
        def decorate(c):
            def f():
                return c(42)
            return f

        @decorate
        class Foo:
            def __init__(self, value):
                self.value = value

        foo = Foo()
        self.assertEqual(42, foo.value)

    def test_nested_class_decorators(self):
        creates = []
        applies = []
        calls = []
        def decorate(call_name):
            creates.append(call_name)
            def wrap(f):
                applies.append(call_name)
                def wrapped(*args, **kwargs):
                    calls.append(call_name)
                    return f(*args, **kwargs)
                return wrapped
            return wrap

        @decorate('outer')
        @decorate('inner')
        class Foo:
            def __init__(self, value):
                self.value = value

        foo = Foo(42)
        self.assertEqual(42, foo.value)
        self.assertEqual(['outer', 'inner'], creates)
        self.assertEqual(['inner', 'outer'], applies)
        self.assertEqual(['outer', 'inner'], calls)


if __name__ == '__main__':
    unittest.main()
