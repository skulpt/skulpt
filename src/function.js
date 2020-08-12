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
    return (arg !== null && arg.mp$subscript !== undefined);
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
Sk.exportSymbol("Sk.builtin.checkIterable", Sk.builtin.checkIterable);

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
    if (Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$call) !== undefined) {
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
    return arg instanceof Sk.builtin.int_ || arg instanceof Sk.builtin.lng || (typeof arg === "number" && Number.isInteger(arg));
};
Sk.exportSymbol("Sk.builtin.checkInt", Sk.builtin.checkInt);

Sk.builtin.checkFloat = function (arg) {
    return (arg !== null) && (arg instanceof Sk.builtin.float_);
};
Sk.exportSymbol("Sk.builtin.checkFloat", Sk.builtin.checkFloat);

Sk.builtin.checkString = function (arg) {
    return (arg !== null && arg.__class__ == Sk.builtin.str);
};
Sk.exportSymbol("Sk.builtin.checkString", Sk.builtin.checkString);

Sk.builtin.checkBytes = function (arg) {
    return arg instanceof Sk.builtin.bytes;
};

Sk.builtin.checkClass = function (arg) {
    return (arg !== null && arg.sk$type);
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
    return (arg !== null && arg.tp$call !== undefined);
};
Sk.exportSymbol("Sk.builtin.checkFunction", Sk.builtin.checkFunction);

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
    if (!(this instanceof Sk.builtin.func)) {
        // otherwise it assigned .func_code and .func_globals somewhere and in certain
        // situations that will cause a lot of strange errors.
        throw new Error("builtin func should be called as a class with `new`");
    }

    var k;
    this.func_code = code;
    this.func_globals = globals || null;
    if (closure2 !== undefined) {
        // todo; confirm that modification here can't cause problems
        for (k in closure2) {
            closure[k] = closure2[k];
        }
    }

    this["$d"] = {
        "__name__": code["co_name"],
        "__class__": Sk.builtin.func
    };
    this.func_closure = closure;
    this.tp$name = (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || this.func_code.name || "<native JS>";

    // Because our external API allows you to set these flags
    // *after* constructing the function (grr), we can only
    // currently rely on this memoisation in fast-call mode.
    // (but we set the values anyway so V8 knows the object's
    // shape)
    this.$memoiseFlags();
    this.memoised = code.co_fastcall;

    if (code.co_fastcall) {
        this.tp$call = code;
    }
    return this;
};

Sk.abstr.setUpInheritance("function", Sk.builtin.func, Sk.builtin.object);

Sk.exportSymbol("Sk.builtin.func", Sk.builtin.func);

Sk.builtin.func.prototype.tp$name = "function";

Sk.builtin.func.prototype.$memoiseFlags = function() {
    this.co_varnames = this.func_code.co_varnames;
    this.co_argcount = this.func_code.co_argcount;
    if (this.co_argcount === undefined && this.co_varnames) {
        this.co_argcount = this.co_argcount = this.co_varnames.length;
    }
    this.co_kwonlyargcount = this.func_code.co_kwonlyargcount || 0;
    this.co_varargs = this.func_code.co_varargs;
    this.co_kwargs = this.func_code.co_kwargs;
    this.$defaults = this.func_code.$defaults || [];
    this.$kwdefs = this.func_code.$kwdefs || [];
};

Sk.builtin.func.prototype.tp$descr_get = function (obj, objtype) {
    Sk.asserts.assert(!(obj === undefined && objtype === undefined));
    if (objtype && objtype.prototype && objtype.prototype.tp$name in Sk.builtin && Sk.builtin[objtype.prototype.tp$name] === objtype) {
        // it's a builtin
        return new Sk.builtin.method(this, obj, objtype, true);
    }
    return new Sk.builtin.method(this, obj, objtype);
};

Sk.builtin.func.pythonFunctions = ["__get__"];

Sk.builtin.func.prototype.__get__ = function __get__(self, instance, owner) {
    Sk.builtin.pyCheckArgsLen("__get__", arguments.length, 1, 2, false, true);
    if (instance === Sk.builtin.none.none$ && owner === Sk.builtin.none.none$) {
        throw new Sk.builtin.TypeError("__get__(None, None) is invalid");
    }

    return self.tp$descr_get(instance, owner);
};

Sk.builtin.func.prototype.tp$getname = function () {
    return (this.func_code && this.func_code["co_name"] && this.func_code["co_name"].v) || this.func_code.name || "<native JS>";
};

Sk.builtin.func.prototype.$resolveArgs = function (posargs, kw) {
    // The rest of this function is a logical Javascript port of
    // _PyEval_EvalCodeWithName, and follows its logic,
    // plus fast-paths imported from _PyFunction_FastCall* as marked

    let co_argcount = this.co_argcount;

    if (co_argcount === undefined) {
        co_argcount = this.co_varnames ? this.co_varnames.length : posargs.length;
    }
    let varnames = this.co_varnames || [];
    let co_kwonlyargcount = this.co_kwonlyargcount || 0;
    let totalArgs = co_argcount + co_kwonlyargcount;

    // Fast path from _PyFunction_FastCallDict
    if (co_kwonlyargcount === 0 && !this.co_kwargs && (!kw || kw.length === 0) && !this.co_varargs) {
        if (posargs.length == co_argcount) {
            return posargs;
        } else if(posargs.length === 0 && this.$defaults &&
                    this.$defaults.length === co_argcount) {
            for (let i=0; i!=this.$defaults.length; i++) {
                posargs[i] = this.$defaults[i];
            }
            return posargs;
        }
    }
    // end fast path from _PyFunction_FastCallDict
    


    let kwargs;

    /* Create a NOT-a-dictionary for keyword parameters (**kwags) */
    if (this.co_kwargs) {
        kwargs = [];
    }

    /* Copy positional arguments into arguments to our JS function*/
    let nposargs = posargs.length;
    let args = (posargs.length <= co_argcount) ? posargs : posargs.slice(0, co_argcount);


    /* Pack other positional arguments into the *args argument */
    if (this.co_varargs) {
        let vararg = (posargs.length > args.length) ? posargs.slice(args.length) : [];
        args[totalArgs] = new Sk.builtin.tuple(vararg);
    } else if (nposargs > co_argcount) {
        throw new Sk.builtin.TypeError(this.tp$getname() + "() takes " + co_argcount + " positional argument" + (co_argcount == 1 ? "" : "s") + " but " + nposargs + (nposargs == 1 ? " was " : " were ") + " given");
    }

    /* Handle keyword arguments */
    if (kw) {
        if (this.func_code["no_kw"]) {
            throw new Sk.builtin.TypeError(this.tp$getname() + "() takes no keyword arguments");
        }

        for (let i = 0; i < kw.length; i += 2) {
            let name = kw[i]; // JS string
            let value = kw[i+1]; // Python value
            let idx = varnames.indexOf(name);

            if (idx >= 0) {
                if (args[idx] !== undefined) {
                    throw new Sk.builtin.TypeError(this.tp$getname() + "() got multiple values for argument '" + name + "'");
                }
                args[idx] = value;
            } else if (kwargs) {
                kwargs.push(new Sk.builtin.str(name), value);
            } else {
                throw new Sk.builtin.TypeError(this.tp$getname() + "() got an unexpected keyword argument '" + name + "'");
            }
        }
    }

    /* "Check the number of positional arguments" (which only checks for too many)
       has been handled before keywords */

    /* Add missing positional arguments (copy default values from defs)
       (also checks for missing args where no defaults) */
    {
        let defaults = this.$defaults || [];
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
        if (missing.length != 0 && (this.co_argcount || this.co_varnames)) {
            throw new Sk.builtin.TypeError(this.tp$getname() + "() missing " + missing.length + " required argument" + (missing.length==1?"":"s") + (missingUnnamed ? "" : (": " + missing.join(", "))));
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
        let kwdefs = this.$kwdefs;

        for (let i = co_argcount; i < totalArgs; i++) {
            if (args[i] === undefined) {
                if (kwdefs[i-co_argcount] !== undefined) {
                    args[i] = kwdefs[i-co_argcount];
                } else {
                    missing.push(varnames[i]);
                }
            }
        }
        if (missing.length !== 0) {
            throw new Sk.builtin.TypeError(this.tp$getname() + "() missing " + missing.length + " required keyword argument" + (missing.length==1?"":"s") + ": " + missing.join(", "));
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
    }

    if (kwargs) {
        args.unshift(kwargs);
    }

    return args;
};

Sk.builtin.func.prototype.tp$call = function (posargs, kw) {
    //console.log("Legacy tp$call for", this.tp$getname());

    // Property reads from func_code are slooow, but
    // the existing external API allows setup first, so as a
    // hack we delay this initialisation.
    // TODO change the external API to require all the co_ vars
    // to be supplied at construction time!
    if (!this.memoised) {
        this.$memoiseFlags();
        this.memoised = true;
    }
    
    // Fast path for JS-native functions (which should be implemented
    // in a separate tp$call, really)
    if (this.co_argcount === undefined && this.co_varnames === undefined  && !this.co_kwargs && !this.func_closure) {
        // It's a JS function with no type info, don't hang around
        // resolving anything.
        if (kw && kw.length !== 0) {
            throw new Sk.builtin.TypeError(this.tp$getname() + "() takes no keyword arguments");
        }
        return this.func_code.apply(this.func_globals, posargs);
    }
    // end js fast path

    let args = this.$resolveArgs(posargs, kw);
    if (this.func_closure) {
        args.push(this.func_closure);
    }
    // note: functions expect 'this' to be globals to avoid having to
    // slice/unshift onto the main args
    return this.func_code.apply(this.func_globals, args);
};


Sk.builtin.func.prototype["$r"] = function () {
    var name = this.tp$getname();
    if (name in Sk.builtins && this === Sk.builtins[name]) {
        return new Sk.builtin.str("<built-in function " + name + ">");
    } else {
        return new Sk.builtin.str("<function " + name + ">");
    }
};
