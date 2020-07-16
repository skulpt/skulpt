"""Unit testing for inheritance """
import unittest

class InheritanceTesting(unittest.TestCase):
    def test_methods(self):
        class Base(object):
            def myfunc(self):
                return "Base.myfunc"

            def stuff(self):
                return "Base.stuff"
                self.myfunc()

        class Derived(Base):
            def myfunc(self): 
                Base.myfunc(self)
                return "Derived.myfunc"
        d = Derived()
        self.assertEqual(d.myfunc(), "Derived.myfunc")
        b = Derived()
        self.assertEqual(b.stuff(), "Base.stuff")
    def test_override_method(self):
        class SuperClass:
            def apply(self):
                return "SuperClass"
        class SubClassA(SuperClass):
            def apply(self):
                return "SubClassA"
        x = SubClassA()
        self.assertEqual(x.apply(), "SubClassA")

    def test_mro(self):
        class O(object): pass
        class F(O): pass
        class E(O): pass
        class D(O): pass
        class C(D,F): pass
        class B(D,E): pass
        class A(B,C): pass
        self.assertEqual(A.__bases__,  (B, C))
        self.assertEqual(A.__mro__, (A, B, C, D, E, F, O, object))
        class O(object): pass
        class F(O): pass
        class E(O): pass
        class D(O): pass
        class C(D,F): pass
        class B(E,D): pass
        class A(B,C): pass
        self.assertEqual(A.__mro__,(A, B, E, C, D, F, O, object))
        class O(object): pass
        class A(O): pass
        class B(O): pass
        class C(O): pass
        class D(O): pass
        class E(O): pass
        class K1(A,B,C): pass
        class K2(D,B,E): pass
        class K3(D,A): pass
        class Z(K1,K2,K3): pass
        self.assertEqual(K1.__mro__, (K1, A, B, C, O, object))
        self.assertEqual(K2.__mro__, (K2, D, B, E, O, object))
        self.assertEqual(K3.__mro__, (K3, D, A, O, object))
        self.assertEqual(Z.__mro__, (Z, K1, K2, K3, D, A, B, C, E, O, object))
        self.assertEqual(object.__bases__, ())
        self.assertEqual(object.__mro__, tuple([object]))
        class X(object): pass
        class Y(X): pass
        self.assertEqual(X.__bases__, tuple([object]))
        self.assertEqual(X.__mro__, (X, object))
        self.assertEqual(Y.__bases__, tuple([X]))
        self.assertEqual(Y.__mro__, (Y, X, object))

    def test_issubclass(self):
        class Foo:
           pass

        class Bar(Foo):
           pass

        class Baz(Bar):
            pass

        class XXX:
            pass
            
        class Frob(Baz,XXX):    
            pass
            
        self.assertTrue(issubclass(Bar,Foo))
        self.assertFalse(issubclass(Foo,Bar))
        self.assertTrue(issubclass(Baz,Foo))
        self.assertTrue(issubclass(Baz,Bar))
        self.assertTrue(issubclass(Foo,object))
        self.assertTrue(issubclass(Frob,XXX))

    def test_skulpt_bugs(self):
        for _cls in (int, dict, set, list, object, tuple):
            self.assertTrue(issubclass(_cls, object))
        
        for error in (Exception, TypeError, ValueError, AttributeError):
            self.assertTrue(issubclass(error, Exception))

        self.assertEqual(int.__mro__, (int, object))
        self.assertEqual(Exception.__mro__, (Exception, BaseException, object))
        self.assertEqual(TypeError.__bases__, (Exception,))

        # test type and object
        self.assertTrue(isinstance(type, object))
        self.assertTrue(isinstance(type, type))
        self.assertTrue(isinstance(object, object))
        self.assertTrue(isinstance(object, type))
        self.assertTrue(issubclass(type, object))
        self.assertFalse(issubclass(object, type))

if __name__ == '__main__':
    unittest.main()
            
