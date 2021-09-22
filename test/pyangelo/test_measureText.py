import unittest

class MeasureTextTestCase(unittest.TestCase):

    def test_measureText20(self):
        expectedResult = {
            'width': 45.576171875,
            'actualBoundingBoxLeft': -1,
            'actualBoundingBoxRight': 45.453125,
            'fontBoundingBoxAscent': 2.484375,
            'fontBoundingBoxDescent': 19.515625,
            'actualBoundingBoxAscent': -0.515625,
            'actualBoundingBoxDescent': 15.515625
        }
        actualResult = measureText("Hello", 20, "Arial")
        self.assertEqual(actualResult, expectedResult)


    def test_measureText40(self):
        expectedResult = {
            'width': 91.15234375,
            'actualBoundingBoxLeft': -3,
            'actualBoundingBoxRight': 89.90625,
            'fontBoundingBoxAscent': 4.96875,
            'fontBoundingBoxDescent': 39.03125,
            'actualBoundingBoxAscent': -1.03125,
            'actualBoundingBoxDescent': 31.03125
        }
        actualResult = measureText("Hello", 40, "Arial")
        self.assertEqual(actualResult, expectedResult)

    def test_measureTextParameterTypes(self):
        with self.assertRaises(TypeError):
            measureText("Hello")
        with self.assertRaises(TypeError):
            measureText("Hello", "Not a number", "Arial")
        with self.assertRaises(TypeError):
            measureText("Hello", 20, 20)

if __name__ == "__main__":
    unittest.main()
