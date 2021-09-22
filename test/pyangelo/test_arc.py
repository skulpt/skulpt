import unittest

class ArcTestCase(unittest.TestCase):

    def test_arc(self):
        setCanvasSize(100, 100, JAVASCRIPT)
        bgColour = 100
        arcColour = 200
        background(bgColour, bgColour, bgColour)
        fill(arcColour, arcColour, arcColour)
        arc(50, 50, 40, 30, 0, 270)

        c = getPixelColour(50, 50)
        self.assertEqual(c.r, arcColour)
        self.assertEqual(c.g, arcColour)
        self.assertEqual(c.b, arcColour)

        c = getPixelColour(70, 30)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

    def test_arcParameterTypes(self):
        with self.assertRaises(TypeError):
            arc()
        with self.assertRaises(TypeError):
            arc(1, 2)
        with self.assertRaises(TypeError):
            arc(1, 2, 3)
        with self.assertRaises(TypeError):
            arc(1, 2, 3, 4)
        with self.assertRaises(TypeError):
            arc(1, 2, 3, 4, 5)
        with self.assertRaises(TypeError):
            arc("hello", 1, 2, 20, 10, 10)
        with self.assertRaises(TypeError):
            arc(1, "hello", 2, 20, 10, 10)
        with self.assertRaises(TypeError):
            arc(1, 2, 20, "hello", 10, 10)
        with self.assertRaises(TypeError):
            arc(1, 2, 20, 10, "hello", 10)
        with self.assertRaises(TypeError):
            arc(1, 2, 20, 10, 10, "hello")

if __name__ == "__main__":
    unittest.main()
