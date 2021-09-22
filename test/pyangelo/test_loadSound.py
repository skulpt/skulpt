import unittest

class LoadSoundTestCase(unittest.TestCase):

    def test_loadSound(self):
        file = "https://www.pyangelo.com/samples/sounds/blip.wav"
        sound = loadSound(file)
        self.assertEqual(file, sound)

    def test_loadSoundParameterTypes(self):
        with self.assertRaises(TypeError):
            loadSound()
        with self.assertRaises(IOError):
            sound = loadSound("https://www.pyangelo.com/no-such-sound.mp3")

if __name__ == "__main__":
    unittest.main()
