import unittest

class DrawImageTestCase(unittest.TestCase):

    def test_drawImage(self):
        img = Image("https://www.pyangelo.com/images/logos/pyangelo-logo.png")
        self.assertEqual(74, img.width)
        self.assertEqual(55, img.height)
        self.assertEqual("https://www.pyangelo.com/images/logos/pyangelo-logo.png", img.file)

        setCanvasSize(200, 200, CARTESIAN)
        background()
        drawImage(img, 0, 0)

    def test_drawImageIOError(self):
        with self.assertRaises(IOError):
           img = Image("https://www.pyangelo.com/no-such-image.png")

    def test_drawImageParameterTypes(self):
        with self.assertRaises(TypeError):
            drawImage()
        with self.assertRaises(TypeError):
            drawImage(1, 2)
        with self.assertRaises(TypeError):
            drawImage("file", "not a number", "not a number")

if __name__ == "__main__":
    unittest.main()
