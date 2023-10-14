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
    constructor: function func(code, globals, closure, closure2) {
        Sk.asserts.assert(this instanceof Sk.builtin.func, "builtin func should be called as a class with `new`");

        this.func_code = code;
        this.func_globals = globals || null;

        this.$name = (code.co_name && code.co_name.v) || code.name || "<native JS>";
        this.$d = Sk.builtin.dict ? new Sk.builtin.dict() : undefined;
        this.$doc = code.co_docstring || Sk.builtin.none.none$;
        this.$module = (Sk.globals && Sk.globals["__name__"]) || Sk.builtin.none.none$;
        this.$qualname = (code.co_qualname && code.co_qualname.v) || this.$name;

        if (closure2 !== undefined) {
            // todo; confirm that modification here can't cause problems
            for (let k in closure2) {
                closure[k] = closure2[k];
            }
        }
        this.func_closure = closure;
        this.func_annotations = null;
        this.$memoiseFlags();
        this.memoised = code.co_fastcall || null;
        if (code.co_fastcall) {
            this.tp$call = code.bind(this);
        } else {
            this.tp$call = Sk.builtin.func.prototype.$funcCall.bind(this); // keep func the same shape
        }
    },
    slots: {
        tp$getattr: Sk.generic.getAttr,
        tp$descr_get(obj, objtype) {
            if (obj === null) {
                return this;
            }
            return new Sk.builtin.method(this, obj);
        },
        $r() {
            return new Sk.builtin.str("<function " + this.$qualname + ">");
        },
        tp$call(args, kws) {
            // we'll only be here from calling __call__ since we assigned tp$call in the constructor
            return this.tp$call(args, kws);
        },
    },
    getsets: {
        __name__: {
            $get() {
                return new Sk.builtin.str(this.$name);
            },
            $set(value) {
                if (!Sk.builtin.checkString(value)) {
                    throw new Sk.builtin.TypeError("__name__ must be set to a string object");
                }
                this.$name = value.$jsstr();
            },
        },
        __qualname__: {
            $get() {
                return new Sk.builtin.str(this.$qualname);
            },
            $set(value) {
                if (!Sk.builtin.checkString(value)) {
                    throw new Sk.builtin.TypeError("__qualname__ must be set to a string object");
                }
                this.$qualname = value.$jsstr();
            },
        },
        __dict__: Sk.generic.getSetDict,
        __annotations__: {
            $get() {
                if (this.func_annotations === null) {
                    this.func_annotations = new Sk.builtin.dict([]);
                } else if (Array.isArray(this.func_annotations)) {
                    this.func_annotations = Sk.abstr.keywordArrayToPyDict(this.func_annotations);
                }
                return this.func_annotations;
            },
            $set(v) {
                if (v === undefined || Sk.builtin.checkNone(v)) {
                    this.func_annotations = new Sk.builtin.dict([]);
                } else if (v instanceof Sk.builtin.dict) {
                    this.func_annotations = v;
                } else {
                    throw new Sk.builtin.TypeError("__annotations__ must be set to a dict object");
                }
            }
        },
        __defaults__: {
            $get() {
                return this.$defaults == null ? Sk.builtin.none.none$ : new Sk.builtin.tuple(this.$defaults);
            },
            $set(v) {
                if (v === undefined || Sk.builtin.checkNone(v)) {
                    this.$defaults = null;
                } else if (!(v instanceof Sk.builtin.tuple)) {
                    throw new Sk.builtin.TypeError("__defaults__ must be set to a tuple object");
                } else {
                    this.$defaults = v.valueOf();
                }
            }
        },
        __doc__: {
            $get() {
                return this.$doc;
            },
            $set(v) {
                // The value the user is setting __doc__ to can be any Python
                // object.  If we receive 'undefined' then the user is deleting
                // __doc__, which is allowed and results in __doc__ being None.
                this.$doc = v || Sk.builtin.none.none$;
            },
        },
        __module__: {
            $get() {
                return this.$module;
            },
            $set(v) {
                this.$module = v || Sk.builtin.none.none$;
            }
        }
    },
    proto: {
        $memoiseFlags() {
            this.co_varnames = this.func_code.co_varnames;
            this.co_argcount = this.func_code.co_argcount;
            if (this.co_argcount === undefined && this.co_varnames) {
                this.co_argcount = this.co_argcount = this.co_varnames.length;
            }
            this.co_kwonlyargcount = this.func_code.co_kwonlyargcount || 0;
            this.co_varargs = this.func_code.co_varargs;
            this.co_kwargs = this.func_code.co_kwargs;
            this.$defaults = this.func_code.$defaults;
            this.$kwdefs = this.func_code.$kwdefs || [];
        },
        $resolveArgs,
        $funcCall(posargs, kw) {
            // Property reads from func_code are slooow, but
            // the existing external API allows setup first, so as a
            // hack we delay this initialisation.
            // TODO change the external API to require all the co_vars
            // to be supplied at construction time!
            if (!this.memoised) {
                this.$memoiseFlags();
                this.memoised = true;
            }

            // Fast path for JS-native functions (which should be implemented
            // in a separate tp$call, really)
            if (
                this.co_argcount === undefined &&
                this.co_varnames === undefined &&
                !this.co_kwargs &&
                !this.func_closure
            ) {
                // It's a JS function with no type info, don't hang around
                // resolving anything.
                if (kw && kw.length !== 0) {
                    throw new Sk.builtin.TypeError(this.$name + "() takes no keyword arguments");
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
        },
    },
});

function $resolveArgs(posargs, kw) {
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
        } else if (posargs.length === 0 && this.$defaults && this.$defaults.length === co_argcount) {
            for (let i = 0; i != this.$defaults.length; i++) {
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
        const plural_expected = co_argcount == 1 ? "argument" : "arguments";
        const plural_given = nposargs == 1 ? "was" : "were";
        throw new Sk.builtin.TypeError(`${this.$name}"() takes ${co_argcount} positional ${plural_expected} but ${nposargs} ${plural_given} given`);
    }

    /* Handle keyword arguments */
    if (kw) {
        if (this.func_code["no_kw"]) {
            throw new Sk.builtin.TypeError(this.$name + "() takes no keyword arguments");
        }

        for (let i = 0; i < kw.length; i += 2) {
            let name = kw[i]; // JS string
            let value = kw[i+1]; // Python value
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
            throw new Sk.builtin.TypeError(
                this.$name +
                    "() missing " +
                    missing.length +
                    " required argument" +
                    (missing.length == 1 ? "" : "s") +
                    (missingUnnamed ? "" : ": " + missing.map((x) => "'" + x + "'").join(", "))
            );
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
            throw new Sk.builtin.TypeError(this.$name + "() missing " + missing.length + " required keyword argument" + (missing.length==1?"":"s") + ": " + missing.join(", "));
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

