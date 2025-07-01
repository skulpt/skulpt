import unittest

class ColourTestCase(unittest.TestCase):
    def test_hex3_format(self):
        c = Colour("#abc")
        self.assertEqual(c.red, 170)
        self.assertEqual(c.green, 187)
        self.assertEqual(c.blue, 204)
        self.assertAlmostEqual(c.alpha, 1.0, places=3)

    def test_hex4_format(self):
        c = Colour("#abcd")
        self.assertEqual(c.red, 170)
        self.assertEqual(c.green, 187)
        self.assertEqual(c.blue, 204)
        # alpha = 0xdd / 255
        self.assertAlmostEqual(c.alpha, 221/255.0, places=3)

    def test_hex6_format(self):
        c = Colour("#aabbcc")
        self.assertEqual(c.red, 170)
        self.assertEqual(c.green, 187)
        self.assertEqual(c.blue, 204)
        self.assertAlmostEqual(c.alpha, 1.0, places=3)

    def test_hex8_format(self):
        c = Colour("#11223344")
        self.assertEqual(c.red, 17)
        self.assertEqual(c.green, 34)
        self.assertEqual(c.blue, 51)
        # alpha = 0x44 / 255
        self.assertAlmostEqual(c.alpha, 68/255.0, places=3)

    def test_rgb_integer_format(self):
        c = Colour("rgb(255, 0, 128)")
        self.assertEqual(c.red, 255)
        self.assertEqual(c.green, 0)
        self.assertEqual(c.blue, 128)
        self.assertAlmostEqual(c.alpha, 1.0, places=3)

    def test_rgb_percent_format(self):
        c = Colour("rgb(100%, 0%, 50%)")
        self.assertEqual(c.red, 255)
        self.assertEqual(c.green, 0)
        self.assertEqual(c.blue, 128)
        self.assertAlmostEqual(c.alpha, 1.0, places=3)

    def test_rgba_integer_format(self):
        c = Colour("rgba(10, 20, 30, 0.5)")
        self.assertEqual(c.red, 10)
        self.assertEqual(c.green, 20)
        self.assertEqual(c.blue, 30)
        self.assertAlmostEqual(c.alpha, 0.5, places=3)

    def test_rgba_percent_format(self):
        c = Colour("rgba(0%, 50%, 100%, 25%)")
        self.assertEqual(c.red, 0)
        self.assertEqual(c.green, 128)
        self.assertEqual(c.blue, 255)
        expected_alpha = 25 * 255 / 100 / 255.0
        self.assertAlmostEqual(c.alpha, expected_alpha, places=3)

    def test_named_colour(self):
        c = Colour("aqua")
        self.assertEqual(c.red, 0)
        self.assertEqual(c.green, 255)
        self.assertEqual(c.blue, 255)
        self.assertAlmostEqual(c.alpha, 1.0, places=3)

    def test_numeric_rgb_constructor(self):
        c = Colour(10, 20, 30)
        self.assertEqual(c.red, 10)
        self.assertEqual(c.green, 20)
        self.assertEqual(c.blue, 30)
        self.assertAlmostEqual(c.alpha, 1.0, places=3)

    def test_numeric_rgba_constructor(self):
        c = Colour(100, 150, 200, 0.25)
        self.assertEqual(c.red, 100)
        self.assertEqual(c.green, 150)
        self.assertEqual(c.blue, 200)
        self.assertAlmostEqual(c.alpha, 0.25, places=3)

    def test_property_setters_and_getters(self):
        c = Colour(0, 0, 0, 1.0)
        c.red = 100
        self.assertEqual(c.red, 100)
        with self.assertRaises(TypeError): c.red = "x"
        with self.assertRaises(ValueError): c.red = 300

        c.green = 120
        self.assertEqual(c.green, 120)
        with self.assertRaises(TypeError): c.green = None
        with self.assertRaises(ValueError): c.green = -10

        c.blue = 130
        self.assertEqual(c.blue, 130)
        with self.assertRaises(TypeError): c.blue = []
        with self.assertRaises(ValueError): c.blue = 256

        c.alpha = 0.75
        self.assertAlmostEqual(c.alpha, 0.75, places=3)
        with self.assertRaises(TypeError): c.alpha = "a"
        with self.assertRaises(ValueError): c.alpha = 2.0

    def test_css_output(self):
        c = Colour(10, 20, 30, 0.257)
        # alpha rounded to 2 decimals
        self.assertEqual(c.css(), "rgba(10, 20, 30, 0.26)")

    def test_repr(self):
        c = Colour(1, 2, 3, 0.4)
        self.assertEqual(repr(c), "Colour(1, 2, 3, 0.4)")

    def test_invalid_constructor(self):
        with self.assertRaises(ValueError): Colour("notacolour")
        with self.assertRaises(ValueError): Colour(1, 2)

    def test_list_constructor_rgb(self):
        # 3-element list → RGB, alpha defaults to 1.0
        c = Colour([10, 20, 30])
        self.assertEqual(c.red, 10)
        self.assertEqual(c.green, 20)
        self.assertEqual(c.blue, 30)
        self.assertAlmostEqual(c.alpha, 1.0, places=3)

    def test_list_constructor_rgba(self):
        # 4-element list → RGBA
        c = Colour([60, 70, 80, 0.25])
        self.assertEqual(c.red, 60)
        self.assertEqual(c.green, 70)
        self.assertEqual(c.blue, 80)
        expected_alpha = 0.25
        self.assertAlmostEqual(c.alpha, expected_alpha, places=3)

    def test_tuple_constructor_rgb(self):
        # 3-element tuple → RGB, alpha defaults to 1.0
        c = Colour((100, 110, 120))
        self.assertEqual(c.red, 100)
        self.assertEqual(c.green, 110)
        self.assertEqual(c.blue, 120)
        self.assertAlmostEqual(c.alpha, 1.0, places=3)

    def test_tuple_constructor_rgba(self):
        # 4-element tuple → RGBA
        c = Colour((130, 140, 150, 0.75))
        self.assertEqual(c.red, 130)
        self.assertEqual(c.green, 140)
        self.assertEqual(c.blue, 150)
        expected_alpha = 0.75
        self.assertAlmostEqual(c.alpha, expected_alpha, places=3)

    def test_list_invalid_length(self):
        # lists/tuples must be length 3 or 4
        with self.assertRaises(ValueError):
            Colour([1, 2])        # too short
        with self.assertRaises(ValueError):
            Colour([1, 2, 3, 4, 5])  # too long

    def test_tuple_invalid_length(self):
        with self.assertRaises(ValueError):
            Colour((1,))           # too short
        with self.assertRaises(ValueError):
            Colour((1, 2, 3, 4, 5))  # too long

if __name__ == "__main__":
    unittest.main()
