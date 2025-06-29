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
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)
        c = getPixelColour(95, 95)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)

    def test_rectModeCenter(self):
        rectMode(CENTER)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        fill(rectColour, rectColour, rectColour)
        rect(100, 100, 50, 50)
        c = getPixelColour(100, 100)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)
        c = getPixelColour(130, 130)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_rectModeCorner(self):
        rectMode(CORNER)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        fill(rectColour, rectColour, rectColour)
        rect(100, 100, 50, 50)
        c = getPixelColour(105, 105)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)
        c = getPixelColour(95, 95)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_rectModeParameterTypes(self):
        with self.assertRaises(TypeError):
            rectMode("Hello")
        with self.assertRaises(TypeError):
            rectMode()

if __name__ == "__main__":
    unittest.main()
