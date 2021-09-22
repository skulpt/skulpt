import unittest

class IsKeyPressedTestCase(unittest.TestCase):

    def test_isKeyPressedA(self):
        check = isKeyPressed(KEY_A)
        self.assertEqual(False, check)

    def test_isKeyPressedZ(self):
        check = isKeyPressed(KEY_Z)
        self.assertEqual(False, check)

    def test_isKeyPressedParameterTypes(self):
        with self.assertRaises(TypeError):
            isKeyPressed()
        with self.assertRaises(TypeError):
            isKeyPressed(1)
        with self.assertRaises(TypeError):
            isKeyPressed(KEY_A, KEY_Z)

if __name__ == "__main__":
    unittest.main()
