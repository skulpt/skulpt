import unittest
from time import sleep

class StopSoundTestCase(unittest.TestCase):

    def test_stopSound(self):
        file = "https://www.pyangelo.com/samples/music/we-are-haileybury-8-bit.mp3"
        sound = loadSound(file)
        playSound(sound)
        stopSound(sound)
        self.assertEqual(file, sound)

    def test_stopSoundThatIsLooping(self):
        file = "https://www.pyangelo.com/samples/music/we-are-haileybury-8-bit.mp3"
        sound = loadSound(file)
        playSound(sound, True)
        stopSound(sound)
        self.assertEqual(file, sound)

    def test_stopSoundParameterTypes(self):
        with self.assertRaises(TypeError):
            stopSound()
        with self.assertRaises(TypeError):
            stopSound("sound", "toomanyparameters")

    def test_stopSoundNotLoaded(self):
        with self.assertRaises(IOError):
            stopSound("has not been loaded")

if __name__ == "__main__":
    unittest.main()
