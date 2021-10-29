import unittest

class ConstrainTestCase(unittest.TestCase):

    def test_constrain(self):
        self.assertEqual(constrain(1, 10, 20), 10)
        self.assertEqual(constrain(30, 10, 20), 20)
        self.assertEqual(constrain(15, 10, 20), 15)

    def test_lineParameterTypes(self):
        with self.assertRaises(TypeError):
            constrain()
        with self.assertRaises(TypeError):
            constrain(1, 1)
        with self.assertRaises(TypeError):
            constrain(1, 1, 2, 4)
        with self.assertRaises(TypeError):
            constrain("hello", 1, 2)
        with self.assertRaises(TypeError):
            constrain(1, "hello", 2)
        with self.assertRaises(TypeError):
            constrain(1, 2, "hello")

if __name__ == "__main__":
    unittest.main()
