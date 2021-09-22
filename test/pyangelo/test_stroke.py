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
        self.assertEqual(c.r, strokeColour)
        self.assertEqual(c.g, strokeColour)
        self.assertEqual(c.b, strokeColour)

        c = getPixelColour(30, 30)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_stroke_defaults(self):
        setCanvasSize(100, 100, CARTESIAN)
        background()
        stroke()
        strokeWeight(5)
        rect(10, 10, 20, 20)
        c = getPixelColour(11, 11)
        self.assertEqual(c.r, 0)
        self.assertEqual(c.g, 0)
        self.assertEqual(c.b, 0)

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
