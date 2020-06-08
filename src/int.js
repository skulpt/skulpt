/* jslint nomen: true, bitwise: true */
/* global Sk: true */

function withinThreshold(v) {
    if (typeof v !== "number") {
        v = v.toString();
    }
    return v <= Number.MAX_SAFE_INTEGER && v >= -Number.MAX_SAFE_INTEGER;
}

function convertIfSafe(v) {
    s = v.toString();
    if (s <= Number.MAX_SAFE_INTEGER && s >= -Number.MAX_SAFE_INTEGER) {
        return +s;
    }
    return v;
}

function bigUp(v) {
    if (typeof v === "number") {
        return JSBI.BigInt(v);
    }
    return v;
}
function numberCompare(v, w, op) {
    switch (op) {
        case "Eq":
            return v == w;
        case "NotEq":
            return v != w;
        case "GtE":
            return v >= w;
        case "Gt":
            return v > w;
        case "Lt":
            return v < w;
        case "LtE":
            return v <= w;
    }
}

function bigIntCompare(v, w, op) {
    switch (op) {
        case "Eq":
            return JSBI.equal(v, w);
        case "NotEq":
            return JSBI.notEqual(v, w);
        case "GtE":
            return JSBI.greaterThanOrEqual(v, w);
        case "Gt":
            return JSBI.greaterThan(v, w);
        case "Lt":
            return JSBI.lessThan(v, w);
        case "LtE":
            return JSBI.lessThanOrEqual(v, w);
    }
}

/**
 * @namespace Sk.builtin
 */

/**
 * @constructor
 * Sk.builtin.int_
 *
 * @description
 * Constructor for Python int. If provided number is greater than integer threshold, will return a Python long instead.
 *
 * type int, all integers are created with this method, it is also used
 * for the builtin int()
 *
 * Takes also implemented `__int__` and `__trunc__` methods for x into account
 * and tries to use `__index__` if base is not a number
 *
 *
 * @param  {Number|BigInt} x
 *
 */
Sk.builtin.int_ = function (x) {
    // internal function called with a javascript int/float/str
    Sk.asserts.assert(this instanceof Sk.builtin.int_ && (typeof x === "number" || x instanceof JSBI), "bad call to int constructor");
    debugger;
    if (typeof x === "number" && !withinThreshold(x)) {
        debugger;
        return new Sk.builtin.lng(x);
    }
    this.v = x;
    return this;
};

Sk.abstr.setUpInheritance("int", Sk.builtin.int_);
Sk.builtin.int_.prototype.tp$as_number = true;

/* NOTE: See constants used for kwargs in constants.js */

Sk.builtin.int_.prototype.tp$doc =
    "int(x=0) -> integer\nint(x, base=10) -> integer\n\nConvert a number or string to an integer, or return 0 if no arguments\nare given.  If x is a number, return x.__int__().  For floating point\nnumbers, this truncates towards zero.\n\nIf x is not a number or if base is given, then x must be a string,\nbytes, or bytearray instance representing an integer literal in the\ngiven base.  The literal can be preceded by '+' or '-' and be surrounded\nby whitespace.  The base defaults to 10.  Valid bases are 0 and 2-36.\nBase 0 means to interpret the base from the string as an integer literal.\n>>> int('0b100', base=0)\n4";

Sk.builtin.int_.prototype.tp$new = function (args, kwargs) {
    args = Sk.abstr.copyKeywordsToNamedArgs("int", [null, "base"], args, kwargs, [new Sk.builtin.int_(0), Sk.builtin.none.none$]);

    let x = args[0];
    const base = args[1];

    const jsInt = Sk.builtin.int_.$getJsInt(x, base);

    if (this === Sk.builtin.int_.prototype) {
        return new Sk.builtin.int_(jsInt);
    } else {
        const instance = new this.constructor();
        Sk.builtin.int_.call(instance, jsInt);
        return instance;
    }
};

/**
 * A function that will return either a number or a BigInt
 */
Sk.builtin.int_.$getJsInt = function (x, base) {
    let func, res;
    // if base is not of type int, try calling .__index__
    if (base !== Sk.builtin.none.none$) {
        Sk.misceval.asIndexOrThrow(base);
    } else {
        base = null;
    }

    if (x instanceof Sk.builtin.str) {
        base = Sk.builtin.asnum$(base);
        if (base === null) {
            base = 10;
        }
        return Sk.str2number(x.v, base);
    } else if (base !== null) {
        throw new Sk.builtin.TypeError("int() can't convert non-string with explicit base");
    } else if (x.nb$int_) {
        // nb$int_ slot_wrapper takes care of checking nb$int
        // but it might be undefined if it's multiple inheritance
        res = x.nb$int_();
    }

    if (res === undefined && (func = x.tp$getattr(Sk.builtin.str.$trunc))) {
        res = Sk.misceval.callsimArray(func);
        // check return type of magic methods
        if (!Sk.builtin.checkInt(x)) {
            throw new Sk.builtin.TypeError(Sk.builtin.str.$trunc.$jsstr() + " returned non-Integral (type " + Sk.abstr.typeName(x) + ")");
        }
        return res.v;
    }

    throw new Sk.builtin.TypeError("int() argument must be a string, a bytes-like object or a number, not '" + Sk.abstr.typeName(x) + "'");
};

Sk.builtin.int_.prototype.nb$int_ = function () {
    return this;
};

Sk.builtin.int_.prototype.nb$float_ = function () {
    if (typeof x.v === "number") {
        return new Sk.builtin.float_(this.v);
    } else {
        return new Sk.builtin.float_(JSBI.toNumber(this.v));
    }
};

// Sk.builtin.int_.prototype.nb$lng = function () {
//     return new Sk.builtin.lng(this.v);
// };

/**
 * Return this instance's Javascript value.
 *
 * Javascript function, returns Javascript object.
 *
 * @return {number} This instance's value.
 */
Sk.builtin.int_.prototype.nb$index = function () {
    return this.v;
};

/** @override */
Sk.builtin.int_.prototype.tp$hash = function () {
    //the hash of all numbers should be an int and since javascript doesn't really
    //care every number can be an int.
    return this;
};

/**
 * Threshold to determine when types should be converted to long.
 *
 * Note: be sure to check against threshold in both positive and negative directions.
 *
 * @type {number}
 */

/** @override */
Sk.builtin.int_.prototype.nb$add = function (other) {
    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        const v_type = typeof v;
        const w_type = typeof w;
        if (v_type === "number" && w_type === "number") {
            const res = v + w;
            if (withinThreshold(res)) {
                return new Sk.builtin.int_(res);
            }
            return new Sk.builtin.int_(JSBI.add(JSBI.BigInt(v), JSBI.BigInt(w)));
        }
        if (v_type === "number") {
            v = JSBI.BigInt(v);
        } else if (w_type === "number") {
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(convertIfSafe(JSBI.add(v, w)));
    }
    if (other instanceof Sk.builtin.float_) {
        return this.nb$float_().nb$add(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$subtract = function (other) {
    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        const v_type = typeof v;
        const w_type = typeof w;
        if (v_type === "number" && w_type === "number") {
            const res = v - w;
            if (withinThreshold(res)) {
                return new Sk.builtin.int_(res);
            }
            return new Sk.builtin.int_(JSBI.subtract(JSBI.BigInt(v), JSBI.BigInt(w)));
        }
        if (v_type === "number") {
            v = JSBI.BigInt(v);
        } else if (w_type === "number") {
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(convertIfSafe(JSBI.subtract(v, w)));
    }
    if (other instanceof Sk.builtin.float_) {
        return this.nb$float_().nb$subtract(other);
    }
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$multiply = function (other) {
    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        if (!w || !v) {
            // quick check for zero saves doing a convertIfSafe later
            return new Sk.builtin.int_(0);
        }
        const v_type = typeof v;
        const w_type = typeof w;
        if (v_type === "number" && w_type === "number") {
            const res = v * w;
            if (withinThreshold(res)) {
                return new Sk.builtin.int_(res);
            }
            return new Sk.builtin.int_(JSBI.multiply(JSBI.BigInt(v), JSBI.BigInt(w)));
        }
        if (v_type === "number") {
            v = JSBI.BigInt(v);
        } else if (w_type === "number") {
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(JSBI.multiply(v, w));
    }
    if (other instanceof Sk.builtin.float_) {
        return this.nb$float_().nb$multiply(other);
    }
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$divide = function (other) {
    var thisAsLong, thisAsFloat;
    if (Sk.__future__.division) {
        return this.nb$float_().nb$divide(other);
    }

    if (other instanceof Sk.builtin.int_) {
        return this.nb$floor_divide(other);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$divide(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return this.nb$float_().nb$divide(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$floor_divide = function (other) {
    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        const v_type = typeof v;
        const w_type = typeof w;
        if (v_type === "number" && w_type === "number") {
            if (w === 0) {
                throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
            }
            return new Sk.builtin.int_(Math.floor(v / w));
        }
        if (v_type === "number") {
            v = JSBI.BigInt(v);
        } else if (w_type === "number") {
            if (w === 0) {
                throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
            }
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(convertIfSafe(JSBI.divide(v, w)));
    }
    if (other instanceof Sk.builtin.float_) {
        return this.nb$float_().nb$floor_divide(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$remainder = function (other) {
    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        if (typeof v === "number") {
            v = JSBI.BigInt(v);
        }
        if (typeof w === "number") {
            if (w.v === 0) {
                throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
            }
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(convertIfSafe(JSBI.remainder(v, w)));
    }

    if (other instanceof Sk.builtin.float_) {
        return this.nb$float_().nb$remainder(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$divmod = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.tuple([this.nb$floor_divide(other), this.nb$remainder(other)]);
    }
    if (other instanceof Sk.builtin.float_) {
        return this.nb$float_().nb$divmod(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$power = function (other, mod) {
    let ret;

    if (other instanceof Sk.builtin.int_ && (mod === undefined || mod instanceof Sk.builtin.int_)) {
        let v = this.v;
        let w = other.v;
        const v_type = typeof v;
        const w_type = typeof w;
        const both_safe = v_type === "number" && w_type === "number";
        if (both_safe) {
            const power = Math.pow(this.v, other.v);
            if (withinThreshold(power)) {
                ret = w < 0 ? new Sk.builtin.float_(power) : new Sk.builtin.int_(power);
            }
        }
        if (!both_safe || ret === undefined) {
            if (typeof v === "number") {
                v = JSBI.BigInt(v);
            }
            if (typeof w === "number") {
                w = JSBI.BigInt(w);
            }
            ret = new Sk.builtin.int_(JSBI.pow(v, w));
        }

        if (mod !== undefined) {
            if ((w_type === "number" && other.v < 0) || JSBI.lessThan(w, JSBI.BigInt(0))) {
                throw new Sk.builtin.TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
            }
            return ret.nb$remainder(mod);
        } else {
            return ret;
        }
    }

    if (other instanceof Sk.builtin.float_) {
        return this.nb$float_().nb$power(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$abs = function () {
    if (typeof this.v === "number") {
        return new Sk.builtin.int_(Math.abs(this.v));
    }
    return new Sk.builtin.int_(JSBI.abs(this.v));
};

/**
 * Compute the bitwise AND of this instance and a Python object (i.e. this & other).
 *
 * Returns NotImplemented if bitwise AND operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to AND with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the conjunction
 */
Sk.builtin.int_.prototype.nb$and = function (other) {
    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        const v_type = typeof v;
        const w_type = typeof w;
        if (v_type === "number" && w_type === "number") {
            let tmp = v & w;
            if (tmp < 0) {
                tmp = tmp + 4294967296; // convert back to unsigned
            }
            return new Sk.builtin.int_(tmp);
        }
        if (v_type === "number") {
            v = JSBI.BigInt(v);
        } else if (w_type === "number") {
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(convertIfSafe(JSBI.bitwiseAnd(v, w)));
    }
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the bitwise OR of this instance and a Python object (i.e. this | other).
 *
 * Returns NotImplemented if bitwise OR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to OR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the disjunction
 */
Sk.builtin.int_.prototype.nb$or = function (other) {
    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        const v_type = typeof v;
        const w_type = typeof w;
        if (v_type === "number" && w_type === "number") {
            let tmp = v | w;
            if (tmp < 0) {
                tmp = tmp + 4294967296; // convert back to unsigned
            }
            return new Sk.builtin.int_(tmp);
        }
        if (v_type === "number") {
            v = JSBI.BigInt(v);
        } else if (w_type === "number") {
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(convertIfSafe(JSBI.bitwiseOr(v, w)));
    }
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the bitwise XOR of this instance and a Python object (i.e. this ^ other).
 *
 * Returns NotImplemented if bitwise XOR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to XOR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the exclusive disjunction
 */
Sk.builtin.int_.prototype.nb$xor = function (other) {
    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        const v_type = typeof v;
        const w_type = typeof w;
        if (v_type === "number" && w_type === "number") {
            let tmp = v ^ w;
            if (tmp < 0) {
                tmp = tmp + 4294967296; // convert back to unsigned
            }
            return new Sk.builtin.int_(tmp);
        }
        if (v_type === "number") {
            v = JSBI.BigInt(v);
        } else if (w_type === "number") {
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(convertIfSafe(JSBI.bitwiseXor(v, w)));
    }
    return Sk.builtin.NotImplemented.NotImplemented$;
};

const $shiftconsts = [
    0.5,
    1,
    2,
    4,
    8,
    16,
    32,
    64,
    128,
    256,
    512,
    1024,
    2048,
    4096,
    8192,
    16384,
    32768,
    65536,
    131072,
    262144,
    524288,
    1048576,
    2097152,
    4194304,
    8388608,
    16777216,
    33554432,
    67108864,
    134217728,
    268435456,
    536870912,
    1073741824,
    2147483648,
    4294967296,
    8589934592,
    17179869184,
    34359738368,
    68719476736,
    137438953472,
    274877906944,
    549755813888,
    1099511627776,
    2199023255552,
    4398046511104,
    8796093022208,
    17592186044416,
    35184372088832,
    70368744177664,
    140737488355328,
    281474976710656,
    562949953421312,
    1125899906842624,
    2251799813685248,
    4503599627370496,
    9007199254740992,
];

/**
 * Compute the bitwise left shift of this instance by a Python object (i.e. this << other).
 *
 * Returns NotImplemented if bitwise left shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to left shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the left shift
 */
Sk.builtin.int_.prototype.nb$lshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        if (v === 0) {
            return this;
        }
        if (typeof v === "number") {
            v = JSBI.BigInt(v);
        } else if (typeof w === "number") {
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(convertIfSafe(JSBI.leftShift(v, w)));
    }
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the bitwise right shift of this instance by a Python object (i.e. this >> other).
 *
 * Returns NotImplemented if bitwise right shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to right shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the right shift
 */
Sk.builtin.int_.prototype.nb$rshift = function (other) {
    var thisAsLong;

    if (other instanceof Sk.builtin.int_) {
        let v = this.v;
        let w = other.v;
        if (v === 0) {
            // we don't need to check bigInt here because we will always have a number as zero
            return this;
        }
        const v_type = typeof v;
        const w_type = typeof w;
        if (v_type === "number" && w_type === "number") {
            let tmp = v >> w;
            if (v > 0 && tmp < 0) {
                // Fix incorrect sign extension
                tmp = tmp & (Math.pow(2, 32 - w) - 1);
            }
            if (withinThreshold(tmp)) {
                return new Sk.builtin.int_(tmp);
            }
        }
        if (v_type === "number") {
            v = JSBI.BigInt(v);
        } else if (w_type === "number") {
            w = JSBI.BigInt(w);
        }
        return new Sk.builtin.int_(convertIfSafe(JSBI.rightShift(v, w)));
    }
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the bitwise inverse of this instance (i.e. ~this).
 *
 * Javscript function, returns Python object.
 *
 * @return {Sk.builtin.int_} The result of the inversion
 */
Sk.builtin.int_.prototype.nb$invert = function () {
    const v = this.v;
    if (typeof v === "number") {
        return new Sk.builtin.int_(~v);
    }
    return new Sk.builtin.int_(convertIfSafe(JSBI.bitwiseNot(v)));
};

/**
 * @override
 *
 * @return {Sk.builtin.int_} A copy of this instance with the value negated.
 */
Sk.builtin.int_.prototype.nb$negative = function () {
    const v = this.v;
    if (typeof v === "number") {
        return new Sk.builtin.int_(-v);
    }
    return new Sk.builtin.int_(JSBI.unaryMinus(v));
};

/** @override */
Sk.builtin.int_.prototype.nb$positive = function () {
    return new Sk.builtin.int_(this.v);
};

/** @override */
Sk.builtin.int_.prototype.nb$bool = function () {
    return this.v !== 0; // should be fine not to check BigInt here
};

/** @override */
Sk.builtin.int_.prototype.nb$isnegative = function () {
    const v = this.v;
    if (typeof v === "number") {
        return v < 0;
    }
    return JSBI.lessThan(v, JSBI.BigInt(0));
};

/** @override */
Sk.builtin.int_.prototype.nb$ispositive = function () {
    const v = this.v;
    if (typeof v === "number") {
        return v > 0;
    }
    return JSBI.greaterThan(v, JSBI.BigInt(0));
};

/**
 * Compare this instance's value to another Python object's value.
 *
 * Returns NotImplemented if comparison between int and other type is unsupported.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(number|Sk.builtin.NotImplemented)} negative if this < other, zero if this == other, positive if this > other
 */
Sk.builtin.int_.prototype.numberCompare = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return this.v - other.v;
    }

    if (other instanceof Sk.builtin.lng) {
        return -other.longCompare(this);
    }

    if (other instanceof Sk.builtin.float_) {
        return -other.numberCompare(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.tp$richcompare = function (other, op) {
    if (!(other instanceof Sk.builtin.int_)) {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
    let v = this.v;
    let w = other.v;
    if (v === w) {
        res = 0;
    } else if (typeof v === "number" && typeof w === "number") {
        return numberCompare(v - w, 0, op);
    } else {
        v = bigUp(v);
        w = bigUp(w);
        return bigIntCompare(JSBI.subtract(w, v), JSBI.BigInt(0), op);
    }
};

/**
 * Round this instance to a given number of digits, or zero if omitted.
 *
 * Implements `__round__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Sk.builtin.int_} self This instance.
 * @param  {Object|number=} ndigits The number of digits after the decimal point to which to round.
 * @return {Sk.builtin.int_} The rounded integer.
 */
Sk.builtin.int_.prototype.round$ = function (ndigits) {
    if (ndigits !== undefined && !Sk.misceval.isIndex(ndigits)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(ndigits) + "' object cannot be interpreted as an index");
    }
    return this;
};

Sk.builtin.int_.prototype.conjugate = new Sk.builtin.func(function (self) {
    return this;
});

/** @override */
Sk.builtin.int_.prototype.$r = function () {
    debugger;
    return new Sk.builtin.str(this.v.toString());
};

/**
 * Convert this instance's value to a Javascript string.
 *
 * Javascript function, returns Javascript object.
 *
 * @param {number} base The base of the value.
 * @param {boolean} sign true if the value should be signed, false otherwise.
 * @return {string} The Javascript string representation of this instance.
 */
Sk.builtin.int_.prototype.str$ = function (base, sign) {
    var tmp;
    var work;

    if (sign === undefined) {
        sign = true;
    }

    work = sign ? this.v : Math.abs(this.v);

    if (base === undefined || base === 10) {
        tmp = work.toString();
    } else {
        tmp = work.toString(base);
    }

    return tmp;
};

/**
 * Takes a JavaScript string and returns a number using the parser and negater
 *  functions (for int/long right now)
 * @param  {string} s       Javascript string to convert to a number.
 * @param  {(number)} base    The base of the number.
 * @param  {function(*, (number|undefined)): number} parser  Function which should take
 *  a string that is a postive number which only contains characters that are
 *  valid in the given base and a base and return a number.
 * @param  {function((number|Sk.builtin.biginteger)): number} negater Function which should take a
 *  number and return its negation
 * @param  {string} fname   The name of the calling function, to be used in error messages
 * @return {number}         The number equivalent of the string in the given base
 */
Sk.str2number = function (s, base, parser, negater, fname) {
    var origs = s,
        neg = false,
        i,
        ch,
        val;

    // strip whitespace from ends
    // s = s.trim();
    s = s.replace(/^\s+|\s+$/g, "");

    // check for minus sign
    if (s.charAt(0) === "-") {
        neg = true;
        s = s.substring(1);
    }

    // check for plus sign
    if (s.charAt(0) === "+") {
        s = s.substring(1);
    }

    if (base === null || base === undefined) {
        base = 10;
    } // default radix is 10, not dwim

    if (base < 2 || base > 36) {
        if (base !== 0) {
            throw new Sk.builtin.ValueError(fname + "() base must be >= 2 and <= 36");
        }
    }

    if (s.substring(0, 2).toLowerCase() === "0x") {
        if (base === 16 || base === 0) {
            s = s.substring(2);
            base = 16;
        } else if (base < 34) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0b") {
        if (base === 2 || base === 0) {
            s = s.substring(2);
            base = 2;
        } else if (base < 12) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0o") {
        if (base === 8 || base === 0) {
            s = s.substring(2);
            base = 8;
        } else if (base < 25) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.charAt(0) === "0") {
        if (s === "0") {
            return 0;
        }
        if (base === 8 || base === 0) {
            base = 8;
        }
    }

    if (base === 0) {
        base = 10;
    }

    if (s.length === 0) {
        throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
    }

    // check all characters are valid
    for (i = 0; i < s.length; i = i + 1) {
        ch = s.charCodeAt(i);
        val = base;
        if (ch >= 48 && ch <= 57) {
            // 0-9
            val = ch - 48;
        } else if (ch >= 65 && ch <= 90) {
            // A-Z
            val = ch - 65 + 10;
        } else if (ch >= 97 && ch <= 122) {
            // a-z
            val = ch - 97 + 10;
        }

        if (val >= base) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    }

    if (neg) {
        s = "-" + s;
    }
    val = JSBI.BigInt(s);
    val = val.toString(base);
    if (withinThreshold(val)) {
        return +val; // will convert our string to a number
    }
    return JSBI.BigInt(val);
};

Sk.exportSymbol("Sk.builtin.int_", Sk.builtin.int_);

Sk.builtin.int_.prototype.tp$getsets = {
    real: {
        $get: function () {
            return this;
        },
    },
    imag: {
        $get: function () {
            return new Sk.builtin.int_(0);
        },
    },
};

Sk.builtin.int_.prototype.tp$methods = {
    conjugate: {
        $meth: function () {
            return this;
        },
        $flags: {OneArg: true},
        $textsig: null,
        $doc: "Returns self, the complex conjugate of any int.",
    },
    bit_length: {
        $meth: function () {
            throw new Sk.builtin.NotImplementedError("Not yet implemented in Skulpt");
        },
        $flags: {NoArgs: true},
        $textsig: "($self, /)",
        $doc: "Number of bits necessary to represent self in binary.\n\n>>> bin(37)\n'0b100101'\n>>> (37).bit_length()\n6",
    },
    to_bytes: {
        $meth: function () {
            throw new Sk.builtin.NotImplementedError("Not yet implemented in Skulpt");
        },
        $flags: {FastCall: true},
        $textsig: "($self, /, length, byteorder, *, signed=False)",
        $doc:
            "Return an array of bytes representing an integer.\n\n  length\n    Length of bytes object to use.  An OverflowError is raised if the\n    integer is not representable with the given number of bytes.\n  byteorder\n    The byte order used to represent the integer.  If byteorder is 'big',\n    the most significant byte is at the beginning of the byte array.  If\n    byteorder is 'little', the most significant byte is at the end of the\n    byte array.  To request the native byte order of the host system, use\n    `sys.byteorder' as the byte order value.\n  signed\n    Determines whether two's complement is used to represent the integer.\n    If signed is False and a negative integer is given, an OverflowError\n    is raised.",
    },
    __trunc__: {
        $meth: function () {
            return this;
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "Truncating an Integral returns itself.",
    },
    __floor__: {
        $meth: function () {
            return this;
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "Flooring an Integral returns itself.",
    },
    __ceil__: {
        $meth: function () {
            return this;
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "Ceiling of an Integral returns itself.",
    },
    __round__: {
        $meth: function (ndigits) {
            return this.round$(ndigits);
        },
        $flags: { MinArgs: 0, MaxArgs: 1 },
        $textsig: null,
        $doc: "Rounding an Integral returns itself.\nRounding with an ndigits argument also returns an integer.",
    },
    // __getnewargs__: {
    //     $meth: methods.__getnewargs__,
    //     $flags: {NoArgs: true},
    //     $textsig: "($self, /)",
    //     $doc: Sk.builtin.none.none$,
    // },
    // __format__: {
    //     $meth: function () {
    //         if (!Sk.builtin.checkString(format_spec)) {
    //             throw new Sk.builtin.TypeError("format() argument must be str, not " + Sk.abstr.typeName(format_spec));
    //         }
    //         return new Sk.builtin.str(formatNumber(this, format_spec.$jsstr(), false));
    //     },
    //     $flags: {OneArg: true},
    //     $textsig: "($self, format_spec, /)",
    //     $doc: Sk.builtin.none.none$,
    // },
};

Sk.abstr.setUpMethods(Sk.builtin.int_);

Sk.builtin.int_.py2$methods = {};

/**
 * Python wrapper of `__complex__` dunder method.
 *
 * @instance
 */
Sk.builtin.int_.prototype.__complex__ = new Sk.builtin.func(function (self) {
    return Sk.builtin.NotImplemented.NotImplemented$;
});

Sk.builtin.int_.prototype.__format__ = Sk.formatting.mkNumber__format__(false);

Sk.longFromStr = function (s) {
    return new Sk.builtin.int_(JSBI.BigInt(s));
};
Sk.exportSymbol("Sk.longFromStr", Sk.longFromStr);
