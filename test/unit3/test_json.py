import unittest
import json

class PyTest():
    json = json
    loads = staticmethod(json.loads)
    dumps = staticmethod(json.dumps)
    JSONDecodeError = staticmethod(json.JSONDecodeError)



def skulpt_ignore(f):
    return lambda self: None


class TestDecode(PyTest, unittest.TestCase):
    @skulpt_ignore
    def test_decimal(self):
        rval = self.loads('1.1', parse_float=decimal.Decimal)
        self.assertTrue(isinstance(rval, decimal.Decimal))
        self.assertEqual(rval, decimal.Decimal('1.1'))

    def test_float(self):
        rval = self.loads('1', parse_int=float)
        self.assertTrue(isinstance(rval, float))
        self.assertEqual(rval, 1.0)

    def test_empty_objects(self):
        self.assertEqual(self.loads('{}'), {})
        self.assertEqual(self.loads('[]'), [])
        self.assertEqual(self.loads('""'), "")

    def test_object_pairs_hook(self):
        s = '{"xkd":1, "kcw":2, "art":3, "hxm":4, "qrt":5, "pad":6, "hoy":7}'
        p = [("xkd", 1), ("kcw", 2), ("art", 3), ("hxm", 4),
             ("qrt", 5), ("pad", 6), ("hoy", 7)]
        self.assertEqual(self.loads(s), eval(s))
        self.assertEqual(self.loads(s, object_pairs_hook=lambda x: x), p)
        # self.assertEqual(self.json.load(StringIO(s),
        #                                 object_pairs_hook=lambda x: x), p)
        od = self.loads(s, object_pairs_hook=OrderedDict)
        self.assertEqual(od, OrderedDict(p))
        self.assertEqual(type(od), OrderedDict)
        # the object_pairs_hook takes priority over the object_hook
        self.assertEqual(self.loads(s, object_pairs_hook=OrderedDict,
                                    object_hook=lambda x: None),
                         OrderedDict(p))
        # check that empty object literals work (see #17368)
        self.assertEqual(self.loads('{}', object_pairs_hook=OrderedDict),
                         OrderedDict())
        self.assertEqual(self.loads('{"empty": {}}',
                                    object_pairs_hook=OrderedDict),
                         OrderedDict([('empty', OrderedDict())]))

    def test_decoder_optimizations(self):
        # Several optimizations were made that skip over calls to
        # the whitespace regex, so this test is designed to try and
        # exercise the uncommon cases. The array cases are already covered.
        rval = self.loads('{   "key"    :    "value"    ,  "k":"v"    }')
        self.assertEqual(rval, {"key":"value", "k":"v"})

    def check_keys_reuse(self, source, loads):
        rval = loads(source)
        (a, b), (c, d) = sorted(rval[0]), sorted(rval[1])
        self.assertIs(a, c)
        self.assertIs(b, d)

    def test_keys_reuse(self):
        s = '[{"a_key": 1, "b_\xe9": 2}, {"a_key": 3, "b_\xe9": 4}]'
        self.check_keys_reuse(s, self.loads)
        # decoder = self.json.decoder.JSONDecoder()
        # self.check_keys_reuse(s, decoder.decode)
        # self.assertFalse(decoder.memo)

    def test_extra_data(self):
        s = '[1, 2, 3]5'
        msg = 'Extra data'
        with self.assertRaises(self.JSONDecodeError) as e:
            self.loads(s)
        self.assertIn(msg, str(e.exception))

    def test_invalid_escape(self):
        s = '["abc\\y"]'
        msg = 'escaped' # v8 doesn't give the same error (firefox does)
        with self.assertRaises(self.JSONDecodeError) as e:
            self.loads(s)
        # self.assertIn(msg, str(e.exception))

    def test_invalid_input_type(self):
        msg = 'the JSON object must be str'
        for value in [1, 3.14, [], {}, None]:
            with self.assertRaises(TypeError) as e:
                self.loads(value)
            self.assertIn(msg, str(e.exception))

    @skulpt_ignore
    def test_string_with_utf8_bom(self):
        # see #18958
        bom_json = "[1,2,3]".encode('utf-8-sig').decode('utf-8')
        with self.assertRaises(self.JSONDecodeError) as cm:
            self.loads(bom_json)
        self.assertIn('BOM', str(cm.exception))
        with self.assertRaises(self.JSONDecodeError) as cm:
            self.json.load(StringIO(bom_json))
        self.assertIn('BOM', str(cm.exception))
        # make sure that the BOM is not detected in the middle of a string
        bom_in_str = '"{}"'.format(''.encode('utf-8-sig').decode('utf-8'))
        self.assertEqual(self.loads(bom_in_str), '\ufeff')
        self.assertEqual(self.json.load(StringIO(bom_in_str)), '\ufeff')

    @skulpt_ignore
    def test_negative_index(self):
        d = self.json.JSONDecoder()
        self.assertRaises(ValueError, d.raw_decode, 'a'*42, -50000)



class TestDump(PyTest, unittest.TestCase):
    @skulpt_ignore
    def test_dump(self):
        sio = StringIO()
        self.json.dump({}, sio)
        self.assertEqual(sio.getvalue(), '{}')

    def test_dumps(self):
        self.assertEqual(self.dumps({}), '{}')

    def test_dump_skipkeys(self):
        v = {b'invalid_key': False, 'valid_key': True}
        with self.assertRaises(TypeError):
            self.json.dumps(v)

        s = self.json.dumps(v, skipkeys=True)
        o = self.json.loads(s)
        self.assertIn('valid_key', o)
        self.assertNotIn(b'invalid_key', o)

    def test_encode_truefalse(self):
        self.assertEqual(self.dumps(
                 {True: False, False: True}, sort_keys=True),
                 '{"false": true, "true": false}')
        self.assertEqual(self.dumps(
                {2: 3.0, 4.0: 5, False: 1, 6: True}, sort_keys=True),
                '{"false": 1, "2": 3.0, "4.0": 5, "6": true}')

    # Issue 16228: Crash on encoding resized list
    def test_encode_mutated(self):
        a = [object()] * 10
        def crasher(obj):
            del a[-1]
        self.assertEqual(self.dumps(a, default=crasher),
                 '[null, null, null, null, null]')

    # Issue 24094
    def test_encode_evil_dict(self):
        class D(dict):
            def keys(self):
                return L

        class X:
            def __hash__(self):
                del L[0]
                return 1337

            def __lt__(self, o):
                return 0

        L = [X() for i in range(1122)]
        d = D()
        d[1337] = "true.dat"
        self.assertEqual(self.dumps(d, sort_keys=True), '{"1337": "true.dat"}')

class TestDefault(PyTest, unittest.TestCase):
    def test_default(self):
        self.assertEqual(
            self.dumps(type, default=repr),
            self.dumps(repr(type))
        )

from collections import OrderedDict


CASES = [
    ('/\\"\ucafe\ubabe\uab98\ufcde\ubcda\uef4a\x08\x0c\n\r\t`1~!@#$%^&*()_+-=[]{}|;:\',./<>?', '"/\\\\\\"\\ucafe\\ubabe\\uab98\\ufcde\\ubcda\\uef4a\\b\\f\\n\\r\\t`1~!@#$%^&*()_+-=[]{}|;:\',./<>?"'),
    ('\u0123\u4567\u89ab\ucdef\uabcd\uef4a', '"\\u0123\\u4567\\u89ab\\ucdef\\uabcd\\uef4a"'),
    ('controls', '"controls"'),
    ('\x08\x0c\n\r\t', '"\\b\\f\\n\\r\\t"'),
    ('{"object with 1 member":["array with 1 element"]}', '"{\\"object with 1 member\\":[\\"array with 1 element\\"]}"'),
    (' s p a c e d ', '" s p a c e d "'),
    ('\U0001d120', '"\\ud834\\udd20"'),
    ('\u03b1\u03a9', '"\\u03b1\\u03a9"'),
    ("`1~!@#$%^&*()_+-={':[,]}|;.</>?", '"`1~!@#$%^&*()_+-={\':[,]}|;.</>?"'),
    ('\x08\x0c\n\r\t', '"\\b\\f\\n\\r\\t"'),
    ('\u0123\u4567\u89ab\ucdef\uabcd\uef4a', '"\\u0123\\u4567\\u89ab\\ucdef\\uabcd\\uef4a"'),
]

class TestEncodeBasestringAscii(PyTest, unittest.TestCase):
    @skulpt_ignore
    def test_encode_basestring_ascii(self):
        fname = self.json.encoder.encode_basestring_ascii.__name__
        for input_string, expect in CASES:
            result = self.json.encoder.encode_basestring_ascii(input_string)
            self.assertEqual(result, expect,
                '{0!r} != {1!r} for {2}({3!r})'.format(
                    result, expect, fname, input_string))

    def test_ordered_dict(self):
        # See issue 6105
        items = [('one', 1), ('two', 2), ('three', 3), ('four', 4), ('five', 5)]
        s = self.dumps(OrderedDict(items))
        self.assertEqual(s, '{"one": 1, "two": 2, "three": 3, "four": 4, "five": 5}')

    def test_sorted_dict(self):
        items = [('one', 1), ('two', 2), ('three', 3), ('four', 4), ('five', 5)]
        s = self.dumps(dict(items), sort_keys=True)
        self.assertEqual(s, '{"five": 5, "four": 4, "one": 1, "three": 3, "two": 2}')


import math

class TestFloat(PyTest, unittest.TestCase):
    def test_floats(self):
        for num in [1617161771.7650001, math.pi, math.pi**100, math.pi**-35, 3.1]:
            self.assertEqual(float(self.dumps(num)), num)
            self.assertEqual(self.loads(self.dumps(num)), num)

    def test_ints(self):
        for num in [1, 1<<32, 1<<64]:
            self.assertEqual(self.dumps(num), str(num))
            self.assertEqual(int(self.dumps(num)), num)

    def test_out_of_range(self):
        self.assertEqual(self.loads('[23456789012E666]'), [float('inf')])
        self.assertEqual(self.loads('[-23456789012E666]'), [float('-inf')])

    def test_allow_nan(self):
        for val in (float('inf'), float('-inf'), float('nan')):
            out = self.dumps([val])
            if val == val:  # inf
                self.assertEqual(self.loads(out), [val])
            else:  # nan
                res = self.loads(out)
                self.assertEqual(len(res), 1)
                self.assertNotEqual(res[0], res[0])
            self.assertRaises(ValueError, self.dumps, [val], allow_nan=False)

import textwrap

class TestIndent(PyTest, unittest.TestCase):
    def test_indent(self):
        h = [['blorpie'], ['whoops'], [], 'd-shtaeou', 'd-nthiouh', 'i-vhbjkhnth',{'nifty': 87}, {'field': 'yes', 'morefield': False} ]

        expect = textwrap.dedent("""\
        [
        \t[
        \t\t"blorpie"
        \t],
        \t[
        \t\t"whoops"
        \t],
        \t[],
        \t"d-shtaeou",
        \t"d-nthiouh",
        \t"i-vhbjkhnth",
        \t{
        \t\t"nifty": 87
        \t},
        \t{
        \t\t"field": "yes",
        \t\t"morefield": false
        \t}
        ]""")
        # print(expect)

        d1 = self.dumps(h)
        d2 = self.dumps(h, indent=2, sort_keys=True, separators=(',', ': '))
        d3 = self.dumps(h, indent='\t', sort_keys=True, separators=(',', ': '))
        d4 = self.dumps(h, indent=2, sort_keys=True)
        d5 = self.dumps(h, indent='\t', sort_keys=True)

        h1 = self.loads(d1)
        h2 = self.loads(d2)
        h3 = self.loads(d3)

        self.assertEqual(h1, h)
        self.assertEqual(h2, h)
        self.assertEqual(h3, h)
        self.assertEqual(d2, expect.expandtabs(2))
        self.assertEqual(d3, expect)
        self.assertEqual(d4, d2)
        self.assertEqual(d5, d3)

    def test_indent0(self):
        h = {3: 1}
        def check(indent, expected):
            d1 = self.dumps(h, indent=indent)
            self.assertEqual(d1, expected)

            # sio = StringIO()
            # self.json.dump(h, sio, indent=indent)
            # self.assertEqual(sio.getvalue(), expected)

        # indent=0 should emit newlines
        check(0, '{\n"3": 1\n}')
        # indent=None is more compact
        check(None, '{"3": 1}')




class TestSeparators(PyTest, unittest.TestCase):
    def test_separators(self):
        h = [['blorpie'], ['whoops'], [], 'd-shtaeou', 'd-nthiouh', 'i-vhbjkhnth',
             {'nifty': 87}, {'field': 'yes', 'morefield': False} ]

        expect = textwrap.dedent("""\
        [
          [
            "blorpie"
          ] ,
          [
            "whoops"
          ] ,
          [] ,
          "d-shtaeou" ,
          "d-nthiouh" ,
          "i-vhbjkhnth" ,
          {
            "nifty" : 87
          } ,
          {
            "field" : "yes" ,
            "morefield" : false
          }
        ]""")


        d1 = self.dumps(h)
        d2 = self.dumps(h, indent=2, sort_keys=True, separators=(' ,', ' : '))

        h1 = self.loads(d1)
        h2 = self.loads(d2)

        self.assertEqual(h1, h)
        self.assertEqual(h2, h)
        self.assertEqual(d2, expect)

    def test_illegal_separators(self):
        h = {1: 2, 3: 4}
        self.assertRaises(TypeError, self.dumps, h, separators=(b', ', ': '))
        self.assertRaises(TypeError, self.dumps, h, separators=(', ', b': '))
        self.assertRaises(TypeError, self.dumps, h, separators=(b', ', b': '))




# from http://json.org/JSON_checker/test/pass1.json
JSON1 = r'''
[
    "JSON Test Pattern pass1",
    {"object with 1 member":["array with 1 element"]},
    {},
    [],
    -42,
    true,
    false,
    null,
    {
        "integer": 1234567890,
        "real": -9876.543210,
        "e": 0.123456789e-12,
        "E": 1.234567890E+34,
        "":  23456789012E66,
        "zero": 0,
        "one": 1,
        "space": " ",
        "quote": "\"",
        "backslash": "\\",
        "controls": "\b\f\n\r\t",
        "slash": "/ & \/",
        "alpha": "abcdefghijklmnopqrstuvwyz",
        "ALPHA": "ABCDEFGHIJKLMNOPQRSTUVWYZ",
        "digit": "0123456789",
        "0123456789": "digit",
        "special": "`1~!@#$%^&*()_+-={':[,]}|;.</>?",
        "hex": "\u0123\u4567\u89AB\uCDEF\uabcd\uef4A",
        "true": true,
        "false": false,
        "null": null,
        "array":[  ],
        "object":{  },
        "address": "50 St. James Street",
        "url": "http://www.JSON.org/",
        "comment": "// /* <!-- --",
        "# -- --> */": " ",
        " s p a c e d " :[1,2 , 3

,

4 , 5        ,          6           ,7        ],"compact":[1,2,3,4,5,6,7],
        "jsontext": "{\"object with 1 member\":[\"array with 1 element\"]}",
        "quotes": "&#34; \u0022 %22 0x22 034 &#x22;",
        "\/\\\"\uCAFE\uBABE\uAB98\uFCDE\ubcda\uef4A\b\f\n\r\t`1~!@#$%^&*()_+-=[]{}|;:',./<>?"
: "A key can be any string"
    },
    0.5 ,98.6
,
99.44
,

1066,
1e1,
0.1e1,
1e-1,
1e00,2e+00,2e-00
,"rosebud"]
'''

class TestPass1(PyTest, unittest.TestCase):
    def test_parse(self):
        # test in/out equivalence and parsing
        res = self.loads(JSON1)
        out = self.dumps(res)
        self.assertEqual(res, self.loads(out))


# from http://json.org/JSON_checker/test/pass2.json
JSON2 = r'''
[[[[[[[[[[[[[[[[[[["Not too deep"]]]]]]]]]]]]]]]]]]]
'''

class TestPass2(PyTest, unittest.TestCase):
    def test_parse(self):
        # test in/out equivalence and parsing
        res = self.loads(JSON2)
        out = self.dumps(res)
        self.assertEqual(res, self.loads(out))


# from http://json.org/JSON_checker/test/pass3.json
JSON3 = r'''
{
    "JSON Test Pattern pass3": {
        "The outermost value": "must be an object or array.",
        "In this test": "It is an object."
    }
}
'''


class TestPass3(PyTest, unittest.TestCase):
    def test_parse(self):
        # test in/out equivalence and parsing
        res = self.loads(JSON3)
        out = self.dumps(res)
        self.assertEqual(res, self.loads(out))


# 2007-10-05
JSONDOCS = [
    # http://json.org/JSON_checker/test/fail1.json
    '"A JSON payload should be an object or array, not a string."',
    # http://json.org/JSON_checker/test/fail2.json
    '["Unclosed array"',
    # http://json.org/JSON_checker/test/fail3.json
    '{unquoted_key: "keys must be quoted"}',
    # http://json.org/JSON_checker/test/fail4.json
    '["extra comma",]',
    # http://json.org/JSON_checker/test/fail5.json
    '["double extra comma",,]',
    # http://json.org/JSON_checker/test/fail6.json
    '[   , "<-- missing value"]',
    # http://json.org/JSON_checker/test/fail7.json
    '["Comma after the close"],',
    # http://json.org/JSON_checker/test/fail8.json
    '["Extra close"]]',
    # http://json.org/JSON_checker/test/fail9.json
    '{"Extra comma": true,}',
    # http://json.org/JSON_checker/test/fail10.json
    '{"Extra value after close": true} "misplaced quoted value"',
    # http://json.org/JSON_checker/test/fail11.json
    '{"Illegal expression": 1 + 2}',
    # http://json.org/JSON_checker/test/fail12.json
    '{"Illegal invocation": alert()}',
    # http://json.org/JSON_checker/test/fail13.json
    '{"Numbers cannot have leading zeroes": 013}',
    # http://json.org/JSON_checker/test/fail14.json
    '{"Numbers cannot be hex": 0x14}',
    # http://json.org/JSON_checker/test/fail15.json
    '["Illegal backslash escape: \\x15"]',
    # http://json.org/JSON_checker/test/fail16.json
    '[\\naked]',
    # http://json.org/JSON_checker/test/fail17.json
    '["Illegal backslash escape: \\017"]',
    # http://json.org/JSON_checker/test/fail18.json
    '[[[[[[[[[[[[[[[[[[[["Too deep"]]]]]]]]]]]]]]]]]]]]',
    # http://json.org/JSON_checker/test/fail19.json
    '{"Missing colon" null}',
    # http://json.org/JSON_checker/test/fail20.json
    '{"Double colon":: null}',
    # http://json.org/JSON_checker/test/fail21.json
    '{"Comma instead of colon", null}',
    # http://json.org/JSON_checker/test/fail22.json
    '["Colon instead of comma": false]',
    # http://json.org/JSON_checker/test/fail23.json
    '["Bad value", truth]',
    # http://json.org/JSON_checker/test/fail24.json
    "['single quote']",
    # http://json.org/JSON_checker/test/fail25.json
    '["\ttab\tcharacter\tin\tstring\t"]',
    # http://json.org/JSON_checker/test/fail26.json
    '["tab\\   character\\   in\\  string\\  "]',
    # http://json.org/JSON_checker/test/fail27.json
    '["line\nbreak"]',
    # http://json.org/JSON_checker/test/fail28.json
    '["line\\\nbreak"]',
    # http://json.org/JSON_checker/test/fail29.json
    '[0e]',
    # http://json.org/JSON_checker/test/fail30.json
    '[0e+]',
    # http://json.org/JSON_checker/test/fail31.json
    '[0e+-1]',
    # http://json.org/JSON_checker/test/fail32.json
    '{"Comma instead if closing brace": true,',
    # http://json.org/JSON_checker/test/fail33.json
    '["mismatch"}',
    # http://code.google.com/p/simplejson/issues/detail?id=3
    '["A\u001FZ control characters in string"]',
]

SKIPS = {
    1: "why not have a string payload?",
    18: "spec doesn't specify any nesting limitations",
}

class TestFail(PyTest, unittest.TestCase):
    def test_failures(self):
        for idx, doc in enumerate(JSONDOCS):
            idx = idx + 1
            if idx in SKIPS:
                self.loads(doc)
                continue
            try:
                self.loads(doc)
            except self.JSONDecodeError:
                pass
            else:
                self.fail("Expected failure for fail{0}.json: {1!r}".format(idx, doc))

    def test_non_string_keys_dict(self):
        data = {'a' : 1, (1, 2) : 2}
        with self.assertRaises(TypeError) as e:
            self.dumps(data)
        self.assertIn('keys must be str, int, float, bool or None, not tuple', str(e.exception))

    def test_not_serializable(self):
        import sys
        with self.assertRaises(TypeError) as e:
            self.dumps(sys)
        self.assertIn('Object of type module is not JSON serializable', str(e.exception))

    def test_truncated_input(self):
        test_cases = [
            ('', 'Expecting value', 0),
            ('[', 'Expecting value', 1),
            ('[42', "Expecting ',' delimiter", 3),
            ('[42,', 'Expecting value', 4),
            ('["', 'Unterminated string starting at', 1),
            ('["spam', 'Unterminated string starting at', 1),
            ('["spam"', "Expecting ',' delimiter", 7),
            ('["spam",', 'Expecting value', 8),
            ('{', 'Expecting property name enclosed in double quotes', 1),
            ('{"', 'Unterminated string starting at', 1),
            ('{"spam', 'Unterminated string starting at', 1),
            ('{"spam"', "Expecting ':' delimiter", 7),
            ('{"spam":', 'Expecting value', 8),
            ('{"spam":42', "Expecting ',' delimiter", 10),
            ('{"spam":42,', 'Expecting property name enclosed in double quotes', 11),
        ]
        test_cases += [
            ('"', 'Unterminated string starting at', 0),
            ('"spam', 'Unterminated string starting at', 0),
        ]
        for data, msg, idx in test_cases:
            with self.assertRaises(self.JSONDecodeError) as cm:
                self.loads(data)
            err = cm.exception
            self.assertEqual(err.msg, msg)
            self.assertEqual(err.pos, idx)
            self.assertEqual(err.lineno, 1)
            self.assertEqual(err.colno, idx + 1)
            self.assertEqual(str(err),
                             '%s: line 1 column %d (char %d)' %
                             (msg, idx + 1, idx))

    def test_unexpected_data(self):
        test_cases = [
            ('[,', 'Expecting value', 1),
            ('{"spam":[}', 'Expecting value', 9),
            ('[42:', "Expecting ',' delimiter", 3),
            ('[42 "spam"', "Expecting ',' delimiter", 4),
            ('[42,]', 'Expecting value', 4),
            ('{"spam":[42}', "Expecting ',' delimiter", 11),
            ('["]', 'Unterminated string starting at', 1),
            ('["spam":', "Expecting ',' delimiter", 7),
            ('["spam",]', 'Expecting value', 8),
            ('{:', 'Expecting property name enclosed in double quotes', 1),
            ('{,', 'Expecting property name enclosed in double quotes', 1),
            ('{42', 'Expecting property name enclosed in double quotes', 1),
            ('[{]', 'Expecting property name enclosed in double quotes', 2),
            ('{"spam",', "Expecting ':' delimiter", 7),
            ('{"spam"}', "Expecting ':' delimiter", 7),
            ('[{"spam"]', "Expecting ':' delimiter", 8),
            ('{"spam":}', 'Expecting value', 8),
            ('[{"spam":]', 'Expecting value', 9),
            ('{"spam":42 "ham"', "Expecting ',' delimiter", 11),
            ('[{"spam":42]', "Expecting ',' delimiter", 11),
            ('{"spam":42,}', 'Expecting property name enclosed in double quotes', 11),
        ]
        for data, msg, idx in test_cases:
            with self.assertRaises(self.JSONDecodeError) as cm:
                self.loads(data)
            err = cm.exception
            self.assertEqual(err.msg, msg)
            self.assertEqual(err.pos, idx)
            self.assertEqual(err.lineno, 1)
            self.assertEqual(err.colno, idx + 1)
            self.assertEqual(str(err),
                             '%s: line 1 column %d (char %d)' %
                             (msg, idx + 1, idx))

    def test_extra_data(self):
        test_cases = [
            ('[]]', 'Extra data', 2),
            ('{}}', 'Extra data', 2),
            ('[],[]', 'Extra data', 2),
            ('{},{}', 'Extra data', 2),
        ]
        test_cases += [
            ('42,"spam"', 'Extra data', 2),
            ('"spam",42', 'Extra data', 6),
        ]
        for data, msg, idx in test_cases:
            with self.assertRaises(self.JSONDecodeError) as cm:
                self.loads(data)
            err = cm.exception
            self.assertEqual(err.msg, msg)
            self.assertEqual(err.pos, idx)
            self.assertEqual(err.lineno, 1)
            self.assertEqual(err.colno, idx + 1)
            self.assertEqual(str(err),
                             '%s: line 1 column %d (char %d)' %
                             (msg, idx + 1, idx))

    def test_linecol(self):
        test_cases = [
            ('!', 1, 1, 0),
            (' !', 1, 2, 1),
            ('\n!', 2, 1, 1),
            ('\n  \n\n     !', 4, 6, 10),
        ]
        for data, line, col, idx in test_cases:
            with self.assertRaises(self.JSONDecodeError) as cm:
                self.loads(data)
            err = cm.exception
            self.assertEqual(err.msg, 'Expecting value')
            self.assertEqual(err.pos, idx)
            self.assertEqual(err.lineno, line)
            self.assertEqual(err.colno, col)
            self.assertEqual(str(err),
                             'Expecting value: line %s column %d (char %d)' %
                             (line, col, idx))


class JSONTestObject:
    pass


class TestRecursion(PyTest, unittest.TestCase):
    def test_listrecursion(self):
        x = []
        x.append(x)
        try:
            self.dumps(x)
        except ValueError:
            pass
        else:
            self.fail("didn't raise ValueError on list recursion")
        x = []
        y = [x]
        x.append(y)
        try:
            self.dumps(x)
        except ValueError:
            pass
        else:
            self.fail("didn't raise ValueError on alternating list recursion")
        y = []
        x = [y, y]
        # ensure that the marker is cleared
        self.dumps(x)

    def test_dictrecursion(self):
        x = {}
        x["test"] = x
        try:
            self.dumps(x)
        except ValueError:
            pass
        else:
            self.fail("didn't raise ValueError on dict recursion")
        x = {}
        y = {"a": x, "b": x}
        # ensure that the marker is cleared
        self.dumps(x)

    @skulpt_ignore
    def test_defaultrecursion(self):
        class RecursiveJSONEncoder(self.json.JSONEncoder):
            recurse = False
            def default(self, o):
                if o is JSONTestObject:
                    if self.recurse:
                        return [JSONTestObject]
                    else:
                        return 'JSONTestObject'
                return self.json.JSONEncoder.default(o)

        enc = RecursiveJSONEncoder()
        self.assertEqual(enc.encode(JSONTestObject), '"JSONTestObject"')
        enc.recurse = True
        try:
            enc.encode(JSONTestObject)
        except ValueError:
            pass
        else:
            self.fail("didn't raise ValueError on default recursion")


    def test_highly_nested_objects_decoding(self):
        # test that loading highly-nested objects doesn't segfault when C
        # accelerations are used. See #12017
        with self.assertRaises(RecursionError):
            self.loads('{"a":' * 100000 + '1' + '}' * 100000)
        with self.assertRaises(RecursionError):
            self.loads('{"a":' * 100000 + '[1]' + '}' * 100000)
        with self.assertRaises(RecursionError):
            self.loads('[' * 100000 + '1' + ']' * 100000)

    def test_highly_nested_objects_encoding(self):
        # See #12051
        l, d = [], {}
        for x in range(100000):
            l, d = [l], {'k':d}
        with self.assertRaises(RecursionError):
            self.dumps(l)
        with self.assertRaises(RecursionError):
            self.dumps(d)

    @skulpt_ignore
    def test_endless_recursion(self):
        # See #12051
        class EndlessJSONEncoder(self.json.JSONEncoder):
            def default(self, o):
                """If check_circular is False, this will keep adding another list."""
                return [o]

        with self.assertRaises(RecursionError):
            EndlessJSONEncoder(check_circular=False).encode(5j)




if __name__ == "__main__":
    unittest.main()