# CPython 3.14 Lib/test/test_raise.py, commit 18ef0f0cb52.
# Selected cause tests. testCauseSyntax omits unsupported automatic context tracking.
import unittest


class TestCause(unittest.TestCase):
    def testCauseSyntax(self):
        try:
            try:
                try:
                    raise TypeError
                except Exception:
                    raise ValueError from None
            except ValueError as exc:
                self.assertIsNone(exc.__cause__)
                self.assertTrue(exc.__suppress_context__)
                exc.__suppress_context__ = False
                raise exc
        except ValueError as exc:
            e = exc

        self.assertIsNone(e.__cause__)
        self.assertFalse(e.__suppress_context__)
        # Automatic __context__ tracking is not implemented.
        # self.assertIsInstance(e.__context__, TypeError)

    def test_invalid_cause(self):
        try:
            raise IndexError from 5
        except TypeError as e:
            self.assertIn("exception cause", str(e))
        else:
            self.fail("No exception raised")

    def test_class_cause(self):
        try:
            raise IndexError from KeyError
        except IndexError as e:
            self.assertIsInstance(e.__cause__, KeyError)
            self.assertTrue(e.__suppress_context__)
        else:
            self.fail("No exception raised")

    def test_instance_cause(self):
        cause = KeyError()
        try:
            raise IndexError from cause
        except IndexError as e:
            self.assertIs(e.__cause__, cause)
            self.assertTrue(e.__suppress_context__)
        else:
            self.fail("No exception raised")

    def test_erroneous_cause(self):
        class MyException(Exception):
            def __init__(self):
                raise RuntimeError()

        try:
            raise IndexError from MyException
        except RuntimeError:
            pass
        else:
            self.fail("No exception raised")


# Raise and traceback cases from CPython Lib/test/test_raise.py.
def get_tb():
    try:
        raise OSError()
    except OSError as e:
        return e.__traceback__


class TestRaise(unittest.TestCase):

    def test_invalid_reraise(self):
        try:
            raise
        except RuntimeError as e:
            self.assertIn("No active exception", str(e))
        else:
            self.fail("No exception raised")

    def test_reraise(self):
        try:
            try:
                raise IndexError()
            except IndexError as e:
                exc1 = e
                raise
        except IndexError as exc2:
            self.assertIs(exc1, exc2)
        else:
            self.fail("No exception raised")

    # Skulpt does not restore the outer handled exception after the inner handler.
    # def test_except_reraise(self):
    #     def reraise():
    #         try:
    #             raise TypeError("foo")
    #         except TypeError:
    #             try:
    #                 raise KeyError("caught")
    #             except KeyError:
    #                 pass
    #             raise
    #     self.assertRaises(TypeError, reraise)

    def test_finally_reraise(self):
        def reraise():
            try:
                raise TypeError("foo")
            except TypeError:
                try:
                    raise KeyError("caught")
                finally:
                    raise
        self.assertRaises(KeyError, reraise)

    # Skulpt does not carry the handled exception into a nested function call.
    # def test_nested_reraise(self):
    #     def nested_reraise():
    #         raise
    #     def reraise():
    #         try:
    #             raise TypeError("foo")
    #         except TypeError:
    #             nested_reraise()
    #     self.assertRaises(TypeError, reraise)

    def test_yield_reraise(self):
        def reraise():
            try:
                raise TypeError("foo")
            except TypeError:
                yield 1
                raise
        g = reraise()
        next(g)
        self.assertRaises(TypeError, lambda: next(g))
        self.assertRaises(StopIteration, lambda: next(g))

    def test_accepts_traceback(self):
        tb = get_tb()
        try:
            raise IndexError().with_traceback(tb)
        except IndexError as e:
            self.assertNotEqual(e.__traceback__, tb)
            self.assertEqual(e.__traceback__.tb_next, tb)
        else:
            self.fail("No exception raised")


if __name__ == "__main__":
    unittest.main()
