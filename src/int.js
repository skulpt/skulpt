/**
 * @constructor
 * Sk.builtin.int_
 *
 * @param  {Number|BigInt|String} x
 *
 */
Sk.builtin.int_ = Sk.abstr.buildNativeClass("int", {
    constructor: function (x) {
        // internal function called with a javascript int/float/str
        // Sk.asserts.assert(this instanceof Sk.builtin.int_, "bad call to int use 'new'");
        if (typeof x === "number" || x instanceof JSBI) {
            this.v = x;
        } else if (typeof x === "string") {
            this.v = stringToNumberOrBig(x);
        } else if (x === undefined) {
            this.v = 0;
        } else {
            Sk.asserts.fail("bad argument to int constructor");
        }
    },
    slots: {
        tp$as_number: true,
        tp$doc:
            "int(x=0) -> integer\nint(x, base=10) -> integer\n\nConvert a number or string to an integer, or return 0 if no arguments\nare given.  If x is a number, return x.__int__().  For floating point\nnumbers, this truncates towards zero.\n\nIf x is not a number or if base is given, then x must be a string,\nbytes, or bytearray instance representing an integer literal in the\ngiven base.  The literal can be preceded by '+' or '-' and be surrounded\nby whitespace.  The base defaults to 10.  Valid bases are 0 and 2-36.\nBase 0 means to interpret the base from the string as an integer literal.\n>>> int('0b100', base=0)\n4",
        $r: function () {
            return new Sk.builtin.str(this.v.toString());
        },
        tp$hash: function () {
            return new Sk.builtin.int_(this.v);
            // todo we shouldn't really have hashes so big for longs...
        },
        tp$new: function (args, kwargs) {
            let x, base;
            if (args.length + (kwargs ? kwargs.length : 0) === 1) {
                x = args[0];
                base = Sk.builtin.none.none$;
            } else {
                args = Sk.abstr.copyKeywordsToNamedArgs("int", [null, "base"], args, kwargs, [new Sk.builtin.int_(0), Sk.builtin.none.none$]);
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
        tp$gettar: Sk.generic.getAttr, 

        tp$richcompare: function (other, op) {
            if (!(other instanceof Sk.builtin.int_) && !(other instanceof Sk.builtin.float_)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            let v = this.v;
            let w = other.v;
            if (v === w) {
                return numberCompare(0, 0, op);
            } else if (typeof v === "number" && typeof w === "number") {
                return numberCompare(v - w, 0, op);
            } else {
                v = bigUp(v);
                w = bigUp(w);
                return bigIntCompare(JSBI.subtract(w, v), JSBI.BigInt(0), op);
            }
        },

        nb$int_: cloneSelf,
        nb$index: cloneSelf,
        nb$float_: function () {
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
        nb$isnegative: function () {
            const v = this.v;
            if (typeof v === "number") {
                return v < 0;
            }
            return JSBI.lessThan(v, JSBI.BigInt(0));
        },
        nb$ispositive: function () {
            const v = this.v;
            if (typeof v === "number") {
                return v > 0;
            }
            return JSBI.greaterThan(v, JSBI.BigInt(0));
        },
        nb$bool: function () {
            return new Sk.builtin.bool(this.v !== 0); // should be fine not to check BigInt here
        },

        nb$positive: cloneSelf,

        nb$negative: numberUnarySlot(function (v, w) {
            return -v;
        }, JSBI.unaryMinus),

        nb$add: numberSlot(function (w, v) {
            return v + w;
        }, JSBI.add),
        nb$subtract: numberSlot(function (v, w) {
            return v - w;
        }, JSBI.subtract),
        nb$multiply: numberSlot(function (v, w) {
            return v * w;
        }, JSBI.multiply),
        nb$divide: function (other) {
            if (Sk.__future__.division) {
                return this.nb$float_().nb$divide(other);
            }
            return this.nb$floor_divide(other);
        },
        nb$floor_divide: numberDivisionSlot(function (v, w) {
            return Math.floor(v / w);
        }, JSBI.divide),
        nb$remainder: numberDivisionSlot(function (v, w) {
            return v - Math.floor(v / w) * w;
        }, JSBI.remainder),
        nb$divmod: function (other) {
            return new Sk.builtin.tuple([this.nb$floor_divide(other), this.nb$remainder(other)]);
        },
        nb$and: numberBitSlot(function (v, w) {
            return v & w;
        }, JSBI.bitwiseAnd),
        nb$or: numberBitSlot(function (v, w) {
            return v | w;
        }, JSBI.bitwiseOr),
        nb$xor: numberBitSlot(function (v, w) {
            return v ^ w;
        }, JSBI.bitwiseXor),

        nb$abs: numberUnarySlot(Math.abs, function (v){
            v.sign = false;
            return v;
        }),

        nb$lshift: numberShiftSlot(function (v, w) {
            if (w < 53) {
                const tmp = v * 2 * shiftconsts[w];
                if (numberOrStringWithinThreshold(tmp)) {
                    return tmp;
                }
                return;
            }
        }, JSBI.leftShift),
        nb$rshift: numberShiftSlot(function (v, w) {
            const tmp = v >> w;
            if (w > 0 && tmp < 0) {
                return tmp & (Math.pow(2, 32 - w) - 1);
            }
            return;
        }, JSBI.signedRightShift),

        nb$invert: numberUnarySlot(function (v) {
            return ~v;
        }, JSBI.bitwiseNot),
        nb$power: function (other, mod) {
            let ret;
            if (other instanceof Sk.builtin.int_ && (mod === undefined || mod instanceof Sk.builtin.int_)) {
                let v = this.v;
                let w = other.v;
                if (typeof v === "number" && typeof w === "number") {
                    const power = Math.pow(this.v, other.v);
                    if (numberOrStringWithinThreshold(power)) {
                        ret = w < 0 ? new Sk.builtin.float_(power) : new Sk.builtin.int_(power);
                    }
                }
                if (ret === undefined) {
                    v = bigUp(v);
                    w = bigUp(w);
                    ret = new Sk.builtin.int_(JSBI.exponentiate(v, w));
                }
                if (mod !== undefined) {
                    if (other.nb$isnegative()) {
                        throw new Sk.builtin.TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
                    }
                    return ret.nb$remainder(mod);
                } else {
                    return ret;
                }
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    getsets: {
        real: {
            $get: cloneSelf,
        },
        imag: {
            $get: function () {
                return new Sk.builtin.int_(0);
            },
        },
    },
    methods: {
        conjugate: {
            $meth: cloneSelf,
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Returns self, the complex conjugate of any int.",
        },
        bit_length: {
            $meth: function () {
                throw new Sk.builtin.NotImplementedError("Not yet implemented in Skulpt");
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Number of bits necessary to represent self in binary.\n\n>>> bin(37)\n'0b100101'\n>>> (37).bit_length()\n6",
        },
        to_bytes: {
            $meth: function () {
                throw new Sk.builtin.NotImplementedError("Not yet implemented in Skulpt");
            },
            $flags: { FastCall: true },
            $textsig: "($self, /, length, byteorder, *, signed=False)",
            $doc:
                "Return an array of bytes representing an integer.\n\n  length\n    Length of bytes object to use.  An OverflowError is raised if the\n    integer is not representable with the given number of bytes.\n  byteorder\n    The byte order used to represent the integer.  If byteorder is 'big',\n    the most significant byte is at the beginning of the byte array.  If\n    byteorder is 'little', the most significant byte is at the end of the\n    byte array.  To request the native byte order of the host system, use\n    `sys.byteorder' as the byte order value.\n  signed\n    Determines whether two's complement is used to represent the integer.\n    If signed is False and a negative integer is given, an OverflowError\n    is raised.",
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
            $meth: function (ndigits) {
                return this.round$(ndigits);
            },
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: null,
            $doc: "Rounding an Integral returns itself.\nRounding with an ndigits argument also returns an integer.",
        },
        __getnewargs__: {
            $meth: function () {
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
    proto: {
        str$: function (base, sign) {
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
        round$: function (ndigits) {
            if (ndigits !== undefined && !Sk.misceval.isIndex(ndigits)) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(ndigits) + "' object cannot be interpreted as an index");
            }
            return new Sk.builtin.int_(this.v);
        },
    },
});

Sk.exportSymbol("Sk.builtin.int_", Sk.builtin.int_);
/**
 * A function that will return either a number or a BigInt
 */
function numberSlot(number_func, bigint_func) {
    return function (other) {
        if (other.constructor === Sk.builtin.int_ || other instanceof Sk.builtin.int_) {
            let v = this.v;
            let w = other.v;
            if (typeof v === "number" && typeof w === "number") {
                const res = number_func(v, w);
                if (numberOrStringWithinThreshold(res)) {
                    return new Sk.builtin.int_(res);
                }
            }
            v = bigUp(v);
            w = bigUp(w);
            return new Sk.builtin.int_(convertIfSafe(bigint_func(v, w)));
        }
        return Sk.builtin.NotImplemented.NotImplemented$;
    };
}

function numberUnarySlot(number_func, bigint_func) {
    return function () {
        const v = this.v;
        if (typeof v === "number") {
            return new Sk.builtin.int_(number_func(v));
        }
        return new Sk.builtin.int_(bigint_func(v));
    };
}

function cloneSelf() {
    return new Sk.builtin.int_(this.v);
}

function numberDivisionSlot(number_func, bigint_func) {
    return function (other) {
        if (other.constructor === Sk.builtin.int_ || other instanceof Sk.builtin.int_) {
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
            return new Sk.builtin.int_(convertIfSafe(bigint_func(v, w)));
        }
        return Sk.builtin.NotImplemented.NotImplemented$;
    };
}

function numberShiftSlot(number_func, bigint_func) {
    return function (other) {
        if (other.constructor === Sk.builtin.int_ || other instanceof Sk.builtin.int_) {
            let v = this.v;
            let w = other.v;
            if (v === 0) {
                return this;
            }
            if (typeof w === "number") {
                if (w < 0) {
                    throw new Sk.builtin.ValueError("negative shift count");
                }
                if (typeof v === "number") {
                    const tmp = number_func(v, w);
                    if (tmp !== undefined) {
                        return new Sk.builtin.int_(tmp);
                    }
                }
                w = JSBI.BigInt(w);
            } else if (JSBI.lessThan(JSBI.BigInt(0))) {
                throw new Sk.builtin.ValueError("negative shift count");
            }
            v = bigUp(v);
            return new Sk.builtin.int_(convertIfSafe(bigint_func(v, w)));
        }
        return Sk.builtin.NotImplemented.NotImplemented$;
    };
}

function numberBitSlot(number_func, bigint_func) {
    return function (other) {
        if (other.constructor === Sk.builtin.int_ || other instanceof Sk.builtin.int_) {
            let v = this.v;
            let w = other.v;
            if (typeof v === "number" && typeof w === "number") {
                let tmp = number_func(v, w);
                if (tmp < 0) {
                    tmp = tmp + 4294967296; // convert back to unsigned
                }
                return new Sk.builtin.int_(tmp);
            }
            v = bigUp(v);
            w = bigUp(w);
            return new Sk.builtin.int_(convertIfSafe(bigint_func(v, w)));
        }
        return Sk.builtin.NotImplemented.NotImplemented$;
    };
}

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
    if (base instanceof JSBI) {
        base = JSBI.toNumber(base);
    }
    if (base < 2 || base > 36) {
        if (base !== 0) {
            throw new Sk.builtin.ValueError("int() base must be >= 2 and <= 36");
        }
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

Sk.longFromStr = function (s) {
    return new Sk.builtin.int_(stringToNumberOrBig(s));
};
Sk.exportSymbol("Sk.longFromStr", Sk.longFromStr);

/* jslint nomen: true, bitwise: true */
/* global Sk: true */
function numberOrStringWithinThreshold(v) {
    return v <= Number.MAX_SAFE_INTEGER && v >= -Number.MAX_SAFE_INTEGER;
}

Sk.builtin.int_.withinThreshold = numberOrStringWithinThreshold;

const MaxSafeBig = JSBI.BigInt(Number.MAX_SAFE_INTEGER);
const MaxSafeBigNeg = JSBI.BigInt(-Number.MAX_SAFE_INTEGER);
function convertIfSafe(v) {
    if (JSBI.lessThan(v, MaxSafeBig) && JSBI.greaterThan(v, MaxSafeBigNeg)) {
        return JSBI.toNumber(v);
    }
    return v;
}
function stringToNumberOrBig(s) {
    if (s <= Number.MAX_SAFE_INTEGER && s >= -Number.MAX_SAFE_INTEGER) {
        return +s;
    }
    return JSBI.BigInt(s);
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
    } else if (x.nb$int_) {
        // nb$int_ slot_wrapper takes care of checking nb$int
        // but it might be undefined if it's multiple inheritance
        res = x.nb$int_();
        if (res !== undefined) {
            return res;
        }
    }

    if ((func = Sk.abstr.lookupSpecial(x, Sk.builtin.str.$trunc))) {
        res = Sk.misceval.callsimArray(func, [x]);
        // check return type of magic methods
        if (!Sk.builtin.checkInt(res)) {
            throw new Sk.builtin.TypeError(Sk.builtin.str.$trunc.$jsstr() + " returned non-Integral (type " + Sk.abstr.typeName(x) + ")");
        }
        return new Sk.builtin.int_(res.v);
    }

    throw new Sk.builtin.TypeError("int() argument must be a string, a bytes-like object or a number, not '" + Sk.abstr.typeName(x) + "'");
}

/**
 *
 * We don't need to check the string here since str2number did that for us
 * @param {*} s
 * @param {*} base
 */
function fromStrToBigWithBase(s, base) {
    let neg = false;
    if (s[0] === "-") {
        neg = true;
        s = s.substring(1);
    }
    base = JSBI.BigInt(base);
    let power = JSBI.BigInt(1);
    let num = JSBI.BigInt(0);
    let toadd;
    for (let i = s.length - 1; i >= 0; i--) {
        toadd = JSBI.multiply(JSBI.BigInt(s[i]), power);
        num = JSBI.add(num, toadd);
        power = JSBI.multiply(power, base);
    }
    if (neg) {
        return JSBI.BigInt("-" + num.toString());
    }
    return num;
}

const shiftconsts = [
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
