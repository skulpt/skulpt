import unittest

class ApplyMatrixTestCase(unittest.TestCase):

    def test_applyMatrix(self):
        setCanvasSize(640, 360)
        bgColour = 100
        rectColour = 200
        background(bgColour, bgColour, bgColour)
        fill(rectColour, rectColour, rectColour, 1)
        for i in range(5):
            applyMatrix(1, i*0.1, i*-0.1, 1, i*30, i*10)
            rect(0, 0, 250, 100)
        c = getPixelColour(250, 350)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)

    def test_applyMatrixParameterTypes(self):
        with self.assertRaises(TypeError):
            applyMatrix(0)
        with self.assertRaises(TypeError):
            applyMatrix(0, 0)
        with self.assertRaises(TypeError):
            applyMatrix(0, 0, 0)
        with self.assertRaises(TypeError):
            applyMatrix(0, 0, 0, 0)
        with self.assertRaises(TypeError):
            applyMatrix(0, 0, 0, 0, 0)

if __name__ == "__main__":
    unittest.main()
