""" Unit testing for bytes object"""
import unittest
import sys


class Indexable:
    def __init__(self, value=0):
        self.value = value
    def __index__(self):
        return self.value

class BytesTests(unittest.TestCase):
    type2test = bytes

    def test_repr_str(self):
        for f in str, repr:
            # self.assertEqual(f(bytearray()), "bytearray(b'')")
            # self.assertEqual(f(bytearray([0])), "bytearray(b'\\x00')")
            # self.assertEqual(f(bytearray([0, 1, 254, 255])),
            #                  "bytearray(b'\\x00\\x01\\xfe\\xff')")
            self.assertEqual(f(b"abc"), "b'abc'")
            self.assertEqual(f(b"'"), '''b"'"''') # '''
            self.assertEqual(f(b"'\""), r"""b'\'"'""") # '

    def test_to_str(self):
        self.assertEqual(str(b''), "b''")
        self.assertEqual(str(b'x'), "b'x'")
        self.assertEqual(str(b'\x80'), "b'\\x80'")
        # self.assertEqual(str(bytearray(b'')), "bytearray(b'')")
        # self.assertEqual(str(bytearray(b'x')), "bytearray(b'x')")
        # self.assertEqual(str(bytearray(b'\x80')), "bytearray(b'\\x80')")

    def test_integer_arg(self):
        self.assertRaises(TypeError, bytes, "3")
        a = bytes(4)
        self.assertEqual(str(a)[2:-1], "\\x00\\x00\\x00\\x00")
        self.assertEqual(len(a), 4)
        b = bytes(0)
        self.assertEqual(str(b)[1:], "''")
        self.assertEqual(str(bytes())[1:], "''")

        self.assertEqual(str(bytes), "<class 'bytes'>")
        self.assertEqual(type(bytes), type)

    def test_iterables(self):
        a = [1,2,3]
        a1 = bytes(a)
        self.assertEqual(str(a1)[2:-1], "\\x01\\x02\\x03")
        self.assertEqual(str(a1)[2:-1], str(bytes(a1))[2:-1])
        self.assertEqual(a1, bytes(a1))
        it0 = [1,230,3]
        b = bytes(it0)
        self.assertEqual(str(b)[2:-1], "\\x01\\xe6\\x03")
        self.assertEqual(len(b), 3)
        it0[0] = 5
        self.assertEqual(str(b)[2:-1], "\\x01\\xe6\\x03")
        c = bytes([65, 66, 200, 3])
        self.assertEqual(str(c)[2:-1], "AB\\xc8\\x03")
        d = {1:2, 3:4, 5:6}
        d0 = bytes(d)
        self.assertEqual(str(d0)[2:-1], "\\x01\\x03\\x05")
        s = set([1,2,3,4])
        s0 = bytes(s)
        self.assertEqual(str(s0)[2:-1], "\\x01\\x02\\x03\\x04")
        class BasicIterClass:
            def __init__(self, low, high):
                self.current = low
                self.high = high

            def __next__(self):
                #res = self.i
                if self.current > self.high:
                    raise StopIteration
                else:
                    self.current += 1
                    return self.current - 1

            def __iter__(self):
                return self

        a = BasicIterClass(1,3)
        a0 = bytes(a)
        self.assertEqual(str(a0)[2:-1], "\\x01\\x02\\x03")

        self.assertRaises(TypeError, bytes, "string")
        self.assertRaises(TypeError, bytes, [1,2, "3"])
        self.assertRaises(ValueError, bytes, [257, 2, 3])
        self.assertRaises(ValueError, bytes, [-1, 2, 3])

    def test_strings(self):
        string = "abz"
        d = bytes(string, 'ascii')
        self.assertEqual(str(d), "b'abz'")
        self.assertEqual(list(d), [97, 98, 122])
        self.assertEqual(len(d), 3)
        
        self.assertRaises(TypeError, bytes, "abc")
        self.assertRaises(TypeError, bytes, "abc", [])
        self.assertRaises(TypeError, bytes, ["a", "b"], "ascii", "strict")
        self.assertRaises(TypeError, bytes, "abc", "ascii", [])
        self.assertRaises(LookupError, bytes, "abc", "asd")
        self.assertRaises(UnicodeEncodeError, bytes, "ÿ", "ascii")

    def test_compare(self):
        b1 = self.type2test([1, 2, 3])
        b2 = self.type2test([1, 2, 3])
        b3 = self.type2test([1, 3])

        self.assertEqual(b1, b2)
        self.assertTrue(b2 != b3)
        self.assertTrue(b1 <= b2)
        self.assertTrue(b1 <= b3)
        self.assertTrue(b1 <  b3)
        self.assertTrue(b1 >= b2)
        self.assertTrue(b3 >= b2)
        self.assertTrue(b3 >  b2)

        self.assertFalse(b1 != b2)
        self.assertFalse(b2 == b3)
        self.assertFalse(b1 >  b2)
        self.assertFalse(b1 >  b3)
        self.assertFalse(b1 >= b3)
        self.assertFalse(b1 <  b2)
        self.assertFalse(b3 <  b2)
        self.assertFalse(b3 <= b2)

        self.assertTrue(b'\xfe' < b'\xff') # skulpt test for non utf8 character

    def test_compare_to_str(self):
        # Byte comparisons with unicode should always fail!
        # Test this for all expected byte orders and Unicode character
        # sizes.
        self.assertEqual(self.type2test(b"\0a\0b\0c") == "abc", False)
        self.assertEqual(self.type2test(b"\0\0\0a\0\0\0b\0\0\0c") == "abc",
                            False)
        self.assertEqual(self.type2test(b"a\0b\0c\0") == "abc", False)
        self.assertEqual(self.type2test(b"a\0\0\0b\0\0\0c\0\0\0") == "abc",
                            False)
        self.assertEqual(self.type2test() == str(), False)
        self.assertEqual(self.type2test() != str(), True)

    def test_comparisons(self):
        a = bytes([1, 2, 3])
        b = bytes([1, 2, 3])
        c = bytes([4, 5, 6])
        self.assertTrue(a == a)
        self.assertTrue(a == b)
        self.assertFalse(a == c)
        self.assertFalse(a != a)
        self.assertFalse(a != b)
        self.assertTrue(a != c)
        self.assertTrue(bytes([97, 98, 122]) == bytes("abz", 'ascii'))
        self.assertFalse(bytes([97, 98, 122]) != bytes("abz", 'ascii'))
        self.assertFalse(bytes([97, 120]) == bytes([97, 120, 100]))
        self.assertFalse(bytes([97, 98, 99]) == bytes("abd", "ascii"))

    def test_contains(self):
        b = b"abc"
        self.assertIn(ord('a'), b)
        self.assertIn(int(ord('a')), b)
        self.assertNotIn(200, b)
        self.assertRaises(ValueError, lambda: 300 in b)
        self.assertRaises(ValueError, lambda: -1 in b)
        # self.assertRaises(ValueError, lambda: sys.maxsize+1 in b)
        self.assertRaises(TypeError, lambda: None in b)
        self.assertRaises(TypeError, lambda: float(ord('a')) in b)
        self.assertRaises(TypeError, lambda: "a" in b)
        self.assertIn(bytes(b""), b)
        self.assertIn(bytes(b"a"), b)
        self.assertIn(bytes(b"b"), b)
        self.assertIn(bytes(b"c"), b)
        self.assertIn(bytes(b"ab"), b)
        self.assertIn(bytes(b"bc"), b)
        self.assertIn(bytes(b"abc"), b)
        self.assertNotIn(bytes(b"ac"), b)
        self.assertNotIn(bytes(b"d"), b)
        self.assertNotIn(bytes(b"dab"), b)
        self.assertNotIn(bytes(b"abd"), b)

    def test_compare_bytes_to_bytearray(self):
        self.assertEqual(b"abc" == bytes(b"abc"), True)
        self.assertEqual(b"ab" != bytes(b"abc"), True)
        self.assertEqual(b"ab" <= bytes(b"abc"), True)
        self.assertEqual(b"ab" < bytes(b"abc"), True)
        self.assertEqual(b"abc" >= bytes(b"ab"), True)
        self.assertEqual(b"abc" > bytes(b"ab"), True)

        self.assertEqual(b"abc" != bytes(b"abc"), False)
        self.assertEqual(b"ab" == bytes(b"abc"), False)
        self.assertEqual(b"ab" > bytes(b"abc"), False)
        self.assertEqual(b"ab" >= bytes(b"abc"), False)
        self.assertEqual(b"abc" < bytes(b"ab"), False)
        self.assertEqual(b"abc" <= bytes(b"ab"), False)

        self.assertEqual(bytes(b"abc") == b"abc", True)
        self.assertEqual(bytes(b"ab") != b"abc", True)
        self.assertEqual(bytes(b"ab") <= b"abc", True)
        self.assertEqual(bytes(b"ab") < b"abc", True)
        self.assertEqual(bytes(b"abc") >= b"ab", True)
        self.assertEqual(bytes(b"abc") > b"ab", True)

        self.assertEqual(bytes(b"abc") != b"abc", False)
        self.assertEqual(bytes(b"ab") == b"abc", False)
        self.assertEqual(bytes(b"ab") > b"abc", False)
        self.assertEqual(bytes(b"ab") >= b"abc", False)
        self.assertEqual(bytes(b"abc") < b"ab", False)
        self.assertEqual(bytes(b"abc") <= b"ab", False)

    def test_decode_basic(self):
        a = bytes("abc", "ascii")
        b0 = [67,127,102]
        b = bytes(b0)
        self.assertRaises(LookupError, a.decode, "a")
        self.assertEqual(a.decode('ascii'), "abc")
        u = b.decode("utf-8")

        self.assertRaises(TypeError, a.decode, [], "strict")
        self.assertRaises(TypeError, a.decode, "ascii", [])

    def test_decode(self):
        sample = "Hello world\n\u1234\u5678\u9abc"
        encodings = {
            "utf-8": b'Hello world\n\xe1\x88\xb4\xe5\x99\xb8\xe9\xaa\xbc',
            "utf-16": b'\xff\xfeH\x00e\x00l\x00l\x00o\x00 \x00w\x00o\x00r\x00l\x00d\x00\n\x004\x12xV\xbc\x9a',
        }
        for enc in ("utf-8", "utf-16"):
            # b = self.type2test(sample, enc)
            b = encodings[enc]
            self.assertEqual(b.decode(enc), sample)
        # sample = "Hello world\n\x80\x81\xfe\xff"
        # b = self.type2test(sample, "latin-1")
        sample = "Hello world\nÆ"
        b = b'Hello world\n\xc6'
        self.assertRaises(UnicodeDecodeError, b.decode, "utf-8")
        self.assertEqual(b.decode("utf-8", "ignore"), "Hello world\n")
        self.assertEqual(b.decode(errors="ignore", encoding="utf-8"),
                         "Hello world\n")
        # Default encoding is utf-8
        self.assertEqual(self.type2test(b'\xe2\x98\x83').decode(), '\u2603')
        self.assertEqual(b.decode("latin-1"), sample)

    def test_check_encoding_errors(self):
        # bpo-37388: bytes(str) and bytes.encode() must check encoding
        # and errors arguments in dev mode
        invalid = 'Boom, Shaka Laka, Boom!'
        encodings = ('ascii', 'utf8', 'latin1')
        type2test = self.type2test
        for data in ('', 'short string'):
            with self.assertRaises(LookupError):
                type2test(data, encoding=invalid)

            for encoding in encodings:
                try:
                    type2test(data, encoding=encoding, errors=invalid)
                except LookupError:
                    pass
                else:
                    self.fail()

        for data in (b'', b'short string'):
            data = type2test(data)
            with self.assertRaises(LookupError):
                data.decode(encoding=invalid)
            try:
                data.decode(errors=invalid)
            except LookupError:
                pass
            else:
                self.fail()

            for encoding in encodings:
                try:
                    data.decode(encoding=encoding, errors=invalid)
                except LookupError:
                    pass
                else:
                    self.fail()

    def test_encode(self):
        a = "abc".encode("ascii")
        self.assertEqual(list(a), [97, 98, 99])
        self.assertEqual(type(a), bytes)
        self.assertEqual(str(a)[2:-1], "abc")

        a = "abc".encode("utf-8")
        self.assertEqual(list(a), [97, 98, 99])
        b = "abcÿ".encode("utf-8")
        self.assertEqual(str(b)[2:-1], "abc\\xc3\\xbf")
        self.assertEqual(list(b), [97, 98, 99, 195, 191])
        self.assertEqual(b, "abcÿ".encode())


    def test_errors(self):
        self.assertRaises(UnicodeEncodeError, bytes, "aÿ", "ascii", "strict")
        a = bytes("aÿ", "ascii", "ignore")
        self.assertEqual(str(a)[2:-1], "a")
        b = bytes([200, 100, 101])
        c = b.decode("ascii", "ignore")
        self.assertEqual(c, "de")
        
        a = bytes("abÿ", "ascii", "replace")
        self.assertEqual(str(a)[2:-1], "ab?")
        b = bytes([200, 100, 101])
        c = b.decode("ascii", "replace")
        self.assertEqual(c, "�de")
        b = bytes([250, 100, 101])
        c = b.decode("ascii", "replace")
        self.assertEqual(c, "�de")
        d = [97, 98, 99, 140, 50]
        d0 = bytes(d)
        self.assertEqual(str(d0)[2:-1], "abc\\x8c2")
        self.assertEqual(d0.decode("utf-8", "ignore"), "abc2")
        self.assertEqual(d0.decode("utf-8", "replace"), "abc�2")

        self.assertRaises(UnicodeDecodeError, d0.decode, "utf-8")
        self.assertRaises(UnicodeDecodeError, d0.decode, "ascii")

    def test_expandtabs(self):
        self.assertEqual(b'abc\rab\tdef\ng\thi'.expandtabs(), b'abc\rab      def\ng       hi');
        self.assertEqual(b'abc\rab\tdef\ng\thi'.expandtabs(8), b'abc\rab      def\ng       hi');
        self.assertEqual(b'abc\rab\tdef\ng\thi'.expandtabs(4), b'abc\rab  def\ng   hi')
        self.assertEqual(b'abc\r\nab\tdef\ng\thi'.expandtabs(), b'abc\r\nab      def\ng       hi')
        self.assertEqual(b'abc\r\nab\tdef\ng\thi'.expandtabs(8), b'abc\r\nab      def\ng       hi')
        self.assertEqual(b'abc\r\nab\tdef\ng\thi'.expandtabs(4), b'abc\r\nab  def\ng   hi')
        self.assertEqual(b'abc\r\nab\r\ndef\ng\r\nhi'.expandtabs(4), b'abc\r\nab\r\ndef\ng\r\nhi')
        
    def test_iteration(self):
        a = bytes("abc", "ascii")
        self.assertEqual(list(a), [97,98,99])
        a0 = []
        for i in a:
            a0.append(i)
        self.assertEqual(a0, [97,98,99])
        a0 = []
        for i in a:
            a0.append(i)
        self.assertEqual(a0, [97,98,99])
        b = bytes([100, 101, 102])
        b0 = []
        for i in b:
            b0.append(i)
        self.assertEqual(b0, [100, 101, 102])
        d = {1:2, 3:4, 5:6}
        d0 = bytes(d)
        d1 = []
        for i in d0:
            d1.append(i)
        self.assertEqual(d1, [1, 3, 5])
        class BasicIterClass:
            def __init__(self, low, high):
                self.current = low
                self.high = high

            def __next__(self):
                #res = self.i
                if self.current > self.high:
                    raise StopIteration
                else:
                    self.current += 1
                    return self.current - 1

            def __iter__(self):
                return self

        a = BasicIterClass(1,3)
        a0 = bytes(a)
        a1 = []
        for i in a0:
            a1.append(i)
        self.assertEqual(a1, [1, 2, 3])

    def test_literals(self):
        self.assertEqual(b'abc', bytes([97, 98, 99]))
        self.assertEqual(b'xyz', bytes("xyz", "ascii"))

    def test_add(self):
        a = bytes([1, 2, 3])
        b = bytes([4, 5, 6])
        c = a + b
        self.assertEqual(c, bytes([1, 2, 3, 4, 5, 6]))
        a += b
        self.assertEqual(a, bytes([1, 2, 3, 4, 5, 6]))
        self.assertEqual(b'123' + b'abc', b'123abc')

        self.assertRaises(TypeError, lambda x: a + x, "bytes")

    def test_multiply(self):
        a = bytes([1,2])
        self.assertEqual(a * 3, bytes([1, 2, 1, 2, 1, 2]))
        self.assertEqual(2 * a, bytes([1, 2, 1, 2]))
        self.assertEqual(b'dk3' * 3, b'dk3dk3dk3')
        self.assertEqual(3 * b'dk3', b'dk3dk3dk3')

        self.assertRaises(TypeError, lambda x: x * x, a)

    def test_mod(self):
        b = bytes(b'hello, %b!')
        orig = b
        b = b % b'world'
        self.assertEqual(b, b'hello, world!')
        self.assertEqual(orig, b'hello, %b!')
        self.assertFalse(b is orig)
        b = bytes(b'%s / 100 = %d%%')
        a = b % (b'seventy-nine', 79)
        self.assertEqual(a, b'seventy-nine / 100 = 79%')
        self.assertIs(type(a), bytes)
        # issue 29714
        b = bytes(b'hello,\x00%b!')
        b = b % b'world'
        self.assertEqual(b, b'hello,\x00world!')
        self.assertIs(type(b), bytes)

        # test mapping
        self.assertEqual(b'%(foo)s' % {b'foo': b'bar'}, b'bar')
        x = b'\xf0\x9f\x8d\x95 %b'
        self.assertEqual(x % b'foo', b'\xf0\x9f\x8d\x95 foo')
        self.assertEqual(x % b'\xf0\x9f\x8d\x95', b'\xf0\x9f\x8d\x95 \xf0\x9f\x8d\x95')
        # self.assertEqual(b'abc%(\xc2\xa2)s' % {b'\xc2\xa2': b'd'}, b'abcd') #skulpt fails with \ in the brackets


    def test_imod(self):
        b = bytes(b'hello, %b!')
        orig = b
        b %= b'world'
        self.assertEqual(b, b'hello, world!')
        self.assertEqual(orig, b'hello, %b!')
        self.assertFalse(b is orig)
        b = bytes(b'%s / 100 = %d%%')
        b %= (b'seventy-nine', 79)
        self.assertEqual(b, b'seventy-nine / 100 = 79%')
        self.assertIs(type(b), bytes)
        # issue 29714
        b = bytes(b'hello,\x00%b!')
        b %= b'world'
        self.assertEqual(b, b'hello,\x00world!')
        self.assertIs(type(b), bytes)

    def test_fromhex(self):
        a = "0f34"
        self.assertEqual(bytes.fromhex(a), bytes([15, 52]))
        b = "123456"
        self.assertEqual(bytes.fromhex(b), bytes([18, 52, 86]))
        self.assertEqual(bytes.fromhex("AA"), bytes.fromhex("aa"))
        c = "2ef0 f1\nf2\r\v\
"
        self.assertEqual(bytes.fromhex(c), bytes([46, 240, 241, 242]))
        d = " 2ef0  \tf1f2  "
        self.assertEqual(bytes.fromhex(d), bytes([46, 240, 241, 242]))

        self.assertRaises(ValueError, bytes.fromhex, "ag")
        self.assertRaises(ValueError, bytes.fromhex, "0f0")
        self.assertRaises(ValueError, bytes.fromhex, "0f340/")
        self.assertRaises(ValueError, bytes.fromhex, "2ef 0")
        self.assertRaises(ValueError, bytes.fromhex, "2ef0 f1 2")
        self.assertRaises(TypeError, bytes.fromhex, [1])
        self.assertRaises(TypeError, bytes.fromhex, "0f", "0f")

    def test_slicing(self):
        a = bytes([1, 2, 3])
        self.assertEqual(a[0], 1)
        self.assertEqual(a[0:2], bytes([1, 2]))
        self.assertEqual(a[-6:2], a[0:2])
        self.assertEqual(a[2:1], bytes(0))
        self.assertEqual(a[0:-2], a[0:1])

        def foo(x):
            return a[0:x]
        def foo2(x):
            return a[x]
        self.assertRaises(TypeError, foo, "a")
        self.assertRaises(IndexError, foo2, 4)


    def test_count(self):
        a = bytes([1, 2, 3, 1, 2, 3, 1, 2, 3])
        self.assertEqual(a.count(1), 3)
        self.assertEqual(a.count(bytes([1, 2, 3])), 3)
        self.assertEqual(a.count(4), 0)
        self.assertEqual(a.count(bytes([1,2,3,1,2,3])), 1)
        a = bytes([1, 2, 1, 4, 5, 4, 5])
        self.assertEqual(a.count(bytes([4, 5])), 2)

        b = bytes([1, 2, 3, 4, 5])
        self.assertEqual(b.count(4, 0, 3), 0)
        self.assertEqual(b.count(4, -2, 8), 1)
        self.assertEqual(b.count(bytes([4]), -2, 8), 1)
        self.assertEqual(b.count(bytes([4, 5]), 0, 5), 1)

        c = bytes([1, 1, 1, 1])
        self.assertEqual(c.count(1, -5, 0), 0)
        self.assertEqual(c.count(1, -5, 2), 2)
        self.assertEqual(c.count(1, -5, -1), 3)
        self.assertEqual(c.count(1, -5, 3), 3)
        self.assertEqual(c.count(1, -4, -1), 3)
        self.assertEqual(c.count(1, -4, 0), 0)
        self.assertEqual(c.count(1, -4, -2), 2)
        self.assertEqual(c.count(1, -1, -2), 0)
        self.assertEqual(c.count(1, -6, 5), 4)
        self.assertEqual(c.count(1, -4, 5), 4)
        self.assertEqual(c.count(1, -2, 5), 2)

        self.assertRaises(TypeError, a.count, 4, 0, 3, 1)
        self.assertRaises(TypeError, a.count, "hi")
        self.assertRaises(TypeError, a.count, 2, "a", 3)
        self.assertRaises(TypeError, a.count, 2, 0, "3")

    def test_find(self):
        a = bytes([1, 2, 1, 4, 5, 4, 5])
        self.assertEqual(a.find(1), 0)
        self.assertEqual(a.find(3), -1)
        self.assertEqual(a.find(bytes([4, 5])), 3)
        self.assertEqual(a.find(bytes([1, 5])), -1)

        b = bytes([1, 2, 3, 4, 5])
        self.assertEqual(b.find(4, 0, 3), -1)
        self.assertEqual(b.find(4, -2, 8), 3)
        self.assertEqual(b.find(bytes([4, 5]), 0, 5), 3)

        c = bytes([1, 1, 1, 1])
        self.assertEqual(c.find(1, -5, 0), -1)
        self.assertEqual(c.find(1, -5, 2), 0)
        self.assertEqual(c.find(1, -5, -1), 0)
        self.assertEqual(c.find(1, -5, 3), 0)
        self.assertEqual(c.find(1, -3, -1), 1)
        self.assertEqual(c.find(1, -4, 0), -1)
        self.assertEqual(c.find(1, -4, -2), 0)
        self.assertEqual(c.find(1, -1, -2), -1)
        self.assertEqual(c.find(1, -6, 5), 0)
        self.assertEqual(c.find(1, -4, 5), 0)
        self.assertEqual(c.find(1, -2, 5), 2)

        self.assertRaises(TypeError, a.find, "hi")
        self.assertRaises(TypeError, a.find, 4, 0, 3, 1)
        self.assertRaises(TypeError, a.find, 2, "a", 3)
        self.assertRaises(TypeError, a.find, 2, 0, "3")

    def test_index(self):
        a = bytes([1, 2, 1, 4, 5, 4, 5])
        self.assertEqual(a.index(1), 0)
        self.assertRaises(ValueError, a.index, 3)
        self.assertEqual(a.index(bytes([4, 5])), 3)
        self.assertEqual(a.index(bytes([4, 5])), 3)
        self.assertRaises(ValueError, a.index, bytes([1, 5]))

        b = bytes([1, 2, 3, 4, 5])
        self.assertRaises(ValueError, b.index, 4, 0, 3)
        self.assertEqual(b.index(bytes([4, 5]), 0, 5), 3)
        self.assertEqual(b.index(bytes([4, 5]), -3, 8), 3)

        c = bytes([1, 1, 1, 1])
        self.assertRaises(ValueError, c.index, 1, 1, 1)
        self.assertRaises(ValueError, c.index, 1, -4, 0)
        self.assertRaises(ValueError, c.index, 1, -1, -2)
        self.assertRaises(ValueError, c.index, 1, -5, 0)
        self.assertEqual(c.index(1, -6, 5), 0)
        self.assertEqual(c.index(1, -5, 2), 0)
        self.assertEqual(c.index(1, -5, -1), 0)
        self.assertEqual(c.index(1, -5, 3), 0)
        self.assertEqual(c.index(1, -3, -1), 1)
        self.assertEqual(c.index(1, -4, -2), 0)
        self.assertEqual(c.index(1, -4, 5), 0)
        self.assertEqual(c.index(1, -2, 5), 2)

        self.assertRaises(TypeError, a.index, "hi")
        self.assertRaises(TypeError, a.index, 4, 0, 3, 1)
        self.assertRaises(TypeError, a.find, 2, "a", 3)
        self.assertRaises(TypeError, a.find, 2, 0, "3")

    def test_join(self):
        a = bytes([1,2])
        b = bytes([3,4])
        c = bytes([5,6])
        self.assertEqual(a.join([c, c, c]), bytes([5, 6, 1, 2, 5, 6, 1, 2, 5, 6]))
        self.assertEqual(a.join([b, c]), bytes([3, 4, 1, 2, 5, 6]))

        self.assertRaises(TypeError, a.join, c)
        self.assertRaises(TypeError, a.join, [3, c, c])

    def test_endswith(self):
        a = bytes([1,2,3])
        b = bytes([3])
        c = bytes([4])
        d = bytes([1])

        self.assertTrue(a.endswith(b))
        self.assertTrue(a.endswith((c,b)))
        self.assertTrue(a.endswith((b, 2)))
        self.assertFalse(a.endswith((c, d)))
        self.assertFalse(a.endswith(d))
        self.assertTrue(a.endswith(d, -3, -2))
        self.assertTrue(a.endswith(bytes([2]), -3, -1))
        self.assertFalse(a.endswith(b, -4, -3))
        self.assertTrue(a.endswith(d, -4, -2))

        a = bytes([2, 3, 2, 2])
        b = bytes([2, 2])
        self.assertFalse(a.endswith(b, 3))
        self.assertTrue(a.endswith(b))
        self.assertTrue(a.endswith(b, -3, 6))
        self.assertFalse(a.endswith(b, 0, 3))

        c = bytes([1, 1, 1, 1])
        a = bytes([1])
        self.assertFalse(c.endswith(a, -5, 0))
        self.assertTrue(c.endswith(a, -5, 2))
        self.assertTrue(c.endswith(a, -5, -1))
        self.assertTrue(c.endswith(a, -5, 3))
        self.assertTrue(c.endswith(a, -4, -1))
        self.assertFalse(c.endswith(a, -4, 0))
        self.assertTrue(c.endswith(a, -4, -2))
        self.assertFalse(c.endswith(a, -1, -2))
        self.assertTrue(c.endswith(a, -6, 5))
        self.assertTrue(c.endswith(a, -4, 5))
        self.assertTrue(c.endswith(a, -2, 5))

        self.assertRaises(TypeError, a.endswith, 1)
        self.assertRaises(TypeError, a.endswith, b, "f", 2)
        self.assertRaises(TypeError, a.endswith, b, 0, "2")
        self.assertRaises(TypeError, a.endswith, (c, 2))
        self.assertRaises(TypeError, a.endswith, b, 0, 2, 3)
        

    def test_replace(self):
        a = bytes([1, 2, 3, 1, 1])
        b = bytes([1])
        c = bytes([10])
        d = bytes([2, 3])

        self.assertEqual(a.replace(b, c), bytes([10, 2, 3, 10, 10]))
        self.assertEqual(a.replace(b, c, 0), a)
        self.assertEqual(a.replace(b, c, 2), bytes([10, 2, 3, 10, 1]))
        self.assertEqual(a.replace(b, d), bytes([2, 3, 2, 3, 2, 3, 2, 3]))
        self.assertEqual(a.replace(d, b), bytes([1, 1, 1, 1]))
        
        self.assertRaises(TypeError, a.replace, 3, c)
        self.assertRaises(TypeError, a.replace, b, 10)
        self.assertRaises(TypeError, a.replace, b, c, "1")
        self.assertRaises(TypeError, a.replace, b)

    def test_rsplit(self):
        self.assertEqual(b'a b'.rsplit(), [b'a', b'b']);
        self.assertEqual(b' a b '.rsplit(), [b'a', b'b']);
        self.assertEqual(b'a b'.rsplit(b' '), [b'a', b'b']);
        self.assertEqual(b'a b '.rsplit(b' '), [b'a', b'b', b'']);
        self.assertRaises(TypeError, b'a b'.rsplit, ' ')
        self.assertRaises(TypeError, b'a b'.rsplit, 32)
        # b = b"\x09\x0A\x0B\x0C\x0D\x1C\x1D\x1E\x1F"
        # self.assertEqual(b.rsplit(), [b'\x1c\x1d\x1e\x1f'])        
        
    def test_rfind(self):
        a = bytes([1, 2, 1, 4, 5, 4, 5])
        self.assertEqual(a.rfind(1), 2)
        self.assertEqual(a.rfind(3), -1)
        self.assertEqual(a.rfind(bytes([4, 5])), 5)
        self.assertEqual(a.rfind(bytes([1, 5])), -1)

        b = bytes([1, 2, 3, 4, 5])
        self.assertEqual(b.rfind(4, 0, 3), -1)
        self.assertEqual(b.rfind(4, -2, 8), 3)
        self.assertEqual(b.rfind(bytes([4, 5]), 0, 5), 3)

        c = bytes([1, 1, 1, 1])
        self.assertEqual(c.rfind(1, -5, 0), -1)
        self.assertEqual(c.rfind(1, -5, 2), 1)
        self.assertEqual(c.rfind(1, -5, -1), 2)
        self.assertEqual(c.rfind(1, -5, 3), 2)
        self.assertEqual(c.rfind(1, -3, -1), 2)
        self.assertEqual(c.rfind(1, -4, 0), -1)
        self.assertEqual(c.rfind(1, -4, -2), 1)
        self.assertEqual(c.rfind(1, -1, -2), -1)
        self.assertEqual(c.rfind(1, -6, 5), 3)
        self.assertEqual(c.rfind(1, -4, 5), 3)
        self.assertEqual(c.rfind(1, -2, 5), 3)

        self.assertRaises(TypeError, a.rfind, "hi")
        self.assertRaises(TypeError, a.rfind, 4, 0, 3, 1)
        self.assertRaises(TypeError, a.rfind, 2, "a", 3)
        self.assertRaises(TypeError, a.rfind, 2, 0, "3")

    def test_rindex(self):
        a = bytes([1, 2, 1, 4, 5, 4, 5])
        self.assertEqual(a.rindex(1), 2)
        self.assertRaises(ValueError, a.rindex, 3)
        self.assertEqual(a.rindex(bytes([4, 5])), 5)
        self.assertRaises(ValueError, a.rindex, bytes([1, 5]))

        b = bytes([1, 2, 3, 4, 5])
        self.assertRaises(ValueError, b.rindex, 4, 0, 3)
        self.assertEqual(b.rindex(4, -2, 8), 3)
        self.assertEqual(b.rindex(bytes([4, 5]), 0, 5), 3)

        c = bytes([1, 1, 1, 1])
        self.assertRaises(ValueError, c.rindex, 1, -5, 0)
        self.assertEqual(c.rindex(1, -5, 2), 1)
        self.assertEqual(c.rindex(1, -5, -1), 2)
        self.assertEqual(c.rindex(1, -5, 3), 2)
        self.assertEqual(c.rindex(1, -3, -1), 2)
        self.assertRaises(ValueError, c.rindex, 1, -4, 0)
        self.assertEqual(c.rindex(1, -4, -2), 1)
        self.assertRaises(ValueError, c.rindex, 1, -1, -2)
        self.assertEqual(c.rindex(1, -6, 5), 3)
        self.assertEqual(c.rindex(1, -4, 5), 3)
        self.assertEqual(c.rindex(1, -2, 5), 3)

        self.assertRaises(TypeError, a.rindex, "hi")
        self.assertRaises(TypeError, a.rindex, 4, 0, 3, 1)
        self.assertRaises(TypeError, a.rindex, 2, "a", 3)
        self.assertRaises(TypeError, a.rindex, 2, 0, "3")

    def test_rpartition(self):
        a = bytes([1, 2, 2, 3])
        b = bytes([2])
        self.assertEqual(a.rpartition(b), (bytes([1, 2]), b, bytes([3])))
        self.assertEqual(a.rpartition(bytes(4)), (bytes([]), bytes([]), a))
        self.assertEqual(a.rpartition(bytes([4])), (bytes([]), bytes([]), a))
        self.assertEqual(a.rpartition(bytes([2, 3])), (bytes([1, 2]), bytes([2, 3]), bytes([])))

        a = bytes([1, 2, 2, 2, 4, 2, 2])
        b = bytes([2, 2])
        self.assertEqual(a.rpartition(b), (bytes([1, 2, 2, 2, 4]), bytes([2, 2]), bytes([])))
        self.assertEqual(a.rpartition(bytes([2])), (bytes([1, 2, 2, 2, 4, 2]), bytes([2]), bytes([])))

        self.assertRaises(TypeError, a.rpartition, 2)
        self.assertRaises(TypeError, a.rpartition, bytes([2]), bytes([2]))

    def test_partition(self):
        a = bytes([1, 2, 2, 3])
        b = bytes([2])
        self.assertEqual(a.partition(b), (bytes([1]), bytes([2]), bytes([2, 3])))
        self.assertEqual(a.partition(bytes([1, 3])), (a, bytes([]), bytes([])))
        self.assertEqual(a.partition(bytes([2, 3])), (bytes([1, 2]), bytes([2, 3]), bytes([])))
        self.assertEqual(a.partition(bytes([1])), (bytes([]), bytes([1]), bytes([2, 2, 3])))

        a = bytes([1, 2, 2, 2, 4, 2, 2])
        b = bytes([2, 2])
        self.assertEqual(a.partition(b), (bytes([1]), bytes([2, 2]), bytes([2, 4, 2, 2])))
        self.assertRaises(TypeError, a.partition, 2)
        self.assertRaises(TypeError, a.partition, bytes([2]), bytes([2]))

    def test_title(self):
        self.assertEqual(b' hello '.title(), b' Hello ')
        self.assertEqual(b'hello '.title(), b'Hello ')
        self.assertEqual(b'Hello '.title(), b'Hello ')
        self.assertEqual(b"fOrMaT thIs aS titLe String".title(), b'Format This As Title String')
        self.assertEqual(b"fOrMaT,thIs-aS*titLe;String".title(), b'Format,This-As*Title;String')
        self.assertEqual(b"getInt".title(), b'Getint')

    def test_splitlines(self):
        self.assertEqual(b'abc\ndef\n\rghi'.splitlines(), [b'abc', b'def', b'', b'ghi']) 
        self.assertEqual(b'abc\ndef\n\r\nghi'.splitlines(), [b'abc', b'def', b'', b'ghi']) 
        self.assertEqual(b'abc\ndef\r\nghi'.splitlines(), [b'abc', b'def', b'ghi'])
        self.assertEqual(b'abc\ndef\r\nghi\n'.splitlines(), [b'abc', b'def', b'ghi'])
        self.assertEqual(b'abc\ndef\r\nghi\n\r'.splitlines(), [b'abc', b'def', b'ghi', b''])
        self.assertEqual(b'\nabc\ndef\r\nghi\n\r'.splitlines(), [b'', b'abc', b'def', b'ghi', b''])
        self.assertEqual(b'\nabc\ndef\r\nghi\n\r'.splitlines(False), [b'', b'abc', b'def', b'ghi', b''])                        
        self.assertEqual(b'\nabc\ndef\r\nghi\n\r'.splitlines(True), [b'\n', b'abc\n', b'def\r\n', b'ghi\n', b'\r'])

    def test_startswith(self):
        a = bytes([1, 2, 2, 3])
        b = bytes([1, 2])
        c = bytes([2, 3])
        d = bytes([5])
        e = bytes([3])

        self.assertTrue(a.startswith(b, 0, 4))
        self.assertTrue(bytes.startswith(a, b, 0, 4))
        self.assertTrue(a.startswith(b, 0, 5))
        self.assertTrue(a.startswith(bytes([2]), 1, 4))
        self.assertFalse(a.startswith(b, -2, 4))
        self.assertFalse(a.startswith(b, 1, 4))
        self.assertTrue(a.startswith(c, -2, 4))
        self.assertFalse(a.startswith(bytes([2]), -6, -5))
        self.assertTrue(a.startswith((b, c), 0, 4))
        self.assertTrue(a.startswith((b, 2), 0, 4))
        self.assertFalse(a.startswith((c, d), 0, 4))

        c = bytes([1, 1, 1, 1])
        a = bytes([1])
        self.assertFalse(c.startswith(a, -5, 0))
        self.assertTrue(c.startswith(a, -5, 2))
        self.assertTrue(c.startswith(a, -5, -1))
        self.assertTrue(c.startswith(a, -5, 3))
        self.assertTrue(c.startswith(a, -4, -1))
        self.assertFalse(c.startswith(a, -4, 0))
        self.assertTrue(c.startswith(a, -4, -2))
        self.assertFalse(c.startswith(a, -1, -2))
        self.assertTrue(c.startswith(a, -6, 5))
        self.assertTrue(c.startswith(a, -4, 5))
        self.assertTrue(c.startswith(a, -2, 5))

        self.assertRaises(TypeError, a.startswith, 2)
        self.assertRaises(TypeError, a.startswith, b, "2", 4)
        self.assertRaises(TypeError, a.startswith, b, 0, "4")
        self.assertRaises(TypeError, a.startswith, b, 0, 4, 4)
        self.assertRaises(TypeError, a.startswith, (c, 2), 0, 4)

    def test_center(self):
        a = bytes([1, 2, 3])
        b = bytes([4])
        self.assertEqual(a.center(2), a)
        self.assertEqual(a.center(3), a)
        self.assertEqual(a.center(6), bytes([32, 1, 2, 3, 32, 32]))
        self.assertEqual(a.center(5, b), bytes([4, 1, 2, 3, 4]))
        self.assertEqual(a.center(6, b), bytes([4, 1, 2, 3, 4, 4]))

        self.assertRaises(TypeError, a.center, "3")
        self.assertRaises(TypeError, a.center, 3, 3)
        self.assertRaises(TypeError, a.center, 3, bytes([]))
        self.assertRaises(TypeError, a.center, 3, bytes([1]), 1)

    def test_ljust(self):
        a = bytes([1, 2, 3])
        b = bytes([4])
        self.assertEqual(a.ljust(2), a)
        self.assertEqual(a.ljust(3), a)
        self.assertEqual(a.ljust(6), bytes([1, 2, 3, 32, 32, 32]))
        self.assertEqual(a.ljust(5, b), bytes([1, 2, 3, 4, 4]))

        self.assertRaises(TypeError, a.ljust, "3")
        self.assertRaises(TypeError, a.ljust, 3, 3)
        self.assertRaises(TypeError, a.ljust, 3, bytes([]))
        self.assertRaises(TypeError, a.ljust, 3, bytes([1]), 1)

    def test_lstrip(self):
        a = bytes([1, 1, 2, 3, 1, 3])
        b = bytes([1])
        self.assertEqual(a.lstrip(b), bytes([2, 3, 1, 3]))
        self.assertEqual(a.lstrip(bytes([2])), a)

        c = bytes(" \t\n\vABC", "ascii")
        self.assertEqual(c.lstrip(), bytes([65, 66, 67]))
        self.assertEqual(c.lstrip(None), bytes([65, 66, 67]))

        d = bytes([1, 2, 3, 4])
        e = bytes([2, 3, 1])
        self.assertEqual(d.lstrip(e), bytes([4]))
        self.assertEqual(d.lstrip(bytes([2, 3, 4, 1])), bytes([]))

        self.assertRaises(TypeError, a.lstrip, 1)
        self.assertRaises(TypeError, a.lstrip, b, 1)

    def test_rjust(self):
        a = bytes([1, 2, 3])
        b = bytes([4])
        self.assertEqual(a.rjust(2), a)
        self.assertEqual(a.rjust(3), a)
        self.assertEqual(a.rjust(6), bytes([32, 32, 32,1, 2, 3]))
        self.assertEqual(a.rjust(5, b), bytes([4, 4, 1, 2, 3]))

        self.assertRaises(TypeError, a.rjust, "3")
        self.assertRaises(TypeError, a.rjust, 3, 3)
        self.assertRaises(TypeError, a.rjust, 3, bytes([]))
        self.assertRaises(TypeError, a.rjust, 3, bytes([1]), 1)

    def test_rstrip(self):
        a = bytes([2, 3, 1, 3, 1, 1])
        b = bytes([1])
        self.assertEqual(a.rstrip(b), bytes([2, 3, 1, 3]))
        self.assertEqual(a.rstrip(bytes([3])), a)

        c = bytes("ABC \t\n\v", "ascii")
        self.assertEqual(c.rstrip(), bytes([65, 66, 67]))
        self.assertEqual(c.rstrip(None), bytes([65, 66, 67]))

        d = bytes([1, 2, 3, 4])
        e = bytes([3, 4, 2])
        self.assertEqual(d.rstrip(e), bytes([1]))
        self.assertEqual(d.rstrip(bytes([2, 3, 4, 1])), bytes([]))

        self.assertRaises(TypeError, a.rstrip, 1)
        self.assertRaises(TypeError, a.rstrip, b, 1)

    def test_strip(self):
        a = bytes([2, 3, 1, 3, 1, 1])
        b = bytes([1, 2])
        self.assertEqual(a.strip(b), bytes([3, 1, 3]))

        c = bytes(" \v\t\nABC \t\n\v", "ascii")
        self.assertEqual(c.strip(), bytes([65, 66, 67]))
        self.assertEqual(c.strip(None), bytes([65, 66, 67]))

        self.assertRaises(TypeError, a.strip, 1)
        self.assertRaises(TypeError, a.strip, b, 1)

    def test_capitalize(self):
        a = bytes([97, 65, 99, 68, 1])
        self.assertEqual(a.capitalize(), bytes([65, 97, 99, 100, 1]))
        b = bytes([48, 64, 91])
        self.assertEqual(b.capitalize(), b)
        c = bytes([])
        self.assertEqual(c.capitalize(), c)

        self.assertRaises(TypeError, b.capitalize, 1)

    def test_isalnum(self):
        a = bytes([])
        self.assertFalse(a.isalnum())
        b = bytes("ABCabc1", "ascii")
        self.assertTrue(b.isalnum())
        self.assertTrue(bytes.isalnum(b))
        c = bytes("ABc 456", "ascii")
        self.assertFalse(c.isalnum())
        a = bytes("/", "ascii")
        self.assertFalse(a.isalnum())
        a = bytes("'ABC", "ascii")
        self.assertFalse(a.isalnum())

        self.assertRaises(TypeError, a.isalnum, 1)

    def test_isalpha(self):
        a = bytes([])
        self.assertFalse(a.isalpha())
        b = bytes("ABCabc1", "ascii")
        self.assertFalse(b.isalpha())
        a = bytes("/", "ascii")
        self.assertFalse(a.isalpha())
        a = bytes("Abc", "ascii")
        self.assertTrue(a.isalpha())
        self.assertTrue(bytes.isalpha(a))

        self.assertRaises(TypeError, a.isalpha, 1)

    def test_isascii(self):
        a = bytes([])
        self.assertTrue(a.isascii())
        b = bytes("Ab1{/'", "ascii")
        self.assertTrue(b.isascii())
        self.assertTrue(bytes.isascii(b))
        c = bytes("abc1ÿ/}", "utf-8")
        self.assertFalse(c.isascii())
        d = bytes([100, 101, 128])
        self.assertFalse(d.isascii())

        self.assertRaises(TypeError, a.isascii, 1)

    def test_isdigit(self):
        a = bytes([])
        self.assertFalse(a.isdigit())
        b = bytes("123a", "ascii")
        self.assertFalse(b.isdigit())
        c = bytes("095", "ascii")
        self.assertTrue(c.isdigit())
        self.assertTrue(bytes.isdigit(c))

        self.assertRaises(TypeError, a.isdigit, 1)

    def test_islower(self):
        a = bytes([])
        self.assertFalse(a.islower())
        b = bytes("12/a", "ascii")
        self.assertTrue(b.islower())
        self.assertTrue(bytes.islower(b))
        c = bytes("abC", "ascii")
        self.assertFalse(c.islower())
        d = bytes("123", "ascii")
        self.assertFalse(d.islower())

        self.assertRaises(TypeError, d.islower, 1)

    def test_istitle(self):
        self.assertFalse(b''.istitle())
        self.assertFalse(b'a'.istitle())
        self.assertTrue(b'A'.istitle())
        self.assertFalse(b'\n'.istitle())
        self.assertTrue(b'A Titlecased Line'.istitle())
        self.assertTrue(b'A\nTitlecased Line'.istitle())
        self.assertTrue(b'A Titlecased, Line'.istitle())
        self.assertFalse(b'Not a capitalized String'.istitle())
        self.assertFalse(b'Not\ta Titlecase String'.istitle())
        self.assertFalse(b'Not--a Titlecase String'.istitle())
        self.assertFalse(b'NOT'.istitle())

    def test_isspace(self):
        a = bytes([])
        self.assertFalse(a.isspace())
        b = bytes(" 9", "ascii")
        self.assertFalse(a.isspace())
        c = bytes([32, 9, 10])
        self.assertTrue(c.isspace())
        self.assertTrue(bytes.isspace(c))
        d = bytes([13, 11, 12])
        self.assertTrue(d.isspace())

        self.assertRaises(TypeError, c.isspace, 1)

    def test_isupper(self):
        a = bytes([])
        self.assertFalse(a.isupper())
        b = bytes("AZ", "ascii")
        self.assertTrue(b.isupper())
        self.assertTrue(bytes.isupper(b))
        c = bytes("123/", "ascii")
        self.assertFalse(c.isupper())
        d = bytes("ABCd", "ascii")
        self.assertFalse(d.isupper())

        self.assertRaises(TypeError, d.isupper, 1)

    def test_lower(self):
        a = bytes([77, 78, 45, 111])
        self.assertEqual(a.lower(), bytes([109, 110, 45, 111]))
        b = bytes([65, 90, 64, 91])
        self.assertTrue(b.lower().islower())
        self.assertEqual(b.lower(), bytes([97, 122, 64, 91]))
        self.assertTrue(b.lower().islower())

        self.assertRaises(TypeError, b.lower, 1)

    def test_swapcase(self):
        a = bytes([77, 78, 45, 111])
        self.assertEqual(a.swapcase(), bytes([109, 110, 45, 79]))
        b = bytes([65, 90, 97, 122])
        self.assertEqual(b.swapcase(), bytes([97, 122, 65, 90]))
        c = bytes([64, 91, 96, 123])
        self.assertEqual(c.swapcase(), c)

        self.assertRaises(TypeError, c.swapcase, 1)

    def test_upper(self):
        a = bytes([109, 110, 45, 111])
        self.assertEqual(a.upper(), bytes([77, 78, 45, 79]))
        b = bytes([97, 122, 64, 91])
        self.assertEqual(b.upper(), bytes([65, 90, 64, 91]))
        self.assertTrue(b.upper().isupper())
        
        self.assertRaises(TypeError, b.upper, 1)

    def test_zfill(self):
        a = bytes([1, 2, 3])
        self.assertEqual(a.zfill(2), a)
        #this should work bc it should return the same object
        #but "is" doesn't work for bytes yet
        #self.assertTrue(a.zfill(2) is a)
        self.assertEqual(a.zfill(5), bytes([48, 48, 1, 2, 3]))
        b = bytes([43, 1, 2])
        self.assertEqual(b.zfill(5), bytes([43, 48, 48, 1, 2]))
        c = bytes([45, 2])
        self.assertEqual(c.zfill(3), bytes([45, 48, 2]))
        d = bytes([1, 43, 2])
        self.assertEqual(d.zfill(4), bytes([48, 1, 43, 2]))

        self.assertRaises(TypeError, d.zfill, "2")
        self.assertRaises(TypeError, d.zfill)
        self.assertRaises(TypeError, d.zfill, 3, 3)

    def test_none_arguments(self):
        # issue 11828
        b = bytes(b'hello')
        l = bytes(b'l')
        h = bytes(b'h')
        x = bytes(b'x')
        o = bytes(b'o')

        self.assertEqual(2, b.find(l, None))
        self.assertEqual(3, b.find(l, -2, None))
        self.assertEqual(2, b.find(l, None, -2))
        self.assertEqual(0, b.find(h, None, None))

        self.assertEqual(3, b.rfind(l, None))
        self.assertEqual(3, b.rfind(l, -2, None))
        self.assertEqual(2, b.rfind(l, None, -2))
        self.assertEqual(0, b.rfind(h, None, None))

        self.assertEqual(2, b.index(l, None))
        self.assertEqual(3, b.index(l, -2, None))
        self.assertEqual(2, b.index(l, None, -2))
        self.assertEqual(0, b.index(h, None, None))

        self.assertEqual(3, b.rindex(l, None))
        self.assertEqual(3, b.rindex(l, -2, None))
        self.assertEqual(2, b.rindex(l, None, -2))
        self.assertEqual(0, b.rindex(h, None, None))

        self.assertEqual(2, b.count(l, None))
        self.assertEqual(1, b.count(l, -2, None))
        self.assertEqual(1, b.count(l, None, -2))
        self.assertEqual(0, b.count(x, None, None))

        self.assertEqual(True, b.endswith(o, None))
        self.assertEqual(True, b.endswith(o, -2, None))
        self.assertEqual(True, b.endswith(l, None, -2))
        self.assertEqual(False, b.endswith(x, None, None))

        self.assertEqual(True, b.startswith(h, None))
        self.assertEqual(True, b.startswith(l, -2, None))
        self.assertEqual(True, b.startswith(h, None, -2))
        self.assertEqual(False, b.startswith(x, None, None))


    # def test_integer_arguments_out_of_byte_range(self):
    #     b = bytes(b'hello')
    #     for method in (b.count, b.find, b.index, b.rfind, b.rindex):
    #         self.assertRaises(ValueError, method, -1)
    #         self.assertRaises(ValueError, method, 256)
    #         self.assertRaises(ValueError, method, 9999)

    def test_ord(self):
        b = bytes(b'\0A\x7f\x80\xff')
        self.assertEqual([ord(b[i:i+1]) for i in range(len(b))],
                            [0, 65, 127, 128, 255])


    def test_custom(self):
        class BytesSubclass(bytes):
            pass
        class OtherBytesSubclass(bytes):
            pass

        class A:
            def __bytes__(self):
                return b'abc'
        self.assertEqual(bytes(A()), b'abc')
        class A: pass
        self.assertRaises(TypeError, bytes, A())
        class A:
            def __bytes__(self):
                return None
        self.assertRaises(TypeError, bytes, A())
        class A:
            def __bytes__(self):
                return b'a'
            def __index__(self):
                return 42
        self.assertEqual(bytes(A()), b'a')
        # Issue #25766
        class A(str):
            def __bytes__(self):
                return b'abc'
        self.assertEqual(bytes(A('\u20ac')), b'abc')
        # self.assertEqual(bytes(A('\u20ac'), 'iso8859-15'), b'\xa4')
        # Issue #24731
        class A:
            def __bytes__(self):
                return OtherBytesSubclass(b'abc')
        self.assertEqual(bytes(A()), b'abc')
        self.assertIs(type(bytes(A())), OtherBytesSubclass)
        self.assertEqual(BytesSubclass(A()), b'abc')
        self.assertIs(type(BytesSubclass(A())), BytesSubclass)


    def test_empty_sequence(self):
        b = self.type2test()
        self.assertEqual(len(b), 0)
        self.assertRaises(IndexError, lambda: b[0])
        self.assertRaises(IndexError, lambda: b[1])
        self.assertRaises(IndexError, lambda: b[sys.maxsize])
        self.assertRaises(IndexError, lambda: b[sys.maxsize+1])
        self.assertRaises(IndexError, lambda: b[10**100])
        self.assertRaises(IndexError, lambda: b[-1])
        self.assertRaises(IndexError, lambda: b[-2])
        self.assertRaises(IndexError, lambda: b[-sys.maxsize])
        # self.assertRaises(IndexError, lambda: b[-sys.maxsize-1])
        # self.assertRaises(IndexError, lambda: b[-sys.maxsize-2])
        # self.assertRaises(IndexError, lambda: b[-10**100])

    def test_from_iterable(self):
        b = self.type2test(range(256))
        self.assertEqual(len(b), 256)
        self.assertEqual(list(b), list(range(256)))

        # Non-sequence iterable.
        b = self.type2test({42})
        self.assertEqual(b, b"*")
        b = self.type2test({43, 45})
        self.assertIn(tuple(b), {(43, 45), (45, 43)})

        # Iterator that has a __length_hint__.
        b = self.type2test(iter(range(256)))
        self.assertEqual(len(b), 256)
        self.assertEqual(list(b), list(range(256)))

        # Iterator that doesn't have a __length_hint__.
        b = self.type2test(i for i in range(256) if i % 2)
        self.assertEqual(len(b), 128)
        self.assertEqual(list(b), list(range(256))[1::2])

        # Sequence without __iter__.
        class S:
            def __getitem__(self, i):
                return (1, 2, 3)[i]
        b = self.type2test(S())
        self.assertEqual(b, b"\x01\x02\x03")

    def test_from_tuple(self):
        # There is a special case for tuples.
        b = self.type2test(tuple(range(256)))
        self.assertEqual(len(b), 256)
        self.assertEqual(list(b), list(range(256)))
        b = self.type2test((1, 2, 3))
        self.assertEqual(b, b"\x01\x02\x03")

    def test_from_list(self):
        # There is a special case for lists.
        b = self.type2test(list(range(256)))
        self.assertEqual(len(b), 256)
        self.assertEqual(list(b), list(range(256)))
        b = self.type2test([1, 2, 3])
        self.assertEqual(b, b"\x01\x02\x03")

    def test_from_mutating_list(self):
        # Issue #34973: Crash in bytes constructor with mutating list.
        class X:
            def __index__(self):
                a.clear()
                return 42
        a = [X(), X()]
        # self.assertEqual(bytes(a), b'*') # skulpt handling of mutating list reducing in size

        class Y:
            def __index__(self):
                if len(a) < 1000:
                    a.append(self)
                return 42
        a = [Y()]
        self.assertEqual(bytes(a), b'*' * 1000)  # should not crash

    def test_from_index(self):
        b = self.type2test([Indexable(), Indexable(1), Indexable(254),
                            Indexable(255)])
        self.assertEqual(list(b), [0, 1, 254, 255])
        self.assertRaises(ValueError, self.type2test, [Indexable(-1)])
        self.assertRaises(ValueError, self.type2test, [Indexable(256)])

    # def test_from_buffer(self):
    #     a = self.type2test(array.array('B', [1, 2, 3]))
    #     self.assertEqual(a, b"\x01\x02\x03")
    #     a = self.type2test(b"\x01\x02\x03")
    #     self.assertEqual(a, b"\x01\x02\x03")

    #     # Issues #29159 and #34974.
    #     # Fallback when __index__ raises a TypeError
    #     class B(bytes):
    #         def __index__(self):
    #             raise TypeError

    #     self.assertEqual(self.type2test(B(b"foobar")), b"foobar")

    def test_from_ssize(self):
        self.assertEqual(self.type2test(0), b'')
        self.assertEqual(self.type2test(1), b'\x00')
        self.assertEqual(self.type2test(5), b'\x00\x00\x00\x00\x00')
        self.assertRaises(ValueError, self.type2test, -1)

        self.assertEqual(self.type2test('0', 'ascii'), b'0')
        self.assertEqual(self.type2test(b'0'), b'0')
        self.assertRaises(OverflowError, self.type2test, sys.maxsize + 1)

    def test_constructor_type_errors(self):
        self.assertRaises(TypeError, self.type2test, 0.0)
        class C:
            pass
        self.assertRaises(TypeError, self.type2test, ["0"])
        self.assertRaises(TypeError, self.type2test, [0.0])
        self.assertRaises(TypeError, self.type2test, [None])
        self.assertRaises(TypeError, self.type2test, [C()])
        # self.assertRaises(TypeError, self.type2test, encoding='ascii') # kwargs not yet supportd
        # self.assertRaises(TypeError, self.type2test, errors='ignore') # kwargs not yet supported
        self.assertRaises(TypeError, self.type2test, 0, 'ascii')
        self.assertRaises(TypeError, self.type2test, b'', 'ascii')
        # self.assertRaises(TypeError, self.type2test, 0, errors='ignore') # kwargs not yet supported
        # self.assertRaises(TypeError, self.type2test, b'', errors='ignore') # kwargs not yet supported
        self.assertRaises(TypeError, self.type2test, '')
        # self.assertRaises(TypeError, self.type2test, '', errors='ignore') # kwargs not yet supported
        self.assertRaises(TypeError, self.type2test, '', b'ascii')
        self.assertRaises(TypeError, self.type2test, '', 'ascii', b'ignore')

    def test_constructor_value_errors(self):
        self.assertRaises(ValueError, self.type2test, [-1])
        self.assertRaises(ValueError, self.type2test, [-sys.maxsize])
        self.assertRaises(ValueError, self.type2test, [-sys.maxsize-1])
        self.assertRaises(ValueError, self.type2test, [-sys.maxsize-2])
        self.assertRaises(ValueError, self.type2test, [-10**100])
        self.assertRaises(ValueError, self.type2test, [256])
        self.assertRaises(ValueError, self.type2test, [257])
        self.assertRaises(ValueError, self.type2test, [sys.maxsize])
        self.assertRaises(ValueError, self.type2test, [sys.maxsize+1])
        self.assertRaises(ValueError, self.type2test, [10**100])

if __name__ == '__main__':
    unittest.main()  
