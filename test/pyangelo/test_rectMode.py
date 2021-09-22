import unittest

class RectModeTestCase(unittest.TestCase):

    def test_rectModeCorners(self):
        rectMode(CORNERS)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        fill(rectColour, rectColour, rectColour)
        rect(100, 100, 50, 50)
        c = getPixelColour(105, 105)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)
        c = getPixelColour(95, 95)
        self.assertEqual(c.r, rectColour)
        self.assertEqual(c.g, rectColour)
        self.assertEqual(c.b, rectColour)

    def test_rectModeCenter(self):
        rectMode(CENTER)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        fill(rectColour, rectColour, rectColour)
        rect(100, 100, 50, 50)
        c = getPixelColour(100, 100)
        self.assertEqual(c.r, rectColour)
        self.assertEqual(c.g, rectColour)
        self.assertEqual(c.b, rectColour)
        c = getPixelColour(130, 130)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_rectModeCorner(self):
        rectMode(CORNER)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        fill(rectColour, rectColour, rectColour)
        rect(100, 100, 50, 50)
        c = getPixelColour(105, 105)
        self.assertEqual(c.r, rectColour)
        self.assertEqual(c.g, rectColour)
        self.assertEqual(c.b, rectColour)
        c = getPixelColour(95, 95)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_rectModeParameterTypes(self):
        with self.assertRaises(TypeError):
            rectMode("Hello")
        with self.assertRaises(TypeError):
            rectMode()

if __name__ == "__main__":
    unittest.main()
