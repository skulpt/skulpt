import unittest

class NoStrokeTestCase(unittest.TestCase):

    def test_noStroke(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        fillColour = 200
        background(bgColour, bgColour, bgColour)
        noStroke()
        fill(fillColour, fillColour, fillColour)
        rect(0, 0, 20, 20)
        c = getPixelColour(0, 0)
        self.assertEqual(c.r, fillColour)
        self.assertEqual(c.g, fillColour)
        self.assertEqual(c.b, fillColour)

        c = getPixelColour(19, 19)
        self.assertEqual(c.r, fillColour)
        self.assertEqual(c.g, fillColour)

    def test_noStrokeParameterTypes(self):
        with self.assertRaises(TypeError):
            stroke("not an int")

if __name__ == "__main__":
    unittest.main()
