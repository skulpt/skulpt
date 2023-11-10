"""Unit tests for zero-argument super() & related machinery."""

import unittest


window = jseval("Sk.global")


class TestProxyArray(unittest.TestCase):
    def test_basic(self):
        x = [1, 2, 3]
        window.x = x
        self.assertIsNot(x, window.x)
        self.assertEqual(x, window.x)

        x = window.x
        self.assertIs(x, window.x)
        window.x = x
        self.assertIs(x, window.x)

        self.assertIsInstance(x, list)
        x.append(4)
        x.push(5)
        self.assertEqual(x, [1, 2, 3, 4, 5])
        self.assertEqual(len(x), 5)

        c = x.copy()
        self.assertIs(type(c), list)
        self.assertEqual(c, x)

        x.foo = "bar"
        self.assertEqual(x.foo, "bar")

        r = x.splice(3, 2)
        self.assertEqual(r, [4, 5])

        r = x.map(lambda v, *args: v + 1)
        self.assertEqual(r, [v + 1 for v in x])

        i = x.pop()
        self.assertEqual(i, 3)
        i = x.pop(0)  # use python method over js method here
        self.assertEqual(i, 1)

        self.assertIn("push", dir(x))

    def test_set_map(self):
        # these should remain as js Sets/Maps when coming from javascript
        x = [["a", 1], ["b", 2]]
        m = window.m = window.Map(x)
        self.assertIs(window.m, m)
        window.m = m
        self.assertIs(window.m, m)

        self.assertTrue(m.has, "a")
        self.assertEqual(list(m), list(m.keys()))
        self.assertEqual(x, [[k, v] for k, v in dict(x).items()])
        m["b"] = 3
        self.assertEqual(m.get("b"), 3)
        self.assertIn("b", m)
        self.assertIn("has", dir(m))

        x = ["a", "b", "c"]
        s = window.s = window.Set(x)
        self.assertIs(window.s, s)
        window.s = s
        self.assertIs(window.s, s)

        self.assertTrue(s.has("a"))
        self.assertEqual(list(s), x)
        self.assertIn("b", s)
        s.add("d")
        self.assertIn("d", s)
        self.assertIn("has", dir(s))

    def test_frozen_array(self):
        jseval("Sk.global.foo = Object.freeze([1, 2, 3])")
        self.assertEqual(window.foo[0], 1)

    def test_preserve_method_identity(self):
        class Foo:
            def bar(self):
                pass

        foo = Foo()
        method_1 = foo.bar
        method_2 = foo.bar
        window.method_1 = method_1
        window.method_2 = method_2
        self.assertIsNot(method_1, method_2)
        self.assertIs(window.method_1, window.method_2)


if __name__ == "__main__":
    unittest.main()
