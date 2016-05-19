# Tests StringIO and cStringIO

import unittest
import StringIO
#import cStringIO
#import types
#import array
import sys
#from test import test_support

class TestGenericStringIO(unittest.TestCase):
    # use a class variable MODULE to define which module is being tested

    # Line of data to test as string
    _line = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!'
    _lines = str((_line + '\n') * 5)

    def setUp(self):
        self._fp = StringIO.StringIO(self._lines)

    def test_input(self):
        #with prompt
        teststdout = StringIO.StringIO();
        sys.stdin = StringIO.StringIO("test input")
        sys.stdout = teststdout
        res = raw_input("test prompt")
        sys.stdout = sys.__stdout__
        self.assertEqual(res, "test input")
        self.assertEqual(teststdout.getvalue(), "test prompt")

        #without prompt
        sys.stdin = StringIO.StringIO("test input")
        teststdout = StringIO.StringIO();
        sys.stdout = teststdout
        res = raw_input()
        sys.stdout = sys.__stdout__
        sys.stdin = sys.__stdin__
        self.assertEqual(res, "test input")

    def test_reads(self):
        eq = self.assertEqual
        self.assertRaises(TypeError, self._fp.seek)
        eq(self._fp.read(10), self._line[:10])
        eq(self._fp.read(0), '')
        eq(self._fp.readline(0), '')
        eq(self._fp.readline(), self._line[10:] + '\n')
        eq(len(self._fp.readlines(60)), 2)
        self._fp.seek(0)
        eq(self._fp.readline(-1), self._line + '\n')

    def test_writes(self):
        f = StringIO.StringIO()
        self.assertRaises(TypeError, f.seek)
        f.write(self._line[:6])
        f.seek(3)
        f.write(self._line[20:26])
        f.write(self._line[52])
        self.assertEqual(f.getvalue(), 'abcuvwxyz!')

    def test_writelines(self):
        f = StringIO.StringIO()
        f.writelines([self._line[0], self._line[1], self._line[2]])
        f.seek(0)
        self.assertEqual(f.getvalue(), 'abc')

    # def test_writelines_error(self):
    #     def errorGen():
    #         yield 'a'
    #         raise KeyboardInterrupt()
    #     f = StringIO.StringIO()
    #     self.assertRaises(KeyboardInterrupt, f.writelines, errorGen())

    def test_truncate(self):
        eq = self.assertEqual
        f = StringIO.StringIO()
        f.write(self._lines)
        f.seek(10)
        f.truncate()
        eq(f.getvalue(), 'abcdefghij')
        f.truncate(5)
        eq(f.getvalue(), 'abcde')
        f.write('xyz')
        eq(f.getvalue(), 'abcdexyz')
        self.assertRaises(IOError, f.truncate, -1)
        f.close()
        self.assertRaises(ValueError, f.write, 'frobnitz')

    def test_closed_flag(self):
        f = StringIO.StringIO()
        self.assertEqual(f.closed, False)
        f.close()
        self.assertEqual(f.closed, True)
        f = StringIO.StringIO("abc")
        self.assertEqual(f.closed, False)
        f.close()
        self.assertEqual(f.closed, True)

    def test_isatty(self):
        f = StringIO.StringIO()
        self.assertRaises(TypeError, f.isatty, None)
        self.assertEqual(f.isatty(), False)
        f.close()
        self.assertRaises(ValueError, f.isatty)

    # def test_iterator(self):
    #     eq = self.assertEqual
    #     unless = self.assertTrue
    #     eq(iter(self._fp), self._fp)
    #     # Does this object support the iteration protocol?
    #     unless(hasattr(self._fp, '__iter__'))
    #     unless(hasattr(self._fp, 'next'))
    #     i = 0
    #     for line in self._fp:
    #         eq(line, self._line + '\n')
    #         i += 1
    #     eq(i, 5)
    #     self._fp.close()
    #     self.assertRaises(ValueError, self._fp.next)

    def test_getvalue(self):
        self._fp.close()
        self.assertRaises(ValueError, self._fp.getvalue)

    # def test_unicode(self):
    #
    #     #if not test_support.have_unicode: return
    #
    #     # The StringIO module also supports concatenating Unicode
    #     # snippets to larger Unicode strings. This is tested by this
    #     # method. Note that cStringIO does not support this extension.
    #
    #     f = StringIO.StringIO()
    #     f.write(self._line[:6])
    #     f.seek(3)
    #     f.write(unicode(self._line[20:26]))
    #     f.write(unicode(self._line[52]))
    #     s = f.getvalue()
    #     self.assertEqual(s, unicode('abcuvwxyz!'))
    #     #self.assertEqual(type(s), types.UnicodeType)

if __name__ == '__main__':
    unittest.main()
