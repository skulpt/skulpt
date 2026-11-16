import unittest


class TestSkulptGui(unittest.TestCase):
    def test_runestone_assertion_feedback(self):
        from unittest.gui import TestCaseGui

        # Runestone exercises put several grading assertions in one method.
        class Exercise(TestCaseGui):
            def __init__(self):
                self.rows = []

            def appendResult(self, passed, actual, expected, notes):
                self.rows.append((passed, actual, expected, notes))

            def test_checks(self):
                self.assertEqual(4, 4, feedback="sum of 2 and 2")
                self.assertAlmostEqual(4, 3, places=3, feedback="sum of 1 and 2")
                with self.assertRaises(ValueError):
                    raise TypeError("wrong exception")
                self.assertEqual(4, 6, feedback="sum of 3 and 3")

        exercise = Exercise()
        exercise.test_checks()
        self.assertEqual(exercise.rows, [
            (True, 4, 4, "sum of 2 and 2"),
            (False, 4, 3, "sum of 1 and 2"),
            (False, "TypeError", "ValueError", "Expected ValueError but got TypeError"),
            (False, 4, 6, "sum of 3 and 3"),
        ])

    def test_feedback_keyword_is_gui_only(self):
        with self.assertRaises(TypeError):
            unittest.TestCase().assertEqual(4, 4, feedback="sum")


if __name__ == "__main__":
    unittest.main()
