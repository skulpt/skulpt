import unittest

class Say(unittest.TestCase):

    def test_say(self):
        say("It works")

    def test_sayParams(self):
        with self.assertRaises(TypeError):
            say(1)
        with self.assertRaises(TypeError):
            say("too", "many")

if __name__ == "__main__":
    unittest.main()
