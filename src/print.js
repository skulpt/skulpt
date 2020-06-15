/*
	Implementation of the Python3 print version. Due to Python2 grammar we have
	to mimic the named keywords after *args as kwargs. Though this does not change
	anything for the internal implementation

*/
Sk.builtin.print = function print(args, kwargs) {
    const kwarg_vals = Sk.abstr.copyKeywordsToNamedArgs("print", ["sep", "end", "file"], [], kwargs, [
        Sk.builtin.none.none$,
        Sk.builtin.none.none$,
        Sk.builtin.none.none$,
    ]);

    // defaults, null for None
    var kw_list = {
        sep: " ",
        end: "\n",
        file: null,
    };

    var remap_val;
    var is_none;

    // check for sep; string or None
    remap_val = kwarg_vals[0];
    if (remap_val !== undefined) {
        is_none = Sk.builtin.checkNone(remap_val);
        if (is_none || Sk.builtin.checkString(remap_val)) {
            kw_list["sep"] = is_none ? kw_list["sep"] : Sk.ffi.remapToJs(remap_val); // only reassign for string
        } else {
            throw new Sk.builtin.TypeError("sep must be None or a string, not " + Sk.abstr.typeName(remap_val));
        }
    }

    // check for end; string or None
    remap_val = kwarg_vals[1];
    if (remap_val !== undefined) {
        is_none = Sk.builtin.checkNone(remap_val);
        if (is_none || Sk.builtin.checkString(remap_val)) {
            kw_list["end"] = is_none ? kw_list["end"] : Sk.ffi.remapToJs(remap_val); // only reassign for string
        } else {
            throw new Sk.builtin.TypeError("end must be None or a string, not " + Sk.abstr.typeName(remap_val));
        }
    }

    // check for file
    // allow None, though just keep null or check if value has attribute write
    remap_val = kwarg_vals[2];
    if (remap_val !== undefined) {
        is_none = Sk.builtin.checkNone(remap_val);
        if (is_none || remap_val.tp$getattr("write") !== undefined) {
            kw_list["file"] = is_none ? kw_list["file"] : remap_val;
        } else {
            throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(remap_val) + "' object has no attribute 'write'");
        }
    }

    // loop through outputs and create output string
    var s = "";
    var i;
    for (i = 0; i < args.length; i++) {
        s += new Sk.builtin.str(args[i]).v; // get str repr
        s += kw_list.sep;
    }

    if (args.length > 0 && kw_list.sep.length > 0) {
        s = s.substring(0, s.length - kw_list.sep.length);
    }

    s += kw_list.end;

    if (kw_list.file !== null) {
        // currently not tested, though it seems that we need to see how we should access the write function in a correct manner
        Sk.misceval.callsimArray(kw_list.file.write, [kw_list.file, new Sk.builtin.str(s)]); // callsim to write function
    } else {
        if (Sk.globals.sys !== undefined) {
            const sys = Sk.globals.sys;
            return Sk.misceval.callsimOrSuspendArray(sys.$d.stdout.write, [sys["$d"]["stdout"], new Sk.builtin.str(s)]);
        }
        return Sk.misceval.chain(Sk.importModule("sys", false, true), function (sys) {
            return Sk.misceval.callsimOrSuspendArray(sys.$d.stdout.write, [sys["$d"]["stdout"], new Sk.builtin.str(s)]);
        });
    }
    // ToDo:
    // cpython print function may receive another flush kwarg that flushes the output stream immediately
};
