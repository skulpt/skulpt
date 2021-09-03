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
    "ArithmeticError"    : Sk.builtin.ArithmeticError,
    "ValueError"         : Sk.builtin.ValueError,
    "Exception"          : Sk.builtin.Exception,
    "ZeroDivisionError"  : Sk.builtin.ZeroDivisionError,
    "AssertionError"     : Sk.builtin.AssertionError,
    "ImportError"        : Sk.builtin.ImportError,
    "ModuleNotFoundError": Sk.builtin.ModuleNotFoundError,
    "IndentationError"   : Sk.builtin.IndentationError,
    "IndexError"         : Sk.builtin.IndexError,
    "LookupError"        : Sk.builtin.LookupError,
    "KeyError"           : Sk.builtin.KeyError,
    "TypeError"          : Sk.builtin.TypeError,
    "UnicodeDecodeError" : Sk.builtin.UnicodeDecodeError,
    "UnicodeEncodeError" : Sk.builtin.UnicodeEncodeError,
    "NameError"          : Sk.builtin.NameError,
    "UnboundLocalError"  : Sk.builtin.UnboundLocalError,
    "IOError"            : Sk.builtin.IOError,
    "NotImplementedError": Sk.builtin.NotImplementedError,
    "SystemExit"         : Sk.builtin.SystemExit,
    "OverflowError"      : Sk.builtin.OverflowError,
    "OperationError"     : Sk.builtin.OperationError,
    "NegativePowerError" : Sk.builtin.NegativePowerError,
    "RuntimeError"       : Sk.builtin.RuntimeError,
    "RecursionError"     : Sk.builtin.RecursionError,
    "StopIteration"      : Sk.builtin.StopIteration,
    "SyntaxError"        : Sk.builtin.SyntaxError,
    "SystemError"        : Sk.builtin.SystemError,
    "KeyboardInterrupt"  : Sk.builtin.KeyboardInterrupt,

    "float_$rw$": Sk.builtin.float_,
    "int_$rw$"  : Sk.builtin.int_,
    "bool"      : Sk.builtin.bool,
    "complex"   : Sk.builtin.complex,
    "dict"      : Sk.builtin.dict,
    "file"      : Sk.builtin.file,
    "frozenset" : Sk.builtin.frozenset,
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
    // "bytearray" : Sk.builtin.bytearray,
    // "callable"  : Sk.builtin.callable,
    // "delattr"   : Sk.builtin.delattr,
    // "eval_$rw$" : Sk.builtin.eval_,
    "execfile"  : Sk.builtin.execfile,
    
    "help"      : Sk.builtin.help,
    // "locals"    : Sk.builtin.locals,
    "memoryview": Sk.builtin.memoryview,
    // "next"      : Sk.builtin.next_,
    // "pow"       : Sk.builtin.pow,
    "reload"    : Sk.builtin.reload,
    "super_$rw$"     : Sk.builtin.super_,
    "unichr"    : new Sk.builtin.func(Sk.builtin.unichr),
    "vars"      : Sk.builtin.vars,
    "apply_$rw$": Sk.builtin.apply_,
    "buffer"    : Sk.builtin.buffer,
    "coerce"    : Sk.builtin.coerce,
    "intern"    : Sk.builtin.intern,


    "property"     : Sk.builtin.property,
    "classmethod"  : Sk.builtin.classmethod,
    "staticmethod" : Sk.builtin.staticmethod,

    "Ellipsis": Sk.builtin.Ellipsis,

    "setCanvasSize"      : Sk.builtin.setCanvasSize,
    "setConsoleSize"     : Sk.builtin.setConsoleSize,
    "noCanvas"           : Sk.builtin.noCanvas,
    "focusCanvas"        : Sk.builtin.focusCanvas,
    "background"         : Sk.builtin.background,
    "text"               : Sk.builtin.text,
    "saveState"          : Sk.builtin.saveState,
    "restoreState"       : Sk.builtin.restoreState,
    "translate"          : Sk.builtin.translate,
    "angleMode"          : Sk.builtin.angleMode,
    "rectMode"           : Sk.builtin.rectMode,
    "circleMode"         : Sk.builtin.circleMode,
    "rotate"             : Sk.builtin.rotate,
    "applyMatrix"        : Sk.builtin.applyMatrix,
    "shearX"             : Sk.builtin.shearX,
    "shearY"             : Sk.builtin.shearY,
    "strokeWeight"       : Sk.builtin.strokeWeight,
    "fill"               : Sk.builtin.fill,
    "noFill"             : Sk.builtin.noFill,
    "stroke"             : Sk.builtin.stroke,
    "noStroke"           : Sk.builtin.noStroke,
    "line"               : Sk.builtin.line,
    "circle"             : Sk.builtin.circle,
    "ellipse"            : Sk.builtin.ellipse,
    "arc"                : Sk.builtin.arc,
    "triangle"           : Sk.builtin.triangle,
    "quad"               : Sk.builtin.quad,
    "point"              : Sk.builtin.point,
    "rect"               : Sk.builtin.rect,
    "beginShape"         : Sk.builtin.beginShape,
    "vertex"             : Sk.builtin.vertex,
    "endShape"           : Sk.builtin.endShape,
    "loadImage"          : Sk.builtin.loadImage,
    "image"              : Sk.builtin.image,
    "_getImageHeight"    : Sk.builtin._getImageHeight,
    "_getImageWidth"     : Sk.builtin._getImageWidth,
    "_getFont"           : Sk.builtin._getFont,
    "_setFont"           : Sk.builtin._setFont,
    "_measureText"       : Sk.builtin._measureText,
    "_getFillStyle"      : Sk.builtin._getFillStyle,
    "_setFillStyle"      : Sk.builtin._setFillStyle,
    "_getStrokeStyle"    : Sk.builtin._getStrokeStyle,
    "_setStrokeStyle"    : Sk.builtin._setStrokeStyle,
    "_getLineWidth"      : Sk.builtin._getLineWidth,
    "_setLineWidth"      : Sk.builtin._setLineWidth,
    "_getDoStroke"       : Sk.builtin._getDoStroke,
    "_setDoStroke"       : Sk.builtin._setDoStroke,
    "loadSound"          : Sk.builtin.loadSound,
    "playSound"          : Sk.builtin.playSound,
    "stopSound"          : Sk.builtin.stopSound,
    "pauseSound"         : Sk.builtin.pauseSound,
    "stopAllSounds"      : Sk.builtin.stopAllSounds,
    "_getPixelColour"    : Sk.builtin._getPixelColour,
    "isKeyPressed"       : Sk.builtin.isKeyPressed,
    "wasKeyPressed"      : Sk.builtin.wasKeyPressed,
    "dist"               : Sk.builtin.dist,
    "setTextSize"        : Sk.builtin.setTextSize,
    "setTextColour"      : Sk.builtin.setTextColour,
    "setHighlightColour" : Sk.builtin.setHighlightColour,
    "clear"              : Sk.builtin.clear,
    "sleep"              : Sk.builtin.sleep,
};

const pyNone = Sk.builtin.none.none$;
const emptyTuple = new Sk.builtin.tuple();
const pyZero = new Sk.builtin.int_(0);

Sk.abstr.setUpModuleMethods("builtins", Sk.builtins, {
    // __build_class__: {
    //     $meth: Sk.builtin.__build_class__,
    //     $flags: {},
    //     $textsig: null,
    //     $doc: "__build_class__(func, name, *bases, metaclass=None, **kwds) -> class\n\nInternal helper function used by the class statement."
    // },

    __import__: {
        $meth(name, globals, _locals, formlist, level) {
            if (!Sk.builtin.checkString(name)) {
                throw new Sk.builtin.TypeError("__import__() argument 1 must be str, not " + name.tp$name);
            } else if (name.v === "" && level.v === 0) {
                throw new Sk.builtin.ValueError("Empty module name");
            }
            // check globals - locals is just ignored __import__
            globals = globLocToJs(globals, "globals") || {};
            formlist = Sk.ffi.remapToJs(formlist);
            level = Sk.ffi.remapToJs(level);

            return Sk.builtin.__import__(name, globals, undefined, formlist, level);
        },
        $flags: {
            NamedArgs: ["name", "globals", "locals", "fromlist", "level"],
            Defaults: [pyNone, pyNone, emptyTuple, pyZero],
        },
        $textsig: null,
        $doc: "__import__(name, globals=None, locals=None, fromlist=(), level=0) -> module\n\nImport a module. Because this function is meant for use by the Python\ninterpreter and not for general use, it is better to use\nimportlib.import_module() to programmatically import a module.\n\nThe globals argument is only used to determine the context;\nthey are not modified.  The locals argument is unused.  The fromlist\nshould be a list of names to emulate ``from name import ...'', or an\nempty list to emulate ``import name''.\nWhen importing a module from a package, note that __import__('A.B', ...)\nreturns package A when fromlist is empty, but its submodule B when\nfromlist is not empty.  The level argument is used to determine whether to\nperform absolute or relative imports: 0 is absolute, while a positive number\nis the number of parent directories to search relative to the current module.",
    },

    abs: {
        $meth: Sk.builtin.abs,
        $flags: { OneArg: true },
        $textsig: "($module, x, /)",
        $doc: "Return the absolute value of the argument.",
    },

    all: {
        $meth: Sk.builtin.all,
        $flags: { OneArg: true },
        $textsig: "($module, iterable, /)",
        $doc: "Return True if bool(x) is True for all values x in the iterable.\n\nIf the iterable is empty, return True.",
    },

    any: {
        $meth: Sk.builtin.any,
        $flags: { OneArg: true },
        $textsig: "($module, iterable, /)",
        $doc: "Return True if bool(x) is True for any x in the iterable.\n\nIf the iterable is empty, return False.",
    },

    ascii: {
        $meth: Sk.builtin.ascii,
        $flags: {OneArg: true},
        $textsig: "($module, obj, /)",
        $doc: "Return an ASCII-only representation of an object.\n\nAs repr(), return a string containing a printable representation of an\nobject, but escape the non-ASCII characters in the string returned by\nrepr() using \\\\x, \\\\u or \\\\U escapes. This generates a string similar\nto that returned by repr() in Python 2."
    },

    bin: {
        $meth: Sk.builtin.bin,
        $flags: { OneArg: true },
        $textsig: "($module, number, /)",
        $doc: "Return the binary representation of an integer.\n\n   >>> bin(2796202)\n   '0b1010101010101010101010'",
    },

    // breakpoint: {
    //     $meth: Sk.builtin.breakpoint,
    //     $flags: {},
    //     $textsig: null,
    //     $doc: "breakpoint(*args, **kws)\n\nCall sys.breakpointhook(*args, **kws).  sys.breakpointhook() must accept\nwhatever arguments are passed.\n\nBy default, this drops you into the pdb debugger."
    // },

    callable: {
        $meth: Sk.builtin.callable,
        $flags: { OneArg: true },
        $textsig: "($module, obj, /)",
        $doc:
            "Return whether the object is callable (i.e., some kind of function).\n\nNote that classes are callable, as are instances of classes with a\n__call__() method.",
    },

    chr: {
        $meth: Sk.builtin.chr,
        $flags: { OneArg: true },
        $textsig: "($module, i, /)",
        $doc: "Return a Unicode string of one character with ordinal i; 0 <= i <= 0x10ffff.",
    },

    compile: {
        $meth: Sk.builtin.compile,
        $flags: {MinArgs: 3, MaxArgs:6},
        $textsig: "($module, /, source, filename, mode, flags=0,\n        dont_inherit=False, optimize=-1)",
        $doc: "Compile source into a code object that can be executed by exec() or eval().\n\nThe source code may represent a Python module, statement or expression.\nThe filename will be used for run-time error messages.\nThe mode must be 'exec' to compile a module, 'single' to compile a\nsingle (interactive) statement, or 'eval' to compile an expression.\nThe flags argument, if present, controls which future statements influence\nthe compilation of the code.\nThe dont_inherit argument, if true, stops the compilation inheriting\nthe effects of any future statements in effect in the code calling\ncompile; if absent or false these statements do influence the compilation,\nin addition to any features explicitly specified."
    },

    delattr: {
        $meth: Sk.builtin.delattr,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module, obj, name, /)",
        $doc: "Deletes the named attribute from the given object.\n\ndelattr(x, 'y') is equivalent to ``del x.y''",
    },

    dir: {
        $meth: Sk.builtin.dir,
        $flags: { MinArgs: 0, MaxArgs: 1 },
        $textsig: null,
        $doc:
            "dir([object]) -> list of strings\n\nIf called without an argument, return the names in the current scope.\nElse, return an alphabetized list of names comprising (some of) the attributes\nof the given object, and of attributes reachable from it.\nIf the object supplies a method named __dir__, it will be used; otherwise\nthe default dir() logic is used and returns:\n  for a module object: the module's attributes.\n  for a class object:  its attributes, and recursively the attributes\n    of its bases.\n  for any other object: its attributes, its class's attributes, and\n    recursively the attributes of its class's base classes.",
    },

    divmod: {
        $meth: Sk.builtin.divmod,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module, x, y, /)",
        $doc: "Return the tuple (x//y, x%y).  Invariant: div*y + mod == x.",
    },

    eval_$rw$: {
        $name: "eval",
        $meth: function (source, globals, locals) {
            // check globals
            const tmp_globals = globLocToJs(globals, "globals");
            // check locals
            const tmp_locals = globLocToJs(locals, "locals");
            return Sk.misceval.chain(Sk.builtin.eval(source, tmp_globals, tmp_locals), (res) => {
                reassignGlobLoc(globals, tmp_globals);
                reassignGlobLoc(locals, tmp_locals);
                return res;
            });
        },
        $flags: { MinArgs: 1, MaxArgs: 3 },
        $textsig: "($module, source, globals=None, locals=None, /)",
        $doc:
            "Evaluate the given source in the context of globals and locals.\n\nThe source may be a string representing a Python expression\nor a code object as returned by compile().\nThe globals must be a dictionary and locals can be any mapping,\ndefaulting to the current globals and locals.\nIf only globals is given, locals defaults to it.",
    },

    exec: {
        $meth: function (source, globals, locals) {
            // check globals
            const tmp_globals = globLocToJs(globals, "globals");
            // check locals
            const tmp_locals = globLocToJs(locals, "locals");
            return Sk.misceval.chain(Sk.builtin.exec(source, tmp_globals, tmp_locals), (new_locals) => {
                reassignGlobLoc(globals, tmp_globals);
                reassignGlobLoc(locals, tmp_locals);
                return Sk.builtin.none.none$;
            });
        },
        $flags: { MinArgs: 1, MaxArgs: 3 },
        $textsig: "($module, source, globals=None, locals=None, /)",
        $doc:
            "Execute the given source in the context of globals and locals.\n\nThe source may be a string representing one or more Python statements\nor a code object as returned by compile().\nThe globals must be a dictionary and locals can be any mapping,\ndefaulting to the current globals and locals.\nIf only globals is given, locals defaults to it.",
    },

    format: {
        $meth: Sk.builtin.format,
        $flags: { MinArgs: 1, MaxArgs: 2 },
        $textsig: "($module, value, format_spec='', /)",
        $doc:
            "Return value.__format__(format_spec)\n\nformat_spec defaults to the empty string.\nSee the Format Specification Mini-Language section of help('FORMATTING') for\ndetails.",
    },

    getattr: {
        $meth: Sk.builtin.getattr,
        $flags: { MinArgs: 2, MaxArgs: 3 },
        $textsig: null,
        $doc:
            "getattr(object, name[, default]) -> value\n\nGet a named attribute from an object; getattr(x, 'y') is equivalent to x.y.\nWhen a default argument is given, it is returned when the attribute doesn't\nexist; without it, an exception is raised in that case.",
    },

    globals: {
        $meth: Sk.builtin.globals,
        $flags: { NoArgs: true },
        $textsig: "($module, /)",
        $doc:
            "Return the dictionary containing the current scope's global variables.\n\nNOTE: Updates to this dictionary *will* affect name lookups in the current\nglobal scope and vice-versa.",
    },

    hasattr: {
        $meth: Sk.builtin.hasattr,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module, obj, name, /)",
        $doc:
            "Return whether the object has an attribute with the given name.\n\nThis is done by calling getattr(obj, name) and catching AttributeError.",
    },

    hash: {
        $meth: Sk.builtin.hash,
        $flags: { OneArg: true },
        $textsig: "($module, obj, /)",
        $doc:
            "Return the hash value for the given object.\n\nTwo objects that compare equal must also have the same hash value, but the\nreverse is not necessarily true.",
    },

    hex: {
        $meth: Sk.builtin.hex,
        $flags: { OneArg: true },
        $textsig: "($module, number, /)",
        $doc: "Return the hexadecimal representation of an integer.\n\n   >>> hex(12648430)\n   '0xc0ffee'",
    },

    id: {
        $meth: Sk.builtin.id,
        $flags: { OneArg: true },
        $textsig: "($module, obj, /)",
        $doc:
            "Return the identity of an object.\n\nThis is guaranteed to be unique among simultaneously existing objects.\n(CPython uses the object's memory address.)",
    },

    input: {
        $meth: Sk.builtin.input,
        $flags: { MinArgs: 0, MaxArgs: 1 },
        $textsig: "($module, prompt=None, /)",
        $doc:
            "Read a string from standard input.  The trailing newline is stripped.\n\nThe prompt string, if given, is printed to standard output without a\ntrailing newline before reading input.\n\nIf the user hits EOF (*nix: Ctrl-D, Windows: Ctrl-Z+Return), raise EOFError.\nOn *nix systems, readline is used if available.",
    },

    isinstance: {
        $meth: Sk.builtin.isinstance,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module, obj, class_or_tuple, /)",
        $doc:
            "Return whether an object is an instance of a class or of a subclass thereof.\n\nA tuple, as in ``isinstance(x, (A, B, ...))``, may be given as the target to\ncheck against. This is equivalent to ``isinstance(x, A) or isinstance(x, B)\nor ...`` etc.",
    },

    issubclass: {
        $meth: Sk.builtin.issubclass,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module, cls, class_or_tuple, /)",
        $doc:
            "Return whether 'cls' is a derived from another class or is the same class.\n\nA tuple, as in ``issubclass(x, (A, B, ...))``, may be given as the target to\ncheck against. This is equivalent to ``issubclass(x, A) or issubclass(x, B)\nor ...`` etc.",
    },

    iter: {
        $meth: Sk.builtin.iter,
        $flags: { MinArgs: 1, MaxArgs: 2 },
        $textsig: "($module, iterable /)",
        $doc:
            "iter(iterable) -> iterator\niter(callable, sentinel) -> iterator\n\nGet an iterator from an object.  In the first form, the argument must\nsupply its own iterator, or be a sequence.\nIn the second form, the callable is called until it returns the sentinel.",
    },

    len: {
        $meth: Sk.builtin.len,
        $flags: { OneArg: true },
        $textsig: "($module, obj, /)",
        $doc: "Return the number of items in a container.",
    },

    locals: {
        $meth: Sk.builtin.locals,
        $flags: { NoArgs: true },
        $textsig: "($module, /)",
        $doc:
            "Return a dictionary containing the current scope's local variables.\n\nNOTE: Whether or not updates to this dictionary will affect name lookups in\nthe local scope and vice-versa is *implementation dependent* and not\ncovered by any backwards compatibility guarantees.",
    },

    max: {
        $meth: Sk.builtin.max,
        $flags: { FastCall: true },
        $textsig: null,
        $doc:
            "max(iterable, *[, default=obj, key=func]) -> value\nmax(arg1, arg2, *args, *[, key=func]) -> value\n\nWith a single iterable argument, return its biggest item. The\ndefault keyword-only argument specifies an object to return if\nthe provided iterable is empty.\nWith two or more arguments, return the largest argument.",
    },

    min: {
        $meth: Sk.builtin.min,
        $flags: { FastCall: true },
        $textsig: null,
        $doc:
            "min(iterable, *[, default=obj, key=func]) -> value\nmin(arg1, arg2, *args, *[, key=func]) -> value\n\nWith a single iterable argument, return its smallest item. The\ndefault keyword-only argument specifies an object to return if\nthe provided iterable is empty.\nWith two or more arguments, return the smallest argument.",
    },

    next: {
        $name: "next",
        $meth: Sk.builtin.next_,
        $flags: { MinArgs: 1, MaxArgs: 2 },
        $textsig: null,
        $doc:
            "next(iterator[, default])\n\nReturn the next item from the iterator. If default is given and the iterator\nis exhausted, it is returned instead of raising StopIteration.",
    },

    oct: {
        $meth: Sk.builtin.oct,
        $flags: { OneArg: true },
        $textsig: "($module, number, /)",
        $doc: "Return the octal representation of an integer.\n\n   >>> oct(342391)\n   '0o1234567'",
    },

    open: {
        $meth: Sk.builtin.open,
        $flags: {
            MinArgs: 1,
            MaxArgs: 3,
            //NamedArgs: ["file, mode, buffering, encoding, errors, newline, closefd, opener"],
            //Defaults: [new Sk.builtin.str("r"), new Sk.builtin.int_(-1), Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.bool.true$, Sk.builtin.none.none$]
        },
        $textsig: null,
        // $textsig: "($module, /, file, mode='r', buffering=-1, encoding=None,\n     errors=None, newline=None, closefd=True, opener=None)",
        // this is the python 2 documentation since we don't support the py3 version
        $doc:
            "open(name[, mode[, buffering]]) -> file object\n\nOpen a file using the file() type, returns a file object.  This is the\npreferred way to open a file.  See file.__doc__ for further information.",
    },

    ord: {
        $meth: Sk.builtin.ord,
        $flags: { OneArg: true },
        $textsig: "($module, c, /)",
        $doc: "Return the Unicode code point for a one-character string.",
    },

    pow: {
        $meth: Sk.builtin.pow,
        $flags: { MinArgs: 2, MaxArgs: 3 },
        $textsig: "($module, x, y, z=None, /)",
        $doc:
            "Equivalent to x**y (with two arguments) or x**y % z (with three arguments)\n\nSome types, such as ints, are able to use a more efficient algorithm when\ninvoked using the three argument form.",
    },

    print: {
        $meth: Sk.builtin.print,
        $flags: { FastCall: true },
        $textsig: null,
        $doc:
            "print(value, ..., sep=' ', end='\\n', file=sys.stdout, flush=False)\n\nPrints the values to a stream, or to sys.stdout by default.\nOptional keyword arguments:\nfile:  a file-like object (stream); defaults to the current sys.stdout.\nsep:   string inserted between values, default a space.\nend:   string appended after the last value, default a newline.\nflush: whether to forcibly flush the stream.",
    },

    repr: {
        $meth: Sk.builtin.repr,
        $flags: { OneArg: true },
        $textsig: "($module, obj, /)",
        $doc: "Return the canonical string representation of the object.\n\nFor many object types, including most builtins, eval(repr(obj)) == obj.",
    },

    round: {
        $meth: Sk.builtin.round,
        $flags: {
            NamedArgs: ["number", "ndigits"],
        },
        $textsig: "($module, /, number, ndigits=None)",
        $doc:
            "Round a number to a given precision in decimal digits.\n\nThe return value is an integer if ndigits is omitted or None.  Otherwise\nthe return value has the same type as the number.  ndigits may be negative.",
    },

    setattr: {
        $meth: Sk.builtin.setattr,
        $flags: { MinArgs: 3, MaxArgs: 3 },
        $textsig: "($module, obj, name, value, /)",
        $doc: "Sets the named attribute on the given object to the specified value.\n\nsetattr(x, 'y', v) is equivalent to ``x.y = v''",
    },

    sorted: {
        $meth: Sk.builtin.sorted,
        $flags: {
            NamedArgs: [null, "cmp", "key", "reverse"],
            Defaults: [Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.bool.false$],
        }, // should be fast call leave for now
        $textsig: "($module, iterable, /, *, key=None, reverse=False)",
        $doc:
            "Return a new list containing all items from the iterable in ascending order.\n\nA custom key function can be supplied to customize the sort order, and the\nreverse flag can be set to request the result in descending order.",
    },

    sum: {
        $meth: Sk.builtin.sum,
        $flags: {
            NamedArgs: [null, "start"],
            Defaults: [new Sk.builtin.int_(0)],
        },
        $textsig: "($module, iterable, /, start=0)", //changed in python 3.8 start
        $doc:
            "Return the sum of a 'start' value (default: 0) plus an iterable of numbers\n\nWhen the iterable is empty, return the start value.\nThis function is intended specifically for use with numeric values and may\nreject non-numeric types.",
    },

    vars: {
        $meth: Sk.builtin.vars,
        $flags: { MinArgs: 0, MaxArgs: 1 },
        $textsig: null,
        $doc: "vars([object]) -> dictionary\n\nWithout arguments, equivalent to locals().\nWith an argument, equivalent to object.__dict__.",
    },
    // PyAngelo Methods
    setCanvasSize: {
        $meth: Sk.builtin.setCanvasSize,
        $flags: {
            NamedArgs: [null, null, "yAxisMode"],
            Defaults: [new Sk.builtin.int_(2)],
        },
        $textsig: "($module, w, h, yAxisMode /)",
        $doc:
            "Sets the size of the canvas that all drawings are written to. The first parameter specifies the width in pixels and the second the height. The thrid parameter specifies the direction of the y axis. The constant CARTESIAN can be used to specify the y axis acts like a regular cartesian plane in maths, and JAVASCRIPT can be used to specify a traditional javascript y-axis that moves down the screen.",
    },
    setConsoleSize: {
        $meth: Sk.builtin.setConsoleSize,
        $flags: { MinArgs: 1, MaxArgs: 1 },
        $textsig: "($module, size /)",
        $doc:
            "Sets the size of the console.",
    },
    noCanvas: {
        $meth: Sk.builtin.noCanvas,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Hides the canvas.",
    },
    focusCanvas: {
        $meth: Sk.builtin.focusCanvas,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Places focus back on the canvas so it can receive keyboar events.",
    },
    background: {
        $meth: Sk.builtin.background,
        $flags: {
            NamedArgs: ["r", "g", "b", "a"],
            Defaults: [new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(1)],
        },
        $textsig: "($module, r, g, b, a /)",
        $doc:
            "Draws a rectangle the size of the canvas. The colour of the rectangle is specifed by the first three parameters representing an RGB colour. If a fourth parameter is passed it specifies an alpha value ranging from 0 to 1 where 0 is fully transparent and 1 specifies no transparency.",
    },
    text: {
        $meth: Sk.builtin.text,
        $flags: {
            NamedArgs: [null, null, null, "fontSize", "fontName"],
            Defaults: [new Sk.builtin.int_(20), new Sk.builtin.str("Arial")],
        },
        $textsig: "($module, text, x, y, fontSize, fontName /)",
        $doc:
            "Draws the specified text on the canvas at the postition (x, y). The text will have a default size of 20 and default font of Arial.",
    },
    saveState: {
        $meth: Sk.builtin.saveState,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Saves the current drawing style settings and transformations.",
    },
    restoreState: {
        $meth: Sk.builtin.restoreState,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Restores the latest version of the drawing style settings and transformations.",
    },
    translate: {
        $meth: Sk.builtin.translate,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module, x, y /)",
        $doc:
            "Moves the position of the origin. The first parameter specifies the number of pixels along the x axis, and the second paramter specifies the number of pixels along the y axis. If tranlate is called twice, the effects are cumulative. So calling translate(10, 10) followed by translate(20, 20) is the same as calling translate(30, 30).",
    },
    angleMode: {
        $meth: Sk.builtin.angleMode,
        $flags: { OneArg: true },
        $textsig: "($module, mode /)",
        $doc:
            "Specifies whether angles are supplied in radians or degrees.",
    },
    rectMode: {
        $meth: Sk.builtin.rectMode,
        $flags: { OneArg: true },
        $textsig: "($module, mode /)",
        $doc:
            "Changes the way the rect() function uses the paramters passed to it.The default mode is CORNER, which indicates that the first two parameters are the coordinates of the top left corner, and the third and fourth parameters specify the width and the height. The mode CORNERS indicates the first two parameters are the coordinates of the top left corner, and the third and fourth specify the bottom right coordinates. The mode CENTER indicates the first two parameters are the coordinates of the center of the rectangle, and the third and fourth specify the width and height.",
    },
    circleMode: {
        $meth: Sk.builtin.circleMode,
        $flags: { OneArg: true },
        $textsig: "($module, mode /)",
        $doc:
            "Changes the way the circle(), ellipse(), and arc() functions use the paramters passed to them. The default mode is CENTER, which indicates that the first two parameters are the coordinates of the center of the shape. The remaining parameters refer to the radius for the circle() function, and the X radius and Y radius for the ellipse() and arc() functions. The mode CORNER indicates the first two parameters are the coordinates of the top left corner of the shape. The meaning of any extra parameters remain unchanged.",
    },
    rotate: {
        $meth: Sk.builtin.rotate,
        $flags: { OneArg: true },
        $textsig: "($module, angle /)",
        $doc:
            "Rotates the shape by the angle specified in the only parameter. By default, the angle is in degrees. This can be changed to radians by using the angleMode() function.",
    },
    applyMatrix: {
        $meth: Sk.builtin.applyMatrix,
        $flags: { MinArgs: 6, MaxArgs: 6 },
        $textsig: "($module, a, b, c, d, e, f /)",
        $doc:
            "The applyMatrix() method lets you scale, rotate, move, and skew the current context.",
    },
    shearX: {
        $meth: Sk.builtin.shearX,
        $flags: { OneArg: true },
        $textsig: "($module, angle /)",
        $doc:
            "Skews the shape around the x-axis by the angle specified in the only parameter. By default, the angle is in degrees. This can be changed to radians by using the angleMode() function. The skew is relative to the origin.",
    },
    shearY: {
        $meth: Sk.builtin.shearY,
        $flags: { OneArg: true },
        $textsig: "($module, angle /)",
        $doc:
            "Skews the shape around the y-axis by the angle specified in the only parameter. By default, the angle is in degrees. This can be changed to radians by using the angleMode() function. The skew is relative to the origin.",
    },
    strokeWeight: {
        $meth: Sk.builtin.strokeWeight,
        $flags: { OneArg: true },
        $textsig: "($module, weight /)",
        $doc:
            "Sets the width of any lines, points and the border around shapes. All widths are specified in pixels.",
    },
    fill: {
        $meth: Sk.builtin.fill,
        $flags: {
            NamedArgs: ["r", "g", "b", "a"],
            Defaults: [new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(1)],
        },
        $textsig: "($module, r, g, b, a /)",
        $doc:
            "Sets the colour used to fill shapes. The colour is specified using the RGB colour scheme. The first parameter represents the amount of red, the second the amount of green, and the third the amount of blue in the colour. If a fourth parameter is passed it represents the alpha value ranging from 0 to 1.",
    },
    noFill: {
        $meth: Sk.builtin.noFill,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Specifies that shapes should not be filled when drawn. If both noStroke() and noFill() are called then nothing will be drawn to the screen.",
    },
    stroke: {
        $meth: Sk.builtin.stroke,
        $flags: {
            NamedArgs: ["r", "g", "b", "a"],
            Defaults: [new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(0), new Sk.builtin.int_(1)],
        },
        $textsig: "($module, r, g, b, a /)",
        $doc:
            "Sets the colour used to draw points, lines, and the border around shapes. The colour is specified using the RGB colour scheme. The first parameter represents the amount of red, the second the amount of green, and the third the amount of blue in the colour. If a fourth parameter is passed it represents the alpha value ranging from 0 to 1.",
    },
    noStroke: {
        $meth: Sk.builtin.noStroke,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Specifies that no stroke should be drawn for points, lines, and borders. If both noStroke() and noFill() are called then nothing will be drawn to the screen.",
    },
    line: {
        $meth: Sk.builtin.line,
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x1, y1, x2, y2 /)",
        $doc:
            "Draws an line between two points to the screen. By default the line has a width of a single pixel. This can be modified by the strokeWeight() function. The colour of a line can be changed by calling the stroke() function.",
    },
    circle: {
        $meth: Sk.builtin.circle,
        $flags: { MinArgs: 3, MaxArgs: 3 },
        $textsig: "($module x, y, radius /)",
        $doc:
            "Draws a circle on the canvas. By default, the first two parameters set the location of the center of the circle, and the third sets the radius. The way these parameters are interpreted, may be changed with the circleMode() function.",
    },
    ellipse: {
        $meth: Sk.builtin.ellipse,
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x, y, radiusX, radiusY /)",
        $doc:
            "Draws an ellipse (oval) on the canvas. By default, the first two parameters set the location of the center of the circle, the third sets the X radius, and the fourth sets the Y radius. The way these parameters are interpreted, may be changed with the circleMode() function.",
    },
    arc: {
        $meth: Sk.builtin.arc,
        $flags: { MinArgs: 6, MaxArgs: 6 },
        $textsig: "($module x, y, radiusX, radiusY, startAngle, endAngle /)",
        $doc:
            "Draws an arc (a portion of an ellipse) on the canvas. By default, the first two parameters set the location of the center of the circle, the third sets the X radius, and the fourth sets the Y radius. The fifth parameter is the start angle and the sixth is the end angle. The arc is always drawn clockwise from the start angle to the end angle. The way these parameters are interpreted, may be changed with the circleMode() function. By default the start and end angle are specified in degrees. This can be changed to radians with the angleMode() function.",
    },
    triangle: {
        $meth: Sk.builtin.triangle,
        $flags: { MinArgs: 6, MaxArgs: 6 },
        $textsig: "($module x1, y2, x2, y2, x3, y3 /)",
        $doc:
            "Draws a triangle on the canvas specified by three points.",
    },
    quad: {
        $meth: Sk.builtin.quad,
        $flags: { MinArgs: 8, MaxArgs: 8 },
        $textsig: "($module x1, y2, x2, y2, x3, y3, x4, y4 /)",
        $doc:
            "Draws a quadrilateral (a four sided polygon) on the canvas specified by four points.",
    },
    point: {
        $meth: Sk.builtin.point,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module x, y /)",
        $doc:
            "Draws a pixel to the screen at the position given by the two parameters. The first parameter specifies the x position and the second parameter specifies the y position. By default the pixel has a size of a one pixel. This can be modified by the strokeWeight() function. The colour of a point can be changed by calling the stroke() function.",
    },
    rect: {
        $meth: Sk.builtin.rect,
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x, y, w, h /)",
        $doc:
            "Draws a rectangle on the canvas. By default, the first two parameters set the location of the upper-left corner, the third sets the width, and the fourth sets the height. The way these parameters are interpreted, may be changed with the rectMode() function.",
    },
    beginShape: {
        $meth: Sk.builtin.beginShape,
        $flags: { NoArgs: true },
        $textsig: "($module x, y, w, h /)",
        $doc:
            "The beginShape(), vertex(), and endShape() functions allow you to create more complex shapes. The beginShape() function starts recording vertices that are added via the vertex() function.",
    },
    vertex: {
        $meth: Sk.builtin.vertex,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module x, y /)",
        $doc:
            "The vertex() function adds a point to the list of vertices that will be connected when the endShape() function is called. It takes two parameters, the x and y coordinates of the vertex to add.",
    },
    endShape: {
        $meth: Sk.builtin.endShape,
        $flags: {
            NamedArgs: ["mode"],
            Defaults: [new Sk.builtin.int_(1)],
        },
        $textsig: "($module mode /)",
        $doc:
            "Draws a shape specified by the list of vertices added by calling beginShape() followed by any number of vertex() function calls. By default the entire shape is closed by linking the last vertex back to the first. This can be changed by passing the constant OPEN as a parameter.",
    },
    loadImage: {
        $meth: Sk.builtin.loadImage,
        $flags: { OneArg: true },
        $textsig: "($module file /)",
        $doc:
            "Returns an image loaded from a file.",
    },
    image: {
        $meth: Sk.builtin.image,
        $flags: {
            NamedArgs: [null, null, null, "width", "height", "opacity"],
            Defaults: [Sk.builtin.none.none$, Sk.builtin.none.none$, Sk.builtin.none.none$],
        },
        $textsig: "($module image, x, y, width, height, opacity /)",
        $doc:
            "Draws an image on the canvas.",
    },
    _getImageHeight: {
        $meth: Sk.builtin._getImageHeight,
        $flags: { OneArg: true },
        $textsig: "($module image /)",
        $doc:
            "Gets the natural height of an image.",
    },
    _getImageWidth: {
        $meth: Sk.builtin._getImageWidth,
        $flags: { OneArg: true },
        $textsig: "($module image /)",
        $doc:
            "Gets the natural width of an image.",
    },
    _getFont: {
        $meth: Sk.builtin._getFont,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Gets the current font for the Canvas.",
    },
    _setFont: {
        $meth: Sk.builtin._setFont,
        $flags: { OneArg: true },
        $textsig: "($module font /)",
        $doc:
            "Sets the font for the Canvas.",
    },
    _measureText: {
        $meth: Sk.builtin._measureText,
        $flags: { OneArg: true },
        $textsig: "($module text /)",
        $doc:
            "Get the size of the text.",
    },
    _getFillStyle: {
        $meth: Sk.builtin._getFillStyle,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Gets the current fillStyle for the Canvas.",
    },
    _setFillStyle: {
        $meth: Sk.builtin._setFillStyle,
        $flags: { OneArg: true },
        $textsig: "($module style /)",
        $doc:
            "Sets the fillStyle for the Canvas.",
    },
    _getStrokeStyle: {
        $meth: Sk.builtin._getStrokeStyle,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Gets the current strokeStyle for the Canvas.",
    },
    _setStrokeStyle: {
        $meth: Sk.builtin._setStrokeStyle,
        $flags: { OneArg: true },
        $textsig: "($module style /)",
        $doc:
            "Sets the fillStyle for the Canvas.",
    },
    _getLineWidth: {
        $meth: Sk.builtin._getLineWidth,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Gets the current lineWidth for the Canvas.",
    },
    _setLineWidth: {
        $meth: Sk.builtin._setLineWidth,
        $flags: { OneArg: true },
        $textsig: "($module width /)",
        $doc:
            "Sets the lineWidth for the Canvas.",
    },
    _getDoStroke: {
        $meth: Sk.builtin._getDoStroke,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Returns true if a stroke should be applied, otherwise false.",
    },
    _setDoStroke: {
        $meth: Sk.builtin._setDoStroke,
        $flags: { OneArg: true },
        $textsig: "($module value /)",
        $doc:
            "Sets whether or not to apply a stroke.",
    },
    loadSound: {
        $meth: Sk.builtin.loadSound,
        $flags: { OneArg: true },
        $textsig: "($module filename, loop /)",
        $doc:
            "Loads a sound into memory.",
    },
    playSound: {
        $meth: Sk.builtin.playSound,
        $flags: {
            NamedArgs: [null, "loop", "volume"],
            Defaults: [Sk.builtin.bool.false$, new Sk.builtin.float_(1.0)],
        },
        $textsig: "($module filename, loop, volume /)",
        $doc:
            "Plays a sound.",
    },
    stopSound: {
        $meth: Sk.builtin.stopSound,
        $flags: { OneArg: true },
        $textsig: "($module sound /)",
        $doc:
            "Stops the sound from playing.",
    },
    pauseSound: {
        $meth: Sk.builtin.pauseSound,
        $flags: { OneArg: true },
        $textsig: "($module sound /)",
        $doc:
            "Pauses the sound from playing.",
    },
    stopAllSounds: {
        $meth: Sk.builtin.stopAllSounds,
        $flags: { NoArgs: true },
        $textsig: "($module /)",
        $doc:
            "Stops all sounds from playing.",
    },
    _getPixelColour: {
        $meth: Sk.builtin._getPixelColour,
        $flags: { MinArgs: 2, MaxArgs: 2 },
        $textsig: "($module x, y /)",
        $doc:
            "Returns the rgba value of the pixel at position (x, y).",
    },
    isKeyPressed: {
        $meth: Sk.builtin.isKeyPressed,
        $flags: { OneArg: true },
        $textsig: "($module code /)",
        $doc:
            "Returns true or false depending if the key is currently pressed.",
    },
    wasKeyPressed: {
        $meth: Sk.builtin.wasKeyPressed,
        $flags: { OneArg: true },
        $textsig: "($module code /)",
        $doc:
            "Returns true or false depending if the key was pressed. This only returns true once per key press as opposed to isKeyPressed which stays true until the key is released.",
    },
    dist: {
        $meth: Sk.builtin.dist,
        $flags: { MinArgs: 4, MaxArgs: 4 },
        $textsig: "($module x1, y1, x2, y2 /)",
        $doc:
            "Returns the distance between two points.",
    },
    setTextSize: {
        $meth: Sk.builtin.setTextSize,
        $flags: { OneArg: true },
        $textsig: "($module size /)",
        $doc:
            "Sets the text size used by print statements.",
    },
    setTextColour: {
        $meth: Sk.builtin.setTextColour,
        $flags: { OneArg: true },
        $textsig: "($module colour /)",
        $doc:
            "Sets the text colour used by print statements.",
    },
    setHighlightColour: {
        $meth: Sk.builtin.setHighlightColour,
        $flags: { OneArg: true },
        $textsig: "($module colour /)",
        $doc:
            "Sets the background colour used by print statements.",
    },
    clear: {
        $meth: Sk.builtin.clear,
        $flags: {
            NamedArgs: ["colour"],
            // 10 is the constant for the colour BLACK
            // Defined in PyAngeloSetup.js
            Defaults: [new Sk.builtin.int_(10)],
        },
        $textsig: "($module colour /)",
        $doc:
            "Clears the screen with the specified colour.",
    },
    sleep: {
        $meth: Sk.builtin.sleep,
        $flags: { OneArg: true },
        $textsig: "($module delay /)",
        $doc:
            "Sleeps for the specified delay in seconds.",
    },
});

// function used for exec and eval
function globLocToJs(glob_loc, name) {
    let tmp = undefined;
    if (glob_loc === undefined || Sk.builtin.checkNone(glob_loc)) {
        glob_loc = undefined;
    } else if (!(glob_loc instanceof Sk.builtin.dict)) {
        throw new Sk.builtin.TypeError(name + " must be a dict or None, not " + Sk.abstr.typeName(glob_loc));
    } else {
        tmp = {};
        // we only support dicts here since actually we need to convert this to a hashmap for skulpts version of
        // compiled code. Any old mapping won't do, it must be iterable!
        glob_loc.$items().forEach(([key, val]) => {
            if (Sk.builtin.checkString(key)) {
                tmp[key.$mangled] = val;
            }
        });
    }
    return tmp;
}

function reassignGlobLoc(dict, obj) {
    if (dict === undefined || Sk.builtin.checkNone(dict)) {
        return;
    }
    for (let key in obj) {
        // this isn't technically correct - if they use delete in the exec this breaks
        dict.mp$ass_subscript(new Sk.builtin.str(Sk.unfixReserved(key)), obj[key]);
    }
}


Sk.setupObjects = function (py3) {
    if (py3) {
        Sk.builtins["filter"] = Sk.builtin.filter_;
        Sk.builtins["map"] = Sk.builtin.map_;
        Sk.builtins["zip"] = Sk.builtin.zip_;
        Sk.builtins["range"] = Sk.builtin.range_;
        delete Sk.builtins["reduce"];
        delete Sk.builtins["xrange"];
        delete Sk.builtins["StandardError"];
        delete Sk.builtins["unicode"];
        delete Sk.builtins["basestring"];
        delete Sk.builtins["long_$rw$"];
        Sk.builtin.int_.prototype.$r = function () {
            return new Sk.builtin.str(this.v.toString());
        };
        delete Sk.builtin.int_.prototype.tp$str;
        delete Sk.builtin.bool.prototype.tp$str;
        delete Sk.builtins["raw_input"];
        delete Sk.builtins["unichr"];
        delete Sk.builtin.str.prototype.decode;
        Sk.builtins["bytes"] = Sk.builtin.bytes;
        Sk.builtins["ascii"] = new Sk.builtin.sk_method(
            {
                $meth: Sk.builtin.ascii,
                $flags: { OneArg: true },
                $textsig: "($module, obj, /)",
                $doc:
                    "Return an ASCII-only representation of an object.\n\nAs repr(), return a string containing a printable representation of an\nobject, but escape the non-ASCII characters in the string returned by\nrepr() using \\\\x, \\\\u or \\\\U escapes. This generates a string similar\nto that returned by repr() in Python 2.",
            },
            null,
            "builtins"
        );
    } else {
        Sk.builtins["range"] = new Sk.builtin.sk_method(
            {
                $meth: Sk.builtin.range,
                $name: "range",
                $flags: { MinArgs: 1, MaxArgs: 3 },
            },
            undefined,
            "builtins"
        );
        Sk.builtins["xrange"] = new Sk.builtin.sk_method(
            {
                $meth: Sk.builtin.xrange,
                $name: "xrange",
                $flags: { MinArgs: 1, MaxArgs: 3 },
            },
            null,
            "builtins"
        );
        Sk.builtins["reduce"] = new Sk.builtin.sk_method(
            {
                $meth: Sk.builtin.reduce,
                $name: "reduce",
                $flags: { MinArgs: 2, MaxArgs: 3 },
            },
            null,
            "builtins"
        );
        Sk.builtins["filter"] = new Sk.builtin.func(Sk.builtin.filter);
        Sk.builtins["map"] = new Sk.builtin.func(Sk.builtin.map);
        Sk.builtins["zip"] = new Sk.builtin.func(Sk.builtin.zip);
        Sk.builtins["StandardError"] = Sk.builtin.Exception;
        Sk.builtins["unicode"] = Sk.builtin.str;
        Sk.builtins["basestring"] = Sk.builtin.str;
        Sk.builtins["long_$rw$"] = Sk.builtin.lng;
        Sk.builtin.int_.prototype.$r = function () {
            const v = this.v;
            if (typeof v === "number") {
                return new Sk.builtin.str(v.toString());
            } else {
                return new Sk.builtin.str(v.toString() + "L");
            }
        };
        Sk.builtin.int_.prototype.tp$str = function () {
            return new Sk.builtin.str(this.v.toString());
        };
        Sk.builtin.bool.prototype.tp$str = function () {
            return this.$r();
        };
        Sk.builtins["raw_input"] = new Sk.builtin.func(Sk.builtin.raw_input);
        Sk.builtins["unichr"] = new Sk.builtin.func(Sk.builtin.unichr);
        Sk.builtin.str.prototype.decode = Sk.builtin.str.$py2decode;
        delete Sk.builtins["bytes"];
        delete Sk.builtins["ascii"];
    }
};

Sk.exportSymbol("Sk.setupObjects", Sk.setupObjects);
Sk.exportSymbol("Sk.builtins", Sk.builtins);
