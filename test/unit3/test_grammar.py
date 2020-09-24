import unittest

# Note: since several test cases filter out floats by looking for "e" and ".",
# don't add hexadecimal literals that contain "e" or "E".
VALID_UNDERSCORE_LITERALS = [
    '0_0_0',
    '4_2',
    '1_0000_0000',
    '0b1001_0100',
    '0xffff_ffff',
    '0o5_7_7',
    '1_00_00.5',
    '1_00_00.5e5',
    '1_00_00e5_1',
    '1e1_0',
    '.1_4',
    '.1_4e1',
    '0b_0',
    '0x_f',
    '0o_5',
    '1_00_00j',
    '1_00_00.5j',
    '1_00_00e5_1j',
    '.1_4j',
    '(1_2.5+3_3j)',
    '(.5_6j)',
]
INVALID_UNDERSCORE_LITERALS = [
    ## Trailing underscores:
    '0_',
    '42_',
    '1.4j_',
    '0x_',
    '0b1_',
    '0xf_',
    '0o5_',
    '0 if 1_Else 1',
    ## Underscores in the base selector:
    '0_b0',
    '0_xf',
    '0_o5',
    ## Old-style octal
    ## allowed as parameters to `int` and `float`
    ## but still disallowed as literals:
    '0_7',
    '09_99',
    ## Multiple consecutive underscores:
    '4_______2',
    '0.1__4',
    '0.1__4j',
    '0b1001__0100',
    '0xffff__ffff',
    '0x___',
    '0o5__77',
    '1e1__0',
    '1e1__0j',
    ## Underscore right before a dot:
    '1_.4',
    '1_.4j',
    ## Underscore right after a dot:
    '1._4',
    '1._4j',
    '._5',
    '._5j',
    ## Underscore right after a sign:
    '1.0e+_1',
    '1.0e+_1j',
    ## Underscore right before j:
    '1.4_j',
    '1.4e5_j',
    ## Underscore right before e:
    '1_e1',
    '1.4_e1',
    '1.4_e1j',
    ## Underscore right after e:
    '1e_1',
    '1.4e_1',
    '1.4e_1j',
    ## Complex cases with parens:
    '(1+1.5_j_)',
    '(1+1.5_j)',
]

class TokenTests(unittest.TestCase):
    def test_underscore_literals(self):
        self.assertEqual(0_0_0, 0)
        self.assertEqual(4_2, 42)
        self.assertEqual(1_0000_0000, 100000000)
        self.assertEqual(0b1001_0100, 0b10010100)
        self.assertEqual(0xffff_ffff, 0xffffffff)
        self.assertEqual(0o5_7_7, 0o577)
        self.assertEqual(1_00_00.5, 10000.5)
        self.assertEqual(1_00_00.5e5, 10000.5e5)
        self.assertEqual(1_00_00e5_1, 10000e51)
        self.assertEqual(1e1_0, 1e10)
        self.assertEqual(.1_4, .14)
        self.assertEqual(.1_4e1, .14e1)
        self.assertEqual(0b_0, 0b0)
        self.assertEqual(0x_f, 0xf)
        self.assertEqual(0o_5, 0o5)
        self.assertEqual(1_00_00j, 10000j)
        self.assertEqual(1_00_00.5j, 10000.5j)
        self.assertEqual(1_00_00e5_1j, 10000e51j)
        self.assertEqual(.1_4j, .14j)
        self.assertEqual((1_2.5+3_3j), (12.5+33j))
        self.assertEqual((.5_6j), (.56j))

        eval_alt = "Sk.importMainWithBody('test_literals', false, '{0}')"
        for lit in INVALID_UNDERSCORE_LITERALS:
            self.assertRaises(SyntaxError, jseval, eval_alt.format(lit))
        
        # Sanity check: no literal begins with an underscore
        self.assertRaises(NameError, jseval, eval_alt.format("_0"))

if __name__ == '__main__':
    unittest.main()
