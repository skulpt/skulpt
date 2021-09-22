import unittest
import document

class ClearTestCase(unittest.TestCase):

    def test_setCanvasSize(self):
        expectedBackgroundColour = "rgb(40, 42, 54)"
        clear(DRACULA_BACKGROUND)
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
