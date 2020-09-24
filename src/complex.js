/**
 * @description
 * see [Cpython complex_new](https://hg.python.org/cpython/file/f0e2caad4200/Objects/complexobject.c#l911)
 * @constructor
 * @param {number} real part of the complex number
 * @param {number} imag part of the complex number
 *
 * Prefering here == instead of ===, otherwise also undefined has to be matched explicitly
 * @extends {Sk.builtin.object}
 *
 */
Sk.builtin.complex = Sk.abstr.buildNativeClass("complex", {
    constructor: function complex(real, imag) {
        Sk.asserts.assert(this instanceof Sk.builtin.complex, "bad call to complex constructor, use 'new'");
        this.real = real;
        this.imag = imag;
    },
    slots: /**@lends {Sk.builtin.complex.prototype}*/ {
        tp$as_number: true,
        tp$doc:
            "Create a complex number from a real part and an optional imaginary part.\n\nThis is equivalent to (real + imag*1j) where imag defaults to 0.",
        tp$hash() {
            // _PyHASH_IMAG refers to _PyHASH_MULTIPLIER which refers to 1000003
            const real_hash = new Sk.builtin.float_(this.real).tp$hash();
            const imag_hash = new Sk.builtin.float_(this.imag).tp$hash();
            const v = imag_hash * 1003 + real_hash;
            if (Sk.builtin.int_.withinThreshold(v)) {
                return v;
            }
            return new Sk.builtin.int_(JSBI.BigInt(v)).tp$hash();
        },
        tp$getattr: Sk.generic.getAttr,
        tp$new(args, kwargs) {
            args = Sk.abstr.copyKeywordsToNamedArgs("complex", ["real", "imag"], args, kwargs, [null, null]);
            return complex_from_py.call(this, args[0], args[1]);
        },
        tp$richcompare(w, op) {
            if (op !== "Eq" && op !== "NotEq") {
                if (Sk.builtin.checkNumber(w) || _complex_check(w)) {
                    throw new Sk.builtin.TypeError("no ordering relation is defined for complex numbers");
                }
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            return complexNumberSlot(function (a_real, a_imag, b_real, b_imag) {
                const equal = a_real == b_real && a_imag == b_imag;
                return op === "Eq" ? equal : !equal;
            }, true).call(this, w);
        },
        $r() {
            return complex_format(this, null, "g");
        },

        // number slots
        nb$int() {
            throw new Sk.builtin.TypeError("can't convert complex to int");
        },
        nb$long() {
            throw new Sk.builtin.TypeError("can't convert complex to long");
        },
        nb$float() {
            throw new Sk.builtin.TypeError("can't convert complex to float");
        },
        nb$positive() {
            return new Sk.builtin.complex(this.real, this.imag);
        },
        nb$negative() {
            return new Sk.builtin.complex(-this.real, -this.imag);
        },
        nb$bool() {
            return this.real || this.imag;
        },
        nb$add: complexNumberSlot((a_real, a_imag, b_real, b_imag) => {
            return new Sk.builtin.complex(a_real + b_real, a_imag + b_imag);
        }),
        nb$subtract: complexNumberSlot((a_real, a_imag, b_real, b_imag) => {
            return new Sk.builtin.complex(a_real - b_real, a_imag - b_imag);
        }),
        nb$reflected_subtract: complexNumberSlot((a_real, a_imag, b_real, b_imag) => {
            return new Sk.builtin.complex(b_real - a_real, b_imag - a_imag);
        }),
        nb$multiply: complexNumberSlot((a_real, a_imag, b_real, b_imag) => {
            return new Sk.builtin.complex(b_real * a_real - b_imag * a_imag, a_real * b_imag + a_imag * b_real);
        }),
        nb$divide: complexNumberSlot(divide),
        nb$reflected_divide: complexNumberSlot((a_real, a_imag, b_real, b_imag) => {
            return divide(b_real, b_imag, a_real, a_imag);
        }),
        nb$floor_divide(other) {
            throw new Sk.builtin.TypeError("can't take floor of complex number.");
        },
        nb$reflected_floor_divide(other) {
            throw new Sk.builtin.TypeError("can't take floor of complex number.");
        },
        nb$remainder(other) {
            throw new Sk.builtin.TypeError("can't mod complex numbers.");
        },
        nb$reflected_remainder(other) {
            throw new Sk.builtin.TypeError("can't mod complex numbers.");
        },
        nb$divmod(other) {
            throw new Sk.builtin.TypeError("can't take floor or mod of complex number.");
        },
        nb$power(other, z) {
            if (z != null && !Sk.builtin.checkNone(z)) {
                throw new Sk.builtin.ValueError("complex modulo");
            }
            return power.call(this, other);
        },

        nb$abs() {
            const _real = this.real;
            const _imag = this.imag;
            if (!_is_finite(_real) || !_is_finite(_imag)) {
                /* C99 rules: if either the real or the imaginary part is an
                   infinity, return infinity, even if the other part is a
                   NaN.
                */
                if (_is_infinity(_real)) {
                    return new Sk.builtin.float_(Math.abs(_real));
                } else if (_is_infinity(_imag)) {
                    return new Sk.builtin.float_(Math.abs(_imag));
                }
                /* either the real or imaginary part is a NaN,
                   and neither is infinite. Result should be NaN. */
                return new Sk.builtin.float_(NaN);
            }
            const result = Math.hypot(_real, _imag);
            if (!_is_finite(result)) {
                throw new Sk.builtin.OverflowError("absolute value too large");
            }
            return new Sk.builtin.float_(result);
        },
    },
    getsets: {
        real: {
            $get() {
                return new Sk.builtin.float_(this.real);
            },
            $doc: "the real part of a complex number",
        },
        imag: {
            $get() {
                return new Sk.builtin.float_(this.imag);
            },
            $doc: "the imaginary part of a complex number",
        },
    },
    methods: /**@lends {Sk.builtin.complex.prototype}*/ {
        conjugate: {
            $meth() {
                return new Sk.builtin.complex(this.real, -this.imag);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "complex.conjugate() -> complex\n\nReturn the complex conjugate of its argument. (3-4j).conjugate() == 3+4j.",
        },
        __getnewargs__: {
            $meth() {
                return new Sk.builtin.tuple([new Sk.builtin.float_(this.real), new Sk.builtin.float_(this.imag)]);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: Sk.builtin.none.none$,
        },
        __format__: {
            $meth(format_spec) {
                if (Sk.builtin.checkString(format_spec)) {
                    // currently just returns not implemented.
                    return _PyComplex_FormatAdvanced(this, format_spec);
                }
                throw new Sk.builtin.TypeError("__format__ requires str");
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "complex.__format__() -> str\n\nConvert to a string according to format_spec.",
        },
    },
});

Sk.exportSymbol("Sk.builtin.complex", Sk.builtin.complex);

/**
 * @function
 *
 * @description
 * returns a Number if the object passed as a __float__ method
 * Otherwise throws an error
 *
 * @param {Sk.builtin.object} op
 *
 * @ignore
 */
function PyFloat_AsDouble(op) {
    let v = op.v;
    if (typeof v === "number") {
        return v;
    } else if (op.nb$float) {
        v = op.nb$float();
    }
    if (v === undefined) {
        throw new Sk.builtin.TypeError("a float is required");
    }
    return v.v;
}

/**
 * @function
 *
 * @description
 * checks and tries the __complex__ method
 * throws an error if this returns a non complex object
 * returns null if that function does not exist
 *
 *
 * @param {Sk.builtin.object} op
 *
 * @ignore
 */
function try_complex_special_method(op) {
    // the lookup special method does already all the magic
    if (op == null) {
        return null;
    }
    const f = Sk.abstr.lookupSpecial(op, Sk.builtin.str.$complex);
    if (f !== undefined) {
        // method on builtin, provide this arg
        return Sk.misceval.callsimArray(f, []);
    }
    return null;
}

/**
 * @function
 *
 * @description
 * copied here for easy access
 * checks whether the argument is an instance of Sk.builtin.complex
 *
 * @return {boolean}
 *
 * @param {Sk.builtin.object} op
 * @ignore
 */
const _complex_check = Sk.builtin.checkComplex;

/**
 * @function
 *
 * @description
 * this is the logic for tp$new
 *
 * @param {Sk.builtin.object} real
 * @param {Sk.builtin.object} imag
 *
 * @ignore
 */
function complex_from_py(real, imag) {
    let tmp; // pyObject
    // var nbr, nbi; // real, imag as numbers
    const cr = {}; // PyComplexObject
    const ci = {}; // PyComplexObject
    let cr_is_complex = false;
    let ci_is_complex = false;

    let r = real;
    let i = imag;

    // handle case if passed in arguments are of type complex
    if (r != null && r.constructor === Sk.builtin.complex && i == null) {
        // subtypes are handled later;
        return r;
    }

    if (Sk.builtin.checkString(r)) {
        if (i != null) {
            throw new Sk.builtin.TypeError("complex() can't take second arg if first is a string");
        }
        return Sk.builtin.complex.complex_subtype_from_string(r, this);
    }

    if (i != null && Sk.builtin.checkString(i)) {
        throw new Sk.builtin.TypeError("complex() second arg can't be a string");
    }

    // try_complex_special_method
    tmp = try_complex_special_method(r);
    if (tmp != null && tmp !== Sk.builtin.NotImplemented.NotImplemented$) {
        if (!_complex_check(tmp)) {
            throw new Sk.builtin.TypeError("__complex__ should return a complex object");
        }
        r = tmp;
    }

    // just a temporary function to match cpython
    function check_number(nb) {
        return nb.nb$float !== undefined;
    }

    if (r != null) {
        if (!check_number(r)) {
            throw new Sk.builtin.TypeError("complex() first argument must be a string or a number, not '" + Sk.abstr.typeName(r) + "'");
        }
    }

    if (i != null) {
        if (!check_number(i)) {
            throw new Sk.builtin.TypeError("complex() second argument must be a number, not '" + Sk.abstr.typeName(r) + "'");
        }
    }

    /* If we get this far, then the "real" and "imag" parts should
       both be treated as numbers, and the constructor should return a
       complex number equal to (real + imag*1j).

       Note that we do NOT assume the input to already be in canonical
       form; the "real" and "imag" parts might themselves be complex
       numbers, which slightly complicates the code below. */
    if (r == null) {
        cr.real = 0.0;
        cr.imag = 0.0;
    } else if (_complex_check(r)) {
        /* Note that if r is of a complex subtype, we're only
        retaining its real & imag parts here, and the return
        value is (properly) of the builtin complex type. */
        cr.real = r.real;
        cr.imag = r.imag;
        cr_is_complex = true;
    } else {
        /* The "real" part really is entirely real, and contributes
        nothing in the imaginary direction.
        Just treat it as a double. */
        cr.real = PyFloat_AsDouble(r);
        cr.imag = 0.0;
    }

    if (i == null) {
        ci.real = 0.0;
        ci.imag = 0.0;
    } else if (_complex_check(i)) {
        ci.real = i.real;
        ci.imag = i.imag;
        ci_is_complex = true;
    } else {
        /* The "imag" part really is entirely imaginary, and
        contributes nothing in the real direction.
        Just treat it as a double. */
        ci.real = PyFloat_AsDouble(i);
        ci.imag = 0.0;
    }

    /*  If the input was in canonical form, then the "real" and "imag"
    parts are real numbers, so that ci.imag and cr.imag are zero.
    We need this correction in case they were not real numbers. */

    if (ci_is_complex === true) {
        cr.real -= ci.imag;
    }

    if (cr_is_complex === true) {
        ci.real += cr.imag;
    }
    return complex_subtype_from_doubles(cr.real, ci.real, this);
}

/**
 * @function
 *
 * @return {Sk.builtin.complex} an instance of complex - could be a subtype's instance
 *
 * @param {number} real
 * @param {number} imag
 * @param {Object} type_prototype Sk.builtin.complex.prototype
 * @ignore
 */
function complex_subtype_from_doubles(real, imag, type_prototype) {
    if (type_prototype === Sk.builtin.complex.prototype) {
        return new Sk.builtin.complex(real, imag);
    } else {
        const instance = new type_prototype.constructor();
        Sk.builtin.complex.call(instance, real, imag);
        return instance;
    }
}

const invalidUnderscores = /_[eE]|[eE]_|\._|_\.|[+-]_|_j|j_/;
const validUnderscores = /_(?=[^_])/g;
/**
 *
 * @function
 * @description Parses a string repr of a complex number
 * @param {*} val
 * @param {Object=} type_prototype
 * We leave this as Sk.builtin.complex since it is called by the compiler
 * @ignore
 */
Sk.builtin.complex.complex_subtype_from_string = function (val, type_prototype) {
    type_prototype = type_prototype || Sk.builtin.complex.prototype;
    var index;
    var start;
    var val_wws; // val with removed beginning ws and (
    var x = 0.0,
        y = 0.0; // real, imag parts
    var got_bracket = false; // flag for braces
    var len; // total length of val
    var match; // regex result

    // first check if val is javascript string or python string
    if (Sk.builtin.checkString(val)) {
        val = Sk.ffi.remapToJs(val);
    } else if (typeof val !== "string") {
        throw new TypeError("provided unsupported string-alike argument");
    }

    /* This is an python specific error, this does not do any harm in js, but we want
     * to be as close to the orginial impl. as possible.
     *
     * Check also for empty strings. They are not allowed.
     */
    if (val.indexOf("\0") !== -1 || val.length === 0 || val === "") {
        throw new Sk.builtin.ValueError("complex() arg is a malformed string");
    }

    // transform to unicode
    // ToDo: do we need this?
    index = 0; // first char

    // do some replacements for javascript floats
    val = val.replace(/inf|infinity/gi, "Infinity");
    val = val.replace(/nan/gi, "NaN");

    /* position on first nonblank */
    start = 0;
    while (val[index] === " ") {
        index++;
    }

    if (val[index] === "(") {
        /* skip over possible bracket from repr(). */
        got_bracket = true;
        index++;
        while (val[index] === " ") {
            index++;
        }
    }

    if (val.indexOf("_") !== -1) {
        if (invalidUnderscores.test(val)) {
            throw new Sk.builtin.ValueError("could not convert string to complex: '" + val + "'");
        }

        val = val.charAt(0) + val.substring(1).replace(validUnderscores, "");
    }

    /* a valid complex string usually takes one of the three forms:

        <float>                - real part only
        <float>j               - imaginary part only
        <float><signed-float>j - real and imaginary parts

        where <float> represents any numeric string that's accepted by the
        float constructor (including 'nan', 'inf', 'infinity', etc.), and
        <signed-float> is any string of the form <float> whose first character
        is '+' or '-'.

        For backwards compatibility, the extra forms

          <float><sign>j
          <sign>j
          j

        are also accepted, though support for these forms my be removed from
        a future version of Python.
     *      This is a complete regular expression for matching any valid python floats, e.g.:
     *          - 1.0
     *          - 0.
     *          - .1
     *          - nan/inf/infinity
     *          - +-1.0
     *          - +3.E-3
     *
     *      In order to work, this pattern requires only lower case characters
     *      There is case insensitive group option in js.
     *
     *      the [eE] could be refactored to soley e
     */
    var float_regex2 = /^(?:[+-]?(?:(?:(?:\d*\.\d+)|(?:\d+\.?))(?:[eE][+-]?\d+)?|NaN|Infinity))/;
    val_wws = val.substr(index); // val with removed whitespace and "("

    /* first try to match a float at the beginning */
    match = val_wws.match(float_regex2);
    if (match !== null) {
        // one of the first 4 cases
        index += match[0].length;

        /* <float>j */
        if (val[index] === "j" || val[index] === "J") {
            y = parseFloat(match[0]);
            index++;
        } else if (val[index] === "+" || val[index] === "-") {
            /* <float><signed-float>j | <float><sign>j */
            x = parseFloat(match[0]);

            match = val.substr(index).match(float_regex2);
            if (match !== null) {
                /* <float><signed-float>j */
                y = parseFloat(match[0]);
                index += match[0].length;
            } else {
                /* <float><sign>j */
                y = val[index] === "+" ? 1.0 : -1.0;
                index++;
            }

            if (val[index] !== "j" && val[index] !== "J") {
                throw new Sk.builtin.ValueError("complex() arg is malformed string");
            }

            index++;
        } else {
            /* <float> */
            x = parseFloat(match[0]);
        }
    } else {
        // maybe <sign>j or j
        match = match = val_wws.match(/^([+-]?[jJ])/);
        if (match !== null) {
            if (match[0].length === 1) {
                y = 1.0; // must be j
            } else {
                y = match[0][0] === "+" ? 1.0 : -1.0;
            }

            index += match[0].length;
        }
    }

    while (val[index] === " ") {
        index++;
    }

    if (got_bracket) {
        /* if there was an opening parenthesis, then the corresponding
           closing parenthesis should be right here */
        if (val[index] !== ")") {
            throw new Sk.builtin.ValueError("complex() arg is malformed string");
        }

        index++;

        while (val[index] === " ") {
            index++;
        }
    }

    /* we should now be at the end of the string */
    if (val.length !== index) {
        throw new Sk.builtin.ValueError("complex() arg is malformed string");
    }

    // return here complex number parts
    return complex_subtype_from_doubles(x, y, type_prototype);
};

/**
 *
 * @function
 * @description
 *
 * A helper function for converting a big int to a number or throwing OverFlow
 * @ignore
 */
function fromBigIntToNumberOrOverflow(big) {
    const x = parseFloat(JSBI.toNumber(big));
    if (x == Infinity || x == -Infinity) {
        //trying to convert a large js string to a float
        throw new Sk.builtin.OverflowError("int too large to convert to float");
    }
    return x;
}

/**
 *
 * @function
 * @description
 * A wrapper to do the checks before passing the this.real, this.imag, other.real, other.imag
 * to the number function
 * @ignore
 * @param {function(number, number, number, number)} f
 * @param {boolean=} suppressOverflow
 */
function complexNumberSlot(f, suppressOverflow) {
    return function (other) {
        const a_real = this.real;
        const a_imag = this.imag;
        let b_real = other.real;
        let b_imag;
        const other_v = other.v;
        if (typeof b_real === "number") {
            b_imag = other.imag;
        } else if (typeof other_v === "number") {
            b_real = other_v;
            b_imag = 0.0;
        } else if (JSBI.__isBigInt(other_v)) {
            if (suppressOverflow === undefined) {
                b_real = fromBigIntToNumberOrOverflow(other_v);
            } else {
                b_real = other_v.toString(); // weird case for tp_richcompare
            }
            b_imag = 0.0;
        } else {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }

        return f(a_real, a_imag, b_real, b_imag);
    };
}

function divide(a_real, a_imag, b_real, b_imag) {
    let ratio, denom, real, imag;
    const abs_b_real = Math.abs(b_real);
    const abs_b_imag = Math.abs(b_imag);
    if (abs_b_real >= abs_b_imag) {
        // divide tops and bottom by b_real
        if (abs_b_real === 0.0) {
            throw new Sk.builtin.ZeroDivisionError("complex division by zero");
        } else {
            ratio = b_imag / b_real;
            denom = b_real + b_imag * ratio;
            real = (a_real + a_imag * ratio) / denom;
            imag = (a_imag - a_real * ratio) / denom;
        }
    } else if (abs_b_imag >= abs_b_real) {
        // divide tops and bottom by b.imag
        ratio = b_real / b_imag;
        denom = b_real * ratio + b_imag;
        Sk.asserts.assert(b_imag !== 0.0);
        real = (a_real * ratio + a_imag) / denom;
        imag = (a_imag * ratio - a_real) / denom;
    } else {
        // At least one of b.real or b.imag is a NaN
        real = NaN;
        imag = NaN;
    }

    return new Sk.builtin.complex(real, imag);
}

const power = complexNumberSlot((a_real, a_imag, b_real, b_imag) => {
    const int_exponent = b_real | 0; // js convert to int
    if (b_imag === 0.0 && b_real === int_exponent) {
        return c_powi(a_real, a_imag, int_exponent);
    } else {
        return c_pow(a_real, a_imag, b_real, b_imag);
    }
});

// power of complex a and complex exponent b
function c_pow(a_real, a_imag, b_real, b_imag) {
    let len, phase, real, imag;

    if (b_real === 0.0 && b_imag === 0.0) {
        real = 1.0;
        imag = 0.0;
    } else if (a_real === 0.0 && a_imag === 0.0) {
        if (b_imag !== 0.0 || b_real < 0.0) {
            throw new Sk.builtin.ZeroDivisionError("complex division by zero");
        }

        real = 0.0;
        imag = 0.0;
    } else {
        const vabs = Math.hypot(a_real, a_imag);
        len = Math.pow(vabs, b_real);
        const at = Math.atan2(a_imag, a_real);
        phase = at * b_real;

        if (b_imag !== 0.0) {
            len /= Math.exp(at * b_imag);
            phase += b_imag * Math.log(vabs);
        }

        real = len * Math.cos(phase);
        imag = len * Math.sin(phase);
    }
    return new Sk.builtin.complex(real, imag);
}

// power of complex x and integer exponent n
function c_powi(a_real, a_imag, n) {
    if (n > 100 || n < -100) {
        return c_pow(a_real, a_imag, n, 0.0);
    } else if (n > 0) {
        return c_powu(a_real, a_imag, n);
    } else {
        //  return c_quot(c_1,c_powu(x,-n));
        const r = c_powu(a_real, a_imag, -n);
        return divide(1.0, 0.0, r.real, r.imag);
    }
}

function c_powu(a_real, a_imag, n) {
    var r, p; // Py_complex
    let mask = 1;
    r = new Sk.builtin.complex(1.0, 0.0);
    p = new Sk.builtin.complex(a_real, a_imag);

    while (mask > 0 && n >= mask) {
        if (n & mask) {
            r = new Sk.builtin.complex(r.real * p.real - r.imag * p.imag, r.real * p.imag + p.real * r.imag);
        }

        mask <<= 1;
        p = new Sk.builtin.complex(p.real * p.real - p.imag * p.imag, 2 * p.real * p.imag);
    }

    return r;
}

/**
 * Internal format function for repr and str
 * It is not intended for __format__ calls
 *
 * This functions assumes, that v is always instance of Sk.builtin.complex
 * @ignore
 */
function complex_format(v, precision, format_code) {
    function copysign(a, b) {
        let sign;
        if (b) {
            sign = b < 0 ? -1 : 1;
        } else {
            sign = 1 / b < 0 ? -1 : 1;
        }
        return sign * Math.abs(a);
    }

    let result; // pyObject

    let pre = "";
    let im = "";
    let re = null;
    let lead = "";
    let tail = "";
    const real = v.real;
    const imag = v.imag;

    if (real === 0.0 && copysign(1.0, real) == 1.0) {
        re = "";
        im = PyOS_double_to_string(imag, format_code, precision, 0, null);
        // im = imag;
    } else {
        /* Format imaginary part with sign, real part without */
        pre = PyOS_double_to_string(real, format_code, precision, 0, null);
        re = pre;

        im = PyOS_double_to_string(imag, format_code, precision, PyOS_double_to_string.Py_DTSF_SIGN, null);

        if (imag === 0 && 1 / imag === -Infinity && im && im[0] !== "-") {
            im = "-" + im; // force negative zero sign
        }

        lead = "(";
        tail = ")";
    }

    result = "" + lead + re + im + "j" + tail; // concat all parts
    return new Sk.builtin.str(result);
}

/**
 * https://hg.python.org/cpython/file/3cf2990d19ab/Objects/complexobject.c#l907
 * also see _PyComplex_FormatAdvanced
 * @ignore
 */
function _PyComplex_FormatAdvanced(self, format_spec) {
    throw new Sk.builtin.NotImplementedError("__format__ is not implemented for complex type.");
}

/**
    Return true if float or double are is neither infinite nor NAN, else false
    Value is already a Javascript object
    @ignore
 */
function _is_finite(val) {
    return Number.isFinite(val);
}

function _is_infinity(val) {
    return val === Infinity || val === -Infinity;
}

/**
 * Convert a double val to a string using supplied format_code, precision, and flags.
 *
 * format_code must be one of 'e', 'E', 'f', 'F', 'g', 'G' or 'r'. For 'r', the supplied precision must be 0 and is ignored. The 'r' format code specifies the standard repr() format.
 *
 * flags can be zero or more of the values Py_DTSF_SIGN, Py_DTSF_ADD_DOT_0, or Py_DTSF_ALT, or-ed together:
 *
 * Py_DTSF_SIGN means to always precede the returned string with a sign character, even if val is non-negative.
 * Py_DTSF_ADD_DOT_0 means to ensure that the returned string will not look like an integer.
 * Py_DTSF_ALT means to apply “alternate” formatting rules. See the documentation for the PyOS_snprintf() '#' specifier for details.
 * If ptype is non-NULL, then the value it points to will be set to one of Py_DTST_FINITE, Py_DTST_INFINITE, or Py_DTST_NAN, signifying that val is a finite number, an
 * infinite number, or not a number, respectively.
 * @ignore
 */
function PyOS_double_to_string(val, format_code, precision, flags, type) {
    let buf,
        t,
        upper = false;
    // Validate format code, and map upper and lower case
    switch (format_code) {
        case "e": /* exponent */
        case "f": /* fixed */
        case "g" /* general */:
            break;
        case "E":
            upper = true;
            format_code = "e";
            break;
        case "F":
            upper = true;
            format_code = "f";
            break;
        case "r" /* repr format */:
            // Supplied precision is unused, must be 0.
            if (precision !== 0) {
                throw new Error("Bad internall call"); // only happens when somebody messes up calling this in js
            }
            // repr() precision is 17 significant decimal digits
            precision = 17;
            format_code = "g";
            break;
        default:
            throw new Error("Bad internall call");
    }
    // no need for buffer size calculation like in cpython
    // Handle nan and inf
    if (isNaN(val)) {
        buf = "nan";
        t = PyOS_double_to_string.Py_DTST_NAN;
    } else if (val === Infinity) {
        buf = "inf";
        t = PyOS_double_to_string.Py_DTST_INFINITE;
    } else if (val === -Infinity) {
        buf = "-inf";
        t = PyOS_double_to_string.Py_DTST_INFINITE;
    } else {
        t = PyOS_double_to_string.Py_DTST_FINITE;
        if (flags & PyOS_double_to_string.Py_DTSF_ADD_DOT_0) {
            format_code = "g"; // "Z"; _PyOS_ascii_formatd converts "Z" to "g"
        }
        // ToDo: call snprintf here
        // ToDo: call ascii_formatd
        var format_str = "%";
        format_str += flags & PyOS_double_to_string.Py_DTSF_ALT ? "#" : "";

        if (precision != null) {
            format_str += ".";
            format_str += precision;
        }

        format_str += format_code;
        format_str = new Sk.builtin.str(format_str);
        /**
         * We can call nb$remainder with val, because it gets unwrapped and it doesn't matter if it is
         * already a javascript number. If we do not pass a float, we can't distinguish between ints and floats
         * and therefore we can't adjust the sign of the zero accordingly
         */
        buf = format_str.nb$remainder(new Sk.builtin.float_(val));
        buf = buf.v; // get javascript string
    }
    /**
     * Add sign when requested. It's convenient (esp. when formatting complex numbers) to
     * include sign even for inf and nan.
     */
    if (flags & PyOS_double_to_string.Py_DTSF_SIGN && buf[0] !== "-") {
        buf = "+" + buf;
    }
    if (upper) {
        // Convert to upper case
        buf = buf.toUpperCase();
    }
    return buf;
}

/* PyOS_double_to_string's "flags" parameter can be set to 0 or more of: */
PyOS_double_to_string.Py_DTSF_SIGN = 0x01; // always add the sign
PyOS_double_to_string.Py_DTSF_ADD_DOT_0 = 0x02; // if the result is an integer add ".0"
PyOS_double_to_string.Py_DTSF_ALT = 0x04; // "alternate" formatting. it's format_code specific

/* PyOS_double_to_string's "type", if non-NULL, will be set to one of: */
PyOS_double_to_string.Py_DTST_FINITE = 0;
PyOS_double_to_string.Py_DTST_INFINITE = 1;
PyOS_double_to_string.Py_DTST_NAN = 2;
