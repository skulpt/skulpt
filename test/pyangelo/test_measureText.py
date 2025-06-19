import unittest

class MeasureTextTestCase(unittest.TestCase):

    def test_measureText20(self):
        expectedResult = {
            'width': 45.576171875,
            'actualBoundingBoxLeft': -1,
            'actualBoundingBoxRight': 45.453125,
            'fontBoundingBoxAscent': 1.484375,
            'fontBoundingBoxDescent': 20.515625,
            'actualBoundingBoxAscent': -0.515625,
            'actualBoundingBoxDescent': 16.515625
        }
        actualResult = measureText("Hello", 20, "Arial")
        self.assertEqual(actualResult["width"], expectedResult["width"])
        self.assertEqual(actualResult["actualBoundingBoxLeft"], expectedResult["actualBoundingBoxLeft"])
        self.assertEqual(actualResult["actualBoundingBoxRight"], expectedResult["actualBoundingBoxRight"])
        self.assertEqual(actualResult["fontBoundingBoxAscent"], expectedResult["fontBoundingBoxAscent"])
        self.assertEqual(actualResult["fontBoundingBoxDescent"], expectedResult["fontBoundingBoxDescent"])
        self.assertEqual(actualResult["actualBoundingBoxAscent"], expectedResult["actualBoundingBoxAscent"])
        self.assertEqual(actualResult["actualBoundingBoxDescent"], expectedResult["actualBoundingBoxDescent"])

    def test_measureText40(self):
        expectedResult = {
            'width': 91.15234375,
            'actualBoundingBoxLeft': -3,
            'actualBoundingBoxRight': 89.90625,
            'fontBoundingBoxAscent': 3.96875,
            'fontBoundingBoxDescent': 40.03125,
            'actualBoundingBoxAscent': -2.03125,
            'actualBoundingBoxDescent': 32.03125
        }
        actualResult = measureText("Hello", 40, "Arial")
        self.assertEqual(actualResult["width"], expectedResult["width"])
        self.assertEqual(actualResult["actualBoundingBoxLeft"], expectedResult["actualBoundingBoxLeft"])
        self.assertEqual(actualResult["actualBoundingBoxRight"], expectedResult["actualBoundingBoxRight"])
        self.assertEqual(actualResult["fontBoundingBoxAscent"], expectedResult["fontBoundingBoxAscent"])
        self.assertEqual(actualResult["fontBoundingBoxDescent"], expectedResult["fontBoundingBoxDescent"])
        self.assertEqual(actualResult["actualBoundingBoxAscent"], expectedResult["actualBoundingBoxAscent"])
        self.assertEqual(actualResult["actualBoundingBoxDescent"], expectedResult["actualBoundingBoxDescent"])

    def test_measureTextParameterTypes(self):
        with self.assertRaises(TypeError):
            measureText("Hello")
        with self.assertRaises(TypeError):
            measureText("Hello", "Not a number", "Arial")
        with self.assertRaises(TypeError):
            measureText("Hello", 20, 20)

if __name__ == "__main__":
    unittest.main()
