import unittest

class SetTextColourTestCase(unittest.TestCase):

    def test_setTextColour(self):
        setTextColour(RED)
        # We are simply testing that the call did not fail
        self.assertEqual(True, True)

    def test_textFunctions(self):
        clear(DRACULA_BACKGROUND)
        setTextColour(DRACULA_GREEN)
        print("Enthusiasm is essential")
        setHighlightColour(DRACULA_SELECTION)
        print("PyAngelo")
        # We are simply testing that the call did not fail
        self.assertEqual(True, True)

    def test_setTextColourParameterTypes(self):
        with self.assertRaises(TypeError):
            setTextColour()
        with self.assertRaises(TypeError):
            setTextColour("Hello")
        with self.assertRaises(TypeError):
            setTextColour(1, 2)

if __name__ == "__main__":
    unittest.main()
