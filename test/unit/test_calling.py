# Python test set -- built-in functions

import unittest


def f1(x, y, *args, **kwargs):
    return (x, y, args, kwargs)

def f2(x=None, y=None, *args, **kwargs):
    return (x, y, args, kwargs)

class C:
    def f1(self, x, y, *args, **kwargs):
        return (self, x, y, args, kwargs)

    def f2(self, x=None, y=None, *args, **kwargs):
        return (self, x, y, args, kwargs)


class BuiltinTest(unittest.TestCase):

    def test_simple_call(self):
        self.assertEqual(f1(1, 2), (1, 2, (), {}))
        self.assertRaises(TypeError, lambda: f1(1))
        self.assertEqual(f2(1), (1, None, (), {}))

        self.assertEqual(f1(1, 2, 3, 4), (1, 2, (3, 4), {}))
        self.assertEqual(f1(1, y=2), (1, 2, (), {}))
        self.assertEqual(f1(1, z=3, y=2), (1, 2, (), {'z': 3}))
        self.assertRaises(TypeError, lambda: f1(1, 2, y=3))

        self.assertEqual(f1(1, *[2, 3]), (1, 2, (3,), {}))
        self.assertEqual(f1(**{'x': 1, 'y': 2}), (1, 2, (), {}))
        self.assertEqual(f1(**{'x': 1, 'y': 2, 'z': 3}), (1, 2, (), {'z': 3}))
        self.assertEqual(f1(*[1, 2, 3], **{'z': 4}), (1, 2, (3,), {'z': 4}))
        self.assertRaises(TypeError, lambda: f1(*[1, 2, 3], **{'y', 4}))


    def test_method_call(self):
        o = C()

        self.assertEqual(o.f1(1, 2), (o, 1, 2, (), {}))
        self.assertRaises(TypeError, lambda: o.f1(1))
        self.assertEqual(o.f2(1), (o, 1, None, (), {}))

        self.assertEqual(o.f1(1, 2, 3, 4), (o, 1, 2, (3, 4), {}))
        self.assertEqual(o.f1(1, y=2), (o, 1, 2, (), {}))
        self.assertEqual(o.f1(1, z=3, y=2), (o, 1, 2, (), {'z': 3}))
        self.assertRaises(TypeError, lambda: o.f1(1, 2, y=3))
        self.assertRaises(TypeError, lambda: o.f1(1, 2, self=3))

        self.assertEqual(o.f1(1, *[2, 3]), (o, 1, 2, (3,), {}))
        self.assertEqual(o.f1(**{'x': 1, 'y': 2}), (o, 1, 2, (), {}))
        self.assertEqual(o.f1(**{'x': 1, 'y': 2, 'z': 3}), (o, 1, 2, (), {'z': 3}))
        self.assertEqual(o.f1(*[1, 2, 3], **{'z': 4}), (o, 1, 2, (3,), {'z': 4}))
        self.assertRaises(TypeError, lambda: o.f1(*[1, 2, 3], **{'y', 4}))


if __name__ == "__main__":
    unittest.main()
