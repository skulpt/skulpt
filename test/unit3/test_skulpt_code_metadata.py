# Skulpt regression tests for the metadata emitted by the compiler.
import unittest


def identity(function):
    return function


@identity
def sample(positional, *rest, keyword=None, **options):
    local = positional
    return local


def generator_fixture():
    yield 1


class CodeMetadataTests(unittest.TestCase):
    def test_function_metadata(self):
        code = sample.__code__
        self.assertIs(code, sample.__code__)
        self.assertEqual(code.co_name, 'sample')
        self.assertIn('<code object sample', repr(code))
        self.assertEqual(code.co_filename, __file__)
        self.assertEqual(code.co_firstlineno, 9)
        self.assertEqual(code.co_argcount, 1)
        self.assertEqual(code.co_posonlyargcount, 0)
        self.assertEqual(code.co_kwonlyargcount, 1)
        self.assertEqual(code.co_varnames, ('positional', 'keyword', 'rest', 'options', 'local'))
        self.assertEqual(code.co_flags & 0x2c, 0x0c)
        with self.assertRaises(AttributeError):
            code.co_firstlineno = 0

    def test_local_names_follow_compiled_access(self):
        def f():
            x = y
            y = 1
            return lambda: 0

        self.assertEqual(f.__code__.co_varnames, ('y', 'x'))

    def test_nested_method_metadata(self):
        class Example:
            def method(self, __private):
                return __private

        code = Example.method.__code__
        self.assertEqual(code.co_varnames[:code.co_argcount], ('self', '_Example__private'))
        self.assertEqual(code.co_flags & 0x10, 0x10)

    def test_generator_factory(self):
        self.assertEqual(generator_fixture.__code__.co_flags & 0x20, 0x20)
        self.assertEqual(sample.__code__.co_flags & 0x20, 0)


if __name__ == '__main__':
    unittest.main()
