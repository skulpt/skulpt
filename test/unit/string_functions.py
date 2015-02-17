__author__ = "gerbal"

# unit test files should be named test_<your name here>.py
# this ensures they will automatically be included in the
# ./skulpt.py test or ./skulpt.py dist testing procedures
#

# These tests are a modification of the cPython buffer tests


import unittest

class string_functions(unittest.TestCase):
    def test_islower(self):
        self.assertFalse("".islower(), "islower")
        self.assertTrue("a".islower(), "islower")
        self.assertFalse("A".islower(), "islower")
        self.assertFalse("\n".islower(), "islower")
        self.assertTrue("abc".islower(), "islower")
        self.assertFalse("aBc".islower(), "islower")
        self.assertTrue("abc\n".islower(), "islower")
        # self.assertRaises(TypeError, "abc".islower, 42) #

    def test_isupper(self):
        self.assertFalse("".isupper())
        self.assertFalse("a".isupper())
        self.assertTrue("A".isupper())
        self.assertFalse("\n".isupper())
        self.assertTrue("ABC".isupper())
        self.assertFalse("AbC".isupper())
        self.assertTrue("ABC\n".isupper())
        # self.assertRaises(TypeError, "abc".isupper, 42) #

    def test_istitle(self):
        self.assertFalse("".istitle())
        self.assertFalse("a".istitle())
        self.assertTrue("A".istitle())
        self.assertFalse("\n".istitle()) ##
        self.assertTrue("A Titlecased Line".istitle()) ##
        self.assertTrue("A\nTitlecased Line".istitle()) ##
        self.assertTrue("A Titlecased, Line".istitle()) ##
        self.assertFalse("Not a capitalized String".istitle())
        self.assertFalse("Not\ta Titlecase String".istitle())
        self.assertFalse("Not--a Titlecase String".istitle())
        self.assertFalse("NOT".istitle())
        # self.assertRaises(TypeError, "abc".istitle, 42) #

    def test_isspace(self):
        self.assertFalse("".isspace())
        self.assertFalse("a".isspace())
        self.assertTrue(" ".isspace())
        self.assertTrue("\t".isspace())
        self.assertTrue("\r".isspace())
        self.assertTrue("\n".isspace())
        self.assertTrue(" \t\r\n".isspace())
        self.assertFalse(" \t\r\na".isspace())
        # self.assertRaises(TypeError, "abc".isspace, 42) #

    def test_isalpha(self):
        self.assertFalse("".isalpha())
        self.assertTrue("a".isalpha())
        self.assertTrue("A".isalpha())
        self.assertFalse("\n".isalpha())
        self.assertTrue("abc".isalpha())
        self.assertFalse("aBc123".isalpha())
        self.assertFalse("abc\n".isalpha())
        # self.assertRaises(TypeError, "abc".isalpha, 42)

    def test_isalnum(self):
        self.assertFalse("".isalnum())
        self.assertTrue("a".isalnum())
        self.assertTrue("A".isalnum())
        self.assertFalse("\n".isalnum())
        self.assertTrue("123abc456".isalnum())
        self.assertTrue("a1b3c".isalnum())
        self.assertFalse("aBc000 ".isalnum())
        self.assertFalse("abc\n".isalnum())
        # self.assertRaises(TypeError, "abc".isalnum, 42)

    def test_isdigit(self):
        self.assertFalse("".isdigit())
        self.assertFalse("a".isdigit())
        self.assertTrue("0".isdigit())
        self.assertTrue("0123456789".isdigit())
        self.assertFalse("0123456789a".isdigit())
        # self.assertRaises(TypeError, "abc".isdigit, 42)

    def test_lower(self):
        self.assertEqual("hello", "HeLLo".lower())
        self.assertEqual("hello", "hello".lower())
        # self.assertRaises(TypeError, "hello".lower, 42)

    def test_upper(self):
        self.assertEqual("HELLO", "HeLLo".upper())
        self.assertEqual("HELLO", "HELLO".upper())
        # self.assertRaises(TypeError, "hello".upper, 42)

    def test_capitalize(self):
        self.assertEqual(" hello ", " hello ".capitalize())
        self.assertEqual("Hello ", "Hello ".capitalize())
        self.assertEqual("Hello ", "hello ".capitalize())
        self.assertEqual("Aaaa", "aaaa".capitalize())
        self.assertEqual("Aaaa", "AaAa".capitalize())
        # self.assertRaises(TypeError, "hello".capitalize, 42)

    def test_ljust(self):
        self.assertEqual("abc       ", "abc".ljust(10))
        self.assertEqual("abc   ", "abc".ljust(6))
        self.assertEqual("abc", "abc".ljust(3))
        self.assertEqual("abc", "abc".ljust(2))
        self.assertEqual("abc*******", "abc".ljust(10, "*"))
        # self.assertRaises(TypeError, "abc".ljust)

    def test_rjust(self):
        self.assertEqual("       abc", "abc".rjust(10))
        self.assertEqual("   abc", "abc".rjust(6))
        self.assertEqual("abc", "abc".rjust(3))
        self.assertEqual("abc", "abc".rjust(2))
        self.assertEqual("*******abc", "abc".rjust(10, "*"))
        # self.assertRaises(TypeError, "abc".rjust)

    def test_center(self):
        self.assertEqual("   abc    ", "abc".center(10))
        self.assertEqual(" abc  ", "abc".center(6))
        self.assertEqual("abc", "abc".center(3))
        self.assertEqual("abc", "abc".center(2))
        self.assertEqual("***abc****", "abc".center(10, "*"))
        # self.assertRaises(TypeError, "abc".center)

    def test_swapcase(self):
        self.assertEqual("hEllO CoMPuTErS", "HeLLo cOmpUteRs".swapcase())
        # self.assertRaises(TypeError, "hello".swapcase, 42)

    def test_zfill(self):
        self.assertEqual("123", "123".zfill(2))
        self.assertEqual("123", "123".zfill(3))
        self.assertEqual("0123", "123".zfill(4))
        self.assertEqual("+123", "+123".zfill(3))
        self.assertEqual("+123", "+123".zfill(4))
        self.assertEqual("+0123", "+123".zfill(5))
        self.assertEqual("-123", "-123".zfill(3))
        self.assertEqual("-123", "-123".zfill(4))
        self.assertEqual("-0123", "-123".zfill(5))
        self.assertEqual("000", "".zfill(3))
        self.assertEqual("34", "34".zfill(1))
        self.assertEqual("0034", "34".zfill(4))

        # self.assertRaises(TypeError, "123".zfill)

    def test_expandtabs(self):
        self.assertEqual("abc\rab      def\ng       hi", "abc\rab\tdef\ng\thi".expandtabs())
        self.assertEqual("abc\rab      def\ng       hi", "abc\rab\tdef\ng\thi".expandtabs(8))
        self.assertEqual("abc\rab  def\ng   hi", "abc\rab\tdef\ng\thi".expandtabs(4))
        self.assertEqual("abc\r\nab      def\ng       hi", "abc\r\nab\tdef\ng\thi".expandtabs())
        self.assertEqual("abc\r\nab      def\ng       hi", "abc\r\nab\tdef\ng\thi".expandtabs(8))
        self.assertEqual("abc\r\nab  def\ng   hi", "abc\r\nab\tdef\ng\thi".expandtabs(4))
        self.assertEqual("abc\r\nab\r\ndef\ng\r\nhi", "abc\r\nab\r\ndef\ng\r\nhi".expandtabs(4))
        # kwargs only supported in python 3
        # self.assertEqual("abc\rab      def\ng       hi",
        #                  "abc\rab\tdef\ng\thi".expandtabs(tabsize=8))
        # self.assertEqual("abc\rab  def\ng   hi",
        #                  "abc\rab\tdef\ng\thi".expandtabs(tabsize=4))

        self.assertEqual("  a\n b", " \ta\n\tb".expandtabs(1))

        # self.assertRaises(TypeError, "hello".expandtabs, 42, 42)
        # # This test is only valid when sizeof(int) == sizeof(void*) == 4.
        # if sys.maxsize < (1 << 32) and struct.calcsize("P") == 4:
        #     self.assertRaises(OverflowError,
        #                       "\ta\n\tb".expandtabs, sys.maxsize)

    def test_title(self):
        self.assertEqual(" Hello ", " hello ".title())
        self.assertEqual("Hello ", "hello ".title())
        self.assertEqual("Hello ", "Hello ".title())
        self.assertEqual("Format This As Title String",
                         "fOrMaT thIs aS titLe String".title())
        self.assertEqual("Format,This-As*Title;String",
                         "fOrMaT,thIs-aS*titLe;String".title())
        self.assertEqual("Getint", "getInt".title())
        # self.assertRaises(TypeError, "hello".title, 42)

    def test_splitlines(self):
        self.assertEqual(["abc", "def", "", "ghi"],
                         "abc\ndef\n\rghi".splitlines())
        self.assertEqual(["abc", "def", "", "ghi"],
                         "abc\ndef\n\r\nghi".splitlines())
        self.assertEqual(["abc", "def", "ghi"],
                         "abc\ndef\r\nghi".splitlines())
        self.assertEqual(["abc", "def", "ghi"],
                         "abc\ndef\r\nghi\n".splitlines())
        self.assertEqual(["abc", "def", "ghi", ""],
                         "abc\ndef\r\nghi\n\r".splitlines())
        self.assertEqual(["", "abc", "def", "ghi", ""],
                         "\nabc\ndef\r\nghi\n\r".splitlines())
        self.assertEqual(["", "abc", "def", "ghi", ""],
                         "\nabc\ndef\r\nghi\n\r".splitlines(False))
        self.assertEqual(["\n", "abc\n", "def\r\n", "ghi\n", "\r"],
                         "\nabc\ndef\r\nghi\n\r".splitlines(True))
        # self.assertEqual(["", "abc", "def", "ghi", ""],
        #                  "\nabc\ndef\r\nghi\n\r".splitlines(keepends=False))
        # self.assertEqual(["\n", "abc\n", "def\r\n", "ghi\n", "\r"],
        #                  "\nabc\ndef\r\nghi\n\r".splitlines(keepends=True))

        # self.assertRaises(TypeError, "abc".splitlines, 42, 42)

if __name__ == "__main__":
    unittest.main()
