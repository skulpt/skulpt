# CPython 3.14 Lib/test/test_with.py, commit 18ef0f0cb52.
# Selected synchronous failure tests and their helper, unchanged.
import re
import unittest


def do_with(obj):
    with obj:
        pass


class FailureTestCase(unittest.TestCase):
    def testEnterAttributeError(self):
        class LacksEnter:
            def __exit__(self, type, value, traceback): ...

        with self.assertRaisesRegex(TypeError, re.escape((
            "object does not support the context manager protocol "
            "(missed __enter__ method)"
        ))):
            do_with(LacksEnter())

    def testExitAttributeError(self):
        class LacksExit:
            def __enter__(self): ...

        msg = re.escape((
            "object does not support the context manager protocol "
            "(missed __exit__ method)"
        ))
        # a missing __exit__ is reported missing before a missing __enter__
        with self.assertRaisesRegex(TypeError, msg):
            do_with(object())
        with self.assertRaisesRegex(TypeError, msg):
            do_with(LacksExit())


if __name__ == "__main__":
    unittest.main()
