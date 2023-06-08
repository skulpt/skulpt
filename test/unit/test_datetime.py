import unittest
from datetime import timedelta
from datetime import timezone

#############################################################################

class TestModule(unittest.TestCase):

    def test_py2(self):
        # see pr 1338
        self.assertIs(timezone.utc, timezone(timedelta(0)))

if __name__ == "__main__":
    unittest.main()
