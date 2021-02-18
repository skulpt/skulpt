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
        self.assertEqual('%d' % 10.2, "10")
        self.assertEqual('%c' % 0x7f, '\x7f')
        self.assertEqual('a%10s' % 'hello', "a     hello")
        self.assertEqual('%10s' % 'hello', "     hello")
        self.assertEqual('%-10s' % 'hello', "hello     ")

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

    def test_encoding(self):
        # Unicode snowman: BMP emoji
        self.assertEqual('\u2603'.encode(), b'\xe2\x98\x83')
        self.assertEqual(b'\xe2\x98\x83'.decode(), '\u2603')

        self.assertEqual(ord('\u2603'), 0x2603)
        self.assertEqual(chr(0x2603), '\u2603')

        # Unicode doesn't get escaped in repr(), but escape chars still do
        self.assertEqual(repr('\x01\xf0\u2603'), "'\\x01\xf0\u2603'")
        # ...but it *does* get escaped in ascii()
        self.assertEqual(ascii('hi there'), "'hi there'")
        self.assertEqual(ascii('x\x01\xf0\u2603\U0001f355'), "'x\\x01\\xf0\\u2603\\U0001f355'")

        # Indexing: It's a single character
        self.assertEqual(len('Build a \u2603!'), 10)
        self.assertEqual('Build a \u2603!'[9], '!')
        self.assertEqual('Build a \u2603!'[8], '\u2603')
        self.assertEqual('Build a \u2603!'[6:9], 'a \u2603')
        self.assertEqual('Build a \u2603!'[:9], 'Build a \u2603')
        self.assertEqual('Build a \u2603!'[6:], 'a \u2603!')

        self.assertEqual('Build a \u2603!'.find('!'), 9)
        self.assertEqual('Build a \u2603!'.find('\u2603'), 8)

        # Piece of pizza: Astral emoji
        self.assertEqual('\U0001f355'.encode(), b'\xf0\x9f\x8d\x95')
        self.assertEqual(b'\xf0\x9f\x8d\x95'.decode(), '\U0001f355')

        self.assertEqual(ord('\U0001f355'), 0x1f355)
        self.assertEqual(chr(0x1f355), '\U0001f355')

        # It's *still* a single character, even though it's a surrogate
        # pair in JS
        self.assertEqual(len('Love \U0001f355!'), 7)

        self.assertEqual(list('Love \U0001f355!'), ['L', 'o', 'v', 'e', ' ', '\U0001f355', '!'])

        # Lookups and slices happen in Python (ie codepoint) coordinates
        self.assertEqual('Love \U0001f355!'[6], '!')
        self.assertEqual('Love \U0001f355!'[5], '\U0001f355')
        self.assertEqual('Love \U0001f355!'[-2], '\U0001f355')

        self.assertEqual('Love \U0001f355!'[4:6], ' \U0001f355')
        self.assertEqual('Love \U0001f355!'[:6], 'Love \U0001f355')
        self.assertEqual('Love \U0001f355!'[4:], ' \U0001f355!')

        self.assertEqual('Love \U0001f355!'[-2:], '\U0001f355!')
        self.assertEqual('abc\U0001f355def'[-2::-2], 'e\U0001f355b')
        self.assertEqual('abc\U0001f355def'[-1::-2], 'fdca')

        # find() happens in codepoint coordinates
        self.assertEqual('Love \U0001f355!'.find('!'), 6)
        self.assertEqual('Love \U0001f355!'.find('\U0001f355', 0, 6), 5)
        self.assertEqual('Love \U0001f355!'.find('\U0001f355', None, -1), 5)
        self.assertEqual('Love \U0001f355!'.find('\U0001f355', None, -2), -1)

        # count() too
        self.assertEqual('Love \U0001f355!'.count('\U0001f355', -2), 1)
        self.assertEqual('Love \U0001f355!'.count('\U0001f355', -1), 0)

        # ljust() (same impl as rjust())
        self.assertEqual('Love \U0001f355!'.ljust(10, '\U0001f355'), 'Love \U0001f355!\U0001f355\U0001f355\U0001f355')

    def test_bytes(self):
        # Bytes are not strings
        self.assertNotEqual(b'hello', 'hello')

        # Construct from string
        self.assertRaises(TypeError, lambda: bytes('hello'))
        self.assertEqual(bytes('hello', 'utf-8'), b'hello')
        self.assertEqual(bytes('Love \U0001f355!', 'utf-8'), b'Love \xf0\x9f\x8d\x95!')

        # Construct string from bytestring
        # self.assertEqual(str(b'\xf0\x9f\x8d\x95'), '\U0001f355')
        self.assertEqual(str(b'\xf0\x9f\x8d\x95', "utf-8"), '\U0001f355')

        # Construct bytestring from bytestring
        self.assertEqual(bytes(b'hello'), b'hello')

        # Construct empty bytestrings
        self.assertEqual(bytes(4), b'\x00\x00\x00\x00')

        # Construct from object with __bytes__
        class C:
            def __bytes__(self):
                return b'hello'

            def __iter__(self):
                # Gets pre-empted by __bytes__
                return iter([1,2,3,4])
        self.assertEqual(bytes(C()), b'hello')

        # Construct from iterables
        self.assertEqual(bytes([0xf0, 0x9f, 0x8d, 0x95]).decode(), '\U0001f355')
        self.assertRaises(ValueError, lambda: bytes([0x100]))

        # or give up
        class D:
            pass
        self.assertRaises(TypeError, lambda: bytes(D()))

        # Concatenate
        self.assertEqual(b'x' + b'y', b'xy')
        self.assertRaises(TypeError, lambda: b'x' + 'y')

        # Repeat
        self.assertEqual(b'x'*3, b'xxx')

        # Search
        self.assertTrue(b'y' in b'xyz')
        self.assertFalse(b'a' in b'xyz')
        self.assertTrue(120 in b'xyz')
        self.assertFalse(119 in b'xyz')
        self.assertRaises(ValueError, lambda: 1000 in b'xyz')
        self.assertEqual(b'abc'.find(b'b'), 1)
        self.assertEqual(b'abc'.find(b'z'), -1)
        self.assertRaises(TypeError, lambda: 'y' in b'xyz')
        self.assertRaises(TypeError, lambda: b'xyz'.find('y'))
        self.assertRaises(TypeError, lambda: b'y' in 'xyz')
        self.assertRaises(TypeError, lambda: 'xyz'.find(b'y'))

        # Index and slice
        self.assertEqual(b'xyz'[2], 122)
        self.assertEqual(b'xyz'[-1], 122)
        self.assertEqual(b'xyz'[:2], b'xy')

        # Iterate
        self.assertEqual(list(b'xyz'), [120, 121, 122])

        # To and from hex
        self.assertEqual(bytes.fromhex('2Ef0 F1f2 '), b'.\xf0\xf1\xf2')
        self.assertEqual(b'\xf0\xf1\xf2'.hex(), 'f0f1f2')

if __name__ == '__main__':
    unittest.main()
    