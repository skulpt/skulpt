import unittest

class Tracer:
    def reset():
        Tracer.value = None


class SimpleConstructor:
    def __init__(self, x):
        self.x = x
        Tracer.value = x


class InheritConstructor(SimpleConstructor):
    pass


class NewOverride(object):
    def __new__(cls, x):
        o = object.__new__(cls)
        o.x = x
        return o

class InheritNewOverride(NewOverride):
    pass


class NewRedirect(object):
    def __new__(cls):
        return SimpleConstructor()


class NoConstructors(object):
    pass


class ConstructorTests():

    def test_init(self):
        Tracer.reset()
        sc = SimpleConstructor(42)
        self.assertEqual(sc.x, 42)
        self.assertEqual(Tracer.value, 42)

        self.assertRaises(TypeError, lambda: SimpleConstructor())

        Tracer.reset()
        ic = InheritConstructor(42)
        self.assertEqual(ic.x, 42)
        self.assertEqual(Tracer.value, 42)

        self.assertRaises(TypeError, lambda: InheritConstructor())

    def test_new(self):
        no = NewOverride(42)
        self.assertEqual(no.x, 42)
        self.assertIsInstance(no, NewOverride)
        self.assertRaises(TypeError, lambda: NewOverride())

        ino = InheritNewOverride(42)
        self.assertIsInstance(no, InheritNewOverride)
        self.assertEqual(ino.x, 42)

        self.assertRaises(TypeError, lambda: InheritNewOverride())


        redirected = NewRedirect()
        self.assertIsInstance(redirected, SimpleConstructor)


if __name__ == '__main__':
    unittest.main()
