import unittest

class ShearYTestCase(unittest.TestCase):

    def test_shearY(self):
        setCanvasSize(640, 360, CARTESIAN)
        bgColour = 100
        rectColour = 200
        background(bgColour, bgColour, bgColour)
        fill(rectColour, rectColour, rectColour)
        saveState()
        translate(250, 200)
        shearY(45)
        rect(0, 0, 30, 30)
        restoreState()
        c = getPixelColour(270, 210)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)
        c = getPixelColour(255, 215)
        self.assertEqual(c.r, rectColour)
        self.assertEqual(c.g, rectColour)
        self.assertEqual(c.b, rectColour)

    def test_shearYParameterTypes(self):
        with self.assertRaises(TypeError):
            shearY("Hello")
        with self.assertRaises(TypeError):
            shearY()
        with self.assertRaises(TypeError):
            applyMatrix(0, 0)

if __name__ == "__main__":
    unittest.main()
