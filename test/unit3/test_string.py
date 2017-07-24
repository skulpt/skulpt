import unittest
import string


class ModuleTest(unittest.TestCase):

    def test_attrs(self):
        # While the exact order of the items in these attributes is not
        # technically part of the "language spec", in practice there is almost
        # certainly user code that depends on the order, so de-facto it *is*
        # part of the spec.
        # self.assertEqual(string.whitespace, ' \t\n\r\x0b\x0c')
        self.assertEqual(string.ascii_lowercase, 'abcdefghijklmnopqrstuvwxyz')
        self.assertEqual(string.ascii_uppercase, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        self.assertEqual(string.ascii_letters, string.ascii_lowercase + string.ascii_uppercase)
        self.assertEqual(string.digits, '0123456789')
        self.assertEqual(string.hexdigits, string.digits + 'abcdefABCDEF')
        self.assertEqual(string.octdigits, '01234567')
        self.assertEqual(string.punctuation, '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~')
        # self.assertEqual(string.printable, string.digits + string.ascii_lowercase + string.ascii_uppercase + string.punctuation + string.whitespace)

    def test_capwords(self):
        self.assertEqual(string.capwords('abc def ghi'), 'Abc Def Ghi')
        # self.assertEqual(string.capwords('abc\tdef\nghi'), 'Abc Def Ghi')
        # self.assertEqual(string.capwords('abc\t   def  \nghi'), 'Abc Def Ghi')
        self.assertEqual(string.capwords('ABC DEF GHI'), 'Abc Def Ghi')
        self.assertEqual(string.capwords('ABC-DEF-GHI', '-'), 'Abc-Def-Ghi')
        self.assertEqual(string.capwords('ABC-def DEF-ghi GHI'), 'Abc-def Def-ghi Ghi')
        # self.assertEqual(string.capwords('   aBc  DeF   '), 'Abc Def')
        # self.assertEqual(string.capwords('\taBc\tDeF\t'), 'Abc Def')
        # self.assertEqual(string.capwords('\taBc\tDeF\t', '\t'), '\tAbc\tDef\t')


if __name__ == '__main__':
    unittest.main()
