import unittest

class NoFillTestCase(unittest.TestCase):

    def test_noFill(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        strokeColour = 50
        background(bgColour, bgColour, bgColour)
        stroke(strokeColour, strokeColour, strokeColour)
        strokeWeight(3)
        noFill()
        rect(10, 10, 20, 20)
        c = getPixelColour(10, 10)
        self.assertEqual(c.r, strokeColour)
        self.assertEqual(c.g, strokeColour)
        self.assertEqual(c.b, strokeColour)

        c = getPixelColour(30, 30)
        self.assertEqual(c.r, strokeColour)
        self.assertEqual(c.g, strokeColour)
        self.assertEqual(c.b, strokeColour)

        c = getPixelColour(5, 5)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

        c = getPixelColour(15, 15)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_fillParameterTypes(self):
        with self.assertRaises(TypeError):
            fill("takes no parameters")

if __name__ == "__main__":
    unittest.main()
