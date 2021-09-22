import unittest
import document

class NoCanvasTestCase(unittest.TestCase):

    def test_noCanvas(self):
        noCanvas()
        self.assertEqual(width, 0)
        self.assertEqual(height, 0)
        canvas = document.getElementById('canvas')
        display = canvas.getCSS('display')
        self.assertEqual(display, "none")
        canvas_width = canvas.getAttribute("width")
        self.assertEqual(int(canvas_width), 0)
        canvas_height = canvas.getAttribute("height")
        self.assertEqual(int(canvas_height), 0)

if __name__ == "__main__":
    unittest.main()
