Sk.generic = {};

/**
 * Get an attribute
 * @param {Object} pyName Python string name of the attribute
 * @param {boolean=} canSuspend Can we return a suspension?
 * @return {undefined}
 */
Sk.generic.getAttr = function __getattribute__(pyName, canSuspend, jsMangled) {
    let f;
    jsMangled = jsMangled || pyName.$jsstr();
    const descr = this.ob$type.$typeLookup(jsMangled);
    // look in the type for a descriptor
    if (descr !== undefined) {
        f = descr.tp$descr_get;
        if (f && Sk.builtin.checkDataDescr(descr)) {
            return f.call(descr, this, this.ob$type, canSuspend);
        }
    }

    const dict = this.$d;

    if (dict !== undefined) {
        const res = dict.quick$lookup(pyName);
        if (res !== undefined) {
            return res;
        }
    }
    if (f) {
        return f.call(descr, this, this.ob$type, canSuspend);
    }
    if (descr != null) {
        return descr;
    }
    return;
};
Sk.exportSymbol("Sk.generic.getAttr", Sk.generic.getAttr);

/**
 * @param {Object} pyName
 * @param {Object} value
 * @param {boolean=} canSuspend
 * @return {undefined}
 */
Sk.generic.setAttr = function __setattr__(pyName, value, canSuspend, jsMangled) {
    jsMangled = jsMangled || pyName.$jsstr();
    const descr = this.ob$type.$typeLookup(jsMangled); 
    // otherwise, look in the type for a descr
    if (descr !== undefined && descr !== null) {
        const f = descr.tp$descr_set;
        // todo; is this the right lookup priority for data descriptors?
        if (f) {
            return f.call(descr, this, value, canSuspend);
        }
    }

    const dict = this.$d;
    if (dict !== undefined) {
        if (dict.mp$ass_subscript) {
            if (value != null) {
                return dict.mp$ass_subscript(pyName, value);
            } else {
                try {
                    return dict.mp$ass_subscript(pyName);
                } catch (e) {
                    if (e instanceof Sk.builtin.KeyError) {
                        throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(this) + "' object has no attribute '" + pyName.$jsstr() + "'");
                    }
                    throw e;
                }
            }
        } else if (typeof dict === "object") {
            if (value != null) {
                dict[jsMangled] = value;
                return;
            } else if (dict[jsMangled] !== undefined) {
                delete dict[jsMangled];
                return;
            }
        }
    }
    throw new Sk.builtin.AttributeError("'" + Sk.abstr.typeName(this) + "' object has no attribute '" + pyName.$jsstr() + "'");
};
Sk.exportSymbol("Sk.generic.setAttr", Sk.generic.setAttr);

Sk.generic.new = function (builtin) {
    const genericNew = function __new__(args, kwargs) {
        // this = prototype of an sk$type object.
        if (this === builtin.prototype) {
            return new this.constructor();
        } else {
            const instance = new this.constructor();
            // now we want to apply instance to the builtin
            builtin.call(instance);
            return instance;
        }
    };
    return genericNew;
};

Sk.generic.newMethodDef = {
    $meth: function (args, kwargs) {
        // this = a type object
        let this_name, subs_name;

        if (args.length < 1) {
            this_name = this.prototype.tp$name;
            throw new Sk.builtin.TypeError(this_name + ".__new__(): not enough arguments");
        }

        const subtype = args.shift();

        if (subtype.sk$type === undefined) {
            this_name = this.prototype.tp$name;
            throw new Sk.builtin.TypeError(this_name + "__new__(X): X is not a type object (" + Sk.abst.typeName(subtype) + ")");
        }

        if (!subtype.$isSubType(this)) {
            this_name = this.prototype.tp$name;
            subs_name = subtype.prototype.tp$name;
            throw new Sk.builtin.TypeError(this_name + ".__new__(" + subs_name + "): " + subs_name + " is not a subtype of " + this_name);
        }
        /* from CPython: Check that the use doesn't do something silly and unsafe like
       object.__new__(dict).  To do this, we check that the
       most derived base that's not a heap type is this type. */
        const slot_new = Sk.slots.__new__.$slot_func;
        let staticbase = subtype;
        let static_new = staticbase.prototype.hasOwnProperty("tp$new") ? staticbase.prototype.tp$new : null;
        while (staticbase && (static_new === null || static_new === slot_new)) {
            staticbase = staticbase.prototype.tp$base;
            static_new = staticbase.prototype.hasOwnProperty("tp$new") ? staticbase.prototype.tp$new : null;
        }
        if (staticbase && staticbase.prototype.tp$new !== this.prototype.tp$new) {
            this_name = this.prototype.tp$name;
            subs_name = subtype.prototype.tp$name;
            const suitable = staticbase.prototype.tp$name;
            throw new Sk.builtin.TypeError(this_name + ".__new__(" + subs_name + ") is not safe, use " + suitable + ".__new__()");
        }
        return this.prototype.tp$new.call(subtype.prototype, args, kwargs);
    },
    $flags: { FastCall: true },
    $textsig: "($type, *args, **kwargs)",
    $name: "__new__",
};

/**
 * @function
 * @returns {self}
 */
Sk.generic.selfIter = function __iter__() {
    return this;
};

/**
 * @function
 *
 * @description
 * the $seq of the iterator must be an array
 * $orig must be provided and must have a valid sq$length
 */
Sk.generic.iterNextWithArrayCheckSize = function __next__() {
    if (this.$index >= this.$seq.length) {
        return undefined;
    } else if (this.$seq.length !== this.$orig_size) {
        const error_name = this.tp$name.split("_")[0];
        throw new Sk.builtin.RuntimeError(error_name + " changed size during iteration");
    }
    return this.$seq[this.$index++];
};

/**
 * @function
 *
 *
 * @description
 * the $seq of the iterator must be an array
 */
Sk.generic.iterNextWithArray = function __next__() {
    if (this.$index >= this.$seq.length) {
        return undefined;
    }
    return this.$seq[this.$index++];
};

/**
 * @description
 * compares the $seq.length to the $index
 */
Sk.generic.iterLengthHintWithArrayMethodDef = {
    $meth: function __length_hint__() {
        return new Sk.builtin.int_(this.$seq.length - this.$index);
    },
    $flags: { NoArgs: true },
};

Sk.generic.getSetDict = {
    $get: function () {
        return this.$d;
    },
    $set: function (value) {
        if (!(value instanceof Sk.builtin.dict)) {
            throw new Sk.builtin.TypeError("__dict__ must be set to a dictionary, not a '" + Sk.abstr.typeName(value) + "'");
        }
        this.$d = value;
    },
    $doc: "dictionary for instance variables (if defined)",
    $name: "__dict__",
};

Sk.generic.functionCallMethod = function (posargs, kw) {
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
        } else if (posargs.length === 0 && this.func_code.$defaults && this.func_code.$defaults.length === co_argcount) {
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
    let args = posargs.length <= co_argcount ? posargs : posargs.slice(0, co_argcount);

    /* Pack other positional arguments into the *args argument */
    if (this.func_code.co_varargs) {
        let vararg = posargs.length > args.length ? posargs.slice(args.length) : [];
        args[totalArgs] = new Sk.builtin.tuple(vararg);
    } else if (nposargs > co_argcount) {
        throw new Sk.builtin.TypeError(
            this.$name +
                "() takes " +
                co_argcount +
                " positional argument" +
                (co_argcount == 1 ? "" : "s") +
                " but " +
                nposargs +
                (nposargs == 1 ? " was " : " were ") +
                " given"
        );
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
        let i = 0,
            missing = [],
            missingUnnamed = false;
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
            throw new Sk.builtin.TypeError(
                this.$name +
                    "() missing " +
                    missing.length +
                    " required argument" +
                    (missing.length == 1 ? "" : "s") +
                    (missingUnnamed ? "" : ": " + missing.join(", "))
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
            throw new Sk.builtin.TypeError(
                this.$name +
                    "() missing " +
                    missing.length +
                    " required keyword argument" +
                    (missing.length == 1 ? "" : "s") +
                    ": " +
                    missing.join(", ")
            );
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
};
