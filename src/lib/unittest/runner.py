"""Run test suites and write their results to a text stream."""

import sys
import time

from . import TestResult, _SubTest


class TextTestResult(TestResult):
    separator1 = '=' * 70
    separator2 = '-' * 70

    def __init__(self, stream, descriptions, verbosity):
        super(TextTestResult, self).__init__()
        self.stream = stream
        self.descriptions = descriptions
        self.showAll = verbosity > 1
        self.dots = verbosity == 1
        # The test whose verbose line is waiting for its status.
        self._pending_test = None

    def getDescription(self, test):
        description = str(test)
        if isinstance(test, _SubTest):
            test = test.test_case
            description = '%s %s' % (test, description)
        doc = test.shortDescription() if self.descriptions and hasattr(test, 'shortDescription') else None
        if doc:
            return '%s\n%s' % (description, doc)
        return description

    def startTest(self, test):
        super(TextTestResult, self).startTest(test)
        if self.showAll:
            self._pending_test = test
            self.stream.write(self.getDescription(test) + ' ... ')
            self.stream.flush()

    def _status(self, test, label, marker):
        if self.showAll:
            if test is not self._pending_test:
                if self._pending_test is not None:
                    self.stream.write('\n')
                indent = '  ' if isinstance(test, _SubTest) else ''
                self.stream.write(indent + self.getDescription(test) + ' ... ')
            self.stream.write(label + '\n')
            self._pending_test = None
        elif self.dots:
            self.stream.write(marker)
        self.stream.flush()

    def addSuccess(self, test):
        super(TextTestResult, self).addSuccess(test)
        self._status(test, 'ok', '.')

    def addFailure(self, test, err):
        super(TextTestResult, self).addFailure(test, err)
        self._status(test, 'FAIL', 'F')

    def addError(self, test, err):
        super(TextTestResult, self).addError(test, err)
        self._status(test, 'ERROR', 'E')

    def addSkip(self, test, reason):
        super(TextTestResult, self).addSkip(test, reason)
        self._status(test, 'skipped %r' % reason, 's')

    def addExpectedFailure(self, test, err):
        super(TextTestResult, self).addExpectedFailure(test, err)
        self._status(test, 'expected failure', 'x')

    def addUnexpectedSuccess(self, test):
        super(TextTestResult, self).addUnexpectedSuccess(test)
        self._status(test, 'unexpected success', 'u')

    def addSubTest(self, test, subtest, err):
        super(TextTestResult, self).addSubTest(test, subtest, err)
        if err is not None:
            if issubclass(err[0], test.failureException):
                self._status(subtest, 'FAIL', 'F')
            else:
                self._status(subtest, 'ERROR', 'E')

    def printErrors(self):
        if self.dots or self.showAll:
            self.stream.write('\n')
        for label, entries in (('ERROR', self.errors), ('FAIL', self.failures)):
            for test, message in entries:
                self.stream.write('%s\n%s: %s\n%s\n%s' %
                                  (self.separator1, label, self.getDescription(test), self.separator2, message))
        for test in self.unexpectedSuccesses:
            self.stream.write('%s\nUNEXPECTED SUCCESS: %s\n' % (self.separator1, self.getDescription(test)))


class TextTestRunner(object):
    resultclass = TextTestResult

    def __init__(self, stream=None, descriptions=True, verbosity=1, failfast=False, resultclass=None):
        self.stream = sys.stderr if stream is None else stream
        self.descriptions = descriptions
        self.verbosity = verbosity
        self.failfast = failfast
        if resultclass is not None:
            self.resultclass = resultclass

    def _makeResult(self):
        return self.resultclass(self.stream, self.descriptions, self.verbosity)

    def run(self, test):
        result = self._makeResult()
        result.failfast = self.failfast
        start = time.time()
        result.startTestRun()
        try:
            test(result)
        finally:
            result.stopTestRun()
        elapsed = time.time() - start

        if hasattr(result, 'printErrors'):
            result.printErrors()
        ran = result.testsRun
        self.stream.write('%s\nRan %d test%s in %.3fs\n\n' %
                          (TextTestResult.separator2, ran, '' if ran == 1 else 's', elapsed))
        counts = [('failures', len(result.failures)), ('errors', len(result.errors)),
                  ('skipped', len(result.skipped)), ('expected failures', len(result.expectedFailures)),
                  ('unexpected successes', len(result.unexpectedSuccesses))]
        details = ', '.join('%s=%d' % (label, count) for label, count in counts if count)
        if not result.wasSuccessful():
            status = 'FAILED'
        elif ran == 0 and not result.skipped:
            status = 'NO TESTS RAN'
        else:
            status = 'OK'
        if details:
            status += ' (%s)' % details
        self.stream.write(status + '\n')
        self.stream.flush()
        return result
