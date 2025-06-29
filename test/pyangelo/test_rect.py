import unittest

class RectTestCase(unittest.TestCase):

    def test_rect(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        rectColour = 200
        background(bgColour, bgColour, bgColour)
        fill(rectColour, rectColour, rectColour)
        rect(0, 0, 20, 20)
        c = getPixelColour(10, 10)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)

        c = getPixelColour(30, 30)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_rectParameterTypes(self):
        with self.assertRaises(TypeError):
            rect()
        with self.assertRaises(TypeError):
            rect(1)
        with self.assertRaises(TypeError):
            rect(1, 2, 3)
        with self.assertRaises(TypeError):
            rect(1, 2, 3, 4, 5)
        with self.assertRaises(TypeError):
            rect("hello", 1, 2, 3)
        with self.assertRaises(TypeError):
            rect(1, "hello", 3, 4)
        with self.assertRaises(TypeError):
            rect(1, 2, "hello", 4)
        with self.assertRaises(TypeError):
            rect(1, 2, 3, "hello")

if __name__ == "__main__":
    unittest.main()
