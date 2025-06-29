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
        self.assertEqual(c.red, arcColour)
        self.assertEqual(c.green, arcColour)
        self.assertEqual(c.blue, arcColour)

        c = getPixelColour(70, 30)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

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
