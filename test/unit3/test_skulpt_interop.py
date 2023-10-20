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
        i = x.pop(0) # use python method over js method here
        self.assertEqual(i, 1)

    def test_set_map(self):
        # these should remain as js Sets/Maps when coming from javascript
        x = [["a", 1], ["b", 2]]
        m = window.Map(x)
        self.assertTrue(m.has, "a")
        self.assertEqual(list(m), x)

        x = ["a", "b", "c"]
        s = window.Set(x)
        self.assertTrue(s.has("a"))
        self.assertEqual(list(s), x)


if __name__ == "__main__":
    unittest.main()
