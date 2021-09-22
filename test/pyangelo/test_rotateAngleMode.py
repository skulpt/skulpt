import unittest

class RotateAngleModeTestCase(unittest.TestCase):

    def test_rotateAngleModeRadians(self):
        angleMode(RADIANS)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, CARTESIAN)

        background(bgColour, bgColour, bgColour)
        saveState()
        translate(100, 100)
        rotate(1)
        fill(rectColour, rectColour, rectColour)
        rect(0, 0, 50, 50)
        restoreState()
        c = getPixelColour(110, 105)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)
        c = getPixelColour(110, 125)
        self.assertEqual(c.r, rectColour)
        self.assertEqual(c.g, rectColour)
        self.assertEqual(c.b, rectColour)

    def test_rotateAngleModeDegrees(self):
        angleMode(DEGREES)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        saveState()
        translate(100, 100)
        rotate(90)
        fill(rectColour, rectColour, rectColour)
        rect(0, 0, 50, 50)
        restoreState()
        c = getPixelColour(105, 145)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)
        c = getPixelColour(95, 135)
        self.assertEqual(c.r, rectColour)
        self.assertEqual(c.g, rectColour)
        self.assertEqual(c.b, rectColour)

    def test_rotateParameterTypes(self):
        with self.assertRaises(TypeError):
            rotate("Hello")
        with self.assertRaises(TypeError):
            rotate()

    def test_angleModeParameterTypes(self):
        with self.assertRaises(TypeError):
            angleMode("Hello")
        with self.assertRaises(TypeError):
            angleMode()

if __name__ == "__main__":
    unittest.main()
