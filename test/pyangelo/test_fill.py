import unittest

class FillTestCase(unittest.TestCase):

    def test_fill(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        fillColour = 200
        background(bgColour, bgColour, bgColour)
        fill(fillColour, fillColour, fillColour)
        rect(10, 10, 20, 20)
        c = getPixelColour(5, 5)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

        c = getPixelColour(15, 15)
        self.assertEqual(c.red, fillColour)
        self.assertEqual(c.green, fillColour)
        self.assertEqual(c.blue, fillColour)

    def test_fill_defaults(self):
        setCanvasSize(100, 100, CARTESIAN)
        background()
        fill()
        rect(10, 10, 20, 20)
        c = getPixelColour(5, 5)
        self.assertEqual(c.red, 220)
        self.assertEqual(c.green, 220)
        self.assertEqual(c.blue, 220)

        c = getPixelColour(15, 15)
        self.assertEqual(c.red, 255)
        self.assertEqual(c.green, 255)
        self.assertEqual(c.blue, 255)

    def test_fillParameterTypes(self):
        with self.assertRaises(TypeError):
            fill("not an int", 100, 100)
        with self.assertRaises(TypeError):
            fill(100, "not an int", 100)
        with self.assertRaises(TypeError):
            fill(100, 100, "not an int")
        with self.assertRaises(TypeError):
            fill(100, 100, 100, "not an int")

if __name__ == "__main__":
    unittest.main()
