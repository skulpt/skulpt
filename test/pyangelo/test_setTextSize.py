import unittest

class SetTextSizeTestCase(unittest.TestCase):

    def test_setTextSize(self):
        setTextSize(100)
        # We are simply testing that the call did not fail
        self.assertEqual(True, True)

    def test_fillParameterTypes(self):
        with self.assertRaises(TypeError):
            setTextSize()
        with self.assertRaises(TypeError):
            setTextSize(7)
        with self.assertRaises(TypeError):
            setTextSize(129)
        with self.assertRaises(TypeError):
            setTextSize(15.5)

if __name__ == "__main__":
    unittest.main()
