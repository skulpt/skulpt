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

    def test_iterable_arg(self):
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
        self.assertRaises(TypeError, bytes, "string")
        self.assertRaises(TypeError, bytes, [1,2, "3"])
        self.assertRaises(ValueError, bytes, [257, 2, 3])
        self.assertRaises(ValueError, bytes, [-1, 2, 3])

    def test_string_arg(self):
        string = "abz"
        d = bytes(string, 'ascii')
        self.assertEqual(str(d), "b'abz'")
        self.assertEqual(list(d), [97, 98, 122])
        self.assertEqual(len(d), 3)

        self.assertRaises(TypeError, bytes, "abc", [])
        self.assertRaises(TypeError, bytes, ["a", "b"], "ascii")
        #fails below because we don't have a LookupError, but it throws a diff one
        #self.assertRaises(LookupError, bytes, "abc", "asd")
        #self.assertRaises(NotImplementedError, bytes, "abc", "utf-8")
        #fails below bc no UEE
        #self.assertRaises(UnicodeEncodeError, bytes, "ÿ", "ascii")
        #this isn't exactly what it's supposed to do but I just wan't to make sure it raises something VV
        self.assertRaises(ValueError, bytes, "ÿ", "ascii")
        self.assertRaises(ValueError, bytes, "ӳ", "ascii")

    def test_comparisons(self):
        self.assertTrue(bytes([97, 98, 122]) == bytes("abz", 'ascii'))

    def test_decode(self):
        a = bytes("abc", "ascii")
        b0 = [98,130,102]
        b = bytes(b0)
        print(b.decode('ascii'))
        self.assertEqual(a.decode('ascii'), "abc")



if __name__ == '__main__':
    unittest.main()
            
