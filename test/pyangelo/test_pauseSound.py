import unittest
from time import sleep

class PauseSoundTestCase(unittest.TestCase):

    def test_pauseSound(self):
        file = "https://www.pyangelo.com/samples/music/we-are-haileybury-8-bit.mp3"
        sound = loadSound(file)
        playSound(sound)
        pauseSound(sound)
        self.assertEqual(file, sound)

    def test_pauseSoundParameterTypes(self):
        with self.assertRaises(TypeError):
            pauseSound()
        with self.assertRaises(TypeError):
            pauseSound("sound", "toomanyparameters")

    def test_pauseSoundNotLoaded(self):
        with self.assertRaises(IOError):
            pauseSound("has not been loaded")

if __name__ == "__main__":
    unittest.main()
