# Unpack tests from CPython converted from doctest to unittest

import unittest

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
        class Seq:
            def __getitem__(self, i):
                if i >= 0 and i < 3: return i
                raise IndexError

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

if __name__ == "__main__":
    unittest.main()
