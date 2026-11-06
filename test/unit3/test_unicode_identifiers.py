# Selected CPython Unicode identifier and string-classification cases.
import sys
import unittest


native_unicode = "Skulpt" not in sys.version or jseval(r"""
    (() => {
        try { new RegExp("\\p{XID_Start}", "u"); return true; }
        catch { return false; }
    })()
""")


class NativeUnicodeTests(unittest.TestCase):
    def test_identifiers(self):
        # Skulpt regressions: test XID properties before NFKC normalisation.
        self.assertTrue("\U00010400".isidentifier())
        self.assertTrue("x\U000E0100".isidentifier())
        self.assertFalse("\u2f00".isidentifier())
        self.assertFalse("a\n".isidentifier())

    def test_astral_identifiers_compile(self):
        # Strings allow browsers using the BMP fallback to parse and skip this test.
        names = {}
        exec("𐐀 = 5\nx󠄀 = 6\nresult = 𐐀 + x󠄀", names)
        self.assertEqual(names["result"], 11)

    def test_astral_classification(self):
        # Cases from CPython's string tests, previously disabled in Skulpt.
        self.assertFalse('\U000E0020'.isprintable())
        for char in ['\U0001D7F6', '\U00011066', '\U000104A0']:
            self.assertTrue(char.isdecimal(), '{!a} is decimal.'.format(char))


if __name__ == "__main__" and native_unicode:
    unittest.main()
