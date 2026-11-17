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

    def addExpectedFailure(self, *args):
        self._events.append('addExpectedFailure')
        super().addExpectedFailure(*args)

    def addUnexpectedSuccess(self, *args):
        self._events.append('addUnexpectedSuccess')
        super().addUnexpectedSuccess(*args)

    def addSubTest(self, test, subtest, err):
        if err is None:
            self._events.append('addSubTestSuccess')
        else:
            self._events.append('addSubTestFailure')
        super().addSubTest(test, subtest, err)


class LegacyLoggingResult(LoggingResult):
    @property
    def addSubTest(self):
        raise AttributeError


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


# From CPython Lib/test/test_unittest/test_skipping.py at 18ef0f0cb52.
class TestExpectedFailure(unittest.TestCase):

    def test_expected_failure(self):
        class Foo(unittest.TestCase):
            @unittest.expectedFailure
            def test_die(self):
                self.fail("help me!")
        events = []
        result = LoggingResult(events)
        test = Foo("test_die")
        self.assertIs(test.run(result), result)
        self.assertEqual(events,
                         ['startTest', 'addExpectedFailure', 'stopTest'])
        self.assertFalse(result.failures)
        self.assertEqual(result.expectedFailures[0][0], test)
        self.assertFalse(result.unexpectedSuccesses)
        self.assertTrue(result.wasSuccessful())

    def test_expected_failure_with_wrapped_class(self):
        @unittest.expectedFailure
        class Foo(unittest.TestCase):
            def test_1(self):
                self.assertTrue(False)

        events = []
        result = LoggingResult(events)
        test = Foo("test_1")
        self.assertIs(test.run(result), result)
        self.assertEqual(events,
                         ['startTest', 'addExpectedFailure', 'stopTest'])
        self.assertFalse(result.failures)
        self.assertEqual(result.expectedFailures[0][0], test)
        self.assertFalse(result.unexpectedSuccesses)
        self.assertTrue(result.wasSuccessful())

    def test_expected_failure_and_fail_in_cleanup(self):
        class Foo(unittest.TestCase):
            @unittest.expectedFailure
            def test_die(self):
                self.fail("help me!")
            def tearDown(self):
                self.fail("bad tearDown")
        events = []
        result = LoggingResult(events)
        test = Foo("test_die")
        self.assertIs(test.run(result), result)
        self.assertEqual(events,
                         ['startTest', 'addFailure', 'stopTest'])
        self.assertEqual(len(result.failures), 1)
        self.assertIn('AssertionError: bad tearDown', result.failures[0][1])
        self.assertFalse(result.expectedFailures)
        self.assertFalse(result.unexpectedSuccesses)
        self.assertFalse(result.wasSuccessful())

    def test_expected_failure_and_skip_in_cleanup(self):
        class Foo(unittest.TestCase):
            @unittest.expectedFailure
            def test_die(self):
                self.fail("help me!")
            def tearDown(self):
                self.skipTest("skip")
        events = []
        result = LoggingResult(events)
        test = Foo("test_die")
        self.assertIs(test.run(result), result)
        self.assertEqual(events,
                         ['startTest', 'addSkip', 'stopTest'])
        self.assertFalse(result.failures)
        self.assertFalse(result.expectedFailures)
        self.assertFalse(result.unexpectedSuccesses)
        self.assertEqual(result.skipped, [(test, "skip")])
        self.assertTrue(result.wasSuccessful())

    def test_unexpected_success(self):
        class Foo(unittest.TestCase):
            @unittest.expectedFailure
            def test_die(self):
                pass
        events = []
        result = LoggingResult(events)
        test = Foo("test_die")
        self.assertIs(test.run(result), result)
        self.assertEqual(events,
                         ['startTest', 'addUnexpectedSuccess', 'stopTest'])
        self.assertFalse(result.failures)
        self.assertFalse(result.expectedFailures)
        self.assertEqual(result.unexpectedSuccesses, [test])
        self.assertFalse(result.wasSuccessful())


# From CPython Lib/test/test_unittest/test_case.py at 18ef0f0cb52.
class TestSubtests(unittest.TestCase):

    def _check_call_order__subtests(self, result, events, expected_events):
        class Foo(Test.LoggingTestCase):
            def test(self):
                super(Foo, self).test()
                for i in [1, 2, 3]:
                    with self.subTest(i=i):
                        if i == 1:
                            self.fail('failure')
                        for j in [2, 3]:
                            with self.subTest(j=j):
                                if i * j == 6:
                                    raise RuntimeError('raised by Foo.test')
                1 / 0

        # Order is the following:
        # i=1 => subtest failure
        # i=2, j=2 => subtest success
        # i=2, j=3 => subtest error
        # i=3, j=2 => subtest error
        # i=3, j=3 => subtest success
        # toplevel => error
        Foo(events).run(result)
        self.assertEqual(events, expected_events)

    def test_run_call_order__subtests(self):
        events = []
        result = LoggingResult(events)
        expected = ['startTest', 'setUp', 'test',
                    'addSubTestFailure', 'addSubTestSuccess',
                    'addSubTestFailure', 'addSubTestFailure',
                    'addSubTestSuccess', 'addError', 'tearDown', 'stopTest']
        self._check_call_order__subtests(result, events, expected)

    def test_run_call_order__subtests_legacy(self):
        # With a legacy result object (without an addSubTest method),
        # text execution stops after the first subtest failure.
        events = []
        result = LegacyLoggingResult(events)
        expected = ['startTest', 'setUp', 'test',
                    'addFailure', 'tearDown', 'stopTest']
        self._check_call_order__subtests(result, events, expected)

    def _check_call_order__subtests_success(self, result, events, expected_events):
        class Foo(Test.LoggingTestCase):
            def test(self):
                super(Foo, self).test()
                for i in [1, 2]:
                    with self.subTest(i=i):
                        for j in [2, 3]:
                            with self.subTest(j=j):
                                pass

        Foo(events).run(result)
        self.assertEqual(events, expected_events)

    def test_run_call_order__subtests_success(self):
        events = []
        result = LoggingResult(events)
        # The 6 subtest successes are individually recorded, in addition
        # to the whole test success.
        expected = (['startTest', 'setUp', 'test']
                    + 6 * ['addSubTestSuccess']
                    + ['tearDown', 'addSuccess', 'stopTest'])
        self._check_call_order__subtests_success(result, events, expected)

    # From CPython test_case.py.
    def test_run_call_order__subtests_failfast(self):
        events = []
        result = LoggingResult(events)
        result.failfast = True

        class Foo(Test.LoggingTestCase):
            def test(self):
                super(Foo, self).test()
                with self.subTest(i=1):
                    self.fail('failure')
                with self.subTest(i=2):
                    self.fail('failure')
                self.fail('failure')

        expected = ['startTest', 'setUp', 'test',
                    'addSubTestFailure', 'tearDown', 'stopTest']
        Foo(events).run(result)
        self.assertEqual(events, expected)

    # From CPython test_skipping.py.
    def test_expected_failure_subtests(self):
        # A failure in any subtest counts as the expected failure of the
        # whole test.
        class Foo(unittest.TestCase):
            @unittest.expectedFailure
            def test_die(self):
                with self.subTest():
                    # This one succeeds
                    pass
                with self.subTest():
                    self.fail("help me!")
                with self.subTest():
                    # This one doesn't get executed
                    self.fail("shouldn't come here")
        events = []
        result = LoggingResult(events)
        test = Foo("test_die")
        self.assertIs(test.run(result), result)
        self.assertEqual(events,
                         ['startTest', 'addSubTestSuccess',
                          'addExpectedFailure', 'stopTest'])
        self.assertFalse(result.failures)
        self.assertEqual(len(result.expectedFailures), 1)
        self.assertIs(result.expectedFailures[0][0], test)
        self.assertFalse(result.unexpectedSuccesses)
        self.assertTrue(result.wasSuccessful())


if __name__ == '__main__':
    unittest.main()
