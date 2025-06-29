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
        self.assertEqual(c.red, strokeColour)
        self.assertEqual(c.green, strokeColour)
        self.assertEqual(c.blue, strokeColour)

        c = getPixelColour(30, 30)
        self.assertEqual(c.red, strokeColour)
        self.assertEqual(c.green, strokeColour)
        self.assertEqual(c.blue, strokeColour)

        c = getPixelColour(5, 5)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

        c = getPixelColour(15, 15)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_fillParameterTypes(self):
        with self.assertRaises(TypeError):
            fill("takes no parameters")

if __name__ == "__main__":
    unittest.main()
