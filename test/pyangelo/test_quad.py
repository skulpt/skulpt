import unittest

class QuadTestCase(unittest.TestCase):

    def test_quad(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        quadColour = 200
        background(bgColour, bgColour, bgColour)
        fill(quadColour, quadColour, quadColour)
        quad(0, 10, 10, 0, 90, 99, 99, 90)

        c = getPixelColour(20, 20)
        self.assertEqual(c.red, quadColour)
        self.assertEqual(c.green, quadColour)
        self.assertEqual(c.blue, quadColour)

        c = getPixelColour(0, 0)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_quadParameterTypes(self):
        with self.assertRaises(TypeError):
            quad()
        with self.assertRaises(TypeError):
            quad(1, 2)
        with self.assertRaises(TypeError):
            quad(1, 2, 3)
        with self.assertRaises(TypeError):
            quad(1, 2, 3, 4)
        with self.assertRaises(TypeError):
            quad(1, 2, 3, 4, 5)
        with self.assertRaises(TypeError):
            quad(1, 2, 3, 4, 5, 6)
        with self.assertRaises(TypeError):
            quad(1, 2, 3, 4, 5, 6, 7)
        with self.assertRaises(TypeError):
            quad("hello", 1, 2, 20, 10, 10, 10, 10)
        with self.assertRaises(TypeError):
            quad(1, "hello", 2, 20, 10, 10, 10, 10)
        with self.assertRaises(TypeError):
            quad(1, 2, 20, "hello", 10, 10, 10, 10)
        with self.assertRaises(TypeError):
            quad(1, 2, 20, 10, "hello", 10, 10, 10)
        with self.assertRaises(TypeError):
            quad(1, 2, 20, 10, 10, "hello", 10, 10)
        with self.assertRaises(TypeError):
            quad(1, 2, 20, 10, 10, 10.5, 14.5, "hello")
        with self.assertRaises(TypeError):
            quad(1, 2, 20, 10, 10, 10.5, "hello", 10)

if __name__ == "__main__":
    unittest.main()
