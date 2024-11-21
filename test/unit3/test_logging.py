import datetime
import time
import logging
import unittest
import re
import copy
import sys

# create a fake io.Stream implementation
class StringIO:
    def __init__(self):
        self.buffer = []

    def write(self, text):
        self.buffer.append(str(text))

    def read(self):
        return ""

    def flush(self):
        pass
        # self.buffer = []

    def close(self):
        self.buffer = []
        # self.flush()

    def getvalue(self):
        return "".join(self.buffer)


class BaseTest(unittest.TestCase):
    """Base class for logging tests."""

    log_format = "%(name)s -> %(levelname)s: %(message)s"
    expected_log_pat = r"^([\w.]+) -> (\w+): (\d+)$"
    message_num = 0

    def setUp(self):
        """Setup the default logging stream to an internal StringIO instance,
        so that we can examine log output as we want."""
        # self._threading_key = threading_helper.threading_setup()

        logger_dict = logging.getLogger().manager.loggerDict
        with logging._lock:
            self.saved_handlers = logging._handlers.copy()
            # self.saved_handler_list = logging._handlerList[:]
            self.saved_loggers = saved_loggers = logger_dict.copy()
            self.saved_name_to_level = logging._nameToLevel.copy()
            self.saved_level_to_name = logging._levelToName.copy()
            self.logger_states = logger_states = {}
            for name in saved_loggers:
                logger_states[name] = getattr(saved_loggers[name], "disabled", None)

        # Set two unused loggers
        self.logger1 = logging.getLogger("\xab\xd7\xbb")
        self.logger2 = logging.getLogger("\u013f\u00d6\u0047")

        self.root_logger = logging.getLogger("")
        self.original_logging_level = self.root_logger.getEffectiveLevel()

        self.stream = StringIO()
        self.root_logger.setLevel(logging.DEBUG)
        self.root_hdlr = logging.StreamHandler(self.stream)
        self.root_formatter = logging.Formatter(self.log_format)
        self.root_hdlr.setFormatter(self.root_formatter)
        if self.logger1.hasHandlers():
            hlist = self.logger1.handlers + self.root_logger.handlers
            raise AssertionError("Unexpected handlers: %s" % hlist)
        if self.logger2.hasHandlers():
            hlist = self.logger2.handlers + self.root_logger.handlers
            raise AssertionError("Unexpected handlers: %s" % hlist)
        self.root_logger.addHandler(self.root_hdlr)
        self.assertTrue(self.logger1.hasHandlers())
        self.assertTrue(self.logger2.hasHandlers())
        self.message_num = 0

    def tearDown(self):
        """Remove our logging stream, and restore the original logging
        level."""
        self.stream.close()
        self.root_logger.removeHandler(self.root_hdlr)
        while self.root_logger.handlers:
            h = self.root_logger.handlers[0]
            self.root_logger.removeHandler(h)
            h.close()
        self.root_logger.setLevel(self.original_logging_level)
        with logging._lock:
            logging._levelToName.clear()
            logging._levelToName.update(self.saved_level_to_name)
            logging._nameToLevel.clear()
            logging._nameToLevel.update(self.saved_name_to_level)
            logging._handlers.clear()
            logging._handlers.update(self.saved_handlers)
            # logging._handlerList[:] = self.saved_handler_list
            manager = logging.getLogger().manager
            manager.disable = 0
            loggerDict = manager.loggerDict
            loggerDict.clear()
            loggerDict.update(self.saved_loggers)
            logger_states = self.logger_states
            for name in self.logger_states:
                if logger_states[name] is not None:
                    self.saved_loggers[name].disabled = logger_states[name]

        # self.doCleanups()
        # threading_helper.threading_cleanup(*self._threading_key)

    def assert_log_lines(self, expected_values, stream=None, pat=None):
        """Match the collected log lines against the regular expression
        self.expected_log_pat, and compare the extracted group values to
        the expected_values list of tuples."""
        stream = stream or self.stream
        pat = re.compile(pat or self.expected_log_pat)
        actual_lines = stream.getvalue().splitlines()
        self.assertEqual(len(actual_lines), len(expected_values))
        for actual, expected in zip(actual_lines, expected_values):
            match = pat.search(actual)
            if not match:
                self.fail("Log line does not match expected pattern:\n" + actual)
            self.assertEqual(tuple(match.groups()), expected)
        s = stream.read()
        if s:
            self.fail("Remaining output at end of log stream:\n" + s)

    def next_message(self):
        """Generate a message consisting solely of an auto-incrementing
        integer."""
        self.message_num += 1
        return "%d" % self.message_num



class BuiltinLevelsTest(BaseTest):
    """Test builtin levels and their inheritance."""

    def test_flat(self):
        # Logging levels in a flat logger namespace.
        m = self.next_message

        ERR = logging.getLogger("ERR")
        ERR.setLevel(logging.ERROR)
        INF = logging.LoggerAdapter(logging.getLogger("INF"), {})
        INF.setLevel(logging.INFO)
        DEB = logging.getLogger("DEB")
        DEB.setLevel(logging.DEBUG)

        # These should log.
        ERR.log(logging.CRITICAL, m())
        ERR.error(m())

        INF.log(logging.CRITICAL, m())
        INF.error(m())
        INF.warning(m())
        INF.info(m())

        DEB.log(logging.CRITICAL, m())
        DEB.error(m())
        DEB.warning(m())
        DEB.info(m())
        DEB.debug(m())

        # These should not log.
        ERR.warning(m())
        ERR.info(m())
        ERR.debug(m())

        INF.debug(m())

        self.assert_log_lines([
            ('ERR', 'CRITICAL', '1'),
            ('ERR', 'ERROR', '2'),
            ('INF', 'CRITICAL', '3'),
            ('INF', 'ERROR', '4'),
            ('INF', 'WARNING', '5'),
            ('INF', 'INFO', '6'),
            ('DEB', 'CRITICAL', '7'),
            ('DEB', 'ERROR', '8'),
            ('DEB', 'WARNING', '9'),
            ('DEB', 'INFO', '10'),
            ('DEB', 'DEBUG', '11'),
        ])

    def test_nested_explicit(self):
        # Logging levels in a nested namespace, all explicitly set.
        m = self.next_message

        INF = logging.getLogger("INF")
        INF.setLevel(logging.INFO)
        INF_ERR  = logging.getLogger("INF.ERR")
        INF_ERR.setLevel(logging.ERROR)

        # These should log.
        INF_ERR.log(logging.CRITICAL, m())
        INF_ERR.error(m())

        # These should not log.
        INF_ERR.warning(m())
        INF_ERR.info(m())
        INF_ERR.debug(m())

        self.assert_log_lines([
            ('INF.ERR', 'CRITICAL', '1'),
            ('INF.ERR', 'ERROR', '2'),
        ])

    def test_nested_inherited(self):
        # Logging levels in a nested namespace, inherited from parent loggers.
        m = self.next_message

        INF = logging.getLogger("INF")
        INF.setLevel(logging.INFO)
        INF_ERR  = logging.getLogger("INF.ERR")
        INF_ERR.setLevel(logging.ERROR)
        INF_UNDEF = logging.getLogger("INF.UNDEF")
        INF_ERR_UNDEF = logging.getLogger("INF.ERR.UNDEF")
        UNDEF = logging.getLogger("UNDEF")

        # These should log.
        INF_UNDEF.log(logging.CRITICAL, m())
        INF_UNDEF.error(m())
        INF_UNDEF.warning(m())
        INF_UNDEF.info(m())
        INF_ERR_UNDEF.log(logging.CRITICAL, m())
        INF_ERR_UNDEF.error(m())

        # These should not log.
        INF_UNDEF.debug(m())
        INF_ERR_UNDEF.warning(m())
        INF_ERR_UNDEF.info(m())
        INF_ERR_UNDEF.debug(m())

        self.assert_log_lines([
            ('INF.UNDEF', 'CRITICAL', '1'),
            ('INF.UNDEF', 'ERROR', '2'),
            ('INF.UNDEF', 'WARNING', '3'),
            ('INF.UNDEF', 'INFO', '4'),
            ('INF.ERR.UNDEF', 'CRITICAL', '5'),
            ('INF.ERR.UNDEF', 'ERROR', '6'),
        ])

    def test_nested_with_virtual_parent(self):
        # Logging levels when some parent does not exist yet.
        m = self.next_message

        INF = logging.getLogger("INF")
        GRANDCHILD = logging.getLogger("INF.BADPARENT.UNDEF")
        CHILD = logging.getLogger("INF.BADPARENT")
        INF.setLevel(logging.INFO)

        # These should log.
        GRANDCHILD.log(logging.FATAL, m())
        GRANDCHILD.info(m())
        CHILD.log(logging.FATAL, m())
        CHILD.info(m())

        # These should not log.
        GRANDCHILD.debug(m())
        CHILD.debug(m())

        self.assert_log_lines([
            ('INF.BADPARENT.UNDEF', 'CRITICAL', '1'),
            ('INF.BADPARENT.UNDEF', 'INFO', '2'),
            ('INF.BADPARENT', 'CRITICAL', '3'),
            ('INF.BADPARENT', 'INFO', '4'),
        ])

    def test_regression_22386(self):
        """See issue #22386 for more information."""
        self.assertEqual(logging.getLevelName('INFO'), logging.INFO)
        self.assertEqual(logging.getLevelName(logging.INFO), 'INFO')

    def test_issue27935(self):
        fatal = logging.getLevelName('FATAL')
        self.assertEqual(fatal, logging.FATAL)

    def test_regression_29220(self):
        """See issue #29220 for more information."""
        logging.addLevelName(logging.INFO, '')
        # self.addCleanup(logging.addLevelName, logging.INFO, 'INFO')
        self.assertEqual(logging.getLevelName(logging.INFO), '')
        self.assertEqual(logging.getLevelName(logging.NOTSET), 'NOTSET')
        self.assertEqual(logging.getLevelName('NOTSET'), logging.NOTSET)


class BasicFilterTest(BaseTest):

    """Test the bundled Filter class."""

    def test_filter(self):
        # Only messages satisfying the specified criteria pass through the
        #  filter.
        filter_ = logging.Filter("spam.eggs")
        handler = self.root_logger.handlers[0]
        try:
            handler.addFilter(filter_)
            spam = logging.getLogger("spam")
            spam_eggs = logging.getLogger("spam.eggs")
            spam_eggs_fish = logging.getLogger("spam.eggs.fish")
            spam_bakedbeans = logging.getLogger("spam.bakedbeans")

            spam.info(self.next_message())
            spam_eggs.info(self.next_message())  # Good.
            spam_eggs_fish.info(self.next_message())  # Good.
            spam_bakedbeans.info(self.next_message())

            self.assert_log_lines([
                ('spam.eggs', 'INFO', '2'),
                ('spam.eggs.fish', 'INFO', '3'),
            ])
        finally:
            handler.removeFilter(filter_)

    def test_callable_filter(self):
        # Only messages satisfying the specified criteria pass through the
        #  filter.

        def filterfunc(record):
            parts = record.name.split('.')
            prefix = '.'.join(parts[:2])
            return prefix == 'spam.eggs'

        handler = self.root_logger.handlers[0]
        try:
            handler.addFilter(filterfunc)
            spam = logging.getLogger("spam")
            spam_eggs = logging.getLogger("spam.eggs")
            spam_eggs_fish = logging.getLogger("spam.eggs.fish")
            spam_bakedbeans = logging.getLogger("spam.bakedbeans")

            spam.info(self.next_message())
            spam_eggs.info(self.next_message())  # Good.
            spam_eggs_fish.info(self.next_message())  # Good.
            spam_bakedbeans.info(self.next_message())

            self.assert_log_lines([
                ('spam.eggs', 'INFO', '2'),
                ('spam.eggs.fish', 'INFO', '3'),
            ])
        finally:
            handler.removeFilter(filterfunc)

    def test_empty_filter(self):
        f = logging.Filter()
        r = logging.makeLogRecord({'name': 'spam.eggs'})
        self.assertTrue(f.filter(r))


#
#   First, we define our levels. There can be as many as you want - the only
#     limitations are that they should be integers, the lowest should be > 0 and
#   larger values mean less information being logged. If you need specific
#   level values which do not fit into these limitations, you can use a
#   mapping dictionary to convert between your application levels and the
#   logging system.
#
SILENT      = 120
TACITURN    = 119
TERSE       = 118
EFFUSIVE    = 117
SOCIABLE    = 116
VERBOSE     = 115
TALKATIVE   = 114
GARRULOUS   = 113
CHATTERBOX  = 112
BORING      = 111

LEVEL_RANGE = range(BORING, SILENT + 1)

#
#   Next, we define names for our levels. You don't need to do this - in which
#   case the system will use "Level n" to denote the text for the level.
#
my_logging_levels = {
    SILENT      : 'Silent',
    TACITURN    : 'Taciturn',
    TERSE       : 'Terse',
    EFFUSIVE    : 'Effusive',
    SOCIABLE    : 'Sociable',
    VERBOSE     : 'Verbose',
    TALKATIVE   : 'Talkative',
    GARRULOUS   : 'Garrulous',
    CHATTERBOX  : 'Chatterbox',
    BORING      : 'Boring',
}

class GarrulousFilter(logging.Filter):

    """A filter which blocks garrulous messages."""

    def filter(self, record):
        return record.levelno != GARRULOUS

class VerySpecificFilter(logging.Filter):

    """A filter which blocks sociable and taciturn messages."""

    def filter(self, record):
        return record.levelno not in [SOCIABLE, TACITURN]

class CustomLevelsAndFiltersTest(BaseTest):

    """Test various filtering possibilities with custom logging levels."""

    # Skip the logger name group.
    expected_log_pat = r"^[\w.]+ -> (\w+): (\d+)$"

    def setUp(self):
        BaseTest.setUp(self)
        for k, v in my_logging_levels.items():
            logging.addLevelName(k, v)

    def log_at_all_levels(self, logger):
        for lvl in LEVEL_RANGE:
            logger.log(lvl, self.next_message())

    def test_handler_filter_replaces_record(self):
        def replace_message(record: logging.LogRecord):
            record = copy.copy(record)
            record.msg = "new message!"
            return record

        # Set up a logging hierarchy such that "child" and it's handler
        # (and thus `replace_message()`) always get called before
        # propagating up to "parent".
        # Then we can confirm that `replace_message()` was able to
        # replace the log record without having a side effect on
        # other loggers or handlers.
        parent = logging.getLogger("parent")
        child = logging.getLogger("parent.child")
        stream_1 = io.StringIO()
        stream_2 = io.StringIO()
        handler_1 = logging.StreamHandler(stream_1)
        handler_2 = logging.StreamHandler(stream_2)
        handler_2.addFilter(replace_message)
        parent.addHandler(handler_1)
        child.addHandler(handler_2)

        child.info("original message")
        handler_1.flush()
        handler_2.flush()
        self.assertEqual(stream_1.getvalue(), "original message\n")
        self.assertEqual(stream_2.getvalue(), "new message!\n")

    def test_logging_filter_replaces_record(self):
        records = set()

        class RecordingFilter(logging.Filter):
            def filter(self, record: logging.LogRecord):
                records.add(id(record))
                return copy.copy(record)

        logger = logging.getLogger("logger")
        logger.setLevel(logging.INFO)
        logger.addFilter(RecordingFilter())
        logger.addFilter(RecordingFilter())

        logger.info("msg")

        self.assertEqual(2, len(records))

    def test_logger_filter(self):
        # Filter at logger level.
        self.root_logger.setLevel(VERBOSE)
        # Levels >= 'Verbose' are good.
        self.log_at_all_levels(self.root_logger)
        self.assert_log_lines([
            ('Verbose', '5'),
            ('Sociable', '6'),
            ('Effusive', '7'),
            ('Terse', '8'),
            ('Taciturn', '9'),
            ('Silent', '10'),
        ])

    def test_handler_filter(self):
        # Filter at handler level.
        self.root_logger.handlers[0].setLevel(SOCIABLE)
        try:
            # Levels >= 'Sociable' are good.
            self.log_at_all_levels(self.root_logger)
            self.assert_log_lines([
                ('Sociable', '6'),
                ('Effusive', '7'),
                ('Terse', '8'),
                ('Taciturn', '9'),
                ('Silent', '10'),
            ])
        finally:
            self.root_logger.handlers[0].setLevel(logging.NOTSET)

    def test_specific_filters(self):
        # Set a specific filter object on the handler, and then add another
        #  filter object on the logger itself.
        handler = self.root_logger.handlers[0]
        specific_filter = None
        garr = GarrulousFilter()
        handler.addFilter(garr)
        try:
            self.log_at_all_levels(self.root_logger)
            first_lines = [
                # Notice how 'Garrulous' is missing
                ('Boring', '1'),
                ('Chatterbox', '2'),
                ('Talkative', '4'),
                ('Verbose', '5'),
                ('Sociable', '6'),
                ('Effusive', '7'),
                ('Terse', '8'),
                ('Taciturn', '9'),
                ('Silent', '10'),
            ]
            self.assert_log_lines(first_lines)

            specific_filter = VerySpecificFilter()
            self.root_logger.addFilter(specific_filter)
            self.log_at_all_levels(self.root_logger)
            self.assert_log_lines(first_lines + [
                # Not only 'Garrulous' is still missing, but also 'Sociable'
                # and 'Taciturn'
                ('Boring', '11'),
                ('Chatterbox', '12'),
                ('Talkative', '14'),
                ('Verbose', '15'),
                ('Effusive', '17'),
                ('Terse', '18'),
                ('Silent', '20'),
        ])
        finally:
            if specific_filter:
                self.root_logger.removeFilter(specific_filter)
            handler.removeFilter(garr)


class BadStream(object):
    def write(self, data):
        raise RuntimeError('deliberate mistake')

class TestStreamHandler(logging.StreamHandler):
    def handleError(self, record):
        self.error_record = record

class StreamWithIntName(object):
    level = logging.NOTSET
    name = 2

class StreamHandlerTest(BaseTest):
    # def test_error_handling(self):
    #     h = TestStreamHandler(BadStream())
    #     r = logging.makeLogRecord({})
    #     old_raise = logging.raiseExceptions

    #     try:
    #         h.handle(r)
    #         self.assertIs(h.error_record, r)

    #         h = logging.StreamHandler(BadStream())
    #         with support.captured_stderr() as stderr:
    #             h.handle(r)
    #             msg = '\nRuntimeError: deliberate mistake\n'
    #             self.assertIn(msg, stderr.getvalue())

    #         logging.raiseExceptions = False
    #         with support.captured_stderr() as stderr:
    #             h.handle(r)
    #             self.assertEqual('', stderr.getvalue())
    #     finally:
    #         logging.raiseExceptions = old_raise

    def test_stream_setting(self):
        """
        Test setting the handler's stream
        """
        h = logging.StreamHandler()
        stream = StringIO()
        old = h.setStream(stream)
        self.assertIs(old, sys.stderr)
        actual = h.setStream(old)
        self.assertIs(actual, stream)
        # test that setting to existing value returns None
        actual = h.setStream(old)
        self.assertIsNone(actual)

    def test_can_represent_stream_with_int_name(self):
        h = logging.StreamHandler(StreamWithIntName())
        self.assertEqual(repr(h), '<StreamHandler 2 (NOTSET)>')


def formatFunc(format, datefmt=None):
    return logging.Formatter(format, datefmt)

class myCustomFormatter:
    def __init__(self, fmt, datefmt=None):
        pass

def handlerFunc():
    return logging.StreamHandler()

class CustomHandler(logging.StreamHandler):
    pass

class ManagerTest(BaseTest):
    def test_manager_loggerclass(self):
        logged = []

        class MyLogger(logging.Logger):
            def _log(self, level, msg, args, exc_info=None, extra=None):
                logged.append(msg)

        man = logging.Manager(None)
        self.assertRaises(TypeError, man.setLoggerClass, int)
        man.setLoggerClass(MyLogger)
        logger = man.getLogger('test')
        logger.warning('should appear in logged')
        logging.warning('should not appear in logged')

        self.assertEqual(logged, ['should appear in logged'])

    def test_set_log_record_factory(self):
        man = logging.Manager(None)
        expected = object()
        man.setLogRecordFactory(expected)
        self.assertEqual(man.logRecordFactory, expected)

class ChildLoggerTest(BaseTest):
    def test_child_loggers(self):
        r = logging.getLogger()
        l1 = logging.getLogger('abc')
        l2 = logging.getLogger('def.ghi')
        c1 = r.getChild('xyz')
        c2 = r.getChild('uvw.xyz')
        self.assertIs(c1, logging.getLogger('xyz'))
        self.assertIs(c2, logging.getLogger('uvw.xyz'))
        c1 = l1.getChild('def')
        c2 = c1.getChild('ghi')
        c3 = l1.getChild('def.ghi')
        self.assertIs(c1, logging.getLogger('abc.def'))
        self.assertIs(c2, logging.getLogger('abc.def.ghi'))
        self.assertIs(c2, c3)


class DerivedLogRecord(logging.LogRecord):
    pass

class LogRecordFactoryTest(BaseTest):

    def setUp(self):
        class CheckingFilter(logging.Filter):
            def __init__(self, cls):
                self.cls = cls

            def filter(self, record):
                t = type(record)
                if t is not self.cls:
                    msg = 'Unexpected LogRecord type %s, expected %s' % (t,
                            self.cls)
                    raise TypeError(msg)
                return True

        BaseTest.setUp(self)
        self.filter = CheckingFilter(DerivedLogRecord)
        self.root_logger.addFilter(self.filter)
        self.orig_factory = logging.getLogRecordFactory()

    def tearDown(self):
        self.root_logger.removeFilter(self.filter)
        BaseTest.tearDown(self)
        logging.setLogRecordFactory(self.orig_factory)

    def test_logrecord_class(self):
        self.assertRaises(TypeError, self.root_logger.warning,
                          self.next_message())
        logging.setLogRecordFactory(DerivedLogRecord)
        self.root_logger.error(self.next_message())
        self.assert_log_lines([
           ('root', 'ERROR', '2'),
        ])



ZERO = datetime.timedelta(0)

class UTC(datetime.tzinfo):
    def utcoffset(self, dt):
        return ZERO

    dst = utcoffset

    def tzname(self, dt):
        return 'UTC'

utc = UTC()

class AssertErrorMessage:

    def assert_error_message(self, exception, message, *args, **kwargs):
        try:
            self.assertRaises((), *args, **kwargs)
        except exception as e:
            self.assertEqual(message, str(e))

class FormatterTest(unittest.TestCase, AssertErrorMessage):
    def setUp(self):
        self.common = {
            'name': 'formatter.test',
            'level': logging.DEBUG,
            # 'pathname': os.path.join('path', 'to', 'dummy.ext'),
            'lineno': 42,
            'exc_info': None,
            'func': None,
            'msg': 'Message with %d %s',
            'args': (2, 'placeholders'),
        }
        self.variants = {
            'custom': {
                'custom': 1234
            }
        }

    def get_record(self, name=None):
        result = dict(self.common)
        if name is not None:
            result.update(self.variants[name])
        return logging.makeLogRecord(result)

    def test_percent(self):
        # Test %-formatting
        r = self.get_record()
        f = logging.Formatter('${%(message)s}')
        self.assertEqual(f.format(r), '${Message with 2 placeholders}')
        f = logging.Formatter('%(random)s')
        self.assertRaises(ValueError, f.format, r)
        self.assertFalse(f.usesTime())
        f = logging.Formatter('%(asctime)s')
        self.assertTrue(f.usesTime())
        f = logging.Formatter('%(asctime)-15s')
        self.assertTrue(f.usesTime())
        f = logging.Formatter('%(asctime)#15s')
        self.assertTrue(f.usesTime())

    def test_braces(self):
        # Test {}-formatting
        r = self.get_record()
        f = logging.Formatter('$%{message}%$', style='{')
        self.assertEqual(f.format(r), '$%Message with 2 placeholders%$')
        f = logging.Formatter('{random}', style='{')
        self.assertRaises(ValueError, f.format, r)
        f = logging.Formatter("{message}", style='{')
        self.assertFalse(f.usesTime())
        f = logging.Formatter('{asctime}', style='{')
        self.assertTrue(f.usesTime())
        f = logging.Formatter('{asctime!s:15}', style='{')
        self.assertTrue(f.usesTime())
        f = logging.Formatter('{asctime:15}', style='{')
        self.assertTrue(f.usesTime())

    def test_dollars(self):
        pass
        # Test $-formatting
        # r = self.get_record()
        # f = logging.Formatter('${message}', style='$')
        # self.assertEqual(f.format(r), 'Message with 2 placeholders')
        # f = logging.Formatter('$message', style='$')
        # self.assertEqual(f.format(r), 'Message with 2 placeholders')
        # f = logging.Formatter('$$%${message}%$$', style='$')
        # self.assertEqual(f.format(r), '$%Message with 2 placeholders%$')
        # f = logging.Formatter('${random}', style='$')
        # self.assertRaises(ValueError, f.format, r)
        # self.assertFalse(f.usesTime())
        # f = logging.Formatter('${asctime}', style='$')
        # self.assertTrue(f.usesTime())
        # f = logging.Formatter('$asctime', style='$')
        # self.assertTrue(f.usesTime())
        # f = logging.Formatter('${message}', style='$')
        # self.assertFalse(f.usesTime())
        # f = logging.Formatter('${asctime}--', style='$')
        # self.assertTrue(f.usesTime())

    def test_format_validate(self):
        # Check correct formatting
        # Percentage style
        f = logging.Formatter("%(levelname)-15s - %(message) 5s - %(process)03d - %(module) - %(asctime)*.3s")
        self.assertEqual(f._fmt, "%(levelname)-15s - %(message) 5s - %(process)03d - %(module) - %(asctime)*.3s")
        f = logging.Formatter("%(asctime)*s - %(asctime)*.3s - %(process)-34.33o")
        self.assertEqual(f._fmt, "%(asctime)*s - %(asctime)*.3s - %(process)-34.33o")
        f = logging.Formatter("%(process)#+027.23X")
        self.assertEqual(f._fmt, "%(process)#+027.23X")
        f = logging.Formatter("%(foo)#.*g")
        self.assertEqual(f._fmt, "%(foo)#.*g")

        # StrFormat Style
        f = logging.Formatter("$%{message}%$ - {asctime!a:15} - {customfield['key']}", style="{")
        self.assertEqual(f._fmt, "$%{message}%$ - {asctime!a:15} - {customfield['key']}")
        f = logging.Formatter("{process:.2f} - {custom.f:.4f}", style="{")
        self.assertEqual(f._fmt, "{process:.2f} - {custom.f:.4f}")
        f = logging.Formatter("{customfield!s:#<30}", style="{")
        self.assertEqual(f._fmt, "{customfield!s:#<30}")
        f = logging.Formatter("{message!r}", style="{")
        self.assertEqual(f._fmt, "{message!r}")
        f = logging.Formatter("{message!s}", style="{")
        self.assertEqual(f._fmt, "{message!s}")
        f = logging.Formatter("{message!a}", style="{")
        self.assertEqual(f._fmt, "{message!a}")
        f = logging.Formatter("{process!r:4.2}", style="{")
        self.assertEqual(f._fmt, "{process!r:4.2}")
        f = logging.Formatter("{process!s:<#30,.12f}- {custom:=+#30,.1d} - {module:^30}", style="{")
        self.assertEqual(f._fmt, "{process!s:<#30,.12f}- {custom:=+#30,.1d} - {module:^30}")
        f = logging.Formatter("{process!s:{w},.{p}}", style="{")
        self.assertEqual(f._fmt, "{process!s:{w},.{p}}")
        f = logging.Formatter("{foo:12.{p}}", style="{")
        self.assertEqual(f._fmt, "{foo:12.{p}}")
        f = logging.Formatter("{foo:{w}.6}", style="{")
        self.assertEqual(f._fmt, "{foo:{w}.6}")
        f = logging.Formatter("{foo[0].bar[1].baz}", style="{")
        self.assertEqual(f._fmt, "{foo[0].bar[1].baz}")
        f = logging.Formatter("{foo[k1].bar[k2].baz}", style="{")
        self.assertEqual(f._fmt, "{foo[k1].bar[k2].baz}")
        f = logging.Formatter("{12[k1].bar[k2].baz}", style="{")
        self.assertEqual(f._fmt, "{12[k1].bar[k2].baz}")

        # Dollar style
        # f = logging.Formatter("${asctime} - $message", style="$")
        # self.assertEqual(f._fmt, "${asctime} - $message")
        # f = logging.Formatter("$bar $$", style="$")
        # self.assertEqual(f._fmt, "$bar $$")
        # f = logging.Formatter("$bar $$$$", style="$")
        # self.assertEqual(f._fmt, "$bar $$$$")  # this would print two $($$)

        # Testing when ValueError being raised from incorrect format
        # Percentage Style
        self.assertRaises(ValueError, logging.Formatter, "%(asctime)Z")
        self.assertRaises(ValueError, logging.Formatter, "%(asctime)b")
        self.assertRaises(ValueError, logging.Formatter, "%(asctime)*")
        self.assertRaises(ValueError, logging.Formatter, "%(asctime)*3s")
        self.assertRaises(ValueError, logging.Formatter, "%(asctime)_")
        self.assertRaises(ValueError, logging.Formatter, '{asctime}')
        self.assertRaises(ValueError, logging.Formatter, '${message}')
        self.assertRaises(ValueError, logging.Formatter, '%(foo)#12.3*f')  # with both * and decimal number as precision
        self.assertRaises(ValueError, logging.Formatter, '%(foo)0*.8*f')

        # StrFormat Style
        # Testing failure for '-' in field name
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: invalid field name/expression: 'name-thing'",
        #     logging.Formatter, "{name-thing}", style="{"
        # )
        # Testing failure for style mismatch
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: no fields",
        #     logging.Formatter, '%(asctime)s', style='{'
        # )
        # Testing failure for invalid conversion
        self.assert_error_message(
            ValueError,
            "invalid conversion: 'Z'"
        )
        # self.assertRaises(ValueError, logging.Formatter, '{asctime!s:#30,15f}', style='{')
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: expected ':' after conversion specifier",
        #     logging.Formatter, '{asctime!aa:15}', style='{'
        # )
        # # Testing failure for invalid spec
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: bad specifier: '.2ff'",
        #     logging.Formatter, '{process:.2ff}', style='{'
        # )
        # self.assertRaises(ValueError, logging.Formatter, '{process:.2Z}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{process!s:<##30,12g}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{process!s:<#30#,12g}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{process!s:{{w}},{{p}}}', style='{')
        # Testing failure for mismatch braces
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: expected '}' before end of string",
        #     logging.Formatter, '{process', style='{'
        # )
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: Single '}' encountered in format string",
        #     logging.Formatter, 'process}', style='{'
        # )
        # self.assertRaises(ValueError, logging.Formatter, '{{foo!r:4.2}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{{foo!r:4.2}}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{foo/bar}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{foo:{{w}}.{{p}}}}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{foo!X:{{w}}.{{p}}}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{foo!a:random}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{foo!a:ran{dom}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{foo!a:ran{d}om}', style='{')
        # self.assertRaises(ValueError, logging.Formatter, '{foo.!a:d}', style='{')

        # Dollar style
        # Testing failure for mismatch bare $
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: bare \'$\' not allowed",
        #     logging.Formatter, '$bar $$$', style='$'
        # )
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: bare \'$\' not allowed",
        #     logging.Formatter, 'bar $', style='$'
        # )
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: bare \'$\' not allowed",
        #     logging.Formatter, 'foo $.', style='$'
        # )
        # # Testing failure for mismatch style
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: no fields",
        #     logging.Formatter, '{asctime}', style='$'
        # )
        # self.assertRaises(ValueError, logging.Formatter, '%(asctime)s', style='$')

        # # Testing failure for incorrect fields
        # self.assert_error_message(
        #     ValueError,
        #     "invalid format: no fields",
        #     logging.Formatter, 'foo', style='$'
        # )
        # self.assertRaises(ValueError, logging.Formatter, '${asctime', style='$')

    def test_defaults_parameter(self):
        fmts = ['%(custom)s %(message)s', '{custom} {message}', '$custom $message']
        styles = ['%', '{', '$']
        for fmt, style in zip(fmts, styles):
            f = logging.Formatter(fmt, style=style, defaults={'custom': 'Default'})
            r = self.get_record()
            self.assertEqual(f.format(r), 'Default Message with 2 placeholders')
            r = self.get_record("custom")
            self.assertEqual(f.format(r), '1234 Message with 2 placeholders')

            # Without default
            f = logging.Formatter(fmt, style=style)
            r = self.get_record()
            self.assertRaises(ValueError, f.format, r)

            # Non-existing default is ignored
            f = logging.Formatter(fmt, style=style, defaults={'Non-existing': 'Default'})
            r = self.get_record("custom")
            self.assertEqual(f.format(r), '1234 Message with 2 placeholders')

    def test_invalid_style(self):
        self.assertRaises(ValueError, logging.Formatter, None, None, 'x')

    def test_time(self):
        r = self.get_record()
        dt = datetime.datetime(1993, 4, 21, 8, 3, 0, 0, utc)
        # We use None to indicate we want the local timezone
        # We're essentially converting a UTC time to local time
        r.created = time.mktime(dt.astimezone(None).timetuple())
        r.msecs = 123
        f = logging.Formatter('%(asctime)s %(message)s')
        f.converter = time.gmtime
        self.assertEqual(f.formatTime(r), '1993-04-21 08:03:00,123')
        self.assertEqual(f.formatTime(r, '%Y:%d'), '1993:21')
        f.format(r)
        self.assertEqual(r.asctime, '1993-04-21 08:03:00,123')

    def test_default_msec_format_none(self):
        class NoMsecFormatter(logging.Formatter):
            default_msec_format = None
            default_time_format = '%d/%m/%Y %H:%M:%S'

        r = self.get_record()
        dt = datetime.datetime(1993, 4, 21, 8, 3, 0, 123, utc)
        r.created = time.mktime(dt.astimezone(None).timetuple())
        f = NoMsecFormatter()
        f.converter = time.gmtime
        self.assertEqual(f.formatTime(r), '21/04/1993 08:03:00')

    def test_issue_89047(self):
        f = logging.Formatter(fmt='{asctime}.{msecs:03.0f} {message}', style='{', datefmt="%Y-%m-%d %H:%M:%S")
        for i in range(2500):
            time.sleep(0.0004)
            r = logging.makeLogRecord({'msg': 'Message %d' % (i + 1)})
            s = f.format(r)
            self.assertNotIn('.1000', s)


if __name__ == "__main__":
    unittest.main()