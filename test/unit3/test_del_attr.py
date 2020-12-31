import unittest


class CustomDelAttr:
    def __init__(self):
        self.a = 42
        self.attr_deleted = "nothing-yet"

    def __delattr__(self, attr_name):
        self.attr_deleted = attr_name


def cls_DerivedCustomDelAttr():
    class DerivedCustomDelAttr(CustomDelAttr):
        def __init__(self):
            CustomDelAttr.__init__(self)
            self.a = 99
            self.derived_attr_deleted = "nothing-yet"

        def __delattr__(self, attr_name):
            self.derived_attr_deleted = attr_name

    return DerivedCustomDelAttr


class CustomDeleteDescriptor:
    def __get__(self, obj, objtype=None):
        return 10

    def __set__(self, obj, value):
        pass

    def __delete__(self, obj):
        obj.custom_delete_called = True


class RaisingCustomDeleteDescriptor:
    def __get__(self, obj, objtype=None):
        return 10

    def __set__(self, obj, value):
        pass

    def __delete__(self, obj):
        obj.cause_an_error = 1 / 0


class WithCustomDeleteDescriptor:
    a = CustomDeleteDescriptor()

    def __init__(self):
        self.custom_delete_called = False


class WithRaisingCustomDeleteDescriptor:
    a = RaisingCustomDeleteDescriptor()


class DelAttrTests(unittest.TestCase):
    def cls_DelInstanceOrClassAttr(self):
        class DelInstanceOrClassAttr:
            a = 42
        return DelInstanceOrClassAttr

    def test_del_instance_attr(self):
        DelInstanceOrClassAttr = self.cls_DelInstanceOrClassAttr()
        x = DelInstanceOrClassAttr()
        x.b = 99
        self.assertEqual(x.b, 99)
        del x.b
        self.assertRaises(AttributeError, lambda: x.b)

    def test_override_then_del_instance_attr(self):
        DelInstanceOrClassAttr = self.cls_DelInstanceOrClassAttr()
        x = DelInstanceOrClassAttr()
        x.a = 99
        self.assertEqual(x.a, 99)
        del x.a
        self.assertEqual(x.a, 42)

    def test_del_class_attr(self):
        cls = self.cls_DelInstanceOrClassAttr()
        del cls.a
        self.assertRaises(AttributeError, lambda: cls.a)

    def test_custom_delattr(self):
        x = CustomDelAttr()
        self.assertEqual(x.a, 42)
        del x.a
        self.assertEqual(x.a, 42)
        self.assertEqual(x.attr_deleted, "a")

    def test_delete_custom_delattr_method(self):
        cls = cls_DerivedCustomDelAttr()
        x = cls()
        self.assertEqual(x.derived_attr_deleted, "nothing-yet")
        self.assertEqual(x.attr_deleted, "nothing-yet")
        del x.a
        self.assertEqual(x.derived_attr_deleted, "a")
        self.assertEqual(x.attr_deleted, "nothing-yet")
        del cls.__delattr__
        del x.a
        self.assertEqual(x.derived_attr_deleted, "a")
        self.assertEqual(x.attr_deleted, "a")

    def test_del_nonexistent_class_attr(self):
        cls = self.cls_DelInstanceOrClassAttr()
        def bad_delete():
            del cls.no_such_attr
        self.assertRaises(AttributeError, bad_delete)

    def test_del_nonexistent_instance_attr(self):
        cls = self.cls_DelInstanceOrClassAttr()
        x = cls()
        def bad_delete():
            del x.no_such_attr
        self.assertRaises(AttributeError, bad_delete)

    def test_custom_delete_descriptor(self):
        x = WithCustomDeleteDescriptor()
        self.assertEqual(x.a, 10)
        self.assertFalse(x.custom_delete_called)
        del x.a
        self.assertEqual(x.a, 10)
        self.assertTrue(x.custom_delete_called)

    def test_raising_custom_delete_descriptor(self):
        x = WithRaisingCustomDeleteDescriptor()
        def bad_delete():
            del x.a
        self.assertRaises(ZeroDivisionError, bad_delete)

    def test_delete_class_dunder(self):
        DelInstanceOrClassAttr = self.cls_DelInstanceOrClassAttr()
        x = DelInstanceOrClassAttr()
        def bad_delete():
            del x.__class__
        self.assertRaises(TypeError, bad_delete)


if __name__ == "__main__":
    unittest.main()
