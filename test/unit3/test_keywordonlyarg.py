"""Selected CPython keyword-only argument tests and labelled Skulpt regressions."""

import unittest


class KeywordOnlyArgTestCase(unittest.TestCase):
    def test_issue13343(self):
        # From CPython's test_keywordonlyarg: scan keyword-only lambda defaults
        # when collecting symbols for the enclosing scope.
        lambda *, k1=unittest: None


class TestSkulptKeywordOnlyRegressions(unittest.TestCase):
    """Bespoke Skulpt compiler regressions for CPython-compatible behaviour."""

    def test_kwonly_default_builtin_name_resolution(self):
        """kw-only defaults should resolve names without compiler assertion failures."""
        def f(*, x=dict):
            return x

        # Do not reference dict again here: that would mask the missing
        # symbol-table visit by registering it elsewhere in this scope.
        self.assertEqual(f()(), {})

    def test_kwonly_default_closure_name_resolution(self):
        def outer():
            value = 42

            def middle():
                def inner(*, x=value):
                    return x
                return inner

            return middle()()

        self.assertEqual(outer(), 42)


if __name__ == "__main__":
    unittest.main()
