import unittest

class CircleTestCase(unittest.TestCase):

    def test_circle(self):
        setCanvasSize(200, 200, CARTESIAN)
        bgColour = 0
        circleColour = 255
        background(bgColour, bgColour, bgColour)
        fill(circleColour, circleColour, circleColour)
        circle(100, 100, 10)

        c = getPixelColour(100, 100)
        self.assertEqual(c.red, circleColour)
        self.assertEqual(c.green, circleColour)
        self.assertEqual(c.blue, circleColour)

        c = getPixelColour(80, 80)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_circleParameterTypes(self):
        with self.assertRaises(TypeError):
            circle()
        with self.assertRaises(TypeError):
            circle(1, 1)
        with self.assertRaises(TypeError):
            circle(1, 1, 2, 4)
        with self.assertRaises(TypeError):
            circle("hello", 1, 2)
        with self.assertRaises(TypeError):
            circle(1, "hello", 2)
        with self.assertRaises(TypeError):
            circle(1, 2, "hello")

if __name__ == "__main__":
    unittest.main()
