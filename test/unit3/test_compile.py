# Selected tests from CPython Lib/test/test_compile.py.
import unittest


class TestCompile(unittest.TestCase):
    def test_mangling(self):
        class A:
            def f():
                __mangled = 1
                __not_mangled__ = 2
                import __mangled_mod
                import __package__.module

        self.assertIn("_A__mangled", A.f.__code__.co_varnames)
        self.assertIn("__not_mangled__", A.f.__code__.co_varnames)
        self.assertIn("_A__mangled_mod", A.f.__code__.co_varnames)
        self.assertIn("__package__", A.f.__code__.co_varnames)

    def test_compile_filename(self):
        code = compile('pass', 'file.py', 'exec')
        self.assertEqual(code.co_filename, 'file.py')
        # Skulpt accepts only str filenames.
        # code = compile('pass', b'file.py', 'exec')
        # self.assertEqual(code.co_filename, 'file.py')
        # Skulpt has no bytearray and does not implement memoryview.
        # for filename in bytearray(b'file.py'), memoryview(b'file.py'):
        #     with self.assertRaises(TypeError):
        #         compile('pass', filename, 'exec')
        self.assertRaises(TypeError, compile, 'pass', list(b'file.py'), 'exec')


if __name__ == '__main__':
    unittest.main()
