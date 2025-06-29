import unittest

class BackgroundTestCase(unittest.TestCase):

    def test_background(self):
        red = 50
        green = 100
        blue = 150
        alpha = 255
        setCanvasSize(20, 20, CARTESIAN)
        background(red, green, blue)
        bgColour = getPixelColour(10, 10)
        self.assertEqual(bgColour.red, red)
        self.assertEqual(bgColour.green, green)
        self.assertEqual(bgColour.blue, blue)
        self.assertEqual(bgColour.alpha, alpha)

    def test_background_default_parameters(self):
        setCanvasSize(20, 20, CARTESIAN)
        background()
        bgColour = getPixelColour(10, 10)
        self.assertEqual(bgColour.red, 220)
        self.assertEqual(bgColour.green, 220)
        self.assertEqual(bgColour.blue, 220)
        self.assertEqual(bgColour.alpha, 255)

    def test_background_half_alpha(self):
        red = 100
        green = 100
        blue = 100
        alpha = 128 # 0.5 in background call
        setCanvasSize(20, 20, CARTESIAN)
        background(red, green, blue, 0.5)
        bgColour = getPixelColour(10, 10)
        self.assertEqual(bgColour.red, red)
        self.assertEqual(bgColour.green, green)
        self.assertEqual(bgColour.blue, blue)
        self.assertEqual(bgColour.alpha, alpha)

    def test_backgroundNotInt(self):
        with self.assertRaises(TypeError):
            background("not an int", 100, 100)
        with self.assertRaises(TypeError):
            background(100, "not an int", 100)
        with self.assertRaises(TypeError):
            background(100, 100, "not an int")
        with self.assertRaises(TypeError):
            background(100, 100, 100, "not an int")

if __name__ == "__main__":
    unittest.main()
