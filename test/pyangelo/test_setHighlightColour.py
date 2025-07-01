import unittest
# PyAngelo injects: setHighlightColour, GREEN, etc.

class SetHighlightColourTestCase(unittest.TestCase):

    def test_setHighlightColour_valid_inputs(self):
        # greyscale number
        setHighlightColour(100)

        # CSS strings
        setHighlightColour("#abc")
        setHighlightColour("rgb(10,20,30)")
        setHighlightColour("rgba(10,20,30,0.5)")
        setHighlightColour("aqua")

        # list / tuple
        setHighlightColour([10, 20, 30])
        setHighlightColour([10, 20, 30, 0.25])
        setHighlightColour((40, 50, 60))
        setHighlightColour((40, 50, 60, 0.75))

        # direct Colour instance
        setHighlightColour(Colour(10, 20, 30, 0.5))

        self.assertTrue(True)

    def test_setHighlightColourParameterTypes(self):
        # no args → TypeError
        with self.assertRaises(TypeError):
            setHighlightColour()

        # invalid CSS string → ValueError
        with self.assertRaises(ValueError):
            setHighlightColour("Hello")

        # wrong number of numeric args → ValueError
        with self.assertRaises(ValueError):
            setHighlightColour(1, 2)

    def test_setHighlightHighlights_existing_constant(self):
        # existing palette constants still work
        setHighlightColour(GREEN)
        # no exception, so we just assert True
        self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
