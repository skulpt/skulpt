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
        self.assertEqual(c.r, pointColour)
        self.assertEqual(c.g, pointColour)
        self.assertEqual(c.b, pointColour)

        c = getPixelColour(0, 0)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

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
        self.assertEqual(c.r, pointColour)
        self.assertEqual(c.g, pointColour)
        self.assertEqual(c.b, pointColour)

        c = getPixelColour(0, 0)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

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
        self.assertEqual(c.r, pointColour)
        self.assertEqual(c.g, pointColour)
        self.assertEqual(c.b, pointColour)
        rect(70, 70, 10, 10)
        c = getPixelColour(75, 75)
        self.assertEqual(c.r, fillColour)
        self.assertEqual(c.g, fillColour)
        self.assertEqual(c.b, fillColour)


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
