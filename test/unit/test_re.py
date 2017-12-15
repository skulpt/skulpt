import re
import string
import unittest

# Set to true to run implementation targets
include_failing = False

# Tests adapted from https://github.com/python/cpython/blob/master/Lib/test/test_re.py

class S(str):
    def __getitem__(self, index):
        return S(super().__getitem__(index))

class ReTests(unittest.TestCase):

    def assertTypedEqual(self, actual, expect, msg=None):
        self.assertEqual(actual, expect, msg)
        def recurse(actual, expect):
            if isinstance(expect, (tuple, list)):
                for x, y in zip(actual, expect):
                    recurse(x, y)
            else:
                self.assertIs(type(actual), type(expect), msg)
        recurse(actual, expect)

    def checkPatternError(self, pattern, errmsg, pos=None):
        if include_failing:
            # Skulpt doesn't currently implement re.error correctly
            with self.assertRaises(re.error) as cm:
                re.compile(pattern)
            with self.subTest(pattern=pattern):
                err = cm.exception
                self.assertEqual(err.msg, errmsg)
                if pos is not None:
                    self.assertEqual(err.pos, pos)

    def test_search_star_plus(self):
        # Skulpt doesn't support .span
        if include_failing:
            self.assertEqual(re.search('x*', 'axx').span(0), (0, 0))
            self.assertEqual(re.search('x*', 'axx').span(), (0, 0))
            self.assertEqual(re.search('x+', 'axx').span(0), (1, 3))
            self.assertEqual(re.search('x+', 'axx').span(), (1, 3))
            self.assertIsNone(re.search('x', 'aaa'))
            self.assertEqual(re.match('a*', 'xxx').span(0), (0, 0))
            self.assertEqual(re.match('a*', 'xxx').span(), (0, 0))
            self.assertEqual(re.match('x*', 'xxxa').span(0), (0, 3))
            self.assertEqual(re.match('x*', 'xxxa').span(), (0, 3))
        self.assertIsNone(re.match('a+', 'xxx'))

    def bump_num(self, matchobj):
        int_value = int(matchobj.group(0))
        return str(int_value + 1)

    def test_keyword_parameters(self):
        # Issue #20283: Accepting the string keyword parameter.
        pat = re.compile(r'(ab)')
        if include_failing:
            # Skulpt doesn't support span
            self.assertEqual(
                pat.match(string='abracadabra', pos=7, endpos=10).span(), (7, 9))
            self.assertEqual(
                pat.search(string='abracadabra', pos=3, endpos=10).span(), (7, 9))
        self.assertEqual(
            pat.findall(string='abracadabra', pos=3, endpos=10), ['ab'])
        self.assertEqual(
            pat.split(string='abracadabra', maxsplit=1),
            ['', 'ab', 'racadabra'])

        pat = re.compile(r'(ab)')
        self.assertEqual(pat.search(string='abracadabra', pos=0, endpos=11).group(), 'ab')
        self.assertEqual(pat.findall(string='abracadabra', pos=0, endpos=4), ['ab'])
        self.assertEqual(pat.split(string='abracadabra', maxsplit=1), ['', 'ab', 'racadabra'] )
        self.assertEqual(pat.match(string='abracadabra', pos=0, endpos=11).group(), 'ab')

        r = re.compile('|'.join(('%d'%x for x in range(10000))))
        self.assertTrue(r.match(string='1000', pos=0, endpos=4))
        self.assertTrue(r.match(string='9999', pos=0, endpos=4))

    def test_findall_named_args(self):
        self.assertEqual(re.findall(pattern=":+", string="abc", flags=0), [])
        strings = ["a:b::c:::d"]
        if include_failing:
            strings.append(S("a:b::c:::d"))
        for string in strings:
            self.assertTypedEqual(re.findall(pattern=":+", string=string, flags=0),
                                  [":", "::", ":::"])
            self.assertTypedEqual(re.findall(pattern="(:+)", string=string, flags=0),
                                  [":", "::", ":::"])
            self.assertTypedEqual(re.findall(pattern="(:)(:*)", string=string, flags=0),
                                  [(":", ""), (":", ":"), (":", "::")])

    def test_split_named_args(self):
        for string in [":a:b::c"]:
            # Named positional args should work
            self.assertTypedEqual(re.split(pattern=":", string=string,
                                  maxsplit=0, flags=0), ['', 'a', 'b', '', 'c'])
            self.assertTypedEqual(re.split(pattern=":+", string=string,
                                  maxsplit=0, flags=0), ['', 'a', 'b', 'c'])
            self.assertTypedEqual(re.split("(:+)", string,
                                  maxsplit=0, flags=0), ['', ':', 'a', ':', 'b', '::', 'c'])

    def test_re_split(self):
        for string in [":a:b::c"]:
            self.assertTypedEqual(re.split(":", string),
                                  ['', 'a', 'b', '', 'c'])
            self.assertTypedEqual(re.split(":+", string),
                                  ['', 'a', 'b', 'c'])
            self.assertTypedEqual(re.split("(:+)", string),
                                  ['', ':', 'a', ':', 'b', '::', 'c'])

        if include_failing:
            # Something in the logic for handline captured groups breaks these
            # in Skulpt.
            self.assertEqual(re.split("(?::+)", ":a:b::c"), ['', 'a', 'b', 'c'])
            self.assertEqual(re.split("(:)+", ":a:b::c"),
                             ['', ':', 'a', ':', 'b', ':', 'c'])
        self.assertEqual(re.split("([b:]+)", ":a:b::c"),
                         ['', ':', 'a', ':b::', 'c'])
        if include_failing:
            # Something in the logic for handling captured groups breaks these
            # in Skulpt.
            self.assertEqual(re.split("(b)|(:+)", ":a:b::c"),
                             ['', None, ':', 'a', None, ':', '', 'b', None, '',
                              None, '::', 'c'])
            self.assertEqual(re.split("(?:b)|(?::+)", ":a:b::c"),
                             ['', 'a', '', '', 'c'])

    def test_qualified_re_split(self):
        self.assertEqual(re.split(":", ":a:b::c", 2), ['', 'a', 'b::c'])
        self.assertEqual(re.split(":", ":a:b::c", maxsplit=2), ['', 'a', 'b::c'])
        self.assertEqual(re.split(':', 'a:b:c:d', maxsplit=2), ['a', 'b', 'c:d'])
        self.assertEqual(re.split("(:)", ":a:b::c", maxsplit=2),
                         ['', ':', 'a', ':', 'b::c'])
        self.assertEqual(re.split("(:+)", ":a:b::c", maxsplit=2),
                         ['', ':', 'a', ':', 'b::c'])
        # with self.assertWarns(FutureWarning):
        #     self.assertEqual(re.split("(:*)", ":a:b::c", maxsplit=2),
        #                     ['', ':', 'a', ':', 'b::c'])

    def test_re_findall(self):
        self.assertEqual(re.findall(":+", "abc"), [])
        strings = ["a:b::c:::d"]
        if include_failing:
            strings.append(S("a:b::c:::d"))
        for string in strings:
            self.assertTypedEqual(re.findall(":+", string),
                                  [":", "::", ":::"])
            self.assertTypedEqual(re.findall("(:+)", string),
                                  [":", "::", ":::"])
            self.assertTypedEqual(re.findall("(:)(:*)", string),
                                  [(":", ""), (":", ":"), (":", "::")])

    def test_bug_117612(self):
        self.assertEqual(re.findall(r"(a|(b))", "aba"),
                         [("a", ""),("b", "b"),("a", "")])

    def test_re_match(self):
        strings = ['a']
        if include_failing:
            strings.append(S('a'))
        for string in strings:
            self.assertEqual(re.match('a', string).groups(), ())
            self.assertEqual(re.match('(a)', string).groups(), ('a',))
            self.assertEqual(re.match('(a)', string).group(0), 'a')
            self.assertEqual(re.match('(a)', string).group(1), 'a')
            # Subgroup args not supported in Skulpt
            if include_failing:
                self.assertEqual(re.match('(a)', string).group(1, 1), ('a', 'a'))

        if include_failing:
            # Skulpt currently doesn't return None when it should or support the
            # default argument to groups
            pat = re.compile('((a)|(b))(c)?')
            self.assertEqual(pat.match('a').groups(), ('a', 'a', None, None))
            self.assertEqual(pat.match('b').groups(), ('b', None, 'b', None))
            self.assertEqual(pat.match('ac').groups(), ('a', 'a', None, 'c'))
            self.assertEqual(pat.match('bc').groups(), ('b', None, 'b', 'c'))
            self.assertEqual(pat.match('bc').groups(""), ('b', "", 'b', 'c'))

    def test_group(self):
        # A single group
        m = re.match('(a)(b)', 'ab')
        self.assertEqual(m.group(), 'ab')
        self.assertEqual(m.group(0), 'ab')
        self.assertEqual(m.group(1), 'a')

        # Multiple groups not supported in Skulpt
        if include_failing:
            self.assertEqual(m.group(2, 1), ('b', 'a'))

    def test_repeat_minmax(self):
        self.assertIsNone(re.match(r"^(\w){1}$", "abc"))
        self.assertIsNone(re.match(r"^(\w){1}?$", "abc"))
        self.assertIsNone(re.match(r"^(\w){1,2}$", "abc"))
        self.assertIsNone(re.match(r"^(\w){1,2}?$", "abc"))

        self.assertEqual(re.match(r"^(\w){3}$", "abc").group(1), "c")
        self.assertEqual(re.match(r"^(\w){1,3}$", "abc").group(1), "c")
        self.assertEqual(re.match(r"^(\w){1,4}$", "abc").group(1), "c")
        self.assertEqual(re.match(r"^(\w){3,4}?$", "abc").group(1), "c")
        self.assertEqual(re.match(r"^(\w){3}?$", "abc").group(1), "c")
        self.assertEqual(re.match(r"^(\w){1,3}?$", "abc").group(1), "c")
        self.assertEqual(re.match(r"^(\w){1,4}?$", "abc").group(1), "c")
        self.assertEqual(re.match(r"^(\w){3,4}?$", "abc").group(1), "c")

        self.assertIsNone(re.match(r"^x{1}$", "xxx"))
        self.assertIsNone(re.match(r"^x{1}?$", "xxx"))
        self.assertIsNone(re.match(r"^x{1,2}$", "xxx"))
        self.assertIsNone(re.match(r"^x{1,2}?$", "xxx"))

        self.assertTrue(re.match(r"^x{3}$", "xxx"))
        self.assertTrue(re.match(r"^x{1,3}$", "xxx"))
        self.assertTrue(re.match(r"^x{3,3}$", "xxx"))
        self.assertTrue(re.match(r"^x{1,4}$", "xxx"))
        self.assertTrue(re.match(r"^x{3,4}?$", "xxx"))
        self.assertTrue(re.match(r"^x{3}?$", "xxx"))
        self.assertTrue(re.match(r"^x{1,3}?$", "xxx"))
        self.assertTrue(re.match(r"^x{1,4}?$", "xxx"))
        self.assertTrue(re.match(r"^x{3,4}?$", "xxx"))

        self.assertIsNone(re.match(r"^x{}$", "xxx"))
        self.assertTrue(re.match(r"^x{}$", "x{}"))

        self.checkPatternError(r'x{2,1}',
                               'min repeat greater than max repeat', 2)

    def test_special_escapes(self):
        self.assertEqual(re.search(r"\b(b.)\b",
                                   "abcd abc bcd bx").group(1), "bx")
        self.assertEqual(re.search(r"\B(b.)\B",
                                   "abc bcd bc abxd").group(1), "bx")

    def test_other_escapes(self):
        self.checkPatternError("\\", 'bad escape (end of pattern)', 0)
        self.assertEqual(re.match(r"\(", '(').group(), '(')
        self.assertIsNone(re.match(r"\(", ')'))
        self.assertEqual(re.match(r"\\", '\\').group(), '\\')
        self.assertEqual(re.match(r"[\]]", ']').group(), ']')
        self.assertIsNone(re.match(r"[\]]", '['))
        self.assertEqual(re.match(r"[a\-c]", '-').group(), '-')
        self.assertIsNone(re.match(r"[a\-c]", 'b'))
        self.assertEqual(re.match(r"[\^a]+", 'a^').group(), 'a^')
        self.assertIsNone(re.match(r"[\^a]+", 'b'))

    def test_string_boundaries(self):
        # See http://bugs.python.org/issue10713
        self.assertEqual(re.search(r"\b(abc)\b", "abc").group(1),
                         "abc")
        # There's a word boundary at the start of a string.
        self.assertTrue(re.match(r"\b", "abc"))
        if include_failing:
            # A non-empty string includes a non-boundary zero-length match.
            #  Not implemented in Skulpt
            self.assertTrue(re.search(r"\B", "abc"))
        # There is no non-boundary match at the start of a string.
        self.assertFalse(re.match(r"\B", "abc"))
        # However, an empty string contains no word boundaries, and also no
        # non-boundaries.
        if include_failing:
            # Skulpt currently doesn't return None here
            self.assertIsNone(re.search(r"\B", ""))
            # This one is questionable and different from the perlre behaviour,
            # but describes current behavior.
            self.assertIsNone(re.search(r"\b", ""))
        # A single word-character string has two boundaries, but no
        # non-boundary gaps.
        self.assertEqual(len(re.findall(r"\b", "a")), 2)
        self.assertEqual(len(re.findall(r"\B", "a")), 0)
        # If there are no words, there are no boundaries
        self.assertEqual(len(re.findall(r"\b", " ")), 0)
        self.assertEqual(len(re.findall(r"\b", "   ")), 0)
        # Can match around the whitespace.
        self.assertEqual(len(re.findall(r"\B", " ")), 2)

    def test_big_codesize(self):
        if include_failing:
            # Skulpt doesn't seem to handle large regexes
            # Issue #1160
            r = re.compile('|'.join(('%d'%x for x in range(10000))))
            self.assertTrue(r.match('1000'))
            self.assertTrue(r.match('9999'))

    def test_lookahead(self):
        self.assertEqual(re.match(r"(a(?=\s[^a]))", "a b").group(1), "a")
        self.assertEqual(re.match(r"(a(?=\s[^a]*))", "a b").group(1), "a")
        self.assertEqual(re.match(r"(a(?=\s[abc]))", "a b").group(1), "a")
        self.assertEqual(re.match(r"(a(?=\s[abc]*))", "a bc").group(1), "a")
        self.assertEqual(re.match(r"(a)(?=\s\1)", "a a").group(1), "a")
        self.assertEqual(re.match(r"(a)(?=\s\1*)", "a aa").group(1), "a")
        self.assertEqual(re.match(r"(a)(?=\s(abc|a))", "a a").group(1), "a")

        self.assertEqual(re.match(r"(a(?!\s[^a]))", "a a").group(1), "a")
        self.assertEqual(re.match(r"(a(?!\s[abc]))", "a d").group(1), "a")
        self.assertEqual(re.match(r"(a)(?!\s\1)", "a b").group(1), "a")
        self.assertEqual(re.match(r"(a)(?!\s(abc|a))", "a b").group(1), "a")

        # Group reference.
        self.assertTrue(re.match(r'(a)b(?=\1)a', 'aba'))
        self.assertIsNone(re.match(r'(a)b(?=\1)c', 'abac'))
        # # Conditional group reference.
        if include_failing:
            self.assertTrue(re.match(r'(?:(a)|(x))b(?=(?(2)x|c))c', 'abc'))
            self.assertIsNone(re.match(r'(?:(a)|(x))b(?=(?(2)c|x))c', 'abc'))
            self.assertTrue(re.match(r'(?:(a)|(x))b(?=(?(2)x|c))c', 'abc'))
            self.assertIsNone(re.match(r'(?:(a)|(x))b(?=(?(1)b|x))c', 'abc'))
            self.assertTrue(re.match(r'(?:(a)|(x))b(?=(?(1)c|x))c', 'abc'))
        # # Group used before defined.
        if include_failing:
            self.assertTrue(re.match(r'(a)b(?=(?(2)x|c))(c)', 'abc'))
            self.assertIsNone(re.match(r'(a)b(?=(?(2)b|x))(c)', 'abc'))
            self.assertTrue(re.match(r'(a)b(?=(?(1)c|x))(c)', 'abc'))

    def test_category(self):
        self.assertEqual(re.match(r"(\s)", " ").group(1), " ")

    def test_flags(self):
        flags = [re.I, re.M]
        # Some flags not supported in Skulpt
        if include_failing:
            flags += [re.X, re.S, re.A, re.U]
        for flag in flags:
            self.assertTrue(re.compile('^pattern$', flag))

    def test_character_set_errors(self):
        self.checkPatternError(r'[', 'unterminated character set', 0)
        self.checkPatternError(r'[^', 'unterminated character set', 0)
        self.checkPatternError(r'[a', 'unterminated character set', 0)
        # bug 545855 -- This pattern failed to cause a compile error as it
        # should, instead provoking a TypeError.
        self.checkPatternError(r"[a-", 'unterminated character set', 0)
        self.checkPatternError(r"[\w-b]", r'bad character range \w-b', 1)
        self.checkPatternError(r"[a-\w]", r'bad character range a-\w', 1)
        self.checkPatternError(r"[b-a]", 'bad character range b-a', 1)

    def test_search_dot_unicode(self):
        self.assertTrue(re.search("123.*-", '123abc-'))
        self.assertTrue(re.search("123.*-", '123\xe9-'))
        self.assertTrue(re.search("123.*-", '123\u20ac-'))
        self.assertTrue(re.search("123.*-", '123\U0010ffff-'))
        self.assertTrue(re.search("123.*-", '123\xe9\u20ac\U0010ffff-'))

    def test_pattern_compare(self):
        pattern1 = re.compile('abc', re.IGNORECASE)

        # equal to itself
        self.assertEqual(pattern1, pattern1)
        self.assertFalse(pattern1 != pattern1)

        # equal
        re.purge()
        pattern2 = re.compile('abc', re.IGNORECASE)
        # self.assertEqual(hash(pattern2), hash(pattern1))
        if include_failing:
            # RegexObect comparison not working in skulpt
            self.assertEqual(pattern2, pattern1)

        # not equal: different pattern
        re.purge()
        pattern3 = re.compile('XYZ', re.IGNORECASE)
        # Don't test hash(pattern3) != hash(pattern1) because there is no
        # warranty that hash values are different
        self.assertNotEqual(pattern3, pattern1)

        # not equal: different flag (flags=0)
        re.purge()
        pattern4 = re.compile('abc')
        # Skulpt note: this is passing but for the wrong reasons
        self.assertNotEqual(pattern4, pattern1)


class PatternReprTests(unittest.TestCase):
    def check(self, pattern, expected):
        self.assertEqual(repr(re.compile(pattern)), expected)

    def check_flags(self, pattern, flags, expected):
        self.assertEqual(repr(re.compile(pattern, flags)), expected)

    def test_inline_flags(self):
        # TODO: include flags, if any, in non-binary
        if include_failing:
            self.check('(?i)pattern',
                       "re.compile('(?i)pattern', re.IGNORECASE)")

if __name__ == "__main__":
    unittest.main()