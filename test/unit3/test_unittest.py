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


# Selected from CPython Lib/test/test_unittest/test_case.py at 18ef0f0cb52.
# Uses its LoggingTestCase and supported LoggingResult callbacks from support.py.
class Test:
    class LoggingTestCase(unittest.TestCase):
            """A test case which logs its calls."""

            def __init__(self, events):
                super(Test.LoggingTestCase, self).__init__('test')
                self.events = events

            def setUp(self):
                self.events.append('setUp')

            def test(self):
                self.events.append('test')

            def tearDown(self):
                self.events.append('tearDown')


class LoggingResult(unittest.TestResult):

    def __init__(self, log):
        self._events = log
        super().__init__()

    def startTest(self, test):
        self._events.append('startTest')
        super().startTest(test)

    def startTestRun(self):
        self._events.append('startTestRun')
        super().startTestRun()

    def stopTest(self, test):
        self._events.append('stopTest')
        super().stopTest(test)

    def stopTestRun(self):
        self._events.append('stopTestRun')
        super().stopTestRun()

    def addFailure(self, *args):
        self._events.append('addFailure')
        super().addFailure(*args)

    def addSuccess(self, *args):
        self._events.append('addSuccess')
        super().addSuccess(*args)

    def addError(self, *args):
        self._events.append('addError')
        super().addError(*args)

    def addSkip(self, *args):
        self._events.append('addSkip')
        super().addSkip(*args)


class TestCaseRun(unittest.TestCase):

    def test_run_call_order__error_in_setUp(self):
        events = []
        result = LoggingResult(events)

        class Foo(Test.LoggingTestCase):
            def setUp(self):
                super(Foo, self).setUp()
                raise RuntimeError('raised by Foo.setUp')

        Foo(events).run(result)
        expected = ['startTest', 'setUp', 'addError', 'stopTest']
        self.assertEqual(events, expected)

    def test_run_call_order__failure_in_test(self):
        events = []
        result = LoggingResult(events)

        class Foo(Test.LoggingTestCase):
            def test(self):
                super(Foo, self).test()
                self.fail('raised by Foo.test')

        expected = ['startTest', 'setUp', 'test',
                    'addFailure', 'tearDown', 'stopTest']
        Foo(events).run(result)
        self.assertEqual(events, expected)

    def test_run_call_order__error_in_tearDown(self):
        events = []
        result = LoggingResult(events)

        class Foo(Test.LoggingTestCase):
            def tearDown(self):
                super(Foo, self).tearDown()
                raise RuntimeError('raised by Foo.tearDown')

        Foo(events).run(result)
        expected = ['startTest', 'setUp', 'test', 'tearDown', 'addError',
                    'stopTest']
        self.assertEqual(events, expected)

    def test_failureException__default(self):
        class Foo(unittest.TestCase):
            def test(self):
                pass

        self.assertIs(Foo('test').failureException, AssertionError)

    def test_failureException__subclassing__implicit_raise(self):
        events = []
        result = LoggingResult(events)

        class Foo(unittest.TestCase):
            def test(self):
                self.fail("foo")

            failureException = RuntimeError

        self.assertIs(Foo('test').failureException, RuntimeError)


        Foo('test').run(result)
        expected = ['startTest', 'addFailure', 'stopTest']
        self.assertEqual(events, expected)

    def test_run__returns_given_result(self):

        class Foo(unittest.TestCase):
            def test(self):
                pass

        result = unittest.TestResult()

        retval = Foo('test').run(result)
        self.assertIs(retval, result)

    def test_call__invoking_an_instance_delegates_to_run(self):
        resultIn = unittest.TestResult()
        resultOut = unittest.TestResult()

        class Foo(unittest.TestCase):
            def test(self):
                pass

            def run(self, result):
                self.assertIs(result, resultIn)
                return resultOut

        retval = Foo('test')(resultIn)

        self.assertIs(retval, resultOut)

    # From CPython Lib/test/test_unittest/test_skipping.py at 18ef0f0cb52.
    def test_skipping(self):
        class Foo(unittest.TestCase):
            def defaultTestResult(self):
                return LoggingResult(events)
            def test_skip_me(self):
                self.skipTest("skip")
        events = []
        result = LoggingResult(events)
        test = Foo("test_skip_me")
        self.assertIs(test.run(result), result)
        self.assertEqual(events, ['startTest', 'addSkip', 'stopTest'])
        self.assertEqual(result.skipped, [(test, "skip")])

        events = []
        result = test.run()
        self.assertEqual(events, ['startTestRun', 'startTest', 'addSkip',
                                  'stopTest', 'stopTestRun'])
        self.assertEqual(result.skipped, [(test, "skip")])
        self.assertEqual(result.testsRun, 1)

        # Try letting setUp skip the test now.
        class Foo(unittest.TestCase):
            def defaultTestResult(self):
                return LoggingResult(events)
            def setUp(self):
                self.skipTest("testing")
            def test_nothing(self): pass
        events = []
        result = LoggingResult(events)
        test = Foo("test_nothing")
        self.assertIs(test.run(result), result)
        self.assertEqual(events, ['startTest', 'addSkip', 'stopTest'])
        self.assertEqual(result.skipped, [(test, "testing")])
        self.assertEqual(result.testsRun, 1)

        events = []
        result = test.run()
        self.assertEqual(events, ['startTestRun', 'startTest', 'addSkip',
                                  'stopTest', 'stopTestRun'])
        self.assertEqual(result.skipped, [(test, "testing")])
        self.assertEqual(result.testsRun, 1)

    def test_raising_assertions(self):
        # Run the CPython test_assertions.py body through the single-test API.
        class Assertions(unittest.TestCase):
            def test_assertRaises(self):
                def _raise(e):
                    raise e
                self.assertRaises(KeyError, _raise, KeyError)
                self.assertRaises(KeyError, _raise, KeyError("key"))
                try:
                    self.assertRaises(KeyError, lambda: None)
                except self.failureException as e:
                    self.assertIn("KeyError not raised", str(e))
                else:
                    self.fail("assertRaises() didn't fail")
                try:
                    self.assertRaises(KeyError, _raise, ValueError)
                except ValueError:
                    pass
                else:
                    self.fail("assertRaises() didn't let exception pass through")
                with self.assertRaises(KeyError) as cm:
                    try:
                        raise KeyError
                    except Exception as e:
                        exc = e
                        raise
                self.assertIs(cm.exception, exc)

                with self.assertRaises(KeyError):
                    raise KeyError("key")
                try:
                    with self.assertRaises(KeyError):
                        pass
                except self.failureException as e:
                    self.assertIn("KeyError not raised", str(e))
                else:
                    self.fail("assertRaises() didn't fail")
                try:
                    with self.assertRaises(KeyError):
                        raise ValueError
                except ValueError:
                    pass
                else:
                    self.fail("assertRaises() didn't let exception pass through")

        result = Assertions("test_assertRaises").run()
        self.assertEqual(result.failures, [])
        self.assertEqual(result.errors, [])


# From CPython Lib/test/test_unittest/test_runner.py at 18ef0f0cb52.
class CustomError(Exception):
    pass


class TestCM:
    def __init__(self, ordering, enter_result=None):
        self.ordering = ordering
        self.enter_result = enter_result

    def __enter__(self):
        self.ordering.append('enter')
        return self.enter_result

    def __exit__(self, *exc_info):
        self.ordering.append('exit')


class TestCleanUp(unittest.TestCase):

    def testCleanUp(self):
        class TestableTest(unittest.TestCase):
            def testNothing(self):
                pass

        test = TestableTest('testNothing')
        self.assertEqual(test._cleanups, [])

        cleanups = []

        def cleanup1(*args, **kwargs):
            cleanups.append((1, args, kwargs))

        def cleanup2(*args, **kwargs):
            cleanups.append((2, args, kwargs))

        test.addCleanup(cleanup1, 1, 2, 3, four='hello', five='goodbye')
        test.addCleanup(cleanup2)

        self.assertEqual(test._cleanups,
                         [(cleanup1, (1, 2, 3), dict(four='hello', five='goodbye')),
                          (cleanup2, (), {})])

        self.assertTrue(test.doCleanups())
        self.assertEqual(cleanups, [(2, (), {}), (1, (1, 2, 3), dict(four='hello', five='goodbye'))])

    def testCleanupInRun(self):
        blowUp = False
        ordering = []

        class TestableTest(unittest.TestCase):
            def setUp(self):
                ordering.append('setUp')
                test.addCleanup(cleanup2)
                if blowUp:
                    raise CustomError('foo')

            def testNothing(self):
                ordering.append('test')
                test.addCleanup(cleanup3)

            def tearDown(self):
                ordering.append('tearDown')

        test = TestableTest('testNothing')

        def cleanup1():
            ordering.append('cleanup1')
        def cleanup2():
            ordering.append('cleanup2')
        def cleanup3():
            ordering.append('cleanup3')
        test.addCleanup(cleanup1)

        def success(some_test):
            self.assertEqual(some_test, test)
            ordering.append('success')

        result = unittest.TestResult()
        result.addSuccess = success

        test.run(result)
        self.assertEqual(ordering, ['setUp', 'test', 'tearDown', 'cleanup3',
                                    'cleanup2', 'cleanup1', 'success'])

        blowUp = True
        ordering = []
        test = TestableTest('testNothing')
        test.addCleanup(cleanup1)
        test.run(result)
        self.assertEqual(ordering, ['setUp', 'cleanup2', 'cleanup1'])

    def test_enterContext(self):
        class TestableTest(unittest.TestCase):
            def testNothing(self):
                pass

        test = TestableTest('testNothing')
        cleanups = []

        test.addCleanup(cleanups.append, 'cleanup1')
        cm = TestCM(cleanups, 42)
        self.assertEqual(test.enterContext(cm), 42)
        test.addCleanup(cleanups.append, 'cleanup2')

        self.assertTrue(test.doCleanups())
        self.assertEqual(cleanups, ['enter', 'cleanup2', 'exit', 'cleanup1'])


if __name__ == '__main__':
    unittest.main()
