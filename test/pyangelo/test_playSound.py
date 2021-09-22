import unittest

class PlaySoundTestCase(unittest.TestCase):

    def test_playSound(self):
        file = "https://www.pyangelo.com/samples/sounds/blip.wav"
        sound = loadSound(file)
        playSound(sound)
        playSound(sound, False, 0.5)
        playSound(sound, False, 0.1)
        self.assertEqual(file, sound)

    def test_playSoundParameterTypes(self):
        with self.assertRaises(TypeError):
            playSound()
        with self.assertRaises(TypeError):
            playSound("sound", "notaboolean")
        with self.assertRaises(TypeError):
            playSound("sound", False, "notanumber")

    def test_playSoundNotLoaded(self):
        with self.assertRaises(IOError):
            playSound("has not been loaded")

if __name__ == "__main__":
    unittest.main()
