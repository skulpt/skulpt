import unittest

class PointTestCase(unittest.TestCase):

    def test_pointOne(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        pointColour = 200
        background(bgColour, bgColour, bgColour)
        stroke(pointColour, pointColour, pointColour)
        point(10, 10)
        c = getPixelColour(10, 10)
        self.assertEqual(c.red, pointColour)
        self.assertEqual(c.green, pointColour)
        self.assertEqual(c.blue, pointColour)

        c = getPixelColour(0, 0)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_pointFive(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        pointColour = 200
        stroke(pointColour, pointColour, pointColour)
        strokeWeight(5)
        background(bgColour, bgColour, bgColour)
        fill(pointColour, pointColour, pointColour)
        point(10, 10)
        c = getPixelColour(10, 10)
        self.assertEqual(c.red, pointColour)
        self.assertEqual(c.green, pointColour)
        self.assertEqual(c.blue, pointColour)

        c = getPixelColour(0, 0)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_fillRestored(self):
        setCanvasSize(100, 100, JAVASCRIPT)
        bgColour = 100
        fillColour = 200
        pointColour = 255
        background(bgColour, bgColour, bgColour)
        fill(fillColour, fillColour, fillColour)
        stroke(pointColour, pointColour, pointColour)
        point(10, 10)
        c = getPixelColour(10, 10)
        self.assertEqual(c.red, pointColour)
        self.assertEqual(c.green, pointColour)
        self.assertEqual(c.blue, pointColour)
        rect(70, 70, 10, 10)
        c = getPixelColour(75, 75)
        self.assertEqual(c.red, fillColour)
        self.assertEqual(c.green, fillColour)
        self.assertEqual(c.blue, fillColour)


    def test_pointParameterTypes(self):
        with self.assertRaises(TypeError):
            point()
        with self.assertRaises(TypeError):
            point(1)
        with self.assertRaises(TypeError):
            point(1, 2, 3)
        with self.assertRaises(TypeError):
            point("hello", 1)
        with self.assertRaises(TypeError):
            point(1, "hello")

if __name__ == "__main__":
    unittest.main()
