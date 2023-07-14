import unittest

class Empty:
    def __repr__(self):
        return '<Empty>'

class Cmp:
    def __init__(self,arg):
        self.arg = arg

    def __repr__(self):
        return '<Cmp %s>' % self.arg

    def __eq__(self, other):
        return self.arg == other

class Anything:
    def __eq__(self, other):
        return True

    def __ne__(self, other):
        return False

class ComparisonTest(unittest.TestCase):
    set1 = [2, 2.0, 2, 2+0j, Cmp(2.0)]
    set2 = [[1], (3,), None, Empty()]
    candidates = set1 + set2

    def test_comparisons(self):
        for a in self.candidates:
            for b in self.candidates:
                if ((a in self.set1) and (b in self.set1)) or a is b:
                    self.assertEqual(a, b)
                else:
                    self.assertNotEqual(a, b)

    def test_id_comparisons(self):
        # Ensure default comparison compares id() of args
        L = []
        for i in range(10):
            L.insert(len(L)//2, Empty())
        for a in L:
            for b in L:
                self.assertEqual(a == b, id(a) == id(b),
                                 'a=%r, b=%r' % (a, b))

    def test_is_comparisons(self):
        a = "a"
        self.assertTrue(a is "a")
        self.assertFalse(a is "b")
        self.assertTrue(a is not "b")
        self.assertFalse(a is not "a")
        self.assertTrue(None is None)

    def test_ne_defaults_to_not_eq(self):
        a = Cmp(1)
        b = Cmp(1)
        c = Cmp(2)
        self.assertIs(a == b, True)
        # self.assertIs(a != b, False)
        self.assertIs(a != c, True)

    # def test_ne_high_priority(self):
    #     """object.__ne__() should allow reflected __ne__() to be tried"""
    #     calls = []
    #     class Left:
    #         # Inherits object.__ne__()
    #         def __eq__(*args):
    #             calls.append('Left.__eq__')
    #             return NotImplemented
    #     class Right:
    #         def __eq__(*args):
    #             calls.append('Right.__eq__')
    #             return NotImplemented
    #         def __ne__(*args):
    #             calls.append('Right.__ne__')
    #             return NotImplemented
    #     Left() != Right()
    #     self.assertSequenceEqual(calls, ['Left.__eq__', 'Right.__ne__'])

    # def test_ne_low_priority(self):
    #     """object.__ne__() should not invoke reflected __eq__()"""
    #     calls = []
    #     class Base:
    #         # Inherits object.__ne__()
    #         def __eq__(*args):
    #             calls.append('Base.__eq__')
    #             return NotImplemented
    #     class Derived(Base):  # Subclassing forces higher priority
    #         def __eq__(*args):
    #             calls.append('Derived.__eq__')
    #             return NotImplemented
    #         def __ne__(*args):
    #             calls.append('Derived.__ne__')
    #             return NotImplemented
    #     Base() != Derived()
    #     self.assertSequenceEqual(calls, ['Derived.__ne__', 'Base.__eq__'])

    def test_other_delegation(self):
        """No default delegation between operations except __ne__()"""
        ops = (
            ('__eq__', lambda a, b: a == b),
            ('__lt__', lambda a, b: a < b),
            ('__le__', lambda a, b: a <= b),
            ('__gt__', lambda a, b: a > b),
            ('__ge__', lambda a, b: a >= b),
        )

    def test_issue_1393(self):
        x = lambda: None
        self.assertEqual(x, Anything())
        self.assertEqual(Anything(), x)
        y = object()
        self.assertEqual(y, Anything())
        self.assertEqual(Anything(), y)

    def test_compare_operator(self):
        def helper(x,y,expect):
            l = [0]*6
            if expect < 0:  # x < y
                l[0] = (x < y) == True
                l[1] = (x <= y) == True
                l[2] = (x > y) == False
                l[3] = (x >= y) == False
                l[4] = (x == y) == False
                l[5] = (x != y) == True
                if isinstance(x,(int,float,str)) or isinstance(y,(int,float,str)):
                    l.append((x is y)==False)
                    l.append((x is not y)==True)
            elif expect == 0: # x == y
                l[0] = (x < y) == False
                l[1] = (x <= y) == True
                l[2] = (x > y) == False
                l[3] = (x >= y) == True
                l[4] = (x == y) == True
                l[5] = (x != y) == False
                if isinstance(x,(int,float,str)) or isinstance(y,(int,float,str)):
                    l.append((x is y)==True)
                    l.append((x is not y)==False)
            elif expect > 0:  # x > y
                l[0] = (x < y) == False
                l[1] = (x <= y) == False
                l[2] = (x > y) == True
                l[3] = (x >= y) == True
                l[4] = (x == y) == False
                l[5] = (x != y) == True
                if isinstance(x,(int,float,str)) or isinstance(y,(int,float,str)):
                    l.append((x is y)==False)
                    l.append((x is not y)==True)
            if not isinstance(x,(int,float,str)) and not isinstance(y,(int,float,str)):
                l.append((x is y)==False)
                l.append((x is not y)==True)
            if all(l):
                return True
            else:
                return False
        #integers
        self.assertTrue(helper(1,2,-1))
        self.assertTrue(helper(1,1,0))
        self.assertTrue(helper(2,1,1))
        self.assertTrue(helper(-2,-1,-1))
        self.assertTrue(helper(-2,-2,0))
        self.assertTrue(helper(-1,-2,1))
        self.assertTrue(helper(-1,1,-1))
        self.assertTrue(helper(1,-1,1))
        #floats
        self.assertTrue(helper(1.0,2.0,-1))
        self.assertTrue(helper(1.0,1.0,0))
        self.assertTrue(helper(2.0,1.0,1))
        self.assertTrue(helper(-2.0,-1.0,-1))
        # self.assertTrue(helper(-2.0,-2.0,0))
        self.assertTrue(helper(-1.0,-2.0,1))
        self.assertTrue(helper(-1.0,1.0,-1))
        self.assertTrue(helper(1.0,-1.0,1))
        #lists
        self.assertTrue(helper([],[1],-1))
        self.assertTrue(helper([1,2],[1,2],0))
        self.assertTrue(helper([1,2,3],[1,2],1))
        self.assertTrue(helper([1,2],[2,1],-1))
        self.assertTrue(helper([1,2,3],[1,2,1,5],1))
        #tuples
        self.assertTrue(helper(tuple(),(1,),-1))
        self.assertTrue(helper((1,2,3),(1,2),1))
        self.assertTrue(helper((1,2),(2,1),-1))
        self.assertTrue(helper((1,2,3),(1,2,1,5),1))
        #strings
        self.assertTrue(helper('','a',-1))
        self.assertTrue(helper('a','a',0))
        self.assertTrue(helper('ab','a',1))
        self.assertTrue(helper('ABCD','abcd',-1))
        self.assertTrue(helper('ABCD','ABCD',0))
        self.assertTrue(helper('aBCD','Abcd',1))
        #__cmp__ should no longer work in python 3
        class A:
            def __init__(self,x): self.x = x
            def __cmp__(self,other): return self.x
        self.assertRaises(TypeError, helper, A(-1), A(1), -1)

        # Built-in type comparisons should no longer work in python 3
        # (but equality should)
        self.assertRaises(TypeError, lambda: (1,2) > [3,4])
        self.assertFalse((1,2) == [3,4])
        self.assertTrue((1,2) != [3,4])

        self.assertRaises(TypeError, lambda: None > (1,2))
        self.assertFalse(None == (1,2))
        self.assertTrue(None != (1,2))

        self.assertRaises(TypeError, lambda: 2 > "2")
        self.assertFalse(2 == "2")
        self.assertTrue(2 != "2")
##
if __name__ == '__main__':
    unittest.main()
