import unittest
from time import sleep

class SleepyLen():
    def __len__(self):
        sleep(1)
        return 42

class SelfDefinedSleepyLen(unittest.TestCase):

    def test_len(self):
        test = SleepyLen()

        self.assertEqual(42, test.__len__())
        self.assertEqual(42, len(test))

if __name__ == "__main__":
    unittest.main()
