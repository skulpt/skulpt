
import { TypeError } from '../errors';
import { iter, lookupSpecial } from '../abstract'
import { int_ } from '../types/int';
import { float_ } from '../float';
import { lng } from '../types/long';
import { str } from '../types/str';
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