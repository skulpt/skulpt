import unittest

class MapToRangeTestCase(unittest.TestCase):

    def test_mapToRange(self):
        self.assertEqual(mapToRange(1, 0, 10, 0, 100), 10)
        self.assertEqual(mapToRange(-10, 0, 100, 0, 1000), -100)
        self.assertEqual(mapToRange(-10, 0, 100, 0, 1000, True), 0)
        self.assertEqual(mapToRange(25, 0, 100, 100, 0, False), 75)

    def test_mapToRangeParameterTypes(self):
        with self.assertRaises(TypeError):
            mapToRange()
        with self.assertRaises(TypeError):
            mapToRange(1, 1)
        with self.assertRaises(TypeError):
            mapToRange(1, 1, 2, 4)
        with self.assertRaises(TypeError):
            mapToRange("hello", 1, 2, 3, 4)
        with self.assertRaises(TypeError):
            mapToRange(1, "hello", 2, 3, 4)
        with self.assertRaises(TypeError):
            mapToRange(1, 2, "hello", 3, 4)
        with self.assertRaises(TypeError):
            mapToRange(1, 2, 3, "hello", 4)
        with self.assertRaises(TypeError):
            mapToRange(1, 2, 3, 4, "hello")
        with self.assertRaises(TypeError):
            mapToRange(1, 2, 3, 4, 5, 6)

if __name__ == "__main__":
    unittest.main()
