import unittest

class TranslateTestCase(unittest.TestCase):

    def test_translate(self):
        gray = 100
        setCanvasSize(400, 400, CARTESIAN)
        background(255, 255, 255)
        saveState()
        fill(gray, gray, gray)
        stroke(100, 100, 100)
        translate(10, 20)
        translate(100, 30)
        rect(0, 0, 10, 10)
        restoreState()
        c = getPixelColour(115, 55)
        self.assertEqual(c.red, gray)
        self.assertEqual(c.green, gray)
        self.assertEqual(c.blue, gray)

    def test_textParameterTypes(self):
        # saveState and restoreState take no args
        with self.assertRaises(TypeError):
            saveState("Hello")
        with self.assertRaises(TypeError):
            restoreState("Hello")

if __name__ == "__main__":
    unittest.main()
