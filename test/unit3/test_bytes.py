""" Unit testing for bytes object"""
import unittest

class BytesTests(unittest.TestCase):
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

    def test_decode(self):
        a = bytes("abc", "ascii")
        b0 = [67,127,102]
        b = bytes(b0)
        self.assertRaises(LookupError, a.decode, "a")
        self.assertEqual(a.decode('ascii'), "abc")
        u = b.decode("utf-8")

        self.assertRaises(TypeError, a.decode, [], "strict")
        self.assertRaises(TypeError, a.decode, "ascii", [])

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

if __name__ == '__main__':
    unittest.main()  
