import unittest

class SaveStateRestoreStateTestCase(unittest.TestCase):

    def test_save_and_restore_state(self):
        rectMode(CORNER)
        setCanvasSize(300, 300, CARTESIAN)
        background(255, 255, 255)
        # Save the default state
        fill(0, 0, 255);
        saveState();
        fill(0, 255, 0);
        rect(10, 10, 100, 100);
        # Restore the default state
        restoreState();
        rect(150, 40, 100, 100);

        greenColour = getPixelColour(15, 15)
        blueColour = getPixelColour(160, 50)
        self.assertEqual(greenColour.r, 0)
        self.assertEqual(greenColour.g, 255)
        self.assertEqual(greenColour.b, 0)
        self.assertEqual(blueColour.r, 0)
        self.assertEqual(blueColour.g, 0)
        self.assertEqual(blueColour.b, 255)

    def test_textParameterTypes(self):
        # saveState and restoreState take no args
        with self.assertRaises(TypeError):
            saveState("Hello")
        with self.assertRaises(TypeError):
            restoreState("Hello")

if __name__ == "__main__":
    unittest.main()
