import unittest

class GotoTest(unittest.TestCase):

    def test_goto(self):
        x = 0
        label start
        x += 1
        if x < 10:
            goto start
        self.assertEqual(x, 10)

        if x == 10:
            goto end
        x = 20
        label end
        self.assertEqual(x, 10)
        while x < 20:
            x += 1
            if x == 11:
                goto finaltest
        label finaltest
        self.assertEqual(x, 11)

if __name__ == "__main__":
    unittest.main()
