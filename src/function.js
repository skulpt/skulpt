import { iter, lookupSpecial } from './abstract';
import { makeTypeObj } from './type';
import { str } from './str';
import { none } from './object';
import { bool } from './bool';
import { method } from './method';
import { TypeError } from './error';

/**
 * Check arguments to Python functions to ensure the correct number of
 * arguments are passed.
 *
 * @param {string} name the name of the function
 * @param {Object} args the args passed to the function
 * @param {number} minargs the minimum number of allowable arguments
 * @param {number=} maxargs optional maximum number of allowable
 * arguments (default: Infinity)
 * @param {boolean=} kwargs optional true if kwargs, false otherwise
 * (default: false)
 * @param {boolean=} free optional true if free vars, false otherwise
 * (default: false)
 */
export function pyCheckArgs(name, args, minargs, maxargs, kwargs, free) {
    var nargs = args.length;
    var msg = "";

    if (maxargs === undefined) {
        maxargs = Infinity;
    }
    if (kwargs) {
        nargs -= 1;
    }
    if (free) {
        nargs -= 1;
    }
    if ((nargs < minargs) || (nargs > maxargs)) {
        if (minargs === maxargs) {
            msg = name + "() takes exactly " + minargs + " arguments";
        } else if (nargs < minargs) {
            msg = name + "() takes at least " + minargs + " arguments";
        } else {
            msg = name + "() takes at most " + maxargs + " arguments";
        }
        msg += " (" + nargs + " given)";
        throw new TypeError(msg);
    }
};

/**
 * Check type of argument to Python functions.
 *
 * @param {string} name the name of the argument
 * @param {string} exptype string of the expected type name
 * @param {boolean} check truthy if type check passes, falsy otherwise
 */
export function pyCheckType(name, exptype, check) {
    if (!check) {
        throw new TypeError(name + " must be a " + exptype);
    }
};

export function checkSequence(arg) {
    return (arg !== null && arg.mp$subscript !== undefined);
};

/**
 * Use this to test whether or not a Python object is iterable.  You should **not** rely
 * on the presence of tp$iter on the object as a good test, as it could be a user defined
 * class with `__iter__` defined or ``__getitem__``  This tests for all of those cases
 *
 * @param arg {Object}   A Python object
 * @returns {boolean} true if the object is iterable
 */
export function checkIterable(arg) {
    var ret = false;
    if (arg !== null ) {
        try {
            ret = iter(arg);
            if (ret) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            if (e instanceof TypeError) {
                return false;
            } else {
                throw e;
            }
        }
    }
    return ret;
};

export function checkCallable(obj) {
    // takes care of builtin functions and methods, builtins
    if (typeof obj === "function") {
        return true;
    }
    // takes care of python function, methods and lambdas
    if (obj instanceof func) {
        return true;
    }
    // takes care of instances of methods
    if (obj instanceof method) {
        return true;
    }
    // go up the prototype chain to see if the class has a __call__ method
    if (lookupSpecial(obj, "__call__") !== undefined) {
        return true;
    }
    return false;
};

export function checkNumber(arg) {
    return (arg !== null && (typeof arg === "number" ||
        arg instanceof int_ ||
        arg instanceof float_ ||
        arg instanceof lng));
};

/**
 * Checks for complex type, delegates to internal method
 * Most skulpt users would search here!
 */
export function checkComplex(arg) {
    return Sk.builtin.complex._complex_check(arg);
};

export function checkInt(arg) {
    return (arg !== null) && ((typeof arg === "number" && arg === (arg | 0)) ||
        arg instanceof int_ ||
        arg instanceof lng);
};

export function checkFloat(arg) {
    return (arg !== null) && (arg instanceof float_);
};

export function checkString(arg) {
    return (arg !== null && arg.__class__ == str);
};

export function checkClass(arg) {
    return (arg !== null && arg.sk$type);
};

export function checkBool(arg) {
    return (arg instanceof bool);
};

export function checkNone(arg) {
    return (arg instanceof none);
};

export function checkFunction(arg) {
    return (arg !== null && arg.tp$call !== undefined);
};

/**
 * @constructor
 * Sk.builtin.func
 *
 * @description
 * This function converts a Javascript function into a Python object that is callable.  Or just
 * think of it as a Python function rather than a Javascript function now.  This is an important
 * distinction in skulpt because once you have Python function you cannot just call it.
 * You must now use Sk.misceval.callsim to call the Python function.
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
            return new Sk.builtin.method(this, obj, objtype, true);
        }
        return new method(this, obj, objtype);
    }

    static pythonFunctions = ["__get__"];

    __get__(self, instance, owner) {
        Sk.builtin.pyCheckArgs("__get__", arguments, 1, 2, false, true);
        if (instance === Sk.builtin.none.none$ && owner === Sk.builtin.none.none$) {
            throw new Sk.builtin.TypeError("__get__(None, None) is invalid");
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
