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
    if ((nargs < minargs) || (nargs > maxargs)) {
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
goog.exportSymbol("Sk.builtin.pyCheckArgs", Sk.builtin.pyCheckArgs);

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
goog.exportSymbol("Sk.builtin.pyCheckType", Sk.builtin.pyCheckType);

Sk.builtin.checkSequence = function (arg) {
    return (arg !== null && arg.mp$subscript !== undefined);
};
goog.exportSymbol("Sk.builtin.checkSequence", Sk.builtin.checkSequence);

/**
 * Use this to test whether or not a Python object is iterable.  You should **not** rely
 * on the presence of tp$iter on the object as a good test, as it could be a user defined
 * class with `__iter__` defined or ``__getitem__``  This tests for all of those cases
 *
 * @param arg {Object}   A Python object
 * @returns {boolean} true if the object is iterable
 */
Sk.builtin.checkIterable = function (arg) {
    var ret = false;
    if (arg !== null ) {
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
goog.exportSymbol("Sk.builtin.checkIterable", Sk.builtin.checkIterable);

Sk.builtin.checkCallable = function (obj) {
    // takes care of builtin functions and methods, builtins
    if (typeof obj === "function") {
        return true;
    }
    // takes care of python function, methods and lambdas
    if (obj instanceof Sk.builtin.func) {
        return true;
    }
    // takes care of instances of methods
    if (obj instanceof Sk.builtin.method) {
        return true;
    }
    // go up the prototype chain to see if the class has a __call__ method
    if (Sk.abstr.lookupSpecial(obj, "__call__") !== undefined) {
        return true;
    } 
    return false;
};

Sk.builtin.checkNumber = function (arg) {
    return (arg !== null && (typeof arg === "number" ||
        arg instanceof Sk.builtin.int_ ||
        arg instanceof Sk.builtin.float_ ||
        arg instanceof Sk.builtin.lng));
};
goog.exportSymbol("Sk.builtin.checkNumber", Sk.builtin.checkNumber);

/**
 * Checks for complex type, delegates to internal method
 * Most skulpt users would search here!
 */
Sk.builtin.checkComplex = function (arg) {
    return Sk.builtin.complex._complex_check(arg);
};
goog.exportSymbol("Sk.builtin.checkComplex", Sk.builtin.checkComplex);

Sk.builtin.checkInt = function (arg) {
    return (arg !== null) && ((typeof arg === "number" && arg === (arg | 0)) ||
        arg instanceof Sk.builtin.int_ ||
        arg instanceof Sk.builtin.lng);
};
goog.exportSymbol("Sk.builtin.checkInt", Sk.builtin.checkInt);

Sk.builtin.checkFloat = function (arg) {
    return (arg !== null) && (arg instanceof Sk.builtin.float_);
};
goog.exportSymbol("Sk.builtin.checkFloat", Sk.builtin.checkFloat);

Sk.builtin.checkString = function (arg) {
    return (arg !== null && arg.__class__ == Sk.builtin.str);
};
goog.exportSymbol("Sk.builtin.checkString", Sk.builtin.checkString);

Sk.builtin.checkClass = function (arg) {
    return (arg !== null && arg.sk$type);
};
goog.exportSymbol("Sk.builtin.checkClass", Sk.builtin.checkClass);

Sk.builtin.checkBool = function (arg) {
    return (arg instanceof Sk.builtin.bool);
};
goog.exportSymbol("Sk.builtin.checkBool", Sk.builtin.checkBool);

Sk.builtin.checkNone = function (arg) {
    return (arg instanceof Sk.builtin.none);
};
goog.exportSymbol("Sk.builtin.checkNone", Sk.builtin.checkNone);

Sk.builtin.checkFunction = function (arg) {
    return (arg !== null && arg.tp$call !== undefined);
};
goog.exportSymbol("Sk.builtin.checkFunction", Sk.builtin.checkFunction);

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
Sk.builtin.func = function (code, globals, closure, closure2) {
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
    return this;
};
goog.exportSymbol("Sk.builtin.func", Sk.builtin.func);


Sk.builtin.func.prototype.tp$name = "function";
Sk.builtin.func.prototype.tp$descr_get = function (obj, objtype) {
    goog.asserts.assert(obj !== undefined && objtype !== undefined);
    if (obj == null) {
        return this;
    }
    return new Sk.builtin.method(this, obj);
};
Sk.builtin.func.prototype.tp$call = function (args, kw) {
    var j;
    var i;
    var numvarnames;
    var varnames;
    var kwlen;
    var kwargsarr;
    var expectskw;
    var name;
    var numargs;

    // note: functions expect 'this' to be globals to avoid having to
    // slice/unshift onto the main args
    if (this.func_closure) {
        // todo; OK to modify?
        if (this.func_code["$defaults"] && this.func_code["co_varnames"]) {
            // Make sure all default arguments are in args before adding closure
            numargs = args.length;
            numvarnames = this.func_code["co_varnames"].length;
            for (i = numargs; i < numvarnames; i++) {
                args.push(undefined);
            }
        }
        args.push(this.func_closure);
    }

    expectskw = this.func_code["co_kwargs"];
    kwargsarr = [];

    if (this.func_code["no_kw"] && kw) {
        name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || "<native JS>";
        throw new Sk.builtin.TypeError(name + "() takes no keyword arguments");
    }

    if (kw) {
        // bind the kw args
        kwlen = kw.length;
        varnames = this.func_code["co_varnames"];
        numvarnames = varnames && varnames.length;
        for (i = 0; i < kwlen; i += 2) {
            // todo; make this a dict mapping name to offset
            for (j = 0; j < numvarnames; ++j) {
                if (kw[i] === varnames[j]) {
                    break;
                }
            }
            if (varnames && j !== numvarnames) {
                if (j in args) {
                    name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || "<native JS>";
                    throw new Sk.builtin.TypeError(name + "() got multiple values for keyword argument '" + kw[i] + "'");
                }
                args[j] = kw[i + 1];
            } else if (expectskw) {
                // build kwargs dict
                kwargsarr.push(new Sk.builtin.str(kw[i]));
                kwargsarr.push(kw[i + 1]);
            } else {
                name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || "<native JS>";
                throw new Sk.builtin.TypeError(name + "() got an unexpected keyword argument '" + kw[i] + "'");
            }
        }
    }
    if (expectskw) {
        args.unshift(kwargsarr);
    }

    //print(JSON.stringify(args, null, 2));

    return this.func_code.apply(this.func_globals, args);
};

Sk.builtin.func.prototype.tp$getattr = function (key) {
    return this[key];
};
Sk.builtin.func.prototype.tp$setattr = function (key, value) {
    this[key] = value;
};

//todo; investigate why the other doesn't work
//Sk.builtin.type.makeIntoTypeObj('function', Sk.builtin.func);
Sk.builtin.func.prototype.ob$type = Sk.builtin.type.makeTypeObj("function", new Sk.builtin.func(null, null));

Sk.builtin.func.prototype["$r"] = function () {
    var name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || "<native JS>";
    return new Sk.builtin.str("<function " + name + ">");
};
