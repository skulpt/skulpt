import unittest
# PyAngelo injects: setTextColour, setHighlightColour, clear, RED, DRACULA_* constants

class SetTextColourTestCase(unittest.TestCase):

    def test_setTextColour_valid_inputs(self):
        # integer greyscale
        setTextColour(100)

        # CSS strings
        setTextColour("#abc")
        setTextColour("rgb(10,20,30)")
        setTextColour("rgba(10,20,30,0.5)")
        setTextColour("rgb(100%, 0%, 50%)")
        setTextColour("aqua")

        # list / tuple
        setTextColour([10, 20, 30])
        setTextColour([10, 20, 30, 0.25])
        setTextColour((40, 50, 60))
        setTextColour((40, 50, 60, 0.75))

        # direct Colour instance
        setTextColour(Colour(10, 20, 30, 0.5))
        self.assertTrue(True)

    def test_setTextColourParameterTypes(self):
        # no args → TypeError
        with self.assertRaises(TypeError):
            setTextColour()

        # invalid CSS string → ValueError
        with self.assertRaises(ValueError):
            setTextColour("Hello")

        # wrong number of args (two numbers) → ValueError, since Colour(1,2) is invalid alpha
        with self.assertRaises(ValueError):
            setTextColour(1, 2)

    def test_textFunctions(self):
        # ensure chaining still works
        clear(DRACULA_BACKGROUND)
        setTextColour(DRACULA_GREEN)
        setHighlightColour(DRACULA_SELECTION)
        # no exception thrown
        self.assertTrue(True)

if __name__ == "__main__":
    unittest.main()
