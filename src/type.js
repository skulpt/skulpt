import { remapToJs } from './ffi';
import { dict as dictType } from './types/dict';
import { str } from './types/str';
import { checkString } from './function/checks';
import { object, none, gattr } from './types/object';
import { tuple } from './types/tuple';
import { TypeError, AttributeError } from './errors';
import {
    retryOptionalSuspensionOrThrow,
    applyOrSuspend,
    chain,
    callsimOrSuspend,
    tryCatch,
    apply,
    callsim
} from './misceval';

/**
 * Maps Python dunder names to the Skulpt Javascript function names that
 * implement them.
 *
 * Note: __add__, __mul__, and __rmul__ can be used for either numeric or
 * sequence types. Here, they default to the numeric versions (i.e. nb$add,
 * nb$multiply, and nb$reflected_multiply). This works because binary_op_
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
const dunderToSkulpt = {
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
 * @param {*} name name or object to get type of, if only one arg
 *
 * @param {tuple=} bases
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
export function type(name, bases, dict) {
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
            throw new TypeError("type() argument 3 must be dict, not " + typeName(dict));
        }

        // checks if name must be string
        if(!checkString(name)) {
            throw new TypeError("type() argument 1 must be str, not " + typeName(name));
        }

        // argument bases must be of type tuple
        if(bases.tp$name !== "tuple") {
            throw new TypeError("type() argument 2 must be tuple, not " + typeName(bases));
        }

        // type building version of type

        // dict is the result of running the classes code object
        // (basically the dict of functions). those become the prototype
        // object of the class).


        var _name = remapToJs(name); // unwrap name string to js for latter use
        var inheritsBuiltin = false;

        class klass {

            /**
            * The constructor is a stub, that gets called from object.__new__
            * @constructor
            */
            constructor(args, kws) {
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
                        superConstructor.apply(undefined, args_copy);
                    }
                }

                this["$d"] = new dictType([]);
                this["$d"].mp$ass_subscript(new str("__dict__"), this["$d"]);
            }

            tp$name = _name;
            ob$type = makeIntoTypeObj(_name, klass);

            static __class__ = klass;
            static __name__ = name;

            // Invoking the class object calls __new__() to generate a new instance,
            // then __init__() to initialise it
            static tp$call(args, kws) {
                var newf = typeLookup(klass, "__new__"), newargs;
                var self;

                args = args || [];
                kws = kws || [];

                if (newf === undefined || newf === object.prototype["__new__"]) {
                    // No override -> just call the constructor
                    self = new klass(args, kws);
                    newf = undefined;
                } else {
                    newargs = args.slice();
                    newargs.unshift(klass);
                    self = applyOrSuspend(newf, undefined, undefined, kws, newargs);
                }

                return chain(self, function(s) {
                    var init = typeLookup(s.ob$type, "__init__");

                    self = s; // in case __new__ suspended

                    if (init !== undefined) {
                        args.unshift(self);
                        return applyOrSuspend(init, undefined, undefined, kws, args);
                    } else if (newf === undefined && (args.length !== 0 || kws.length !== 0) && !inheritsBuiltin) {
                        // We complain about spurious constructor arguments if neither __new__
                        // nor __init__ were overridden
                        throw new TypeError("__init__() got unexpected argument(s)");
                    }
                }, function(r) {
                    if (r !== none.none$ && r !== undefined) {
                        throw new TypeError("__init__() should return None, not " + typeName(r));
                    } else {
                        return self;
                    }
                });
            }

            $r() {
                var cname;
                var mod;
                var reprf = this.tp$getattr("__repr__");
                if (reprf !== undefined && reprf.im_func !== object.prototype["__repr__"]) {
                    return apply(reprf, undefined, undefined, undefined, []);
                }

                if ((klass.prototype.tp$base !== undefined) &&
                    (klass.prototype.tp$base !== object) &&
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
                    return new str("<" + cname + _name + " object>");
                }
            }

            sk$klass = true;

            tp$setattr(name, data, canSuspend) {
                var r, /** @type {(Object|undefined)} */ setf = object.prototype.GenericGetAttr.call(this, "__setattr__");
                if (setf !== undefined) {
                    r = callsimOrSuspend(/** @type {Object} */ (setf), new str(name), data);
                    return canSuspend ? r : retryOptionalSuspensionOrThrow(r);
                }

                return object.prototype.GenericSetAttr.call(this, name, data, canSuspend);
            }

            tp$getattr(name, canSuspend) {
                var r, descr, /** @type {(Object|undefined)} */ getf;

                // Find __getattribute__ on this type if we can
                descr = typeLookup(klass, "__getattribute__");

                if (descr !== undefined && descr !== null && descr.tp$descr_get !== undefined) {
                    getf = descr.tp$descr_get.call(descr, this, klass);
                }

                if (getf === undefined) {
                    getf = object.prototype.GenericPythonGetAttr.bind(null, this);
                }

                // Convert AttributeErrors back into 'undefined' returns to match the tp$getattr
                // convention
                r = tryCatch(function() {
                    return callsimOrSuspend(/** @type {Object} */ (getf), new str(name));
                }, function (e) {
                    if (e instanceof AttributeError) {
                        return undefined;
                    } else {
                        throw e;
                    }
                });

                return canSuspend ? r : retryOptionalSuspensionOrThrow(r);
            }

            tp$str() {
                var strf = this.tp$getattr("__str__");
                if (strf !== undefined && strf.im_func !== object.prototype["__str__"]) {
                    return apply(strf, undefined, undefined, undefined, []);
                }
                if ((klass.prototype.tp$base !== undefined) &&
                    (klass.prototype.tp$base !== object) &&
                    (klass.prototype.tp$base.prototype.tp$str !== undefined)) {
                    // If subclass of a builtin which is not object, use that class' repr
                    return klass.prototype.tp$base.prototype.tp$str.call(this);
                }
                return this.$r();
            }

            tp$length(canSuspend) {
                var r = chain(gattr(this, "__len__", canSuspend), function(lenf) {
                    return applyOrSuspend(lenf, undefined, undefined, undefined, []);
                });
                return canSuspend ? r : retryOptionalSuspensionOrThrow(r);
            }

            tp$call(args, kw) {
                return chain(this.tp$getattr("__call__", true), function(callf) {
                    if (callf === undefined) {
                        throw new TypeError("'" + typeName(this) + "' object is not callable");
                    }
                    return applyOrSuspend(callf, undefined, undefined, kw, args);
                });
            }

            tp$iter() {
                var iterf = this.tp$getattr("__iter__");
                if (iterf === undefined) {
                    throw new TypeError("'" + typeName(this) + "' object is not iterable");
                }
                return callsim(iterf);
            }

            tp$iternext(canSuspend) {
                var self = this;
                var next;

                if (Sk.python3) {
                    next = "__next__";
                } else {
                    next = "next";
                }
                var r = chain(self.tp$getattr(next, canSuspend), function(/** {Object} */ iternextf) {
                    if (iternextf === undefined) {
                        throw new TypeError("'" + typeName(self) + "' object is not iterable");
                    }

                    return tryCatch(function() {
                        return callsimOrSuspend(iternextf);
                    }, function(e) {
                        if (e instanceof Sk.builtin.StopIteration) {
                            return undefined;
                        } else {
                            throw e;
                        }
                    });
                });

                return canSuspend ? r : retryOptionalSuspensionOrThrow(r);
            }

            tp$getitem(key, canSuspend) {
                var getf = this.tp$getattr("__getitem__", canSuspend), r;
                if (getf !== undefined) {
                    r = applyOrSuspend(getf, undefined, undefined, undefined, [key]);
                    return canSuspend ? r : retryOptionalSuspensionOrThrow(r);
                }
                throw new TypeError("'" + typeName(this) + "' object does not support indexing");
            }

            tp$setitem(key, value, canSuspend) {
                var setf = this.tp$getattr("__setitem__", canSuspend), r;
                if (setf !== undefined) {
                    r = applyOrSuspend(setf, undefined, undefined, undefined, [key, value]);
                    return canSuspend ? r : retryOptionalSuspensionOrThrow(r);
                }
                throw new TypeError("'" + typeName(this) + "' object does not support item assignment");
            }

            // fix for class attributes
            static tp$setattr = tp$setattr;
        }

        if (bases.v.length === 0 && Sk.__future__.inherit_from_object) {
            // new style class, inherits from object by default
            bases.v.push(Sk.builtin.object);
            setUpInheritance(_name, klass, Sk.builtin.object);
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
            throw new TypeError("Multiple inheritance with more than one builtin type is unsupported");
        }

        // Javascript does not support multiple inheritance, so only the first
        // base (if any) will directly inherit in Javascript
        if (firstAncestor !== undefined) {
            goog.inherits(klass, firstAncestor);

            if (firstAncestor.prototype instanceof object || firstAncestor === object) {
                klass.prototype.tp$base = firstAncestor;
            }
        }


        // set __module__ if not present (required by direct type(name, bases, dict) calls)
        var module_lk = new str("__module__");
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

        if (bases) {
            //print("building mro for", name);
            //for (var i = 0; i < bases.length; ++i)
            //print("base[" + i + "]=" + bases[i].tp$name);
            klass["$d"] = new dictType([]);
            klass["$d"].mp$ass_subscript(type.basesStr_, bases);
            mro = buildMRO(klass);
            klass["$d"].mp$ass_subscript(type.mroStr_, mro);
            klass.tp$mro = mro;
            //print("mro result", Sk.builtin.repr(mro).v);
        }

        var shortcutDunder = function (skulpt_name, magic_name, magic_func, canSuspendIdx) {
            klass.prototype[skulpt_name] = function () {
                var args = Array.prototype.slice.call(arguments), canSuspend;
                args.unshift(magic_func, this);

                if (canSuspendIdx !== null) {
                    canSuspend = args[canSuspendIdx+1];
                    args.splice(canSuspendIdx+1, 1);

                    if (canSuspend) {
                        return callsimOrSuspend.apply(undefined, args);
                    }
                }
                return callsim.apply(undefined, args);
            };
        };

        // Register skulpt shortcuts to magic methods defined by this class.
        // Dynamically deflined methods (eg those returned by __getattr__())
        // cannot be used by these magic functions; this is consistent with
        // how CPython handles "new-style" classes:
        // https://docs.python.org/2/reference/datamodel.html#special-method-lookup-for-old-style-classes
        var dunder, skulpt_name, canSuspendIdx;
        for (dunder in dunderToSkulpt) {
            skulpt_name = dunderToSkulpt[dunder];
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
}

type.ob$type = type;
type.tp$name = "type";
type.$r = function () {
    if(Sk.__future__.class_repr) {
        return new str("<class 'type'>");
    } else {
        return new str("<type 'type'>");
    }
}


// basically the same as GenericGetAttr except looks in the proto instead
function tp$getattr(name, canSuspend) {
    var res;
    var tp = this;
    var descr;
    var f;

    if (this["$d"]) {
        res = this["$d"].mp$lookup(new str(name));
        if (res !== undefined) {
            return res;
        }
    }

    descr = typeLookup(tp, name);

    //print("type.tpgetattr descr", descr, descr.tp$name, descr.func_code, name);
    if (descr !== undefined && descr !== null && descr.ob$type !== undefined) {
        f = descr.tp$descr_get;
        // todo;if (f && descr.tp$descr_set) // is a data descriptor if it has a set
        // return f.call(descr, this, this.ob$type);
    }

    if (f) {
        // non-data descriptor
        return f.call(descr, none.none$, tp, canSuspend);
    }

    if (descr !== undefined) {
        return descr;
    }

    return undefined;
}

function tp$setattr(name, value) {
    // class attributes are direct properties of the object
    this[name] = value;
}

function tp$richcompare(other, op) {
    var r2;
    var r1;
    if (other.ob$type != type) {
        return undefined;
    }
    if (!this["$r"] || !other["$r"]) {
        return undefined;
    }
    r1 = new str(this["$r"]().v.slice(1,6));
    r2 = new str(other["$r"]().v.slice(1,6));
    if (this["$r"]().v.slice(1,6) !== "class") {
        r1 = this["$r"]();
        r2 = other["$r"]();
    }
    return r1.tp$richcompare(r2, op);
}

/**
 *
 */
export function makeTypeObj(name, newedInstanceOfType) {
    makeIntoTypeObj(name, newedInstanceOfType);
    return newedInstanceOfType;
}

export function makeIntoTypeObj(name, t) {
    goog.asserts.assert(name !== undefined);
    goog.asserts.assert(t !== undefined);
    t.ob$type = type;
    t.tp$name = name;
    t["$r"] = function () {
        var ctype;
        var mod = t.__module__;
        var cname = "";
        if (mod) {
            cname = mod.v + ".";
        }
        ctype = "class";
        if (!mod && !t.sk$klass && !Sk.__future__.class_repr) {
            ctype = "type";
        }
        return new str("<" + ctype + " '" + cname + t.tp$name + "'>");
    };
    t.tp$str = undefined;
    t.tp$getattr = tp$getattr;
    t.tp$setattr = object.prototype.GenericSetAttr;
    t.tp$richcompare = tp$richcompare;
    t.sk$type = true;

    return t;
}

export function typeLookup(type, name) {
    var mro = type.tp$mro;
    var pyname = new str(name);
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
}

function mroMerge_(seqs) {
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
            throw new TypeError("Inconsistent precedences in type hierarchy");
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
}

function buildMRO_(klass) {
    // MERGE(klass + mro(bases) + bases)
    var i;
    var bases;
    var all = [
        [klass]
    ];

    //Sk.debugout("buildMRO for", klass.tp$name);

    var kbases = klass["$d"].mp$subscript(type.basesStr_);
    for (i = 0; i < kbases.v.length; ++i) {
        all.push(buildMRO_(kbases.v[i]));
    }

    bases = [];
    for (i = 0; i < kbases.v.length; ++i) {
        bases.push(kbases.v[i]);
    }
    all.push(bases);

    return mroMerge_(all);
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
export function buildMRO(klass) {
    return new tuple(buildMRO_(klass));
}

/**
 * Set up inheritance between two Python classes. This allows only for single
 * inheritance -- multiple inheritance is not supported by Javascript.
 *
 * Javascript's inheritance is prototypal. This means that properties must
 * be defined on the superclass' prototype in order for subclasses to inherit
 * them.
 *
 * ```
 * Sk.superclass.myProperty                 # will NOT be inherited
 * Sk.superclass.prototype.myProperty       # will be inherited
 * ```
 *
 * In order for a class to be subclassable, it must (directly or indirectly)
 * inherit from Sk.builtin.object so that it will be properly initialized in
 * {@link Sk.doOneTimeInitialization} (in src/import.js). Further, all Python
 * builtins should inherit from Sk.builtin.object.
 *
 * @param {string} childName The Python name of the child (subclass).
 * @param {function(...[?])} child     The subclass.
 * @param {function(...[?])} parent    The superclass.
 * @return {undefined}
 */
export function setUpInheritance(childName, child, parent) {
    child.prototype.tp$base = parent;
    child.prototype.tp$name = childName;
    child.prototype.ob$type = makeIntoTypeObj(childName, child);
}

export function typeName(v) {
    return v.tp$name ? v.tp$name : "<invalid type>";
}

/**
 * Call the super constructor of the provided class, with the object `self` as
 * the `this` value of that constructor. Any arguments passed to this function
 * after `self` will be passed as-is to the constructor.
 *
 * @param  {function(...[?])} thisClass The subclass.
 * @param  {Object} self      The instance of the subclas.
 * @param  {...?} args Arguments to pass to the constructor.
 * @return {undefined}
 */
export function superConstructor(thisClass, self, args) {
    var argumentsForConstructor = Array.prototype.slice.call(arguments, 2);
    thisClass.prototype.tp$base.apply(self, argumentsForConstructor);
}
