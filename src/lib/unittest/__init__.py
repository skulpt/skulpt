__author__ = 'bmiller'
'''
This is the start of something that behaves like
the unittest module from cpython.

'''
import re

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
            res = False
            feedback = "Expected {} but got {}".format(exp_exc, act_exc)

        elif self.expected_regex is not None:
            expected_regex = self.expected_regex
            if not expected_regex.search(str(exc_value)):
                res = False
                feedback = '"{}" does not match "{}"'.format(expected_regex.pattern, str(exc_value))

        self.test_case.appendResult(res, act_exc, exp_exc, feedback)

        return True


class TestCase(object):
    def __init__(self):
        self.numPassed = 0
        self.numFailed = 0
        self.assertPassed = 0
        self.assertFailed = 0
        self.verbosity = 1
        self.tlist = []
        testNames = {}
        for name in dir(self):
            if name[:4] == 'test' and name not in testNames:
                self.tlist.append(getattr(self,name))
                testNames[name]=True

    def setUp(self):
        pass

    def tearDown(self):
        pass
    
    def cleanName(self,funcName):
        return funcName.__func__.__name__

    def main(self):

        for func in self.tlist:
            if self.verbosity > 1:
                print('Running %s' % self.cleanName(func))
            try:
                self.setUp()
                self.assertPassed = 0
                self.assertFailed = 0
                func()
                self.tearDown()
                if self.assertFailed == 0:
                    self.numPassed += 1
                else:
                    self.numFailed += 1
                    print('Tests failed in %s ' % self.cleanName(func))
            except Exception as e:
                self.assertFailed += 1
                self.numFailed += 1
                print('Test threw exception in %s (%s)' % (self.cleanName(func), e))
        self.showSummary()

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
            msg = 'Pass'
            self.assertPassed += 1
        else:
            msg = 'Fail: ' +  feedback
            print(msg)
            self.assertFailed += 1

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
        if msg is None:
            msg = 'Fail'
        else:
            msg = 'Fail: ' + msg
        print(msg)
        self.assertFailed += 1

    def showSummary(self):
        # don't divde by zero
        # pct = self.numPassed / (self.numPassed+self.numFailed) * 100
        print("Ran %d tests, passed: %d failed: %d\n" % (self.numPassed+self.numFailed,
                                               self.numPassed, self.numFailed))



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
