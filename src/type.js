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
    "__mod__": "nb$remainder",
    "__rmod__": "nb$reflected_remainder",
    "__divmod__": "nb$divmod",
    "__rdivmod__": "nb$reflected_divmod",
    "__pow__": "nb$power",
    "__rpow__": "nb$reflected_power",
    "__contains__": "sq$contains",
    "__len__": ["sq$length", 1],
    "__get__": ["tp$descr_get", 3],
    "__set__": ["tp$descr_set", 3]
};

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
            this["$d"].mp$ass_subscript(new Sk.builtin.str("__dict__"), this["$d"]);
        };


        var _name = Sk.ffi.remapToJs(name); // unwrap name string to js for latter use

        var inheritsBuiltin = false;

        // Invoking the class object calls __new__() to generate a new instance,
        // then __init__() to initialise it
        klass.tp$call = function(args, kws) {
            var newf = Sk.builtin.type.typeLookup(klass, "__new__"), newargs;
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
                var init = Sk.builtin.type.typeLookup(s.ob$type, "__init__");

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

        if (bases.v.length === 0 && Sk.python3) {
            // new style class, inherits from object by default
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
            goog.inherits(klass, firstAncestor);

            if (firstAncestor.prototype instanceof Sk.builtin.object || firstAncestor === Sk.builtin.object) {
                klass.prototype.tp$base = firstAncestor;
            }
        }

        klass.prototype.tp$name = _name;
        klass.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(_name, klass);

        // set __module__ if not present (required by direct type(name, bases, dict) calls)
        var module_lk = new Sk.builtin.str("__module__");
        if(dict.mp$lookup(module_lk) === undefined) {
            dict.mp$ass_subscript(module_lk, Sk.globals["__name__"]);
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
        klass.prototype["$r"] = function () {
            var cname;
            var mod;
            var reprf = this.tp$getattr("__repr__");
            if (reprf !== undefined && reprf.im_func !== Sk.builtin.object.prototype["__repr__"]) {
                return Sk.misceval.apply(reprf, undefined, undefined, undefined, []);
            }

            if ((klass.prototype.tp$base !== undefined) &&
                (klass.prototype.tp$base !== Sk.builtin.object) &&
                (klass.prototype.tp$base.prototype["$r"] !== undefined)) {
                // If subclass of a builtin which is not object, use that class' repr
                return klass.prototype.tp$base.prototype["$r"].call(this);
            } else {
                // Else, use default repr for a user-defined class instance
                mod = dict.mp$subscript(module_lk); // lookup __module__
                cname = "";
                if (mod) {
                    cname = mod.v + ".";
                }
                return new Sk.builtin.str("<" + cname + _name + " object>");
            }
        };

        klass.prototype.tp$setattr = function(name, data, canSuspend) {
            var r, /** @type {(Object|undefined)} */ setf = Sk.builtin.object.prototype.GenericGetAttr.call(this, "__setattr__");
            if (setf !== undefined) {
                r = Sk.misceval.callsimOrSuspend(/** @type {Object} */ (setf), new Sk.builtin.str(name), data);
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            }

            return Sk.builtin.object.prototype.GenericSetAttr.call(this, name, data);
        };

        klass.prototype.tp$getattr = function(name, canSuspend) {
            var r, /** @type {(Object|undefined)} */ getf;
            // Convert AttributeErrors back into 'undefined' returns to match the tp$getattr
            // convention
            var callCatchUndefined = function() {
                return Sk.misceval.tryCatch(function() {
                    return Sk.misceval.callsimOrSuspend(/** @type {Object} */ (getf), new Sk.builtin.str(name));
                }, function (e) {
                    if (e instanceof Sk.builtin.AttributeError) {
                        return undefined;
                    } else {
                        throw e;
                    }
                });
            };

            getf = Sk.builtin.object.prototype.GenericGetAttr.call(this, "__getattribute__");

            if (getf !== undefined) {
                r = callCatchUndefined();
            } else {
                r = Sk.builtin.object.prototype.GenericGetAttr.call(this, name);
                if (r === undefined) {
                    getf = Sk.builtin.object.prototype.GenericGetAttr.call(this, "__getattr__");
                    if (getf !== undefined) {
                        r = callCatchUndefined();
                    }
                }
            }
            
            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        };

        klass.prototype.tp$str = function () {
            var strf = this.tp$getattr("__str__");
            if (strf !== undefined && strf.im_func !== Sk.builtin.object.prototype["__str__"]) {
                return Sk.misceval.apply(strf, undefined, undefined, undefined, []);
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
            var r = Sk.misceval.chain(Sk.abstr.gattr(this, "__len__", canSuspend), function(lenf) {
                return Sk.misceval.applyOrSuspend(lenf, undefined, undefined, undefined, []);
            });
            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        };
        klass.prototype.tp$call = function (args, kw) {
            return Sk.misceval.chain(this.tp$getattr("__call__", true), function(callf) {
                if (callf === undefined) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object is not callable");
                }
                return Sk.misceval.applyOrSuspend(callf, undefined, undefined, kw, args);
            });
        };
        klass.prototype.tp$iter = function () {
            var iterf = this.tp$getattr("__iter__");
            if (iterf === undefined) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object is not iterable");
            }
            return Sk.misceval.callsim(iterf);
        };
        klass.prototype.tp$iternext = function (canSuspend) {
            var self = this;
            var r = Sk.misceval.chain(self.tp$getattr("next", canSuspend), function(/** {Object} */ iternextf) {
                if (iternextf === undefined) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(self) + "' object is not iterable");
                }

                return Sk.misceval.tryCatch(function() {
                    return Sk.misceval.callsimOrSuspend(iternextf);
                }, function(e) {
                    if (e instanceof Sk.builtin.StopIteration) {
                        return undefined;
                    } else {
                        throw e;
                    }
                });
            });

            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        };

        klass.prototype.tp$getitem = function (key, canSuspend) {
            var getf = this.tp$getattr("__getitem__", canSuspend), r;
            if (getf !== undefined) {
                r = Sk.misceval.applyOrSuspend(getf, undefined, undefined, undefined, [key]);
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            }
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object does not support indexing");
        };
        klass.prototype.tp$setitem = function (key, value, canSuspend) {
            var setf = this.tp$getattr("__setitem__", canSuspend), r;
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

        var shortcutDunder = function (skulpt_name, magic_name, magic_func, canSuspendIdx) {
            klass.prototype[skulpt_name] = function () {
                var args = Array.prototype.slice.call(arguments), canSuspend;
                args.unshift(magic_func, this);

                if (canSuspendIdx !== null) {
                    canSuspend = args[canSuspendIdx+1];
                    args.splice(canSuspendIdx+1, 1);

                    if (canSuspend) {
                        return Sk.misceval.callsimOrSuspend.apply(undefined, args);
                    }
                }
                return Sk.misceval.callsim.apply(undefined, args);
            };
        };

        // Register skulpt shortcuts to magic methods defined by this class.
        // Dynamically deflined methods (eg those returned by __getattr__())
        // cannot be used by these magic functions; this is consistent with
        // how CPython handles "new-style" classes:
        // https://docs.python.org/2/reference/datamodel.html#special-method-lookup-for-old-style-classes
        var dunder, skulpt_name, canSuspendIdx;
        for (dunder in Sk.dunderToSkulpt) {
            skulpt_name = Sk.dunderToSkulpt[dunder];
            if (typeof(skulpt_name) === "string") {
                canSuspendIdx = null;
            } else {
                canSuspendIdx = skulpt_name[1];
                skulpt_name = skulpt_name[0];
            }

            if (klass[dunder]) {
                // scope workaround
                shortcutDunder(skulpt_name, dunder, klass[dunder], canSuspendIdx);
            }
        }

        return klass;
    }

};

/**
 *
 */
Sk.builtin.type.makeTypeObj = function (name, newedInstanceOfType) {
    Sk.builtin.type.makeIntoTypeObj(name, newedInstanceOfType);
    return newedInstanceOfType;
};

Sk.builtin.type.makeIntoTypeObj = function (name, t) {
    goog.asserts.assert(name !== undefined);
    goog.asserts.assert(t !== undefined);
    t.ob$type = Sk.builtin.type;
    t.tp$name = name;
    t["$r"] = function () {
        var ctype;
        var mod = t.__module__;
        var cname = "";
        if (mod) {
            cname = mod.v + ".";
        }
        ctype = "class";
        if (!mod && !t.sk$klass && !Sk.python3) {
            ctype = "type";
        }
        return new Sk.builtin.str("<" + ctype + " '" + cname + t.tp$name + "'>");
    };
    t.tp$str = undefined;
    t.tp$getattr = Sk.builtin.type.prototype.tp$getattr;
    t.tp$setattr = Sk.builtin.object.prototype.GenericSetAttr;
    t.tp$richcompare = Sk.builtin.type.prototype.tp$richcompare;
    t.sk$type = true;

    return t;
};

Sk.builtin.type.ob$type = Sk.builtin.type;
Sk.builtin.type.tp$name = "type";
Sk.builtin.type["$r"] = function () {
    if(Sk.python3) {
        return new Sk.builtin.str("<class 'type'>");
    } else {
        return new Sk.builtin.str("<type 'type'>");
    }
};

//Sk.builtin.type.prototype.tp$descr_get = function() { print("in type descr_get"); };

//Sk.builtin.type.prototype.tp$name = "type";

// basically the same as GenericGetAttr except looks in the proto instead
Sk.builtin.type.prototype.tp$getattr = function (name, canSuspend) {
    var res;
    var tp = this;
    var descr;
    var f;

    if (this["$d"]) {
        res = this["$d"].mp$lookup(new Sk.builtin.str(name));
        if (res !== undefined) {
            return res;
        }
    }

    descr = Sk.builtin.type.typeLookup(tp, name);

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

Sk.builtin.type.prototype.tp$setattr = function (name, value) {
    // class attributes are direct properties of the object
    this[name] = value;
};

Sk.builtin.type.typeLookup = function (type, name) {
    var mro = type.tp$mro;
    var pyname = new Sk.builtin.str(name);
    var base;
    var res;
    var i;

    // todo; probably should fix this, used for builtin types to get stuff
    // from prototype
    if (!mro) {
        if (type.prototype) {
            return type.prototype[name];
        }
        return undefined;
    }

    for (i = 0; i < mro.v.length; ++i) {
        base = mro.v[i];
        if (base.hasOwnProperty(name)) {
            return base[name];
        }
        res = base["$d"].mp$lookup(pyname);
        if (res !== undefined) {
            return res;
        }
        if (base.prototype && base.prototype[name] !== undefined) {
            return base.prototype[name];
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
                OUTER:
                    for (j = 0; j < seqs.length; ++j) {
                        sseq = seqs[j];
                        for (k = 1; k < sseq.length; ++k) {
                            if (sseq[k] === cand) {
                                break OUTER;
                            }
                        }
                    }

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

Sk.builtin.type.prototype.tp$richcompare = function (other, op) {
    var r2;
    var r1;
    if (other.ob$type != Sk.builtin.type) {
        return undefined;
    }
    if (!this["$r"] || !other["$r"]) {
        return undefined;
    }
    r1 = new Sk.builtin.str(this["$r"]().v.slice(1,6));
    r2 = new Sk.builtin.str(other["$r"]().v.slice(1,6));
    if (this["$r"]().v.slice(1,6) !== "class") {
        r1 = this["$r"]();
        r2 = other["$r"]();
    }
    return r1.tp$richcompare(r2, op);
};
