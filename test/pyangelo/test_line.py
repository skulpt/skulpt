import unittest

class LineTestCase(unittest.TestCase):

    def test_line(self):
        setCanvasSize(200, 200, CARTESIAN)
        bgColour = 0
        lineColour = 255
        background(bgColour, bgColour, bgColour)
        stroke(lineColour, lineColour, lineColour)
        strokeWeight(3)
        fill(lineColour, lineColour, lineColour)
        line(0, 0, 199, 199)
        c = getPixelColour(100, 100)
        self.assertEqual(c.red, lineColour)
        self.assertEqual(c.green, lineColour)
        self.assertEqual(c.blue, lineColour)

    def test_lineParameterTypes(self):
        with self.assertRaises(TypeError):
            line()
        with self.assertRaises(TypeError):
            line(1, 1)
        with self.assertRaises(TypeError):
            line(1, 1, 2)
        with self.assertRaises(TypeError):
            line("hello", 1, 2, 3)
        with self.assertRaises(TypeError):
            line(1, "hello", 2, 3)
        with self.assertRaises(TypeError):
            line(1, 2, "hello", 3)
        with self.assertRaises(TypeError):
            line(1, 2, 2, "hello")

if __name__ == "__main__":
    unittest.main()
