import { typeName } from './type';
import { remapToJs } from './ffi';
import { pyCheckArgs } from './function/checks';
import { func } from './function'
import { TypeError, AttributeError } from './errors';
import { dict } from './dict';
import { str } from './str';
import { checkNone, checkString } from './function/checks';
import { callsim, apply, chain } from './misceval';

/*
	Implementation of the Python3 print version. Due to Python2 grammar we have
	to mimic the named keywords after *args as kwargs. Though this does not change
	anything for the internal implementation

*/
function print_f(kwa) {
    pyCheckArgs("print", arguments, 0, Infinity, true, false);
    var args = Array.prototype.slice.call(arguments, 1);
    var kwargs = new dict(kwa);
    var _kwargs = remapToJs(kwargs);

    // defaults, null for None
    var kw_list = {
        "sep": " ",
        "end": "\n",
        "file": null
    };

    var remap_val;
    var is_none;

    // check for sep; string or None
    remap_val = kwargs.mp$lookup(new str("sep"));
    if(remap_val !== undefined) {
        is_none = checkNone(remap_val);
        if(checkString(remap_val) || is_none) {
            kw_list["sep"] = is_none ? kw_list["sep"] : remapToJs(remap_val); // only reassign for string
        } else {
            throw new TypeError("sep must be None or a string, not " + typeName(remap_val));
        }
    }

    // check for end; string or None
    remap_val = kwargs.mp$lookup(new str("end"));
    if(remap_val !== undefined) {
        is_none = checkNone(remap_val);
        if(checkString(remap_val) || is_none) {
            kw_list["end"] = is_none ? kw_list["end"] : remapToJs(remap_val); // only reassign for string
        } else {
            throw new TypeError("end must be None or a string, not " + typeName(remap_val));
        }
    }

    // check for file
    // allow None, though just keep null or check if value has attribute write
    remap_val = kwargs.mp$lookup(new str("file"));
    if(remap_val !== undefined) {
        is_none = checkNone(remap_val);
        if(is_none || remap_val.tp$getattr("write") !== undefined) {
            kw_list["file"] = is_none ? kw_list["file"] : remap_val;
        } else {
            throw new AttributeError("'" + typeName(remap_val) + "' object has no attribute 'write'");
        }
    }

    // loop through outputs and create output string
    var s = "";
    var i;
    for(i = 0; i < args.length; i++) {
        s += (new str(args[i])).v; // get str repr
        s += kw_list.sep;
    }

    if(args.length > 0 && kw_list.sep.length > 0) {
        s = s.substring(0, s.length-kw_list.sep.length);
    }

    s += kw_list.end;

    if(kw_list.file !== null) {
        // currently not tested, though it seems that we need to see how we should access the write function in a correct manner
        callsim(kw_list.file.write, kw_list.file, new str(s)); // callsim to write function
    } else {
        return chain(Sk.importModule("sys", false, true), function(sys) {
            return apply(sys["$d"]["stdout"]["write"], undefined, undefined, undefined, [sys["$d"]["stdout"], new Sk.builtin.str(s)]);
        });
    }
    // ToDo:
    // cpython print function may receive another flush kwarg that flushes the output stream immediatelly
};

print_f.co_kwargs = true;
const print = new func(print_f);
print.__doc__ = new str("print(value, ..., sep=' ', end='\\n', file=sys.stdout, flush=False)\n\nPrints the values to a stream, or to sys.stdout by default.\nOptional keyword arguments:\nfile:  a file-like object (stream); defaults to the current sys.stdout.\nsep:   string inserted between values, default a space.\nend:   string appended after the last value, default a newline.\nflush: whether to forcibly flush the stream.");

export { print };