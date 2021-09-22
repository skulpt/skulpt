import unittest

class SetHighlightColourTestCase(unittest.TestCase):

    def test_setHighlightColour(self):
        setHighlightColour(GREEN)
        # We are simply testing that the call did not fail
        self.assertEqual(True, True)

    def test_setHighlightColourParameterTypes(self):
        with self.assertRaises(TypeError):
            setHighlightColour()
        with self.assertRaises(TypeError):
            setHighlightColour("Hello")
        with self.assertRaises(TypeError):
            setHighlightColour(1, 2)

if __name__ == "__main__":
    unittest.main()
