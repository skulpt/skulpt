import unittest

class ClassPropertiesAndMethods(unittest.TestCase):

    def test_meth_class_get(self):
        # Testing __get__ method of METH_CLASS C methods...
        # Full coverage of descrobject.c::classmethod_get()

        # Baseline
        arg = [1, 2, 3]
        res = {1: None, 2: None, 3: None}
        self.assertEqual(dict.fromkeys(arg), res)
        self.assertEqual({}.fromkeys(arg), res)

        # Now get the descriptor
        descr = dict.__dict__["fromkeys"]

        # More baseline using the descriptor directly
        self.assertEqual(descr.__get__(None, dict)(arg), res)
        self.assertEqual(descr.__get__({})(arg), res)

        # Now check various error cases
        try:
            descr.__get__(None, None)
        except TypeError:
            pass
        else:
            self.fail("shouldn't have allowed descr.__get__(None, None)")
        try:
            descr.__get__(42)
        except TypeError:
            pass
        # these don't work because builtin types support do perform __get__ on the function
        # to get the unbound method. After this we can not treat these differently to normal
        # methods. We should remove the __get__ function from the prototype if it's an internal 
        # method. Maybe it should even be it's own class.
        else:
            self.fail("shouldn't have allowed descr.__get__(42)")
        try:
            descr.__get__(None, 42)
        except TypeError:
            pass
        else:
            self.fail("shouldn't have allowed descr.__get__(None, 42)")
        try:
            descr.__get__(None, int)
        except TypeError:
            pass
        else:
           self.fail("shouldn't have allowed descr.__get__(None, int)")

    def assertHasAttr(self, obj, name):
        self.assertTrue(hasattr(obj, name),
                        '%r has no attribute %r' % (obj, name))

    def assertNotHasAttr(self, obj, name):
        self.assertFalse(hasattr(obj, name),
                         '%r has unexpected attribute %r' % (obj, name))


    # see thread python-dev/2002-October/029035.html
    def st_ex5_from_c3_switch(self):
        # Testing ex5 from C3 switch discussion...
        class A(object): pass
        class B(object): pass
        class C(object): pass
        class X(A): pass
        class Y(A): pass
        class Z(X,B,Y,C): pass
        self.assertEqual(Z.__mro__, (Z, X, B, Y, A, C, object))

    # see "A Monotonic Superclass Linearization for Dylan",
    # by Kim Barrett et al. (OOPSLA 1996)
    def test_monotonicity(self):
        # Testing MRO monotonicity...
        class Boat(object): pass
        class DayBoat(Boat): pass
        class WheelBoat(Boat): pass
        class EngineLess(DayBoat): pass
        class SmallMultihull(DayBoat): pass
        class PedalWheelBoat(EngineLess,WheelBoat): pass
        class SmallCatamaran(SmallMultihull): pass
        class Pedalo(PedalWheelBoat,SmallCatamaran): pass

        self.assertEqual(PedalWheelBoat.__mro__,
              (PedalWheelBoat, EngineLess, DayBoat, WheelBoat, Boat, object))
        self.assertEqual(SmallCatamaran.__mro__,
              (SmallCatamaran, SmallMultihull, DayBoat, Boat, object))
        self.assertEqual(Pedalo.__mro__,
              (Pedalo, PedalWheelBoat, EngineLess, SmallCatamaran,
               SmallMultihull, DayBoat, WheelBoat, Boat, object))

    # see "A Monotonic Superclass Linearization for Dylan",
    # by Kim Barrett et al. (OOPSLA 1996)
    def test_consistency_with_epg(self):
        # Testing consistency with EPG...
        class Pane(object): pass
        class ScrollingMixin(object): pass
        class EditingMixin(object): pass
        class ScrollablePane(Pane,ScrollingMixin): pass
        class EditablePane(Pane,EditingMixin): pass
        class EditableScrollablePane(ScrollablePane,EditablePane): pass

        self.assertEqual(EditableScrollablePane.__mro__,
              (EditableScrollablePane, ScrollablePane, EditablePane, Pane,
                ScrollingMixin, EditingMixin, object))


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


    def test_compattr(self):
        # Testing computed attributes...
        class C(object):
            class computed_attribute(object):
                def __init__(self, get, set=None, delete=None):
                    self.__get = get
                    self.__set = set
                    self.__delete = delete
                def __get__(self, obj, type=None):
                    return self.__get(obj)
                def __set__(self, obj, value):
                    return self.__set(obj, value)
                def __delete__(self, obj):
                    return self.__delete(obj)
            def __init__(self):
                self.__x = 0
            def __get_x(self):
                x = self.__x
                self.__x = x+1
                return x
            def __set_x(self, x):
                self.__x = x
            def __delete_x(self):
                pass
                #del self.__x
            x = computed_attribute(__get_x, __set_x, __delete_x)
        a = C()
        self.assertEqual(a.x, 0)
        self.assertEqual(a.x, 1)
        a.x = 10
        self.assertEqual(a.x, 10)
        self.assertEqual(a.x, 11)
        # del a.x
        # self.assertNotHasAttr(a, 'x')

    def test_newslots(self):
        # Testing __new__ slot override...
        class C(list):
            def __new__(cls):
                self = list.__new__(cls)
                self.foo = 1
                return self
            def __init__(self):
                self.foo = self.foo + 2
        a = C()
        self.assertEqual(a.foo, 3)
        self.assertEqual(a.__class__, C)
        class D(C):
            pass
        b = D()
        self.assertEqual(b.foo, 3)
        self.assertEqual(b.__class__, D)


    def test_supers(self):
        # Testing super...
        class A(object):
            def meth(self, a):
                return "A(%r)" % a

        self.assertEqual(A().meth(1), "A(1)")

        class B(A):
            def __init__(self):
                self.__super = super(B, self)
            def meth(self, a):
                return "B(%r)" % a + self.__super.meth(a)

        self.assertEqual(B().meth(2), "B(2)A(2)")

        class C(A):
            def meth(self, a):
                return "C(%r)" % a + self.__super.meth(a)
        C._C__super = super(C)

        self.assertEqual(C().meth(3), "C(3)A(3)")

        class D(C, B):
            def meth(self, a):
                return "D(%r)" % a + super(D, self).meth(a)

        self.assertEqual(D().meth(4), "D(4)C(4)B(4)A(4)")

        # Test for subclassing super

        class mysuper(super):
            def __init__(self, *args):
                return super(mysuper, self).__init__(*args)

        class E(D):
            def meth(self, a):
                return "E(%r)" % a + mysuper(E, self).meth(a)

        self.assertEqual(E().meth(5), "E(5)D(5)C(5)B(5)A(5)")

        class F(E):
            def meth(self, a):
                s = self.__super # == mysuper(F, self)
                return "F(%r)[%s]" % (a, s.__class__.__name__) + s.meth(a)
        F._F__super = mysuper(F)

        self.assertEqual(F().meth(6), "F(6)[mysuper]E(6)D(6)C(6)B(6)A(6)")

        # Make sure certain errors are raised

        try:
            super(D, 42)
        except TypeError:
            pass
        else:
            self.fail("shouldn't allow super(D, 42)")

        try:
            super(D, C())
        except TypeError:
            pass
        else:
            self.fail("shouldn't allow super(D, C())")

        try:
            super(D).__get__(12)
        except TypeError:
            pass
        else:
            self.fail("shouldn't allow super(D).__get__(12)")

        try:
            super(D).__get__(C())
        except TypeError:
            pass
        else:
            self.fail("shouldn't allow super(D).__get__(C())")

        # Make sure data descriptors can be overridden and accessed via super
        # (new feature in Python 2.3)

        class DDbase(object):
            def getx(self): return 42
            x = property(getx)

        class DDsub(DDbase):
            def getx(self): return "hello"
            x = property(getx)

        dd = DDsub()
        self.assertEqual(dd.x, "hello")
        self.assertEqual(super(DDsub, dd).x, 42)

        # Ensure that super() lookup of descriptor from classmethod
        # works (SF ID# 743627)

        class Base(object):
            aProp = property(lambda self: "foo")

        class Sub(Base):
            @classmethod
            def test(klass):
                return super(Sub,klass).aProp

        self.assertEqual(Sub.test(), Base.aProp)

        # Verify that super() doesn't allow keyword args
        try:
            super(Base, kw=1)
        except TypeError:
            pass
        else:
            self.assertEqual("super shouldn't accept keyword args")


    def test_hash_inheritance(self):
        # Testing hash of mutable subclasses...

        class mydict(dict):
            pass
        d = mydict()
        try:
            hash(d)
        except TypeError:
            pass
        else:
            self.fail("hash() of dict subclass should fail")

        class mylist(list):
            pass
        d = mylist()
        try:
            hash(d)
        except TypeError:
            pass
        else:
            self.fail("hash() of list subclass should fail")


    def test_imul_bug(self):
        # Testing for __imul__ problems...
        # SF bug 544647
        class C(object):
            def __imul__(self, other):
                return (self, other)
        x = C()
        y = x
        y *= 1.0
        self.assertEqual(y, (x, 1.0))
        y = x
        y *= 2
        self.assertEqual(y, (x, 2))
        y = x
        y *= 3L
        self.assertEqual(y, (x, 3L))
        y = x
        y *= 1L<<100
        self.assertEqual(y, (x, 1L<<100))
        y = x
        y *= None
        self.assertEqual(y, (x, None))
        y = x
        y *= "foo"
        self.assertEqual(y, (x, "foo"))


    def test_rmul(self):
        # Testing correct invocation of __rmul__...
        # SF patch 592646
        class C(object):
            def __mul__(self, other):
                return "mul"
            def __rmul__(self, other):
                return "rmul"
        a = C()
        self.assertEqual(a*2, "mul")
        self.assertEqual(a*2.2, "mul")
        self.assertEqual(2*a, "rmul")
        self.assertEqual(2.2*a, "rmul")


    def test_mutable_names(self):
        # Testing mutable names...
        class C(object):
            pass

        # C.__module__ could be 'test_descr' or '__main__'
        mod = C.__module__

        C.__name__ = 'D'
        self.assertEqual((C.__module__, C.__name__), (mod, 'D'))

        C.__name__ = 'D.E'
        self.assertEqual((C.__module__, C.__name__), (mod, 'D.E'))


    def test_init(self):
        # SF 1155938
        class Foo(object):
            def __init__(self):
                return 10
        try:
            Foo()
        except TypeError:
            pass
        else:
            self.fail("did not test __init__() for None return")


    def test_type___getattribute__(self):
        self.assertRaises(TypeError, type.__getattribute__, list, type)


    def test_mixing_slot_wrappers(self):
        class X(dict):
            __setattr__ = dict.__setitem__
        x = X()
        x.y = 42
        self.assertEqual(x["y"], 42)

if __name__ == "__main__":
    unittest.main()