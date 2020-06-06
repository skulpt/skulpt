/**
 * hypot is a ESCMA6 function and maybe not available across all browsers
 */
Math.hypot = Math.hypot || function () {
    var y = 0;
    var length = arguments.length;

    for (var i = 0; i < length; i++) {
        if (arguments[i] === Infinity || arguments[i] === -Infinity) {
            return Infinity;
        }
        y += arguments[i] * arguments[i];
    }
    return Math.sqrt(y);
};

/**
 * complex_new see https://hg.python.org/cpython/file/f0e2caad4200/Objects/complexobject.c#l911
 * @constructor
 * @param {Number|undefined} real part of the complex number
 * @param {Number|undefined} imag part of the complex number
 *
 * Prefering here == instead of ===, otherwise also undefined has to be matched explicitly
 *
 */
Sk.builtin.complex = function (real, imag) {
    Sk.asserts.assert(this instanceof Sk.builtin.complex, "bad call to complex constructor, use 'new'");
    this.real = new Sk.builtin.float_(real);
    this.imag = new Sk.builtin.float_(imag);
};

Sk.abstr.setUpInheritance("complex", Sk.builtin.complex);

Sk.builtin.complex.prototype.tp$as_number = true;
Sk.builtin.complex.prototype.tp$doc = "Create a complex number from a real part and an optional imaginary part.\n\nThis is equivalent to (real + imag*1j) where imag defaults to 0.";


Sk.builtin.complex.prototype.tp$new = function (args, kwargs) {
    args = Sk.abstr.copyKeywordsToNamedArgs("complex", ["real", "imag"], args, kwargs, [new Sk.builtin.float_(0.0), null]);
    const real = args[0];
    const imag = args[1];

    var tmp; // PyObject
    // var nbr, nbi; // real, imag as numbers
    var cr = {}; // PyComplexObject
    var ci = {}; // PyComplexObject
    var cr_is_complex = false;
    var ci_is_complex = false;

    let r = real;
    let i = imag;

    // handle case if passed in arguments are of type complex
    if (r.ob$type === Sk.builtin.complex && i == null) {
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
    tmp = Sk.builtin.complex.try_complex_special_method(r);
    if (tmp != null && tmp !== Sk.builtin.NotImplemented.NotImplemented$) {
        if (!Sk.builtin.checkComplex(tmp)) {
            throw new Sk.builtin.TypeError("__complex__ should return a complex object");
        }

        r = tmp;
    }

    // just a temporary function to match cpython
    function check_number (nb) {
        if (nb.sk$prototypical) {
            return nb.nb$float_ || nb.nb$index;
        } else {
            // multiple inheritance
            return Sk.abstr.lookupSpecial(nb, "__float__") || Sk.abstr.lookupSpecial(nb, "__index__");
        }
    };
    
    if (check_number(r) === undefined) {
        throw new Sk.builtin.TypeError("complex() first argument must be a string or a number, not '" + Sk.abstr.typeName(r) +"'");
    }

    if (i != null) {
        if (check_number(i) === undefined) {
            throw new Sk.builtin.TypeError("complex() second argument must be a number, not '" + Sk.abstr.typeName(r) +"'");
        } 
    }

    /* If we get this far, then the "real" and "imag" parts should
       both be treated as numbers, and the constructor should return a
       complex number equal to (real + imag*1j).

       Note that we do NOT assume the input to already be in canonical
       form; the "real" and "imag" parts might themselves be complex
       numbers, which slightly complicates the code below. */

    if (Sk.builtin.complex._complex_check(r)) {
        /* Note that if r is of a complex subtype, we're only
        retaining its real & imag parts here, and the return
        value is (properly) of the builtin complex type. */
        cr.real = r.real.v;
        cr.imag = r.imag.v;
        cr_is_complex = true;
    } else {
        /* The "real" part really is entirely real, and contributes
        nothing in the imaginary direction.
        Just treat it as a double. */
        tmp = Sk.builtin.float_.PyFloat_AsDouble(r); // tmp = PyNumber_Float(r);

        if (tmp == null) {
            return null;
        }

        cr.real = tmp;
        cr.imag = 0.0;
    }

    if (i == null) {
        ci.real = 0.0;
    } else if (Sk.builtin.complex._complex_check(i)) {
        ci.real = i.real.v;
        ci.imag = i.imag.v;
        ci_is_complex = true;
    } else {
        /* The "imag" part really is entirely imaginary, and
        contributes nothing in the real direction.
        Just treat it as a double. */
        tmp = Sk.builtin.float_.PyFloat_AsDouble(i);

        if (tmp == null) {
            return null;
        }

        ci.real = tmp;
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
    return Sk.builtin.complex.complex_subtype_from_doubles(cr.real, ci.real, this);
};


Sk.builtin.complex.complex_subtype_from_doubles = function (real, imag, type_prototype) {
    if (type_prototype === Sk.builtin.complex.prototype) {
        return new Sk.builtin.complex(real, imag);
    } else {
        const instance = new type_prototype.constructor;
        Sk.builtin.complex.call(instance, real, imag);
        return instance;
    }
};

Sk.builtin.complex.prototype.nb$int_ = function () {
    throw new Sk.builtin.TypeError("can't convert complex to int");
};

Sk.builtin.complex.prototype.nb$float_ = function () {
    throw new Sk.builtin.TypeError("can't convert complex to float");
};

Sk.builtin.complex.prototype.nb$lng = function () {
    throw new Sk.builtin.TypeError("can't convert complex to long");
};

/**
 * Internal method to check if op has __complex__
 */
Sk.builtin.complex.try_complex_special_method = function (op) {
    var f; // PyObject
    var res;

    // return early
    if (op == null) {
        return null;
    }

    // the lookup special method does already all the magic
    f = Sk.abstr.lookupSpecial(op, Sk.builtin.str.$complex);

    if (f !== undefined) {
        // method on builtin, provide this arg
        res = Sk.misceval.callsimArray(f, [op]);

        return res;
    }

    return null;
};

/**
    Check if given argument is number or complex and always
    returns complex type.
 */
Sk.builtin.complex.check_number_or_complex = function (other) {
    /* exit early */
    if (!Sk.builtin.checkNumber(other) && !Sk.builtin.checkComplex(other)) {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for +: 'complex' and '" + Sk.abstr.typeName(other) + "'");
    }

    /* converting to complex allows us to use always only one formula */
    if (Sk.builtin.checkNumber(other)) {
        other = Sk.misceval.callsimArray(Sk.builtin.complex, [other]); // create complex
    }

    return other;
};

/**
    Parses a string repr of a complex number
 */
Sk.builtin.complex.complex_subtype_from_string = function (val, type_prototype) {
    type_prototype = type_prototype || Sk.builtin.complex.prototype;
    var index;
    var start;
    var val_wws;              // val with removed beginning ws and (
    var x = 0.0, y = 0.0;     // real, imag parts
    var got_bracket = false;  // flag for braces
    var len;                  // total length of val
    var match;                // regex result

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
    return Sk.builtin.complex.complex_subtype_from_doubles(x, y, type_prototype);
};

/**
    _PyHASH_IMAG refers to _PyHASH_MULTIPLIER which refers to 1000003
 */
Sk.builtin.complex.prototype.tp$hash = function () {
    return new Sk.builtin.int_(this.tp$getattr(Sk.builtin.str.$imag).v * 1000003 + this.tp$getattr(Sk.builtin.str.$real).v);
};

Sk.builtin.complex.prototype.nb$add = function (other) {
    var real;
    var imag;

    other = Sk.builtin.complex.check_number_or_complex(other);

    real = this.tp$getattr(Sk.builtin.str.$real).v + other.tp$getattr(Sk.builtin.str.$real).v;
    imag = this.tp$getattr(Sk.builtin.str.$imag).v + other.tp$getattr(Sk.builtin.str.$imag).v;

    return new Sk.builtin.complex(real, imag);
};

/* internal subtract/diff function that calls internal float diff */
Sk.builtin.complex._c_diff = function (a, b) {
    var r, i; // Py_Float
    r = a.real.nb$subtract.call(a.real, b.real).v;
    i = a.imag.nb$subtract.call(a.imag, b.imag).v;

    return new Sk.builtin.complex(r, i);
};

Sk.builtin.complex.prototype.nb$subtract = function (other) {
    var result; // Py_complex
    var a, b; // Py_complex

    a = Sk.builtin.complex.check_number_or_complex(this);
    b = Sk.builtin.complex.check_number_or_complex(other);

    result = Sk.builtin.complex._c_diff(a, b);

    return result;
};

Sk.builtin.complex.prototype.nb$multiply = function (other) {
    var real;
    var imag;
    var a, b; // Py_complex

    a = this;
    b = Sk.builtin.complex.check_number_or_complex(other);

    real = a.real.v * b.real.v - a.imag.v * b.imag.v;
    imag = a.real.v * b.imag.v + a.imag.v * b.real.v;

    return new Sk.builtin.complex(real, imag);
};

/**
 * Otherwise google closure complains about ZeroDivisionError not being
 * defined
 * @suppress {missingProperties}
 *
 * implementation based on complexobject.c:c_quot
 */
Sk.builtin.complex.prototype.nb$divide = function (other) {
    var real;
    var imag;

    other = Sk.builtin.complex.check_number_or_complex(other);

    var ratio;
    var denom;

    // other == b
    var breal = other.real.v;
    var bimag = other.imag.v;
    // this == a
    var areal = this.real.v;
    var aimag = this.imag.v;

    var abs_breal = Math.abs(breal);
    var abs_bimag = Math.abs(bimag);

    if (abs_breal >= abs_bimag) {
        // divide tops and bottom by breal
        if (abs_breal === 0.0) {
            throw new Sk.builtin.ZeroDivisionError("complex division by zero");
        } else {
            ratio = bimag / breal;
            denom = breal + bimag * ratio;
            real = (areal + aimag * ratio) / denom;
            imag = (aimag - areal * ratio) / denom;
        }
    } else if (abs_bimag >= abs_breal) {
        // divide tops and bottom by b.imag
        ratio = breal / bimag;
        denom = breal * ratio + bimag;
        Sk.asserts.assert(bimag !== 0.0);
        real = (areal * ratio + aimag) / denom;
        imag = (aimag * ratio - areal) / denom;
    } else {
        // At least one of b.real or b.imag is a NaN
        real = NaN;
        imag = NaN;
    }

    return new Sk.builtin.complex(real, imag);
};


Sk.builtin.complex.prototype.nb$floor_divide = function (other) {
    throw new Sk.builtin.TypeError("can't take floor of complex number.");
};

Sk.builtin.complex.prototype.nb$remainder = function (other) {
    throw new Sk.builtin.TypeError("can't mod complex numbers.");
};

/**
 * @param {?Object=} z, modulo operation
 */
Sk.builtin.complex.prototype.nb$power = function (other, z) {
    var p;
    var exponent;
    var int_exponent;
    var a, b;

    // none is allowed
    if (z != null && !Sk.builtin.checkNone(z)) {
        throw new Sk.builtin.ValueError("complex modulo");
    }

    a = this;
    b = Sk.builtin.complex.check_number_or_complex(other);

    exponent = b;
    int_exponent = b.real.v | 0; // js convert to int
    if (exponent.imag.v === 0.0 && exponent.real.v === int_exponent) {
        p = Sk.builtin.complex.c_powi(a, int_exponent);
    } else {
        p = Sk.builtin.complex.c_pow(a, exponent);
    }

    return p;
};

// power of complex a and complex exponent b
Sk.builtin.complex.c_pow = function (a, b) {
    var real, imag; // Py_complex

    var vabs;
    var len;
    var at;
    var phase;

    // other == b
    var breal = b.real.v;
    var bimag = b.imag.v;
    // this == a
    var areal = a.real.v;
    var aimag = a.imag.v;

    if (breal === 0.0 && bimag === 0.0) {
        real = 1.0;
        imag = 0.0;
    } else if (areal === 0.0 && aimag === 0.0) {
        if (bimag !== 0.0 || breal < 0.0) {
            throw new Sk.builtin.ZeroDivisionError("complex division by zero");
        }

        real = 0.0;
        imag = 0.0;
    } else {
        vabs = Math.hypot(areal, aimag);
        len = Math.pow(vabs, breal);
        at = Math.atan2(aimag, areal);
        phase = at * breal;

        if (bimag !== 0.0) {
            len /= Math.exp(at * bimag);
            phase += bimag * Math.log(vabs);
        }

        real = len * Math.cos(phase);
        imag = len * Math.sin(phase);
    }

    return new Sk.builtin.complex(real, imag);
};

// power of complex x and integer exponent n
Sk.builtin.complex.c_powi = function (x, n) {
    var cn; // Py_complex
    var c1;

    if (n > 100 || n < -100) {
        cn = new Sk.builtin.complex(n, 0.0);
        return Sk.builtin.complex.c_pow(x, cn);
    } else if (n > 0) {
        return Sk.builtin.complex.c_powu(x, n);
    } else {
        //  return c_quot(c_1,c_powu(x,-n));
        c1 = new Sk.builtin.complex(1.0, 0.0);
        return c1.nb$divide(Sk.builtin.complex.c_powu(x, -n));
    }
};

Sk.builtin.complex.c_powu = function (x, n) {
    var r, p; // Py_complex
    var mask = 1;
    r = new Sk.builtin.complex(1.0, 0.0);
    p = x;

    while (mask > 0 && n >= mask) {
        if (n & mask) {
            r = r.nb$multiply(p);
        }

        mask <<= 1;
        p = p.nb$multiply(p);
    }

    return r;
};

Sk.builtin.complex.prototype.nb$negative = function () {
    var real;
    var imag;
    // this == a
    var areal = this.real.v;
    var aimag = this.imag.v;

    real = -areal;
    imag = -aimag;

    return new Sk.builtin.complex(real, imag);
};

Sk.builtin.complex.prototype.nb$positive = function () {
    return Sk.builtin.complex.check_number_or_complex(this);
};

/**
 *  check if op is instance of complex or a sub-type
 */
Sk.builtin.complex._complex_check = function (op) {
    if (op === undefined) {
        return false;
    }

    if (op instanceof Sk.builtin.complex || (op.tp$name && op.tp$name === "complex")) {
        return true;
    }

    // check if type of ob is a subclass
    if (op.ob$type.$isSubType(Sk.builtin.complex)) {
        return true;
    }

    return false;
};

Sk.builtin.complex.prototype.tp$richcompare = function (w, op) {
    var result;
    var equal;
    var i;

    if (op !== "Eq" && op !== "NotEq") {
        if (Sk.builtin.checkNumber(w) || Sk.builtin.complex._complex_check(w)) {
            throw new Sk.builtin.TypeError("no ordering relation is defined for complex numbers");
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    // assert(PyComplex_Check(v)));
    i = Sk.builtin.complex.check_number_or_complex(this);
    var _real = i.tp$getattr(Sk.builtin.str.$real).v;
    var _imag = i.tp$getattr(Sk.builtin.str.$imag).v;

    if (Sk.builtin.checkInt(w)) {
        /* Check for 0.0 imaginary part first to avoid the rich
         * comparison when possible.
         */

        // if true, the complex number has just a real part
        if (_imag === 0.0) {
            equal = Sk.misceval.richCompareBool(new Sk.builtin.float_(_real), w, op);
            result = equal;
            return result;
        } else {
            equal = false;
        }
    } else if (Sk.builtin.checkFloat(w)) {
        equal = (_real === Sk.builtin.float_.PyFloat_AsDouble(w) && _imag === 0.0);
    } else if (Sk.builtin.complex._complex_check(w)) {
        // ToDo: figure if we need to call to_complex
        var w_real = w.tp$getattr(Sk.builtin.str.$real).v;
        var w_imag = w.tp$getattr(Sk.builtin.str.$imag).v;
        equal = _real === w_real && _imag === w_imag;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    // invert result if op == NotEq
    if (op === "NotEq") {
        equal = !equal;
    }

    // wrap as bool
    result = equal;

    return result;
};

Sk.builtin.complex.prototype.tp$getsets = {
    real: {
        $get: function () { return this.real; }
    },
    imag: {
        $get: function () { return this.imag; }
    }
};

/**
 * Internal format function for repr and str
 * It is not intended for __format__ calls
 *
 * This functions assumes, that v is always instance of Sk.builtin.complex
 */
Sk.builtin.complex.complex_format = function (v, precision, format_code) {
    function copysign(a, b) {
        let sign;
        if (b) {
            sign = b < 0 ? -1 : 1;
        } else {
            sign = 1 / b < 0 ? -1 : 1;
        };
        return sign * Math.abs(a);
    }

    if (v == null || !Sk.builtin.complex._complex_check(v)) {
        throw new Error("Invalid internal method call: Sk.complex.complex_format() called with invalid value type.");
    }

    var result; // PyObject

    var pre = "";
    var im = "";
    var re = null;
    var lead = "";
    var tail = "";

    if (v.real.v === 0.0 && copysign(1.0, v.real.v) == 1.0) {
        re = "";
        im = Sk.builtin.complex.PyOS_double_to_string(v.imag.v, format_code, precision, 0, null);
        // im = v.imag.v;
    } else {
        /* Format imaginary part with sign, real part without */
        pre = Sk.builtin.complex.PyOS_double_to_string(v.real.v, format_code, precision, 0, null);
        re = pre;

        im = Sk.builtin.complex.PyOS_double_to_string(v.imag.v, format_code, precision, Sk.builtin.complex.PyOS_double_to_string.Py_DTSF_SIGN, null);

        if (v.imag.v === 0 && 1 / v.imag.v === -Infinity && im && im[0] !== "-") {
            im = "-" + im; // force negative zero sign
        }

        lead = "(";
        tail = ")";
    }

    result = "" + lead + re + im + "j" + tail; // concat all parts

    return new Sk.builtin.str(result);
};

Sk.builtin.complex.prototype.$r = function () {
    return Sk.builtin.complex.complex_format(this, null, "g");
};

Sk.builtin.complex.prototype.tp$str = function () {
    return Sk.builtin.complex.complex_format(this, null, "g"); // g, 12 == Py_Float_STR_PRECISION
};

/**
 * https://hg.python.org/cpython/file/3cf2990d19ab/Objects/complexobject.c#l907
 * also see _PyComplex_FormatAdvanced
 *
 * We currently use the signature (self, format_spec) instead of (self, args). So we do
 * not need to unwrap the args.
 */
Sk.builtin.complex.prototype.int$format = function __format__(self, format_spec) {
    var result; // PyObject

    if (format_spec == null) {
        return null;
    }

    if (Sk.builtin.checkString(format_spec)) {
        result = Sk.builtin.complex._PyComplex_FormatAdvanced(self, format_spec);

        return result;
    }


    throw new Sk.builtin.TypeError("__format__ requires str or unicode");
};
Sk.builtin.complex.prototype.int$format.co_name = new Sk.builtin.str("__format__");
Sk.builtin.complex.prototype.__format__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$format);

Sk.builtin.complex._PyComplex_FormatAdvanced = function (self, format_spec) {
    throw new Sk.builtin.NotImplementedError("__format__ is not implemented for complex type.");
};

/**
    Return true if float or double are is neither infinite nor NAN, else false
    Value is already a Javascript object
 */
Sk.builtin.complex._is_finite = function (val) {
    return !isNaN(val) && val !== Infinity && val !== -Infinity;
};

Sk.builtin.complex._is_infinity = function (val) {
    return val === Infinity || val === -Infinity;
};

/**
 * @suppress {missingProperties}
 */
Sk.builtin.complex.prototype.nb$abs = function __abs__() {
    var result;
    var _real = this.real.v;
    var _imag = this.imag.v;

    if (!Sk.builtin.complex._is_finite(_real) || !Sk.builtin.complex._is_finite(_imag)) {
        /* C99 rules: if either the real or the imaginary part is an
           infinity, return infinity, even if the other part is a
           NaN.
        */

        if (Sk.builtin.complex._is_infinity(_real)) {
            result = Math.abs(_real);
            return new Sk.builtin.float_(result);
        }

        if (Sk.builtin.complex._is_infinity(_imag)) {
            result = Math.abs(_imag);
            return new Sk.builtin.float_(result);
        }

        /* either the real or imaginary part is a NaN,
           and neither is infinite. Result should be NaN. */

        return new Sk.builtin.float_(NaN);
    }

    result = Math.hypot(_real, _imag);

    if (!Sk.builtin.complex._is_finite(result)) {
        throw new Sk.builtin.OverflowError("absolute value too large");
    }

    return new Sk.builtin.float_(result);
};
Sk.builtin.complex.prototype.nb$bool = function __bool__() {
    return new Sk.builtin.bool(this.tp$getattr(Sk.builtin.str.$real).v || this.tp$getattr(Sk.builtin.str.$real).v);
};

Sk.builtin.complex.prototype.nb$true_divide = Sk.builtin.complex.prototype.nb$divide; 

Sk.builtin.complex.prototype.int$conjugate = function conjugate(self) {
    Sk.builtin.pyCheckArgsLen("conjugate", arguments.length, 0, 0, true);
    var _imag = self.imag.v;
    _imag = -_imag;

    return new Sk.builtin.complex(self.real.v, _imag);
};
Sk.builtin.complex.prototype.int$conjugate.co_name = new Sk.builtin.str("conjugate");
Sk.builtin.complex.prototype.conjugate = new Sk.builtin.func(Sk.builtin.complex.prototype.int$conjugate);

// deprecated
Sk.builtin.complex.prototype.nb$divmod = function (other) {
    throw new Sk.builtin.TypeError("can't take floor or mod of complex number.");
};
Sk.builtin.complex.prototype.int$getnewargs = function __getnewargs__(self) {
    Sk.builtin.pyCheckArgsLen("__getnewargs__", arguments.length, 0, 0, true);
    return new Sk.builtin.tuple([self.real, self.imag]);
};
Sk.builtin.complex.prototype.int$getnewargs.co_name = new Sk.builtin.str("__getnewargs__");
Sk.builtin.complex.prototype.__getnewargs__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$getnewargs);


Sk.builtin.complex.prototype.nb$bool = function () {
    return new Sk.builtin.bool(this.tp$getattr(Sk.builtin.str.$real).v || this.tp$getattr(Sk.builtin.str.$real).v);
};

Sk.builtin.complex.prototype.nb$bool = function () {
    return new Sk.builtin.bool(this.tp$getattr(Sk.builtin.str.$real).v || this.tp$getattr(Sk.builtin.str.$real).v);
};


Sk.exportSymbol("Sk.builtin.complex", Sk.builtin.complex);


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
 */
Sk.builtin.complex.PyOS_double_to_string = function (val, format_code, precision, flags, type) {
    var format;
    var buf;
    var t;
    var exp;
    var upper = false;

    // Validate format code, and map upper and lower case
    switch (format_code) {
        case "e": /* exponent */
        case "f": /* fixed */
        case "g": /* general */
            break;
        case "E":
            upper = true;
            format_code = "e";
            break;
        case "F":
            upper = true;
            format_code = "f";
            break;
        case "r": /* repr format */
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
        t = Sk.builtin.complex.PyOS_double_to_string.Py_DTST_NAN;
    } else if (val === Infinity) {
        buf = "inf";
        t = Sk.builtin.complex.PyOS_double_to_string.Py_DTST_INFINITE;
    } else if (val === -Infinity) {
        buf = "-inf";
        t = Sk.builtin.complex.PyOS_double_to_string.Py_DTST_INFINITE;
    } else {
        t = Sk.builtin.complex.PyOS_double_to_string.Py_DTST_FINITE;
        if (flags & Sk.builtin.complex.PyOS_double_to_string.Py_DTSF_ADD_DOT_0) {
            format_code = "g"; // "Z"; _PyOS_ascii_formatd converts "Z" to "g"
        }

        // ToDo: call snprintf here
        // ToDo: call ascii_formatd
        var format_str = "%";
        format_str += flags & Sk.builtin.complex.PyOS_double_to_string.Py_DTSF_ALT ? "#" : "";

        if (precision != null) {
            format_str += ".";
            format_str += precision;
        }

        format_str += format_code;
        format_str = new Sk.builtin.str(format_str);

        /**
         * We cann call nb$remainder with val, because it gets unwrapped and it doesn't matter if it is
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
    if (flags & Sk.builtin.complex.PyOS_double_to_string.Py_DTSF_SIGN && buf[0] !== "-") {
        buf = "+" + buf;
    }

    if (upper) {
        // Convert to upper case
        buf = buf.toUpperCase();
    }

    return buf;
};

/* PyOS_double_to_string's "flags" parameter can be set to 0 or more of: */
Sk.builtin.complex.PyOS_double_to_string.Py_DTSF_SIGN = 0x01; // always add the sign
Sk.builtin.complex.PyOS_double_to_string.Py_DTSF_ADD_DOT_0 = 0x02; // if the result is an integer add ".0"
Sk.builtin.complex.PyOS_double_to_string.Py_DTSF_ALT = 0x04; // "alternate" formatting. it's format_code specific

/* PyOS_double_to_string's "type", if non-NULL, will be set to one of: */
Sk.builtin.complex.PyOS_double_to_string.Py_DTST_FINITE = 0;
Sk.builtin.complex.PyOS_double_to_string.Py_DTST_INFINITE = 1;
Sk.builtin.complex.PyOS_double_to_string.Py_DTST_NAN = 2;
