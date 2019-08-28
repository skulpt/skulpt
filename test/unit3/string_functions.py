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
        b = "   HELlo   ".lower()
        self.assertEqual(b, "   hello   ")

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
        self.assertEqual('12345'.ljust(8),'12345   ')
        self.assertEqual('12345'.ljust(8,'.'),'12345...')
        def helper(str,fillchar):
            return str.ljust(10,fillchar)
        self.assertEqual(helper('a','-'), "a---------")
        self.assertEqual(helper('?','!'),  "?!!!!!!!!!")
        self.assertEqual(helper('-','.'), "-.........")
        self.assertEqual(helper('hello','~'), "hello~~~~~")
        # self.assertRaises(TypeError, "abc".ljust)

    def test_rjust(self):
        self.assertEqual("       abc", "abc".rjust(10))
        self.assertEqual("   abc", "abc".rjust(6))
        self.assertEqual("abc", "abc".rjust(3))
        self.assertEqual("abc", "abc".rjust(2))
        self.assertEqual("*******abc", "abc".rjust(10, "*"))
        self.assertEqual("*******abc", "abc".rjust(10, "*"))
        self.assertEqual('12345'.rjust(8),'   12345')
        self.assertEqual('12345'.rjust(8,'.'),'...12345')
        def helper(str,fillchar):
            return str.rjust(10,fillchar)
        self.assertEqual(helper('a','-'), "---------a")
        self.assertEqual(helper('?','!'), "!!!!!!!!!?")
        self.assertEqual(helper('-','.'), ".........-")
        self.assertEqual(helper('hello','~'), "~~~~~hello")
        # self.assertRaises(TypeError, "abc".rjust)

    def test_center(self):
        self.assertEqual("   abc    ", "abc".center(10))
        self.assertEqual(" abc  ", "abc".center(6))
        self.assertEqual("abc", "abc".center(3))
        self.assertEqual("abc", "abc".center(2))
        self.assertEqual("***abc****", "abc".center(10, "*"))
        self.assertEqual('12345'.center(7),' 12345 ')
        self.assertEqual('12345'.center(8,'.'),'.12345..')
        def helper(str,fillchar):
            return str.center(10,fillchar)
        self.assertEqual(helper('a','-'), "----a-----")
        self.assertEqual(helper('?','!'), "!!!!?!!!!!")
        self.assertEqual(helper('-','.'), "....-.....")
        self.assertEqual(helper('hello','~'), "~~hello~~~")
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

    def test_split(self):
            b = "X-OK-Y".split("-")[1]
            self.assertEqual(b, "OK")
            self.assertEqual("1,2,3".split(",").index("3"), 2)
            c = "hi there".split(" ")
            self.assertEqual(c, ['hi', 'there'])
            fpexp = "( 1 + 1 )"
            fplist = fpexp.split()
            a = []
            for i in fplist:
               a.append(i)
            self.assertEqual(['(', '1', '+', '1', ')'], a)
            x = "foo bar baz".split()
            self.assertEqual(x, ['foo', 'bar', 'baz'])
            self.assertEqual("a bc d e".split(" ",2), ['a', 'bc', 'd e'])
            self.assertEqual("a b c".split(), ['a', 'b', 'c'])
            self.assertRaises(ValueError, "abc".split, "")
            self.assertEqual('hello'.split(None),['hello'])
            def helper(got,expect):
                if got == expect: return True
                else: return False
                self.assertTrue(helper(''.split(),[]))
                self.assertTrue(helper(''.split(None),[]))
                self.assertTrue(helper(''.split(None,1),[]))
                self.assertTrue(helper(''.split('a'),['']))
                self.assertTrue(helper(''.split('a',1),['']))
                self.assertTrue(helper('hello'.split(),['hello']))
                self.assertTrue(helper('hello'.split(None),['hello']))
                self.assertTrue(helper('   hello world      '.split(),['hello', 'world']))
                self.assertTrue(helper('   hello world      '.split(None),['hello', 'world']))
                self.assertTrue(helper('   hello world      '.split(None,1),['hello', 'world      ']))
                self.assertTrue(helper('hello world   ! '.split(),['hello','world','!']))
                self.assertTrue(helper('hello'.split('l'),['he','','o']))
                self.assertTrue(helper('hello'.split('l',1),['he','lo']))
                self.assertTrue(helper('aaaba'.split('a'),['','','','b','']))
                self.assertTrue(helper('aaaba'.split('b'),['aaa','a']))
                self.assertTrue(helper('aaaba'.split('a.'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('.a'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a.',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('.a',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b.'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('.b'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('^a'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('^b'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a$'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b$'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a*'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b*'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab*'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab*',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a+'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b+'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab+'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a?',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab?',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a*?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b*?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab*?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab*?',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a+?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a+?',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b+?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab+?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a??'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b??'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab??'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('ab??',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{2}'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{1,2}'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{1,2}',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{,2}'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{1,}'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{1,}',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b{1}'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b{1,2}'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b{,2}'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b{1,}'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{2}?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{1,2}?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{1,2}?',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{,2}?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{1,}?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a{1,}?',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b{1}?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b{1,2}?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b{,2}?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('b{1,}?'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('[a-z]'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('[a-z]',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('[ab]'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('[ab]',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a|b'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('a|b',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('(a)(a)(b)(a)'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('(a)(a)(b)(a)',1),['aaaba']))
                self.assertTrue(helper('aaaba'.split('(a{2})(.b.)'),['aaaba']))
                self.assertTrue(helper('aaaba'.split('(a{2})(.b.)',1),['aaaba']))

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

    def test_join(self):
        a = "-".join(["O", "K"])
        self.assertEqual("O-K", a)
        b = "".join(["O"]+["K"])
        self.assertEqual(b, "OK")

    def test_replace(self):
        a = "aa..bbb...ccc".replace("..", "X")
        self.assertEqual(a,"aaXbbbX.ccc")
        b = "234".replace("\r\n", "\n")
        self.assertEqual(b, "234")
        c = "abcdefghijklmnopqrstuvwxyz".replace('w','')
        self.assertEqual(c, "abcdefghijklmnopqrstuvxyz")
        d = "abcdefg".replace('abc','xyz')
        self.assertEqual(d, "xyzdefg")
        e = "...abcdefg\\!@#$%^&*()_=+".replace('\\','xyz')
        self.assertEqual(e, "...abcdefgxyz!@#$%^&*()_=+")
        self.assertEqual('hello'.replace('l','L'),'heLLo')
        self.assertEqual('hello'.replace('l','L',1),'heLlo')
        self.assertEqual('hello'.replace('l','L',5),'heLLo')
        self.assertEqual('hello'.replace('l','L',0),'hello')
        self.assertEqual('hello hello hello'.replace('ll','lll'),'helllo helllo helllo')
        self.assertEqual('hello hello hello'.replace('ll','lll',2),'helllo helllo hello')
        self.assertEqual('hello hello hello'.replace('ll','l'),'helo helo helo')
        self.assertEqual('hello hello hello'.replace('ll','l',2),'helo helo hello')
        self.assertEqual('abcabcaaaabc'.replace('abc','123'),'123123aaa123')
        self.assertEqual('abcabcaaaabc'.replace('abc','123',2),'123123aaaabc')
        self.assertEqual('abcabcaaaabc'.replace('abc','123',-1),'123123aaa123')

    def test_strip(self):
        s = "   hello   "
        a = s.strip()
        self.assertEqual(a, "hello")
        self.assertEqual("hello".strip(),'hello')
        self.assertEqual("hello".strip(''),'hello')
        self.assertEqual("  hello  ".strip(),'hello')
        self.assertEqual("  hello  ".strip(''),'  hello  ')
        self.assertEqual("..hello..".strip(),'..hello..')
        self.assertEqual("..hello..".strip('.'),'hello')
        self.assertEqual("abcz".strip('a-z'),'bc')
        self.assertEqual("z alpha z".strip('a-z'),' alpha ')
        self.assertEqual("hello world".strip("^[a-z]*.\s+.*"),'hello world')
        self.assertEqual("[$]hello-^".strip("^[a-z]$"),'hello')

    def test_lstrip(self):
        s = "   hello   "
        b = s.lstrip()
        self.assertEqual(b, "hello   ")
        b1 = "my love is awesome".lstrip('m')
        self.assertEqual(b1, "y love is awesome")
        b2 = "my love is awesome".lstrip("my")
        self.assertEqual(b2, " love is awesome")
        b3 = "my love is awesome".lstrip("not")
        self.assertEqual(b3, "my love is awesome")
        self.assertEqual("hello".lstrip(),'hello')
        self.assertEqual("hello".lstrip(''),'hello')
        self.assertEqual("  hello  ".lstrip(),'hello  ')
        self.assertEqual("  hello  ".lstrip(''),'  hello  ')
        self.assertEqual("..hello..".lstrip(),'..hello..')
        self.assertEqual("..hello..".lstrip('.'),'hello..')
        self.assertEqual("abcz".lstrip('a-z'),'bcz')
        self.assertEqual("z alpha z".lstrip('a-z'),' alpha z')
        self.assertEqual("hello world".lstrip("^[a-z]*.\s+.*"),'hello world')
        self.assertEqual("[$]hello-^".lstrip("^[a-z]$"),'hello-^')

    def test_rstrip(self):
        s = "   hello   "
        c = s.rstrip()
        self.assertEqual(c, "   hello")
        c1 = "we are stripping".rstrip("g")
        self.assertEqual(c1, "we are strippin")
        c2 = "we are not stripping".rstrip("n")
        self.assertEqual(c2, "we are not stripping")
        c3 = "we are stripping".rstrip("ing")
        self.assertEqual(c3, "we are stripp")
        c4 = "stripping whitespace   ".rstrip()
        self.assertEqual(c4, "stripping whitespace")
        self.assertEqual("hello".rstrip(),'hello')
        self.assertEqual("hello".rstrip(''),'hello')
        self.assertEqual("  hello  ".rstrip(),'  hello')
        self.assertEqual("  hello  ".rstrip(''),'  hello  ')
        self.assertEqual("..hello..".rstrip(),'..hello..')
        self.assertEqual("..hello..".rstrip('.'),'..hello')
        self.assertEqual("abcz".rstrip('a-z'),'abc')
        self.assertEqual("z alpha z".rstrip('a-z'),'z alpha ')
        self.assertEqual("hello world".rstrip("^[a-z]*.\s+.*"),'hello world')
        self.assertEqual("[$]hello-^".rstrip("^[a-z]$"),'[$]hello')

    def test_partition(self):
        s = "   hello   "
        a = s.partition("l")
        self.assertEqual(a, ('   he', 'l', 'lo   '))
        b = s.rpartition("l")
        self.assertEqual(b, ('   hel', 'l', 'o   '))
        c = "   hello ".partition("x")
        self.assertEqual(c, ('   hello ', '', ''))
        d = "   hello ".rpartition("x")
        self.assertEqual(d, ('', '', '   hello '))

    def test_count(self):
        self.assertEqual("foo".count('o'), 2)
        self.assertEqual("foo".count(''), 4)
        self.assertEqual("foobar".count("foo"), 1)
        self.assertEqual("foobar".count('xom'), 0)
        self.assertEqual('abcd abcba '.count('abc'),2)
        self.assertEqual('abcd abcba '.count('z'),0)
        self.assertEqual('abcd abcba '.count('abc',1),1)
        self.assertEqual('abcd abcba '.count('abc',-1),0)
        self.assertEqual('abcd abcba '.count('abc',5),1)
        self.assertEqual('abcd abcba '.count('abc',-5),0)
        self.assertEqual('abcd abcba '.count('abc',1,8),1)
        self.assertEqual('abcd abcba '.count('abc',-6,-3),1)
        self.assertEqual('abcd abcba '.count('abc',4,-1),1)
        self.assertEqual('abcd abcba '.count('abc',-6,10),1)
        self.assertEqual('abcd abcda '.count('ad',-6,-3),0)
        self.assertEqual('abcd abcba '.count('a',-6,-6),0)
        self.assertEqual('abcd abcba '.count('a',6,-7),0)
        self.assertEqual('abcd abcba '.count('a',3,1),0)
        self.assertEqual('abcd abcba '.count('a',-100,100),3)
        self.assertEqual('abcd abcba '.count('a',100,-100),0)

    def test_find(self):
        self.assertEqual("foobar".rfind('r'), 5)
        s = "abcdabab"
        self.assertEqual(s.find("ab"), 0)
        self.assertEqual(s.find("ab", 5), 6)
        self.assertEqual(s.find("ac"), -1)
        self.assertEqual(s.find("ac", 5), -1)
        self.assertEqual(s.rfind("cd"), 2)
        self.assertEqual(s.rfind("cd", 5), -1)
        self.assertEqual(s.rfind("ac"), -1)
        self.assertEqual(s.rfind("ac", 5), -1)
        self.assertEqual('hello world'.find('l',-2),9)
        self.assertEqual('hello world'.find('l',4,6),-1)
        self.assertEqual('hello world'.find('o',2,5),4)
        self.assertEqual('hello world'.find('o',2,-5),4)
        self.assertEqual('hello world'.find('o',-8,-5),4)
        self.assertEqual('hello world'.find('o',-3,-1),-1)
        self.assertEqual('hello world'.rfind('h',-2),-1)
        self.assertEqual('hello world'.rfind('l',2,4),3)
        self.assertEqual('hello world'.rfind('l',2,8),3)
        self.assertEqual('hello world'.rfind('l',-1,10),-1)
        self.assertEqual('hello world'.rfind('l',1,-3),3)
        self.assertEqual('hello world'.rfind('l',-9,-2),3)

    def test_index(self):
        s = "abcdabab"
        self.assertEqual(s.index("ab"), 0)
        self.assertEqual(s.index("ab", 5), 6)
        self.assertEqual(s.rindex("ab"), 6)
        self.assertEqual(s.rindex("ab", 5), 6)
        self.assertRaises(ValueError, s.rindex, "ac", 5)
        self.assertEqual('hello world'.index('l',-2),9)
        self.assertEqual('hello world'.index('o',2,5),4)
        self.assertEqual('hello world'.index('o',2,-5),4)
        self.assertEqual('hello world'.index('o',-8,-5),4)
        self.assertEqual('hello world'.rindex('l',-2),9)
        self.assertEqual('hello world'.rindex('l',0,-3),3)
        self.assertEqual('hello world'.rindex('o',2,7),4)
        self.assertEqual('hello world'.rindex('o',2,-2),7)
        self.assertEqual('hello world'.rindex('o',-5,-2),7)

    def test_startswith_endswith(self):
        x = "Please make startswith and endswith work"
        self.assertTrue(x.startswith("Please"))
        self.assertTrue(x.endswith("work"))
        self.assertFalse(x.startswith("please"))
        self.assertFalse(x.endswith("please"))

    def test_isnumeric(self):
        def helper(got,expect):
            if got == expect: return True
            else: return False
        self.assertTrue('123'.isnumeric())
        self.assertFalse('abc123'.isnumeric())
        self.assertFalse('1 2 3'.isnumeric())
        self.assertFalse('123.4'.isnumeric())
        self.assertFalse(''.isnumeric())

if __name__ == "__main__":
    unittest.main()
