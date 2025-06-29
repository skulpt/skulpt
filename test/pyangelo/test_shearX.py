import unittest

class ShearXTestCase(unittest.TestCase):

    def test_shearX(self):
        setCanvasSize(640, 360, CARTESIAN)
        bgColour = 100
        rectColour = 200
        background(bgColour, bgColour, bgColour)
        fill(rectColour, rectColour, rectColour)
        saveState()
        translate(250, 200)
        shearX(45)
        rect(0, 0, 30, 30)
        restoreState()
        c = getPixelColour(250, 215)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)
        c = getPixelColour(275, 220)
        self.assertEqual(c.red, rectColour)
        self.assertEqual(c.green, rectColour)
        self.assertEqual(c.blue, rectColour)

    def test_shearXParameterTypes(self):
        with self.assertRaises(TypeError):
            shearX("Hello")
        with self.assertRaises(TypeError):
            shearX()
        with self.assertRaises(TypeError):
            applyMatrix(0, 0)

if __name__ == "__main__":
    unittest.main()
