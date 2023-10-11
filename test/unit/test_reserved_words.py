import unittest


class TestFixture:
    def default(self):
        return True

    def delete(self):
        return True

class Prop:
    def __set_name__(self, owner, name):
        self._name = name

class A:
    pass


a = A()
a.name = "foo"
a.length = "bar"
default = "foo"


class Test_ReservedWords(unittest.TestCase):
    def test_getattr(self):
        f = TestFixture()
        func_default = getattr(f, "default")
        self.assertTrue(func_default())

        func_delete = getattr(f, "delete")
        self.assertTrue(func_delete())

        self.assertNotIn("$", repr(func_default))
        self.assertNotIn("$", repr(func_delete))

    def test_getattr_with_name(self):
        self.assertEqual(getattr(a, "name"), "foo")
        self.assertEqual(getattr(a, "length"), "bar")

    def test_setattr(self):
        f = TestFixture()
        setattr(f, "typeof", True)
        self.assertTrue(f.typeof)

        setattr(f, "this", True)
        self.assertTrue(f.this)

    def test_error_message(self):
        f = True
        try:
            setattr(f, "continue", True)
        except AttributeError as e:
            self.assertTrue("_$rw$" not in str(e))

        try:
            f.name
        except AttributeError as e:
            self.assertTrue("_$rn$" not in str(e))

    def test_dir(self):
        self.assertTrue("name" in dir(a))
        self.assertTrue("length" in dir(a))

    def test_arguments_prototype(self):
        with self.assertRaises(AttributeError):
            A.prototype
        with self.assertRaises(AttributeError):
            A.arguments

    def test_bug_949(self):
        def wrapper(name):
            def inner():
                return name

            return inner

        self.assertEqual(wrapper("foo")(), "foo")

    def test_global(self):
        self.assertTrue("default" in globals())

    def test_setname(self):


        class Foo:
            length = Prop()

        self.assertEqual(Foo.length._name, "length")


if __name__ == "__main__":
    unittest.main()
