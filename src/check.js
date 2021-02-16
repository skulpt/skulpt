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

/**
 * @function
 * @param {*} arg
 * 
 * @description
 * Does the arg have a valid `__getitem__` method?
 */
Sk.builtin.checkSequence = function (arg) {
    return arg != null && arg.mp$subscript !== undefined;
};
Sk.exportSymbol("Sk.builtin.checkSequence", Sk.builtin.checkSequence);

/**
 * @description
 * Use this to test whether or not a Python object is iterable.  You should **not** rely
 * on the presence of tp$iter on the object as a good test, as it could be a user defined
 * class with `__iter__` defined or ``__getitem__``  This tests for all of those cases
 * 
 * Note in most cases it will be more pragmatic to simply call {@link Sk.abstr.iter} which will 
 * throw the appropriate error if the pyObject is not iterable. 
 *
 * @param arg {Object}   A Python object
 * @returns {boolean} true if the object is iterable
 */
Sk.builtin.checkIterable = function (arg) {
    if (arg === undefined) {
        return false;
    }
    if (arg.tp$iter) {
        const iter = arg.tp$iter();
        return iter.tp$iternext !== undefined;
    }
    return arg.mp$subscript !== undefined;
};
Sk.exportSymbol("Sk.builtin.checkIterable", Sk.builtin.checkIterable);

/**
 * @function
 * @param {*} obj 
 */
Sk.builtin.checkCallable = function (obj) {
    // takes care of builtin functions and methods, builtins
    return obj != null && obj.tp$call !== undefined;
};

/**
 * @function
 * @description
 * Is the object an instance of {@link Sk.builtin.int_} or {@link Sk.builtin.float_}
 * 
 * @param {*} arg 
 */
Sk.builtin.checkNumber = function (arg) {
    return typeof arg === "number" || arg instanceof Sk.builtin.int_ || arg instanceof Sk.builtin.float_ || arg instanceof Sk.builtin.lng;
};
Sk.exportSymbol("Sk.builtin.checkNumber", Sk.builtin.checkNumber);

/**
 * @description
 * Is the arg an instance of {@link Sk.builtin.complex}
 */
Sk.builtin.checkComplex = function (arg) {
    return arg instanceof Sk.builtin.complex;
};
Sk.exportSymbol("Sk.builtin.checkComplex", Sk.builtin.checkComplex);

/**
 * @description
 * Supports both JS Number and pyObject
 * @param {*} arg 
 */
Sk.builtin.checkInt = function (arg) {
    return arg instanceof Sk.builtin.int_ || (typeof arg === "number" && Number.isInteger(arg));
};
Sk.exportSymbol("Sk.builtin.checkInt", Sk.builtin.checkInt);

/**
 * @description
 * Is the arg an instance of {@link Sk.builtin.float_}
 * @param {*} arg 
 */
Sk.builtin.checkFloat = function (arg) {
    return arg instanceof Sk.builtin.float_;
};
Sk.exportSymbol("Sk.builtin.checkFloat", Sk.builtin.checkFloat);

/**
 * @description
 * Is the arg an instance of {@link Sk.builtin.str}
 * @param {*} arg 
 */
Sk.builtin.checkString = function (arg) {
    return arg instanceof Sk.builtin.str;
};
Sk.exportSymbol("Sk.builtin.checkString", Sk.builtin.checkString);

/**
 * @description
 * Is the arg an instance of {@link Sk.builtin.bytes}
 * @param {*} arg 
 */
Sk.builtin.checkBytes = function (arg) {
    return arg instanceof Sk.builtin.bytes;
};


/**
 * Is the arg an instance of {@link Sk.builtin.type}
 * @param {*} arg 
 */
Sk.builtin.checkClass = function (arg) {
    return arg instanceof Sk.builtin.type;
};
Sk.exportSymbol("Sk.builtin.checkClass", Sk.builtin.checkClass);

/**
 * @description
 * Is the arg an instance of {@link Sk.builtin.bool}
 * @param {*} arg 
 */
Sk.builtin.checkBool = function (arg) {
    return arg instanceof Sk.builtin.bool;
};
Sk.exportSymbol("Sk.builtin.checkBool", Sk.builtin.checkBool);

Sk.builtin.checkNone = function (arg) {
    return arg === Sk.builtin.none.none$;
};
Sk.exportSymbol("Sk.builtin.checkNone", Sk.builtin.checkNone);

/**
 * @description
 * Is the arg callable?
 * @param {*} arg 
 */
Sk.builtin.checkFunction = function (arg) {
    return arg != null && arg.tp$call !== undefined;
};
Sk.exportSymbol("Sk.builtin.checkFunction", Sk.builtin.checkFunction);

Sk.builtin.checkDataDescr = function (arg) {
    return arg && arg.tp$descr_set !== undefined;
};
Sk.exportSymbol("Sk.builtin.checkDataDescr", Sk.builtin.checkDataDescr);

/**
 * @description
 * Is the arg ain instance of {@link Sk.builtin.set} or {@link Sk.builtin.frozenset}
 * @param {*} arg 
 */
Sk.builtin.checkAnySet = function (arg) {
    return arg instanceof Sk.builtin.set || arg instanceof Sk.builtin.frozenset;
};

Sk.builtin.checkMapping = function (arg) {
    return (
        arg instanceof Sk.builtin.dict ||
        arg instanceof Sk.builtin.mappingproxy ||
        (arg != null && arg.mp$subscript !== undefined && Sk.abstr.lookupSpecial(arg, Sk.builtin.str.$keys) !== undefined)
    );
};