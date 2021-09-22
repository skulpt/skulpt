import unittest

class CircleModeTestCase(unittest.TestCase):

    def test_circleModeCorner(self):
        circleMode(CORNER)
        bgColour = 100
        circleColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        fill(circleColour, circleColour, circleColour)
        circle(100, 100, 50)
        c = getPixelColour(150, 150)
        self.assertEqual(c.r, circleColour)
        self.assertEqual(c.g, circleColour)
        self.assertEqual(c.b, circleColour)
        c = getPixelColour(100, 100)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_circleModeCenter(self):
        circleMode(CENTER)
        bgColour = 100
        circleColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        fill(circleColour, circleColour, circleColour)
        circle(100, 100, 50)
        c = getPixelColour(100, 100)
        self.assertEqual(c.r, circleColour)
        self.assertEqual(c.g, circleColour)
        self.assertEqual(c.b, circleColour)
        c = getPixelColour(150, 150)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_circleModeParameterTypes(self):
        with self.assertRaises(TypeError):
            circleMode("Hello")
        with self.assertRaises(TypeError):
            circleMode()

if __name__ == "__main__":
    unittest.main()
