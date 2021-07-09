import unittest


class RaisingDescriptor:
    def __get__(self, obj, objtype=None):
        return obj.no_such_attribute


class WithRaisingDescriptor:
    a = RaisingDescriptor()


class TestRaisingDescriptor(unittest.TestCase):
    def test_raising_descriptor(self):
        x = WithRaisingDescriptor()
        self.assertFalse(hasattr(x, "a"))


if __name__ == "__main__":
    unittest.main()
