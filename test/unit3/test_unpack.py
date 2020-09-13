# Unpack tests from CPython converted from doctest to unittest

import unittest

class BozoError(Exception):
    pass

class BadSeq:
    def __getitem__(self, i):
        if i >= 0 and i < 3:
            return i
        elif i == 3:
            raise BozoError
        else:
            raise IndexError

class Seq:
    def __getitem__(self, i):
        if i >= 0 and i < 3: 
            return i
        raise IndexError

class UnpackTest(unittest.TestCase):

    def test_basic(self):
        t = (1, 2, 3)
        a, b, c = t
        self.assertEqual(a, 1)
        self.assertEqual(b, 2)
        self.assertEqual(c, 3)

        l = [4, 5, 6]
        a, b, c = l
        self.assertEqual(a, 4)
        self.assertEqual(b, 5)
        self.assertEqual(c, 6)

        a, b, c = 7, 8, 9
        self.assertEqual(a, 7)
        self.assertEqual(b, 8)
        self.assertEqual(c, 9)

        s = 'one'
        a, b, c = s
        self.assertEqual(a, 'o')
        self.assertEqual(b, 'n')
        self.assertEqual(c, 'e')

    def test_single(self):
        st = (99,)
        sl = [100]

        a, = st
        self.assertEqual(a, 99)

        b, = sl
        self.assertEqual(b, 100)
        
    def test_non_sequence(self):
        def unpack():
            a, b, c = 7
        # Currently has incorrect message
        self.assertRaises(TypeError, unpack)

    def test_wrong_size(self):
        def tup_too_big():
            t = (1, 2, 3)
            a, b = t
        def list_too_big():
            l = [4, 5, 6]
            a, b = l
        def tup_too_small():
            t = (1, 2, 3)
            a, b, c, d = t
        def list_too_small():
            l = [4, 5, 6]
            a, b, c, d = l
            
        self.assertRaises(ValueError, tup_too_big)
        self.assertRaises(ValueError, list_too_big)
        self.assertRaises(ValueError, tup_too_small)
        self.assertRaises(ValueError, list_too_small)

    def test_class(self):
        a, b, c = Seq()
        self.assertEqual(a, 0)
        self.assertEqual(b, 1)
        self.assertEqual(c, 2)

    def test_class_fail(self):
        class Seq:
            def __getitem__(self, i):
                if i >= 0 and i < 3: return i
                raise IndexError

        def too_small():
            a, b, c, d = Seq()
        def too_big():
            a, b = Seq()

        self.assertRaises(ValueError, too_small)
        self.assertRaises(ValueError, too_big)

    def test_bad_class(self):
        class BadSeq:
            def __getitem__(self, i):
                if i >=0 and i < 3:
                    return i
                elif i ==3:
                    raise NameError
                else:
                    raise IndexError

        def raise_bad_error1():
            a, b, c, d, e = BadSeq()

        def raise_bad_error2():
            a, b, c = BadSeq()

        self.assertRaises(NameError, raise_bad_error1)
        self.assertRaises(NameError, raise_bad_error2)
    
    def test_basic_star(self):
        # tuple
        t = (1, 2, 3)
        a, *b, c = t
        self.assertEqual((a, b, c), (1, [2], 3))

        # list
        l = [4, 5, 6]
        a, *b = l
        self.assertTrue(a == 4 and b == [5, 6])

        # implied tuple
        *a, = 7, 8, 9
        self.assertTrue(a == [7, 8, 9])

        #Unpack string... fun!
        a, *b = 'one'
        self.assertTrue(a == 'o' and b == ['n', 'e'])

        # long sequence
        a, b, c, *d, e, f, g = range(10)
        self.assertTrue((a, b, c, d, e, f, g) == (
            0, 1, 2, [3, 4, 5, 6], 7, 8, 9))

        #Unpack short sequence
        a, *b, c = (1, 2)
        self.assertTrue(a == 1 and c == 2 and b == [])

        # Unpack generic sequence
        a, *b = Seq()
        self.assertTrue(a == 0 and b == [1, 2])

        #Unpack in for statement
        for a, *b, c in [(1, 2, 3)]:
            self.assertTrue(a == 1 and b == [2] and c == 3)
        for a, *b, c in [(4, 5, 6, 7)]:
            self.assertTrue(a == 4 and b == [5, 6] and c == 7)

        #Unpack in list
        [a, *b, c] = range(5)
        self.assertTrue(a == 0 and b == [1, 2, 3] and c == 4)

        #Multiple targets
        a, *b, c = *d, e = range(5)
        self.assertTrue(a == 0 and b == [1, 2, 3] and c == 4 and d == [
                        0, 1, 2, 3] and e == 4)

        # Assignment unpacking
        a, b, *c = range(5)
        self.assertEqual((a, b, c), (0, 1, [2, 3, 4]))

        *a, b, c = a, b, *c
        self.assertEqual((a, b, c), ([0, 1, 2], 3, 4))

        # weird nested case
        a, *[b, *c], d = range(6)
        self.assertEqual((a,b,c,d), (0, 1, [2, 3, 4], 5))


    def test_unpack_fails(self):
        # @TODO support eval here
        expressions = {
            # Unpacking non-sequence
            'a, *b = 7': (TypeError, 'cannot unpack non-iterable int object'),
            # Unpacking sequence too short
            'a, *b, c, d, e = range(3)': (ValueError, 'not enough values to unpack (expected at least 4, got 3)'),
            # Unpacking sequence too short and target appears last
            'a, b, c, d, *e = range(3)' : (ValueError, 'not enough values to unpack (expected at least 4, got 3)'),
            # Unpacking a sequence where the test for too long raises a different kind of error
            'a, *b, c, d, e = BadSeq()' : (BozoError, ''),
            # general tests all fail
            'a, *b, c, *d, e = range(10)' : (SyntaxError, 'multiple starred expressions in assignment'),
            '[*b, *c] = range(10)': (SyntaxError, 'multiple starred expressions in assignment'),
            'a,*b,*c,*d = range(4)': (SyntaxError, 'multiple starred expressions in assignment'),
            '*a = range(10)': (SyntaxError, 'starred assignment target must be in a list or tuple'),
            '*a' : (SyntaxError, 'can\'t use starred expression here'),
            '*1': (SyntaxError, 'can\'t use starred expression here'),
            'x = *a': (SyntaxError, 'can\'t use starred expression here'),

        }
        jseval("Sk.retainGlobals = true") # use globals from this module
        # use this to test syntax errors and their respective mssages
        eval_alt = "Sk.importMainWithBody('test_unpack', false, '{0}', true)"
        for expr, (error, msg) in expressions.items():
            try:
                jseval(eval_alt.format(expr))
            except error as e:
                self.assertIn(msg, str(e))
            else:
                self.fail(f'{error} not raised for {expr}')
        jseval("Sk.retainGlobals = false")



if __name__ == "__main__":
    unittest.main()
