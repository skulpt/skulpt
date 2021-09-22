import unittest

class StrokeWeightTestCase(unittest.TestCase):

    def test_strokeWeightThree(self):
        setCanvasSize(640, 360, CARTESIAN)
        bgColour = 100
        lineColour = 200
        background(bgColour, bgColour, bgColour)
        stroke(lineColour, lineColour, lineColour)
        strokeWeight(3)
        fill(lineColour, lineColour, lineColour)
        line(5, 0, 5, 360)
        c = getPixelColour(5, 10)
        self.assertEqual(c.r, lineColour)
        self.assertEqual(c.g, lineColour)
        self.assertEqual(c.b, lineColour)

        c = getPixelColour(12, 10)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_strokeWeightFive(self):
        setCanvasSize(640, 360, CARTESIAN)
        bgColour = 100
        lineColour = 200
        background(bgColour, bgColour, bgColour)
        stroke(lineColour, lineColour, lineColour)
        strokeWeight(5)
        fill(lineColour, lineColour, lineColour)
        line(5, 0, 5, 360)
        c = getPixelColour(5, 10)
        self.assertEqual(c.r, lineColour)
        self.assertEqual(c.g, lineColour)
        self.assertEqual(c.b, lineColour)
        c = getPixelColour(10, 10)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_strokeWeightParameterTypes(self):
        with self.assertRaises(TypeError):
            strokeWeight("Hello")
        with self.assertRaises(TypeError):
            strokeWeight()
        with self.assertRaises(TypeError):
            strokeWeight(10, 10)

if __name__ == "__main__":
    unittest.main()
