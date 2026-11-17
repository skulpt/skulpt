"""Test collections and shared fixtures."""

import sys

from . import SkipTest, TestCase, _class_name, doModuleCleanups


class _FixtureError(object):
    def __init__(self, name):
        self.name = name

    def id(self):
        return self.name

    def __str__(self):
        return self.name

    def countTestCases(self):
        return 0


class _SuiteFixtures(object):
    """Keep the active fixtures shared across nested suites in one run."""

    def __init__(self, result):
        self.result = result
        self.test_class = None
        self.module_name = None
        self.module = None
        self.class_ready = False
        self.module_ready = False

    def _report_error(self, name, phase, error, info):
        test = _FixtureError('%s (%s)' % (phase, name))
        if isinstance(error, SkipTest):
            self.result.addSkip(test, str(error))
        else:
            self.result.addError(test, info)

    def _call(self, fixture, name, phase):
        try:
            fixture()
        except Exception as error:
            self._report_error(name, phase, error, (type(error), error, error.__traceback__))
            return False
        return True

    def _call_fixture(self, owner, name, phase):
        fixture = getattr(owner, phase, None)
        return fixture is None or self._call(fixture, name, phase)

    def _clean_class(self, phase):
        cls = self.test_class
        cleanup = getattr(cls, 'doClassCleanups', None)
        if cleanup is not None:
            cleanup()
            for info in cls.tearDown_exceptions:
                self._report_error(_class_name(cls), phase, info[1], info)

    def _finish_class(self):
        if self.class_ready and not getattr(self.test_class, '__unittest_skip__', False):
            self._call_fixture(self.test_class, _class_name(self.test_class), 'tearDownClass')
            self._clean_class('tearDownClass')

    def _finish_module(self):
        if self.module is not None and self.module_ready:
            self._call_fixture(self.module, self.module_name, 'tearDownModule')
            self._call(doModuleCleanups, self.module_name, 'tearDownModule')

    def enter_class(self, cls):
        if cls is self.test_class:
            return self.class_ready

        self._finish_class()
        module_name = getattr(cls, '__module__', None)
        if module_name != self.module_name:
            self._finish_module()
            self.module_name = module_name
            self.module = sys.modules.get(module_name)
            self.module_ready = self._call_fixture(self.module, module_name, 'setUpModule')
            if not self.module_ready:
                self._call(doModuleCleanups, module_name, 'setUpModule')

        self.test_class = cls
        self.class_ready = self.module_ready or module_name is None
        if self.class_ready and not getattr(cls, '__unittest_skip__', False):
            # A plain callable can also be added to a suite.
            self.class_ready = self._call_fixture(cls, _class_name(cls), 'setUpClass')
            if not self.class_ready:
                self._clean_class('setUpClass')
        return self.class_ready

    def finish(self):
        self._finish_class()
        self._finish_module()


class TestSuite(object):
    """Run a collection of tests in order, sharing class and module fixtures."""

    _cleanup = True

    def __init__(self, tests=()):
        self._tests = []
        self._removed_tests = 0
        self.addTests(tests)

    def __iter__(self):
        return iter(self._tests)

    def __eq__(self, other):
        if not isinstance(other, type(self)):
            return NotImplemented
        return list(self) == list(other)

    def __repr__(self):
        return '<%s tests=%s>' % (_class_name(type(self)), list(self))

    def countTestCases(self):
        return self._removed_tests + sum(test.countTestCases() for test in self if test is not None)

    def addTest(self, test):
        if not callable(test):
            raise TypeError('%r is not callable' % (test,))
        if isinstance(test, type) and issubclass(test, (TestCase, TestSuite)):
            raise TypeError('TestCases and TestSuites must be instantiated before passing them to addTest()')
        self._tests.append(test)

    def addTests(self, tests):
        if isinstance(tests, str):
            raise TypeError('tests must be an iterable of tests, not a string')
        for test in tests:
            self.addTest(test)

    def run(self, result):
        fixtures = getattr(result, '_suite_fixtures', None)
        outermost = fixtures is None
        if outermost:
            fixtures = result._suite_fixtures = _SuiteFixtures(result)
        try:
            for index, test in enumerate(self):
                if result.shouldStop:
                    break
                if isinstance(test, TestSuite) or fixtures.enter_class(type(test)):
                    test(result)
                    if self._cleanup:
                        self._removeTestAtIndex(index)
            if outermost:
                fixtures.finish()
        finally:
            if outermost:
                del result._suite_fixtures
        return result

    def _removeTestAtIndex(self, index):
        test = self._tests[index]
        # Release completed tests without changing the total case count.
        if hasattr(test, 'countTestCases'):
            self._removed_tests += test.countTestCases()
        self._tests[index] = None

    def __call__(self, result):
        return self.run(result)
