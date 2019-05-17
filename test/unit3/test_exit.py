__author__ = "leszek"

import unittest

class ExitTest(unittest.TestCase):
    def test_exit(self):
        try:
            exit()
            self.fail("Should not reach line after exit")
        except SystemExit as e:
            return
        self.fail("Test should have returned")

    def test_exit_not_exception(self):
        try:
            try:
                exit()
            except Exception as e:
                self.fail("except Exception should not catch SystemExit")
            self.fail("Should not reach line after exit")
        except SystemExit as e:
            return
        self.fail("Test should have returned")

    def test_exit_in_func(self):
        try:
            def foo():
                exit()
            exit()
            self.fail("Should not reach line after exit")
        except SystemExit as e:
            return
        self.fail("Test should have returned")

    def test_import_exit(self):
        try:
            import exiting_module
            self.fail("Should not reach line after import")
        except SystemExit as e:
            return
        self.fail("Test should have returned")


if __name__ == "__main__":
    unittest.main()
