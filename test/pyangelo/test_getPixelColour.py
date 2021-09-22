import unittest

class GetPixelColourTestCase(unittest.TestCase):

    def test_getPixelColourCartesian(self):
        setCanvasSize(50, 50, CARTESIAN)
        bgColour = 100
        fillColour = 235
        background(bgColour, bgColour, bgColour)
        fill(fillColour, fillColour, fillColour)
        rect(0, 0, 20, 20)
        c = getPixelColour(10, 10)
        self.assertEqual(c.r, fillColour)
        self.assertEqual(c.g, fillColour)
        self.assertEqual(c.b, fillColour)

        c = getPixelColour(30, 30)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_getPixelColourJavaScript(self):
        setCanvasSize(50, 50, JAVASCRIPT)
        bgColour = 100
        fillColour = 235
        background(bgColour, bgColour, bgColour)
        fill(fillColour, fillColour, fillColour)
        rect(0, 0, 20, 20)
        c = getPixelColour(10, 10)
        self.assertEqual(c.r, fillColour)
        self.assertEqual(c.g, fillColour)
        self.assertEqual(c.b, fillColour)

        c = getPixelColour(30, 30)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_getPixelColourParameterTypes(self):
        with self.assertRaises(TypeError):
            getPixelColour()
        with self.assertRaises(TypeError):
            getPixelColour(1)
        with self.assertRaises(TypeError):
            getPixelColour(1, "notanumber")
        with self.assertRaises(TypeError):
            getPixelColour("notanumber", 2)

if __name__ == "__main__":
    unittest.main()
