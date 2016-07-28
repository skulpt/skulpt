/**
 * @namespace Sk.misceval
 *
 */
Sk.misceval = {};

/*
  Suspension object format:
  {resume: function() {...}, // the continuation - returns either another suspension or the return value
   data: <copied down from innermost level>,
   optional: <if true, can be resumed immediately (eg debug stops)>,
   child: <Suspension, or null if we are the innermost level>,
   $blk: <>, $loc: <>, $gbl: <>, $exc: <>, $err: <>, [$cell: <>],
  }
*/

/**
 *
 * Hi kids lets make a suspension...
 * @constructor
 * @param{function(?)=} resume A function to be called on resume. child is resumed first and its return value is passed to this function.
 * @param{Object=} child A child suspension. 'optional' will be copied from here if supplied.
 * @param{Object=} data Data attached to this suspension. Will be copied from child if not supplied.
 */
Sk.misceval.Suspension = function Suspension(resume, child, data) {
    this.$isSuspension = true;
    if (resume !== undefined && child !== undefined) {
        this.resume = function() { return resume(child.resume()); };
    }
    this.child = child;
    this.optional = child !== undefined && child.optional;
    if (data === undefined && child !== undefined) {
        this.data = child.data;
    } else {
        this.data = data;
    }
};
goog.exportSymbol("Sk.misceval.Suspension", Sk.misceval.Suspension);

/**
 *
 * Well this seems pretty obvious by the name what it should do..
 *
 * @param{Sk.misceval.Suspension} susp
 * @param{string=} message
 */
Sk.misceval.retryOptionalSuspensionOrThrow = function (susp, message) {
    while (susp instanceof Sk.misceval.Suspension) {
        if (!susp.optional) {
            throw new Sk.builtin.SuspensionError(message || "Cannot call a function that blocks or suspends here");
        }
        susp = susp.resume();
    }
    return susp;
};
goog.exportSymbol("Sk.misceval.retryOptionalSuspensionOrThrow", Sk.misceval.retryOptionalSuspensionOrThrow);

/**
 * Check if the given object is valid to use as an index. Only ints, or if the object has an `__index__` method.
 * @param o
 * @returns {boolean}
 */
Sk.misceval.isIndex = function (o) {
    if (Sk.builtin.checkInt(o)) {
        return true;
    }
    if (Sk.abstr.lookupSpecial(o, "__index__")) {
        return true;
    }
    return false;
};
goog.exportSymbol("Sk.misceval.isIndex", Sk.misceval.isIndex);

Sk.misceval.asIndex = function (o) {
    var idxfn, ret;

    if (!Sk.misceval.isIndex(o)) {
        return undefined;
    }
    if (o === null) {
        return undefined;
    }
    if (o === true) {
        return 1;
    }
    if (o === false) {
        return 0;
    }
    if (typeof o === "number") {
        return o;
    }
    if (o.constructor === Sk.builtin.int_) {
        return o.v;
    }
    if (o.constructor === Sk.builtin.lng) {
        return o.tp$index();
    }
    if (o.constructor === Sk.builtin.bool) {
        return Sk.builtin.asnum$(o);
    }
    idxfn = Sk.abstr.lookupSpecial(o, "__index__");
    if (idxfn) {
        ret = Sk.misceval.callsim(idxfn, o);
        if (!Sk.builtin.checkInt(ret)) {
            throw new Sk.builtin.TypeError("__index__ returned non-(int,long) (type " +
                                           Sk.abstr.typeName(ret) + ")");
        }
        return Sk.builtin.asnum$(ret);
    }
    goog.asserts.fail("todo asIndex;");
};

/**
 * return u[v:w]
 */
Sk.misceval.applySlice = function (u, v, w, canSuspend) {
    var ihigh;
    var ilow;
    if (u.sq$slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w)) {
        ilow = Sk.misceval.asIndex(v);
        if (ilow === undefined) {
            ilow = 0;
        }
        ihigh = Sk.misceval.asIndex(w);
        if (ihigh === undefined) {
            ihigh = 1e100;
        }
        return Sk.abstr.sequenceGetSlice(u, ilow, ihigh);
    }
    return Sk.abstr.objectGetItem(u, new Sk.builtin.slice(v, w, null), canSuspend);
};
goog.exportSymbol("Sk.misceval.applySlice", Sk.misceval.applySlice);

/**
 * u[v:w] = x
 */
Sk.misceval.assignSlice = function (u, v, w, x, canSuspend) {
    var slice;
    var ihigh;
    var ilow;
    if (u.sq$ass_slice && Sk.misceval.isIndex(v) && Sk.misceval.isIndex(w)) {
        ilow = Sk.misceval.asIndex(v) || 0;
        ihigh = Sk.misceval.asIndex(w) || 1e100;
        if (x === null) {
            Sk.abstr.sequenceDelSlice(u, ilow, ihigh);
        } else {
            Sk.abstr.sequenceSetSlice(u, ilow, ihigh, x);
        }
    } else {
        slice = new Sk.builtin.slice(v, w);
        if (x === null) {
            return Sk.abstr.objectDelItem(u, slice);
        } else {
            return Sk.abstr.objectSetItem(u, slice, x, canSuspend);
        }
    }
};
goog.exportSymbol("Sk.misceval.assignSlice", Sk.misceval.assignSlice);

/**
 * Used by min() and max() to get an array from arbitrary input.
 * Note that this does no validation, just coercion.
 */
Sk.misceval.arrayFromArguments = function (args) {
    // If args is not a single thing return as is
    var it, i;
    var res;
    var arg;
    if (args.length != 1) {
        return args;
    }
    arg = args[0];
    if (arg instanceof Sk.builtin.set) {
        // this is a Sk.builtin.set
        arg = arg.tp$iter().$obj;
    } else if (arg instanceof Sk.builtin.dict) {
        // this is a Sk.builtin.list
        arg = Sk.builtin.dict.prototype["keys"].func_code(arg);
    }

    // shouldn't else if here as the above may output lists to arg.
    if (arg instanceof Sk.builtin.list || arg instanceof Sk.builtin.tuple) {
        return arg.v;
    } else if (Sk.builtin.checkIterable(arg)) {
        // handle arbitrary iterable (strings, generators, etc.)
        res = [];
        for (it = Sk.abstr.iter(arg), i = it.tp$iternext();
             i !== undefined; i = it.tp$iternext()) {
            res.push(i);
        }
        return res;
    }

    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(arg) + "' object is not iterable");
};
goog.exportSymbol("Sk.misceval.arrayFromArguments", Sk.misceval.arrayFromArguments);

/**
 * for reversed comparison: Gt -> Lt, etc.
 */
Sk.misceval.swappedOp_ = {
    "Eq"   : "Eq",
    "NotEq": "NotEq",
    "Lt"   : "GtE",
    "LtE"  : "Gt",
    "Gt"   : "LtE",
    "GtE"  : "Lt",
    "Is"   : "IsNot",
    "IsNot": "Is",
    "In_"  : "NotIn",
    "NotIn": "In_"
};

/**
* @param{*} v
* @param{*} w
* @param{string} op
* @param{boolean=} canSuspend
 */
Sk.misceval.richCompareBool = function (v, w, op, canSuspend) {
    // v and w must be Python objects. will return Javascript true or false for internal use only
    // if you want to return a value from richCompareBool to Python you must wrap as Sk.builtin.bool first
    var wname,
        vname,
        ret,
        swapped_method,
        method,
        swapped_shortcut,
        shortcut,
        v_has_shortcut,
        w_has_shortcut,
        op2method,
        op2shortcut,
        vcmp,
        wcmp,
        w_seq_type,
        w_num_type,
        v_seq_type,
        v_num_type,
        sequence_types,
        numeric_types,
        w_type,
        v_type;

    goog.asserts.assert((v !== null) && (v !== undefined), "passed null or undefined parameter to Sk.misceval.richCompareBool");
    goog.asserts.assert((w !== null) && (w !== undefined), "passed null or undefined parameter to Sk.misceval.richCompareBool");

    v_type = new Sk.builtin.type(v);
    w_type = new Sk.builtin.type(w);

    // Python has specific rules when comparing two different builtin types
    // currently, this code will execute even if the objects are not builtin types
    // but will fall through and not return anything in this section
    if ((v_type !== w_type) &&
        (op === "GtE" || op === "Gt" || op === "LtE" || op === "Lt")) {
        // note: sets are omitted here because they can only be compared to other sets
        numeric_types = [Sk.builtin.float_.prototype.ob$type,
            Sk.builtin.int_.prototype.ob$type,
            Sk.builtin.lng.prototype.ob$type,
            Sk.builtin.bool.prototype.ob$type];
        sequence_types = [Sk.builtin.dict.prototype.ob$type,
            Sk.builtin.enumerate.prototype.ob$type,
            Sk.builtin.list.prototype.ob$type,
            Sk.builtin.str.prototype.ob$type,
            Sk.builtin.tuple.prototype.ob$type];

        v_num_type = numeric_types.indexOf(v_type);
        v_seq_type = sequence_types.indexOf(v_type);
        w_num_type = numeric_types.indexOf(w_type);
        w_seq_type = sequence_types.indexOf(w_type);

        // NoneTypes are considered less than any other type in Python
        // note: this only handles comparing NoneType with any non-NoneType.
        // Comparing NoneType with NoneType is handled further down.
        if (v_type === Sk.builtin.none.prototype.ob$type) {
            switch (op) {
                case "Lt":
                    return true;
                case "LtE":
                    return true;
                case "Gt":
                    return false;
                case "GtE":
                    return false;
            }
        }

        if (w_type === Sk.builtin.none.prototype.ob$type) {
            switch (op) {
                case "Lt":
                    return false;
                case "LtE":
                    return false;
                case "Gt":
                    return true;
                case "GtE":
                    return true;
            }
        }

        // numeric types are always considered smaller than sequence types in Python
        if (v_num_type !== -1 && w_seq_type !== -1) {
            switch (op) {
                case "Lt":
                    return true;
                case "LtE":
                    return true;
                case "Gt":
                    return false;
                case "GtE":
                    return false;
            }
        }

        if (v_seq_type !== -1 && w_num_type !== -1) {
            switch (op) {
                case "Lt":
                    return false;
                case "LtE":
                    return false;
                case "Gt":
                    return true;
                case "GtE":
                    return true;
            }
        }

        // in Python, different sequence types are ordered alphabetically
        // by name so that dict < list < str < tuple
        if (v_seq_type !== -1 && w_seq_type !== -1) {
            switch (op) {
                case "Lt":
                    return v_seq_type < w_seq_type;
                case "LtE":
                    return v_seq_type <= w_seq_type;
                case "Gt":
                    return v_seq_type > w_seq_type;
                case "GtE":
                    return v_seq_type >= w_seq_type;
            }
        }
    }


    // handle identity and membership comparisons
    if (op === "Is") {
        if (v instanceof Sk.builtin.int_ && w instanceof Sk.builtin.int_) {
            return v.numberCompare(w) === 0;
        } else if (v instanceof Sk.builtin.float_ && w instanceof Sk.builtin.float_) {
            return v.numberCompare(w) === 0;
        } else if (v instanceof Sk.builtin.lng && w instanceof Sk.builtin.lng) {
            return v.longCompare(w) === 0;
        }

        return v === w;
    }

    if (op === "IsNot") {
        if (v instanceof Sk.builtin.int_ && w instanceof Sk.builtin.int_) {
            return v.numberCompare(w) !== 0;
        } else if (v instanceof Sk.builtin.float_ && w instanceof Sk.builtin.float_) {
            return v.numberCompare(w) !== 0;
        }else if (v instanceof Sk.builtin.lng && w instanceof Sk.builtin.lng) {
            return v.longCompare(w) !== 0;
        }

        return v !== w;
    }

    if (op === "In") {
        return Sk.misceval.chain(Sk.abstr.sequenceContains(w, v, canSuspend), Sk.misceval.isTrue);
    }
    if (op === "NotIn") {
        return Sk.misceval.chain(Sk.abstr.sequenceContains(w, v, canSuspend),
                                 function(x) { return !Sk.misceval.isTrue(x); });
    }

    // Call Javascript shortcut method if exists for either object

    op2shortcut = {
        "Eq"   : "ob$eq",
        "NotEq": "ob$ne",
        "Gt"   : "ob$gt",
        "GtE"  : "ob$ge",
        "Lt"   : "ob$lt",
        "LtE"  : "ob$le"
    };

    shortcut = op2shortcut[op];
    v_has_shortcut = v.constructor.prototype.hasOwnProperty(shortcut);
    if (v_has_shortcut) {
        if ((ret = v[shortcut](w)) !== Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    swapped_shortcut = op2shortcut[Sk.misceval.swappedOp_[op]];
    w_has_shortcut = w.constructor.prototype.hasOwnProperty(swapped_shortcut);
    if (w_has_shortcut) {

        if ((ret = w[swapped_shortcut](v)) !== Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    // use comparison methods if they are given for either object
    if (v.tp$richcompare && (ret = v.tp$richcompare(w, op)) !== undefined) {
        if (ret != Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    if (w.tp$richcompare && (ret = w.tp$richcompare(v, Sk.misceval.swappedOp_[op])) !== undefined) {
        if (ret != Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }


    // depending on the op, try left:op:right, and if not, then
    // right:reversed-top:left

    op2method = {
        "Eq"   : "__eq__",
        "NotEq": "__ne__",
        "Gt"   : "__gt__",
        "GtE"  : "__ge__",
        "Lt"   : "__lt__",
        "LtE"  : "__le__"
    };

    method = Sk.abstr.lookupSpecial(v, op2method[op]);
    if (method && !v_has_shortcut) {
        ret = Sk.misceval.callsim(method, v, w);
        if (ret != Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    swapped_method = Sk.abstr.lookupSpecial(w, op2method[Sk.misceval.swappedOp_[op]]);
    if (swapped_method && !w_has_shortcut) {
        ret = Sk.misceval.callsim(swapped_method, w, v);
        if (ret != Sk.builtin.NotImplemented.NotImplemented$) {
            return Sk.misceval.isTrue(ret);
        }
    }

    vcmp = Sk.abstr.lookupSpecial(v, "__cmp__");
    if (vcmp) {
        try {
            ret = Sk.misceval.callsim(vcmp, v, w);
            if (Sk.builtin.checkNumber(ret)) {
                ret = Sk.builtin.asnum$(ret);
                if (op === "Eq") {
                    return ret === 0;
                } else if (op === "NotEq") {
                    return ret !== 0;
                } else if (op === "Lt") {
                    return ret < 0;
                } else if (op === "Gt") {
                    return ret > 0;
                } else if (op === "LtE") {
                    return ret <= 0;
                } else if (op === "GtE") {
                    return ret >= 0;
                }
            }

            if (ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                throw new Sk.builtin.TypeError("comparison did not return an int");
            }
        } catch (e) {
            throw new Sk.builtin.TypeError("comparison did not return an int");
        }
    }

    wcmp = Sk.abstr.lookupSpecial(w, "__cmp__");
    if (wcmp) {
        // note, flipped on return value and call
        try {
            ret = Sk.misceval.callsim(wcmp, w, v);
            if (Sk.builtin.checkNumber(ret)) {
                ret = Sk.builtin.asnum$(ret);
                if (op === "Eq") {
                    return ret === 0;
                } else if (op === "NotEq") {
                    return ret !== 0;
                } else if (op === "Lt") {
                    return ret > 0;
                } else if (op === "Gt") {
                    return ret < 0;
                } else if (op === "LtE") {
                    return ret >= 0;
                } else if (op === "GtE") {
                    return ret <= 0;
                }
            }

            if (ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                throw new Sk.builtin.TypeError("comparison did not return an int");
            }
        } catch (e) {
            throw new Sk.builtin.TypeError("comparison did not return an int");
        }
    }

    // handle special cases for comparing None with None or Bool with Bool
    if (((v instanceof Sk.builtin.none) && (w instanceof Sk.builtin.none)) ||
        ((v instanceof Sk.builtin.bool) && (w instanceof Sk.builtin.bool))) {
        // Javascript happens to return the same values when comparing null
        // with null or true/false with true/false as Python does when
        // comparing None with None or True/False with True/False

        if (op === "Eq") {
            return v.v === w.v;
        }
        if (op === "NotEq") {
            return v.v !== w.v;
        }
        if (op === "Gt") {
            return v.v > w.v;
        }
        if (op === "GtE") {
            return v.v >= w.v;
        }
        if (op === "Lt") {
            return v.v < w.v;
        }
        if (op === "LtE") {
            return v.v <= w.v;
        }
    }


    // handle equality comparisons for any remaining objects
    if (op === "Eq") {
        if ((v instanceof Sk.builtin.str) && (w instanceof Sk.builtin.str)) {
            return v.v === w.v;
        }
        return v === w;
    }
    if (op === "NotEq") {
        if ((v instanceof Sk.builtin.str) && (w instanceof Sk.builtin.str)) {
            return v.v !== w.v;
        }
        return v !== w;
    }

    vname = Sk.abstr.typeName(v);
    wname = Sk.abstr.typeName(w);
    throw new Sk.builtin.ValueError("don't know how to compare '" + vname + "' and '" + wname + "'");
};
goog.exportSymbol("Sk.misceval.richCompareBool", Sk.misceval.richCompareBool);

Sk.misceval.objectRepr = function (v) {
    goog.asserts.assert(v !== undefined, "trying to repr undefined");
    if ((v === null) || (v instanceof Sk.builtin.none)) {
        return new Sk.builtin.str("None");
    } else if (v === true) {
        // todo; these should be consts
        return new Sk.builtin.str("True");
    } else if (v === false) {
        return new Sk.builtin.str("False");
    } else if (typeof v === "number") {
        return new Sk.builtin.str("" + v);
    } else if (!v["$r"]) {
        if (v.tp$name) {
            return new Sk.builtin.str("<" + v.tp$name + " object>");
        } else {
            return new Sk.builtin.str("<unknown>");
        }
    } else if (v.constructor === Sk.builtin.float_) {
        if (v.v === Infinity) {
            return new Sk.builtin.str("inf");
        } else if (v.v === -Infinity) {
            return new Sk.builtin.str("-inf");
        } else {
            return v["$r"]();
        }
    } else if (v.constructor === Sk.builtin.int_) {
        return v["$r"]();
    } else {
        return v["$r"]();
    }
};
goog.exportSymbol("Sk.misceval.objectRepr", Sk.misceval.objectRepr);

Sk.misceval.opAllowsEquality = function (op) {
    switch (op) {
        case "LtE":
        case "Eq":
        case "GtE":
            return true;
    }
    return false;
};
goog.exportSymbol("Sk.misceval.opAllowsEquality", Sk.misceval.opAllowsEquality);

Sk.misceval.isTrue = function (x) {
    var ret;
    if (x === true) {
        return true;
    }
    if (x === false) {
        return false;
    }
    if (x === null) {
        return false;
    }
    if (x.constructor === Sk.builtin.none) {
        return false;
    }

    if (x.constructor === Sk.builtin.NotImplemented) {
        return false;
    }

    if (x.constructor === Sk.builtin.bool) {
        return x.v;
    }
    if (typeof x === "number") {
        return x !== 0;
    }
    if (x instanceof Sk.builtin.lng) {
        return x.nb$nonzero();
    }
    if (x.constructor === Sk.builtin.int_) {
        return x.v !== 0;
    }
    if (x.constructor === Sk.builtin.float_) {
        return x.v !== 0;
    }
    if (x["__nonzero__"]) {
        ret = Sk.misceval.callsim(x["__nonzero__"], x);
        if (!Sk.builtin.checkInt(ret)) {
            throw new Sk.builtin.TypeError("__nonzero__ should return an int");
        }
        return Sk.builtin.asnum$(ret) !== 0;
    }
    if (x["__len__"]) {
        ret = Sk.misceval.callsim(x["__len__"], x);
        if (!Sk.builtin.checkInt(ret)) {
            throw new Sk.builtin.TypeError("__len__ should return an int");
        }
        return Sk.builtin.asnum$(ret) !== 0;
    }
    if (x.mp$length) {
        return Sk.builtin.asnum$(x.mp$length()) !== 0;
    }
    if (x.sq$length) {
        return Sk.builtin.asnum$(x.sq$length()) !== 0;
    }
    return true;
};
goog.exportSymbol("Sk.misceval.isTrue", Sk.misceval.isTrue);

Sk.misceval.softspace_ = false;
Sk.misceval.print_ = function (x) {
    // this was function print(x)   not sure why...
    var isspace;
    var s;
    if (Sk.misceval.softspace_) {
        if (x !== "\n") {
            Sk.output(" ");
        }
        Sk.misceval.softspace_ = false;
    }
    s = new Sk.builtin.str(x);
    var sys = Sk.importModule("sys");
    Sk.misceval.apply(sys["$d"]["stdout"]["write"], undefined, undefined, undefined, [sys["$d"]["stdout"], s]);
    isspace = function (c) {
        return c === "\n" || c === "\t" || c === "\r";
    };
    if (s.v.length === 0 || !isspace(s.v[s.v.length - 1]) || s.v[s.v.length - 1] === " ") {
        Sk.misceval.softspace_ = true;
    }
};
goog.exportSymbol("Sk.misceval.print_", Sk.misceval.print_);

/**
 * @param {string} name
 * @param {Object=} other generally globals
 */
Sk.misceval.loadname = function (name, other) {
    var bi;
    var v = other[name];
    if (v !== undefined) {
        return v;
    }

    bi = Sk.builtins[name];
    if (bi !== undefined) {
        return bi;
    }

    name = name.replace("_$rw$", "");
    name = name.replace("_$rn$", "");
    throw new Sk.builtin.NameError("name '" + name + "' is not defined");
};
goog.exportSymbol("Sk.misceval.loadname", Sk.misceval.loadname);

/**
 *
 * Notes on necessity for 'call()':
 *
 * Classes are callable in python to create an instance of the class. If
 * we're calling "C()" we cannot tell at the call site whether we're
 * calling a standard function, or instantiating a class.
 *
 * JS does not support user-level callables. So, we can't use the normal
 * prototype hierarchy to make the class inherit from a 'class' type
 * where the various tp$getattr, etc. methods would live.
 *
 * Instead, we must copy all the methods from the prototype of our class
 * type onto every instance of the class constructor function object.
 * That way, both "C()" and "C.tp$getattr(...)" can still work. This is
 * of course quite expensive.
 *
 * The alternative would be to indirect all calls (whether classes or
 * regular functions) through something like C.$call(...). In the case
 * of class construction, $call could then call the constructor after
 * munging arguments to pass them on. This would impose a penalty on
 * regular function calls unfortunately, as they would have to do the
 * same thing.
 *
 * Note that the same problem exists for function objects too (a "def"
 * creates a function object that also has properties). It just happens
 * that attributes on classes in python are much more useful and common
 * that the attributes on functions.
 *
 * Also note, that for full python compatibility we have to do the $call
 * method because any python object could have a __call__ method which
 * makes the python object callable too. So, unless we were to make
 * *all* objects simply (function(){...}) and use the dict to create
 * hierarchy, there would be no way to call that python user function. I
 * think I'm prepared to sacrifice __call__ support, or only support it
 * post-ECMA5 or something.
 *
 * Is using (function(){...}) as the only object type too crazy?
 * Probably. Better or worse than having two levels of function
 * invocation for every function call?
 *
 * For a class `C' with instance `inst' we have the following cases:
 *
 * 1. C.attr
 *
 * 2. C.staticmeth()
 *
 * 3. x = C.staticmeth; x()
 *
 * 4. inst = C()
 *
 * 5. inst.attr
 *
 * 6. inst.meth()
 *
 * 7. x = inst.meth; x()
 *
 * 8. inst(), where C defines a __call__
 *
 * Because in general these are accomplished by a helper function
 * (tp$getattr/setattr/slice/ass_slice/etc.) it seems appropriate to add
 * a call that generally just calls through, but sometimes handles the
 * unusual cases. Once ECMA-5 is more broadly supported we can revisit
 * and hopefully optimize.
 *
 * @param {Object} func the thing to call
 * @param {Object=} kwdict **kwargs
 * @param {Object=} varargseq **args
 * @param {Object=} kws keyword args or undef
 * @param {...*} args stuff to pass it
 *
 *
 * TODO I think all the above is out of date.
 */
Sk.misceval.call = function (func, kwdict, varargseq, kws, args) {
    args = Array.prototype.slice.call(arguments, 4);
    // todo; possibly inline apply to avoid extra stack frame creation
    return Sk.misceval.apply(func, kwdict, varargseq, kws, args);
};
goog.exportSymbol("Sk.misceval.call", Sk.misceval.call);

/**
 * @param {?Object} suspensionHandlers
 * @param {Object} func the thing to call
 * @param {Object=} kwdict **kwargs
 * @param {Object=} varargseq **args
 * @param {Object=} kws keyword args or undef
 * @param {...*} args stuff to pass it
 *
 *
 * TODO I think all the above is out of date.
 */

Sk.misceval.callAsync = function (suspensionHandlers, func, kwdict, varargseq, kws, args) {
    args = Array.prototype.slice.call(arguments, 5);
    // todo; possibly inline apply to avoid extra stack frame creation
    return Sk.misceval.applyAsync(suspensionHandlers, func, kwdict, varargseq, kws, args);
};
goog.exportSymbol("Sk.misceval.callAsync", Sk.misceval.callAsync);


Sk.misceval.callOrSuspend = function (func, kwdict, varargseq, kws, args) {
    args = Array.prototype.slice.call(arguments, 4);
    // todo; possibly inline apply to avoid extra stack frame creation
    return Sk.misceval.applyOrSuspend(func, kwdict, varargseq, kws, args);
};
goog.exportSymbol("Sk.misceval.callOrSuspend", Sk.misceval.callOrSuspend);

/**
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
Sk.misceval.callsim = function (func, args) {
    args = Array.prototype.slice.call(arguments, 1);
    return Sk.misceval.apply(func, undefined, undefined, undefined, args);
};
goog.exportSymbol("Sk.misceval.callsim", Sk.misceval.callsim);

/**
 * @param {?Object} suspensionHandlers any custom suspension handlers
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
Sk.misceval.callsimAsync = function (suspensionHandlers, func, args) {
    args = Array.prototype.slice.call(arguments, 2);
    return Sk.misceval.applyAsync(suspensionHandlers, func, undefined, undefined, undefined, args);
};
goog.exportSymbol("Sk.misceval.callsimAsync", Sk.misceval.callsimAsync);


/**
 * @param {Object} func the thing to call
 * @param {...*} args stuff to pass it
 */
Sk.misceval.callsimOrSuspend = function (func, args) {
    args = Array.prototype.slice.call(arguments, 1);
    return Sk.misceval.applyOrSuspend(func, undefined, undefined, undefined, args);
};
goog.exportSymbol("Sk.misceval.callsimOrSuspend", Sk.misceval.callsimOrSuspend);

/**
 * Wrap Sk.misceval.applyOrSuspend, but throw an error if we suspend
 */
Sk.misceval.apply = function (func, kwdict, varargseq, kws, args) {
    var r = Sk.misceval.applyOrSuspend(func, kwdict, varargseq, kws, args);
    if (r instanceof Sk.misceval.Suspension) {
        return Sk.misceval.retryOptionalSuspensionOrThrow(r);
    } else {
        return r;
    }
};
goog.exportSymbol("Sk.misceval.apply", Sk.misceval.apply);

/**
 * Wraps anything that can return an Sk.misceval.Suspension, and returns a
 * JS Promise with the result. Also takes an object map of suspension handlers:
 * pass in {"suspType": function (susp) {} }, and your function will be called
 * with the Suspension object if susp.type=="suspType". The type "*" will match
 * all otherwise unhandled suspensions.
 *
 * A suspension handler should return a Promise yielding the return value of
 * r.resume() - ie, either the final return value of this call or another
 * Suspension. That is, the null suspension handler is:
 *
 *     function handler(susp) {
 *       return new Promise(function(resolve, reject) {
 *         try {
 *           resolve(susp.resume());
 *         } catch(e) {
 *           reject(e);
 *         }
 *       });
 *     }
 *
 * Alternatively, a handler can return null to perform the default action for
 * that suspension type.
 *
 * (Note: do *not* call asyncToPromise() in a suspension handler; this will
 * create a new Promise object for each such suspension that occurs)
 *
 * asyncToPromise() returns a Promise that will be resolved with the final
 * return value, or rejected with an exception if one is thrown.
 *
 * @param{function()} suspendablefn returns either a result or a Suspension
 * @param{Object=} suspHandlers an object map of suspension handlers
 */
Sk.misceval.asyncToPromise = function(suspendablefn, suspHandlers) {
    return new Promise(function(resolve, reject) {
        try {
            var r = suspendablefn();

            (function handleResponse (r) {
                try {
                    // jsh*nt insists these be defined outside the loop
                    var resume = function() {
                        handleResponse(r.resume());
                    };
                    var resumeWithData = function resolved(x) {
                        try {
                            r.data["result"] = x;
                            resume();
                        } catch(e) {
                            reject(e);
                        }
                    };
                    var resumeWithError = function rejected(e) {
                        try {
                            r.data["error"] = e;
                            resume();
                        } catch(ex) {
                            reject(ex);
                        }
                    };


                    while (r instanceof Sk.misceval.Suspension) {

                        var handler = suspHandlers && (suspHandlers[r.data["type"]] || suspHandlers["*"]);

                        if (handler) {
                            var handlerPromise = handler(r);
                            if (handlerPromise) {
                                handlerPromise.then(handleResponse, reject);
                                return;
                            }
                        }

                        if (r.data["type"] == "Sk.promise") {
                            r.data["promise"].then(resumeWithData, resumeWithError);
                            return;

                        } else if (r.data["type"] == "Sk.yield") {
                            // Assumes all yields are optional, as Sk.setTimeout might
                            // not be able to yield.
                            Sk.setTimeout(resume, 0);
                            return;

                        } else if (r.optional) {
                            // Unhandled optional suspensions just get
                            // resumed immediately, and we go around the loop again.
                            r = r.resume();

                        } else {
                            // Unhandled, non-optional suspension.
                            throw new Sk.builtin.SuspensionError("Unhandled non-optional suspension of type '"+r.data["type"]+"'");
                        }
                    }

                    resolve(r);
                } catch(e) {
                    reject(e);
                }
            })(r);

        } catch (e) {
            reject(e);
        }
    });
};
goog.exportSymbol("Sk.misceval.asyncToPromise", Sk.misceval.asyncToPromise);

Sk.misceval.applyAsync = function (suspHandlers, func, kwdict, varargseq, kws, args) {
    return Sk.misceval.asyncToPromise(function() {
        return Sk.misceval.applyOrSuspend(func, kwdict, varargseq, kws, args);
    }, suspHandlers);
};
goog.exportSymbol("Sk.misceval.applyAsync", Sk.misceval.applyAsync);

/**
 * Chain together a set of functions, each of which might return a value or
 * an Sk.misceval.Suspension. Each function is called with the return value of
 * the preceding function, but does not see any suspensions. If a function suspends,
 * Sk.misceval.chain() returns a suspension that will resume the chain once an actual
 * return value is available.
 *
 * The idea is to allow a Promise-like chaining of possibly-suspending steps without
 * repeating boilerplate suspend-and-resume code.
 *
 * For example, imagine we call Sk.misceval.chain(x, f).
 *  - If x is a value, we return f(x).
 *  - If x is a suspension, we suspend. We will suspend and resume until we get a
 *    return value, and then we will return f(<resumed-value).
 * This can be expanded to an arbitrary number of functions
 * (eg Sk.misceval.chain(x, f, g), which is equivalent to chain(chain(x, f), g).)
 *
 * @param {*}              initialValue
 * @param {...function(*)} chainedFns
 */

Sk.misceval.chain = function (initialValue, chainedFns) {
    // We try to minimse overhead when nothing suspends (the common case)
    var i = 1, value = initialValue, j, fs;

    while (true) {
        if (i == arguments.length) {
            return value;
        }
        if (value && value.$isSuspension) { break; } // oops, slow case
        value = arguments[i](value);
        i++;
    }

    // Okay, we've suspended at least once, so we're taking the slow(er) path.

    // Copy our remaining arguments into an array (inline, because passing
    // "arguments" out of a function kills the V8 optimiser).
    // (discussion: https://github.com/skulpt/skulpt/pull/552)
    fs = new Array(arguments.length - i);

    for (j = 0; j < arguments.length - i; j++) {
        fs[j] = arguments[i+j];
    }

    j = 0;

    return (function nextStep(r) {
        while (j < fs.length) {
            if (r instanceof Sk.misceval.Suspension) {
                return new Sk.misceval.Suspension(nextStep, r);
            }

            r = fs[j](r);
            j++;
        }

        return r;
    })(value);
};
goog.exportSymbol("Sk.misceval.chain", Sk.misceval.chain);


/**
 * Catch any exceptions thrown by a function, or by resuming any suspension it
 * returns.
 *
 *     var result = Sk.misceval.tryCatch(asyncFunc, function(err) {
 *       console.log(err);
 *     });
 *
 * Because exceptions are returned asynchronously aswell you can't catch them
 * with a try/catch. That's what this function is for.
 */
Sk.misceval.tryCatch = function (tryFn, catchFn) {
    var r;

    try {
        r = tryFn();
    } catch(e) {
        return catchFn(e);
    }

    if (r instanceof Sk.misceval.Suspension) {
        var susp = new Sk.misceval.Suspension(undefined, r);
        susp.resume = function() { return Sk.misceval.tryCatch(r.resume, catchFn); };
        return susp;
    } else {
        return r;
    }
};
goog.exportSymbol("Sk.misceval.tryCatch", Sk.misceval.tryCatch);

/**
 * Perform a suspension-aware for-each on an iterator, without
 * blowing up the stack.
 * forFn() is called for each element in the iterator, with two
 * arguments: the current element and the previous return value
 * of forFn() (or initialValue on the first call). In this way,
 * iterFor() can be used as a simple for loop, or alternatively
 * as a 'reduce' operation. The return value of the final call to
 * forFn() will be the return value of iterFor() (after all
 * suspensions are resumed, that is; if the iterator is empty then
 * initialValue will be returned.)
 *
 * The iteration can be terminated early, by returning
 * an instance of Sk.misceval.Break. If an argument is given to
 * the Sk.misceval.Break() constructor, that value will be
 * returned from iterFor(). It is therefore possible to use
 * iterFor() on infinite iterators.
 *
 * @param {*} iter
 * @param {function(*,*=)} forFn
 * @param {*=} initialValue
 */
Sk.misceval.iterFor = function (iter, forFn, initialValue) {
    var prevValue = initialValue;

    var breakOrIterNext = function(r) {
        prevValue = r;
        return (r instanceof Sk.misceval.Break) ? r : iter.tp$iternext(true);
    };

    return (function nextStep(i) {
        while (i !== undefined) {
            if (i instanceof Sk.misceval.Suspension) {
                return new Sk.misceval.Suspension(nextStep, i);
            }

            if (i === Sk.misceval.Break || i instanceof Sk.misceval.Break) {
                return i.brValue;
            }

            i = Sk.misceval.chain(
                forFn(i, prevValue),
                breakOrIterNext
            );
        }
        return prevValue;
    })(iter.tp$iternext(true));
};
goog.exportSymbol("Sk.misceval.iterFor", Sk.misceval.iterFor);

/**
 * A special value to return from an iterFor() function,
 * to abort the iteration. Optionally supply a value for iterFor() to return
 * (defaults to 'undefined')
 *
 * @constructor
 * @param {*=}  brValue
 */
Sk.misceval.Break = function(brValue) {
    if (!(this instanceof Sk.misceval.Break)) {
        return new Sk.misceval.Break(brValue);
    }

    this.brValue = brValue;
};
goog.exportSymbol("Sk.misceval.Break", Sk.misceval.Break);

/**
 * same as Sk.misceval.call except args is an actual array, rather than
 * varargs.
 */
Sk.misceval.applyOrSuspend = function (func, kwdict, varargseq, kws, args) {
    var fcall;
    var kwix;
    var numPosParams;
    var numNonOptParams;
    var it, i;

    if (func === null || func instanceof Sk.builtin.none) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(func) + "' object is not callable");
    } else if (typeof func === "function") {
        // todo; i believe the only time this happens is the wrapper
        // function around generators (that creates the iterator).
        // should just make that a real function object and get rid
        // of this case.
        // alternatively, put it to more use, and perhaps use
        // descriptors to create builtin.func's in other places.

        // This actually happens for all builtin functions (in
        // builtin.js, for example) as they are javascript functions,
        // not Sk.builtin.func objects.

        if (func.sk$klass) {
            // klass wrapper around __init__ requires special handling
            return func.apply(null, [kwdict, varargseq, kws, args, true]);
        }

        if (varargseq) {
            for (it = varargseq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                args.push(i);
            }
        }

        if (kwdict) {
            for (it = Sk.abstr.iter(kwdict), i = it.tp$iternext(); i!== undefined; i = it.tp$iternext()) {
                if (!Sk.builtin.checkString(i)) {
                    throw new Sk.builtin.TypeError("Function keywords must be strings");
                }
                kws.push(i.v);
                kws.push(Sk.abstr.objectGetItem(kwdict, i, false));
            }
        }

        //goog.asserts.assert(((kws === undefined) || (kws.length === 0)));
        //print('kw args location: '+ kws + ' args ' + args.length)
        if (kws !== undefined && kws.length > 0) {
            if (!func.co_varnames) {
                throw new Sk.builtin.ValueError("Keyword arguments are not supported by this function");
            }

            //number of positionally placed optional parameters
            numNonOptParams = func.co_numargs - func.co_varnames.length;
            numPosParams = args.length - numNonOptParams;

            //add defaults
            args = args.concat(func.$defaults.slice(numPosParams));

            for (i = 0; i < kws.length; i = i + 2) {
                kwix = func.co_varnames.indexOf(kws[i]);

                if (kwix === -1) {
                    throw new Sk.builtin.TypeError("'" + kws[i] + "' is an invalid keyword argument for this function");
                }

                if (kwix < numPosParams) {
                    throw new Sk.builtin.TypeError("Argument given by name ('" + kws[i] + "') and position (" + (kwix + numNonOptParams + 1) + ")");
                }

                args[kwix + numNonOptParams] = kws[i + 1];
            }
        }
        //append kw args to args, filling in the default value where none is provided.
        return func.apply(null, args);
    } else {
        fcall = func.tp$call;
        if (fcall !== undefined) {
            if (varargseq) {
                for (it = varargseq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    args.push(i);
                }
            }

            if (kwdict) {
                for (it = Sk.abstr.iter(kwdict), i = it.tp$iternext(); i!== undefined; i = it.tp$iternext()) {
                    if (!Sk.builtin.checkString(i)) {
                        throw new Sk.builtin.TypeError("Function keywords must be strings");
                    }
                    kws.push(i.v);
                    kws.push(Sk.abstr.objectGetItem(kwdict, i, false));
                }
            }
            return fcall.call(func, args, kws, kwdict);
        }

        // todo; can we push this into a tp$call somewhere so there's
        // not redundant checks everywhere for all of these __x__ ones?
        fcall = func.__call__;
        if (fcall !== undefined) {
            // func is actually the object here because we got __call__
            // from it. todo; should probably use descr_get here
            args.unshift(func);
            return Sk.misceval.apply(fcall, kwdict, varargseq, kws, args);
        }
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(func) + "' object is not callable");
    }
};
goog.exportSymbol("Sk.misceval.applyOrSuspend", Sk.misceval.applyOrSuspend);

/**
 * Constructs a class object given a code object representing the body
 * of the class, the name of the class, and the list of bases.
 *
 * There are no "old-style" classes in Skulpt, so use the user-specified
 * metaclass (todo;) if there is one, the type of the 0th base class if
 * there's bases, or otherwise the 'type' type.
 *
 * The func code object is passed a (js) dict for its locals which it
 * stores everything into.
 *
 * The metaclass is then called as metaclass(name, bases, locals) and
 * should return a newly constructed class object.
 *
 */
Sk.misceval.buildClass = function (globals, func, name, bases) {
    // todo; metaclass
    var klass;
    var meta = Sk.builtin.type;

    var locals = {};

    // init the dict for the class
    func(globals, locals, []);
    // ToDo: check if func contains the __meta__ attribute
    // or if the bases contain __meta__
    // new Syntax would be different

    // file's __name__ is class's __module__
    locals.__module__ = globals["__name__"];
    var _name = new Sk.builtin.str(name);
    var _bases = new Sk.builtin.tuple(bases);
    var _locals = [];
    var key;

    // build array for python dict
    for (key in locals) {
        if (!locals.hasOwnProperty(key)) {
            //The current property key not a direct property of p
            continue;
        }
        _locals.push(new Sk.builtin.str(key)); // push key
        _locals.push(locals[key]); // push associated value
    }
    _locals = new Sk.builtin.dict(_locals);

    klass = Sk.misceval.callsim(meta, _name, _bases, _locals);
    return klass;
};
goog.exportSymbol("Sk.misceval.buildClass", Sk.misceval.buildClass);
