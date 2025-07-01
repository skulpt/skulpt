import unittest
import math
# The PyAngelo test harness injects:
#    background, setCanvasSize, getPixelColour, CARTESIAN

class BackgroundTestCase(unittest.TestCase):

    def setUp(self):
        # Start each test with a fresh, transparent canvas
        setCanvasSize(20, 20, CARTESIAN)

    def test_background_rgb_digits(self):
        # Opaque RGB
        background(50, 100, 150)
        c = getPixelColour(10, 10)
        self.assertEqual((c.red, c.green, c.blue, c.alpha),
                         (50, 100, 150, 1))

    def test_background_default_parameters(self):
        # No args → default grey = 220, opaque
        background()
        c = getPixelColour(10, 10)
        self.assertEqual((c.red, c.green, c.blue, c.alpha),
                         (220, 220, 220, 1))

    def test_background_half_alpha(self):
        # 50% translucent grey → alpha = round(0.5 * 255) = 128
        background(100, 100, 100, 0.5)
        c = getPixelColour(10, 10)
        self.assertEqual(c.alpha, 128/255)

    def test_background_invalid_string_raises(self):
        # Invalid CSS now raises ValueError from Colour(...)
        with self.assertRaises(ValueError):
            background("not a colour")

    def test_background_hex8_alpha(self):
        # #11223344 → α = 0x44 → 68, so alpha = 68/255
        background("#11223344")
        c = getPixelColour(10, 10)
        self.assertEqual(c.alpha, 68/255)

    def test_background_rgba_integer_alpha(self):
        background("rgba(10, 20, 30, 0.5)")
        c = getPixelColour(10, 10)
        self.assertEqual(c.alpha, 128/255)

    def test_background_rgba_percent_alpha(self):
        # rgba(...,25%) → alpha = round(0.25 * 255) = 64
        background("rgba(0%, 50%, 100%, 25%)")
        c = getPixelColour(10, 10)
        self.assertEqual(c.alpha, round(255 * 0.25) / 255)

    def test_background_list_and_tuple_alpha(self):
        # 4-element list/tuple with alpha
        alpha1 = 0.25
        background([60, 70, 80, alpha1])
        c1 = getPixelColour(10, 10)
        self.assertEqual(c1.alpha, round(255 * alpha1)/255)

        setCanvasSize(20, 20, CARTESIAN)
        alpha2 = 0.75
        background((30, 40, 50, alpha2))
        c2 = getPixelColour(10, 10)
        self.assertEqual(c2.alpha, round(255 * alpha2)/255)

    def test_background_colour_instance_alpha(self):
        # Passing a Colour instance directly
        c_in = Colour(123, 200, 50, 0.2)
        background(c_in)
        c_out = getPixelColour(10, 10)
        self.assertEqual(c_out.alpha, 0.2)


if __name__ == "__main__":
    unittest.main()
