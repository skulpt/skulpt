"""Nonlocal diagnostic cases adapted from CPython's Lib/test/test_syntax.py."""

import unittest


class SyntaxTestCase(unittest.TestCase):
    def test_nonlocal_after_use(self):
        with self.assertRaises(SyntaxError) as cm:
            compile("""def f():
    x = 1
    def g():
        print(x)
        nonlocal x
""", "<test string>", "exec")
        self.assertEqual(cm.exception.msg, "name 'x' is used prior to nonlocal declaration")

    def test_nonlocal_after_assignment(self):
        with self.assertRaises(SyntaxError) as cm:
            compile("""def f():
    x = 1
    def g():
        x = 2
        nonlocal x
""", "<test string>", "exec")
        self.assertEqual(cm.exception.msg, "name 'x' is assigned to before nonlocal declaration")

    def test_nonlocal_parameter(self):
        with self.assertRaises(SyntaxError) as cm:
            compile("""def f(x):
    nonlocal x
""", "<test string>", "exec")
        self.assertEqual(cm.exception.msg, "name 'x' is parameter and nonlocal")

    def test_nonlocal_and_global(self):
        with self.assertRaises(SyntaxError) as cm:
            compile("""def f():
    global x
    nonlocal x
""", "<test string>", "exec")
        self.assertEqual(cm.exception.msg, "name 'x' is nonlocal and global")

    def test_nonlocal_no_binding(self):
        with self.assertRaises(SyntaxError) as cm:
            compile("""def f():
    nonlocal x
""", "<test string>", "exec")
        self.assertEqual(cm.exception.msg, "no binding for nonlocal 'x' found")

    def test_nonlocal_at_module_level(self):
        with self.assertRaises(SyntaxError) as cm:
            compile("nonlocal x\n", "<test string>", "exec")
        self.assertEqual(cm.exception.msg, "nonlocal declaration not allowed at module level")

    def test_nonlocal_mangled_name(self):
        with self.assertRaises(SyntaxError) as cm:
            compile("""class A:
    def f(self):
        nonlocal __x
""", "<test string>", "exec")
        self.assertEqual(cm.exception.msg, "no binding for nonlocal '_A__x' found")


if __name__ == "__main__":
    unittest.main()
