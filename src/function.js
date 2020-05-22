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
    return (arg !== undefined && arg.mp$subscript !== undefined);
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
    if (obj.sk$prototypical) {
        return obj.tp$call !== undefined;
    }
    return Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$call) != null;
};

Sk.builtin.checkNumber = function (arg) {
    return (arg != null && (typeof arg === "number" ||
        arg instanceof Sk.builtin.int_ ||
        arg instanceof Sk.builtin.float_ ||
        arg instanceof Sk.builtin.lng));
};
Sk.exportSymbol("Sk.builtin.checkNumber", Sk.builtin.checkNumber);

/**
 * Checks for complex type, delegates to internal method
 * Most skulpt users would search here!
 */
Sk.builtin.checkComplex = function (arg) {
    return Sk.builtin.complex._complex_check(arg);
};
Sk.exportSymbol("Sk.builtin.checkComplex", Sk.builtin.checkComplex);

Sk.builtin.checkInt = function (arg) {
    return (arg != null) && ((typeof arg === "number" && arg === (arg | 0)) ||
        arg instanceof Sk.builtin.int_ ||
        arg instanceof Sk.builtin.lng);
};
Sk.exportSymbol("Sk.builtin.checkInt", Sk.builtin.checkInt);

Sk.builtin.checkFloat = function (arg) {
    return (arg != null) && (arg instanceof Sk.builtin.float_);
};
Sk.exportSymbol("Sk.builtin.checkFloat", Sk.builtin.checkFloat);

Sk.builtin.checkString = function (arg) {
    return (arg != null && arg.ob$type == Sk.builtin.str);
};
Sk.exportSymbol("Sk.builtin.checkString", Sk.builtin.checkString);

Sk.builtin.checkClass = function (arg) {
    return (arg != null && arg.sk$type);
};
Sk.exportSymbol("Sk.builtin.checkClass", Sk.builtin.checkClass);

Sk.builtin.checkBool = function (arg) {
    return (arg instanceof Sk.builtin.bool);
};
Sk.exportSymbol("Sk.builtin.checkBool", Sk.builtin.checkBool);

Sk.builtin.checkNone = function (arg) {
    return (arg === Sk.builtin.none.none$);
};
Sk.exportSymbol("Sk.builtin.checkNone", Sk.builtin.checkNone);

Sk.builtin.checkFunction = function (arg) {
    return (arg != null && arg.tp$call !== undefined);
};
Sk.exportSymbol("Sk.builtin.checkFunction", Sk.builtin.checkFunction);

Sk.builtin.checkDataDescr = function (arg) {
    return (arg && arg.tp$descr_set !== undefined);
};
Sk.exportSymbol("Sk.builtin.checkDataDescr", Sk.builtin.checkDataDescr);
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
Sk.builtin.func = Sk.abstr.buildNativeClass("function", {
    constructor: function func (code, globals, closure, closure2) {
        if (!(this instanceof Sk.builtin.func)) {
            // otherwise it assigned .func_code and .func_globals somewhere and in certain
            // situations that will cause a lot of strange errors.
            throw new Error("builtin func should be called as a class with `new`");
        }
        // this.$d = new Sk.builtin.dict;
        this.$d = {};

        var k;
        this.func_code = code;
        this.func_globals = globals || null;
        if (closure2 !== undefined) {
            // todo; confirm that modification here can't cause problems
            for (k in closure2) {
                closure[k] = closure2[k];
            }
        }
        this.$defaults = code.$defaults || [];
        this.func_closure = closure;
        this.$name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || this.func_code.name || "<native JS>";
        return this;
    },
    slots: {
        tp$descr_get: function (obj, objtype) {
            Sk.asserts.assert(!(obj === undefined && objtype === undefined));
            if (objtype && objtype.prototype && objtype.prototype.tp$name in Sk.builtin && Sk.builtin[objtype.prototype.tp$name] === objtype) {
                // it's a builtin
                return new Sk.builtin.method(this, obj, objtype, true);
            }
            return new Sk.builtin.method(this, obj, objtype);
        },
        $r: function () {
            return new Sk.builtin.str("<function " + this.$name + ">");
        },
        tp$call: function (posargs, kw) {
            // The rest of this function is a logical Javascript port of
            // _PyEval_EvalCodeWithName, and follows its logic,
            // plus fast-paths imported from _PyFunction_FastCall* as marked

            let co_argcount = this.func_code.co_argcount;

            if (co_argcount === undefined) {
                co_argcount = this.func_code.co_varnames ? this.func_code.co_varnames.length : posargs.length;
            }
            let varnames = this.func_code.co_varnames || [];
            let co_kwonlyargcount = this.func_code.co_kwonlyargcount || 0;
            let totalArgs = co_argcount + co_kwonlyargcount;

            // Fast path from _PyFunction_FastCallDict
            if (co_kwonlyargcount === 0 && !this.func_code.co_kwargs && (!kw || kw.length === 0) && !this.func_code.co_varargs) {
                if (posargs.length == co_argcount) {
                    if (this.func_closure) {
                        posargs.push(this.func_closure);
                    }
                    return this.func_code.apply(this.func_globals, posargs);
                } else if (posargs.length === 0 && this.func_code.$defaults &&
                    this.func_code.$defaults.length === co_argcount) {
                    for (let i = 0; i != this.func_code.$defaults.length; i++) {
                        posargs[i] = this.func_code.$defaults[i];
                    }
                    if (this.func_closure) {
                        posargs.push(this.func_closure);
                    }
                    return this.func_code.apply(this.func_globals, posargs);
                }
            }
            // end fast path from _PyFunction_FastCallDict
            let kwargs;

            /* Create a NOT-a-dictionary for keyword parameters (**kwags) */
            if (this.func_code.co_kwargs) {
                kwargs = [];
            }

            /* Copy positional arguments into arguments to our JS function*/
            let nposargs = posargs.length;
            let args = (posargs.length <= co_argcount) ? posargs : posargs.slice(0, co_argcount);


            /* Pack other positional arguments into the *args argument */
            if (this.func_code.co_varargs) {
                let vararg = (posargs.length > args.length) ? posargs.slice(args.length) : [];
                args[totalArgs] = new Sk.builtin.tuple(vararg);
            } else if (nposargs > co_argcount) {
                throw new Sk.builtin.TypeError(this.$name + "() takes " + co_argcount + " positional argument" + (co_argcount == 1 ? "" : "s") + " but " + nposargs + (nposargs == 1 ? " was " : " were ") + " given");
            }

            /* Handle keyword arguments */
            if (kw) {
                if (this.func_code["no_kw"]) {
                    throw new Sk.builtin.TypeError(this.$name + "() takes no keyword arguments");
                }

                for (let i = 0; i < kw.length; i += 2) {
                    let name = kw[i]; // JS string
                    let value = kw[i + 1]; // Python value
                    let idx = varnames.indexOf(name);

                    if (idx >= 0) {
                        if (args[idx] !== undefined) {
                            throw new Sk.builtin.TypeError(this.$name + "() got multiple values for argument '" + name + "'");
                        }
                        args[idx] = value;
                    } else if (kwargs) {
                        kwargs.push(new Sk.builtin.str(name), value);
                    } else {
                        throw new Sk.builtin.TypeError(this.$name + "() got an unexpected keyword argument '" + name + "'");
                    }
                }
            }

            /* "Check the number of positional arguments" (which only checks for too many)
               has been handled before keywords */

            /* Add missing positional arguments (copy default values from defs)
               (also checks for missing args where no defaults) */
            {
                let defaults = this.func_code.$defaults || [];
                let i = 0, missing = [], missingUnnamed = false;
                // Positional args for which we *don't* have a default
                let defaultStart = co_argcount - defaults.length;
                for (; i < defaultStart; i++) {
                    if (args[i] === undefined) {
                        missing.push(varnames[i]);
                        if (varnames[i] === undefined) {
                            missingUnnamed = true;
                        }
                    }
                }
                if (missing.length != 0 && (this.func_code.co_argcount || this.func_code.co_varnames)) {
                    throw new Sk.builtin.TypeError(this.$name + "() missing " + missing.length + " required argument" + (missing.length == 1 ? "" : "s") + (missingUnnamed ? "" : (": " + missing.join(", "))));
                }
                for (; i < co_argcount; i++) {
                    if (args[i] === undefined) {
                        args[i] = defaults[i - defaultStart];
                    }
                }
            }

            /* Add missing keyword arguments (copy default values from kwdefs) */

            if (co_kwonlyargcount > 0) {
                let missing = [];
                let kwdefs = this.func_code.$kwdefs;

                for (let i = co_argcount; i < totalArgs; i++) {
                    if (args[i] === undefined) {
                        if (kwdefs[i - co_argcount] !== undefined) {
                            args[i] = kwdefs[i - co_argcount];
                        } else {
                            missing.push(varnames[i]);
                        }
                    }
                }
                if (missing.length !== 0) {
                    throw new Sk.builtin.TypeError(this.$name + "() missing " + missing.length + " required keyword argument" + (missing.length == 1 ? "" : "s") + ": " + missing.join(", "));
                }
            }

            if (this.func_closure) {
                // todo; OK to modify?
                if (varnames) {
                    // Make sure all default arguments are in args before adding closure
                    for (let i = args.length; i < varnames.length; i++) {
                        args.push(undefined);
                    }
                }

                args.push(this.func_closure);
            }

            if (kwargs) {
                args.unshift(kwargs);
            }

            // note: functions expect 'this' to be globals to avoid having to
            // slice/unshift onto the main args
            return this.func_code.apply(this.func_globals, args);

        }

    },
    getsets: {
        __name__: {
            $get: function () { return new Sk.builtin.str(this.$name) },
            $set: function (value) {
                if (!Sk.builtin.checkString(value)) {
                    throw new Sk.builtin.TypeError("__name__ must be set to a string object");
                }
                this.$name = value.$jsstr();
            }
        },
        __dict__: Sk.generic.getSetDict,
        __defaults__: {
            $get: function () {
                return new Sk.builtin.tuple(this.$defaults);
            } // technically this is a writable property but we'll leave it as read-only for now
        },
        __doc__: {
            $get: function () {return new Sk.builtin.str(this.$doc)},
        }
    }
},
)
