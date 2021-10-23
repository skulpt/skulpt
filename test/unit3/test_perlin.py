import perlin
import unittest

class PerlinTest(unittest.TestCase):

    def test_noise(self):
        val = perlin.noise(100)
        self.assertTrue(0 <= val <= 1)
        val2 = perlin.noise(100)
        self.assertEqual(val, val2)

    def test_noise2d(self):
        val = perlin.noise(50, 60)
        self.assertTrue(0 <= val <= 1)
        val2 = perlin.noise(50, 60)
        self.assertEqual(val, val2)

    def test_noise3d(self):
        val = perlin.noise(50, 60, 70)
        self.assertTrue(0 <= val <= 1)
        val2 = perlin.noise(50, 60, 70)
        self.assertEqual(val, val2)

    def test_noiseDetail(self):
        perlin.noiseDetail(24, 0.2)
        val = perlin.noise(50)
        self.assertTrue(0 <= val <= 1)
        val2 = perlin.noise(50)
        self.assertEqual(val, val2)

    def test_noiseSeed(self):
        perlin.noiseDetail(4, 0.5)
        perlin.noiseSeed(10)
        val = perlin.noise(100)
        self.assertAlmostEqual(val, 0.276650807572878, places=10)

if __name__ == "__main__":
    unittest.main()
