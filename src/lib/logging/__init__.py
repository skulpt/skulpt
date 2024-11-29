# Minimal implementation original from CPython 3.9 source code

import sys, time, re


__all__ = [
    "BASIC_FORMAT",
    "BufferingFormatter",
    "CRITICAL",
    "DEBUG",
    "ERROR",
    "FATAL",
    "FileHandler",
    "Filter",
    "Formatter",
    "Handler",
    "INFO",
    "LogRecord",
    "Logger",
    "LoggerAdapter",
    "NOTSET",
    "NullHandler",
    "StreamHandler",
    "WARN",
    "WARNING",
    "addLevelName",
    "basicConfig",
    "captureWarnings",
    "critical",
    "debug",
    "disable",
    "error",
    "exception",
    "fatal",
    "getLevelName",
    "getLogger",
    "getLoggerClass",
    "info",
    "log",
    "makeLogRecord",
    "setLoggerClass",
    "shutdown",
    "warning",
    "getLogRecordFactory",
    "setLogRecordFactory",
    "lastResort",
    "raiseExceptions",
]


_startTime = time.time()
raiseExceptions = False
logThreads = False
logMultiprocessing = False
logProcesses = False
logAsyncioTasks = False

# ---------------------------------------------------------------------------
#   Level related stuff
# ---------------------------------------------------------------------------

CRITICAL = 50
FATAL = CRITICAL
ERROR = 40
WARNING = 30
WARN = WARNING
INFO = 20
DEBUG = 10
NOTSET = 0

_levelToName = {
    CRITICAL: "CRITICAL",
    ERROR: "ERROR",
    WARNING: "WARNING",
    INFO: "INFO",
    DEBUG: "DEBUG",
    NOTSET: "NOTSET",
}
_nameToLevel = {
    "CRITICAL": CRITICAL,
    "FATAL": FATAL,
    "ERROR": ERROR,
    "WARN": WARNING,
    "WARNING": WARNING,
    "INFO": INFO,
    "DEBUG": DEBUG,
    "NOTSET": NOTSET,
}


def getLevelName(level):
    result = _levelToName.get(level)
    if result is not None:
        return result
    result = _nameToLevel.get(level)
    if result is not None:
        return result
    return "Level %s" % level


def addLevelName(level, levelName):
    _levelToName[level] = levelName
    _nameToLevel[levelName] = level


def _checkLevel(level):
    if isinstance(level, int):
        rv = level
    elif str(level) == level:
        if level not in _nameToLevel:
            raise ValueError("Unknown level: %r" % level)
        rv = _nameToLevel[level]
    else:
        raise TypeError("Level not an integer or a valid string: %r" % level)
    return rv


class _FakeRlock(object):
    def __enter__(self):
        pass

    def __exit__(self, exc_type, exc_value, traceback):
        pass


_lock = _FakeRlock()

# ---------------------------------------------------------------------------
#   The logging record
# ---------------------------------------------------------------------------


class LogRecord(object):
    def __init__(
        self,
        name,
        level,
        pathname,
        lineno,
        msg,
        args,
        exc_info,
        func=None,
        sinfo=None,
        **kwargs,
    ):
        ct = time.time()
        self.name = name
        self.msg = msg
        if args and len(args) == 1 and isinstance(args[0], dict) and args[0]:
            args = args[0]
        self.args = args
        self.levelname = getLevelName(level)
        self.levelno = level
        self.pathname = pathname
        self.filename = pathname
        self.module = "Unknown module"
        self.exc_info = exc_info
        self.exc_text = None  # used to cache the traceback text
        self.stack_info = sinfo
        self.lineno = lineno
        self.funcName = func
        self.created = ct
        self.msecs = int((ct - int(ct)) * 1000) + 0.0  # see gh-89047
        self.relativeCreated = (self.created - _startTime) * 1000
        self.thread = None
        self.threadName = None
        self.processName = None
        self.process = None
        self.taskName = None

    def __repr__(self):
        return '<LogRecord: %s, %s, %s, %s, "%s">' % (
            self.name,
            self.levelno,
            self.pathname,
            self.lineno,
            self.msg,
        )

    def getMessage(self):
        msg = str(self.msg)
        if self.args:
            msg = msg % self.args
        return msg


#
#   Determine which class to use when instantiating log records.
#
_logRecordFactory = LogRecord


def setLogRecordFactory(factory):
    global _logRecordFactory
    _logRecordFactory = factory


def getLogRecordFactory():
    return _logRecordFactory


def makeLogRecord(dict):
    rv = _logRecordFactory(None, None, "", 0, "", (), None, None)
    rv.__dict__.update(dict)
    return rv


# ---------------------------------------------------------------------------
#   Formatter classes and functions
# ---------------------------------------------------------------------------
class PercentStyle(object):
    default_format = "%(message)s"
    asctime_format = "%(asctime)s"
    asctime_search = "%(asctime)"
    validation_pattern = re.compile(
        r"%\(\w+\)[#0+ -]*(\*|\d+)?(\.(\*|\d+))?[diouxefgcrsa%]", re.I
    )

    def __init__(self, fmt, *, defaults=None):
        self._fmt = fmt or self.default_format
        self._defaults = defaults

    def usesTime(self):
        return self._fmt.find(self.asctime_search) >= 0

    def validate(self):
        if not self.validation_pattern.search(self._fmt):
            raise ValueError(
                "Invalid format '%s' for '%s' style"
                % (self._fmt, self.default_format[0])
            )

    def _format(self, record):
        defaults = self._defaults
        if defaults:
            values = defaults | record.__dict__
        else:
            values = record.__dict__
        return self._fmt % values

    def format(self, record):
        try:
            return self._format(record)
        except KeyError as e:
            raise ValueError("Formatting field not found in record: %s" % e)


class StrFormatStyle(PercentStyle):
    default_format = "{message}"
    asctime_format = "{asctime}"
    asctime_search = "{asctime"

    fmt_spec = re.compile(
        r"^(.?[<>=^])?[+ -]?#?0?(\d+|{\w+})?[,_]?(\.(\d+|{\w+}))?[bcdefgnosx%]?$", re.I
    )
    field_spec = re.compile(r"^(\d+|\w+)(\.\w+|\[[^]]+\])*$")

    def _format(self, record):
        defaults = self._defaults
        if defaults:
            values = defaults | record.__dict__
        else:
            values = record.__dict__
        return self._fmt.format(**values)

    def validate(self):
        """Validate the input format, ensure it is the correct string formatting style"""
        return  # TODO - _str_formatter.parse is not a thing - just assume it's valid
        fields = set()
        try:
            for _, fieldname, spec, conversion in _str_formatter.parse(self._fmt):
                if fieldname:
                    if not self.field_spec.match(fieldname):
                        raise ValueError(
                            "invalid field name/expression: %r" % fieldname
                        )
                    fields.add(fieldname)
                if conversion and conversion not in "rsa":
                    raise ValueError("invalid conversion: %r" % conversion)
                if spec and not self.fmt_spec.match(spec):
                    raise ValueError("bad specifier: %r" % spec)
        except ValueError as e:
            raise ValueError("invalid format: %s" % e)
        if not fields:
            raise ValueError("invalid format: no fields")


class StringTemplateStyle(PercentStyle):
    default_format = "${message}"
    asctime_format = "${asctime}"
    asctime_search = "${asctime}"

    def __init__(self, fmt, *, defaults=None):
        raise NotImplementedError("StringTemplateStyle is not implemented")


BASIC_FORMAT = "%(levelname)s:%(name)s:%(message)s"

_STYLES = {
    "%": (PercentStyle, BASIC_FORMAT),
    "{": (StrFormatStyle, "{levelname}:{name}:{message}"),
    "$": (StringTemplateStyle, "${levelname}:${name}:${message}"),
}


class Formatter(object):
    def converter(self, x):
        return time.localtime(x)

    def __init__(self, fmt=None, datefmt=None, style='%', validate=True, *,
                 defaults=None):
        if style not in _STYLES:
            raise ValueError("Style must be one of: %s" % ",".join(_STYLES.keys()))
        self._style = _STYLES[style][0](fmt, defaults=defaults)
        if validate:
            self._style.validate()

        self._fmt = self._style._fmt
        self.datefmt = datefmt

    default_time_format = "%Y-%m-%d %H:%M:%S"
    default_msec_format = "%s,%03d"

    def formatTime(self, record, datefmt=None):
        ct = self.converter(record.created)
        if datefmt:
            s = time.strftime(datefmt, ct)
        else:
            s = time.strftime(self.default_time_format, ct)
            if self.default_msec_format:
                s = self.default_msec_format % (s, record.msecs)
        return s

    def formatException(self, ei):
        raise NotImplementedError("formatException is not implemented")

    def usesTime(self):
        return self._style.usesTime()

    def formatMessage(self, record):
        return self._style.format(record)

    def formatStack(self, stack_info):
        return stack_info

    def format(self, record):
        record.message = record.getMessage()
        if self.usesTime():
            record.asctime = self.formatTime(record, self.datefmt)
        s = self.formatMessage(record)
        if record.exc_info:
            # Cache the traceback text to avoid converting it multiple times
            # (it's constant anyway)
            if not record.exc_text:
                record.exc_text = self.formatException(record.exc_info)
        if record.exc_text:
            if s[-1:] != "\n":
                s = s + "\n"
            s = s + record.exc_text
        if record.stack_info:
            if s[-1:] != "\n":
                s = s + "\n"
            s = s + self.formatStack(record.stack_info)
        return s


#
#   The default formatter to use when no other is specified
#
_defaultFormatter = Formatter()


class BufferingFormatter(object):
    def __init__(self, linefmt=None):
        if linefmt:
            self.linefmt = linefmt
        else:
            self.linefmt = _defaultFormatter

    def formatHeader(self, records):
        return ""

    def formatFooter(self, records):
        return ""

    def format(self, records):
        rv = ""
        if len(records) > 0:
            rv = rv + self.formatHeader(records)
            for record in records:
                rv = rv + self.linefmt.format(record)
            rv = rv + self.formatFooter(records)
        return rv


# ---------------------------------------------------------------------------
#   Filter classes and functions
# ---------------------------------------------------------------------------


class Filter(object):
    def __init__(self, name=""):
        self.name = name
        self.nlen = len(name)

    def filter(self, record):
        if self.nlen == 0:
            return True
        elif self.name == record.name:
            return True
        elif record.name.find(self.name, 0, self.nlen) != 0:
            return False
        return record.name[self.nlen] == "."


class Filterer(object):
    def __init__(self):
        self.filters = []

    def addFilter(self, filter):
        if filter not in self.filters:
            self.filters.append(filter)

    def removeFilter(self, filter):
        if filter in self.filters:
            self.filters.remove(filter)

    def filter(self, record):
        for f in self.filters:
            if hasattr(f, "filter"):
                result = f.filter(record)
            else:
                result = f(record)  # assume callable - will raise if not
            if not result:
                return False
            if isinstance(result, LogRecord):
                record = result
        return record


# ---------------------------------------------------------------------------
#   Handler classes and functions
# ---------------------------------------------------------------------------

# _handlers = weakref.WeakValueDictionary()  # map of handler names to handlers
_handlers = {}  # map of handler names to handlers


class Handler(Filterer):
    def __init__(self, level=NOTSET):
        Filterer.__init__(self)
        self._name = None
        self.level = _checkLevel(level)
        self.formatter = None
        self._closed = False

    def get_name(self):
        return self._name

    def set_name(self, name):
        if self._name in _handlers:
            del _handlers[self._name]
        self._name = name
        if name:
            _handlers[name] = self

    name = property(get_name, set_name)

    def setLevel(self, level):
        self.level = _checkLevel(level)

    def format(self, record):
        if self.formatter:
            fmt = self.formatter
        else:
            fmt = _defaultFormatter
        return fmt.format(record)

    def emit(self, record):
        raise NotImplementedError("emit must be implemented " "by Handler subclasses")

    def handle(self, record):
        rv = self.filter(record)
        if isinstance(rv, LogRecord):
            record = rv
        if rv:
            self.emit(record)
        return rv

    def setFormatter(self, fmt):
        self.formatter = fmt

    def flush(self):
        pass

    def close(self):
        self._closed = True
        if self._name and self._name in _handlers:
            del _handlers[self._name]

    def handleError(self, record):
        pass

    def __repr__(self):
        level = getLevelName(self.level)
        return "<%s (%s)>" % (self.__class__.__name__, level)


class StreamHandler(Handler):
    terminator = "\n"

    def __init__(self, stream=None):
        Handler.__init__(self)
        if stream is None:
            stream = sys.stderr
        self.stream = stream

    def flush(self):
        if self.stream and hasattr(self.stream, "flush"):
            self.stream.flush()

    def emit(self, record):
        try:
            msg = self.format(record)
            stream = self.stream
            stream.write(msg + self.terminator)
            self.flush()
        except RecursionError:  # See issue 36272
            raise
        except Exception:
            raise # TODO - we can't really handle errors so just raise them
            self.handleError(record)

    def setStream(self, stream):
        if stream is self.stream:
            result = None
        else:
            result = self.stream
            self.flush()
            self.stream = stream
        return result

    def __repr__(self):
        level = getLevelName(self.level)
        name = getattr(self.stream, "name", "")
        #  bpo-36015: name can be an int
        name = str(name)
        if name:
            name += " "
        return "<%s %s(%s)>" % (self.__class__.__name__, name, level)


class FileHandler(StreamHandler):
    def __init__(self, filename, mode="a", encoding=None, delay=False, errors=None):
        raise NotImplementedError("FileHandler is not implemented")


class _StderrHandler(StreamHandler):
    def __init__(self, level=NOTSET):
        Handler.__init__(self, level)

    @property
    def stream(self):
        return sys.stderr


_defaultLastResort = _StderrHandler(WARNING)
lastResort = _defaultLastResort

# ---------------------------------------------------------------------------
#   Manager classes and functions
# ---------------------------------------------------------------------------


class PlaceHolder(object):
    def __init__(self, alogger):
        self.loggerMap = {alogger: None}

    def append(self, alogger):
        if alogger not in self.loggerMap:
            self.loggerMap[alogger] = None


def setLoggerClass(klass):
    if klass != Logger:
        if not issubclass(klass, Logger):
            raise TypeError("logger not derived from logging.Logger: " + klass.__name__)
    global _loggerClass
    _loggerClass = klass


def getLoggerClass():
    return _loggerClass


class Manager(object):
    def __init__(self, rootnode):
        self.root = rootnode
        self.disable = 0
        self.emittedNoHandlerWarning = False
        self.loggerDict = {}
        self.loggerClass = None
        self.logRecordFactory = None

    @property
    def disable(self):
        return self._disable

    @disable.setter
    def disable(self, value):
        self._disable = _checkLevel(value)

    def getLogger(self, name):
        rv = None
        if not isinstance(name, str):
            raise TypeError("A logger name must be a string")
        if name in self.loggerDict:
            rv = self.loggerDict[name]
            if isinstance(rv, PlaceHolder):
                ph = rv
                rv = (self.loggerClass or _loggerClass)(name)
                rv.manager = self
                self.loggerDict[name] = rv
                self._fixupChildren(ph, rv)
                self._fixupParents(rv)
        else:
            rv = (self.loggerClass or _loggerClass)(name)
            rv.manager = self
            self.loggerDict[name] = rv
            self._fixupParents(rv)
        return rv

    def setLoggerClass(self, klass):
        if klass != Logger:
            if not issubclass(klass, Logger):
                raise TypeError(
                    "logger not derived from logging.Logger: " + klass.__name__
                )
        self.loggerClass = klass

    def setLogRecordFactory(self, factory):
        self.logRecordFactory = factory

    def _fixupParents(self, alogger):
        name = alogger.name
        i = name.rfind(".")
        rv = None
        while (i > 0) and not rv:
            substr = name[:i]
            if substr not in self.loggerDict:
                self.loggerDict[substr] = PlaceHolder(alogger)
            else:
                obj = self.loggerDict[substr]
                if isinstance(obj, Logger):
                    rv = obj
                else:
                    assert isinstance(obj, PlaceHolder)
                    obj.append(alogger)
            i = name.rfind(".", 0, i - 1)
        if not rv:
            rv = self.root
        alogger.parent = rv

    def _fixupChildren(self, ph, alogger):
        name = alogger.name
        namelen = len(name)
        for c in ph.loggerMap.keys():
            # The if means ... if not c.parent.name.startswith(nm)
            if c.parent.name[:namelen] != name:
                alogger.parent = c.parent
                c.parent = alogger

    def _clear_cache(self):
        for logger in self.loggerDict.values():
            if isinstance(logger, Logger):
                logger._cache.clear()
        self.root._cache.clear()


# ---------------------------------------------------------------------------
#   Logger classes and functions
# ---------------------------------------------------------------------------


class Logger(Filterer):
    def __init__(self, name, level=NOTSET):
        Filterer.__init__(self)
        self.name = name
        self.level = _checkLevel(level)
        self.parent = None
        self.propagate = True
        self.handlers = []
        self.disabled = False
        self._cache = {}

    def setLevel(self, level):
        self.level = _checkLevel(level)
        self.manager._clear_cache()

    def debug(self, msg, *args, **kwargs):
        if self.isEnabledFor(DEBUG):
            self._log(DEBUG, msg, args, **kwargs)

    def info(self, msg, *args, **kwargs):
        if self.isEnabledFor(INFO):
            self._log(INFO, msg, args, **kwargs)

    def warning(self, msg, *args, **kwargs):
        if self.isEnabledFor(WARNING):
            self._log(WARNING, msg, args, **kwargs)

    def error(self, msg, *args, **kwargs):
        if self.isEnabledFor(ERROR):
            self._log(ERROR, msg, args, **kwargs)

    def exception(self, msg, *args, exc_info=True, **kwargs):
        self.error(msg, *args, exc_info=exc_info, **kwargs)

    def critical(self, msg, *args, **kwargs):
        if self.isEnabledFor(CRITICAL):
            self._log(CRITICAL, msg, args, **kwargs)

    fatal = critical

    def log(self, level, msg, *args, **kwargs):
        if not isinstance(level, int):
            if raiseExceptions:
                raise TypeError("level must be an integer")
            else:
                return
        if self.isEnabledFor(level):
            self._log(level, msg, args, **kwargs)

    def findCaller(self, stack_info=False, stacklevel=1):
        rv = "(unknown file)", 0, "(unknown function)", None
        return rv

    def makeRecord(
        self,
        name,
        level,
        fn,
        lno,
        msg,
        args,
        exc_info,
        func=None,
        extra=None,
        sinfo=None,
    ):
        rv = _logRecordFactory(name, level, fn, lno, msg, args, exc_info, func, sinfo)
        if extra is not None:
            for key in extra:
                if (key in ["message", "asctime"]) or (key in rv.__dict__):
                    raise KeyError("Attempt to overwrite %r in LogRecord" % key)
                rv.__dict__[key] = extra[key]
        return rv

    def _log(
        self,
        level,
        msg,
        args,
        exc_info=None,
        extra=None,
        stack_info=False,
        stacklevel=1,
    ):
        sinfo = None
        fn, lno, func = "(unknown file)", 0, "(unknown function)"
        if exc_info:
            if isinstance(exc_info, BaseException):
                exc_info = (type(exc_info), exc_info, exc_info.__traceback__)
            elif not isinstance(exc_info, tuple):
                exc_info = sys.exc_info()
        record = self.makeRecord(
            self.name, level, fn, lno, msg, args, exc_info, func, extra, sinfo
        )
        self.handle(record)

    def handle(self, record):
        if self.disabled:
            return
        maybe_record = self.filter(record)
        if not maybe_record:
            return
        if isinstance(maybe_record, LogRecord):
            record = maybe_record
        self.callHandlers(record)

    def addHandler(self, hdlr):
        if hdlr not in self.handlers:
            self.handlers.append(hdlr)

    def removeHandler(self, hdlr):
        if hdlr in self.handlers:
            self.handlers.remove(hdlr)

    def hasHandlers(self):
        c = self
        rv = False
        while c:
            if c.handlers:
                rv = True
                break
            if not c.propagate:
                break
            else:
                c = c.parent
        return rv

    def callHandlers(self, record):
        c = self
        found = 0
        while c:
            for hdlr in c.handlers:
                found = found + 1
                if record.levelno >= hdlr.level:
                    hdlr.handle(record)
            if not c.propagate:
                c = None  # break out
            else:
                c = c.parent
        if found == 0:
            if lastResort:
                if record.levelno >= lastResort.level:
                    lastResort.handle(record)
            elif raiseExceptions and not self.manager.emittedNoHandlerWarning:
                sys.stderr.write(
                    "No handlers could be found for logger" ' "%s"\n' % self.name
                )
                self.manager.emittedNoHandlerWarning = True

    def getEffectiveLevel(self):
        logger = self
        while logger:
            if logger.level:
                return logger.level
            logger = logger.parent
        return NOTSET

    def isEnabledFor(self, level):
        if self.disabled:
            return False

        try:
            return self._cache[level]
        except KeyError:
            if self.manager.disable >= level:
                is_enabled = self._cache[level] = False
            else:
                is_enabled = self._cache[level] = level >= self.getEffectiveLevel()
            return is_enabled

    def getChild(self, suffix):
        if self.root is not self:
            suffix = ".".join((self.name, suffix))
        return self.manager.getLogger(suffix)


    def getChildren(self):

        def _hierlevel(logger):
            if logger is logger.manager.root:
                return 0
            return 1 + logger.name.count('.')

        d = self.manager.loggerDict
        return set(item for item in d.values()
                       if isinstance(item, Logger) and item.parent is self and
                       _hierlevel(item) == 1 + _hierlevel(item.parent))

    def __repr__(self):
        level = getLevelName(self.getEffectiveLevel())
        return "<%s %s (%s)>" % (self.__class__.__name__, self.name, level)


class RootLogger(Logger):
    def __init__(self, level):
        Logger.__init__(self, "root", level)


_loggerClass = Logger


class LoggerAdapter(object):
    def __init__(self, logger, extra=None):
        self.logger = logger
        self.extra = extra

    def process(self, msg, kwargs):
        kwargs["extra"] = self.extra
        return msg, kwargs

    def debug(self, msg, *args, **kwargs):
        self.log(DEBUG, msg, *args, **kwargs)

    def info(self, msg, *args, **kwargs):
        self.log(INFO, msg, *args, **kwargs)

    def warning(self, msg, *args, **kwargs):
        self.log(WARNING, msg, *args, **kwargs)

    def error(self, msg, *args, **kwargs):
        self.log(ERROR, msg, *args, **kwargs)

    def exception(self, msg, *args, exc_info=True, **kwargs):
        self.log(ERROR, msg, *args, exc_info=exc_info, **kwargs)

    def critical(self, msg, *args, **kwargs):
        self.log(CRITICAL, msg, *args, **kwargs)

    def log(self, level, msg, *args, **kwargs):
        if self.isEnabledFor(level):
            msg, kwargs = self.process(msg, kwargs)
            self.logger.log(level, msg, *args, **kwargs)

    def isEnabledFor(self, level):
        return self.logger.isEnabledFor(level)

    def setLevel(self, level):
        self.logger.setLevel(level)

    def getEffectiveLevel(self):
        return self.logger.getEffectiveLevel()

    def hasHandlers(self):
        return self.logger.hasHandlers()

    def _log(self, level, msg, args, **kwargs):
        return self.logger._log(level, msg, args, **kwargs)

    @property
    def manager(self):
        return self.logger.manager

    @manager.setter
    def manager(self, value):
        self.logger.manager = value

    @property
    def name(self):
        return self.logger.name

    def __repr__(self):
        logger = self.logger
        level = getLevelName(logger.getEffectiveLevel())
        return "<%s %s (%s)>" % (self.__class__.__name__, logger.name, level)


root = RootLogger(WARNING)
Logger.root = root
Logger.manager = Manager(Logger.root)

# ---------------------------------------------------------------------------
# Configuration classes and functions
# ---------------------------------------------------------------------------


def basicConfig(**kwargs):
    force = kwargs.pop("force", False)
    encoding = kwargs.pop("encoding", None)
    errors = kwargs.pop("errors", "backslashreplace")
    if force:
        for h in root.handlers[:]:
            root.removeHandler(h)
            h.close()
    if len(root.handlers) == 0:
        handlers = kwargs.pop("handlers", None)
        if handlers is None:
            if "stream" in kwargs and "filename" in kwargs:
                raise ValueError(
                    "'stream' and 'filename' should not be " "specified together"
                )
        else:
            if "stream" in kwargs or "filename" in kwargs:
                raise ValueError(
                    "'stream' or 'filename' should not be "
                    "specified together with 'handlers'"
                )
        if handlers is None:
            filename = kwargs.pop("filename", None)
            mode = kwargs.pop("filemode", "a")
            if filename:
                if "b" in mode:
                    errors = None
                h = FileHandler(filename, mode, encoding=encoding, errors=errors)
            else:
                stream = kwargs.pop("stream", None)
                h = StreamHandler(stream)
            handlers = [h]
        dfs = kwargs.pop("datefmt", None)
        style = kwargs.pop("style", "%")
        if style not in _STYLES:
            raise ValueError("Style must be one of: %s" % ",".join(_STYLES.keys()))
        fs = kwargs.pop("format", _STYLES[style][1])
        fmt = Formatter(fs, dfs, style)
        for h in handlers:
            if h.formatter is None:
                h.setFormatter(fmt)
            root.addHandler(h)
        level = kwargs.pop("level", None)
        if level is not None:
            root.setLevel(level)
        if kwargs:
            keys = ", ".join(kwargs.keys())
            raise ValueError("Unrecognised argument(s): %s" % keys)


def getLogger(name=None):
    if not name or isinstance(name, str) and name == root.name:
        return root
    return Logger.manager.getLogger(name)


def critical(msg, *args, **kwargs):
    if len(root.handlers) == 0:
        basicConfig()
    root.critical(msg, *args, **kwargs)


fatal = critical


def error(msg, *args, **kwargs):
    if len(root.handlers) == 0:
        basicConfig()
    root.error(msg, *args, **kwargs)


def exception(msg, *args, exc_info=True, **kwargs):
    error(msg, *args, exc_info=exc_info, **kwargs)


def warning(msg, *args, **kwargs):
    if len(root.handlers) == 0:
        basicConfig()
    root.warning(msg, *args, **kwargs)


def info(msg, *args, **kwargs):
    if len(root.handlers) == 0:
        basicConfig()
    root.info(msg, *args, **kwargs)


def debug(msg, *args, **kwargs):
    if len(root.handlers) == 0:
        basicConfig()
    root.debug(msg, *args, **kwargs)


def log(level, msg, *args, **kwargs):
    if len(root.handlers) == 0:
        basicConfig()
    root.log(level, msg, *args, **kwargs)


def disable(level=CRITICAL):
    root.manager.disable = level
    root.manager._clear_cache()


def shutdown(handlerList=[]):
    raise NotImplementedError("shutdown is not implemented")


class NullHandler(Handler):
    def handle(self, record):
        """Stub."""

    def emit(self, record):
        """Stub."""


def captureWarnings(capture):
    raise NotImplementedError("captureWarnings is not implemented")
