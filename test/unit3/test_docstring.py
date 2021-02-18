import unittest


def banana():
    "Yellow"
    return 42


def orange():
    "Oran" "ge"


def blackbirds():
    4 + 20  # Not a docstring


def do_nothing():
    pass


def make_adder(n):
    "Function adding N"
    def add(x):
        "Compute N + X"
        return n + x
    return add


class Strawberry:
    "Delicious"
    doc = __doc__

    def weight(self):
        "Heavy"
        return 0.25

    @classmethod
    def is_red(cls):
        "Very red"
        return True

    @staticmethod
    def pick():
        "Picked"
        return None


class Tangerine:
    def peel():
        pass


class Pear:
    "This will not be the __doc__"
    __doc__ = "Conference"


class TestDocstrings(unittest.TestCase):
    def test_builtin(self):
        self.assertTrue(divmod.__doc__.startswith("Return the tuple (x//y, x%y)"))

    def test_library_function(self):
        # This test will need updating if/when random.seed gets a docstring.
        # It also fails under cpython.
        import random
        self.assertEqual(random.seed.__doc__, None)

    def test_function(self):
        self.assertEqual(banana.__doc__, "Yellow")
        self.assertEqual(orange.__doc__, "Orange")
        self.assertEqual(make_adder.__doc__, "Function adding N")

    def test_runtime_function(self):
        self.assertEqual(make_adder(3).__doc__, "Compute N + X")

    def test_non_string_expr(self):
        self.assertEqual(blackbirds.__doc__, None)

    def test_no_expr(self):
        self.assertEqual(do_nothing.__doc__, None)

    def test_class(self):
        self.assertEqual(Strawberry.__doc__, "Delicious")
        self.assertEqual(Strawberry.doc, "Delicious")

    def test_class_no_docstring(self):
        self.assertEqual(Tangerine.__doc__, None)
        self.assertEqual(Tangerine.peel.__doc__, None)
        self.assertEqual(Tangerine().peel.__doc__, None)

    def test_class_explicit_docstring(self):
        self.assertEqual(Pear.__doc__, "Conference")

    def test_method(self):
        self.assertEqual(Strawberry.weight.__doc__, "Heavy")
        s = Strawberry()
        self.assertEqual(s.weight.__doc__, "Heavy")

    def test_classmethod(self):
        self.assertEqual(Strawberry.is_red.__doc__, "Very red")

    def test_staticmethod(self):
        self.assertEqual(Strawberry.pick.__doc__, "Picked")

    def test_module(self):
        import bisect
        self.assertEqual(bisect.__doc__, "Bisection algorithms.")

    def test_local_module(self):
        import copydocstring
        self.assertEqual(copydocstring.__doc__, "Copy docstring")
        self.assertEqual(copydocstring.doc, "Copy docstring")

    def test_local_module_overwriting_docstring(self):
        import overwritedocstring
        self.assertEqual(overwritedocstring.__doc__, "Second docstring")

    def test_lambda(self):
        f = lambda x: 42
        self.assertEqual(f.__doc__, None)

    def test_setting_on_function(self):
        def f():
            "hello"
            return 42

        self.assertEqual(f.__doc__, "hello")

        f.__doc__ = "world"
        self.assertEqual(f.__doc__, "world")

        # Setting to a non-string is odd but allowed:
        f.__doc__ = 42
        self.assertEqual(f.__doc__, 42)

        # Attemping to delete __doc__ instead sets it to None:
        del f.__doc__
        self.assertEqual(f.__doc__, None)

    def test_setting_on_method(self):
        class Banana:
            def peel(self):
                "Remove peel"
                pass

        self.assertEqual(Banana.peel.__doc__, "Remove peel")

        # We can set the doc when accessed on the class:
        Banana.peel.__doc__ = "Take out of peel"
        self.assertEqual(Banana.peel.__doc__, "Take out of peel")

        # But not when accessed via an instance:

        def set_on_method_of_instance():
            banana = Banana()
            banana.peel.__doc__ = "this will not work"

        self.assertRaises(AttributeError, set_on_method_of_instance)


if __name__ == '__main__':
    unittest.main()
