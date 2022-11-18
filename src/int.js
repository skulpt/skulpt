/**
 *
 * @constructor
 * @extends {Sk.builtin.object}
 * @description
 * Function should only be called with a JS number|BigInt|String
 * If the number is a string then the size will be checked to determined whether it should be a number or BigInt
 * It assumed that a number passed it is within `Number.MaxSafeInteger`
 * Similarly if a BigInt is passed it is assumed that this is larger than `Number.MaxSafeInteger`
 * Internal code like `float.nb$int` checks the resulting JS instance before calling `new Sk.builtin.int_`
 *
 * @param  {number|JSBI|string=} x
 *
 */
Sk.builtin.int_ = Sk.abstr.buildNativeClass("int", {
    constructor: function int_(x) {
        Sk.asserts.assert(this instanceof Sk.builtin.int_, "bad call to int use 'new'");
        let v;
        if (typeof x === "number") {
            if (x > -6 && x < 257) {
                return INTERNED_INT[x];
            }
            v = x;
        } else if (JSBI.__isBigInt(x)) {
            v = x;
        } else if (x === undefined) {
            return INT_ZERO;
        } else if (typeof x === "string") {
            v = stringToNumberOrBig(x);
        } else if (x.nb$int) {
            return x.nb$int(); // allow this as a slow path
        } else {
            Sk.asserts.fail("bad argument to int constructor");
        }
        this.v = v;
    },
    slots: /** @lends {Sk.builtin.int_.prototype}*/ {
        tp$as_number: true,
        tp$doc: "int(x=0) -> integer\nint(x, base=10) -> integer\n\nConvert a number or string to an integer, or return 0 if no arguments\nare given.  If x is a number, return x.__int__().  For floating point\nnumbers, this truncates towards zero.\n\nIf x is not a number or if base is given, then x must be a string,\nbytes, or bytearray instance representing an integer literal in the\ngiven base.  The literal can be preceded by '+' or '-' and be surrounded\nby whitespace.  The base defaults to 10.  Valid bases are 0 and 2-36.\nBase 0 means to interpret the base from the string as an integer literal.\n>>> int('0b100', base=0)\n4",
        $r() {
            return new Sk.builtin.str(this.v.toString());
        },
        tp$hash() {
            const v = this.v;
            return typeof v === "number" ? v : JSBI.toNumber(JSBI.remainder(v, JSBI.__MAX_SAFE));
        },
        tp$new(args, kwargs) {
            let x, base;
            if (args.length + (kwargs ? kwargs.length : 0) === 1) {
                x = args[0];
                base = Sk.builtin.none.none$;
            } else {
                args = Sk.abstr.copyKeywordsToNamedArgs("int", [null, "base"], args, kwargs, [
                    INT_ZERO,
                    Sk.builtin.none.none$,
                ]);
                x = args[0];
                base = args[1];
            }
            x = getInt(x, base);

            if (this === Sk.builtin.int_.prototype) {
                return x;
            } else {
                const instance = new this.constructor();
                instance.v = x.v;
                return instance;
            }
        },
        tp$getattr: Sk.generic.getAttr,
        ob$eq: compareSlot((v, w) => v == w, JSBI.equal),
        ob$ne: compareSlot((v, w) => v != w, JSBI.notEqual),
        ob$gt: compareSlot((v, w) => v > w, JSBI.greaterThan),
        ob$ge: compareSlot((v, w) => v >= w, JSBI.greaterThanOrEqual),
        ob$lt: compareSlot((v, w) => v < w, JSBI.lessThan),
        ob$le: compareSlot((v, w) => v <= w, JSBI.lessThanOrEqual),

        nb$int: cloneSelf,
        nb$index() {
            return this.v;
        },
        nb$float() {
            const v = this.v;
            if (typeof v === "number") {
                return new Sk.builtin.float_(v);
            } else {
                const x = parseFloat(JSBI.toNumber(v));
                if (x === Infinity || x === -Infinity) {
                    throw new Sk.builtin.OverflowError("int too large to convert to float");
                }
                return new Sk.builtin.float_(x);
            }
        },
        nb$isnegative() {
            const v = this.v;
            return typeof v === "number" ? v < 0 : JSBI.lessThan(v, JSBI.__ZERO);
        },
        nb$ispositive() {
            const v = this.v;
            return typeof v === "number" ? v >= 0 : JSBI.greaterThanOrEqual(v, JSBI.__ZERO);
        },
        nb$bool() {
            return this.v !== 0; // should be fine not to check BigInt here
        },

        nb$positive: cloneSelf,

        nb$negative: numberUnarySlot((v) => -v, JSBI.unaryMinus),

        nb$add: numberSlot(
            (v, w) => v + w,
            (v, w) => JSBI.numberIfSafe(JSBI.add(v, w))
        ),
        nb$subtract: numberSlot(
            (v, w) => v - w,
            (v, w) => JSBI.numberIfSafe(JSBI.subtract(v, w))
        ),
        nb$multiply: numberSlot(
            (v, w) => v * w,
            (v, w) => (v === JSBI.__ZERO || w === JSBI.__ZERO ? 0 : JSBI.multiply(v, w))
        ),
        nb$divide: trueDivide,
        nb$floor_divide: numberDivisionSlot((v, w) => Math.floor(v / w), BigIntFloorDivide),
        nb$remainder: numberDivisionSlot(
            (v, w) => v - Math.floor(v / w) * w,
            (v, w) => JSBI.subtract(v, JSBI.multiply(w, BigIntFloorDivide(v, w)))
        ),
        nb$divmod(other) {
            const floor = this.nb$floor_divide(other);
            const remainder = this.nb$remainder(other);
            if (
                floor === Sk.builtin.NotImplemented.NotImplemented$ ||
                remainder === Sk.builtin.NotImplemented.NotImplemented$
            ) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            return new Sk.builtin.tuple([floor, remainder]);
        },
        nb$and: numberBitSlot((v, w) => v & w, JSBI.bitwiseAnd),
        nb$or: numberBitSlot((v, w) => v | w, JSBI.bitwiseOr),
        nb$xor: numberBitSlot((v, w) => v ^ w, JSBI.bitwiseXor),

        nb$abs: numberUnarySlot(Math.abs, BigIntAbs),

        nb$lshift: numberShiftSlot((v, w) => {
            const tmp = v * 2 * shiftconsts[w];
            if (numberOrStringWithinThreshold(tmp)) {
                return tmp;
            }
            return undefined; // fall through to using BigInt shift
        }, JSBI.leftShift),
        nb$rshift: numberShiftSlot(
            (v, w) => {
                // Avoid forced signed 32 bit conversion and just divide.
                Math.floor(v / shiftconsts[w + 1]);
            },
            (v, w) => JSBI.numberIfSafe(JSBI.signedRightShift(v, w))
        ),

        nb$invert: numberUnarySlot(
            (v) => (Math.abs(v) < 2 ** 31 ? ~v : undefined),
            (v) => JSBI.numberIfSafe(JSBI.bitwiseNot(v))
        ),
        nb$power(other, mod) {
            let ret;
            if (mod === undefined) {
                // pass
            } else if (Sk.builtin.checkNone(mod)) {
                mod = undefined;
            }
            if (!(other instanceof Sk.builtin.int_) || (mod !== undefined && !(mod instanceof Sk.builtin.int_))) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            const wNeg = other.nb$isnegative();
            if (wNeg && mod === undefined) {
                return this.nb$float().nb$power(other.nb$float());
            }
            let v = this.v;
            let w = other.v;
            if (typeof v === "number" && typeof w === "number") {
                const power = Math.pow(v, w);
                if (numberOrStringWithinThreshold(power)) {
                    ret = new Sk.builtin.int_(power);
                    if (mod === undefined) {
                        return ret;
                    }
                }
            }
            if (mod !== undefined) {
                if (wNeg) {
                    /** @todo - python 3.8 supports this - https://github.com/python/cpython/pull/13266 */
                    throw new Sk.builtin.ValueError(
                        "pow() 2nd argument cannot be negative when 3rd argument specified"
                    );
                } else if (mod.v === 0) {
                    throw new Sk.builtin.ValueError("pow() 3rd argument cannot be 0");
                }
                if (ret !== undefined) {
                    return ret.nb$remainder(mod);
                }
                return new Sk.builtin.int_(JSBI.powermod(bigUp(v), bigUp(w), bigUp(mod.v)));
            }
            // if we're here then we've fallen through so do bigint exponentiate
            return new Sk.builtin.int_(JSBI.exponentiate(bigUp(v), bigUp(w)));
        },
        nb$long() {
            return new Sk.builtin.lng(this.v);
        },
    },
    getsets: /** @lends {Sk.builtin.int_.prototype}*/ {
        real: {
            $get: cloneSelf,
            $doc: "the real part of a complex number",
        },
        imag: {
            $get() {
                return INT_ZERO;
            },
            $doc: "the imaginary part of a complex number",
        },
    },
    classmethods: {
        from_bytes: {
            $meth(args, kws) {
                Sk.abstr.checkArgsLen("from_bytes", args, 0, 2);
                let [bytes, byteorder, signed] = Sk.abstr.copyKeywordsToNamedArgs(
                    "from_bytes",
                    ["bytes", "byteorder", "signed"],
                    args,
                    kws,
                    [Sk.builtin.bool.false$]
                );
                const littleEndian = isLittleEndian(byteorder);
                if (!(bytes instanceof Sk.builtin.bytes)) {
                    // not quite right - we should call pyObjectBytes - which fails on integers
                    // but good enough for now
                    bytes = Sk.misceval.callsimArray(Sk.builtin.bytes, [bytes]);
                }
                if (Sk.misceval.isTrue(signed)) {
                    /** @todo - from_bytes with signed=True */
                    throw new Sk.builtin.NotImplementedError(
                        "from_bytes with signed=True is not yet implemented in Skulpt"
                    );
                }
                const uint8 = bytes.valueOf();
                const hex = [];
                uint8.forEach((x) => {
                    hex.push(x.toString(16).padStart(2, "0"));
                });
                if (littleEndian) {
                    hex.reverse();
                }
                const asInt = new Sk.builtin.int_(JSBI.numberIfSafe(JSBI.BigInt("0x" + (hex.join("") || "0"))));
                if (this === Sk.builtin.int_) {
                    return asInt;
                } else {
                    return Sk.misceval.callsimArray(this, [asInt]);
                }
            },
            $flags: { FastCall: true },
        },
    },
    methods: /** @lends {Sk.builtin.int_.prototype}*/ {
        conjugate: {
            $meth: cloneSelf,
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Returns self, the complex conjugate of any int.",
        },
        bit_length: {
            $meth() {
                let v = this.v;
                if (v === 0) {
                    return new Sk.builtin.int_(0);
                }
                v = typeof v === "number" ? Math.abs(v) : BigIntAbs(v);
                return new Sk.builtin.int_(v.toString(2).length);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Number of bits necessary to represent self in binary.\n\n>>> bin(37)\n'0b100101'\n>>> (37).bit_length()\n6",
        },
        to_bytes: {
            $meth(args, kws) {
                Sk.abstr.checkArgsLen("to_bytes", args, 0, 2);
                let [length, byteorder, signed] = Sk.abstr.copyKeywordsToNamedArgs(
                    "to_bytes",
                    ["length", "byteorder", "signed"],
                    args,
                    kws,
                    [Sk.builtin.bool.false$]
                );
                const littleEndian = isLittleEndian(byteorder);
                length = Sk.misceval.asIndexSized(length, Sk.builtin.OverflowError);
                if (length < 0) {
                    throw new Sk.builtin.ValueError("length argument must be non-negative");
                }
                if (Sk.misceval.isTrue(signed)) {
                    /** @todo - to_bytes with signed=True */
                    throw new Sk.builtin.NotImplementedError(
                        "to_bytes with signed=True is not yet implemented in Skulpt"
                    );
                }
                if (this.nb$isnegative()) {
                    throw new Sk.builtin.OverflowError("can't convert negative int to unsigned");
                }
                let hex = JSBI.BigInt(this.v).toString(16);
                if (hex.length % 2) {
                    hex = "0" + hex;
                }
                const len = hex.length / 2;
                if (len > length) {
                    if (length === 0 && hex === "00") {
                        return new Sk.builtin.bytes();
                    }
                    throw new Sk.builtin.OverflowError("int too big to convert");
                }

                const u8 = new Array(length).fill(0);
                let i = length - len;
                let j = 0;

                while (i < length) {
                    u8[i] = parseInt(hex.slice(j, j + 2), 16);
                    i += 1;
                    j += 2;
                }

                if (littleEndian) {
                    u8.reverse();
                }
                return new Sk.builtin.bytes(u8);
            },
            $flags: { FastCall: true },
            $textsig: "($self, /, length, byteorder, *, signed=False)",
            $doc: "Return an array of bytes representing an integer.\n\n  length\n    Length of bytes object to use.  An OverflowError is raised if the\n    integer is not representable with the given number of bytes.\n  byteorder\n    The byte order used to represent the integer.  If byteorder is 'big',\n    the most significant byte is at the beginning of the byte array.  If\n    byteorder is 'little', the most significant byte is at the end of the\n    byte array.  To request the native byte order of the host system, use\n    `sys.byteorder' as the byte order value.\n  signed\n    Determines whether two's complement is used to represent the integer.\n    If signed is False and a negative integer is given, an OverflowError\n    is raised.",
        },
        __trunc__: {
            $meth: cloneSelf,
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Truncating an Integral returns itself.",
        },
        __floor__: {
            $meth: cloneSelf,
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Flooring an Integral returns itself.",
        },
        __ceil__: {
            $meth: cloneSelf,
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Ceiling of an Integral returns itself.",
        },
        __round__: {
            $meth(ndigits) {
                return this.round$(ndigits);
            },
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: null,
            $doc: "Rounding an Integral returns itself.\nRounding with an ndigits argument also returns an integer.",
        },
        __getnewargs__: {
            $meth() {
                return new Sk.builtin.tuple([new Sk.builtin.int_(this.v)]);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: Sk.builtin.none.none$,
        },
        __format__: {
            $meth: Sk.formatting.mkNumber__format__(false),
            $flags: { OneArg: true },
            $textsig: "($self, format_spec, /)",
            $doc: Sk.builtin.none.none$,
        },
    },
    proto: /** @lends {Sk.builtin.int_.prototype}*/ {
        str$(base, sign) {
            let tmp;
            if (base === undefined || base === 10) {
                tmp = this.v.toString();
            } else {
                tmp = this.v.toString(base);
            }
            if (sign || sign === undefined) {
                return tmp;
            } else if (tmp[0] === "-") {
                tmp = tmp.substring(1);
            }
            return tmp;
        },
        round$(ndigits) {
            if (ndigits === undefined) {
                ndigits = 0;
            } else {
                ndigits = Sk.misceval.asIndexSized(ndigits);
            }
            const v = this.v;
            if (ndigits >= 0) {
                return new Sk.builtin.int_(v);
            }
            if (typeof v !== "number") {
                return BigIntRound(v, ndigits);
            }
            const multiplier = Math.pow(10, -ndigits);
            if (multiplier / 10 > Math.abs(v)) {
                return new Sk.builtin.int_(0);
            }
            if (!Sk.__future__.bankers_rounding) {
                return new Sk.builtin.int_(Math.round(v / multiplier) * multiplier);
            }
            const num10 = v / multiplier;
            const rounded = Math.round(num10);
            const bankRound =
                (num10 > 0 ? num10 : -num10) % 1 === 0.5 ? (0 === rounded % 2 ? rounded : rounded - 1) : rounded;
            const result = bankRound * multiplier;
            return new Sk.builtin.int_(result);
        },
        valueOf() {
            return this.v;
        },
        // flag to determine inheritance of ints without instanceof
        sk$int: true,
    },
});

Sk.exportSymbol("Sk.builtin.int_", Sk.builtin.int_);
/**
 * A function that will return either a number or a BigInt
 *
 * There are two functions passed to this slot the quick function where both int values are number
 * and the JSBI.BigInt version of the same function
 * The fall through case where one or both of the int values is a bigint
 * @ignore
 *
 * @private
 *
 * @param {Function} number_func
 * @param {Function} bigint_func
 */
function numberSlot(number_func, bigint_func) {
    /**
     * @this {Sk.builtin.int_}
     *
     * @param {Sk.builtin.int_|Sk.builtin.object} other
     * @return {Sk.builtin.int_|Sk.builtin.NotImplemented}
     */
    return function (other) {
        if (!(other instanceof Sk.builtin.int_)) {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        /**@type {number|JSBI} */
        let v = this.v;
        /**@type {number|JSBI} */
        let w = other.v;
        if (typeof v === "number" && typeof w === "number") {
            const res = number_func(v, w);
            if (numberOrStringWithinThreshold(res)) {
                return new Sk.builtin.int_(res);
            }
        }
        v = bigUp(v);
        w = bigUp(w);
        return new Sk.builtin.int_(bigint_func(v, w));
    };
}

function compareSlot(number_func, bigint_func) {
    return function (other) {
        if (!(other instanceof Sk.builtin.int_)) {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        let v = this.v;
        let w = other.v;
        if (typeof v === "number" && typeof w === "number") {
            return number_func(v, w);
        }
        v = bigUp(v);
        w = bigUp(w);
        return bigint_func(v, w);
    };
}

/**
 *
 * @param {function(number): number} number_func
 * @param {function(JSBI): JSBI} bigint_func
 * @ignore
 *
 */
function numberUnarySlot(number_func, bigint_func) {
    /**
     * @this {Sk.builtin.int_}
     * @return {Sk.builtin.int_}
     */
    function doUnarySlot() {
        let v = this.v;
        if (typeof v === "number") {
            const res = number_func(v);
            if (res !== undefined) {
                return new Sk.builtin.int_(res);
            }
            v = bigUp(v);
        }
        // fallthrough
        return new Sk.builtin.int_(bigint_func(v));
    }
    return doUnarySlot;
}

function cloneSelf() {
    return new Sk.builtin.int_(this.v);
}

const DBL_MANT_DIG = Math.log2(Number.MAX_SAFE_INTEGER);
const DBL_MAX_EXP = JSBI.BigInt(Math.floor(Math.log2(Number.MAX_VALUE)));
const DBL_MIN_EXP = Math.ceil(Math.log2(Number.MIN_VALUE));
const BIG_2 = JSBI.BigInt(2);
const BIG_1 = JSBI.BigInt(1);
const DBL_MIN_OVERFLOW = JSBI.subtract(
    JSBI.exponentiate(BIG_2, DBL_MAX_EXP),
    JSBI.exponentiate(BIG_2, JSBI.subtract(DBL_MAX_EXP, JSBI.add(JSBI.BigInt(DBL_MANT_DIG), BIG_1)))
);

function trueDivide(other) {
    if (!Sk.__future__.python3) {
        return this.nb$floor_divide(other);
    }
    if (!(other instanceof Sk.builtin.int_)) {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
    let v = this.v;
    let w = other.v;
    if (w === 0) {
        throw new Sk.builtin.ZeroDivisionError("division by zero");
    }
    if (typeof v === "number" && typeof w === "number") {
        return new Sk.builtin.float_(v / w);
    }

    // slow case do what we gotta do
    // algorithm taken from test_long.py
    v = bigUp(v);
    w = bigUp(w);
    const negative = JSBI.lessThan(JSBI.bitwiseXor(v, w), JSBI.__ZERO);
    if (JSBI.equal(v, JSBI.__ZERO)) {
        return new Sk.builtin.float_(negative ? -0.0 : 0.0);
    }
    v = BigIntAbs(v);
    w = BigIntAbs(w);
    if (JSBI.greaterThanOrEqual(v, JSBI.multiply(DBL_MIN_OVERFLOW, w))) {
        throw new Sk.builtin.OverflowError("int/int too large to represent as a float");
    }
    let diff = v.toString(2).length - w.toString(2).length;
    const absBigDiff = JSBI.BigInt(diff < 0 ? -diff : diff);

    if (
        (diff >= 0 && JSBI.greaterThanOrEqual(v, JSBI.multiply(JSBI.exponentiate(BIG_2, absBigDiff), w))) ||
        (diff < 0 && JSBI.greaterThanOrEqual(JSBI.multiply(v, JSBI.exponentiate(BIG_2, absBigDiff)), w))
    ) {
        diff += 1;
    }
    const exp = Math.max(diff, DBL_MIN_EXP) - DBL_MANT_DIG;
    v = JSBI.leftShift(v, JSBI.BigInt(Math.max(-exp, 0)));
    w = JSBI.leftShift(w, JSBI.BigInt(Math.max(exp, 0)));

    let q = JSBI.divide(v, w);
    const r = JSBI.remainder(v, w);

    const doubleR = JSBI.multiply(BIG_2, r);
    if (JSBI.greaterThan(doubleR, w) || (JSBI.equal(doubleR, w) && JSBI.equal(JSBI.remainder(q, BIG_2), BIG_1))) {
        q = JSBI.add(q, BIG_1);
    }
    q = JSBI.toNumber(q);
    if (q === Infinity || q === -Infinity) {
        throw new Sk.builtin.OverflowError("int/int too large to represent as a float");
    }
    let res = q * Math.pow(2, exp);
    res = negative ? -res : res;
    return new Sk.builtin.float_(res);
}

function numberDivisionSlot(number_func, bigint_func) {
    return function (other) {
        if (!(other instanceof Sk.builtin.int_)) {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        let v = this.v;
        let w = other.v;
        if (w === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }
        if (typeof v === "number" && typeof w === "number") {
            // it's integer division so no need to check if the number got bigger!
            return new Sk.builtin.int_(number_func(v, w));
        }
        v = bigUp(v);
        w = bigUp(w);
        return new Sk.builtin.int_(JSBI.numberIfSafe(bigint_func(v, w)));
    };
}

function numberShiftSlot(number_func, bigint_func) {
    return function (other) {
        if (!(other instanceof Sk.builtin.int_)) {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        const wNeg = other.nb$isnegative();
        if (wNeg) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        let v = this.v;
        if (v === 0) {
            return new Sk.builtin.int_(0);
        }
        let w = other.v;
        if (typeof v === "number" && typeof w === "number" && w < 53) {
            // we use the shiftconsts below in the implementation for << and >>
            const ret = number_func(v, w);
            if (ret !== undefined) {
                return new Sk.builtin.int_(ret);
            }
        }
        v = bigUp(v);
        w = bigUp(w);
        return new Sk.builtin.int_(bigint_func(v, w)); // can't convert if safe for leftshift
    };
}

function numberBitSlot(number_func, bigint_func) {
    return function (other) {
        if (!(other instanceof Sk.builtin.int_)) {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        let v = this.v;
        let w = other.v;
        if (typeof v === "number" && typeof w === "number" && Math.abs(v) < 2 ** 31 && Math.abs(w) < 2 ** 31) {
            return new Sk.builtin.int_(number_func(v, w));
        }
        v = bigUp(v);
        w = bigUp(w);
        return new Sk.builtin.int_(JSBI.numberIfSafe(bigint_func(v, w)));
    };
}

function BigIntAbs(v) {
    return JSBI.lessThan(v, JSBI.__ZERO) ? JSBI.unaryMinus(v) : v;
}

function BigIntFloorDivide(v, w) {
    if (JSBI.greaterThanOrEqual(JSBI.bitwiseXor(v, w), JSBI.__ZERO)) {
        return JSBI.divide(v, w);
    }
    // make the numerator smaller and then subtract 1 from the answer to round down.
    if (JSBI.lessThan(v, JSBI.__ZERO)) {
        v = JSBI.add(v, BIG_1);
    } else {
        v = JSBI.subtract(v, BIG_1);
    }
    return JSBI.subtract(JSBI.divide(v, w), BIG_1);
}

function BigIntRound(v, ndigits) {
    // Get absolute versions. We'll deal with the negatives later.
    const isNeg = JSBI.lessThan(v, JSBI.__ZERO);
    if (isNeg) {
        v = JSBI.unaryMinus(v);
    }
    const BigMultiplier = JSBI.exponentiate(JSBI.BigInt(10), JSBI.unaryMinus(JSBI.BigInt(ndigits)));

    let result = JSBI.divide(v, BigMultiplier);
    const rem = JSBI.remainder(v, BigMultiplier);

    // if remainder > half divisor
    const doubleRem = JSBI.multiply(rem, BIG_2);
    if (JSBI.greaterThan(doubleRem, BigMultiplier)) {
        result = JSBI.add(result, BIG_1);
        // We should have rounded up instead of down.
    } else if (JSBI.equal(doubleRem, BigMultiplier)) {
        // If the remainder is exactly half the divisor, it means that the result is
        // exactly in between two numbers and we need to apply a specific rounding
        // method.
        if (!Sk.__future__.bankers_rounding) {
            result = JSBI.add(result, BIG_1);
        } else if (JSBI.equal(JSBI.remainder(result, BIG_2), BIG_1)) {
            // Add 1 if result is odd to get an even return value
            result = JSBI.add(result, BIG_1);
        }
    }

    result = JSBI.multiply(result, BigMultiplier);
    if (isNeg) {
        result = JSBI.unaryMinus(result);
    }
    return new Sk.builtin.int_(result);
}

const validUnderscores = /_(?=[^_])/g;
/**
 * Takes a JavaScript string and returns a number using the parser and negater
 *  functions (for int/long right now)
 * @param  {string} s       Javascript string to convert to a number.
 * @param  {number|string=} base    The base of the number.
 */
Sk.str2number = function (s, base) {
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
            throw new Sk.builtin.ValueError("int() base must be >= 2 and <= 36");
        }
    }
    if (typeof base === "string") {
        base = Number(base); // keep closure happy for parseInt
    }

    if (s.substring(0, 2).toLowerCase() === "0x") {
        if (base === 16 || base === 0) {
            s = s.substring(2);
            base = 16;
        } else if (base < 34) {
            throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0b") {
        if (base === 2 || base === 0) {
            s = s.substring(2);
            base = 2;
        } else if (base < 12) {
            throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0o") {
        if (base === 8 || base === 0) {
            s = s.substring(2);
            base = 8;
        } else if (base < 25) {
            throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + origs + "'");
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

    if (s.indexOf("_") !== -1) {
        if (s.indexOf("__") !== -1) {
            throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + origs + "'");
        }

        if (base !== 10) {
            s = s.replace(validUnderscores, "");
        } else {
            // avoid replacing initial `_` if present
            // workaround since closure-compiler errors on lookbehinds
            s = s.charAt(0) + s.substring(1).replace(validUnderscores, "");
        }
    }

    if (s.length === 0) {
        throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + origs + "'");
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
            throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + origs + "'");
        }
    }

    if (neg) {
        s = "-" + s;
    }
    val = parseInt(s, base);
    if (numberOrStringWithinThreshold(val)) {
        return val; // will convert our string to a number
    }
    return fromStrToBigWithBase(s, base);
};

Sk.builtin.int_.py2$methods = {};

/**
 *
 * @param {string} s
 * @param {number=} base
 */
Sk.longFromStr = function (s, base) {
    if (Sk.__future__.python3) {
        return new Sk.builtin.int_(stringToNumberOrBig(s));
    } else {
        const num = Sk.str2number(s, base);
        return new Sk.builtin.lng(num);
    }
};
Sk.exportSymbol("Sk.longFromStr", Sk.longFromStr);

function numberOrStringWithinThreshold(v) {
    return v <= Number.MAX_SAFE_INTEGER && v >= -Number.MAX_SAFE_INTEGER;
}

Sk.builtin.int_.withinThreshold = numberOrStringWithinThreshold;

function stringToNumberOrBig(s) {
    if (s <= Number.MAX_SAFE_INTEGER && s >= -Number.MAX_SAFE_INTEGER) {
        return +s;
    }
    return JSBI.BigInt(s);
}

Sk.builtin.int_.stringToNumberOrBig = stringToNumberOrBig;

function bigUp(v) {
    if (typeof v === "number") {
        return JSBI.BigInt(v);
    }
    return v;
}

function getInt(x, base) {
    let func, res;
    // if base is not of type int, try calling .__index__
    if (base !== Sk.builtin.none.none$) {
        base = Sk.misceval.asIndexOrThrow(base);
    } else {
        base = null;
    }

    if (x instanceof Sk.builtin.str) {
        if (base === null) {
            base = 10;
        }
        return new Sk.builtin.int_(Sk.str2number(x.v, base));
    } else if (base !== null) {
        throw new Sk.builtin.TypeError("int() can't convert non-string with explicit base");
    } else if (x.nb$int !== undefined) {
        return x.nb$int();
    } else if (x.nb$index !== undefined) {
        return new Sk.builtin.int_(x.nb$index());
    }

    if ((func = Sk.abstr.lookupSpecial(x, Sk.builtin.str.$trunc))) {
        res = Sk.misceval.callsimArray(func, []);
        // check return type of magic methods
        if (!Sk.builtin.checkInt(res)) {
            throw new Sk.builtin.TypeError(
                Sk.builtin.str.$trunc.$jsstr() + " returned non-Integral (type " + Sk.abstr.typeName(x) + ")"
            );
        }
        return new Sk.builtin.int_(res.v);
    }

    throw new Sk.builtin.TypeError(
        "int() argument must be a string, a bytes-like object or a number, not '" + Sk.abstr.typeName(x) + "'"
    );
}

/**
 *
 * We don't need to check the string has valid digits since str2number did that for us
 * @param {*} s
 * @param {*} base
 * @ignore
 */
function fromStrToBigWithBase(s, base) {
    let neg = false;
    if (s[0] === "-") {
        neg = true;
        s = s.substring(1);
    }
    base = JSBI.BigInt(base);
    let power = BIG_1;
    let num = JSBI.__ZERO;
    let toadd, val;
    for (let i = s.length - 1; i >= 0; i--) {
        val = s.charCodeAt(i);
        if (val >= 48 && val <= 57) {
            // 0-9
            val = val - 48;
        } else if (val >= 65 && val <= 90) {
            // A-Z
            val = val - 65 + 10;
        } else if (val >= 97 && val <= 122) {
            // a-z
            val = val - 97 + 10;
        }
        toadd = JSBI.multiply(JSBI.BigInt(val), power);
        num = JSBI.add(num, toadd);
        power = JSBI.multiply(power, base);
    }
    if (neg) {
        num = JSBI.multiply(num, JSBI.BigInt(-1));
    }
    return num;
}

const shiftconsts = [
    0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288,
    1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824,
    2147483648, 4294967296, 8589934592, 17179869184, 34359738368, 68719476736, 137438953472, 274877906944,
    549755813888, 1099511627776, 2199023255552, 4398046511104, 8796093022208, 17592186044416, 35184372088832,
    70368744177664, 140737488355328, 281474976710656, 562949953421312, 1125899906842624, 2251799813685248,
    4503599627370496, 9007199254740992,
];

/**
 * @constructor
 *
 * @description
 * This is only for backward compatibility with py2.
 * We take the approach of using a trivial subclass with int and overriding a few methods
 *
 * @param {number|string|JSBI} x
 * @extends {Sk.builtin.int_}
 * @ignore
 */
Sk.builtin.lng = Sk.abstr.buildNativeClass("long", {
    base: Sk.builtin.int_, // not technically correct but makes backward compatibility easy
    constructor: function lng (x) {
        let ret = Sk.builtin.int_.call(this, x);
        if (ret !== undefined) {
            // using an interned int
            this.v = ret.v;
        }
    },
    slots: /** @lends {Sk.builtin.lng.prototype} */ {
        $r() {
            return new Sk.builtin.str(this.v.toString() + "L");
        },
        tp$as_number: true,
        nb$negative() {
            return new Sk.builtin.lng(intProto.nb$negative.call(this).v);
        },
        nb$positive() {
            return new Sk.builtin.lng(intProto.nb$positive.call(this).v);
        },
    },
});

const intProto = Sk.builtin.int_.prototype;


const INTERNED_INT = [];
for (let i = -5; i < 257; i++) {
    INTERNED_INT[i] = Object.create(Sk.builtin.int_.prototype, {v: {value: i}});
}
const INT_ZERO = INTERNED_INT[0];

// from_bytes and to_bytes
function isLittleEndian(byteorder) {
    if (!Sk.builtin.checkString(byteorder)) {
        throw new Sk.builtin.TypeError("'byteorder' must be str, not " + Sk.abstr.typeName(byteorder));
    }
    byteorder = byteorder.toString();
    if (byteorder === "little") {
        return 1;
    } else if (byteorder === "big") {
        return 0;
    } else {
        throw new Sk.builtin.ValueError("byteorder must be either 'little' or 'big'");
    }
}