import unittest
from time import sleep

# replace with any valid test‐image URL accessible during your tests
TEST_FILE = "https://www.pyangelo.com/samples/images/PyAngelo.png"

class ImageTestCase(unittest.TestCase):
    def setUp(self):
        # constructor returns a suspension that your Skulpt test harness should resolve
        self.img = Image(TEST_FILE)

    def test_constructor_stores_filename_in_repr(self):
        # repr(Image) should include the filename
        r = repr(self.img)
        self.assertIn("PyAngelo.png", r)

    def test_default_properties(self):
        # defaults set in initMethod
        self.assertEqual(self.img.opacity, 1.0)
        self.assertEqual(self.img.rotation, 0)
        self.assertEqual(self.img.scale, [1.0, 1.0])
        self.assertIsInstance(self.img.smoothing, bool)
        w, h = self.img.width, self.img.height
        self.assertIsInstance(w, int)
        self.assertIsInstance(h, int)
        self.assertEqual(self.img.frameW, w)
        self.assertEqual(self.img.frameH, h)
        self.assertEqual(self.img.columns, 1)
        self.assertEqual(self.img.rows, 1)
        self.assertFalse(self.img.flipX)
        self.assertFalse(self.img.flipY)

    def test_setOpacity(self):
        self.img.setOpacity(0.3)
        self.assertAlmostEqual(self.img.opacity, 0.3, places=3)
        # clamping
        self.img.setOpacity(-1)
        self.assertEqual(self.img.opacity, 0.0)
        self.img.setOpacity(2)
        self.assertEqual(self.img.opacity, 1.0)
        # wrong type
        with self.assertRaises(TypeError):
            self.img.setOpacity("high")

    def test_setRotation(self):
        from math import pi
        self.img.setRotation(180)
        self.assertAlmostEqual(self.img.rotation, pi, places=6)
        with self.assertRaises(TypeError):
            self.img.setRotation("90deg")

    def test_setScale(self):
        self.img.setScale(2)
        self.assertEqual(self.img.scale, [2.0, 2.0])
        self.img.setScale(2, 3)
        self.assertEqual(self.img.scale, [2.0, 3.0])
        with self.assertRaises(TypeError):
            self.img.setScale("wide")
        with self.assertRaises(TypeError):
            self.img.setScale(2, "tall")

    def test_setSmoothing(self):
        orig = self.img.smoothing
        self.img.setSmoothing(0)
        self.assertFalse(self.img.smoothing)
        self.img.setSmoothing(1)
        self.assertTrue(self.img.smoothing)
        with self.assertRaises(TypeError):
            self.img.setSmoothing("yes")

    def test_setFrameSize(self):
        w, h = self.img.width, self.img.height
        # make two tiles
        self.img.setFrameSize(w//2, h//2)
        self.assertEqual(self.img.frameW, w//2)
        self.assertEqual(self.img.frameH, h//2)
        self.assertEqual(self.img.columns, 2)
        self.assertEqual(self.img.rows, 2)
        with self.assertRaises(TypeError):
            self.img.setFrameSize("10", 10)
        with self.assertRaises(TypeError):
            self.img.setFrameSize(10, "10")
        with self.assertRaises(ValueError):
            self.img.setFrameSize(0, 10)
        with self.assertRaises(ValueError):
            self.img.setFrameSize(10, 0)

    def test_setFlipX_and_setFlipY(self):
        self.img.setFlipX(1)
        self.assertTrue(self.img.flipX)
        self.img.setFlipY(1)
        self.assertTrue(self.img.flipY)
        with self.assertRaises(TypeError):
            self.img.setFlipX(None)
        with self.assertRaises(TypeError):
            self.img.setFlipY("flip")

    def test_setPivot(self):
        # center pivot
        self.img.setPivot("center")
        # Y inverted in CARTESIAN mode, but at minimum this shouldn’t error
        self.img.setPivot(5, 7)
        with self.assertRaises(TypeError):
            self.img.setPivot("left", 5)
        with self.assertRaises(TypeError):
            self.img.setPivot(5, "top")

    def test_str_and_getattr(self):
        s = str(self.img)
        # must include size, opacity, rotation, scale, smoothing, frame, flip
        self.assertIn(f"size={self.img.width}x{self.img.height}", s)
        self.assertIn(f"opacity={self.img.opacity}", s)
        self.assertIn(f"scale={self.img.scale[0]},{self.img.scale[1]}", s)
        # invalid attribute
        with self.assertRaises(AttributeError):
            _ = self.img.nonexistent

    def test_draw_drawRegion_drawFrame_and_errors(self):
        # these should run without exception
        self.img.draw(0, 0)
        self.img.draw(1, 2, 3, 4)
        self.img.drawRegion(0, 0, 10, 10, 5, 5)
        self.img.drawRegion(0, 0, 5, 5, 0, 0, 8, 8)
        self.img.drawFrame(0, 0, 0)
        self.img.drawFrame(1, 5, 5, 10, 10)
        # wrong types
        with self.assertRaises(TypeError):
            self.img.draw("x", 0)
        with self.assertRaises(TypeError):
            self.img.drawRegion(0, 0, "w", 10, 0, 0, 5, 5)
        with self.assertRaises(TypeError):
            self.img.drawFrame(0, 0, "y")
        # disposing first causes draw to fail
        self.img.dispose()
        with self.assertRaises(RuntimeError):
            self.img.draw(0, 0)

    def test_dispose_returns_none(self):
        self.assertIsNone(self.img.dispose())

if __name__ == "__main__":
    unittest.main()
