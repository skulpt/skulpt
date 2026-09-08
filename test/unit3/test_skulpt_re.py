# This file adds some additional tests for the re module outside of Cpython tests
import unittest
import re
import sys
from datetime import datetime


# adapted from arrow
class DateTimeFormatter:
    _FORMAT_RE = re.compile(
        r"(\[(?:(?=(?P<literal>[^]]))(?P=literal))*\]|YYY?Y?|MM?M?M?|Do|DD?D?D?|d?dd?d?|HH?|hh?|mm?|ss?|SS?S?S?S?S?|ZZ?Z?|a|A|X|x|W)"
    )

    def format(cls, dt, fmt) -> str:
        return cls._FORMAT_RE.sub(lambda m: cls._format_token(dt, m.group(0)), fmt)

    def _format_token(self, dt, token):
        if token and token.startswith("[") and token.endswith("]"):
            return token[1:-1]

        # if token == "YYYY":
        #     return self.locale.year_full(dt.year)
        # if token == "YY":
        #     return self.locale.year_abbreviation(dt.year)

        # if token == "MMMM":
        #     return self.locale.month_name(dt.month)
        # if token == "MMM":
        #     return self.locale.month_abbreviation(dt.month)
        if token == "MM":
            return f"{dt.month:02d}"
        if token == "M":
            return f"{dt.month}"

        if token == "DDDD":
            return f"{dt.timetuple().tm_yday:03d}"
        if token == "DDD":
            return f"{dt.timetuple().tm_yday}"
        if token == "DD":
            return f"{dt.day:02d}"
        if token == "D":
            return f"{dt.day}"

        # if token == "Do":
        #     return self.locale.ordinal_number(dt.day)

        # if token == "dddd":
        #     return self.locale.day_name(dt.isoweekday())
        # if token == "ddd":
        #     return self.locale.day_abbreviation(dt.isoweekday())
        if token == "d":
            return f"{dt.isoweekday()}"

        if token == "HH":
            return f"{dt.hour:02d}"
        if token == "H":
            return f"{dt.hour}"
        if token == "hh":
            return f"{dt.hour if 0 < dt.hour < 13 else abs(dt.hour - 12):02d}"
        if token == "h":
            return f"{dt.hour if 0 < dt.hour < 13 else abs(dt.hour - 12)}"

        if token == "mm":
            return f"{dt.minute:02d}"
        if token == "m":
            return f"{dt.minute}"

        if token == "ss":
            return f"{dt.second:02d}"
        if token == "s":
            return f"{dt.second}"

        if token == "SSSSSS":
            return f"{dt.microsecond:06d}"
        if token == "SSSSS":
            return f"{dt.microsecond // 10:05d}"
        if token == "SSSS":
            return f"{dt.microsecond // 100:04d}"
        if token == "SSS":
            return f"{dt.microsecond // 1000:03d}"
        if token == "SS":
            return f"{dt.microsecond // 10000:02d}"
        if token == "S":
            return f"{dt.microsecond // 100000}"

        if token == "X":
            return f"{dt.timestamp()}"

        if token == "x":
            return f"{dt.timestamp() * 1_000_000:.0f}"

        # if token == "ZZZ":
        #     return dt.tzname()

        # if token in ["ZZ", "Z"]:
        #     separator = ":" if token == "ZZ" else ""
        #     tz = dateutil_tz.tzutc() if dt.tzinfo is None else dt.tzinfo
        #     # `dt` must be aware object. Otherwise, this line will raise AttributeError
        #     # https://github.com/arrow-py/arrow/pull/883#discussion_r529866834
        #     # datetime awareness: https://docs.python.org/3/library/datetime.html#aware-and-naive-objects
        #     total_minutes = int(cast(timedelta, tz.utcoffset(dt)).total_seconds() / 60)

        #     sign = "+" if total_minutes >= 0 else "-"
        #     total_minutes = abs(total_minutes)
        #     hour, minute = divmod(total_minutes, 60)

        #     return f"{sign}{hour:02d}{separator}{minute:02d}"

        # if token in ("a", "A"):
        #     return self.locale.meridian(dt.hour, token)

        # if token == "W":
        #     year, week, day = dt.isocalendar()
        #     return f"{year}-W{week:02d}-{day}"


class TestRegexFromArrow(unittest.TestCase):
    def test_cases_from_arrow(self):
        formatter = DateTimeFormatter()
        self.assertEqual(formatter.format(datetime(2015, 12, 10, 17, 9), "MM D, [at] h:mm"), "12 10, at 5:09")
        self.assertEqual(
            formatter.format(
                datetime(1990, 11, 25),
                "[It happened on the month] MM [on the day] D [a long time ago]",
            ),
            "It happened on the month 11 on the day 25 a long time ago",
        )

        # _TZ_Z_RE - no colon separator
        tz_z_re = re.compile(r"([\+\-])(\d{2})(?:(\d{2}))?|Z")
        self.assertEqual(tz_z_re.findall("-0700"), [("-", "07", "00")])
        self.assertEqual(tz_z_re.findall("+07"), [("+", "07", "")])
        self.assertIsNotNone(tz_z_re.search("15/01/2019T04:05:06.789120Z"))
        self.assertIsNone(tz_z_re.search("15/01/2019T04:05:06.789120"))

        # _TZ_ZZ_RE - with colon separator
        tz_zz_re = re.compile(r"([\+\-])(\d{2})(?:\:(\d{2}))?|Z")
        self.assertEqual(tz_zz_re.findall("-07:00"), [("-", "07", "00")])
        self.assertEqual(tz_zz_re.findall("+07"), [("+", "07", "")])
        self.assertIsNotNone(tz_zz_re.search("15/01/2019T04:05:06.789120Z"))
        self.assertIsNone(tz_zz_re.search("15/01/2019T04:05:06.789120"))


        time_re = re.compile(r"^(\d{2})(?:\:?(\d{2}))?(?:\:?(\d{2}))?(?:([\.\,])(\d+))?$")
        time_seperators = [":", ""]

        for sep in time_seperators:
            self.assertEqual(time_re.findall("12"), [("12", "", "", "", "")])
            self.assertEqual(time_re.findall(f"12{sep}35"), [("12", "35", "", "", "")])
            self.assertEqual(time_re.findall("12{sep}35{sep}46".format(sep=sep)), [("12", "35", "46", "", "")])
            self.assertEqual(time_re.findall("12{sep}35{sep}46.952313".format(sep=sep)), [("12", "35", "46", ".", "952313")])
            self.assertEqual(time_re.findall("12{sep}35{sep}46,952313".format(sep=sep)), [("12", "35", "46", ",", "952313")])

        self.assertEqual(time_re.findall("12:"), [])
        self.assertEqual(time_re.findall("12:35:46."), [])
        self.assertEqual(time_re.findall("12:35:46,"), [])

        # shouldn't fail
        re.compile("(?=[\,\.\;\:\?\!\"\'\`\[\]\{\}\(\)\<\>]?(?!\S))")


class TestUnicodeWordBoundaries(unittest.TestCase):
    """
    Tests for Unicode word boundary handling.

    Regression tests for: https://anvil.works/forum/t/regex-is-stripping-out-word-final-and-word-initial-accented-characters-as-though-they-are-non-word/20197

    The issue was that \W incorrectly treated accented characters (ú, ó, ñ, etc.)
    as non-word characters, causing them to be stripped from word boundaries.
    """

    def test_word_class_matches_accented_characters(self):
        # \w should match Unicode word characters including accented letters
        self.assertTrue(re.match(r'\w', 'ú'))
        self.assertTrue(re.match(r'\w', 'ñ'))
        self.assertTrue(re.match(r'\w', 'ó'))
        self.assertTrue(re.match(r'\w', 'à'))
        self.assertTrue(re.match(r'\w', 'é'))
        self.assertTrue(re.match(r'\w', 'ç'))
        self.assertTrue(re.match(r'\w', 'ü'))
        self.assertTrue(re.match(r'\w', 'ø'))

    def test_non_word_class_does_not_match_accented_characters(self):
        # \W should NOT match Unicode word characters
        self.assertIsNone(re.match(r'\W', 'ú'))
        self.assertIsNone(re.match(r'\W', 'ñ'))
        self.assertIsNone(re.match(r'\W', 'ó'))
        self.assertIsNone(re.match(r'\W', 'à'))

    def test_strip_non_word_preserves_accented_characters(self):
        # Stripping non-word characters from boundaries should preserve accented letters
        # This was the original bug: "últimas" became "ltimas"
        self.assertEqual(re.sub(r'^\W+|\W+$', '', 'últimas'), 'últimas')
        self.assertEqual(re.sub(r'^\W+|\W+$', '', 'vivió'), 'vivió')
        self.assertEqual(re.sub(r'^\W+|\W+$', '', 'niño'), 'niño')
        self.assertEqual(re.sub(r'^\W+|\W+$', '', 'café'), 'café')
        self.assertEqual(re.sub(r'^\W+|\W+$', '', 'naïve'), 'naïve')

    def test_strip_non_word_still_removes_punctuation(self):
        # Should still strip actual non-word characters
        self.assertEqual(re.sub(r'^\W+|\W+$', '', '...hello...'), 'hello')
        self.assertEqual(re.sub(r'^\W+|\W+$', '', '¡hola!'), 'hola')
        self.assertEqual(re.sub(r'^\W+|\W+$', '', '"quoted"'), 'quoted')

    def test_findall_word_characters_with_accents(self):
        # \w+ should capture full words including accented characters
        self.assertEqual(re.findall(r'\b\w+\b', 'café latte'), ['café', 'latte'])
        self.assertEqual(re.findall(r'\b\w+\b', 'niño pequeño'), ['niño', 'pequeño'])
        self.assertEqual(re.findall(r'\b\w+\b', 'últimas palabras'), ['últimas', 'palabras'])


class TestParserRegressions(unittest.TestCase):
    def test_scoped_flags_are_explicitly_unsupported(self):
        if "Skulpt" not in sys.version:
            self.skipTest("Skulpt-specific unsupported feature")
        for pattern in [r'(?i:a)', r'(?-i:a)', r'(?s:.)', r'(?a:\w)', r'(?x: a)']:
            with self.assertRaises(re.error) as cm:
                re.compile(pattern)
            self.assertIn('scoped flags are not supported', str(cm.exception))

    def test_inline_flags_respect_pattern_syntax(self):
        # Flag-looking text in a character class or after an escaped '(' is literal.
        self.assertIsNone(re.match(r'[(?i)]a', 'iA'))
        self.assertTrue(re.fullmatch(r'\(?i\)', 'i)'))
        self.assertFalse(re.compile(r'[(?i)]').flags & re.I)
        self.assertTrue(re.compile(r'a(?i)').flags & re.I)  # Python 3.7 permits this.
        self.assertTrue(re.fullmatch(r'a(?i)', 'A'))
        self.assertTrue(re.fullmatch(r'a(?i)*', 'AAA'))
        self.assertTrue(re.fullmatch(r'a(?#comment)*', 'aaa'))
        with self.assertRaises(re.error):
            re.compile(r'(?i)*')
        with self.assertRaises(re.error):
            re.compile(r'(?x)a* ?')
        self.assertTrue(re.fullmatch('a # (?i)\nb', 'ab', re.X))
        self.assertIsNone(re.fullmatch('a # (?i)\nb', 'AB', re.X))

    def test_tokenizer_preserves_escaped_delimiters(self):
        self.assertTrue(re.fullmatch(r'(?#comment\)continues)a', 'a'))
        self.assertTrue(re.fullmatch(r'[]-a]', '^'))
        self.assertIsNone(re.fullmatch(r'[]-a]', '-'))
        # The decoded digit must not become part of the backreference.
        self.assertTrue(re.fullmatch(r'(a)\1\x32', 'aa2'))

    def test_lookbehind_requires_fixed_width(self):
        for pattern in [r'(?<=a+)b', r'(?<=a|bc)d', r'(a+)(?<=\1)b']:
            with self.assertRaises(re.error):
                re.compile(pattern)
        self.assertTrue(re.search(r'(?<=ab|cd)e', 'abe'))
        self.assertTrue(re.search(r'(ab)(?<=\1)c', 'abc'))
        self.assertTrue(re.search(r'(?<=a{0})b', 'b'))

    def test_error_positions_count_codepoints(self):
        with self.assertRaises(re.error) as cm:
            re.compile('😀[')
        err = cm.exception
        self.assertEqual(err.pattern, '😀[')
        self.assertEqual(err.msg, 'unterminated character set')
        self.assertEqual((err.pos, err.lineno, err.colno), (1, 1, 2))
        err = re.error('problem', '[', 0)
        self.assertEqual(err.pos, 0)
        self.assertEqual(err.args, ('problem at position 0',))
        self.assertIsNone(re.error('problem').lineno)

    def test_escaped_range_endpoints(self):
        for pattern in [r'[\x5d-\x61]', r'[\x5c-\x61]', r'[\x5e-\x61]']:
            self.assertTrue(re.fullmatch(pattern, '^'))
            self.assertTrue(re.fullmatch(pattern, 'a'))
            self.assertIsNone(re.fullmatch(pattern, 'b'))

    def test_incomplete_quantifiers_are_literals(self):
        for pattern in ['{', '{1', '{1,2', 'a{}', 'a{1,', 'a{,2']:
            self.assertTrue(re.fullmatch(pattern, pattern))

    def test_unicode_categories_and_complements(self):
        cases = [
            ('w', '²', True), ('w', '\u2163', True), ('w', '\u203f', False),
            ('w', 'é', True), ('w', '_', True), ('d', '²', False),
            ('d', '\u0660', True), ('s', '\u2028', True), ('s', '\u2029', True),
            ('s', '\x1c', True), ('s', '\ufeff', False),
        ]
        for category, char, expected in cases:
            for pattern in ['\\' + category, '[\\' + category + ']']:
                self.assertEqual(bool(re.fullmatch(pattern, char)), expected)
            for pattern in ['\\' + category.upper(), '[\\' + category.upper() + ']']:
                self.assertEqual(bool(re.fullmatch(pattern, char)), not expected)
            self.assertEqual(bool(re.fullmatch('[^\\' + category.upper() + ']', char)), expected)
        self.assertTrue(re.fullmatch(r'[\W_]+', '!?_'))
        self.assertIsNone(re.fullmatch(r'[\W_]+', 'é'))
        self.assertTrue(re.fullmatch(r'[^\W_]+', 'é'))
        self.assertIsNone(re.fullmatch(r'[^\W_]+', '_'))
        self.assertIsNone(re.fullmatch(r'\s', '\u00a0', re.A))
        self.assertTrue(re.fullmatch(r'\s', ' ', re.A))

    def test_replacement_punctuation_keeps_backslash(self):
        for replacement in [r'\&', r'\!', r'\_', r'\é']:
            self.assertEqual(re.sub('a', replacement, 'a'), replacement)


if __name__ == "__main__":
    unittest.main()
