if(Sk.builtin === undefined) {
    Sk.builtin = {};
}

/**
 * Maps Python dunder names to the Skulpt Javascript function names that
 * implement them.
 *
 * Note: __add__, __mul__, and __rmul__ can be used for either numeric or
 * sequence types. Here, they default to the numeric versions (i.e. nb$add,
 * nb$multiply, and nb$reflected_multiply). This works because Sk.abstr.binary_op_
 * checks for the numeric shortcuts and not the sequence shortcuts when computing
 * a binary operation.
 *
 * Because many of these functions are used in contexts in which Skulpt does not
 * [yet] handle suspensions, the assumption is that they must not suspend. However,
 * some of these built-in functions are acquiring 'canSuspend' arguments to signal
 * where this is not the case. These need to be spliced out of the argument list before
 * it is passed to python. Array values in this map contain [dunderName, argumentIdx],
 * where argumentIdx specifies the index of the 'canSuspend' boolean argument.
 *
 * @type {Object}
 */
Sk.dunderToSkulpt = {
    "__eq__": "ob$eq",
    "__ne__": "ob$ne",
    "__lt__": "ob$lt",
    "__le__": "ob$le",
    "__gt__": "ob$gt",
    "__ge__": "ob$ge",
    "__hash__": "tp$hash",
    "__abs__": "nb$abs",
    "__neg__": "nb$negative",
    "__pos__": "nb$positive",
    "__int__": "nb$int_",
    "__long__": "nb$lng",
    "__float__": "nb$float_",
    "__add__": "nb$add",
    "__radd__": "nb$reflected_add",
    "__sub__": "nb$subtract",
    "__rsub__": "nb$reflected_subtract",
    "__mul__": "nb$multiply",
    "__rmul__": "nb$reflected_multiply",
    "__div__": "nb$divide",
    "__rdiv__": "nb$reflected_divide",
    "__floordiv__": "nb$floor_divide",
    "__rfloordiv__": "nb$reflected_floor_divide",
    "__invert__": "nb$invert",
    "__mod__": "nb$remainder",
    "__rmod__": "nb$reflected_remainder",
    "__divmod__": "nb$divmod",
    "__rdivmod__": "nb$reflected_divmod",
    "__pow__": "nb$power",
    "__rpow__": "nb$reflected_power",
    "__contains__": "sq$contains",
    "__iter__": "tp$iter",
    "__bool__": ["nb$bool", 1],
    "__nonzero__": ["nb$nonzero", 1],
    "__len__": ["sq$length", 1],
    "__get__": ["tp$descr_get", 3],
    "__set__": ["tp$descr_set", 3]
};

Sk.setupDunderMethods = function (py3) {
    if (py3) {
        Sk.dunderToSkulpt["__matmul__"] = "tp$matmul";
        Sk.dunderToSkulpt["__rmatmul__"] = "tp$reflected_matmul";
    } else {
        if (Sk.dunderToSkulpt["__matmul__"]) {
            delete Sk.dunderToSkulpt["__matmul__"];
        }
        if (Sk.dunderToSkulpt["__rmatmul__"]) {
            delete Sk.dunderToSkulpt["__rmatmul__"];
        }
    }
};

Sk.exportSymbol("Sk.setupDunderMethods", Sk.setupDunderMethods);
/**
 *
 * @constructor
 *
 * @param {*} name name or object to get type of, if only one arg
 *
 * @param {Sk.builtin.tuple=} bases
 *
 * @param {Object=} dict
 *
 *
 * This type represents the type of `type'. *Calling* an instance of
 * this builtin type named "type" creates class objects. The resulting
 * class objects will have various tp$xyz attributes on them that allow
 * for the various operations on that object.
 *
 * calling the type or calling an instance of the type? or both?
 */
Sk.builtin.type = function (name, bases, dict) {
    var mro;
    var obj;
    var klass;
    var v;
    if (bases === undefined && dict === undefined) {
        // 1 arg version of type()
        // the argument is an object, not a name and returns a type object
        obj = name;
        return obj.ob$type;
    } else {

        // argument dict must be of type dict
        if(dict.tp$name !== "dict") {
            throw new Sk.builtin.TypeError("type() argument 3 must be dict, not " + Sk.abstr.typeName(dict));
        }

        // checks if name must be string
        if(!Sk.builtin.checkString(name)) {
            throw new Sk.builtin.TypeError("type() argument 1 must be str, not " + Sk.abstr.typeName(name));
        }

        // argument bases must be of type tuple
        if(bases.tp$name !== "tuple") {
            throw new Sk.builtin.TypeError("type() argument 2 must be tuple, not " + Sk.abstr.typeName(bases));
        }

        // type building version of type

        // dict is the result of running the classes code object
        // (basically the dict of functions). those become the prototype
        // object of the class).

        /**
        * The constructor is a stub, that gets called from object.__new__
        * @constructor
        */
        klass = function (args, kws) {
            var args_copy;

            // Call up through the chain in case there's a built-in object
            // whose constructor we need to initialise
            if (klass.prototype.tp$base !== undefined) {
                if (klass.prototype.tp$base.sk$klass) {
                    klass.prototype.tp$base.call(this, args, kws);
                } else {
                    // Call super constructor if subclass of a builtin
                    args_copy = args.slice();
                    args_copy.unshift(klass, this);
                    Sk.abstr.superConstructor.apply(undefined, args_copy);
                }
            }

            this["$d"] = new Sk.builtin.dict([]);
        };

        var _name = Sk.ffi.remapToJs(name); // unwrap name string to js for latter use

        var inheritsBuiltin = false;

        // Invoking the class object calls __new__() to generate a new instance,
        // then __init__() to initialise it
        klass.tp$call = function(args, kws) {
            var newf = Sk.builtin.type.typeLookup(klass, Sk.builtin.str.$new), newargs;
            var self;

            args = args || [];
            kws = kws || [];

            if (newf === undefined || newf === Sk.builtin.object.prototype["__new__"]) {
                // No override -> just call the constructor
                self = new klass(args, kws);
                newf = undefined;
            } else {
                newargs = args.slice();
                newargs.unshift(klass);
                self = Sk.misceval.applyOrSuspend(newf, undefined, undefined, kws, newargs);
            }

            return Sk.misceval.chain(self, function(s) {
                var init = Sk.builtin.type.typeLookup(s.ob$type, Sk.builtin.str.$init);

                self = s; // in case __new__ suspended

                if (init !== undefined) {
                    args.unshift(self);
                    return Sk.misceval.applyOrSuspend(init, undefined, undefined, kws, args);
                } else if (newf === undefined && (args.length !== 0 || kws.length !== 0) && !inheritsBuiltin) {
                    // We complain about spurious constructor arguments if neither __new__
                    // nor __init__ were overridden
                    throw new Sk.builtin.TypeError("__init__() got unexpected argument(s)");
                }
            }, function(r) {
                if (r !== Sk.builtin.none.none$ && r !== undefined) {
                    throw new Sk.builtin.TypeError("__init__() should return None, not " + Sk.abstr.typeName(r));
                } else {
                    return self;
                }
            });
        };

        if (bases.v.length === 0 && Sk.__future__.inherit_from_object) {
            // new style class, inherits from object by default
            bases.v.push(Sk.builtin.object);
            Sk.abstr.setUpInheritance(_name, klass, Sk.builtin.object);
        }

        var parent, it, firstAncestor, builtin_bases = [];
        // Set up inheritance from any builtins
        for (it = bases.tp$iter(), parent = it.tp$iternext(); parent !== undefined; parent = it.tp$iternext()) {
            if (firstAncestor === undefined) {
                firstAncestor = parent;
            }

            while (parent.sk$klass && parent.prototype.tp$base) {
                parent = parent.prototype.tp$base;
            }

            if (!parent.sk$klass && builtin_bases.indexOf(parent) < 0) {
                builtin_bases.push(parent);
                inheritsBuiltin = true;
            }
        }

        if (builtin_bases.length > 1) {
            throw new Sk.builtin.TypeError("Multiple inheritance with more than one builtin type is unsupported");
        }

        // Javascript does not support multiple inheritance, so only the first
        // base (if any) will directly inherit in Javascript
        if (firstAncestor !== undefined) {
            Sk.abstr.inherits(klass, firstAncestor);

            if (firstAncestor.prototype instanceof Sk.builtin.object || firstAncestor === Sk.builtin.object) {
                klass.prototype.tp$base = firstAncestor;
            }
        }

        klass.prototype.tp$name = _name;
        klass.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(_name, klass);

        // set __module__ if not present (required by direct type(name, bases, dict) calls)
        if(dict.mp$lookup(Sk.builtin.str.$module) === undefined) {
            dict.mp$ass_subscript(Sk.builtin.str.$module, Sk.globals["__name__"]);
        }

        // copy properties into our klass object
        // uses python iter methods
        var k;
        for (it = dict.tp$iter(), k = it.tp$iternext(); k !== undefined; k = it.tp$iternext()) {
            v = dict.mp$subscript(k);
            if (v === undefined) {
                v = null;
            }
            klass.prototype[k.v] = v;
            klass[k.v] = v;
        }

        klass["__class__"] = klass;
        klass["__name__"] = name;
        klass.sk$klass = true;
        klass.prototype.hp$type = true;
        klass.prototype["$r"] = function () {
            const reprf = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$repr);
            if (reprf !== undefined && reprf !== Sk.builtin.object.prototype["__repr__"]) {
                return Sk.misceval.callsimArray(reprf, [this]);
            }

            if ((klass.prototype.tp$base !== undefined) &&
                (klass.prototype.tp$base.prototype["$r"] !== undefined)) {
                // use superclass $r
                return klass.prototype.tp$base.prototype["$r"].call(this);
            } else {
                // Else, use object repr for a user-defined class instance
                return Sk.builtin.object.prototype["$r"].call(this);
            }
        };

        klass.prototype.tp$setattr = function(pyName, data, canSuspend) {
            var r, setf = Sk.builtin.object.prototype.GenericGetAttr.call(this, Sk.builtin.str.$setattr);
            if (setf !== undefined) {
                var f = /** @type {?} */ (setf);
                r = Sk.misceval.callsimOrSuspendArray(f, [pyName, data]);
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            }

            return Sk.builtin.object.prototype.GenericSetAttr.call(this, pyName, data, canSuspend);
        };

        // We do not define tp$getattr here. We usually inherit it from object,
        // unless we (or one of our parents) overrode it by defining
        // __getattribute__. It's handled down with the other dunder-funcs.
        // We could migrate other tp$/dunder-functions that way, but
        // tp$getattr() is the performance hot-spot, and doing it this way
        // allows us to work out *once* whether this class has a
        // __getattribute__, rather than checking on every tp$getattr() call

        klass.prototype.tp$str = function () {
            const strf = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$str);
            if (strf !== undefined && strf !== Sk.builtin.object.prototype["__str__"]) {
                return Sk.misceval.callsimArray(strf, [this]);
            }
            if ((klass.prototype.tp$base !== undefined) &&
                (klass.prototype.tp$base !== Sk.builtin.object) &&
                (klass.prototype.tp$base.prototype.tp$str !== undefined)) {
                // If subclass of a builtin which is not object, use that class' repr
                return klass.prototype.tp$base.prototype.tp$str.call(this);
            }
            return this["$r"]();
        };
        klass.prototype.tp$length = function (canSuspend) {
            var r = Sk.misceval.chain(Sk.abstr.gattr(this, Sk.builtin.str.$len, canSuspend), function(lenf) {
                return Sk.misceval.applyOrSuspend(lenf, undefined, undefined, undefined, []);
            });
            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        };
        klass.prototype.tp$call = function (args, kw) {
            return Sk.misceval.chain(this.tp$getattr(Sk.builtin.str.$call, true), function(callf) {
                if (callf === undefined) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object is not callable");
                }
                return Sk.misceval.applyOrSuspend(callf, undefined, undefined, kw, args);
            });
        };
        const iternext = dict.mp$lookup(Sk.builtin.str.$next);
        if (iternext !== undefined) {
            klass.prototype.tp$iternext = function (canSuspend) {
                const self = this;
                const r = Sk.misceval.tryCatch(
                    () => Sk.misceval.callsimOrSuspendArray(iternext, [self]),
                    (e) => {
                        if (e instanceof Sk.builtin.StopIteration) {
                            return undefined;
                        } else {
                            throw e;
                        }
                    }
                );
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            };
        }



        klass.prototype.tp$getitem = function (key, canSuspend) {
            var getf = this.tp$getattr(Sk.builtin.str.$getitem, canSuspend), r;
            if (getf !== undefined) {
                r = Sk.misceval.applyOrSuspend(getf, undefined, undefined, undefined, [key]);
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            }
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object does not support indexing");
        };
        klass.prototype.tp$setitem = function (key, value, canSuspend) {
            var setf = this.tp$getattr(Sk.builtin.str.$setitem, canSuspend), r;
            if (setf !== undefined) {
                r = Sk.misceval.applyOrSuspend(setf, undefined, undefined, undefined, [key, value]);
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            }
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object does not support item assignment");
        };

        if (bases) {
            //print("building mro for", name);
            //for (var i = 0; i < bases.length; ++i)
            //print("base[" + i + "]=" + bases[i].tp$name);
            klass["$d"] = new Sk.builtin.dict([]);
            klass["$d"].mp$ass_subscript(Sk.builtin.type.basesStr_, bases);
            mro = Sk.builtin.type.buildMRO(klass);
            klass["$d"].mp$ass_subscript(Sk.builtin.type.mroStr_, mro);
            klass.tp$mro = mro;
            //print("mro result", Sk.builtin.repr(mro).v);
        }

        // fix for class attributes
        klass.tp$setattr = Sk.builtin.type.prototype.tp$setattr;



        // Register skulpt shortcuts to magic methods defined by this class.
        // Dynamically defined methods (eg those returned by __getattr__())
        // cannot be used by these magic functions; this is consistent with
        // how CPython handles "new-style" classes:
        // https://docs.python.org/2/reference/datamodel.html#special-method-lookup-for-old-style-classes
        var dunder;
        for (dunder in Sk.dunderToSkulpt) {
            if (klass.hasOwnProperty(dunder)) {
                Sk.builtin.type.$allocateSlot(klass, dunder);
            }
        }

        // tp$getattr is a special case; we need to catch AttributeErrors and
        // return undefined instead.
        let getattributeFn = Sk.builtin.type.typeLookup(klass, Sk.builtin.str.$getattribute);
        if (getattributeFn !== undefined && getattributeFn !== Sk.builtin.object.prototype.__getattribute__) {
            klass.prototype.tp$getattr = function (pyName, canSuspend) {
                let r = Sk.misceval.tryCatch(
                    () => Sk.misceval.callsimOrSuspendArray(getattributeFn, [this, pyName]),
                    function (e) {
                        if (e instanceof Sk.builtin.AttributeError) {
                            return undefined;
                        } else {
                            throw e;
                        }
                    }
                );
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            };
        } else if (!klass.prototype.tp$getattr) {
            // This is only relevant in Python 2, where
            // it's possible not to inherit from object
            // (or perhaps when inheriting from builtins? Unclear)
            klass.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
        }

        return klass;
    }

};

Object.defineProperties(Sk.builtin.type.prototype, /**@lends {Sk.builtin.type.prototype}*/ {
    call: { value: Function.prototype.call },
    apply: { value: Function.prototype.apply },
    ob$type: { value: Sk.builtin.type, writable: true },
    tp$name: { value: "type", writable: true },
    tp$base: { value: Sk.builtin.object, writable: true },
    sk$type: { value: true },
});

/**
 *
 */
Sk.builtin.type.makeTypeObj = function (name, newedInstanceOfType) {
    Sk.builtin.type.makeIntoTypeObj(name, newedInstanceOfType);
    return newedInstanceOfType;
};

Sk.builtin.type.makeIntoTypeObj = function (name, t) {
    Sk.asserts.assert(name !== undefined);
    Sk.asserts.assert(t !== undefined);
    Object.setPrototypeOf(t, Sk.builtin.type.prototype);
    return t;
};

Sk.builtin.type.prototype["$r"] = function () {
    let mod = this.prototype.__module__;
    let cname = "";
    let ctype = "class";
    if (mod && Sk.builtin.checkString(mod)) {
        cname = mod.v + ".";
    } else {
        mod = null;
    }
    if (!mod && !this.sk$klass && !Sk.__future__.class_repr) {
        ctype = "type";
    }
    return new Sk.builtin.str("<" + ctype + " '" + cname + this.prototype.tp$name + "'>");
};

//Sk.builtin.type.prototype.tp$descr_get = function() { print("in type descr_get"); };


// basically the same as GenericGetAttr except looks in the proto instead
Sk.builtin.type.prototype.tp$getattr = function (pyName, canSuspend) {
    var res;
    var tp = this;
    var descr;
    var f;

    if (this["$d"]) {
        res = this["$d"].mp$lookup(pyName);
        if (res !== undefined) {
            return res;
        }
    }

    descr = Sk.builtin.type.typeLookup(tp, pyName);

    //print("type.tpgetattr descr", descr, descr.tp$name, descr.func_code, name);
    if (descr !== undefined && descr !== null && descr.ob$type !== undefined) {
        f = descr.tp$descr_get;
        // todo;if (f && descr.tp$descr_set) // is a data descriptor if it has a set
        // return f.call(descr, this, this.ob$type);
    }

    if (f) {
        // non-data descriptor
        return f.call(descr, Sk.builtin.none.none$, tp, canSuspend);
    }

    if (descr !== undefined) {
        return descr;
    }

    return undefined;
};

Sk.builtin.type.prototype.tp$setattr = function (pyName, value) {
    // class attributes are direct properties of the object
    if (this.sk$klass === undefined) {
        throw new Sk.builtin.TypeError("can't set attributes of built-in/extension type '" + this.prototype.tp$name + "'");
    }
    var jsName = Sk.fixReserved(pyName.$jsstr());
    this[jsName] = value;
    this.prototype[jsName] = value;
    if (jsName in Sk.dunderToSkulpt) {
        Sk.builtin.type.$allocateSlot(this, jsName);
    }
};

Sk.builtin.type.typeLookup = function (type, pyName) {
    var mro = type.tp$mro;
    var base;
    var res;
    var i;
    var jsName = pyName.$mangled;

    // todo; probably should fix this, used for builtin types to get stuff
    // from prototype
    if (!mro) {
        if (type.prototype) {
            return type.prototype[jsName];
        }
        return undefined;
    }

    for (i = 0; i < mro.v.length; ++i) {
        base = mro.v[i];
        if (base.hasOwnProperty(jsName)) {
            return base[jsName];
        }
        res = base["$d"].mp$lookup(pyName);
        if (res !== undefined) {
            return res;
        }
        if (base.prototype && base.prototype[jsName] !== undefined) {
            return base.prototype[jsName];
        }
    }

    return undefined;
};

Sk.builtin.type.mroMerge_ = function (seqs) {
    /*
     var tmp = [];
     for (var i = 0; i < seqs.length; ++i)
     {
     tmp.push(new Sk.builtin.list(seqs[i]));
     }
     print(Sk.builtin.repr(new Sk.builtin.list(tmp)).v);
     */
    var seq;
    var i;
    var next;
    var k;
    var sseq;
    var j;
    var cand;
    var cands;
    var res = [];
    for (; ;) {
        for (i = 0; i < seqs.length; ++i) {
            seq = seqs[i];
            if (seq.length !== 0) {
                break;
            }
        }
        if (i === seqs.length) { // all empty
            return res;
        }
        cands = [];
        for (i = 0; i < seqs.length; ++i) {
            seq = seqs[i];
            //print("XXX", Sk.builtin.repr(new Sk.builtin.list(seq)).v);
            if (seq.length !== 0) {
                cand = seq[0];
                //print("CAND", Sk.builtin.repr(cand).v);

                /* eslint-disable */
                OUTER:
                    for (j = 0; j < seqs.length; ++j) {
                        sseq = seqs[j];
                        for (k = 1; k < sseq.length; ++k) {
                            if (sseq[k] === cand) {
                                break OUTER;
                            }
                        }
                    }
                /* eslint-enable */

                // cand is not in any sequences' tail -> constraint-free
                if (j === seqs.length) {
                    cands.push(cand);
                }
            }
        }

        if (cands.length === 0) {
            throw new Sk.builtin.TypeError("Inconsistent precedences in type hierarchy");
        }

        next = cands[0];
        // append next to result and remove from sequences
        res.push(next);
        for (i = 0; i < seqs.length; ++i) {
            seq = seqs[i];
            if (seq.length > 0 && seq[0] === next) {
                seq.splice(0, 1);
            }
        }
    }
};

Sk.builtin.type.buildMRO_ = function (klass) {
    // MERGE(klass + mro(bases) + bases)
    var i;
    var bases;
    var all = [
        [klass]
    ];

    //Sk.debugout("buildMRO for", klass.tp$name);

    var kbases = klass["$d"].mp$subscript(Sk.builtin.type.basesStr_);
    for (i = 0; i < kbases.v.length; ++i) {
        all.push(Sk.builtin.type.buildMRO_(kbases.v[i]));
    }

    bases = [];
    for (i = 0; i < kbases.v.length; ++i) {
        bases.push(kbases.v[i]);
    }
    all.push(bases);

    return Sk.builtin.type.mroMerge_(all);
};

/*
 * C3 MRO (aka CPL) linearization. Figures out which order to search through
 * base classes to determine what should override what. C3 does the "right
 * thing", and it's what Python has used since 2.3.
 *
 * Kind of complicated to explain, but not really that complicated in
 * implementation. Explanations:
 *
 * http://people.csail.mit.edu/jrb/goo/manual.43/goomanual_55.html
 * http://www.python.org/download/releases/2.3/mro/
 * http://192.220.96.201/dylan/linearization-oopsla96.html
 *
 * This implementation is based on a post by Samuele Pedroni on python-dev
 * (http://mail.python.org/pipermail/python-dev/2002-October/029176.html) when
 * discussing its addition to Python.
 */
Sk.builtin.type.buildMRO = function (klass) {
    return new Sk.builtin.tuple(Sk.builtin.type.buildMRO_(klass));
};


Sk.builtin.type.prototype["__format__"] = function(self, format_spec) {
    Sk.builtin.pyCheckArgsLen("__format__", arguments.length, 1, 2);
    return new Sk.builtin.str(self);
};

Sk.builtin.type.pythonFunctions = ["__format__"];

Sk.builtin.type.$allocateSlot = function (klass, dunder) {
    // allocate a dunder method to a skulpt slot
    const magic_func = klass[dunder];
    let skulpt_name = Sk.dunderToSkulpt[dunder];

    if (typeof (skulpt_name) === "string") {
        // can't suspend so just use calsimArray
        klass.prototype[skulpt_name] = function () {
            let len, args, i;
            len = arguments.length;
            args = new Array(len + 1);
            args[0] = this;
            for (i = 0; i < len; i++) {
                args[i + 1] = arguments[i];
            }
            return Sk.misceval.callsimArray(magic_func, args);
        };
    } else {
        // can suspend
        let canSuspendIdx = skulpt_name[1];
        skulpt_name = skulpt_name[0];
        klass.prototype[skulpt_name] = function () {
            let len, args, i, j;
            let canSuspend = false;
            len = arguments.length;
            if (canSuspendIdx <= len) {
                args = new Array(len);
            } else {
                args = new Array(len + 1);
            }
            args[0] = this;
            j = 1;
            for (i = 0; i < len; i++) {
                if (i === (canSuspendIdx - 1)) {
                    canSuspend = arguments[i];
                } else {
                    args[j] = arguments[i];
                    j += 1;
                }
            }
            if (canSuspend) {
                return Sk.misceval.callsimOrSuspendArray(magic_func, args);
            } else {
                return Sk.misceval.callsimArray(magic_func, args);
            }
        };
    }
};
