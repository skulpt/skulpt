// Note: the hacky names on int, long, float have to correspond with the
// uniquization that the compiler does for words that are reserved in
// Javascript. This is a bit hokey.
Sk.builtins = {
    "range"     : new Sk.builtin.func(Sk.builtin.range),
    "round"     : new Sk.builtin.func(Sk.builtin.round),
    "len"       : new Sk.builtin.func(Sk.builtin.len),
    "min"       : new Sk.builtin.func(Sk.builtin.min),
    "max"       : new Sk.builtin.func(Sk.builtin.max),
    "sum"       : new Sk.builtin.func(Sk.builtin.sum),
    "abs"       : new Sk.builtin.func(Sk.builtin.abs),
    "fabs"      : new Sk.builtin.func(Sk.builtin.fabs),
    "ord"       : new Sk.builtin.func(Sk.builtin.ord),
    "chr"       : new Sk.builtin.func(Sk.builtin.chr),
    "hex"       : new Sk.builtin.func(Sk.builtin.hex),
    "oct"       : new Sk.builtin.func(Sk.builtin.oct),
    "bin"       : new Sk.builtin.func(Sk.builtin.bin),
    "dir"       : new Sk.builtin.func(Sk.builtin.dir),
    "repr"      : new Sk.builtin.func(Sk.builtin.repr),
    "open"      : new Sk.builtin.func(Sk.builtin.open),
    "isinstance": new Sk.builtin.func(Sk.builtin.isinstance),
    "hash"      : new Sk.builtin.func(Sk.builtin.hash),
    "getattr"   : new Sk.builtin.func(Sk.builtin.getattr),
    "hasattr"   : new Sk.builtin.func(Sk.builtin.hasattr),
    "id"        : new Sk.builtin.func(Sk.builtin.id),

    "reduce"    : new Sk.builtin.func(Sk.builtin.reduce),
    "sorted"    : new Sk.builtin.func(Sk.builtin.sorted),
    "any"       : new Sk.builtin.func(Sk.builtin.any),
    "all"       : new Sk.builtin.func(Sk.builtin.all),

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
    "LookupError"        : Sk.builtin.LookupError,
    "UnicodeDecodeError" : Sk.builtin.UnicodeDecodeError,
    "UnicodeEncodeError" : Sk.builtin.UnicodeEncodeError,
    "NameError"          : Sk.builtin.NameError,
    "IOError"            : Sk.builtin.IOError,
    "NotImplementedError": Sk.builtin.NotImplementedError,
    "StandardError"      : Sk.builtin.StandardError,
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
    "enumerate" : Sk.builtin.enumerate,
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

    "input"     : new Sk.builtin.func(Sk.builtin.input),
    "raw_input" : new Sk.builtin.func(Sk.builtin.raw_input),
    "setattr"   : new Sk.builtin.func(Sk.builtin.setattr),
    /*'read': Sk.builtin.read,*/
    "jseval"    : Sk.builtin.jseval,
    "jsmillis"  : Sk.builtin.jsmillis,
    "quit"      : new Sk.builtin.func(Sk.builtin.quit),
    "exit"      : new Sk.builtin.func(Sk.builtin.quit),
    "print"     : Sk.builtin.print,
    "divmod"    : new Sk.builtin.func(Sk.builtin.divmod),
    "format"    : new Sk.builtin.func(Sk.builtin.format),
    "globals"   : new Sk.builtin.func(Sk.builtin.globals),
    "issubclass": new Sk.builtin.func(Sk.builtin.issubclass),
    "iter"      : Sk.builtin.iter,

    // Functions below are not implemented
    "bytearray" : Sk.builtin.bytearray,
    "callable"  : Sk.builtin.callable,
    "delattr"   : Sk.builtin.delattr,
    "eval_$rw$" : Sk.builtin.eval_,
    "execfile"  : Sk.builtin.execfile,
    "frozenset" : Sk.builtin.frozenset,
    "help"      : Sk.builtin.help,
    "locals"    : Sk.builtin.locals,
    "memoryview": Sk.builtin.memoryview,
    "next"      : Sk.builtin.next_,
    "pow"       : Sk.builtin.pow,
    "reload"    : Sk.builtin.reload,
    "reversed"  : Sk.builtin.reversed,
    "super"     : Sk.builtin.super_,
    "unichr"    : Sk.builtin.unichr,
    "vars"      : Sk.builtin.vars,
    "xrange"    : Sk.builtin.xrange,
    "apply_$rw$": Sk.builtin.apply_,
    "buffer"    : Sk.builtin.buffer,
    "coerce"    : Sk.builtin.coerce,
    "intern"    : Sk.builtin.intern
};

Sk.setupObjects = function (py3) {
    if (py3) {
        Sk.builtins["filter"] = Sk.builtin.filter_;
        Sk.builtins["map"] = Sk.builtin.map_;
        Sk.builtins["zip"] = Sk.builtin.zip_;
        Sk.builtins["bytes"] = Sk.builtin.bytes;
        Sk.builtins["range"] = new Sk.builtin.func(Sk.builtin.xrange);
        delete Sk.builtins["xrange"];
        delete Sk.builtins["StandardError"];
        delete Sk.builtins["unicode"];
        delete Sk.builtins["basestring"];
        delete Sk.builtin.str.prototype.decode;
        Sk.builtins["bytes"] = Sk.builtin.bytes;
        Sk.builtins["ascii"] = new Sk.builtin.func(Sk.builtin.ascii);
    } else {
        Sk.builtins["filter"] = new Sk.builtin.func(Sk.builtin.filter);
        Sk.builtins["map"] = new Sk.builtin.func(Sk.builtin.map);
        Sk.builtins["zip"] = new Sk.builtin.func(Sk.builtin.zip);
        Sk.builtins["range"] = new Sk.builtin.func(Sk.builtin.range);
        Sk.builtins["xrange"] = new Sk.builtin.func(Sk.builtin.xrange);
        Sk.builtins["StandardError"] = Sk.builtin.Exception;
        Sk.builtins["unicode"] = Sk.builtin.str;
        Sk.builtins["basestring"] = Sk.builtin.str;
        Sk.builtin.str.prototype.decode = Sk.builtin.str.$py2decode;
        delete Sk.builtins["bytes"];
        delete Sk.builtins["ascii"];
    }
};
Sk.exportSymbol("Sk.setupObjects", Sk.setupObjects);
Sk.exportSymbol("Sk.builtins", Sk.builtins);
