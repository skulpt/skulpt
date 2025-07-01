import unittest

class FillTestCase(unittest.TestCase):

    def test_fill(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        fillColour = 200
        background(bgColour, bgColour, bgColour)
        fill(fillColour, fillColour, fillColour)
        rect(10, 10, 20, 20)
        c = getPixelColour(5, 5)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

        c = getPixelColour(15, 15)
        self.assertEqual(c.red, fillColour)
        self.assertEqual(c.green, fillColour)
        self.assertEqual(c.blue, fillColour)

    def test_fillParameterTypes(self):
        # All invalid inputs—including non-numeric r/g/b or alpha—now raise ValueError
        with self.assertRaises(TypeError):
            fill("not an int", 100, 100)
        with self.assertRaises(TypeError):
            fill(100, "not an int", 100)
        with self.assertRaises(TypeError):
            fill(100, 100, "not an int")
        with self.assertRaises(TypeError):
            fill(100, 100, 100, "not an int")
        with self.assertRaises(ValueError):
            fill(100, 100, 100, 1.5)

        # An unparseable CSS string also raises ValueError
        # with self.assertRaises(ValueError):
        #     fill("not a colour string")

        # But valid CSS‐strings and Colour instances should not raise
        fill("#abc")
        fill("rgb(10,20,30)")
        fill("rgba(10,20,30,0.5)")
        fill("aqua")

        # And a direct Colour instance is accepted
        c = Colour(50, 60, 70)
        fill(c)

if __name__ == "__main__":
    unittest.main()
