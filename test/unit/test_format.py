import unittest
import sys

verbose = False
have_unicode=False

# Adapted from Python 2.7.x test_format.py

#    testformat(formatstr, *args, **kwargs)


class FormatTest(unittest.TestCase):
    def doboth(self, formatstr, *args, **kwargs):
        if verbose:
            print "Testing ", formatstr, " on ", args[1]
        self.assertEqual(formatstr%args[0], args[1])
        if have_unicode:
            self.assertEqual(unicode(formatstr)%args[0], args[1])

    def test_format(self):
#        self.doboth("%.1d", (1,), "1")
#        self.doboth("%.*d", (sys.maxint,1), overflowok=True)  # expect overflow
        self.doboth("%.100d", (1,), '00000000000000000000000000000000000000'
                 '000000000000000000000000000000000000000000000000000000'
                 '00000001', overflowok=True)
        self.doboth("%#.117x", (1,), '0x00000000000000000000000000000000000'
                 '000000000000000000000000000000000000000000000000000000'
                 '0000000000000000000000000001',
                 overflowok=True)
        self.doboth("%#.118x", (1,), '0x00000000000000000000000000000000000'
                 '000000000000000000000000000000000000000000000000000000'
                 '00000000000000000000000000001',
                 overflowok=True)

#        self.doboth("%f", (1.0,), "1.000000")
        # these are trying to test the limits of the internal magic-number-length
        # formatting buffer, if that number changes then these tests are less
        # effective
#        self.doboth("%#.*g", (109, -1.e+49/3.))
#        self.doboth("%#.*g", (110, -1.e+49/3.))
#        self.doboth("%#.*g", (110, -1.e+100/3.))
#
        # test some ridiculously large precision, expect overflow
#        self.doboth('%12.*f', (123456, 1.0))

        # check for internal overflow validation on length of precision
        # these tests should no longer cause overflow in Python
        # 2.7/3.1 and later.
#        self.doboth("%#.*g", (110, -1.e+100/3.))
#        self.doboth("%#.*G", (110, -1.e+100/3.))
#        self.doboth("%#.*f", (110, -1.e+100/3.))
#        self.doboth("%#.*F", (110, -1.e+100/3.))

        # Formatting of long integers. Overflow is not ok
        self.doboth("%x", 10L, "a")
        self.doboth("%x", 100000000000L, "174876e800")
        self.doboth("%o", 10L, "12")
        self.doboth("%o", 100000000000L, "1351035564000")
        self.doboth("%d", 10L, "10")
        self.doboth("%d", 100000000000L, "100000000000")

        big = 123456789012345678901234567890L
        self.doboth("%d", big, "123456789012345678901234567890")
        self.doboth("%d", -big, "-123456789012345678901234567890")
        self.doboth("%5d", -big, "-123456789012345678901234567890")
        self.doboth("%31d", -big, "-123456789012345678901234567890")
        self.doboth("%32d", -big, " -123456789012345678901234567890")
        self.doboth("%-32d", -big, "-123456789012345678901234567890 ")
        self.doboth("%032d", -big, "-0123456789012345678901234567890")
        self.doboth("%-032d", -big, "-123456789012345678901234567890 ")
        self.doboth("%034d", -big, "-000123456789012345678901234567890")
        self.doboth("%034d", big, "0000123456789012345678901234567890")
        self.doboth("%0+34d", big, "+000123456789012345678901234567890")
        self.doboth("%+34d", big, "   +123456789012345678901234567890")
        self.doboth("%34d", big, "    123456789012345678901234567890")
        self.doboth("%.2d", big, "123456789012345678901234567890")
        self.doboth("%.30d", big, "123456789012345678901234567890")
        self.doboth("%.31d", big, "0123456789012345678901234567890")
        self.doboth("%32.31d", big, " 0123456789012345678901234567890")
#        self.doboth("%d", float(big), "123456________________________", 6)

        big = 0x1234567890abcdef12345L  # 21 hex digits
        self.doboth("%x", big, "1234567890abcdef12345")
        self.doboth("%x", -big, "-1234567890abcdef12345")
        self.doboth("%5x", -big, "-1234567890abcdef12345")
        self.doboth("%22x", -big, "-1234567890abcdef12345")
        self.doboth("%23x", -big, " -1234567890abcdef12345")
        self.doboth("%-23x", -big, "-1234567890abcdef12345 ")
        self.doboth("%023x", -big, "-01234567890abcdef12345")
        self.doboth("%-023x", -big, "-1234567890abcdef12345 ")
        self.doboth("%025x", -big, "-0001234567890abcdef12345")
        self.doboth("%025x", big, "00001234567890abcdef12345")
        self.doboth("%0+25x", big, "+0001234567890abcdef12345")
        self.doboth("%+25x", big, "   +1234567890abcdef12345")
        self.doboth("%25x", big, "    1234567890abcdef12345")
        self.doboth("%.2x", big, "1234567890abcdef12345")
        self.doboth("%.21x", big, "1234567890abcdef12345")
        self.doboth("%.22x", big, "01234567890abcdef12345")
        self.doboth("%23.22x", big, " 01234567890abcdef12345")
        self.doboth("%-23.22x", big, "01234567890abcdef12345 ")
        self.doboth("%X", big, "1234567890ABCDEF12345")
        self.doboth("%#X", big, "0X1234567890ABCDEF12345")
        self.doboth("%#x", big, "0x1234567890abcdef12345")
        self.doboth("%#x", -big, "-0x1234567890abcdef12345")
        self.doboth("%#.23x", -big, "-0x001234567890abcdef12345")
        self.doboth("%#+.23x", big, "+0x001234567890abcdef12345")
        self.doboth("%# .23x", big, " 0x001234567890abcdef12345")
        self.doboth("%#+.23X", big, "+0X001234567890ABCDEF12345")
        self.doboth("%#-+.23X", big, "+0X001234567890ABCDEF12345")
        self.doboth("%#-+26.23X", big, "+0X001234567890ABCDEF12345")
        self.doboth("%#-+27.23X", big, "+0X001234567890ABCDEF12345 ")
        self.doboth("%#+27.23X", big, " +0X001234567890ABCDEF12345")
        # next one gets two leading zeroes from precision, and another from the
        # 0 flag and the width
        self.doboth("%#+027.23X", big, "+0X0001234567890ABCDEF12345")
        # same, except no 0 flag
        self.doboth("%#+27.23X", big, " +0X001234567890ABCDEF12345")
#        self.doboth("%x", float(big), "123456_______________", 6)

        big = 012345670123456701234567012345670L  # 32 octal digits
        self.doboth("%o", big, "12345670123456701234567012345670")
        self.doboth("%o", -big, "-12345670123456701234567012345670")
        self.doboth("%5o", -big, "-12345670123456701234567012345670")
        self.doboth("%33o", -big, "-12345670123456701234567012345670")
        self.doboth("%34o", -big, " -12345670123456701234567012345670")
        self.doboth("%-34o", -big, "-12345670123456701234567012345670 ")
        self.doboth("%034o", -big, "-012345670123456701234567012345670")
        self.doboth("%-034o", -big, "-12345670123456701234567012345670 ")
        self.doboth("%036o", -big, "-00012345670123456701234567012345670")
        self.doboth("%036o", big, "000012345670123456701234567012345670")
        self.doboth("%0+36o", big, "+00012345670123456701234567012345670")
        self.doboth("%+36o", big, "   +12345670123456701234567012345670")
        self.doboth("%36o", big, "    12345670123456701234567012345670")
        self.doboth("%.2o", big, "12345670123456701234567012345670")
        self.doboth("%.32o", big, "12345670123456701234567012345670")
        self.doboth("%.33o", big, "012345670123456701234567012345670")
        self.doboth("%34.33o", big, " 012345670123456701234567012345670")
        self.doboth("%-34.33o", big, "012345670123456701234567012345670 ")
        self.doboth("%o", big, "12345670123456701234567012345670")
        self.doboth("%#o", big, "012345670123456701234567012345670")
        self.doboth("%#o", -big, "-012345670123456701234567012345670")
        self.doboth("%#.34o", -big, "-0012345670123456701234567012345670")
        self.doboth("%#+.34o", big, "+0012345670123456701234567012345670")
        self.doboth("%# .34o", big, " 0012345670123456701234567012345670")
        self.doboth("%#+.34o", big, "+0012345670123456701234567012345670")
        self.doboth("%#-+.34o", big, "+0012345670123456701234567012345670")
        self.doboth("%#-+37.34o", big, "+0012345670123456701234567012345670  ")
        self.doboth("%#+37.34o", big, "  +0012345670123456701234567012345670")
        # next one gets one leading zero from precision
        self.doboth("%.33o", big, "012345670123456701234567012345670")
        # base marker shouldn't change that, since "0" is redundant
        self.doboth("%#.33o", big, "012345670123456701234567012345670")
        # but reduce precision, and base marker should add a zero
        self.doboth("%#.32o", big, "012345670123456701234567012345670")
        # one leading zero from precision, and another from "0" flag & width
        self.doboth("%034.33o", big, "0012345670123456701234567012345670")
        # base marker shouldn't change that
        self.doboth("%0#34.33o", big, "0012345670123456701234567012345670")
#        self.doboth("%o", float(big), "123456__________________________", 6)

        # Some small ints, in both Python int and long flavors).
        self.doboth("%d", 42, "42")
        self.doboth("%d", -42, "-42")
        self.doboth("%d", 42L, "42")
        self.doboth("%d", -42L, "-42")
        self.doboth("%d", 42.0, "42")
        self.doboth("%#x", 1, "0x1")
        self.doboth("%#x", 1L, "0x1")
        self.doboth("%#X", 1, "0X1")
        self.doboth("%#X", 1L, "0X1")
        self.doboth("%#x", 1.0, "0x1")
        self.doboth("%#o", 1, "01")
        self.doboth("%#o", 1L, "01")
        self.doboth("%#o", 0, "0")
        self.doboth("%#o", 0L, "0")
        self.doboth("%o", 0, "0")
        self.doboth("%o", 0L, "0")
        self.doboth("%d", 0, "0")
        self.doboth("%d", 0L, "0")
        self.doboth("%#x", 0, "0x0")
        self.doboth("%#x", 0L, "0x0")
        self.doboth("%#X", 0, "0X0")
        self.doboth("%#X", 0L, "0X0")

        self.doboth("%x", 0x42, "42")
        self.doboth("%x", -0x42, "-42")
        self.doboth("%x", 0x42L, "42")
        self.doboth("%x", -0x42L, "-42")
        self.doboth("%x", float(0x42), "42")

        self.doboth("%o", 042, "42")
        self.doboth("%o", -042, "-42")
        self.doboth("%o", 042L, "42")
        self.doboth("%o", -042L, "-42")
        self.doboth("%o", float(042), "42")
        
        self.doboth("%4s%4s%4s", ("dez", "okt","hex"), " dez okt hex")
        self.doboth("%(thing)s", {'thing': 'abc'}, "abc")
        self.doboth("%(thing)4s", {'thing': 'abc'}, " abc")
        self.doboth("%s", True, "True")
        self.doboth("%s",{'a':1}, "{'a': 1}")
        self.doboth("%s",[], "[]")

        # alternate float formatting
#        testformat('%g', 1.1, '1.1')
#        testformat('%#g', 1.1, '1.10000')




if __name__ == "__main__":
    print "hello"
    unittest.main()
