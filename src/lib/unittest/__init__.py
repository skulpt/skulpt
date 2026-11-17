__author__ = 'bmiller'
'''
This is the start of something that behaves like
the unittest module from cpython.

'''
import re
import sys
from contextlib import contextmanager


class SkipTest(Exception):
    """Exception raised to skip a test."""
    pass


def skip(reason):
    """
    Unconditionally skip a test.
    """
    def decorator(test_item):
        test_item.__unittest_skip__ = True
        test_item.__unittest_skip_why__ = reason
        return test_item
    return decorator


def skipIf(condition, reason):
    """
    Skip a test if the condition is true.
    """
    if condition:
        return skip(reason)
    return lambda func: func


def skipUnless(condition, reason):
    """
    Skip a test unless the condition is true.
    """
    if not condition:
        return skip(reason)
    return lambda func: func


def expectedFailure(test_item):
    test_item.__unittest_expecting_failure__ = True
    return test_item


class _UnexpectedSuccess(Exception):
    pass


class _ShouldStop(Exception):
    pass


_subtest_message_unset = object()


class _SubTest(object):
    def __init__(self, test_case, msg, params):
        self.test_case = test_case
        self.msg = msg
        self.params = params

    def __str__(self):
        parts = []
        if self.msg is not _subtest_message_unset:
            parts.append('[%s]' % self.msg)
        if self.params:
            parts.append('(%s)' % ', '.join('%s=%r' % item for item in self.params.items()))
        return ' '.join(parts) or '(<subtest>)'


class _AssertRaisesContext(object):
    """A context manager used to implement TestCase.assertRaises* methods."""
    def __init__(self, expected, test_case, expected_regex=None):
        self.test_case = test_case
        self.expected = expected
        self.exception = None
        if expected_regex is not None:
            expected_regex = re.compile(expected_regex)
        self.expected_regex = expected_regex

    def _is_subtype(self, expected, basetype):
        if isinstance(expected, tuple):
            return all(self._is_subtype(e, basetype) for e in expected)
        return isinstance(expected, type) and issubclass(expected, basetype)

    def handle(self, name, args, kwargs):
        """
        If args is empty, assertRaises is being used as a
        context manager, so return self.
        If args is not empty, call a callable passing positional and keyword
        arguments.
        """
        try:
            if not self._is_subtype(self.expected, BaseException):
                raise TypeError('%s() arg 1 must be an exception type or tuple of exception types'.format(name))
            if not args:
                return self

            callable_obj = args[0]
            args = args[1:]
            with self:
                callable_obj(*args, **kwargs) 

        finally:
            # bpo-23890: manually break a reference cycle
            self = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, tb):
        res = True
        feedback = ""
        self.exception = exc_value
        try:
            act_exc = exc_type.__name__
        except AttributeError:
            act_exc = str(exc_type)
        try:
            exp_exc = self.expected.__name__
        except AttributeError:
            exp_exc = str(self.expected)

        if exc_type is None:
            res = False
            feedback = "{} not raised".format(exp_exc)
        elif not issubclass(exc_type, self.expected):
            if not self.test_case._legacy_assertions:
                return False
            res = False
            feedback = "Expected {} but got {}".format(exp_exc, act_exc)

        elif self.expected_regex is not None:
            expected_regex = self.expected_regex
            if not expected_regex.search(str(exc_value)):
                res = False
                feedback = '"{}" does not match "{}"'.format(expected_regex.pattern, str(exc_value))

        self.test_case.appendResult(res, act_exc, exp_exc, feedback)

        return True


class TestResult(object):
    def __init__(self, stream=None, descriptions=None, verbosity=None):
        self.testsRun = 0
        self.failures = []
        self.errors = []
        self.skipped = []
        self.expectedFailures = []
        self.unexpectedSuccesses = []
        self.failfast = False
        self.shouldStop = False

    def startTestRun(self):
        pass

    def stopTestRun(self):
        pass

    def startTest(self, test):
        self.testsRun += 1

    def stopTest(self, test):
        pass

    def addSuccess(self, test):
        pass

    def addFailure(self, test, err):
        if self.failfast:
            self.stop()
        self.failures.append((test, self._exc_info_to_string(err)))

    def addError(self, test, err):
        if self.failfast:
            self.stop()
        self.errors.append((test, self._exc_info_to_string(err)))

    def _exc_info_to_string(self, err):
        if sys.version_info[0] == 2:
            # Skulpt's traceback module is currently Python 3 only.
            return '%s: %s\n' % (err[0].__name__, err[1])
        import traceback
        return ''.join(traceback.format_exception(*err))

    def addSkip(self, test, reason):
        self.skipped.append((test, reason))

    def addExpectedFailure(self, test, err):
        self.expectedFailures.append((test, self._exc_info_to_string(err)))

    def addUnexpectedSuccess(self, test):
        if self.failfast:
            self.stop()
        self.unexpectedSuccesses.append(test)

    def addSubTest(self, test, subtest, err):
        if err is not None:
            if self.failfast:
                self.stop()
            failures = self.failures if issubclass(err[0], test.failureException) else self.errors
            failures.append((subtest, self._exc_info_to_string(err)))

    def stop(self):
        self.shouldStop = True

    def wasSuccessful(self):
        return not (self.failures or self.errors or self.unexpectedSuccesses)


class TestCase(object):
    failureException = AssertionError
    _legacy_assertions = False

    def __init__(self, methodName='runTest'):
        self._testMethodName = methodName
        self._cleanups = []
        self._active_result = None
        self._cleanups_ok = True
        self._subtest = None
        self._subtests_ok = True
        self._expecting_failure = False
        self._expected_subtest_failure = None
        if methodName != 'runTest' and not hasattr(self, methodName):
            raise ValueError('no such test method in %s: %s' % (self.__class__, methodName))
        self.numPassed = 0
        self.numFailed = 0
        self.numSkipped = 0
        self.assertPassed = 0
        self.assertFailed = 0
        self.verbosity = 1
        self.tlist = []
        if methodName == 'runTest':
            self.tlist = [getattr(self, name) for name in dir(self) if name.startswith('test')]

    def setUp(self):
        pass

    def tearDown(self):
        pass
    
    def cleanName(self,funcName):
        return funcName.__func__.__name__

    def main(self):
        # The browser and standalone harnesses consume this runner's counters.
        previous = self._legacy_assertions
        self._legacy_assertions = True
        try:
            self._run_legacy_tests()
        finally:
            self._legacy_assertions = previous

    def _run_legacy_tests(self):

        for func in self.tlist:
            # Check if test is marked as skipped
            # Need to check __func__ for bound methods to get the decorated function attributes
            underlying_func = getattr(func, '__func__', func)
            skip_class = getattr(self.__class__, '__unittest_skip__', False)
            if skip_class or getattr(underlying_func, '__unittest_skip__', False):
                skipped_item = self.__class__ if skip_class else underlying_func
                skip_reason = getattr(skipped_item, '__unittest_skip_why__', '')
                self.numSkipped += 1
                if self.verbosity > 1:
                    print('Skipped %s: %s' % (self.cleanName(func), skip_reason))
                continue

            if self.verbosity > 1:
                print('Running %s' % self.cleanName(func))
            self.assertPassed = 0
            self.assertFailed = 0
            skip_error = None
            try:
                self.setUp()
                try:
                    func()
                except SkipTest as e:
                    skip_error = e
                self.tearDown()
            except SkipTest as e:
                skip_error = e
            except Exception as e:
                self.assertFailed += 1
                self.numFailed += 1
                print('Test threw exception in %s (%s)' % (self.cleanName(func), e))
                self._run_legacy_cleanups()
                continue

            if not self._run_legacy_cleanups():
                self.assertFailed += 1
            if self.assertFailed:
                self.numFailed += 1
                print('Tests failed in %s ' % self.cleanName(func))
            elif skip_error is not None:
                self.numSkipped += 1
                if self.verbosity > 1:
                    print('Skipped %s: %s' % (self.cleanName(func), str(skip_error)))
            else:
                self.numPassed += 1
        self.showSummary()

    def defaultTestResult(self):
        return TestResult()

    def addCleanup(self, *args, **kwargs):
        if not args:
            raise TypeError('addCleanup() requires a cleanup function')
        self._cleanups.append((args[0], args[1:], kwargs))

    def enterContext(self, cm):
        cls = type(cm)
        try:
            enter = cls.__enter__
            exit = cls.__exit__
        except AttributeError:
            raise TypeError('%r does not support the context manager protocol' % cls)
        value = enter(cm)
        self.addCleanup(exit, cm, None, None, None)
        return value

    def doCleanups(self):
        result = self._active_result
        if result is None:
            result = TestResult()
        success = True
        while self._cleanups:
            function, args, kwargs = self._cleanups.pop()
            passed, _ = self._run_test_part(lambda: function(*args, **kwargs), result)
            if not passed:
                success = False
        if self._active_result is not None:
            self._cleanups_ok = self._cleanups_ok and success
        return success

    def _run_legacy_cleanups(self):
        if not self._cleanups:
            return True
        result = TestResult()
        self._active_result = result
        try:
            success = self.doCleanups()
        finally:
            self._active_result = None
        for _, message in result.failures + result.errors:
            print(message)
        return success

    def _run_test_part(self, function, result, expecting_failure=False):
        try:
            function()
        except KeyboardInterrupt:
            raise
        except _ShouldStop:
            return self._subtests_ok, self._expected_subtest_failure
        except SkipTest as error:
            result.addSkip(self, str(error))
        except BaseException as error:
            exc_info = (type(error), error, error.__traceback__)
            if expecting_failure:
                return True, exc_info
            if isinstance(error, self.failureException):
                result.addFailure(self, exc_info)
            else:
                result.addError(self, exc_info)
        else:
            return True, None
        return False, None

    @contextmanager
    def subTest(self, msg=_subtest_message_unset, **params):
        result = self._active_result
        add_subtest = getattr(result, 'addSubTest', None)
        if add_subtest is None:
            yield
            return

        parent = self._subtest
        if parent is not None:
            for name, value in parent.params.items():
                params.setdefault(name, value)
        subtest = self._subtest = _SubTest(self, msg, params)
        previous_success = self._subtests_ok
        self._subtests_ok = True
        try:
            try:
                yield
            except (KeyboardInterrupt, _ShouldStop):
                raise
            except SkipTest as error:
                self._subtests_ok = False
                result.addSkip(subtest, str(error))
            except BaseException as error:
                exc_info = (type(error), error, error.__traceback__)
                if self._expecting_failure:
                    self._expected_subtest_failure = exc_info
                    raise _ShouldStop()
                self._subtests_ok = False
                add_subtest(self, subtest, exc_info)
            else:
                if self._subtests_ok:
                    add_subtest(self, subtest, None)
            if not self._subtests_ok and getattr(result, 'failfast', False):
                raise _ShouldStop()
        finally:
            self._subtests_ok = self._subtests_ok and previous_success
            self._subtest = parent

    def run(self, result=None):
        own_result = result is None
        if own_result:
            result = self.defaultTestResult()
            start = getattr(result, 'startTestRun', None)
            if start is not None:
                start()

        result.startTest(self)
        try:
            method = getattr(self, self._testMethodName)
            for item in (type(self), getattr(method, '__func__', method)):
                if getattr(item, '__unittest_skip__', False):
                    result.addSkip(self, getattr(item, '__unittest_skip_why__', ''))
                    return result
            self._active_result = result
            self._cleanups_ok = True
            self._subtests_ok = True
            try:
                expecting_failure = (getattr(self, '__unittest_expecting_failure__', False) or
                                     getattr(getattr(method, '__func__', method), '__unittest_expecting_failure__', False))
                passed, _ = self._run_test_part(self.setUp, result)
                expected_failure = None
                if passed:
                    self._expecting_failure = expecting_failure
                    try:
                        passed, expected_failure = self._run_test_part(method, result, expecting_failure)
                    finally:
                        self._expecting_failure = False
                    torn_down, _ = self._run_test_part(self.tearDown, result)
                    passed = passed and torn_down
                self.doCleanups()
                if passed and self._cleanups_ok and self._subtests_ok:
                    if not expecting_failure:
                        result.addSuccess(self)
                    elif expected_failure is not None:
                        add_failure = getattr(result, 'addExpectedFailure', None)
                        if add_failure is not None:
                            add_failure(self, expected_failure)
                        else:
                            result.addSuccess(self)
                    else:
                        add_success = getattr(result, 'addUnexpectedSuccess', None)
                        if add_success is not None:
                            add_success(self)
                        else:
                            try:
                                raise _UnexpectedSuccess('The test was supposed to fail, but it passed')
                            except _UnexpectedSuccess as error:
                                result.addFailure(self, (type(error), error, error.__traceback__))
            finally:
                self._active_result = None
                self._expected_subtest_failure = None
            return result
        finally:
            result.stopTest(self)
            if own_result:
                stop = getattr(result, 'stopTestRun', None)
                if stop is not None:
                    stop()

    def __call__(self, *args, **kwargs):
        return self.run(*args, **kwargs)

    def assertEqual(self, actual, expected, feedback=""):
        res = actual==expected
        if not res and feedback == "":
            feedback = "Expected %s to equal %s" % (str(actual),str(expected))
        self.appendResult(res, actual ,expected, feedback)

    def assertNotEqual(self, actual, expected, feedback=""):
        res = actual != expected
        if not res and feedback == "":
            feedback = "Expected %s to not equal %s" % (str(actual),str(expected))
        self.appendResult(res, actual, expected, feedback)

    def assertTrue(self,x, feedback=""):
        res = bool(x) is True
        if not res and feedback == "":
            feedback = "Expected %s to be True" % (str(x))
        self.appendResult(res, x, True, feedback)

    def assertFalse(self,x, feedback=""):
        res = not bool(x)
        if not res and feedback == "":
            feedback = "Expected %s to be False" % (str(x))
        self.appendResult(res, x, False, feedback)

    def assertIs(self,a,b, feedback=""):
        res = a is b
        if not res and feedback == "":
            feedback = "Expected %s to be the same object as %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertIsNot(self,a,b, feedback=""):
        res = a is not b
        if not res and feedback == "":
            feedback = "Expected %s to not be the same object as %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertIsNone(self,x, feedback=""):
        res = x is None
        if not res and feedback == "":
            feedback = "Expected %s to be None" % (str(x))
        self.appendResult(res, x, None, feedback)

    def assertIsNotNone(self,x, feedback=""):
        res = x is not None
        if not res and feedback == "":
            feedback = "Expected %s to not be None" % (str(x))
        self.appendResult(res, x, None, feedback)

    def assertIn(self, a, b, feedback=""):
        res = a in b
        if not res and feedback == "":
            feedback = "Expected %s to be in %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertNotIn(self, a, b, feedback=""):
        res = a not in b
        if not res and feedback == "":
            feedback = "Expected %s to not be in %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertIsInstance(self,a,b, feedback=""):
        res = isinstance(a,b)
        if not res and feedback == "":
            feedback = "Expected %s to be an instance of %s" % (str(a), str(b))
        self.appendResult(res, a, b, feedback)

    def assertNotIsInstance(self,a,b, feedback=""):
        res = not isinstance(a,b)
        if not res and feedback == "":
            feedback = "Expected %s to not be an instance of %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertRegex(self, text, expected_regex, feedback=""):
        """Fail the test unless the text matches the regular expression."""
        if isinstance(expected_regex, (str, )): #bytes
            assert expected_regex, "expected_regex must not be empty."
            expected_regex = re.compile(expected_regex)
        if not expected_regex.search(text):
            res = False
            if feedback == "":
                feedback = "Regex didn't match: %r not found in %r" % (
                    repr(expected_regex), text)
        else:
            res = True
        self.appendResult(res, text, expected_regex, feedback)

    def assertNotRegex(self, text, unexpected_regex, feedback=""):
        """Fail the test if the text matches the regular expression."""
        if isinstance(unexpected_regex, (str, )): # bytes
            unexpected_regex = re.compile(unexpected_regex)
        match = unexpected_regex.search(text)
        if match:
            feedback = 'Regex matched: %r matches %r in %r' % (
                text[match.start() : match.end()],
                repr(unexpected_regex),
                text)
            # _formatMessage ensures the longMessage option is respected
        self.appendResult(not bool(match), text, unexpected_regex, feedback)

    def assertAlmostEqual(self, a, b, places=7, feedback="", delta=None):

        if delta is not None:
            res = abs(a-b) <= delta
        else:
            if places is None:
                places = 7
            res = round(a-b, places) == 0
        
        if not res and feedback == "":
            feedback = "Expected %s to equal %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertNotAlmostEqual(self, a, b, places=7, feedback="", delta=None):

        if delta is not None:
            res = not (a == b) and abs(a - b) > delta
        else:
            if places is None:
                places = 7

            res = round(a-b, places) != 0

        if not res and feedback == "":
            feedback = "Expected %s to not equal %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertGreater(self,a,b, feedback=""):
        res = a > b
        if not res and feedback == "":
            feedback = "Expected %s to be greater than %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertGreaterEqual(self,a,b, feedback=""):
        res = a >= b
        if not res and feedback == "":
            feedback = "Expected %s to be >= %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertLess(self, a, b, feedback=""):
        res = a < b
        if not res and feedback == "":
            feedback = "Expected %s to be less than %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def assertLessEqual(self,a,b, feedback=""):
        res = a <= b
        if not res and feedback == "":
            feedback = "Expected %s to be <= %s" % (str(a),str(b))
        self.appendResult(res, a, b, feedback)

    def appendResult(self,res,actual,expected,feedback):
        if res:
            self.assertPassed += 1
        elif self._legacy_assertions:
            print('Fail: ' + feedback)
            self.assertFailed += 1
        else:
            raise self.failureException(feedback)

    def assertRaises(self, expected_exception, *args, **kwargs):
        context = _AssertRaisesContext(expected_exception, self)
        try:
            return context.handle('assertRaises', args, kwargs)
        finally:
            # bpo-23890: manually break a reference cycle
            context = None

    def assertRaisesRegex(self, expected_exception, expected_regex,
                          *args, **kwargs):
        context = _AssertRaisesContext(expected_exception, self, expected_regex)
        return context.handle('assertRaisesRegex', args, kwargs)

    def fail(self, msg=None):
        if not self._legacy_assertions:
            raise self.failureException(msg)
        if msg is None:
            msg = 'Fail'
        else:
            msg = 'Fail: ' + msg
        print(msg)
        self.assertFailed += 1

    def skipTest(self, reason):
        """Skip this test."""
        raise SkipTest(reason)

    def showSummary(self):
        # don't divde by zero
        # pct = self.numPassed / (self.numPassed+self.numFailed) * 100
        total = self.numPassed + self.numFailed + self.numSkipped
        print("Ran %d tests, passed: %d failed: %d skipped: %d\n" % (total,
                                               self.numPassed, self.numFailed, self.numSkipped))



def main(verbosity=1):
    glob = globals() # globals() still needs work
    for name in glob:
        if type(glob[name]) == type and issubclass(glob[name], TestCase):
            try:
                tc = glob[name]()
                tc.verbosity = verbosity
                tc.main()
            except:
                print("Uncaught Error in: ", name)
