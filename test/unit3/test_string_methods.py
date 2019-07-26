""" Unit test for string methods"""
import unittest
import re

class StringMethodsTests(unittest.TestCase):
    def test_concat(self):
        self.assertEqual("O" + "K", "OK")
        def test(t):
            t = "O" + t
            return t
        self.assertEqual(test("K"), "OK")
        self.assertRaises(TypeError, lambda x: "s" + x, None)

    def test_slicing(self):
        a = "1234"
        self.assertEqual(a[1:3], "23")
        self.assertEqual(a[1:3], a[-3:3])
        self.assertEqual(a[:-1], "123")
        self.assertEqual(a[1:], "234")
        s = 'abcd'
        self.assertEqual(s[::-1], 'dcba')
        self.assertEqual(s[::2], 'ac')
        x = "abcdefghjijk"
        a = x[:0]
        b = x[0:]
        self.assertEqual(a, "")
        self.assertEqual(b, x)
        def badsplice(x):
            return "abc"[x]
        self.assertRaises(TypeError, lambda x:"abc"[x], 1.5)
        s = "01234"
        self.assertEqual(s[-6:0], "")
        self.assertEqual(s[-6:], "01234")
        self.assertEqual(s[-6:-3], "01")
        self.assertEqual(s[-6:20], "01234")
        def foo(x, y):
            return "01234"[x:y]
        self.assertRaises(TypeError, foo, "hi", [0,4])
        self.assertRaises(TypeError, foo, -3000, 4.5)

    def test_len(self):
        self.assertEqual(len("abc"), 3)
        self.assertEqual(len(""), 0)
        self.assertEqual(len(""*10), 0)

    def test_contains(self):
        self.assertTrue("x" in "xyz")
        self.assertFalse("a" in "xyz")
        self.assertTrue("" in "abc")
        i = '('
        self.assertTrue(i not in '+-*/)')
        self.assertFalse(i in '+-*/')

    def test_str_func(self):
        self.assertEqual(str("weewaa"), "weewaa")

    def test_repr(self):
        self.assertEqual(repr("weewaa"), "'weewaa'")

    def test_multiplication(self):
        self.assertEqual("a"*15, "aaaaaaaaaaaaaaa")
        self.assertEqual("dog"*19, "dogdogdogdogdogdogdogdogdogdogdogdogdogdogdogdogdogdogdog")
        self.assertEqual(40*"weee", "weeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweeeweee")

        def foo(x, y):
            return x * y
        self.assertRaises(TypeError,  foo, "a", "b")
        self.assertRaises(TypeError,  foo, "a", 3.4)
        self.assertRaises(TypeError,  foo, 3.4,  "a")
        self.assertRaises(TypeError,  foo, "a", [2])
        self.assertRaises(TypeError,  foo, [2], "b")

    def test_percent_operator(self):
        self.assertEqual("formatting with just %d argument" % 1, "formatting with just 1 argument")
        
        self.assertEqual("%r is a repr and %s is a string" % ("this","this"), "'this' is a repr and this is a string")
        self.assertEqual("I can also use a %(structure)s to format." % {'structure':'dictionary'}, "I can also use a dictionary to format.")
        self.assertEqual("+%s+" % "hello","+hello+")
        self.assertEqual("+%d+" % 10, "+10+")
        self.assertEqual(("%c" % "a"),"a")
        self.assertEqual('%c' % 34,'"')
        self.assertEqual('%c' % 36,'$')
        self.assertEqual('%d' % 10,"10")
        self.assertEqual('%c' % 0x7f,'\x7f')
        def f(x):
            return str("f(%s) called" % x)
        self.assertEqual(f(3), "f(3) called")

    def test_number_precision(self):
        self.assertEqual("%d %i %o %x %X %e %E %f %F" % (12,-12,-0O7,0x4a,-0x4a,2.3e10,2.3E-10,1.23,-1.23), "12 -12 -7 4a -4A 2.300000e+10 2.300000E-10 1.230000 -1.230000")
        self.assertEqual("%g %G %g %G" % (.00000123,.00000123,1.4,-1.4), "1.23e-06 1.23E-06 1.4 -1.4")
        self.assertEqual("%g" % (.00000012), "1.2e-07")
        self.assertEqual("%g" % (.0000012), "1.2e-06")
        self.assertEqual("%g" % (.000012), "1.2e-05")
        self.assertEqual("%g %g" % (.0000012, .000012), "1.2e-06 1.2e-05")
        self.assertEqual("%g" % (.00012), "0.00012")
        self.assertEqual("%d %i %o %x %X %e %E" % (12,-12,-0O7,0x4a,-0x4a,2.3e10,2.3E-10), "12 -12 -7 4a -4A 2.300000e+10 2.300000E-10")
        self.assertEqual("%g %G %g %G" % (.00000123,.00000123,1.4,-1.4), "1.23e-06 1.23E-06 1.4 -1.4")
if __name__ == '__main__':
    unittest.main()
            
