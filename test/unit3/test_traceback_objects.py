from contextlib import contextmanager
import time
import unittest


class TestTracebackObjects(unittest.TestCase):
    # Adapted from CPython Lib/test/test_exceptions.py.
    def test_with_traceback(self):
        try:
            raise IndexError(4)
        except Exception as error:
            tb = error.__traceback__

        class MyException(Exception):
            pass

        for error in (BaseException(), IndexError(5), MyException()):
            self.assertIsNone(error.__traceback__)
            self.assertIs(error.with_traceback(tb), error)
            self.assertIs(error.__traceback__, tb)
            error.__traceback__ = None
            self.assertIsNone(error.__traceback__)

    def test_invalid_traceback(self):
        with self.assertRaisesRegex(TypeError, "__traceback__ must be a traceback or None"):
            Exception().__traceback__ = 5

    def test_traceback_frames(self):
        def inner():
            raise ValueError

        def outer():
            inner()

        try:
            outer()
        except ValueError as error:
            tb = error.__traceback__
        self.assertIs(tb.tb_frame.f_code, self.test_traceback_frames.__code__)
        self.assertIs(tb.tb_next.tb_frame.f_code, outer.__code__)
        self.assertIs(tb.tb_next.tb_next.tb_frame.f_code, inner.__code__)
        self.assertEqual(tb.tb_next.tb_lineno, outer.__code__.co_firstlineno + 1)
        self.assertEqual(tb.tb_next.tb_next.tb_lineno, inner.__code__.co_firstlineno + 1)
        self.assertIsNone(tb.tb_next.tb_next.tb_next)

    def test_reraise_and_explicit_raise(self):
        try:
            try:
                try:
                    raise ValueError
                except ValueError as error:
                    original = error.__traceback__
                    raise
            finally:
                pass
        except ValueError as error:
            self.assertIs(error.__traceback__, original)
            try:
                raise error
            except ValueError as reraised:
                self.assertIs(reraised.__traceback__.tb_next, original)
                self.assertIs(reraised.__traceback__.tb_frame, original.tb_frame)
                self.assertNotEqual(reraised.__traceback__.tb_lineno, original.tb_lineno)

    def test_traceback_across_suspension(self):
        def fail_after_sleep():
            time.sleep(0.001)
            raise ValueError

        try:
            raise ValueError
        except ValueError as error:
            before = error.__traceback__

        try:
            fail_after_sleep()
        except ValueError as error:
            after = error.__traceback__

        self.assertIs(after.tb_frame, before.tb_frame)
        self.assertIs(after.tb_next.tb_frame.f_code, fail_after_sleep.__code__)
        self.assertEqual(after.tb_next.tb_lineno, fail_after_sleep.__code__.co_firstlineno + 2)
        self.assertIsNone(after.tb_next.tb_next)

    def test_generator_throw_with_traceback(self):
        def catcher():
            try:
                yield
            except ValueError as error:
                yield error.__traceback__

        try:
            raise ValueError
        except ValueError as error:
            original = error.__traceback__

        gen = catcher()
        next(gen)
        # Invalid third arguments must fail without advancing the generator.
        with self.assertRaisesRegex(TypeError, "third argument must be a traceback object"):
            gen.throw(ValueError, None, 23)
        tb = gen.throw(ValueError, None, original)
        self.assertIs(tb.tb_frame.f_code, catcher.__code__)
        self.assertIs(tb.tb_next, original)

    def test_throw_into_unstarted_generator(self):
        def identity(func):
            return func

        @identity
        def gen():
            yield

        try:
            gen().throw(ValueError)
        except ValueError as error:
            tb = error.__traceback__.tb_next
        self.assertIs(tb.tb_frame.f_code, gen.__code__)
        self.assertEqual(tb.tb_lineno, gen.__code__.co_firstlineno)

    def test_generator_context_manager_keeps_body_traceback(self):
        @contextmanager
        def manager():
            yield

        try:
            with manager():
                raise ValueError
        except ValueError as error:
            tb = error.__traceback__
        self.assertIs(tb.tb_frame.f_code, self.test_generator_context_manager_keeps_body_traceback.__code__)
        self.assertIsNone(tb.tb_next)

    def test_context_decorator_keeps_body_traceback(self):
        @contextmanager
        def manager():
            yield

        @manager()
        def fail():
            raise ValueError

        try:
            fail()
        except ValueError as error:
            tb = error.__traceback__
        while tb.tb_next is not None:
            tb = tb.tb_next
        self.assertIs(tb.tb_frame.f_code, fail.__wrapped__.__code__)

    def test_context_manager_receives_traceback(self):
        class Manager:
            def __enter__(self):
                return self

            def __exit__(self, exc_type, error, tb):
                self.error = error
                self.tb = tb

        manager = Manager()
        try:
            with manager:
                raise ValueError
        except ValueError as error:
            self.assertIs(error, manager.error)
            self.assertIs(error.__traceback__, manager.tb)
            self.assertIsNotNone(manager.tb)


if __name__ == "__main__":
    unittest.main()
