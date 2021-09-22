import unittest
from time import sleep

class StopAllSoundsTestCase(unittest.TestCase):

    def test_stopAllSounds(self):
        file = "https://www.pyangelo.com/samples/music/we-are-haileybury-8-bit.mp3"
        sound = loadSound(file)
        file2 = "https://www.pyangelo.com/samples/music/Lemmings_01.mp3"
        sound2 = loadSound(file2)
        playSound(sound, True)
        playSound(sound2, True)
        stopAllSounds()
        self.assertEqual(file, sound)

    def test_stopAllSoundsParameterTypes(self):
        with self.assertRaises(TypeError):
            stopAllSounds("shouldhavenoparameters")

if __name__ == "__main__":
    unittest.main()
