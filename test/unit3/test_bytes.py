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

    def test_iterables(self):
        a = [1,2,3]
        a1 = bytes(a)
        self.assertEqual(str(a1)[2:-1], "\\x01\\x02\\x03")
        self.assertEqual(a1, bytes(a1))
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
        #self.assertRaises(NotImplementedError, bytes, "abc", "utf-8")
        self.assertRaises(UnicodeEncodeError, bytes, "ÿ", "ascii")

    def test_comparisons(self):
        self.assertTrue(bytes([97, 98, 122]) == bytes("abz", 'ascii'))
        self.assertFalse(bytes([97, 98, 122]) != bytes("abz", 'ascii'))
        self.assertFalse(bytes([97, 120]) == bytes([97, 120, 100]))
        self.assertFalse(bytes([97, 98, 99]) == bytes("abd", "ascii"))

    def test_decode(self):
        a = bytes("abc", "ascii")
        b0 = [98,130,102]
        b = bytes(b0)
        self.assertRaises(UnicodeDecodeError, b.decode, "ascii")
        self.assertRaises(LookupError, a.decode, "a")
        self.assertEqual(a.decode('ascii'), "abc")

    def test_encode(self):
        a = "abc".encode("ascii")
        self.assertEqual(list(a), [97, 98, 99])
        self.assertEqual(type(a), bytes)

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
        #self.assertEqual(c, "?de")
        b = bytes([250, 100, 101])
        c = b.decode("ascii", "replace")
        #self.assertEqual(c, "?de")
        

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
            
            

if __name__ == '__main__':
    unittest.main()  
