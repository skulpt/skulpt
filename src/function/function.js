import { makeTypeObj } from '../type';
import { method } from '../method';
import { TypeError } from '../errors';

/**
 * @constructor
 * Sk.builtin.func
 *
 * @description
 * This function converts a Javascript function into a Python object that is callable.  Or just
 * think of it as a Python function rather than a Javascript function now.  This is an important
 * distinction in skulpt because once you have Python function you cannot just call it.
 * You must now use callsim to call the Python function.
 *
 * @param {Function} code the javascript implementation of this function
 * @param {Object=} globals the globals where this function was defined.
 * Can be undefined (which will be stored as null) for builtins. (is
 * that ok?)
 * @param {Object=} closure dict of free variables
 * @param {Object=} closure2 another dict of free variables that will be
 * merged into 'closure'. there's 2 to simplify generated code (one is $free,
 * the other is $cell)
 *
 * closure is the cell variables from the parent scope that we need to close
 * over. closure2 is the free variables in the parent scope that we also might
 * need to access.
 *
 * NOTE: co_varnames and co_name are defined by compiled code only, so we have
 * to access them via dict-style lookup for closure.
 *
 */
export class func {
    constructor(code, globals, closure, closure2) {
        var k;
        this.func_code = code;
        this.func_globals = globals || null;
        if (closure2 !== undefined) {
            // todo; confirm that modification here can't cause problems
            for (k in closure2) {
                closure[k] = closure2[k];
            }
        }
        this.func_closure = closure;
        this["$d"] = {
            "__name__": code["co_name"],
            "__class__": Sk.builtin.func
        };
        this.func_closure = closure;
        this.tp$name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || this.func_code.name || "<native JS>";

        return this;
    }

    tp$descr_get(obj, objtype) {
        goog.asserts.assert(!(obj === undefined && objtype === undefined));
        if (objtype && objtype.tp$name in Sk.builtin && Sk.builtin[objtype.tp$name] === objtype) {
            // it's a builtin
            return new method(this, obj, objtype, true);
        }
        return new method(this, obj, objtype);
    }

    static pythonFunctions = ["__get__"];

    __get__(self, instance, owner) {
        pyCheckArgs("__get__", arguments, 1, 2, false, true);
        if (instance === none.none$ && owner === none.none$) {
            throw new TypeError("__get__(None, None) is invalid");
        }

        return self.tp$descr_get(instance, owner);
    }

    tp$getname() {
        return (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || this.func_code.name || "<native JS>";
    };

    tp$call(args, kw) {
        var i;
        var kwix;
        var varnames = this.func_code.co_varnames || [];
        var defaults = this.func_code.$defaults || [];
        var kwargsarr = [];
        var expectskw = this.func_code["co_kwargs"];
        var name;
        var nargs = args.length;
        var varargs = [];
        var defaultsNeeded = varnames.length - nargs > defaults.length ? defaults.length : varnames.length - nargs;
        var offset = varnames.length - defaults.length;

        if (this.func_code["no_kw"] && kw) {
            throw new TypeError(this.tp$getname() + "() takes no keyword arguments");
        }

        if (kw) {
            for (i = 0; i < kw.length; i += 2) {
                if (varnames && ((kwix = varnames.indexOf(kw[i])) !== -1)) {
                    if (kwix < nargs) {
                        name = this.tp$getname();
                        if (name in Sk.builtins && this === Sk.builtins[name]) {
                            throw new TypeError("Argument given by name ('" + kw[i] + "') and position (" + (kwix + 1) + ")");
                        }
                        throw new TypeError(name + "() got multiple values for keyword argument '" + kw[i] + "'");
                    }
                    varargs[kwix] = kw[i + 1];
                } else if (expectskw) {
                    // build kwargs dict
                    kwargsarr.push(new Sk.builtin.str(kw[i]));
                    kwargsarr.push(kw[i + 1]);
                } else {
                    name = this.tp$getname();
                    if (name in Sk.builtins && this === Sk.builtins[name]) {
                        throw new TypeError("'" + kw[i] + "' is an invalid keyword argument for this function");
                    }
                    throw new TypeError(name + "() got an unexpected keyword argument '" + kw[i] + "'");
                }
            }
        }

        // add defaults if there are enough because if we add them and leave a hole in the args array, pycheckargs doesn't work correctly
        // maybe we should fix pycheckargs too though.
        if (defaultsNeeded <= defaults.length) {
            for (i = defaults.length - defaultsNeeded; i < defaults.length; i++) {
                if (!varargs[offset + i]) {
                    varargs[offset + i] = defaults[i];
                }
            }
        }

        // add arguments found in varargs
        for (i = 0; i < varargs.length; i++) {
            if (varargs[i]) {
                args[i] = varargs[i];
            }
        }

        if (kw && nargs < varnames.length - defaults.length) {
            for (i = nargs; i < varnames.length - defaults.length; i++) {
                if (kw.indexOf(varnames[i]) === -1) {
                    throw new TypeError(this.tp$getname() + "() takes atleast " + (varnames.length - defaults.length) + " arguments (" + (nargs + varargs.filter(function(x) { return x; }).length) +  " given)");
                }
            }
        }


        if (this.func_closure) {
            // todo; OK to modify?
            if (varnames) {
                // Make sure all default arguments are in args before adding closure
                for (i = args.length; i < varnames.length; i++) {
                    args.push(undefined);
                }
            }

            args.push(this.func_closure);
        }

        if (expectskw) {
            args.unshift(kwargsarr);
        }

        // note: functions expect 'this' to be globals to avoid having to
        // slice/unshift onto the main args
        return this.func_code.apply(this.func_globals, args);
    }

    tp$getattr(key) {
        return this[key];
    }

    tp$setattr(key, value) {
        this[key] = value;
    }

    ob$type = makeTypeObj("function", new func(null, null));

    $r() {
        var name = this.tp$getname();
        if (name in Sk.builtins && this === Sk.builtins[name]) {
            return new Sk.builtin.str("<built-in function " + name + ">");
        } else {
            return new Sk.builtin.str("<function " + name + ">");
        }
    }
}
