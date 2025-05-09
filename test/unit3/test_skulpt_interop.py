"""Unit tests for zero-argument super() & related machinery."""

import unittest


window = jseval("Sk.global")
jsProxy = type(window)


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

        x = object()
        window.x = x
        self.assertIs(window.x, x)

    
    def test_proxy_object(self):
        def foo():
            return 42
        
        x = {"foo": foo}
        window.x = x
        self.assertNotIsInstance(window.x, dict)
        self.assertIsInstance(window.x, object)
        self.assertIsInstance(window.x, jsProxy)
        self.assertEqual(window.x.foo(), 42)

        f = window.Function("""return Sk.global.x.foo()""")
        self.assertEqual(f(), 42)
        self.assertIsInstance(f, jsProxy)

        x = {"sk$object": False}
        window.x = x
        self.assertNotIsInstance(window.x, dict)
        self.assertIsInstance(window.x, object)
        self.assertIsInstance(window.x, jsProxy)

        
        make_obscure_proxy = window.Function("""return new Proxy(() => 42, {
            get: function(target, prop) {
                return Sk.global.make_obscure_proxy()
            }
        })""")
        window.make_obscure_proxy = make_obscure_proxy
        x = make_obscure_proxy()
        self.assertIsInstance(x, object)
        self.assertIsInstance(x, jsProxy)
        self.assertIsInstance(x.foo, jsProxy)
        # it's not possible to call x() from python 
        # as it passes the heuristic for `new`
        # Proxy(() => 42, {}), and Proxy(class A {}, {}) are impossible to distinguish between
        # And both conform to heuristics of browser native classes 
        

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
    
    def test_cross_origin_window(self):
        window.x = {"foo": None}
        self.assertIsNone(window.x.foo)

        if "window" not in window:
            # can't test this in a node environment
            return
        
        iframe = window.document.createElement("iframe")
        iframe.src = "http://skulpt.org"

        window.document.body.prepend(iframe)
        
        contentWindow = iframe.contentWindow
        def wait_for_load(resolve, reject):
            iframe.onload = resolve
            iframe.onerror = reject

        p = window.Promise(wait_for_load).then(lambda *args: print("iframe loaded"))

        with self.assertRaisesRegex(Exception, "SecurityError"):
            # should be a cross origin error
            hasattr(contentWindow, "foo")
        
        contentWindow.postMessage({"data": "*"})


if __name__ == "__main__":
    unittest.main()
