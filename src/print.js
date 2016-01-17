/*
	Implementation of the Python3 print version. Due to Python2 grammar we have
	to mimic the named keywords after *args as kwargs. Though this does not change
	anything for the internal implementation

*/
var print_f = function function_print(kwa) {
    Sk.builtin.pyCheckArgs("print", arguments, 0, Infinity, true, false);
    var args = Array.prototype.slice.call(arguments, 1);
    var kwargs = new Sk.builtins.dict(kwa);
    var _kwargs = Sk.ffi.remapToJs(kwargs);

    // defaults, null for None
    var kw_list = {
        "sep": " ",
        "end": "\n",
        "file": null
    };

    var remap_val;
    var is_none;

    // check for sep; string or None
    remap_val = kwargs.mp$lookup(new Sk.builtin.str("sep"));
    if(remap_val !== undefined) {
        is_none = Sk.builtin.checkNone(remap_val);
        if(Sk.builtin.checkString(remap_val) || is_none) {
            kw_list["sep"] = is_none ? kw_list["sep"] : Sk.ffi.remapToJs(remap_val); // only reassign for string
        } else {
            throw new Sk.builtin.TypeError("sep must be None or a string, not " + Sk.abstr.typeName(remap_val));
        }
    }

    // check for end; string or None
    remap_val = kwargs.mp$lookup(new Sk.builtin.str("end"));
    if(remap_val !== undefined) {
        is_none = Sk.builtin.checkNone(remap_val);
        if(Sk.builtin.checkString(remap_val) || is_none) {
            kw_list["end"] = is_none ? kw_list["end"] : Sk.ffi.remapToJs(remap_val); // only reassign for string
        } else {
            throw new Sk.builtin.TypeError("end must be None or a string, not " + Sk.abstr.typeName(remap_val));
        }
    }

    // check for file
    // allow None, though just keep null or check if value has attribute write
    remap_val = kwargs.mp$lookup(new Sk.builtin.str("file"));
    if(remap_val !== undefined) {
        is_none = Sk.builtin.checkNone(remap_val);
        if(is_none || remap_val.tp$getattr("write") !== undefined) {
            kw_list["file"] = is_none ? kw_list["file"] : remap_val;
        } else {
            throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(remap_val) + "' object has no attribute 'write'");
        }
    }

    // loop through outputs and create output string
    var s = "";
    var i;
    for(i = 0; i < args.length; i++) {
        s += (new Sk.builtin.str(args[i])).v; // get str repr
        s += kw_list.sep;
    }

    if(args.length > 0 && kw_list.sep.length > 0) {
        s = s.substring(0, s.length-kw_list.sep.length);
    }

    s += kw_list.end;

    if(kw_list.file !== null) {
        // currently not tested, though it seems that we need to see how we should access the write function in a correct manner
        Sk.misceval.callsim(kw_list.file.write, kw_list.file, new Sk.builtin.str(s)); // callsim to write function
    } else {
        var sys = Sk.importModule("sys");
        Sk.misceval.apply(sys["$d"]["stdout"]["write"], undefined, undefined, undefined, [sys["$d"]["stdout"], new Sk.builtin.str(s)]);
    }

    // ToDo:
    // cpython print function may receive another flush kwarg that flushes the output stream immediatelly
};

print_f.co_kwargs = true;
Sk.builtin.print = new Sk.builtin.func(print_f);

Sk.builtin.print.__doc__ = new Sk.builtin.str("print(value, ..., sep=' ', end='\\n', file=sys.stdout, flush=False)\n\nPrints the values to a stream, or to sys.stdout by default.\nOptional keyword arguments:\nfile:  a file-like object (stream); defaults to the current sys.stdout.\nsep:   string inserted between values, default a space.\nend:   string appended after the last value, default a newline.\nflush: whether to forcibly flush the stream.");
