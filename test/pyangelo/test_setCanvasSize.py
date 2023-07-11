import unittest
import document

class SetCanvasSizeTestCase(unittest.TestCase):

    def test_setCanvasSize(self):
        test_width = 1
        test_height = 2
        setCanvasSize(test_width, test_height)
        self.assertEqual(width, test_width)
        self.assertEqual(height, test_height)
        canvas = document.getElementById('canvas')
        display = canvas.style.display
        self.assertEqual(display, "block")
        canvas_width = canvas.getAttribute("width")
        self.assertEqual(int(canvas_width), test_width)
        canvas_height = canvas.getAttribute("height")
        self.assertEqual(int(canvas_height), test_height)

    def test_setCanvasSizeNotInt(self):
        with self.assertRaises(TypeError):
            setCanvasSize("not an int", 1)
        with self.assertRaises(TypeError):
            setCanvasSize(1, "not an int")
        with self.assertRaises(TypeError):
            setCanvasSize(1, 1, "not an int")

if __name__ == "__main__":
    unittest.main()
