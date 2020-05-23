// Note: the hacky names on int, long, float have to correspond with the
// uniquization that the compiler does for words that are reserved in
// Javascript. This is a bit hokey.

Sk.builtins = {
    "round"     : null,
    "len"       : null,
    "min"       : null,
    "max"       : null,
    "sum"       : null,
    "abs"       : null,
    "fabs"      : null,
    "ord"       : null,
    "chr"       : null,
    "hex"       : null,
    "oct"       : null,
    "bin"       : null,
    "dir"       : null,
    "repr"      : null,
    "open"      : null,
    "isinstance": null,
    "hash"      : null,
    "getattr"   : null,
    "hasattr"   : null,
    "id"        : null,
    
    "reduce"    : null,
    "sorted"    : null,
    "any"       : null,
    "all"       : null,
    
    // iterator objects if py2 mode we replace these with sk_methods
    "enumerate" : Sk.builtin.enumerate,
    "filter"    : Sk.builtin.filter_,
    "map"       : Sk.builtin.map_,
    "range"     : Sk.builtin.range_,
    "reversed"  : Sk.builtin.reversed,
    "zip"       : Sk.builtin.zip_,

    "BaseException"      : Sk.builtin.BaseException, 
    "AttributeError"     : Sk.builtin.AttributeError,
    "ValueError"         : Sk.builtin.ValueError,
    "Exception"          : Sk.builtin.Exception,
    "ZeroDivisionError"  : Sk.builtin.ZeroDivisionError,
    "AssertionError"     : Sk.builtin.AssertionError,
    "ImportError"        : Sk.builtin.ImportError,
    "IndentationError"   : Sk.builtin.IndentationError,
    "IndexError"         : Sk.builtin.IndexError,
    "KeyError"           : Sk.builtin.KeyError,
    "TypeError"          : Sk.builtin.TypeError,
    "NameError"          : Sk.builtin.NameError,
    "IOError"            : Sk.builtin.IOError,
    "NotImplementedError": Sk.builtin.NotImplementedError,
    "SystemExit"         : Sk.builtin.SystemExit,
    "OverflowError"      : Sk.builtin.OverflowError,
    "OperationError"     : Sk.builtin.OperationError,
    "NegativePowerError" : Sk.builtin.NegativePowerError,
    "RuntimeError"       : Sk.builtin.RuntimeError,
    "StopIteration"      : Sk.builtin.StopIteration,
    "SyntaxError"        : Sk.builtin.SyntaxError,

    "float_$rw$": Sk.builtin.float_,
    "int_$rw$"  : Sk.builtin.int_,
    "bool"      : Sk.builtin.bool,
    "complex"   : Sk.builtin.complex,
    "dict"      : Sk.builtin.dict,
    "file"      : Sk.builtin.file,
    "function"  : Sk.builtin.func,
    "generator" : Sk.builtin.generator,
    "list"      : Sk.builtin.list,
    "long_$rw$" : Sk.builtin.lng,
    "method"    : Sk.builtin.method,
    "object"    : Sk.builtin.object,
    "slice"     : Sk.builtin.slice,
    "str"       : Sk.builtin.str,
    "set"       : Sk.builtin.set,
    "tuple"     : Sk.builtin.tuple,
    "type"      : Sk.builtin.type,

    "input"     : null,
    "raw_input" : new Sk.builtin.func(Sk.builtin.raw_input),
    "setattr"   : null,
    /*'read': Sk.builtin.read,*/
    "jseval"    : Sk.builtin.jseval,
    "jsmillis"  : Sk.builtin.jsmillis,
    "quit"      : new Sk.builtin.func(Sk.builtin.quit),
    "exit"      : new Sk.builtin.func(Sk.builtin.quit),
    "print"     : null,
    "divmod"    : null,
    "format"    : null,
    "globals"   : null,
    "issubclass": null,
    "iter"      : null,

    // Functions below are not implemented
    "bytearray" : Sk.builtin.bytearray,
    "callable"  : Sk.builtin.callable,
    "delattr"   : Sk.builtin.delattr,
    "eval_$rn$" : Sk.builtin.eval_,
    "execfile"  : Sk.builtin.execfile,
    "frozenset" : Sk.builtin.frozenset,
    "help"      : Sk.builtin.help,
    "locals"    : Sk.builtin.locals,
    "memoryview": Sk.builtin.memoryview,
    "next"      : Sk.builtin.next_,
    "pow"       : Sk.builtin.pow,
    "reload"    : Sk.builtin.reload,
    "super"     : Sk.builtin.super_,
    "unichr"    : Sk.builtin.unichr,
    "vars"      : Sk.builtin.vars,
    "xrange"    : Sk.builtin.xrange,
    "apply_$rn$": Sk.builtin.apply_,
    "buffer"    : Sk.builtin.buffer,
    "coerce"    : Sk.builtin.coerce,
    "intern"    : Sk.builtin.intern,


    "property"     : Sk.builtin.property,
    "classmethod"  : Sk.builtin.classmethod,
    "staticmethod" : Sk.builtin.staticmethod,
};


Sk.builtin.$method_defs = {
    __build_class__: {
        $meth: Sk.builtin.__build_class__,
        $flags: {},
        $textsig: null,
        $doc: "__build_class__(func, name, *bases, metaclass=None, **kwds) -> class\n\nInternal helper function used by the class statement."
    },

    __import__: {
        $meth: Sk.builtin.__import__,
        $flags: {},
        $textsig: null,
        $doc: "__import__(name, globals=None, locals=None, fromlist=(), level=0) -> module\n\nImport a module. Because this function is meant for use by the Python\ninterpreter and not for general use, it is better to use\nimportlib.import_module() to programmatically import a module.\n\nThe globals argument is only used to determine the context;\nthey are not modified.  The locals argument is unused.  The fromlist\nshould be a list of names to emulate ``from name import ...'', or an\nempty list to emulate ``import name''.\nWhen importing a module from a package, note that __import__('A.B', ...)\nreturns package A when fromlist is empty, but its submodule B when\nfromlist is not empty.  The level argument is used to determine whether to\nperform absolute or relative imports: 0 is absolute, while a positive number\nis the number of parent directories to search relative to the current module."
    },

    abs: {
        $meth: Sk.builtin.abs,
        $flags: {OneArg: true},
        $textsig: "($module, x, /)",
        $doc: "Return the absolute value of the argument."
    },

    all: {
        $meth: Sk.builtin.all,
        $flags: {OneArg: true},
        $textsig: "($module, iterable, /)",
        $doc: "Return True if bool(x) is True for all values x in the iterable.\n\nIf the iterable is empty, return True."
    },

    any: {
        $meth: Sk.builtin.any,
        $flags: {OneArg: true},
        $textsig: "($module, iterable, /)",
        $doc: "Return True if bool(x) is True for any x in the iterable.\n\nIf the iterable is empty, return False."
    },

    ascii: {
        $meth: Sk.builtin.ascii,
        $flags: {OneArg: true},
        $textsig: "($module, obj, /)",
        $doc: "Return an ASCII-only representation of an object.\n\nAs repr(), return a string containing a printable representation of an\nobject, but escape the non-ASCII characters in the string returned by\nrepr() using \\\\x, \\\\u or \\\\U escapes. This generates a string similar\nto that returned by repr() in Python 2."
    },

    bin: {
        $meth: Sk.builtin.bin,
        $flags: {OneArg: true},
        $textsig: "($module, number, /)",
        $doc: "Return the binary representation of an integer.\n\n   >>> bin(2796202)\n   '0b1010101010101010101010'"
    },

    breakpoint: {
        $meth: Sk.builtin.breakpoint,
        $flags: {},
        $textsig: null,
        $doc: "breakpoint(*args, **kws)\n\nCall sys.breakpointhook(*args, **kws).  sys.breakpointhook() must accept\nwhatever arguments are passed.\n\nBy default, this drops you into the pdb debugger."
    },

    callable: {
        $meth: Sk.builtin.callable,
        $flags: {OneArg: true},
        $textsig: "($module, obj, /)",
        $doc: "Return whether the object is callable (i.e., some kind of function).\n\nNote that classes are callable, as are instances of classes with a\n__call__() method."
    },

    chr: {
        $meth: Sk.builtin.chr,
        $flags: {OneArg: true},
        $textsig: "($module, i, /)",
        $doc: "Return a Unicode string of one character with ordinal i; 0 <= i <= 0x10ffff."
    },

    compile: {
        $meth: Sk.builtin.compile,
        $flags: {},
        $textsig: "($module, /, source, filename, mode, flags=0,\n        dont_inherit=False, optimize=-1)",
        $doc: "Compile source into a code object that can be executed by exec() or eval().\n\nThe source code may represent a Python module, statement or expression.\nThe filename will be used for run-time error messages.\nThe mode must be 'exec' to compile a module, 'single' to compile a\nsingle (interactive) statement, or 'eval' to compile an expression.\nThe flags argument, if present, controls which future statements influence\nthe compilation of the code.\nThe dont_inherit argument, if true, stops the compilation inheriting\nthe effects of any future statements in effect in the code calling\ncompile; if absent or false these statements do influence the compilation,\nin addition to any features explicitly specified."
    },

    delattr: {
        $meth: Sk.builtin.delattr,
        $flags: {MinArgs: 2, MaxArgs: 2},
        $textsig: "($module, obj, name, /)",
        $doc: "Deletes the named attribute from the given object.\n\ndelattr(x, 'y') is equivalent to ``del x.y''"
    },

    dir: {
        $meth: Sk.builtin.dir,
        $flags: {MinArgs:0, MaxArgs:1},
        $textsig: null,
        $doc: "dir([object]) -> list of strings\n\nIf called without an argument, return the names in the current scope.\nElse, return an alphabetized list of names comprising (some of) the attributes\nof the given object, and of attributes reachable from it.\nIf the object supplies a method named __dir__, it will be used; otherwise\nthe default dir() logic is used and returns:\n  for a module object: the module's attributes.\n  for a class object:  its attributes, and recursively the attributes\n    of its bases.\n  for any other object: its attributes, its class's attributes, and\n    recursively the attributes of its class's base classes."
    },

    divmod: {
        $meth: Sk.builtin.divmod,
        $flags: {MinArgs:2, MaxArgs:2},
        $textsig: "($module, x, y, /)",
        $doc: "Return the tuple (x//y, x%y).  Invariant: div*y + mod == x."
    },

    eval: {
        $meth: Sk.builtin.eval,
        $flags: {MaxArgs: 1, MaxArgs: 3},
        $textsig: "($module, source, globals=None, locals=None, /)",
        $doc: "Evaluate the given source in the context of globals and locals.\n\nThe source may be a string representing a Python expression\nor a code object as returned by compile().\nThe globals must be a dictionary and locals can be any mapping,\ndefaulting to the current globals and locals.\nIf only globals is given, locals defaults to it."
    },

    exec: {
        $meth: Sk.builtin.exec,
        $flags: {MinArgs:2, MaxArgs: 3},
        $textsig: "($module, source, globals=None, locals=None, /)",
        $doc: "Execute the given source in the context of globals and locals.\n\nThe source may be a string representing one or more Python statements\nor a code object as returned by compile().\nThe globals must be a dictionary and locals can be any mapping,\ndefaulting to the current globals and locals.\nIf only globals is given, locals defaults to it."
    },

    format: {
        $meth: Sk.builtin.format,
        $flags: {MinArgs: 1, MaxArgs: 2},
        $textsig: "($module, value, format_spec='', /)",
        $doc: "Return value.__format__(format_spec)\n\nformat_spec defaults to the empty string.\nSee the Format Specification Mini-Language section of help('FORMATTING') for\ndetails."
    },

    getattr: {
        $meth: Sk.builtin.getattr,
        $flags: {MinArgs: 2, MaxArgs: 3},
        $textsig: null,
        $doc: "getattr(object, name[, default]) -> value\n\nGet a named attribute from an object; getattr(x, 'y') is equivalent to x.y.\nWhen a default argument is given, it is returned when the attribute doesn't\nexist; without it, an exception is raised in that case."
    },

    globals: {
        $meth: Sk.builtin.globals,
        $flags: {NoArgs: true},
        $textsig: "($module, /)",
        $doc: "Return the dictionary containing the current scope's global variables.\n\nNOTE: Updates to this dictionary *will* affect name lookups in the current\nglobal scope and vice-versa."
    },

    hasattr: {
        $meth: Sk.builtin.hasattr,
        $flags: {MinArgs: 2, MaxArgs: 2},
        $textsig: "($module, obj, name, /)",
        $doc: "Return whether the object has an attribute with the given name.\n\nThis is done by calling getattr(obj, name) and catching AttributeError."
    },

    hash: {
        $meth: Sk.builtin.hash,
        $flags: {OneArg: true},
        $textsig: "($module, obj, /)",
        $doc: "Return the hash value for the given object.\n\nTwo objects that compare equal must also have the same hash value, but the\nreverse is not necessarily true."
    },

    hex: {
        $meth: Sk.builtin.hex,
        $flags: {OneArg: true},
        $textsig: "($module, number, /)",
        $doc: "Return the hexadecimal representation of an integer.\n\n   >>> hex(12648430)\n   '0xc0ffee'"
    },

    id: {
        $meth: Sk.builtin.id,
        $flags: {OneArg: true},
        $textsig: "($module, obj, /)",
        $doc: "Return the identity of an object.\n\nThis is guaranteed to be unique among simultaneously existing objects.\n(CPython uses the object's memory address.)"
    },

    input: {
        $meth: Sk.builtin.input,
        $flags: {MinArgs:0, MaxArgs: 1},
        $textsig: "($module, prompt=None, /)",
        $doc: "Read a string from standard input.  The trailing newline is stripped.\n\nThe prompt string, if given, is printed to standard output without a\ntrailing newline before reading input.\n\nIf the user hits EOF (*nix: Ctrl-D, Windows: Ctrl-Z+Return), raise EOFError.\nOn *nix systems, readline is used if available."
    },

    isinstance: {
        $meth: Sk.builtin.isinstance,
        $flags: {MinArgs:2, MaxArgs: 2},
        $textsig: "($module, obj, class_or_tuple, /)",
        $doc: "Return whether an object is an instance of a class or of a subclass thereof.\n\nA tuple, as in ``isinstance(x, (A, B, ...))``, may be given as the target to\ncheck against. This is equivalent to ``isinstance(x, A) or isinstance(x, B)\nor ...`` etc."
    },

    issubclass: {
        $meth: Sk.builtin.issubclass,
        $flags: {MinArgs: 2, MaxArgs: 2},
        $textsig: "($module, cls, class_or_tuple, /)",
        $doc: "Return whether 'cls' is a derived from another class or is the same class.\n\nA tuple, as in ``issubclass(x, (A, B, ...))``, may be given as the target to\ncheck against. This is equivalent to ``issubclass(x, A) or issubclass(x, B)\nor ...`` etc."
    },

    iter: {
        $meth: Sk.builtin.iter,
        $flags: {OneArg: true},
        $textsig: "($module, iterable /)",
        $doc: "iter(iterable) -> iterator\niter(callable, sentinel) -> iterator\n\nGet an iterator from an object.  In the first form, the argument must\nsupply its own iterator, or be a sequence.\nIn the second form, the callable is called until it returns the sentinel."
    },

    len: {
        $meth: Sk.builtin.len,
        $flags: {OneArg: true},
        $textsig: "($module, obj, /)",
        $doc: "Return the number of items in a container."
    },

    locals: {
        $meth: Sk.builtin.locals,
        $flags: {NoArgs: true},
        $textsig: "($module, /)",
        $doc: "Return a dictionary containing the current scope's local variables.\n\nNOTE: Whether or not updates to this dictionary will affect name lookups in\nthe local scope and vice-versa is *implementation dependent* and not\ncovered by any backwards compatibility guarantees."
    },

    max: {
        $meth: Sk.builtin.max,
        $flags: {}, // should be fastcall but leave for now
        $textsig: null,
        $doc: "max(iterable, *[, default=obj, key=func]) -> value\nmax(arg1, arg2, *args, *[, key=func]) -> value\n\nWith a single iterable argument, return its biggest item. The\ndefault keyword-only argument specifies an object to return if\nthe provided iterable is empty.\nWith two or more arguments, return the largest argument."
    },

    min: {
        $meth: Sk.builtin.min,
        $flags: {}, //should be fastcall but we'll leave for now
        $textsig: null,
        $doc: "min(iterable, *[, default=obj, key=func]) -> value\nmin(arg1, arg2, *args, *[, key=func]) -> value\n\nWith a single iterable argument, return its smallest item. The\ndefault keyword-only argument specifies an object to return if\nthe provided iterable is empty.\nWith two or more arguments, return the smallest argument."
    },

    next: {
        $meth: Sk.builtin.next,
        $flags: {MinArgs: 1, MaxArgs: 2},
        $textsig: null,
        $doc: "next(iterator[, default])\n\nReturn the next item from the iterator. If default is given and the iterator\nis exhausted, it is returned instead of raising StopIteration."
    },

    oct: {
        $meth: Sk.builtin.oct,
        $flags: {OneArg: true},
        $textsig: "($module, number, /)",
        $doc: "Return the octal representation of an integer.\n\n   >>> oct(342391)\n   '0o1234567'"
    },

    open: {
        $meth: Sk.builtin.open,
        $flags: {
            NamedArgs: ["file, mode, buffering, encoding, errors, newline, closefd, opener"],
            Defaults: [new Sk.builtin.str("r"), new Sk.builtin.int_(-1), Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.bool.true$, Sk.builtin.none.none$]
        },
        $textsig: "($module, /, file, mode='r', buffering=-1, encoding=None,\n     errors=None, newline=None, closefd=True, opener=None)",
        $doc: "Open file and return a stream.  Raise OSError upon failure.\n\nfile is either a text or byte string giving the name (and the path\nif the file isn\'t in the current working directory) of the file to\nbe opened or an integer file descriptor of the file to be\nwrapped. (If a file descriptor is given, it is closed when the\nreturned I/O object is closed, unless closefd is set to False.)\n\nmode is an optional string that specifies the mode in which the file\nis opened. It defaults to \'r\' which means open for reading in text\nmode.  Other common values are \'w\' for writing (truncating the file if\nit already exists), \'x\' for creating and writing to a new file, and\n\'a\' for appending (which on some Unix systems, means that all writes\nappend to the end of the file regardless of the current seek position).\nIn text mode, if encoding is not specified the encoding used is platform\ndependent: locale.getpreferredencoding(False) is called to get the\ncurrent locale encoding. (For reading and writing raw bytes use binary\nmode and leave encoding unspecified.) The available modes are:\n\n========= ===============================================================\nCharacter Meaning\n--------- ---------------------------------------------------------------\n\'r\'       open for reading (default)\n\'w\'       open for writing, truncating the file first\n\'x\'       create a new file and open it for writing\n\'a\'       open for writing, appending to the end of the file if it exists\n\'b\'       binary mode\n\'t\'       text mode (default)\n\'+\'       open a disk file for updating (reading and writing)\n\'U\'       universal newline mode (deprecated)\n========= ===============================================================\n\nThe default mode is \'rt\' (open for reading text). For binary random\naccess, the mode \'w+b\' opens and truncates the file to 0 bytes, while\n\'r+b\' opens the file without truncation. The \'x\' mode implies \'w\' and\nraises an `FileExistsError` if the file already exists.\n\nPython distinguishes between files opened in binary and text modes,\neven when the underlying operating system doesn\'t. Files opened in\nbinary mode (appending \'b\' to the mode argument) return contents as\nbytes objects without any decoding. In text mode (the default, or when\n\'t\' is appended to the mode argument), the contents of the file are\nreturned as strings, the bytes having been first decoded using a\nplatform-dependent encoding or using the specified encoding if given.\n\n\'U\' mode is deprecated and will raise an exception in future versions\nof Python.  It has no effect in Python 3.  Use newline to control\nuniversal newlines mode.\n\nbuffering is an optional integer used to set the buffering policy.\nPass 0 to switch buffering off (only allowed in binary mode), 1 to select\nline buffering (only usable in text mode), and an integer > 1 to indicate\nthe size of a fixed-size chunk buffer.  When no buffering argument is\ngiven, the default buffering policy works as follows:\n\n* Binary files are buffered in fixed-size chunks; the size of the buffer\n  is chosen using a heuristic trying to determine the underlying device\'s\n  \"block size\" and falling back on `io.DEFAULT_BUFFER_SIZE`.\n  On many systems, the buffer will typically be 4096 or 8192 bytes long.\n\n* \"Interactive\" text files (files for which isatty() returns True)\n  use line buffering.  Other text files use the policy described above\n  for binary files.\n\nencoding is the name of the encoding used to decode or encode the\nfile. This should only be used in text mode. The default encoding is\nplatform dependent, but any encoding supported by Python can be\npassed.  See the codecs module for the list of supported encodings.\n\nerrors is an optional string that specifies how encoding errors are to\nbe handled---this argument should not be used in binary mode. Pass\n\'strict\' to raise a ValueError exception if there is an encoding error\n(the default of None has the same effect), or pass \'ignore\' to ignore\nerrors. (Note that ignoring encoding errors can lead to data loss.)\nSee the documentation for codecs.register or run \'help(codecs.Codec)\'\nfor a list of the permitted encoding error strings.\n\nnewline controls how universal newlines works (it only applies to text\nmode). It can be None, \'\', \'\\n\', \'\\r\', and \'\\r\\n\'.  It works as\nfollows:\n\n* On input, if newline is None, universal newlines mode is\n  enabled. Lines in the input can end in \'\\n\', \'\\r\', or \'\\r\\n\', and\n  these are translated into \'\\n\' before being returned to the\n  caller. If it is \'\', universal newline mode is enabled, but line\n  endings are returned to the caller untranslated. If it has any of\n  the other legal values, input lines are only terminated by the given\n  string, and the line ending is returned to the caller untranslated.\n\n* On output, if newline is None, any \'\\n\' characters written are\n  translated to the system default line separator, os.linesep. If\n  newline is \'\' or \'\\n\', no translation takes place. If newline is any\n  of the other legal values, any \'\\n\' characters written are translated\n  to the given string.\n\nIf closefd is False, the underlying file descriptor will be kept open\nwhen the file is closed. This does not work when a file name is given\nand must be True in that case.\n\nA custom opener can be used by passing a callable as *opener*. The\nunderlying file descriptor for the file object is then obtained by\ncalling *opener* with (*file*, *flags*). *opener* must return an open\nfile descriptor (passing os.open as *opener* results in functionality\nsimilar to passing None).\n\nopen() returns a file object whose type depends on the mode, and\nthrough which the standard file operations such as reading and writing\nare performed. When open() is used to open a file in a text mode (\'w\',\n\'r\', \'wt\', \'rt\', etc.), it returns a TextIOWrapper. When used to open\na file in a binary mode, the returned class varies: in read binary\nmode, it returns a BufferedReader; in write binary and append binary\nmodes, it returns a BufferedWriter, and in read/write mode, it returns\na BufferedRandom.\n\nIt is also possible to use a string or bytearray as a file for both\nreading and writing. For strings StringIO can be used like a file\nopened in a text mode, and for bytes a BytesIO can be used like a file\nopened in a binary mode."
    },

    ord: {
        $meth: Sk.builtin.ord,
        $flags: {OneArg: true},
        $textsig: "($module, c, /)",
        $doc: "Return the Unicode code point for a one-character string."
    },

    pow: {
        $meth: Sk.builtin.pow,
        $flags: {MinArgs:2, MaxArgs: 3},
        $textsig: "($module, x, y, z=None, /)",
        $doc: "Equivalent to x**y (with two arguments) or x**y % z (with three arguments)\n\nSome types, such as ints, are able to use a more efficient algorithm when\ninvoked using the three argument form."
    },

    print: {
        $meth: Sk.builtin.print,
        $flags: {}, // should be fastcall for now leave to builtin.func.prototype.tp$call
        $textsig: null,
        $doc: "print(value, ..., sep=' ', end='\\n', file=sys.stdout, flush=False)\n\nPrints the values to a stream, or to sys.stdout by default.\nOptional keyword arguments:\nfile:  a file-like object (stream); defaults to the current sys.stdout.\nsep:   string inserted between values, default a space.\nend:   string appended after the last value, default a newline.\nflush: whether to forcibly flush the stream."
    },

    repr: {
        $meth: Sk.builtin.repr,
        $flags: {OneArg: true},
        $textsig: "($module, obj, /)",
        $doc: "Return the canonical string representation of the object.\n\nFor many object types, including most builtins, eval(repr(obj)) == obj."
    },

    round: {
        $meth: Sk.builtin.round,
        $flags: {
            NamedArgs: ["number, ndigits"], 
            Defaults: [Sk.builtin.none.none$]},
        $textsig: "($module, /, number, ndigits=None)",
        $doc: "Round a number to a given precision in decimal digits.\n\nThe return value is an integer if ndigits is omitted or None.  Otherwise\nthe return value has the same type as the number.  ndigits may be negative."
    },

    setattr: {
        $meth: Sk.builtin.setattr,
        $flags: {MinArgs: 3, MaxArgs: 3},
        $textsig: "($module, obj, name, value, /)",
        $doc: "Sets the named attribute on the given object to the specified value.\n\nsetattr(x, 'y', v) is equivalent to ``x.y = v''"
    },

    sorted: {
        $meth: Sk.builtin.sorted,
        $flags: {}, // should be fast call leave for func.tp$call
        $textsig: "($module, iterable, /, *, key=None, reverse=False)",
        $doc: "Return a new list containing all items from the iterable in ascending order.\n\nA custom key function can be supplied to customize the sort order, and the\nreverse flag can be set to request the result in descending order."
    },

    sum: {
        $meth: Sk.builtin.sum,
        $flags: {
            NamedArgs: [null, "start"],
            Defaults: [new Sk.builtin.int_(0)]
        },
        $textsig: "($module, iterable, /, start=0)", //changed in python 3.8 start 
        $doc: "Return the sum of a 'start' value (default: 0) plus an iterable of numbers\n\nWhen the iterable is empty, return the start value.\nThis function is intended specifically for use with numeric values and may\nreject non-numeric types."
    },

    vars: {
        $meth: Sk.builtin.vars,
        $flags: {MinArgs:0, MaxArgs: 1},
        $textsig: null,
        $doc: "vars([object]) -> dictionary\n\nWithout arguments, equivalent to locals().\nWith an argument, equivalent to object.__dict__."
    },


};

for (method_def_name in Sk.builtin.$method_defs) {
    Sk.builtins[method_def] = new Sk.builtin.sk_method(Sk.builtin.$method_defs[method_def_name]);
}

Sk.setupObjects = function (py3) {
    if (!py3) {
        delete Sk.builtins.StandardError.sk$abstract;
        Sk.builtins["filter"] = new Sk.builtin.func(Sk.builtin.filter);
        Sk.builtins["map"] = new Sk.builtin.func(Sk.builtin.map);
        Sk.builtins["zip"] = new Sk.builtin.func(Sk.builtin.zip);
        Sk.builtins["range"] = new Sk.builtin.func(Sk.builtin.range);
        Sk.builtins["xrange"] = new Sk.builtin.func(Sk.builtin.xrange);
        Sk.builtins["StandardError"] = Sk.builtin.StandardError;
        Sk.builtins["unicode"] = Sk.builtin.str;
    }
};

Sk.exportSymbol("Sk.setupObjects", Sk.setupObjects);
Sk.exportSymbol("Sk.builtins", Sk.builtins);