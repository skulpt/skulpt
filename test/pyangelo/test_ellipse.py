import unittest

class LineTestCase(unittest.TestCase):

    def test_ellipse(self):
        setCanvasSize(200, 200, CARTESIAN)
        bgColour = 0
        ellipseColour = 255
        background(bgColour, bgColour, bgColour)
        fill(ellipseColour, ellipseColour, ellipseColour)
        ellipse(100, 100, 10, 20)

        c = getPixelColour(100, 100)
        self.assertEqual(c.r, ellipseColour)
        self.assertEqual(c.g, ellipseColour)
        self.assertEqual(c.b, ellipseColour)

        c = getPixelColour(80, 80)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_ellipseParameterTypes(self):
        with self.assertRaises(TypeError):
            ellipse()
        with self.assertRaises(TypeError):
            ellipse(1, 1)
        with self.assertRaises(TypeError):
            ellipse(1, 1, 4)
        with self.assertRaises(TypeError):
            ellipse("hello", 1, 2, 20)
        with self.assertRaises(TypeError):
            ellipse(1, "hello", 2, 20)
        with self.assertRaises(TypeError):
            ellipse(1, 2, 20, "hello")

if __name__ == "__main__":
    unittest.main()
