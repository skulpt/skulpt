import unittest
import document

class ClearTestCase(unittest.TestCase):

    def test_clear(self):
        expectedBackgroundColour = "rgb(181, 137, 0)"
        clear(YELLOW)
        console = document.getElementById('console')
        colour = console.getCSS('backgroundColor')
        self.assertEqual(colour, expectedBackgroundColour)

    def test_clear_no_params(self):
        expectedBackgroundColour = "rgb(40, 42, 54)"
        clear()
        console = document.getElementById('console')
        colour = console.getCSS('backgroundColor')
        self.assertEqual(colour, expectedBackgroundColour)

    def test_clearParameters(self):
        with self.assertRaises(TypeError):
            clear("not an int")
        with self.assertRaises(TypeError):
            clear(RED, GREEN)

if __name__ == "__main__":
    unittest.main()
