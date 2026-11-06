"""Skulpt runner regressions for skip reporting.

CPython's test_unittest.test_skipping covers related teardown cases
through TestResult. These tests check the summary Skulpt's CI reads.
"""

import sys
import unittest


class TestSkipping(unittest.TestCase):
    def run_case(self, case):
        output = []

        class Output:
            def write(self, text):
                output.append(text)

        stdout = sys.stdout
        sys.stdout = Output()
        try:
            case().main()
        finally:
            sys.stdout = stdout
        return ''.join(output)

    def test_body_skip_runs_teardown(self):
        events = []

        class Case(unittest.TestCase):
            def test_skip(self):
                self.skipTest("skip from the test")

            def tearDown(self):
                events.append("teardown")

        output = self.run_case(Case)
        self.assertEqual(events, ["teardown"])
        self.assertIn("passed: 0 failed: 0 skipped: 1", output)

    def test_skip_preserves_assertion_failure(self):
        for skip_in_teardown in (False, True):
            class Case(unittest.TestCase):
                def test_failure(self):
                    self.fail("intentional failure")
                    if not skip_in_teardown:
                        self.skipTest("skip from the test")

                def tearDown(self):
                    if skip_in_teardown:
                        self.skipTest("skip from teardown")

            output = self.run_case(Case)
            self.assertIn("passed: 0 failed: 1 skipped: 0", output)


if __name__ == '__main__':
    unittest.main()
