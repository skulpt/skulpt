# CPython 3.14 Lib/test/test_raise.py, commit 18ef0f0cb52.
# Selected cause tests, unchanged.
# testCauseSyntax needs unsupported __context__/__suppress_context__ tracking.
import unittest


class TestCause(unittest.TestCase):
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
        else:
            self.fail("No exception raised")

    def test_instance_cause(self):
        cause = KeyError()
        try:
            raise IndexError from cause
        except IndexError as e:
            self.assertIs(e.__cause__, cause)
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


if __name__ == "__main__":
    unittest.main()
