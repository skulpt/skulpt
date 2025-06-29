import unittest

class StrokeTestCase(unittest.TestCase):

    def test_stroke(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        strokeColour = 200
        background(bgColour, bgColour, bgColour)
        stroke(strokeColour, strokeColour, strokeColour)
        strokeWeight(5)
        rect(0, 0, 20, 20)
        c = getPixelColour(1, 1)
        self.assertEqual(c.red, strokeColour)
        self.assertEqual(c.green, strokeColour)
        self.assertEqual(c.blue, strokeColour)

        c = getPixelColour(30, 30)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_stroke_defaults(self):
        setCanvasSize(100, 100, CARTESIAN)
        background()
        stroke()
        strokeWeight(5)
        rect(10, 10, 20, 20)
        c = getPixelColour(11, 11)
        self.assertEqual(c.red, 0)
        self.assertEqual(c.green, 0)
        self.assertEqual(c.blue, 0)

    def test_strokeParameterTypes(self):
        with self.assertRaises(TypeError):
            stroke("not an int", 100, 100)
        with self.assertRaises(TypeError):
            stroke(100, "not an int", 100)
        with self.assertRaises(TypeError):
            stroke(100, 100, "not an int")
        with self.assertRaises(TypeError):
            stroke(100, 100, 100, "not an int")

if __name__ == "__main__":
    unittest.main()
