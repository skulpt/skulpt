/**
 * @namespace Sk.builtin
 *
 * @description
 * All the builtin types as well as useful functions
 */
if (Sk.builtin === undefined) {
    Sk.builtin = {};
}

/**
 * @constructor
 * @extends {Sk.builtin.object}
 * @description
 * this should never be called as a constructor
 * instead use {@link Sk.abstr.buildNativeClass} or
 * {@link Sk.misceval.buildClass}
 *
 */
Sk.builtin.type = function type(obj) {
    if (this instanceof Sk.builtin.type) {
        Sk.asserts.fail("calling new Sk.builtin.type is not safe");
    }
    return obj.ob$type; // allow this use of calling type
};

Object.defineProperties(
    Sk.builtin.type.prototype,
    /**@lends {Sk.builtin.type.prototype}*/ {
        call: { value: Function.prototype.call },
        apply: { value: Function.prototype.apply },
        tp$slots: {
            value: {
                tp$doc: "type(object_or_name, bases, dict)\ntype(object) -> the object's type\ntype(name, bases, dict) -> a new type",
                tp$call,
                tp$new,
                tp$getattr,
                tp$setattr,
                $r,
            },
            writable: true,
        },
        tp$methods: { value: null, writable: true }, // define these later
        tp$getsets: { value: null, writable: true },
        sk$type: { value: true },
        $isSubType: { value: $isSubType },
        $allocateSlot: { value: $allocateSlot },
        $allocateSlots: { value: $allocateSlots },
        $allocateGetterSlot: { value: $allocateGetterSlot },
        $typeLookup: { value: $typeLookup, writable: true },
        $mroMerge: { value: $mroMerge },
        $buildMRO: { value: $buildMRO },
        sk$attrError: {
            value() {
                return "type object '" + this.prototype.tp$name + "'";
            },
            writable: true,
        },
    }
);

/**
 * @this {typeObject | Sk.builtin.type}
 */
function tp$call(args, kwargs) {
    if (this === Sk.builtin.type) {
        // check the args are 1 - only interested in the 1 argument form if
        // if the nargs and nkeywords != 1 or 3 and zero raise an error
        if (args.length === 1 && (kwargs === undefined || !kwargs.length)) {
            return args[0].ob$type;
        } else if (args.length !== 3) {
            throw new Sk.builtin.TypeError("type() takes 1 or 3 arguments");
        }
    }
    let obj = this.prototype.tp$new(args, kwargs);

    if (obj.$isSuspension) {
        return Sk.misceval.chain(
            obj,
            (o) => {
                obj = o;
                if (!obj.ob$type.$isSubType(this)) {
                    // don't initialize an obj if it's type is not a subtype of this!
                    // typically obj$obtype === self so this check is fast
                    return;
                }
                return obj.tp$init(args, kwargs);
            },
            () => obj
        );
    } else if (!obj.ob$type.$isSubType(this)) {
        return obj;
    } else {
        const res = obj.tp$init(args, kwargs);
        if (res !== undefined && res.$isSuspension) {
            return Sk.misceval.chain(res, () => obj);
        }
        return obj;
    }
}

function tp$new(args, kwargs) {
    // currently skulpt does not support metatypes...
    // metatype.prototype = this
    if (args.length !== 3) {
        if (args.length === 1 && (kwargs === undefined || !kwargs.length)) {
            return args[0].ob$type;
        }
        throw new Sk.builtin.TypeError("type() takes 1 or 3 arguments");
    }

    let $name, bases, dict;
    $name = args[0];
    bases = args[1];
    dict = args[2];
    // first check that we only have 3 args and they're of the correct type
    // argument dict must be of type dict
    if (dict.tp$name !== "dict") {
        throw new Sk.builtin.TypeError("type() argument 3 must be dict, not " + Sk.abstr.typeName(dict));
    }
    // checks if name must be string
    if (!Sk.builtin.checkString($name)) {
        throw new Sk.builtin.TypeError("type() argument 1 must be str, not " + Sk.abstr.typeName($name));
    }
    $name = $name.$jsstr();
    // argument bases must be of type tuple
    if (bases.tp$name !== "tuple") {
        throw new Sk.builtin.TypeError("type() argument 2 must be tuple, not " + Sk.abstr.typeName(bases));
    }
    bases = bases.sk$asarray();

    /**
     * @type {!typeObject}
     */
    const klass = function () {
        // klass is essentially a function that gives its instances a dict
        // if we support slots then we might need to have two versions of this
        this.$d = new Sk.builtin.dict();
    };
    setUpKlass($name, klass, bases, this.constructor);

    // set some defaults which can be overridden by the dict object
    if (Sk.globals) {
        klass.prototype.__module__ = Sk.globals["__name__"];
    }
    klass.prototype.__doc__ = Sk.builtin.none.none$;

    // set __dict__ if not already on the prototype
    /**@todo __slots__ */
    if (klass.$typeLookup(Sk.builtin.str.$dict) === undefined) {
        klass.prototype.__dict__ = new Sk.builtin.getset_descriptor(klass, subtype_dict_getset_description);
    }

    // copy properties from dict into klass.prototype
    dict.$items().forEach(([key, val]) => {
        klass.prototype[key.$mangled] = val;
    });
    // make __new__ a static method
    if (klass.prototype.hasOwnProperty("__new__")) {
        const newf = klass.prototype.__new__;
        if (newf instanceof Sk.builtin.func) {
            // __new__ is an implied staticmethod
            klass.prototype.__new__ = new Sk.builtin.staticmethod(newf);
        }
    }
    klass.$allocateSlots();

    return klass;
}

/**
 * @param {Array} args
 * @param {Array=} kwargs
 */
function tp$init(args, kwargs) {
    if (args && args.length == 1 && kwargs && kwargs.length) {
        throw new Sk.builtin.TypeError("type.__init__() takes no keyword arguments");
    } else if (args.length != 3 && args.length != 1) {
        throw new Sk.builtin.TypeError("type.__init__() takes 1 or 3 arguments");
    }
    // according to Cpython we just call the object init method here
    return Sk.builtin.object.prototype.tp$init.call(this, []);
}

function $r() {
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
}

function tp$getattr(pyName, canSuspend) {
    // first check that the pyName is indeed a string
    let res;
    const metatype = this.ob$type;
    // now check whether there is a descriptor on the metatype
    const meta_attribute = metatype.$typeLookup(pyName);

    let meta_get;
    if (meta_attribute !== undefined) {
        meta_get = meta_attribute.tp$descr_get;
        if (meta_get !== undefined && meta_attribute.tp$descr_set !== undefined) {
            // then we're a data descriptor
            res = meta_get.call(meta_attribute, this, metatype, canSuspend);
            return res;
        }
    }
    const attribute = this.$typeLookup(pyName);

    if (attribute !== undefined) {
        const local_get = attribute.tp$descr_get;
        if (local_get !== undefined) {
            // null indicates that the descriptor was on the target object itself or a buss
            res = local_get.call(attribute, null, this, canSuspend);
            return res;
        }
        return attribute;
    }
    // attribute was not found so use the meta_get if any
    if (meta_get !== undefined) {
        res = meta_get.call(meta_attribute, this, metatype, canSuspend);
        return res;
    }

    if (meta_attribute !== undefined) {
        return meta_attribute;
    }
    return;
}

function tp$setattr(pyName, value, canSuspend) {
    if (!this.sk$klass) {
        if (value !== undefined) {
            throw new Sk.builtin.TypeError("can't set attributes of built-in/extension type '" + this.prototype.tp$name + "'");
        } else {
            throw new Sk.builtin.TypeError("can't delete attributes on type object '" + this.prototype.tp$name + "'");
        }
    }
    // meta types must follow single inheritance - we could change this and do
    const descr = this.ob$type.$typeLookup(pyName);

    // if it's a data descriptor then call it
    if (descr !== undefined) {
        const f = descr.tp$descr_set;
        if (f) {
            return f.call(descr, this, value, canSuspend);
        }
    }
    // for delattr
    const jsName = pyName.$mangled;

    if (value === undefined) {
        const proto = this.prototype;
        if (!proto.hasOwnProperty(jsName)) {
            throw new Sk.builtin.AttributeError("type object '" + this.prototype.tp$name + "' has no attribute '" + pyName.$jsstr() + "'");
        } else {
            delete proto[jsName];
            // delete the slot_func
            // TODO what about slot funcs that are dual slots...
            const slot_name = Sk.dunderToSkulpt[jsName];
            if (slot_name !== undefined) {
                delete this.prototype[slot_name];
                if (!proto.sk$prototypical) {
                    this.$allocateGetterSlot(jsName);
                    // if this was a slot func and we are not prototypical
                    // allocate a getter slot in it's place
                }
            }
        }
    } else {
        this.prototype[jsName] = value;
        if (jsName in Sk.dunderToSkulpt) {
            this.$allocateSlot(jsName, value);
        }
    }
}

function fastLookup(pyName) {
    var jsName = pyName.$mangled;
    return this.prototype[jsName];
}

function slowLookup(pyName) {
    var jsName = pyName.$mangled;
    const mro = this.prototype.tp$mro;
    for (let i = 0; i < mro.length; ++i) {
        const base_proto = mro[i].prototype;
        if (base_proto.hasOwnProperty(jsName)) {
            return base_proto[jsName];
        }
    }
    return undefined;
}

function $typeLookup(pyName) {
    // all type objects override this function depending on they're prototypical inheritance
    // we use the logic here as a fall back
    if (this.prototype.sk$prototypical) {
        return fastLookup.call(this, pyName);
    }
    return slowLookup.call(this, pyName);
}

function $isSubType(other) {
    return this === other || this.prototype instanceof other || (!this.prototype.sk$prototypical && this.prototype.tp$mro.includes(other));
}

function setUpKlass($name, klass, bases, meta) {
    // this function tries to match Cpython - the best base is not always bases[0]
    // we require a best bases for checks in __new__ as well as future support for slots
    const best_base = best_base_(bases);
    const klass_proto = klass.prototype;

    Sk.abstr.setUpInheritance($name, klass, best_base, meta);

    Object.defineProperties(klass_proto, {
        sk$prototypical: { value: true, writable: true },
        tp$bases: { value: bases, writable: true },
        tp$mro: { value: null, writable: true },
        hp$type: { value: true, writable: true },
    });
    klass_proto.tp$mro = klass.$buildMRO();

    Object.defineProperties(klass, {
        $typeLookup: { value: klass_proto.sk$prototypical ? fastLookup : slowLookup, writable: true },
        sk$klass: { value: true, writable: true },
    });
}

// this function is used to determine the class constructor inheritance.
function best_base_(bases) {
    if (bases.length === 0) {
        bases.push(Sk.builtin.object);
    }
    function solid_base(type) {
        // if we support slots we would need to change this function - for now it just checks for the builtin.
        if (type.sk$klass === undefined) {
            return type;
        }
        return solid_base(type.prototype.tp$base);
    }

    let base, winner, candidate, base_i;
    for (let i = 0; i < bases.length; i++) {
        base_i = bases[i];
        if (!Sk.builtin.checkClass(base_i)) {
            throw new Sk.builtin.TypeError("bases must be 'type' objects");
        } else if (base_i.sk$acceptable_as_base_class === false) {
            throw new Sk.builtin.TypeError("type '" + base_i.prototype.tp$name + "' is not an acceptable base type");
        }
        candidate = solid_base(base_i); // basically the builtin I think
        if (winner === undefined) {
            winner = candidate;
            base = base_i;
        } else if (winner.$isSubType(candidate)) {
            // carry on
        } else if (candidate.$isSubType(winner)) {
            winner = candidate;
            base = base_i;
        } else {
            throw new Sk.builtin.TypeError("multiple bases have instance layout conflicts");
        }
    }
    return base;
}

function $mroMerge(seqs) {
    this.prototype.sk$prototypical = true; // assume true to start with
    let seq, i, j;
    const res = [];
    for (;;) {
        for (i = 0; i < seqs.length; ++i) {
            seq = seqs[i];
            if (seq.length !== 0) {
                break;
            }
        }
        if (i === seqs.length) {
            // all empty
            return res;
        }
        const cands = [];
        for (i = 0; i < seqs.length; ++i) {
            seq = seqs[i];
            //print("XXX", Sk.builtin.repr(new Sk.builtin.list(seq)).v);
            if (seq.length !== 0) {
                const cand = seq[0];
                //print("CAND", Sk.builtin.repr(cand).v);

                /* eslint-disable */
                OUTER: for (j = 0; j < seqs.length; ++j) {
                    const sseq = seqs[j];
                    for (let k = 1; k < sseq.length; ++k) {
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

        const next = cands[0];

        // check prototypical mro
        if (res.length && this.prototype.sk$prototypical) {
            let prevs_prototype = Object.getPrototypeOf(res[res.length - 1].prototype);
            if (prevs_prototype !== next.prototype) {
                this.prototype.sk$prototypical = false;
            }
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
}

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
function $buildMRO() {
    // MERGE(klass + mro(bases) + bases)
    const all = [[this]];
    const kbases = this.prototype.tp$bases;

    for (let i = 0; i < kbases.length; ++i) {
        all.push([...kbases[i].prototype.tp$mro]);
    }

    const bases = [];
    for (let i = 0; i < kbases.length; ++i) {
        bases.push(kbases[i]);
    }
    all.push(bases);

    return this.$mroMerge(all);
}

function $allocateSlots() {
    // only allocate certain slots
    const proto = this.prototype;
    if (this.prototype.sk$prototypical) {
        Object.keys(proto).forEach((dunder) => {
            if (dunder in Sk.slots) {
                this.$allocateSlot(dunder, proto[dunder]);
            }
        });
    } else {
        Object.keys(Sk.slots).forEach((dunder) => {
            if (proto.hasOwnProperty(dunder)) {
                this.$allocateSlot(dunder, proto[dunder]);
            } else {
                this.$allocateGetterSlot(dunder);
            }
        });
    }
}

function $allocateSlot(dunder, dunderFunc) {
    const slot_def = Sk.slots[dunder];
    const slot_name = slot_def.$slot_name;
    const proto = this.prototype;
    if (proto.hasOwnProperty(slot_name)) {
        delete proto[slot_name]; // required in order to override the multiple inheritance getter slots
    }
    proto[slot_name] = slot_def.$slot_func(dunderFunc);
}

function $allocateGetterSlot(dunder) {
    const slot_name = Sk.slots[dunder].$slot_name;
    const proto = this.prototype;
    if (proto.hasOwnProperty(slot_name)) {
        return; // double slots can be problematic
    }
    Object.defineProperty(proto, slot_name, {
        configurable: true,
        get() {
            const mro = proto.tp$mro;
            for (let i = 1; i < mro.length; i++) {
                const base_proto = mro[i].prototype;
                const property = Object.getOwnPropertyDescriptor(base_proto, slot_name);
                if (property !== undefined && property.value) {
                    return property.value;
                }
            }
        },
    });
}

Sk.builtin.type.prototype.tp$getsets = {
    __base__: {
        $get() {
            return this.prototype.tp$base || Sk.builtin.none.none$;
        },
    },
    __bases__: {
        $get() {
            if (this.sk$tuple_bases === undefined) {
                this.sk$tuple_bases = new Sk.builtin.tuple(this.prototype.tp$bases);
                // make sure we always return the same tuple
            }
            return this.sk$tuple_bases;
        },
    },
    __mro__: {
        $get() {
            if (this.sk$tuple_mro === undefined) {
                this.sk$tuple_mro = new Sk.builtin.tuple(this.prototype.tp$mro);
                // make sure we always return the same tuple
            }
            return this.sk$tuple_mro;
        },
    },
    __dict__: {
        $get() {
            return new Sk.builtin.mappingproxy(this.prototype);
        },
    },
    __doc__: {
        $get() {
            const doc = this.$typeLookup(Sk.builtin.str.$doc);
            if (doc) {
                if (doc.tp$descr_get !== undefined) {
                    if (this === Sk.builtin.type) {
                        return new Sk.builtin.str(this.prototype.tp$doc);
                    }
                    return doc.tp$descr_get(null, this);
                }
                return this.prototype.__doc__;
            }
            return Sk.builtin.none.none$;
        },
        $set(value) {
            check_special_type_attr(this, value, Sk.builtin.str.$doc);
            this.prototype.__doc__ = value;
        },
    },
    __name__: {
        $get() {
            return new Sk.builtin.str(this.prototype.tp$name);
        },
        $set(value) {
            check_special_type_attr(this, value, Sk.builtin.str.$name);
            if (!Sk.builtin.checkString(value)) {
                throw new Sk.builtin.TypeError(
                    "can only assign string to " + this.prototype.tp$name + ".__name__, not '" + Sk.abstr.typeName(value) + "'"
                );
            }
            this.prototype.tp$name = value.$jsstr();
        },
    },
    __module__: {
        $get() {
            let mod = this.prototype.__module__;
            if (mod && !(mod.ob$type === Sk.builtin.getset_descriptor)) {
                return mod;
            }
            return new Sk.builtin.str("builtins");
        },
        $set(value) {
            // they can set the module to whatever they like
            check_special_type_attr(this, value, Sk.builtin.str.$module);
            this.prototype.__module__ = value;
        },
    },
};

Sk.builtin.type.prototype.tp$methods = /**@lends {Sk.builtin.type.prototype}*/ {
    mro: {
        $meth() {
            return new Sk.builtin.list(this.$buildMRO());
        },
        $flags: { NoArgs: true },
    },
    __dir__: {
        $meth: function __dir__() {
            const seen = new Set();
            const dir = [];
            function push_or_continue(attr) {
                if (attr in Sk.reservedWords_) {
                    return;
                }
                attr = Sk.unfixReserved(attr);
                if (attr.indexOf("$") !== -1) {
                    return;
                }
                if (!seen.has(attr)) {
                    seen.add(attr);
                    dir.push(new Sk.builtin.str(attr));
                }
            }
            if (this.prototype.sk$prototypical) {
                for (let attr in this.prototype) {
                    push_or_continue(attr);
                }
            } else {
                const mro = this.prototype.tp$mro;
                for (let i = 0; i < mro.length; i++) {
                    const attrs = Object.getOwnPropertyNames(mro[i].prototype);
                    for (let j = 0; j < attrs.length; j++) {
                        push_or_continue(attrs[j]);
                    }
                }
            }
            return new Sk.builtin.list(dir);
        },
        $flags: { NoArgs: true },
        $doc: "Specialized __dir__ implementation for types.",
    },
};

// similar to generic.getSetDict but have to check if there is a builtin __dict__ descriptor that we should use first!
const subtype_dict_getset_description = {
    $get() {
        const dict_descr = get_dict_descr_of_builtn_base(this.ob$type);
        if (dict_descr !== undefined) {
            return dict_descr.tp$descr_get(this, this.ob$type);
        }
        return Sk.generic.getSetDict.$get.call(this);
    },
    $set(value) {
        const dict_descr = get_dict_descr_of_builtn_base(this.ob$type);
        if (dict_descr !== undefined) {
            return dict_descr.tp$descr_set(this, value);
        }
        return Sk.generic.getSetDict.$set.call(this, value);
    },
    $doc: "dictionary for instance variables (if defined)",
    $name: "__dict__",
};

function get_dict_descr_of_builtn_base(type) {
    while (type.prototype.tp$base !== null) {
        if (type.sk$klass === undefined) {
            if (type.prototype.hasOwnProperty("__dict__")) {
                const descr = type.prototype.__dict__;
                return Sk.builtin.checkDataDescr(descr) ? descr : undefined;
            }
        }
        type = type.prototype.tp$base;
    }
}

function check_special_type_attr(type, value, pyName) {
    if (type.sk$klass === undefined) {
        throw new Sk.builtin.TypeError("can't set " + type.prototype.tp$name + "." + pyName.$jsstr());
    }
    if (value === undefined) {
        throw new Sk.builtin.TypeError("can't delete " + type.prototype.tp$name + "." + pyName.$jsstr());
    }
}
