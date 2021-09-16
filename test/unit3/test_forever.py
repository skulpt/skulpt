import unittest

class ForeverTest(unittest.TestCase):

    def test_forever(self):
        x = 0
        forever:
            x += 1
            if x > 9:
                break
        self.assertEqual(x, 10)

if __name__ == "__main__":
    unittest.main()
