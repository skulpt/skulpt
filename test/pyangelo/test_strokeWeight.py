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
        self.assertEqual(c.red, lineColour)
        self.assertEqual(c.green, lineColour)
        self.assertEqual(c.blue, lineColour)

        c = getPixelColour(12, 10)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

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
        self.assertEqual(c.red, lineColour)
        self.assertEqual(c.green, lineColour)
        self.assertEqual(c.blue, lineColour)
        c = getPixelColour(10, 10)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_strokeWeightParameterTypes(self):
        with self.assertRaises(TypeError):
            strokeWeight("Hello")
        with self.assertRaises(TypeError):
            strokeWeight()
        with self.assertRaises(TypeError):
            strokeWeight(10, 10)

if __name__ == "__main__":
    unittest.main()
