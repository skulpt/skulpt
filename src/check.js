/**
 * @namespace Sk.builtin
 */

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
Sk.builtin.pyCheckArgs = function (name, args, minargs, maxargs, kwargs, free) {
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
    if (nargs < minargs || nargs > maxargs) {
        if (minargs === maxargs) {
            msg = name + "() takes exactly " + minargs + " arguments";
        } else if (nargs < minargs) {
            msg = name + "() takes at least " + minargs + " arguments";
        } else if (minargs > 0) {
            msg = name + "() takes at most " + maxargs + " arguments";
        } else {
            msg = name + "() takes no arguments";
        }
        msg += " (" + nargs + " given)";
        throw new Sk.builtin.TypeError(msg);
    }
};
Sk.exportSymbol("Sk.builtin.pyCheckArgs", Sk.builtin.pyCheckArgs);

/**
 * Check arguments to Python functions to ensure the correct number of
 * arguments are passed.
 *
 * @param {string} name the name of the function
 * @param {number} nargs the args passed to the function
 * @param {number} minargs the minimum number of allowable arguments
 * @param {number=} maxargs optional maximum number of allowable
 * arguments (default: Infinity)
 * @param {boolean=} kwargs optional true if kwargs, false otherwise
 * (default: false)
 * @param {boolean=} free optional true if free vars, false otherwise
 * (default: false)
 */
Sk.builtin.pyCheckArgsLen = function (name, nargs, minargs, maxargs, kwargs, free) {
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
    if (nargs < minargs || nargs > maxargs) {
        if (minargs === maxargs) {
            msg = name + "() takes exactly " + minargs + " arguments";
        } else if (nargs < minargs) {
            msg = name + "() takes at least " + minargs + " arguments";
        } else {
            msg = name + "() takes at most " + maxargs + " arguments";
        }
        msg += " (" + nargs + " given)";
        throw new Sk.builtin.TypeError(msg);
    }
};

/**
 * Check type of argument to Python functions.
 *
 * @param {string} name the name of the argument
 * @param {string} exptype string of the expected type name
 * @param {boolean} check truthy if type check passes, falsy otherwise
 */
Sk.builtin.pyCheckType = function (name, exptype, check) {
    if (!check) {
        throw new Sk.builtin.TypeError(name + " must be a " + exptype);
    }
};
Sk.exportSymbol("Sk.builtin.pyCheckType", Sk.builtin.pyCheckType);

Sk.builtin.checkSequence = function (arg) {
    return arg != null && arg.mp$subscript !== undefined;
};
Sk.exportSymbol("Sk.builtin.checkSequence", Sk.builtin.checkSequence);

/**
 * Use this to test whether or not a Python object is iterable.  You should **not** rely
 * on the presence of tp$iter on the object as a good test, as it could be a user defined
 * class with `__iter__` defined or ``__getitem__``  This tests for all of those cases
 *
 * @param arg {Object}   A Python object
 * @returns {boolean} true if the object is iterable
 */
Sk.builtin.checkIterable = function (arg) {
    let ret = false;
    if (arg !== undefined) {
        try {
            ret = Sk.abstr.iter(arg);
            if (ret) {
                return true;
            } else {
                return false;
            }
        } catch (e) {
            if (e instanceof Sk.builtin.TypeError) {
                return false;
            } else {
                throw e;
            }
        }
    }
    return ret;
};
Sk.exportSymbol("Sk.builtin.checkIterable", Sk.builtin.checkIterable);

Sk.builtin.checkCallable = function (obj) {
    // takes care of builtin functions and methods, builtins
    return obj.tp$call !== undefined;
};

Sk.builtin.checkNumber = function (arg) {
    return (
        arg != null &&
        (typeof arg === "number" || arg instanceof Sk.builtin.int_ || arg instanceof Sk.builtin.float_ || arg instanceof Sk.builtin.lng)
    );
};
Sk.exportSymbol("Sk.builtin.checkNumber", Sk.builtin.checkNumber);

/**
 * Checks for complex type, delegates to internal method
 * Most skulpt users would search here!
 */
Sk.builtin.checkComplex = function (arg) {
    return arg instanceof Sk.builtin.complex;
};
Sk.exportSymbol("Sk.builtin.checkComplex", Sk.builtin.checkComplex);

Sk.builtin.checkInt = function (arg) {
    return arg != null && ((typeof arg === "number" && arg === (arg | 0)) || arg instanceof Sk.builtin.int_ || arg instanceof Sk.builtin.lng);
};
Sk.exportSymbol("Sk.builtin.checkInt", Sk.builtin.checkInt);

Sk.builtin.checkFloat = function (arg) {
    return arg != null && arg instanceof Sk.builtin.float_;
};
Sk.exportSymbol("Sk.builtin.checkFloat", Sk.builtin.checkFloat);

Sk.builtin.checkString = function (arg) {
    return arg != null && arg.ob$type == Sk.builtin.str;
};
Sk.exportSymbol("Sk.builtin.checkString", Sk.builtin.checkString);

Sk.builtin.checkClass = function (arg) {
    return arg != null && arg.sk$type;
};
Sk.exportSymbol("Sk.builtin.checkClass", Sk.builtin.checkClass);

Sk.builtin.checkBool = function (arg) {
    return arg instanceof Sk.builtin.bool;
};
Sk.exportSymbol("Sk.builtin.checkBool", Sk.builtin.checkBool);

Sk.builtin.checkNone = function (arg) {
    return arg === Sk.builtin.none.none$;
};
Sk.exportSymbol("Sk.builtin.checkNone", Sk.builtin.checkNone);

Sk.builtin.checkFunction = function (arg) {
    return arg != null && arg.tp$call !== undefined;
};
Sk.exportSymbol("Sk.builtin.checkFunction", Sk.builtin.checkFunction);

Sk.builtin.checkDataDescr = function (arg) {
    return arg && arg.tp$descr_set !== undefined;
};
Sk.exportSymbol("Sk.builtin.checkDataDescr", Sk.builtin.checkDataDescr);

Sk.builtin.checkType = function (arg) {
    return arg != null && arg.sk$type !== undefined;
};

Sk.builtin.checkAnySet = function (arg) {
    return arg != null && (arg instanceof Sk.builtin.set || arg instanceof Sk.builtin.frozenset);
};
