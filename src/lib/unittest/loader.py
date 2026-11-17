"""Collect unittest test cases from classes and modules."""

from functools import cmp_to_key

from . import TestCase
from .suite import TestSuite


def _compare(first, second):
    return (first > second) - (first < second)


class _FailedTest(TestCase):
    def __init__(self, name, error):
        super(_FailedTest, self).__init__()
        self._testMethodName = name
        self._error = error

    def __getattr__(self, name):
        if name == self._testMethodName:
            def fail():
                raise self._error
            return fail
        raise AttributeError(name)


class TestLoader(object):
    testMethodPrefix = 'test'
    sortTestMethodsUsing = staticmethod(_compare)
    suiteClass = TestSuite

    def __init__(self):
        self.errors = []

    def getTestCaseNames(self, testCaseClass):
        names = [name for name in dir(testCaseClass)
                 if name.startswith(self.testMethodPrefix) and callable(getattr(testCaseClass, name))]
        if self.sortTestMethodsUsing is not None:
            names.sort(key=cmp_to_key(self.sortTestMethodsUsing))
        return names

    def loadTestsFromTestCase(self, testCaseClass):
        if issubclass(testCaseClass, TestSuite):
            raise TypeError('Test cases should not be derived from TestSuite')
        names = []
        if testCaseClass is not TestCase:
            names = self.getTestCaseNames(testCaseClass)
            if not names and hasattr(testCaseClass, 'runTest'):
                names = ['runTest']
        return self.suiteClass(testCaseClass(name) for name in names)

    def loadTestsFromModule(self, module, **kwargs):
        # Match the keyword-only pattern parameter in both Skulpt Python modes.
        pattern = kwargs.pop('pattern', None)
        if kwargs:
            raise TypeError('loadTestsFromModule() got an unexpected keyword argument %r' % next(iter(kwargs)))
        tests = []
        for name in dir(module):
            value = getattr(module, name)
            if isinstance(value, type) and issubclass(value, TestCase) and value is not TestCase:
                tests.append(self.loadTestsFromTestCase(value))
        suite = self.suiteClass(tests)

        load_tests = getattr(module, 'load_tests', None)
        if load_tests is not None:
            try:
                return load_tests(self, suite, pattern)
            except Exception as error:
                self.errors.append('Failed to call load_tests:\n%s' % error)
                return self.suiteClass([_FailedTest(module.__name__, error)])
        return suite


defaultTestLoader = TestLoader()
