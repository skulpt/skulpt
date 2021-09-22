import unittest

class WasKeyPressedTestCase(unittest.TestCase):

    def test_wasKeyPressedA(self):
        check = wasKeyPressed(KEY_A)
        self.assertEqual(False, check)

    def test_wasKeyPressedZ(self):
        check = wasKeyPressed(KEY_Z)
        self.assertEqual(False, check)

    def test_isKeyPressedParameterTypes(self):
        with self.assertRaises(TypeError):
            wasKeyPressed()
        with self.assertRaises(TypeError):
            wasKeyPressed(1)
        with self.assertRaises(TypeError):
            wasKeyPressed(KEY_A, KEY_Z)

if __name__ == "__main__":
    unittest.main()
