"""Test nonlocal statement."""

import unittest


class NonlocalTests(unittest.TestCase):
    """Test cases for nonlocal statement."""

    def test_basic_nonlocal(self):
        """Test basic nonlocal variable modification."""
        def outer():
            x = 1
            def inner():
                nonlocal x
                x = 2
            inner()
            return x
        self.assertEqual(outer(), 2)

    def test_nonlocal_read_and_write(self):
        """Test reading and writing nonlocal variable."""
        def outer():
            x = 10
            def inner():
                nonlocal x
                x = x + 5
            inner()
            return x
        self.assertEqual(outer(), 15)

    def test_multiple_nonlocal(self):
        """Test multiple nonlocal declarations in one statement."""
        def outer():
            x = 1
            y = 2
            def inner():
                nonlocal x, y
                x = 10
                y = 20
            inner()
            return x + y
        self.assertEqual(outer(), 30)

    def test_nested_nonlocal(self):
        """Test nonlocal in deeply nested functions."""
        def outer():
            x = 1
            def middle():
                def inner():
                    nonlocal x
                    x = 3
                inner()
            middle()
            return x
        self.assertEqual(outer(), 3)

    def test_nonlocal_counter(self):
        """Test nonlocal for creating a counter closure."""
        def make_counter():
            count = 0
            def counter():
                nonlocal count
                count += 1
                return count
            return counter
        c = make_counter()
        self.assertEqual(c(), 1)
        self.assertEqual(c(), 2)
        self.assertEqual(c(), 3)

    def test_nonlocal_with_local(self):
        """Test nonlocal doesn't affect other local variables."""
        def outer():
            x = 1
            y = 100
            def inner():
                nonlocal x
                y = 200  # This is a local variable in inner
                x = 2
                return y
            result = inner()
            return (x, y, result)
        self.assertEqual(outer(), (2, 100, 200))

    def test_nonlocal_multiple_levels(self):
        """Test nonlocal skipping intermediate scopes."""
        def outer():
            x = 1
            def middle():
                # x is not modified or declared here
                def inner():
                    nonlocal x
                    x = 5
                inner()
            middle()
            return x
        self.assertEqual(outer(), 5)

    def test_nonlocal_in_class_method(self):
        """Test nonlocal in a method defined inside a function."""
        def outer():
            x = 10
            class Inner:
                def method(self):
                    nonlocal x
                    x = 20
            obj = Inner()
            obj.method()
            return x
        self.assertEqual(outer(), 20)

    def test_separate_nonlocal_statements(self):
        """Test separate nonlocal statements."""
        def outer():
            x = 1
            y = 2
            def inner():
                nonlocal x
                nonlocal y
                x = 10
                y = 20
            inner()
            return x + y
        self.assertEqual(outer(), 30)


class NonlocalErrorTests(unittest.TestCase):
    """Test error conditions for nonlocal statement."""

    def test_nonlocal_no_binding(self):
        """Test nonlocal with no binding in enclosing scope."""
        with self.assertRaises(SyntaxError):
            exec("""
def outer():
    def inner():
        nonlocal x
        x = 1
""")

    def test_nonlocal_at_module_level(self):
        """Test nonlocal at module level raises SyntaxError."""
        with self.assertRaises(SyntaxError):
            exec("nonlocal x")

    def test_nonlocal_after_use(self):
        """Test nonlocal after variable is used raises SyntaxError."""
        with self.assertRaises(SyntaxError):
            exec("""
def outer():
    x = 1
    def inner():
        print(x)
        nonlocal x
""")

    def test_nonlocal_after_assignment(self):
        """Test nonlocal after variable is assigned raises SyntaxError."""
        with self.assertRaises(SyntaxError):
            exec("""
def outer():
    x = 1
    def inner():
        x = 2
        nonlocal x
""")

    def test_nonlocal_and_global(self):
        """Test that a name cannot be both nonlocal and global."""
        with self.assertRaises(SyntaxError):
            exec("""
def outer():
    x = 1
    def inner():
        global x
        nonlocal x
""")

    def test_nonlocal_parameter(self):
        """Test nonlocal cannot be used with a parameter name."""
        with self.assertRaises(SyntaxError):
            exec("""
def outer():
    x = 1
    def inner(x):
        nonlocal x
""")


if __name__ == "__main__":
    unittest.main()

