import unittest

class DistTestCase(unittest.TestCase):

    def test_dist(self):
        self.assertEqual(dist(0, 0, 3, 4), 5)
        self.assertEqual(dist(10, 20, 13, 24), 5)

    def test_lineParameterTypes(self):
        with self.assertRaises(TypeError):
            dist()
        with self.assertRaises(TypeError):
            dist(1, 1)
        with self.assertRaises(TypeError):
            dist("hello", 1, 2, 3)
        with self.assertRaises(TypeError):
            dist(1, "hello", 2, 3)
        with self.assertRaises(TypeError):
            dist(1, 2, "hello", 3)
        with self.assertRaises(TypeError):
            dist(1, 2, 3, "hello")

if __name__ == "__main__":
    unittest.main()
