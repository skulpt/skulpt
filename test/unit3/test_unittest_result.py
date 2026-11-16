# Selected from CPython's Lib/test/test_unittest/test_result.py.
import unittest


class CPythonCases:
    class Test_TextTestResult(unittest.TestCase):
        def testGetSubTestDescriptionWithoutDocstring(self):
            case_name = __name__ + '.' + type(self).__qualname__
            with self.subTest(foo=1, bar=2):
                result = unittest.TextTestResult(None, True, 1)
                self.assertEqual(
                        result.getDescription(self._subtest),
                        'testGetSubTestDescriptionWithoutDocstring (' + case_name +
                        '.testGetSubTestDescriptionWithoutDocstring) (foo=1, bar=2)')

            with self.subTest('some message'):
                result = unittest.TextTestResult(None, True, 1)
                self.assertEqual(
                        result.getDescription(self._subtest),
                        'testGetSubTestDescriptionWithoutDocstring (' + case_name +
                        '.testGetSubTestDescriptionWithoutDocstring) [some message]')

        def testGetSubTestDescriptionForFalseValues(self):
            expected = 'testGetSubTestDescriptionForFalseValues (%s.%s.testGetSubTestDescriptionForFalseValues) [%s]'
            result = unittest.TextTestResult(None, True, 1)
            for arg in [0, None, []]:
                with self.subTest(arg):
                    self.assertEqual(
                        result.getDescription(self._subtest),
                        expected % (__name__, type(self).__qualname__, arg)
                    )

        def testGetDuplicatedNestedSubTestDescriptionWithoutDocstring(self):
            case_name = __name__ + '.' + type(self).__qualname__
            with self.subTest(foo=1, bar=2):
                with self.subTest(baz=3, bar=4):
                    result = unittest.TextTestResult(None, True, 1)
                    self.assertEqual(
                            result.getDescription(self._subtest),
                            'testGetDuplicatedNestedSubTestDescriptionWithoutDocstring '
                            '(' + case_name + '.testGetDuplicatedNestedSubTestDescriptionWithoutDocstring) (baz=3, bar=4, foo=1)')


class TestTextResult(unittest.TestCase):
    def test_cpython_subtest_descriptions(self):
        # These CPython cases need the active result set by TestCase.run.
        suite = unittest.defaultTestLoader.loadTestsFromTestCase(CPythonCases.Test_TextTestResult)
        result = suite.run(unittest.TestResult())
        self.assertEqual(result.testsRun, 3)
        self.assertTrue(result.wasSuccessful(), result.failures + result.errors)


class TestSkulptRegressions(unittest.TestCase):
    def test_runner_accepts_a_result_subclass_with_no_constructor_override(self):
        class CustomResult(unittest.TestResult):
            pass

        class Case(unittest.TestCase):
            def test_pass(self):
                pass

        class SilentStream:
            def write(self, text):
                pass

            def flush(self):
                pass

        runner = unittest.TextTestRunner(stream=SilentStream(), resultclass=CustomResult)
        result = runner.run(unittest.TestSuite([Case('test_pass')]))
        self.assertIsInstance(result, CustomResult)
        self.assertTrue(result.wasSuccessful())
        self.assertEqual(result.testsRun, 1)


if __name__ == "__main__":
    unittest.main()
