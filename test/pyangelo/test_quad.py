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
        self.assertEqual(c.r, quadColour)
        self.assertEqual(c.g, quadColour)
        self.assertEqual(c.b, quadColour)

        c = getPixelColour(0, 0)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

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
