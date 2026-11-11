# Selected tests from CPython 3.14 Lib/test/test_exceptions.py at 18ef0f0cb52.
import unittest


class ExceptionTests(unittest.TestCase):
    def testChainingAttrs(self):
        e = Exception()
        self.assertIsNone(e.__context__)
        self.assertIsNone(e.__cause__)

        e = TypeError()
        self.assertIsNone(e.__context__)
        self.assertIsNone(e.__cause__)

        class MyException(OSError):
            pass

        e = MyException()
        self.assertIsNone(e.__context__)
        self.assertIsNone(e.__cause__)

    def testChainingDescriptors(self):
        try:
            raise Exception()
        except Exception as exc:
            e = exc

        self.assertIsNone(e.__context__)
        self.assertIsNone(e.__cause__)
        self.assertFalse(e.__suppress_context__)

        e.__context__ = NameError()
        e.__cause__ = None
        self.assertIsInstance(e.__context__, NameError)
        self.assertIsNone(e.__cause__)
        self.assertTrue(e.__suppress_context__)
        e.__suppress_context__ = False
        self.assertFalse(e.__suppress_context__)
        with self.assertRaisesRegex(TypeError,
                                    'attribute value type must be bool'):
            e.__suppress_context__ = 1
        with self.assertRaisesRegex(TypeError,
                                    "can't delete numeric/char attribute"):
            del e.__suppress_context__
        self.assertFalse(e.__suppress_context__)

    def test_invalid_setattr(self):
        # Chaining cases from CPython; traceback objects remain unsupported.
        TE = TypeError
        exc = Exception()
        msg = "exception cause must be None or derive from BaseException"
        self.assertRaisesRegex(TE, msg, setattr, exc, '__cause__', 1)
        msg = "exception context must be None or derive from BaseException"
        self.assertRaisesRegex(TE, msg, setattr, exc, '__context__', 1)

    def test_invalid_delattr(self):
        # Chaining cases from CPython; other descriptors have separate coverage.
        TE = TypeError
        exc = Exception()
        msg = "may not be deleted"
        self.assertRaisesRegex(TE, msg, delattr, exc, '__cause__')
        self.assertRaisesRegex(TE, msg, delattr, exc, '__context__')


class TestSkulptRegressions(unittest.TestCase):
    def test_chaining_assignment_preserves_state_on_error(self):
        # Manual assignment accepts BaseException instances, not exception classes.
        for name in ('__cause__', '__context__'):
            error = Exception()
            value = KeyboardInterrupt()
            setattr(error, name, value)
            suppressed = error.__suppress_context__
            for invalid in (1, ValueError):
                with self.assertRaises(TypeError):
                    setattr(error, name, invalid)
                self.assertIs(getattr(error, name), value)
                self.assertIs(error.__suppress_context__, suppressed)
            with self.assertRaises(TypeError):
                delattr(error, name)
            self.assertIs(getattr(error, name), value)
            setattr(error, name, None)
            self.assertIsNone(getattr(error, name))
            self.assertIs(error.__suppress_context__, suppressed)


if __name__ == "__main__":
    unittest.main()
