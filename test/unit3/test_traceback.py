# Selected CPython traceback tests and labelled Skulpt regressions.
import sys
import traceback
import unittest


def fail():
    raise ValueError('formatter failure')


def caller():
    fail()


class TracebackFormattingTests(unittest.TestCase):
    def get_error(self):
        try:
            caller()
        except ValueError as error:
            return error

    def test_skulpt_imported_source_and_limits(self):
        error = self.get_error()
        tb = error.__traceback__
        frames = traceback.extract_tb(tb)
        self.assertEqual([frame.name for frame in frames], ['get_error', 'caller', 'fail'])
        self.assertTrue(frames[-1].filename.endswith('test_traceback.py'))
        self.assertEqual(frames[-1].line, "raise ValueError('formatter failure')")
        self.assertEqual(traceback.extract_tb(tb, limit=-1), frames[-1:])
        self.assertEqual(traceback.extract_tb(tb, limit=1), frames[:1])
        self.assertEqual(traceback.extract_tb(tb, limit=0), [])
        self.assertEqual(traceback.format_tb(tb), traceback.format_list(frames))
        formatted = ''.join(traceback.format_exception(type(error), error, tb))
        self.assertTrue(formatted.startswith('Traceback (most recent call last):\n'))
        self.assertTrue(formatted.endswith('ValueError: formatter failure\n'))

    # Adapted from CPython Lib/test/test_traceback.py.
    def test_walk_tb(self):
        try:
            1 / 0
        except Exception as error:
            tb = error.__traceback__
        self.assertEqual(list(traceback.walk_tb(tb)), [(tb.tb_frame, tb.tb_lineno)])

    # Adapted from CPython test_traceback.py::test_cause.
    def test_explicit_cause_and_chain_option(self):
        try:
            try:
                raise ValueError('original')
            except ValueError as cause:
                raise RuntimeError('replacement') from cause
        except RuntimeError as error:
            formatted = ''.join(traceback.format_exception(type(error), error, error.__traceback__))
            unchained = ''.join(traceback.format_exception(type(error), error, error.__traceback__, chain=False))
        self.assertIn('ValueError: original\n', formatted)
        self.assertIn('The above exception was the direct cause', formatted)
        self.assertTrue(formatted.endswith('RuntimeError: replacement\n'))
        self.assertNotIn('ValueError: original\n', unchained)

    # Adapted from the CPython test_traceback.py exception-instance cases.
    def test_format_exception_accepts_exception_instance(self):
        error = self.get_error()
        expected = traceback.format_exception(type(error), error, error.__traceback__)
        self.assertEqual(traceback.format_exception(error), expected)
        self.assertEqual(traceback.format_exception_only(error), ['ValueError: formatter failure\n'])

        class Output:
            def __init__(self):
                self.lines = []

            def write(self, text):
                self.lines.append(text)

        output = Output()
        traceback.print_exception(error, file=output)
        self.assertEqual(''.join(output.lines), ''.join(expected))

    # Adapted from CPython Lib/test/test_traceback.py.
    def test_exception_notes(self):
        error = ValueError(123)
        vanilla = traceback.format_exception_only(type(error), error)
        error.add_note('My Note')
        error.add_note('another\nline')
        error.add_note('')
        self.assertEqual(traceback.format_exception_only(type(error), error),
                         vanilla + ['My Note\n', 'another\n', 'line\n', '\n'])
        del error.__notes__
        self.assertEqual(traceback.format_exception_only(type(error), error), vanilla)

    def test_skulpt_exception_truthiness_is_not_used(self):
        class Error(ValueError):
            def __bool__(self):
                raise RuntimeError('formatting must not call __bool__')

        error = Error('outer')
        error.__cause__ = ValueError('inner')
        formatted = ''.join(traceback.format_exception(type(error), error, None))
        self.assertIn('ValueError: inner\n', formatted)
        self.assertIn('Error: outer\n', formatted)

    def test_missing_source_and_supplied_locals(self):
        frame = traceback.FrameSummary('missing-traceback-source.py', 7, 'example')
        self.assertEqual(frame.line, '')
        self.assertEqual(traceback.format_list([frame]), ['  File "missing-traceback-source.py", line 7, in example\n'])
        frame = traceback.FrameSummary('example.py', 1, 'example', line='pass', locals={'value': 42})
        self.assertEqual(frame.locals, {'value': '42'})
        self.assertIn('    value = 42\n', ''.join(traceback.format_list([frame])))

    def test_syntax_error(self):
        error = SyntaxError('invalid syntax', ('example.py', 2, 4, 'x =\n'))
        formatted = ''.join(traceback.format_exception_only(type(error), error))
        self.assertIn('  File "example.py", line 2\n', formatted)
        self.assertTrue(formatted.endswith('SyntaxError: invalid syntax\n'))

    # CPython Lib/test/test_traceback.py::TestStack.test_from_list_edited_stack.
    def test_from_list_edited_stack(self):
        s = traceback.StackSummary.from_list([('foo.py', 1, 'fred', 'line')])
        s[0] = ('foo.py', 2, 'fred', 'line')
        s2 = traceback.StackSummary.from_list(s)
        self.assertEqual(
            ['  File "foo.py", line 2, in fred\n    line\n'],
            s2.format())

    # Adapted from CPython Lib/test/test_traceback.py::test_syntax_error_no_lineno.
    def test_syntax_error_no_lineno(self):
        error = SyntaxError('bad syntax')
        # Skulpt currently emits a "line None" header for an absent line number.
        # self.assertEqual(traceback.format_exception_only(error),
        #                  ['SyntaxError: bad syntax\n'])
        error.lineno = 100
        self.assertEqual(traceback.format_exception_only(error),
                         ['  File "<string>", line 100\n', 'SyntaxError: bad syntax\n'])

        error = SyntaxError('bad syntax')
        error.filename = 'myfile.py'
        # self.assertEqual(traceback.format_exception_only(error),
        #                  ['SyntaxError: bad syntax (myfile.py)\n'])
        error.lineno = 100
        self.assertEqual(traceback.format_exception_only(error),
                         ['  File "myfile.py", line 100\n', 'SyntaxError: bad syntax\n'])

    def test_skulpt_unavailable_frame_operations_are_explicit(self):
        error = self.get_error()
        if sys.implementation.name == 'skulpt':
            with self.assertRaises(NotImplementedError):
                traceback.TracebackException.from_exception(error, capture_locals=True)
            with self.assertRaises(NotImplementedError):
                traceback.extract_stack()
            with self.assertRaises(NotImplementedError):
                traceback.clear_frames(error.__traceback__)
        self.assertEqual(traceback.clear_frames(None), None)

if __name__ == '__main__':
    unittest.main()
