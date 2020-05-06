if (Sk.builtin === undefined) {
    Sk.builtin = {};
}

/**
 * Create getters and setters for builtins
 * @constructor
 * @param {String} _name
 * @param {Function} get
 * @param {Function} set 
 * @param {String} doc
 * @param {closure} 
 */

Sk.GetSetDef = function (_name, get, set, doc, closure) {
    this._name = _name;
    this.get = get;
    this.set = set;
    this.doc = doc;
    this.closure = closure;
};

Sk.exportSymbol("Sk.GetSetDef", Sk.GetSetDef);


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
        if (dict.tp$name !== "dict") {
            throw new Sk.builtin.TypeError("type() argument 3 must be dict, not " + Sk.abstr.typeName(dict));
        }

        // checks if name must be string
        if (!Sk.builtin.checkString(name)) {
            throw new Sk.builtin.TypeError("type() argument 1 must be str, not " + Sk.abstr.typeName(name));
        }

        // argument bases must be of type tuple
        if (bases.tp$name !== "tuple") {
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
        klass.tp$call = function (args, kws) {
            var newf = klass.$typeLookup(Sk.builtin.str.$new),
                newargs;
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

            return Sk.misceval.chain(self, function (s) {
                var init = s.ob$type.$typeLookup(Sk.builtin.str.$init);

                self = s; // in case __new__ suspended

                if (init !== undefined) {
                    args.unshift(self);
                    return Sk.misceval.applyOrSuspend(init, undefined, undefined, kws, args);
                } else if (newf === undefined && (args.length !== 0 || kws.length !== 0) && !inheritsBuiltin) {
                    // We complain about spurious constructor arguments if neither __new__
                    // nor __init__ were overridden
                    throw new Sk.builtin.TypeError("__init__() got unexpected argument(s)");
                }
            }, function (r) {
                if (r !== Sk.builtin.none.none$ && r !== undefined) {
                    throw new Sk.builtin.TypeError("__init__() should return None, not " + Sk.abstr.typeName(r));
                } else {
                    return self;
                }
            });
        };

        if (bases.v.length === 0) {
            // new style class, inherits from object by default
            if (Sk.__future__.inherit_from_object) {
                bases.v.push(Sk.builtin.object);
                Sk.abstr.setUpInheritance(_name, klass, Sk.builtin.object);
            } else {
                klass.prototype.__class__ = klass;
            }
        }
        var parent, it, firstAncestor, builtin_bases = [];
        // Set up inheritance from any builtins
        for (it = bases.tp$iter(), parent = it.tp$iternext(); parent !== undefined; parent = it.tp$iternext()) {
            if (!parent.prototype || !parent.sk$type) {
                throw new Sk.builtin.TypeError("bases must be 'type' objects");
            }
            if (firstAncestor === undefined) {
                firstAncestor = parent;
            }

            while (parent.sk$klass && parent.prototype.tp$base) {
                parent = parent.prototype.tp$base;
            }

            if (!parent.sk$klass && builtin_bases.indexOf(parent) < 0 && parent !== Sk.builtin.object) {
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
        const module_lk = new Sk.builtin.str("__module__");
        if (dict.mp$lookup(module_lk) === undefined) {
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
        }

        klass.prototype.hp$type = true;
        klass.sk$klass = true;

        klass.prototype.__dict__ = new Sk.builtin.getset_descriptor(klass, 
            new Sk.GetSetDef("__dict__", 
                          function () {return this["$d"];},
                          function (value) {
                              const tp_name = Sk.abstr.typeName(value);
                              if (tp_name !== "dict") {
                                  throw new Sk.builtin.TypeError("__dict__ must be set to a dictionary, not a '"+tp_name+"'")
                              }
                              this["$d"] = value;
                              return;
                          },
                          "dictionary for instance variables (if defined)"
                         )
            )


        klass.prototype["$r"] = function () {
            var cname;
            var mod;
            var reprf = this.tp$getattr(Sk.builtin.str.$repr);
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
                mod = klass.$typeLookup("__module__"); // lookup __module__
                cname = "";
                if (mod) {
                    cname = mod.v + ".";
                }
                return new Sk.builtin.str("<" + cname + _name + " object>");
            }
        };

        klass.prototype.tp$setattr = function (pyName, data, canSuspend) {
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
            var strf = this.tp$getattr(Sk.builtin.str.$str);
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
            var r = Sk.misceval.chain(Sk.abstr.gattr(this, Sk.builtin.str.$len, canSuspend), function (lenf) {
                return Sk.misceval.applyOrSuspend(lenf, undefined, undefined, undefined, []);
            });
            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        };
        klass.prototype.tp$call = function (args, kw) {
            return Sk.misceval.chain(this.tp$getattr(Sk.builtin.str.$call, true), function (callf) {
                if (callf === undefined) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object is not callable");
                }
                return Sk.misceval.applyOrSuspend(callf, undefined, undefined, kw, args);
            });
        };
        klass.prototype.tp$iter = function () {
            var iterf = this.tp$getattr(Sk.builtin.str.$iter);
            if (iterf === undefined) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object is not iterable");
            }
            return Sk.misceval.callsimArray(iterf);
        };
        klass.prototype.tp$iternext = function (canSuspend) {
            var self = this;
            var next;

            if (Sk.__future__.dunder_next) {
                next = Sk.builtin.str.$next3;
            } else {
                next = Sk.builtin.str.$next2;
            }
            var r = Sk.misceval.chain(self.tp$getattr(next, canSuspend), function (iternextf) {
                if (iternextf === undefined) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(self) + "' object is not iterable");
                }

                return Sk.misceval.tryCatch(function () {
                    return Sk.misceval.callsimOrSuspendArray(iternextf);
                }, function (e) {
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
            var getf = this.tp$getattr(Sk.builtin.str.$getitem, canSuspend),
                r;
            if (getf !== undefined) {
                r = Sk.misceval.applyOrSuspend(getf, undefined, undefined, undefined, [key]);
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            }
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object does not support indexing");
        };
        klass.prototype.tp$setitem = function (key, value, canSuspend) {
            var setf = this.tp$getattr(Sk.builtin.str.$setitem, canSuspend),
                r;
            if (setf !== undefined) {
                r = Sk.misceval.applyOrSuspend(setf, undefined, undefined, undefined, [key, value]);
                return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
            }
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(this) + "' object does not support item assignment");
        };

        klass.prototype.sk$prototypical = true;

        if (bases) {
            //print("building mro for", name);
            //for (var i = 0; i < bases.length; ++i)
            //print("base[" + i + "]=" + bases[i].tp$name);
            klass.prototype.tp$bases = bases;
            mro = klass.$buildMRO();
            klass.prototype.tp$mro = mro;
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
            if (klass.prototype.hasOwnProperty(dunder)) {
                Sk.builtin.type.$allocateSlot(klass, dunder);
            }
        }

        // tp$getattr is a special case; we need to catch AttributeErrors and
        // return undefined instead.
        let getattributeFn = klass.$typeLookup(Sk.builtin.str.$getattribute);
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

Sk.builtin.type.prototype.call = Function.prototype.call;
Sk.builtin.type.prototype.apply = Function.prototype.apply;
/**
 *
 */

Sk.builtin.type.makeIntoTypeObj = function (name, newedInstanceOfType) {
    Sk.asserts.assert(name !== undefined);
    Sk.asserts.assert(newedInstanceOfType !== undefined);
    Object.setPrototypeOf(newedInstanceOfType, Sk.builtin.type.prototype);
    return newedInstanceOfType;
};

Sk.builtin.type.prototype.ob$type = Sk.builtin.type;
Sk.builtin.type.prototype["$r"] = function () {
    var ctype;
    var mod = this.prototype.__module__;
    var cname = "";
    if (mod && Sk.builtin.checkString(mod)) {
        cname = mod.v + ".";
    } else {
        mod = null;
    }
    ctype = "class";
    if (!mod && !this.sk$klass && !Sk.__future__.class_repr) {
        ctype = "type";
    }
    return new Sk.builtin.str("<" + ctype + " '" + cname + this.prototype.tp$name + "'>");
};




Sk.builtin.type.prototype.tp$name = "type";
Sk.builtin.type.prototype.sk$type = true;






//Sk.builtin.type.prototype.tp$descr_get = function() { print("in type descr_get"); };

Sk.builtin.type.prototype.tp$name = "type";

// basically the same as GenericGetAttr except looks in the proto instead
Sk.builtin.type.prototype.tp$getattr = function (pyName) {


    throw new Sk.builtin.AttributeError("type object '" + this.prototype.tp$name + "' has no attribute '" + jsName + "'");
};

Sk.builtin.type.prototype.tp$getattr = function (pyName, canSuspend) {
    // first check that the pyName is indeed a string
    let res
    const jsName = pyName.$jsstr();

    const metatype = this.ob$type;

    // now check whether there is a descriptor down the prototypical chain
    // since we don't support metatypes yet this function will only ever be called by type objects
    // there is always a fast path for type objects
    // examples that would live down this path __dict__, __module__, __mro__, __name__
    // __class__ which is on the object.prototype is also here since type is an instance of object
    const meta_attribute = this[jsName];


    let meta_get;
    if (meta_attribute !== undefined) {
        meta_get = meta_attribute.tp$descr_get;
        if (meta_get !== undefined && Sk.builtin.checkDataDescr(meta_attribute)) {
            res = meta_get.call(meta_attribute, this, metatype);
            return res;
        }
    }

    const attribute = this.$typeLookup(jsName);

    if (attribute !== undefined) {
        const local_get = attribute.tp$descr_get;
        if (local_get !== undefined) {
            res = local_get.call(attribute, Sk.builtin.none.none$, this);
            return res;
        }
        return attribute;
    }

    // attribute was not found so use the meta_get if any
    if (meta_get !== undefined) {
        res = meta_get.call(meta_attribute, this, metatype);
        return res;
    }

    if (meta_attribute !== undefined) {
        return meta_attribute;
    }

    return undefined;
};

Sk.builtin.type.prototype.tp$setattr = function (pyName, value) {
    // class attributes are direct properties of the object
    if (!this.sk$klass) {
        throw new Sk.builtin.TypeError("can't set attributes of built-in/extension type '" + this.tp$name + "'");
    }
    var jsName = pyName.$jsstr();
    this.prototype[jsName] = value;
    if (jsName in Sk.dunderToSkulpt) {
        Sk.builtin.type.$allocateSlot(this, jsName);
    }
};

Sk.builtin.type.prototype.$typeLookup = function (pyName) {
    const jsName = pyName.$jsstr ? pyName.$jsstr() : pyName;

    if (this.prototype.sk$prototypical) {
        return this.prototype[jsName];
    }

    const mro = this.prototype.tp$mro;

    for (let i = 0; i < mro.v.length; ++i) {
        base = mro.v[i];
        if (base.prototype.hasOwnProperty(jsName)) {
            return base.prototype[jsName];
        }
    }

    return undefined;
};

Sk.builtin.type.prototype.sk$prototypical = true;

Sk.builtin.type.prototype.$mroMerge_ = function (seqs) {
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
    for (;;) {
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

        // check prototypical mro
        if (res.length && this.prototype.sk$prototypical) {
            this.prototype.sk$prototypical = Object.getPrototypeOf(res[res.length - 1].prototype) === next.prototype;
        }

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


Sk.builtin.type.prototype.$buildMRO_ = function () {
    // MERGE(klass + mro(bases) + bases)
    var i;
    var bases;
    var all = [
        [this]
    ];

    //Sk.debugout("buildMRO for", klass.tp$name);

    const kbases = this.prototype.tp$bases;

    for (i = 0; i < kbases.v.length; ++i) {
        all.push([...kbases.v[i].prototype.tp$mro.v]);
    }

    bases = [];
    for (i = 0; i < kbases.v.length; ++i) {
        bases.push(kbases.v[i]);
    }
    all.push(bases);

    return this.$mroMerge_(all);
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
Sk.builtin.type.prototype.$buildMRO = function () {
    return new Sk.builtin.tuple(this.$buildMRO_());
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

    r1 = this["$r"]();
    r2 = other["$r"]();

    return r1.tp$richcompare(r2, op);
};

Sk.builtin.type.prototype["__format__"] = function (self, format_spec) {
    Sk.builtin.pyCheckArgsLen("__format__", arguments.length, 1, 2);
    return new Sk.builtin.str(self);
};

Sk.builtin.type.pythonFunctions = ["__format__"];

Sk.builtin.type.$allocateSlot = function (klass, dunder) {
    // allocate a dunder method to a skulpt slot
    const magic_func = klass.prototype[dunder];
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


Sk.builtin.type.prototype.tp$getsets = [
    new Sk.GetSetDef("__bases__", 
                     function () {
                         return this.prototype.tp$bases;
                        }
                     ),
    new Sk.GetSetDef("__base__", 
                     function () {
                         return this.prototype.tp$base ? this.prototype.tp$base : Sk.builtin.none.none$;
                        }
                     ),
    new Sk.GetSetDef("__mro__", 
                     function () {
                         return this.prototype.tp$mro;
                        }
                     ),
    new Sk.GetSetDef("__dict__", 
                     function () {
                         return new Sk.builtin.mappingproxy(this.prototype);
                        }
                     ),
    new Sk.GetSetDef("__doc__", 
                     function () {
                         return this.prototype.tp$doc ? this.prototype.tp$doc : Sk.builtin.none.none$;
                        }
                    ),
    new Sk.GetSetDef("__name__", 
                     function () {
                         return new Sk.builtin.str(this.prototype.tp$name);
                        }
                     ),
    new Sk.GetSetDef("__module__", 
                     function () {
                         if (this.sk$klass) {
                             return this.prototype.__module__;
                            }
                            let mod = this.prototype.tp$name.split(".");
                            mod = mod.slice(0, mod.length - 1).join(".");
                            if (mod) {
                                return new Sk.builtin.str(mod);
                            } else {
                                return new Sk.builtin.str("builtins");
                            }
                        }
                    ),
]