import unittest

class TextTestCase(unittest.TestCase):

    def test_text(self):
        setCanvasSize(400, 400, CARTESIAN)
        background(255, 255, 255)
        fill(0, 0, 0)
        text("Hello", 0, 0, 100)
        bgColour = getPixelColour(12, 12)
        self.assertEqual(bgColour.r, 0)
        self.assertEqual(bgColour.g, 0)
        self.assertEqual(bgColour.b, 0)

        setCanvasSize(400, 400, JAVASCRIPT)
        background(255, 255, 255)
        fill(0, 0, 0)
        text("Hello", 0, 0, 100)
        bgColour = getPixelColour(12, 12)
        self.assertEqual(bgColour.r, 0)
        self.assertEqual(bgColour.g, 0)
        self.assertEqual(bgColour.b, 0)

    def test_textParameterTypes(self):
        with self.assertRaises(TypeError):
            text("Hello", "not a number", 100, 32)
        with self.assertRaises(TypeError):
            text("Hello", 100.5, "not a number", 32)
        with self.assertRaises(TypeError):
            text("Hello", 100, 100, "not an int")
        with self.assertRaises(TypeError):
            text("Hello", 100, 100, 100.5)
        with self.assertRaises(TypeError):
            text("Hello", 100, 100, "not an int")

if __name__ == "__main__":
    unittest.main()
