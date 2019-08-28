""" Unit test for isinstance()"""
import unittest

#self.assertTrue()
#self.assertFalse()
class IsInstanceTest(unittest.TestCase):

    def test_int(self):
        self.assertTrue(isinstance(3,int))
        self.assertTrue(isinstance(3,type(3)))
        self.assertFalse(isinstance(3.2,int))
        self.assertTrue(isinstance(4, (float,int)))
        self.assertTrue(isinstance(4, (int, float, 5)))
        class A: pass
        self.assertTrue(isinstance(4, (int, float, A())))

    def test_float(self):
        self.assertTrue(isinstance(3.1,float))
        self.assertFalse(isinstance(3,float))
        self.assertTrue(isinstance(3.1,type(3.1)))

    def test_string(self):
        self.assertTrue(isinstance("foo",str))
        self.assertTrue(isinstance("foo",type("foo")))
        var1 = "foo"
        class A: pass
        self.assertTrue(isinstance(var1, str))
        self.assertFalse(isinstance(var1, list))
        self.assertFalse(isinstance(var1, dict))
        self.assertFalse(isinstance(var1, tuple))
        self.assertFalse(isinstance(var1, A))

    def test_list(self):
        self.assertTrue(isinstance([],list))
        self.assertTrue(isinstance([],type([1,2,3])))

    def test_none(self):
        self.assertTrue(isinstance(None, type(None)))
        self.assertTrue(isinstance(None, type(None)))

    def test_bool(self):
        self.assertTrue(isinstance(True, bool))
        self.assertTrue(isinstance(True, type(True)))
        self.assertIs(isinstance(True, bool), True)
        self.assertIs(isinstance(False, bool), True)
        self.assertIs(isinstance(True, int), True)
        self.assertIs(isinstance(False, int), True)
        self.assertIs(isinstance(1, bool), False)
        self.assertIs(isinstance(0, bool), False)
        self.assertTrue(isinstance(True, type(False)))

    def test_classes(self):
        class A: pass
        var1 = A()
        self.assertTrue(isinstance(var1, A))
        self.assertFalse(isinstance(var1, str))
        self.assertFalse(isinstance(var1, list))
        self.assertFalse(isinstance(var1, tuple))
        self.assertFalse(isinstance(var1, dict))
        self.assertFalse(isinstance(A, A))
        class B: pass
        class C: pass
        class D(A): pass
        class E(A,B): pass
        class F(E,C): pass
        a,b,c,d,e,f = A(),B(),C(),D(),E(),F()
        self.assertTrue(isinstance(a, A))
        self.assertFalse(isinstance(a, B))
        self.assertFalse(isinstance(a, C))
        self.assertFalse(isinstance(a, D))
        self.assertFalse(isinstance(a, E))
        self.assertFalse(isinstance(a, F))
        self.assertFalse(isinstance(b, A))
        self.assertTrue(isinstance(b, B))
        self.assertFalse(isinstance(b, C))
        self.assertFalse(isinstance(b, D))
        self.assertFalse(isinstance(b, E))
        self.assertFalse(isinstance(b, F))
        self.assertFalse(isinstance(c, A))
        self.assertFalse(isinstance(c, B))
        self.assertTrue(isinstance(c, C))
        self.assertFalse(isinstance(c, D))
        self.assertFalse(isinstance(c, E))
        self.assertFalse(isinstance(c, F))
        self.assertTrue(isinstance(d, A))
        self.assertFalse(isinstance(d, B))
        self.assertFalse(isinstance(d, C))
        self.assertTrue(isinstance(d, D))
        self.assertFalse(isinstance(d, E))
        self.assertFalse(isinstance(d, F))
        self.assertTrue(isinstance(e, A))
        self.assertTrue(isinstance(e, B))
        self.assertFalse(isinstance(e, C))
        self.assertFalse(isinstance(e, D))
        self.assertTrue(isinstance(e, E))
        self.assertFalse(isinstance(e, F))
        self.assertTrue(isinstance(f, A))
        self.assertTrue(isinstance(f, B))
        self.assertTrue(isinstance(f, C))
        self.assertFalse(isinstance(f, D))
        self.assertTrue(isinstance(f, E))
        self.assertTrue(isinstance(f, F))

    def test_dict(self):
        var1 = {}
        class A: pass
        self.assertTrue(isinstance(var1, dict))
        self.assertFalse(isinstance(var1, str))
        self.assertFalse(isinstance(var1, list))
        self.assertFalse(isinstance(var1, tuple))
        self.assertFalse(isinstance(var1, A))
        self.assertTrue(isinstance({1:2}, type({3:4})))

    def test_list(self):
        var1 = []
        class A: pass
        self.assertTrue(isinstance(var1, list))
        self.assertFalse(isinstance(var1, str))
        self.assertFalse(isinstance(var1, dict))
        self.assertFalse(isinstance(var1, tuple))
        self.assertFalse(isinstance(var1, A))
        self.assertTrue(isinstance([1,2,3], type([5,6])))

    def test_tuple(self):
        var1 = ()
        class A: pass
        self.assertTrue(isinstance(var1, tuple))
        self.assertFalse(isinstance(var1, str))
        self.assertFalse(isinstance(var1, list))
        self.assertFalse(isinstance(var1, dict))
        self.assertFalse(isinstance(var1, A))

    def test_set(self):
        self.assertTrue(isinstance(set([1,2]), type(set([3,4]))))
        
                         
if __name__ == '__main__':
    unittest.main()
            
