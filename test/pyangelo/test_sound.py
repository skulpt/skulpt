import unittest

TEST_FILE = "https://www.pyangelo.com/samples/music/we-are-haileybury-8-bit.mp3"

class SoundTestCase(unittest.TestCase):
    def setUp(self):
        self.sound = Sound(TEST_FILE)

    def test_constructor_stores_filename(self):
        self.assertIn("we-are-haileybury-8-bit.mp3", repr(self.sound))

    def test_play_and_isPlaying(self):
        self.sound.play()
        self.assertTrue(self.sound.isPlaying())
        self.sound.pause()
        sleep(0.1)
        self.assertFalse(self.sound.isPlaying())

    def test_pause_and_resume(self):
        self.sound.play()
        sleep(0.1)
        self.sound.pause()
        pos1 = self.sound.seek()
        sleep(0.1)
        self.sound.play()
        sleep(0.1)
        pos2 = self.sound.seek()
        self.assertGreater(pos2, pos1)

    def test_stop_resets_playback(self):
        self.sound.play()
        sleep(0.1)
        self.sound.stop()
        self.assertFalse(self.sound.isPlaying())
        self.assertEqual(0.0, self.sound.seek())

    def test_seek_before_and_after_play(self):
        # before ever playing
        self.assertEqual(0.0, self.sound.seek())
        # set a pre-play position
        self.sound.seek(2.5)
        self.assertAlmostEqual(2.5, self.sound.seek(), places=3)
        # play honors that start point
        self.sound.play()
        sleep(0.05)
        self.assertGreater(self.sound.seek(), 2.5)

    def test_rate_set_get(self):
        self.assertEqual(1.0, self.sound.rate())
        self.sound.rate(1.5)
        self.assertEqual(1.5, self.sound.rate())
        with self.assertRaises(TypeError):
            self.sound.rate("fast")
        with self.assertRaises(ValueError):
            self.sound.rate(0.0)   # must be > 0

    def test_volume_set_get(self):
        self.assertEqual(1.0, self.sound.volume())
        self.sound.volume(0.3)
        self.assertAlmostEqual(0.3, self.sound.volume(), places=3)
        with self.assertRaises(TypeError):
            self.sound.volume("loud")
        with self.assertRaises(ValueError):
            self.sound.volume(2.0)  # must be between 0.0 and 1.0

    def test_loop_and_mute(self):
        # loop
        self.assertFalse(self.sound.loop())
        self.sound.loop(True)
        self.assertTrue(self.sound.loop())
        with self.assertRaises(TypeError):
            self.sound.loop(123)
        # mute
        self.assertFalse(self.sound.mute())
        self.sound.mute(True)
        self.assertTrue(self.sound.mute())
        with self.assertRaises(TypeError):
            self.sound.mute("quiet")

    def test_fade_and_duration(self):
        dur = self.sound.duration()
        self.assertIsInstance(dur, float)
        # fade over 0.1 seconds
        self.sound.play()
        self.sound.fade(1.0, 0.0, 0.1)
        # invalid fades
        with self.assertRaises(ValueError):
            self.sound.fade(-1, 0, 0.1)
        with self.assertRaises(ValueError):
            self.sound.fade(0, 2, 0.1)
        with self.assertRaises(ValueError):
            self.sound.fade(0, 1, -0.1)

    def test_stopAll_static(self):
        s1 = Sound(TEST_FILE)
        s2 = Sound(TEST_FILE)
        s1.play()
        s2.play()
        Sound.stopAll()
        sleep(0.1)
        self.assertFalse(s1.isPlaying())
        self.assertFalse(s2.isPlaying())

    def test_invalid_seek_args(self):
        with self.assertRaises(TypeError):
            self.sound.seek("not a number")
        with self.assertRaises(ValueError):
            self.sound.seek(self.sound.duration() + 10)

    def test_initial_states(self):
        # before any play
        self.assertFalse(self.sound.isPlaying())
        self.assertGreater(self.sound.duration(), 0.0)

    def test_file_attribute_and_repr(self):
        self.assertIn("we-are-haileybury-8-bit.mp3", repr(self.sound))

    def test_dispose_returns_none(self):
        self.assertIsNone(self.sound.dispose())

    def test_dispose_stops_playback(self):
        self.sound.play()
        sleep(0.05)
        self.sound.dispose()
        self.assertFalse(self.sound.isPlaying())

    def test_instance_stopAll(self):
        s1 = Sound(TEST_FILE)
        s2 = Sound(TEST_FILE)
        s1.play()
        s2.play()
        s1.stopAll()
        sleep(0.2)
        self.assertFalse(s1.isPlaying())
        self.assertFalse(s2.isPlaying())

if __name__ == "__main__":
    unittest.main()
