// quick note to self

// in multpile inheritance do the search thing
// if we hit a slotwrapper then just call it"s raw function rather than calling the slot wrapper!

Sk.SlotDef = function (_name, func, wrapper, doc, flags) {
    this.$name = _name;
    this.$slot_func = func; // this function is called when the sk$klass defines a dunder method
    this.$doc = doc;
    this.$wrapper = wrapper;
    this.$flags = flags || {};
    this.$wrapper.$flags = this.$flags;
    this.$wrapper.$name = _name;
};

Sk.tpSlots = {
    tp$str: true,
    $r: true,
    // tp$descr_get: true,
    // tp$descr_set: true,
    // tp$hash: true,
    tp$init: true,
    // tp$new: true,
    // tp$iter: true,
    // tp$iternext: true,
};


Sk.subSlots = {
    tp$as_number: [
        "nb$add",
        "nb$inplace_add",
        "nb$subtract",
        "nb$inplace_subtract",
        "nb$multiply",
        "nb$inplace_multiply",
        "nb$remainder",
        "nb$inplace_remainder",
        "nb$divmod",
        "nb$power",
        "nb$inplace_power",
        "nb$negative",
        "nb$positive",
        "nb$absolute",
        "nb$bool",
        "nb$invert",
        "nb$lshift",
        "nb$inplace_lshift",
        "nb$rshift",
        "nb$inplace_rshift",
        "nb$and",
        "nb$inplace_and",
        "nb$xor",
        "nb$inplace_xor",
        "nb$or",
        "nb$inplace_or",
        "nb$int",
        "nb$reserved",
    ],
    tp$as_mapping: ["sq$length", "mp$subscript", "mp$ass_subscript"],
    tp$as_sequence: [
        "sq$length",
        "sq$concat",
        "sq$repeat",
        "mp$subscript",
        "mp$ass_subscript",
        "sq$contains",
        "sq$inplace_concat",
        "sq$inplace_repeat"
    ],

    tp$rich_compare: ["ob$lt", "ob$le", "ob$eq", "ob$ne", "ob$gt", "ob$ge"],
    tp$await: ["am$await",
        "am$aiter",
        "am$anext",
    ],
};

Sk.Slots = Object.create(null); 

Sk.Slots.$r = new Sk.SlotDef("__repr__",
    function $r() {
        let res;
        const func = this.ob$type.$typeLookup("__repr__");
        debugger;
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            // then just call the wrapped function
            return func.d$wrapped.call(this);
        } else if (func !== undefined) {
            res = Sk.misceval.callsimArray(func, [this]);
            if (!(Sk.builtin.checkString(res))) {
                throw new Sk.builtin.TypeError("__repr__ returned non-string (type " + Sk.abstr.typeName(res) + ")")
            }
        }
        return res;
    },
    Sk.generic.slotCallNoArgs,
    "Return repr(self).", 
    {NoArgs: true}
);

Sk.Slots.tp$init = new Sk.SlotDef("__init__",
    function tp$init(args, kwargs) {
        const func = this.ob$type.$typeLookup("__init__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            return func.d$wrapped.call(this, args, kwargs);
        }
        args.unshift(this);
        let ret = Sk.misceval.callsimOrSuspendArray(func, args, kwargs);
        return Sk.misceval.chain(ret, function (r) {
            if (!Sk.builtin.checkNone(r) && r !== undefined) {
                throw new Sk.builtin.TypeError("__init__() should return None, not " + Sk.abstr.typeName(r));
            } else {
                return r;
            }
        });
    },
    function __init__(self, args, kwargs) {
        // this = wrapped function
        return this.call(self, args, kwargs);
    }
);

Sk.Slots.tp$str = new Sk.SlotDef("__str__",
    function tp$str () {
        let res;
        const func = this.ob$type.$typeLookup("__str__");
        if (func instanceof Sk.builtin.wrapper_descriptor) {
            debugger;
            return func.d$wrapped.call(this);
        } else if (func !== undefined) {
            res = Sk.misceval.callsimArray(func, [this]);
            if (!(Sk.builtin.checkString(res))) {
                throw new Sk.builtin.TypeError("__str__ returned non-string (type " + Sk.abstr.typeName(res) + ")")
            }
        }
        return res;
    },
    Sk.generic.slotCallNoArgs,
    "Return str(self).", 
    {NoArgs: true}
);


// Sk.Slots.tp$init = new Sk.SlotDef(Sk.builtin.str.$init,
//     function __init__() {},
// )

// Sk.Slots.tp$new = new Sk.SlotDef(Sk.builtin.str.$new,
//     function __init__() {

//     },
// )

// Sk.Slots.tp$str = new Sk.SlotDef(Sk.builtin.str.$repr, Sk.builtin.repr_wrapper, {
//     NoArgs: true
// });


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
 * some of these built-in functions are acquiring "canSuspend" arguments to signal
 * where this is not the case. These need to be spliced out of the argument list before
 * it is passed to python. Array values in this map contain [dunderName, argumentIdx],
 * where argumentIdx specifies the index of the "canSuspend" boolean argument.
 *
 * @type {Object}
 */
Sk.dunderToSkulpt = {
    "__repr__": "$r",
    "__init__": "tp$init",
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

Sk.exportSymbol("Sk.setupDunderMethods", Sk.setupDunderMethods);

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



// // allocate a dunder method to a skulpt slot
// const magic_func = klass.prototype[dunder];
// let skulpt_name = Sk.dunderToSkulpt[dunder];

// if (typeof (skulpt_name) === "string") {
//     // can"t suspend so just use calsimArray
//     klass.prototype[skulpt_name] = function () {
//         let len, args, i;
//         len = arguments.length;
//         args = new Array(len + 1);
//         args[0] = this;
//         for (i = 0; i < len; i++) {
//             args[i + 1] = arguments[i];
//         }
//         return Sk.misceval.callsimArray(magic_func, args);
//     };
// } else {
//     // can suspend
//     let canSuspendIdx = skulpt_name[1];
//     skulpt_name = skulpt_name[0];
//     klass.prototype[skulpt_name] = function () {
//         let len, args, i, j;
//         let canSuspend = false;
//         len = arguments.length;
//         if (canSuspendIdx <= len) {
//             args = new Array(len);
//         } else {
//             args = new Array(len + 1);
//         }
//         args[0] = this;
//         j = 1;
//         for (i = 0; i < len; i++) {
//             if (i === (canSuspendIdx - 1)) {
//                 canSuspend = arguments[i];
//             } else {
//                 args[j] = arguments[i];
//                 j += 1;
//             }
//         }
//         if (canSuspend) {
//             return Sk.misceval.callsimOrSuspendArray(magic_func, args);
//         } else {
//             return Sk.misceval.callsimArray(magic_func, args);
//         }
//     };
// }


// things from other modules that might be usefl

/**
 * 
 * 
 Sk.builtin.func.prototype.__get__ = function __get__(self, instance, owner) {
    Sk.builtin.pyCheckArgsLen("__get__", arguments.length, 1, 2, false, true);
    if (instance === Sk.builtin.none.none$ && owner === Sk.builtin.none.none$) {
        throw new Sk.builtin.TypeError("__get__(None, None) is invalid");
    }

    return self.tp$descr_get(instance, owner);
};
 * 
 * 
 * 
 */
