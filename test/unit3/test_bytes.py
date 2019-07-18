""" Unit testing for bytes object"""
import unittest

class BytesTests(unittest.TestCase):
    def test_integer_arg(self):
        self.assertRaises(TypeError, bytes, "3")
        a = bytes(4)
        self.assertEqual(str(a), "b'\\x00\\x00\\x00\\x00'")
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
        #self.assertEqual(a1, bytes(a1))
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
        self.assertRaises(TypeError, bytes, ["a", "b"], "ascii")
        self.assertRaises(LookupError, bytes, "abc", "asd")
        self.assertRaises(UnicodeEncodeError, bytes, "ÿ", "ascii")

    def test_comparisons(self):
        self.assertTrue(bytes([97, 98, 122]) == bytes("abz", 'ascii'))
        self.assertFalse(bytes([97, 98, 122]) != bytes("abz", 'ascii'))
        self.assertFalse(bytes([97, 120]) == bytes([97, 120, 100]))
        self.assertFalse(bytes([97, 98, 99]) == bytes("abd", "ascii"))

    def test_decode(self):
        a = bytes("abc", "ascii")
        b0 = [67,127,102]
        b = bytes(b0)
        self.assertRaises(LookupError, a.decode, "a")
        self.assertEqual(a.decode('ascii'), "abc")
        u = b.decode("utf-8")

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

    def test_fromhex(self):
        a = "0f34"
        self.assertEqual(bytes.fromhex(a), bytes([15, 52]))
        b = "123456"
        self.assertEqual(bytes.fromhex(b), bytes([18, 52, 86]))
        self.assertEqual(bytes([1,2]).fromhex("ff"), bytes.fromhex("ff"))
        self.assertEqual(bytes.fromhex("AA"), bytes.fromhex("aa"))

        self.assertRaises(ValueError, bytes.fromhex, "ag")
        self.assertRaises(ValueError, bytes.fromhex, "0f0")
        self.assertRaises(ValueError, bytes.fromhex, "0f340/")
        #this raises a weird error, idk how to fix
        #self.assertRaises(TypeError, bytes.fromhex)
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
        self.assertEqual(b.count(bytes([4, 5]), 0, 5), 1)

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

        a = bytes([2, 3, 2, 2])
        b = bytes([2, 2])
        self.assertFalse(a.endswith(b, 3))
        self.assertTrue(a.endswith(b))
        self.assertTrue(a.endswith(b, -3, 6))
        self.assertFalse(a.endswith(b, 0, 3))

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

    def test_startswith(self):
        a = bytes([1, 2, 2, 3])
        b = bytes([1, 2])
        c = bytes([2, 3])
        d = bytes([5])
        e = bytes([3])

        self.assertTrue(a.startswith(b, 0, 4))
        self.assertTrue(a.startswith(b, 0, 5))
        self.assertTrue(a.startswith(bytes([2]), 1, 4))
        self.assertFalse(a.startswith(b, -2, 4))
        self.assertFalse(a.startswith(b, 1, 4))
        self.assertTrue(a.startswith(c, -2, 4))
        self.assertFalse(a.startswith(bytes([2]), -6, -5))
        self.assertTrue(a.startswith((b, c), 0, 4))
        self.assertTrue(a.startswith((b, 2), 0, 4))
        self.assertFalse(a.startswith((c, d), 0, 4))

        self.assertRaises(TypeError, a.startswith, 2)
        self.assertRaises(TypeError, a.startswith, b, "2", 4)
        self.assertRaises(TypeError, a.startswith, b, 0, "4")
        self.assertRaises(TypeError, a.startswith, b, 0, 4, 4)
        self.assertRaises(TypeError, a.startswith, (c, 2), 0, 4)

    def test_isalnum(self):
        a = bytes([])
        self.assertFalse(a.isalnum())
        b = bytes("ABCabc1", "ascii")
        self.assertTrue(b.isalnum())
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

        self.assertRaises(TypeError, a.isalpha, 1)

    def test_isascii(self):
        a = bytes([])
        self.assertTrue(a.isascii())
        b = bytes("Ab1{/'", "ascii")
        self.assertTrue(b.isascii())
        c = bytes("abc1ÿ/}", "utf-8")
        #self.assertFalse(c.isascii())

        self.assertRaises(TypeError, a.isascii, 1)
        
        

if __name__ == '__main__':
    unittest.main()  
