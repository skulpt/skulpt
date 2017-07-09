import unittest

class TestFixture():
    def default(self):
        return True

    def delete(self):
        return True

class Test_ReservedWords(unittest.TestCase):
    def test_getattr(self):
        f = TestFixture()
        func_default = getattr(f, "default")
        self.assertTrue(func_default())

        func_delete = getattr(f, "delete")
        self.assertTrue(func_delete())

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

if __name__ == '__main__':
    unittest.main()
