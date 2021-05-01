/** @typedef {Sk.builtin.object} */ var pyObject;

const hashMap = Object.create(null, {
    Infinity: { value: 314159 },
    "-Infinity": { value: -314159 },
    NaN: { value: 0 },
});

/**
 * @constructor
 * @extends {Sk.builtin.object}
 *
 * @param {number} x only be called with a JS number
 *
 * @return {Sk.builtin.float_} Python float
 */
Sk.builtin.float_ = Sk.abstr.buildNativeClass("float", {
    constructor: function float_(x) {
        Sk.asserts.assert(this instanceof Sk.builtin.float_, "bad call to float use 'new'");
        if (typeof x === "number") {
            this.v = x;
        } else if (x === undefined) {
            this.v = 0.0;
        } else if (typeof x === "string") {
            // be careful with converting a string as it could result in infinity
            this.v = parseFloat(x);
        } else if (x.nb$float) {
            return x.nb$float(); // allow this as a slow path
        } else {
            Sk.asserts.fail("bad argument to float constructor");
        }
    },
    slots: /**@lends {Sk.builtin.float_.prototype} */ {
        tp$gettattr: Sk.generic.getAttr,
        tp$as_number: true,
        tp$doc: "Convert a string or number to a floating point number, if possible.",
        tp$hash() {
            const v = this.v;
            let hash = hashMap[v];
            if (hash !== undefined) {
                return hash;
            } else if (Number.isInteger(v)) {
                hash = this.nb$int().tp$hash();
            } else {
                hash = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER - Number.MAX_SAFE_INTEGER / 2);
            }
            hashMap[this.v] = hash;
            return hash;
        },
        $r() {
            return new Sk.builtin.str(this.str$(10, true));
        },
        tp$new(args, kwargs) {
            if (kwargs && kwargs.length) {
                throw new Sk.builtin.TypeError("float() takes no keyword arguments");
            } else if (args && args.length > 1) {
                throw new Sk.builtin.TypeError("float expected at most 1 arguments, got " + args.length);
            }
            const arg = args[0];
            let x;
            // is args always an empty list?
            if (arg === undefined) {
                x = new Sk.builtin.float_(0.0);
            } else if (arg.nb$float) {
                x = arg.nb$float();
            } else if (Sk.builtin.checkString(arg)) {
                x = _str_to_float(arg.v);
            }
            if (x === undefined) {
                throw new Sk.builtin.TypeError("float() argument must be a string or a number");
            }
            if (this === Sk.builtin.float_.prototype) {
                return x;
            } else {
                const instance = new this.constructor();
                instance.v = x.v;
                return instance;
            }
        },

        // number slots
        nb$int() {
            let v = this.v;
            if (v < 0) {
                v = Math.ceil(v);
            } else {
                v = Math.floor(v);
            }
            if (!Number.isInteger(v)) {
                throw new Sk.builtin.ValueError("cannot convert float " + Sk.misceval.objectRepr(this) + " to integer");
            }
            if (Sk.builtin.int_.withinThreshold(v)) {
                return new Sk.builtin.int_(v);
            } else {
                return new Sk.builtin.int_(JSBI.BigInt(v));
            }
        },
        nb$float: cloneSelf,
        nb$long() {
            return new Sk.builtin.lng(this.nb$int().v);
        },
        nb$add: numberSlot((v, w) => new Sk.builtin.float_(v + w)),

        nb$subtract: numberSlot((v, w) => new Sk.builtin.float_(v - w)),
        nb$reflected_subtract: numberSlot((v, w) => new Sk.builtin.float_(w - v)),

        nb$multiply: numberSlot((v, w) => new Sk.builtin.float_(v * w)),

        nb$divide: numberSlot(divide),
        nb$reflected_divide: numberSlot((v, w) => divide(w, v)),

        nb$floor_divide: numberSlot(floordivide),
        nb$reflected_floor_divide: numberSlot((v, w) => floordivide(w, v)),

        nb$remainder: numberSlot(remainder),
        nb$reflected_remainder: numberSlot((v, w) => remainder(w, v)),

        nb$divmod: numberSlot((v, w) => new Sk.builtin.tuple([floordivide(v, w), remainder(v, w)])),
        nb$reflected_divmod: numberSlot((v, w) => new Sk.builtin.tuple([floordivide(w, v), remainder(w, v)])),

        nb$power: ternarySlot(power),
        nb$reflected_power: ternarySlot((v, w) => power(w, v)),

        nb$abs() {
            return new Sk.builtin.float_(Math.abs(this.v));
        },
        nb$negative() {
            return new Sk.builtin.float_(-this.v);
        },
        nb$positive() {
            return new Sk.builtin.float_(this.v);
        },
        nb$bool() {
            return this.v !== 0;
        },
        nb$isnegative() {
            return this.v < 0;
        },
        nb$ispositive() {
            return this.v >= 0;
        },
        ob$eq: numberSlot((v, w) => v == w),
        ob$ne: numberSlot((v, w) => v != w),
        ob$gt: numberSlot((v, w) => v > w),
        ob$ge: numberSlot((v, w) => v >= w),
        ob$lt: numberSlot((v, w) => v < w),
        ob$le: numberSlot((v, w) => v <= w),
    },
    getsets: /**@lends {Sk.builtin.float_.prototype} */ {
        real: {
            $get: cloneSelf,
            $doc: "the real part of a complex number",
        },
        imag: {
            $get() {
                return new Sk.builtin.float_(0.0);
            },
            $doc: "the imaginary part of a complex number",
        },
    },
    methods: /**@lends {Sk.builtin.float_.prototype} */ {
        conjugate: {
            $meth: cloneSelf,
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return self, the complex conjugate of any float.",
        },
        __trunc__: {
            $meth() {
                return this.nb$int();
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return the Integral closest to x between 0 and x.",
        },
        __round__: {
            $meth(ndigits) {
                return this.round$(ndigits);
            },
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, ndigits=None, /)",
            $doc: "Return the Integral closest to x, rounding half toward even.\n\nWhen an argument is passed, work like built-in round(x, ndigits).",
        },
        // as_integer_ratio: {
        //     $meth: methods.as_integer_ratio,
        //     $flags: { NoArgs: true },
        //     $textsig: "($self, /)",
        //     $doc:
        //         "Return integer ratio.\n\nReturn a pair of integers, whose ratio is exactly equal to the original float\nand with a positive denominator.\n\nRaise OverflowError on infinities and a ValueError on NaNs.\n\n>>> (10.0).as_integer_ratio()\n(10, 1)\n>>> (0.0).as_integer_ratio()\n(0, 1)\n>>> (-.25).as_integer_ratio()\n(-1, 4)",
        // },
        // hex: {
        //     $meth: methods.hex,
        //     $flags: { NoArgs: true },
        //     $textsig: "($self, /)",
        //     $doc:
        //         "Return a hexadecimal representation of a floating-point number.\n\n>>> (-0.1).hex()\n'-0x1.999999999999ap-4'\n>>> 3.14159.hex()\n'0x1.921f9f01b866ep+1'",
        // },
        is_integer: {
            $meth() {
                return new Sk.builtin.bool(Number.isInteger(this.v));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return True if the float is an integer.",
        },
        __getnewargs__: {
            $meth() {
                return new Sk.builtin.tuple([this]);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: Sk.builtin.none.none$,
        },
        __format__: {
            $meth: Sk.formatting.mkNumber__format__(true),
            $flags: { OneArg: true },
            $textsig: "($self, format_spec, /)",
            $doc: Sk.builtin.none.none$,
        },
    },
});

const invalidUnderscores = /_[eE]|[eE]_|\._|_\.|[+-]_|__/;
const validUnderscores = /_(?=[^_])/g;
function _str_to_float(str) {
    let ret;
    let tmp = str;
    if (str.indexOf("_") !== -1) {
        if (invalidUnderscores.test(str)) {
            throw new Sk.builtin.ValueError("could not convert string to float: '" + str + "'");
        }
        tmp = str.charAt(0) + str.substring(1).replace(validUnderscores, "");
    }

    if (str.match(/^-inf$/i)) {
        ret = -Infinity;
    } else if (str.match(/^[+]?inf$/i)) {
        ret = Infinity;
    } else if (str.match(/^[-+]?nan$/i)) {
        ret = NaN;
    } else if (!isNaN(tmp)) {
        ret = parseFloat(tmp);
        if (Number.isNaN(ret)) {
            ret = undefined;
        }
    }
    if (ret === undefined) {
        throw new Sk.builtin.ValueError("could not convert string to float: " + Sk.misceval.objectRepr(new Sk.builtin.str(str)));
    }
    return new Sk.builtin.float_(ret);
}

function cloneSelf() {
    return new Sk.builtin.float_(this.v);
}

/**
 * Checks for float subtypes, though skulpt does not allow to
 * extend them for now.
 *
 * Javascript function, returns Javascript object.
 * @param {Object} op The object to check as subtype.
 * @return {boolean} true if op is a subtype of Sk.builtin.float_, false otherwise
 */
Sk.builtin.float_.PyFloat_Check = function (op) {
    if (op === undefined) {
        return false;
    }
    // this is a little bit hacky
    // ToDo: subclassable builtins do not require this
    if (Sk.builtin.checkNumber(op)) {
        return true;
    }
    if (Sk.builtin.checkFloat(op)) {
        return true;
    }
    if (op.ob$type.$isSubType(Sk.builtin.float_)) {
        return true;
    }
    return false;
};

/**
 * Returns this instance's value as a string formatted using fixed-point notation.
 *
 * Javascript function, returns Javascript object.
 *
 * @param  {Object|number} x The numer of digits to appear after the decimal point.
 * @return {string}   The string representation of this instance's value.
 */
Sk.builtin.float_.prototype.toFixed = function (x) {
    x = Sk.builtin.asnum$(x);
    return this.v.toFixed(x);
};

function numberSlot(f) {
    return function (other) {
        const v = this.v;
        let w = other.v;
        if (typeof w === "number") {
            // pass
        } else if (JSBI.__isBigInt(w)) {
            w = fromBigIntToNumberOrOverflow(w);
        } else {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        return f(v, w);
    };
}

function ternarySlot(f) {
    const binSlot = numberSlot(f);
    return function (other, z) {
        if (z !== undefined && !Sk.builtin.checkNone(z)) {
            throw new Sk.builtin.TypeError("pow() 3rd argument not allowed unless all arguments are integers");
        }
        return binSlot.call(this, other);
    };
}

function divide(v, w) {
    if (w === 0) {
        throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
    }
    if (v === Infinity) {
        if (w === Infinity || v === -Infinity) {
            return new Sk.builtin.float_(NaN);
        } else if (w < 0) {
            return new Sk.builtin.float_(-Infinity);
        } else {
            return new Sk.builtin.float_(Infinity);
        }
    }
    if (v === -Infinity) {
        if (w === Infinity || v === -Infinity) {
            return new Sk.builtin.float_(NaN);
        } else if (w < 0) {
            return new Sk.builtin.float_(Infinity);
        } else {
            return new Sk.builtin.float_(-Infinity);
        }
    }
    return new Sk.builtin.float_(v / w);
}

function floordivide(v, w) {
    if (v === Infinity || v === -Infinity) {
        return new Sk.builtin.float_(NaN);
    }
    if (w === 0) {
        throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
    }

    if (w === Infinity) {
        if (v < 0) {
            return new Sk.builtin.float_(-1);
        } else {
            return new Sk.builtin.float_(0);
        }
    }
    if (w === -Infinity) {
        if (v < 0 || v !== 0) {
            return new Sk.builtin.float_(0);
        } else {
            return new Sk.builtin.float_(-1);
        }
    }
    return new Sk.builtin.float_(Math.floor(v / w));
}

function remainder(v, w) {
    if (w === 0) {
        throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
    }
    if (v === 0) {
        return new Sk.builtin.float_(0);
    }
    if (w === Infinity) {
        if (v === Infinity || this.v === -Infinity) {
            return new Sk.builtin.float_(NaN);
        } else if (v > 0) {
            return new Sk.builtin.float_(v);
        } else {
            return new Sk.builtin.float_(Infinity);
        }
    }

    //  Javacript logic on negatives doesn't work for Python... do this instead
    let tmp = v % w;

    if (v < 0) {
        if (w > 0 && tmp < 0) {
            tmp = tmp + w;
        }
    } else {
        if (w < 0 && tmp !== 0) {
            tmp = tmp + w;
        }
    }
    if (tmp === 0) {
        if (w < 0) {
            tmp = -0.0; // otherwise the sign gets lost by javascript modulo
        } else if (Infinity / tmp === -Infinity) {
            tmp = 0.0;
        }
    }
    return new Sk.builtin.float_(tmp);
}

function power(v, w) {
    if (v < 0 && w % 1 !== 0) {
        throw new Sk.builtin.ValueError("negative number cannot be raised to a fractional power");
    }
    if (v === 0 && w < 0) {
        throw new Sk.builtin.ZeroDivisionError("0.0 cannot be raised to a negative power");
    }

    const result = Math.pow(v, w);

    if (Math.abs(result) === Infinity && Math.abs(v) !== Infinity && Math.abs(w) !== Infinity) {
        throw new Sk.builtin.OverflowError("Numerical result out of range");
    }
    return new Sk.builtin.float_(result);
}

/**
 * Round this instance to a given number of digits, or zero if omitted.
 *
 * Implements `__round__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {pyObject=} ndigits The number of digits after the decimal point to which to round.
 * @return {Sk.builtin.float_|Sk.builtin.int_} The rounded float.
 *
 */
Sk.builtin.float_.prototype.round$ = function (ndigits) {
    var result, multiplier, number, num10, rounded, bankRound, ndigs;
    number = Sk.builtin.asnum$(this);
    if (ndigits === undefined) {
        ndigs = 0;
    } else {
        ndigs = Sk.misceval.asIndexSized(ndigits);
    }

    if (Sk.__future__.bankers_rounding) {
        num10 = number * Math.pow(10, ndigs);
        rounded = Math.round(num10);
        bankRound = (num10 > 0 ? num10 : -num10) % 1 === 0.5 ? (0 === rounded % 2 ? rounded : rounded - 1) : rounded;
        result = bankRound / Math.pow(10, ndigs);
        if (ndigits === undefined) {
            return new Sk.builtin.int_(result);
        } else {
            return new Sk.builtin.float_(result);
        }
    } else {
        multiplier = Math.pow(10, ndigs);
        result = Math.round(number * multiplier) / multiplier;

        return new Sk.builtin.float_(result);
    }
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
Sk.builtin.float_.prototype.str$ = function (base, sign) {
    var post;
    var pre;
    var idx;
    var tmp;
    var work;

    if (isNaN(this.v)) {
        return "nan";
    }

    if (sign === undefined) {
        sign = true;
    }

    if (this.v == Infinity) {
        return "inf";
    }
    if (this.v == -Infinity && sign) {
        return "-inf";
    }
    if (this.v == -Infinity && !sign) {
        return "inf";
    }

    work = sign ? this.v : Math.abs(this.v);

    if (base === undefined || base === 10) {
        if (Sk.__future__.python3) {
            tmp = work.toPrecision(16);
        } else {
            tmp = work.toPrecision(12);
        }

        // transform fractions with 4 or more leading zeroes into exponents
        idx = tmp.indexOf(".");
        pre = work.toString().slice(0, idx);
        post = work.toString().slice(idx);

        if (pre.match(/^-?0$/) && post.slice(1).match(/^0{4,}/)) {
            if (tmp.length < 12) {
                tmp = work.toExponential();
            } else {
                tmp = work.toExponential(11);
            }
        }

        if (tmp.indexOf("e") < 0 && tmp.indexOf(".") >= 0) {
            while (tmp.charAt(tmp.length - 1) == "0") {
                tmp = tmp.substring(0, tmp.length - 1);
            }
            if (tmp.charAt(tmp.length - 1) == ".") {
                tmp = tmp + "0";
            }
        }

        tmp = tmp.replace(new RegExp("\\.0+e"), "e", "i");
        // make exponent two digits instead of one (ie e+09 not e+9)
        tmp = tmp.replace(/(e[-+])([1-9])$/, "$10$2");
        // remove trailing zeroes before the exponent
        tmp = tmp.replace(/0+(e.*)/, "$1");
    } else {
        tmp = work.toString(base);
    }

    // restore negative zero sign
    if (this.v === 0 && 1 / this.v === -Infinity) {
        tmp = "-" + tmp;
    }

    if (tmp.indexOf(".") < 0 && tmp.indexOf("E") < 0 && tmp.indexOf("e") < 0) {
        tmp = tmp + ".0";
    }

    return tmp;
};

Sk.builtin.float_.py2$methods = {};

function fromBigIntToNumberOrOverflow(big) {
    const x = parseFloat(JSBI.toNumber(big));
    if (x == Infinity || x == -Infinity) {
        //trying to convert a large js string to a float
        throw new Sk.builtin.OverflowError("int too large to convert to float");
    }
    return x;
}
