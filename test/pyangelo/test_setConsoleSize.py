import unittest
import document

class SetConsoleSizeTestCase(unittest.TestCase):

    def test_setConsoleSizeNotInt(self):
        with self.assertRaises(TypeError):
            setConsoleSize("not an int")

    def test_setConsoleSizeWithinRange(self):
        with self.assertRaises(TypeError):
            setConsoleSize(99)
        with self.assertRaises(TypeError):
            setConsoleSize(2001)

    def test_setConsoleSize200(self):
        setConsoleSize(200)
        console = document.getElementById('console')
        console_height = console.style.height
        self.assertEqual(console_height, "200px")

    def test_setConsoleSize600(self):
        setConsoleSize(600)
        console = document.getElementById('console')
        console_height = console.style.height
        self.assertEqual(console_height, "600px")

if __name__ == "__main__":
    unittest.main()
