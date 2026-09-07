import unittest


class UnboundFreeTests(unittest.TestCase):
    """Name resolution across nested function and class scopes.

    Python uses the LEGB rule, where the "Enclosing" tier is the chain of
    enclosing *function* scopes only; class bodies never participate in that
    chain.  When a name is bound in an enclosing function and read by a nested
    scope, its value lives in a shared "cell": the binding scope sees it as a
    cell variable, and the nested scope that reads it sees it as a free
    variable.  A cell starts out empty on each call and is filled only when the
    binding executes, so reading it beforehand raises an error rather than
    silently treating the empty cell as a value -- NameError for a free-variable
    read in the nested scope, UnboundLocalError for a cell-variable read in the
    binding scope itself.
    """

    def test_class_captures_function_local(self):
        # A class body may read a local of an enclosing FUNCTION: x is a cell
        # in f and a free variable in the body of Inner.
        def f():
            x = 42
            class Inner:
                val = x
            return Inner.val
        self.assertEqual(f(), 42)

    def test_class_method_captures_function_local(self):
        # A class method may read a local of an enclosing FUNCTION: x is a cell
        # in f and a free variable in the body of Inner.g().
        def f():
            x = 42
            class Inner:
                def g(self):
                    return x
            return Inner()
        self.assertEqual(f().g(), 42)

    def test_deep_class_captures_function_locals(self):
        # A class body may read a local of any enclosing FUNCTION.
        def f():
            x = 42
            def g():
                y = 42000
                def h():
                    z = 42000000
                    class Inner:
                        val = x + y + z
                    return Inner.val
                return h()
            return g()
        self.assertEqual(f(), 42042042)

    def test_deep_class_method_captures_function_locals(self):
        # A class method may read a local of any enclosing FUNCTION.
        def f():
            x = 42
            def g():
                y = 42000
                def h():
                    z = 42000000
                    class Inner:
                        def k(self):
                            return x + y + z
                    return Inner()
                return h()
            return g()
        self.assertEqual(f().k(), 42042042)

    def test_class_body_binding_not_visible_to_nested_class(self):
        # A name bound in an enclosing CLASS body is invisible to nested code:
        # class scopes are not enclosing scopes, so x falls through to a global
        # lookup and is not found.
        def f():
            class Level1:
                x = 42
                class Level2:
                    class Level3:
                        got = x
        self.assertRaises(NameError, f)

    def test_free_var_read_during_class_construction(self):
        # Level1 is bound in the enclosing function, so it is a cell variable
        # there and a free variable in the nested class that reads it.  Its cell
        # is still empty while Level1's own body is executing -> NameError for
        # reading an unbound free variable.
        def f():
            class Level1:
                x = 42
                class Level2:
                    got = Level1.x
        self.assertRaises(NameError, f)

    def test_cell_relayed_through_intermediate_functions(self):
        # The cell for x is threaded through g and h, which never mention x
        # themselves, down to k which reads it.
        def f():
            x = 42
            def g():
                def h():
                    def k():
                        return x
                    return k()
                return h()
            return g()
        self.assertEqual(f(), 42)

    def test_no_binding_falls_through_to_global(self):
        # With no binding in any enclosing function, x is neither local nor
        # free; it is a global/builtin lookup and is not found.
        def f():
            def g():
                return x
            return g()
        self.assertRaises(NameError, f)

    def test_free_var_read_before_binding(self):
        # g reads x (a free variable whose cell lives in f) before f has bound
        # it -> NameError, even though f does bind x later.  The later x = 42 is
        # what makes x a cell of f rather than a global.
        def f():
            def g():
                return x
            g()
            x = 42
        self.assertRaises(NameError, f)

    def test_local_cell_read_before_binding(self):
        # x is a local of f that is also captured by g, so it lives in a cell.
        # Reading that cell in f before x is assigned is an UnboundLocalError
        # (the local-variable counterpart of the free-variable case above).
        def f():
            def g():
                return x
            got = x
            x = 1
        self.assertRaises(UnboundLocalError, f)


if __name__ == "__main__":
    unittest.main()
