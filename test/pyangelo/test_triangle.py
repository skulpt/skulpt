import unittest

class TriangleTestCase(unittest.TestCase):

    def test_triangle(self):
        setCanvasSize(100, 100, CARTESIAN)
        bgColour = 100
        triangleColour = 200
        background(bgColour, bgColour, bgColour)
        fill(triangleColour, triangleColour, triangleColour)
        triangle(0, 0, 0, 99, 99, 0)

        c = getPixelColour(10, 10)
        self.assertEqual(c.red, triangleColour)
        self.assertEqual(c.green, triangleColour)
        self.assertEqual(c.blue, triangleColour)

        c = getPixelColour(90, 90)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_triangleParameterTypes(self):
        with self.assertRaises(TypeError):
            triangle()
        with self.assertRaises(TypeError):
            triangle(1, 2)
        with self.assertRaises(TypeError):
            triangle(1, 2, 3)
        with self.assertRaises(TypeError):
            triangle(1, 2, 3, 4)
        with self.assertRaises(TypeError):
            triangle(1, 2, 3, 4, 5)
        with self.assertRaises(TypeError):
            triangle("hello", 1, 2, 20, 10, 10)
        with self.assertRaises(TypeError):
            triangle(1, "hello", 2, 20, 10, 10)
        with self.assertRaises(TypeError):
            triangle(1, 2, 20, "hello", 10, 10)
        with self.assertRaises(TypeError):
            triangle(1, 2, 20, 10, "hello", 10)
        with self.assertRaises(TypeError):
            triangle(1, 2, 20, 10, 10, "hello")

if __name__ == "__main__":
    unittest.main()
