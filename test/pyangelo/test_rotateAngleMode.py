import unittest

class RotateAngleModeTestCase(unittest.TestCase):

    def test_rotateAngleModeRadiansPositiveJavascript(self):
        angleMode(RADIANS)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, JAVASCRIPT)

        background(bgColour, bgColour, bgColour)
        saveState()
        translate(100, 100)
        rotate(1)
        fill(rectColour, rectColour, rectColour)
        rect(0, 0, 50, 50)
        restoreState()
        c = getPixelColour(125, 110)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)
        c = getPixelColour(95, 150)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)

    def test_rotateAngleModeRadiansPositive(self):
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
        c = getPixelColour(125, 110)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)
        c = getPixelColour(95, 150)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)

    def test_rotateAngleModeRadiansNegative(self):
        angleMode(RADIANS)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, CARTESIAN)

        background(bgColour, bgColour, bgColour)
        saveState()
        translate(100, 100)
        rotate(-1)
        fill(rectColour, rectColour, rectColour)
        rect(0, 0, 50, 50)
        restoreState()
        c = getPixelColour(110, 125)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)
        c = getPixelColour(155, 95)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)

    def test_rotateAngleModeDegreesNegative(self):
        angleMode(DEGREES)
        bgColour = 100
        rectColour = 200
        setCanvasSize(200, 200, CARTESIAN)
        background(bgColour, bgColour, bgColour)
        saveState()
        translate(100, 100)
        rotate(-90)
        fill(rectColour, rectColour, rectColour)
        rect(0, 0, 50, 50)
        restoreState()
        c = getPixelColour(125, 125)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)
        c = getPixelColour(125, 75)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)

    def test_rotateAngleModeDegreesPositive(self):
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
        c = getPixelColour(125, 125)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)
        c = getPixelColour(75, 125)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)

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
