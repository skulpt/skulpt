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
        self.assertEqual(c.red, circleColour)
        self.assertEqual(c.green, circleColour)
        self.assertEqual(c.blue, circleColour)
        c = getPixelColour(100, 100)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_circleModeCenter(self):
        circleMode(CENTER)
        bgColour = 100
        circleColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        fill(circleColour, circleColour, circleColour)
        circle(100, 100, 50)
        c = getPixelColour(100, 100)
        self.assertEqual(c.red, circleColour)
        self.assertEqual(c.green, circleColour)
        self.assertEqual(c.blue, circleColour)
        c = getPixelColour(150, 150)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_circleModeParameterTypes(self):
        with self.assertRaises(TypeError):
            circleMode("Hello")
        with self.assertRaises(TypeError):
            circleMode()

if __name__ == "__main__":
    unittest.main()
