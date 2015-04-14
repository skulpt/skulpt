/**
 * complex_new see https://hg.python.org/cpython/file/f0e2caad4200/Objects/complexobject.c#l911
 * @constructor
 * @param {Object} real part of the complex number
 * @param {?Object=} imag part of the complex number
 * @this {Sk.builtin.object}
 */
Sk.builtin.complex = function (real, imag) {
    Sk.builtin.pyCheckArgs("complex", arguments, 0, 2);

    var r, i, tmp; // PyObject
    var nbr, nbi; // real, imag as numbers
    var own_r = false;
    var cr = {}; // PyComplexObject
    var ci = {}; // PyComplexObject
    var cr_is_complex = false;
    var ci_is_complex = false;

    // not sure why this is required
    if (!(this instanceof Sk.builtin.complex)) {
        return new Sk.builtin.complex(real, imag);
    }

    // check if kwargs
    // ToDo: this is only a temporary replacement
    r = real;
    i = imag;

    // handle case if passed in arguments are of type complex
    if (real instanceof Sk.builtin.complex && imag === undefined) {
        return real;
    }

    if(Sk.builtin.checkString(r)) {
        if(i != null) {
            throw new Sk.builtin.TypeError("complex() can't take second arg if first is a string");
        }

        return Sk.builtin.complex.complex_subtype_from_string(r);
    }

    if(i != null && Sk.builtin.checkString(i)) {
        throw new Sk.builtin.TypeError("complex() second arg can't be a string");
    }


    // try_complex_special_method
    tmp = Sk.builtin.complex.try_complex_special_method(r);
    if(tmp != null) {
        r = tmp;
    }

    // this replaces the above check: !Sk.builtin.checkNumber(real) && !Sk.builtin.checkString(real)
    nbr = Sk.builtin.asnum$(r);
    if(i != null) {
        nbi = Sk.builtin.asnum$(i);
    }

    // check for valid arguments
    if(nbr === null || !Sk.builtin.checkFloat(r) || ((i !== null) && (nbi === null || !Sk.builtin.checkFloat(i)))) {
        throw new Sk.builtin.TypeError("complex() argument must be a string or number");
    }

    /* If we get this far, then the "real" and "imag" parts should
       both be treated as numbers, and the constructor should return a
       complex number equal to (real + imag*1j).

       Note that we do NOT assume the input to already be in canonical
       form; the "real" and "imag" parts might themselves be complex
       numbers, which slightly complicates the code below. */

    if(Sk.builtin.complex._complex_check(r)) {
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
        tmp = Sk.ffi.remapToJs(r); // tmp = PyNumber_Float(r);

        if(tmp === null) {
            return null;
        }

        cr.real = tmp; // PyFLoat_AsDouble(tmp);
        cr.imag = 0.0;
    }

    if(i === null) {
        ci.real = 0.0;
    } else if(Sk.builtin.complex._complex_check(i)) {
        ci.real = i.real;
        ci.imag = i.imag;
        ci_is_complex = true;
    } else {
        /* The "imag" part really is entirely imaginary, and
        contributes nothing in the real direction.
        Just treat it as a double. */
        tmp = Sk.ffi.remapToJs(i); // tmp = PyNumber_Float(i);

        if(tmp === null) {
            return null;
        }

        ci.real = tmp;
        ci.imag = 0.0;
    }

    /*  If the input was in canonical form, then the "real" and "imag"
    parts are real numbers, so that ci.imag and cr.imag are zero.
    We need this correction in case they were not real numbers. */

    if(ci_is_complex === true) {
        cr.real -= ci.imag;
    }

    if(cr_is_complex === true) {
        ci.real += cr.imag;
    }

    // save them as properties
    this.real = new Sk.builtin.float_(cr.real);
    this.imag = new Sk.builtin.float_(ci.real);

    this.__class__ = Sk.builtin.complex;

    return this;
};


Sk.builtin.complex.try_complex_special_method = function(op) {
    var complexstr = new Sk.builtin.str("__complex__");
    var f; // PyObject
    var res;

    //PyInstance_Check, check if we are dealing with a builtin or not
    if(Sk.builtin.checkClass(op)) {
        f = op.tp$getattr(op, complexstr);
    } else {
        f = Sk.builtin.object._PyObject_LookupSpecial(op, "__complex__", complexstr);
    }

    if(f !== null) {
        if(Sk.builtin.checkFunction(f)) {
            res = Sk.misceval.callsim(f);
        } else {
            // method on builtin, provide this arg
            res = Sk.misceval.callsim(f, op);
        }

        return res;
    }

    return null;
};

Sk.builtin.complex.complex_new = function(kwa) {
    Sk.builtin.pyCheckArgs("complex", arguments, 0, 2);
    var r, i, tmp; // PyObject
    var nbr, nbi; // PyNumberMethods
    var own_r = 0;
    var cr_is_complex = false;
    var ci_is_complex = false;

    var kwlist = ["real", "imag"];

    r = false; // Py_False;
    i = null;
    //Sk.builtin.complex._PyArg_ParseTupleAndKeywords(arguments, kwa, kwlist);
};

/*
// allowed format str: "|OO:complex"
// so, we can call complex(), complex(complex), complex(O) or complex(O,O)
Sk.builtin.complex._PyArg_ParseTupleAndKeywords = function(args, kwds, kwlist) {
    var _args = Array.prototype.slice.call(args, 1);
    var kwargs = new Sk.builtins.dict(kwds); // is pretty useless for handling kwargs
    var _kwargs = Sk.ffi.remapToJs(kwargs); // create a proper dict

    var res = {};
    // max length is check by pyCheckargs function
    var len = args.length + _kwargs.length;

    if(len > kwlist.length) {
        // ToDo: throw exception too many arguments
    }

    var k,v;
    for(k in args) {

    }

    return res;
};
*/

Sk.builtin.complex.prototype.tp$name = "complex";
Sk.builtin.complex.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("number", Sk.builtin.complex);
Sk.builtin.complex.co_kwargs = true;

/**
    Check if given argument is number or complex and always
    returns complex type.
 */
Sk.builtin.complex.check_number_or_complex = function(other) {
    /* exit early */
    if(!Sk.builtin.checkNumber(other) && other.tp$name !== "complex") {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for +: 'complex' and '" + Sk.abstr.typeName(other) + "'");
    }

    /* converting to complex allows us to use always only one formula */
    if(Sk.builtin.checkNumber(other)) {
        other = new Sk.builtin.complex(other); // create complex
    }

    return other;
};

/**
    Parses a string repr of a complex number
 */
Sk.builtin.complex.complex_subtype_from_string = function(val) {
    var index;
    var start;
    var val_wws;              // val with removed beginning ws and (
    var x = 0.0, y = 0.0;     // real, imag parts
    var got_bracket = false;  // flag for braces
    var len;                  // total length of val
    var match;                // regex result

    // first check if val is javascript string or python string
    if(Sk.builtin.checkString(val)) {
        val = Sk.ffi.remapToJs(val);
    } else if(typeof val !== "string") {
        throw new TypeError("provided unsupported string-alike argument");
    }

    // transform to unicode
    // ToDo: do we need this?
    index = 0; // first char

    /* position on first nonblank */
    start = 0;
    while(val === " ") {
        index++;
    }

    if(val[index] === "(") {
        /* skip over possible bracket from repr(). */
        got_bracket = true;
        index++;
        while(val === " ") {
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
    */
    var float_regex = /^([+-]?\d+(?:\.\d+)?(?:[eE][+-]\d+)?)/;
    val_wws = val.substr(index); // val with removed ws and (

    /* first try to match a float at the beginning */
    match = val_wws.match(float_regex);
    if(match !== null) {
        // one of the first 4 cases
        index += match[0].length;

        /* <float>j */
        if(val[index] === "j") {
            y = parseFloat(match[0]);
            index++;
        } else if(val[index] === "+" || val[index] === "-") {
            /* <float><signed-float>j | <float><sign>j */
            x = parseFloat(match[0]);

            match = val.substr(index).match(float_regex);
            if(match !== null) {
                /* <float><signed-float>j */
                y = parseFloat(match[0]);
                index += match[0].length;
            } else {
                /* <float><sign>j */
                y = val[index] === "+" ? 1.0 : -1.0;
                index++;
            }

            if(val[index] !== "j" && val[index] !== "J") {
                throw new Sk.builtin.ParseError("complex() arg is malformed string");
            }

            index++;
        } else {
            /* <float> */
            x = parseFloat(match[0]);
        }
    } else {
        // maybe <sign>j or j
        match = match = val_wws.match(/^([+-]?j)/);
        if(match !== null) {
            if(match[0].length === 1) {
                y = 1.0; // must be j
            } else {
                y = match[0][0] === "+" ? 1.0 : -1.0;
            }

            index += match[0].length;
        }
    }

    while(val[index] === " ") {
        index++;
    }

    if(got_bracket) {
        /* if there was an opening parenthesis, then the corresponding
           closing parenthesis should be right here */
        if(val[index] !== ")") {
            throw new Sk.builtin.ParseError("complex() arg is malformed string");
        }

        index++;

        while(val[index] === " ") {
            index++;
        }
    }

    /* we should now be at the end of the string */
    if(val.length !== index) {
        throw new Sk.builtin.ParseError("complex() arg is malformed string");
    }

    // return here complex number parts
    return new Sk.builtin.complex(new Sk.builtin.float_(x), new Sk.builtin.float_(y));
};

/**
    _PyHASH_IMAG refers to _PyHASH_MULTIPLIER which refers to 1000003
 */
Sk.builtin.complex.prototype.tp$hash = function () {
    return new Sk.builtin.nmber(this.tp$getattr("imag").v * 1000003 + this.tp$getattr("real").v, Sk.builtin.nmber.int$);
};

Sk.builtin.complex.prototype.nb$add = function (other) {
    var real;
    var imag;

    other = Sk.builtin.complex.check_number_or_complex(other);

    real = this.tp$getattr("real").v + other.tp$getattr("real").v;
    imag = this.tp$getattr("imag").v + other.tp$getattr("imag").v;

    return new Sk.builtin.complex(new Sk.builtin.float_(real), new Sk.builtin.float_(imag));
};


Sk.builtin.complex.prototype.nb$subtract = function (other) {
    var real;
    var imag;

    other = Sk.builtin.complex.check_number_or_complex(other);

    real = this.tp$getattr("real").v - other.tp$getattr("real").v;
    imag = this.tp$getattr("imag").v - other.tp$getattr("imag").v;


    return new Sk.builtin.complex(new Sk.builtin.float_(real), new Sk.builtin.float_(imag));
};

Sk.builtin.complex.prototype.nb$multiply = function (other) {
    var real;
    var imag;

    other = Sk.builtin.complex.check_number_or_complex(other);

    real = this.tp$getattr("real").v * other.tp$getattr("real").v - this.tp$getattr("imag").v * other.tp$getattr("imag").v;
    imag = this.tp$getattr("real").v + other.tp$getattr("imag").v + this.tp$getattr("imag").v * other.tp$getattr("real").v;

    return new Sk.builtin.complex(new Sk.builtin.float_(real), new Sk.builtin.float_(imag));
};

Sk.builtin.complex.prototype.nb$divide = function (other) {
    var real;
    var imag;

    other = Sk.builtin.complex.check_number_or_complex(other);

    var ratio;
    var denom;

    // other == b
    var breal = other.tp$getattr("real").v;
    var bimag = other.tp$getattr("imag").v;
    // this == a
    var areal = this.tp$getattr("real").v;
    var aimag = this.tp$getattr("imag").v;

    var abs_breal = breal < 0 ? -breal : breal;
    var abs_bimag = bimag < 0 ? -bimag : bimag;

    if(abs_breal >= abs_bimag) {
        /* divide tops and bottom by breal */
        if(abs_breal === 0.0) {
            real = imag = 0.0;
            throw new Sk.builtin.ZeroDivisionError("complex division by zero");
        } else {
            ratio = bimag / breal;
            denom = breal + bimag * ratio;
            real = (areal + aimag * ratio) / denom;
            imag = (aimag + areal * ratio) / denom;
        }
    } else {
        /* divide tops and bottom by b.imag */
        ratio = breal / bimag;
        denom = breal * ratio + bimag;
        goog.asserts.assert(bimag !== 0.0);
        real = (areal * ratio + aimag) / denom;
        imag = (aimag * ratio - areal) / denom;
    }

    return new Sk.builtin.complex(new Sk.builtin.float_(real), new Sk.builtin.float_(imag));
};

Sk.builtin.complex.prototype.nb$floor_divide = function (other) {
    throw new Sk.builtin.TypeError("can't take floor of complex number.");
};

Sk.builtin.complex.prototype.nb$remainder = function (other) {
    throw new Sk.builtin.TypeError("can't mod complex numbers.");
};

Sk.builtin.complex.prototype.nb$power = function (other) {
    // not all browsers (IE) support hypot currently
    var hypot = Math.hypot || function() {
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

    var real;
    var imag;
    var vabs;
    var len;
    var at;
    var phase;

    other = Sk.builtin.complex.check_number_or_complex(other);

    // other == b
    var breal = other.tp$getattr("real").v;
    var bimag = other.tp$getattr("imag").v;
    // this == a
    var areal = this.tp$getattr("real").v;
    var aimag = this.tp$getattr("imag").v;

    if(breal === 0.0 && bimag === 0.0) {
        real = 1.0;
        imag = 0.0;
    } else if(areal === 0.0 && aimag === 0.0) {
        if(bimag !== 0.0 || breal < 0.0) {
            throw new Sk.builtin.ZeroDivisonError("complex division by zero");
        }

        real = 0.0;
        imag = 0.0;
    } else {
        vabs = hypot(areal, aimag);
        len = Math.pow(vabs, breal);
        at = Math.atan2(aimag, areal);
        phase = at * breal;

        if(bimag !== 0.0) {
            len /= Math.exp(at * bimag);
            phase += bimag * Math.log(vabs);
        }

        real = len * Math.cos(phase);
        imag = len * Math.sin(phase);
    }

    return new Sk.builtin.complex(new Sk.builtin.float_(real), new Sk.builtin.float_(imag));
};

Sk.builtin.complex.prototype.nb$inplace_add = Sk.builtin.complex.prototype.nb$add;

Sk.builtin.complex.prototype.nb$inplace_subtract = Sk.builtin.complex.prototype.nb$subtract;

Sk.builtin.complex.prototype.nb$inplace_multiply = Sk.builtin.complex.prototype.nb$multiply;

Sk.builtin.complex.prototype.nb$inplace_divide = Sk.builtin.complex.prototype.nb$divide;

Sk.builtin.complex.prototype.nb$inplace_remainder = Sk.builtin.complex.prototype.nb$remainder;

Sk.builtin.complex.prototype.nb$inplace_floor_divide = Sk.builtin.complex.prototype.nb$floor_divide;

Sk.builtin.complex.prototype.nb$inplace_power = Sk.builtin.complex.prototype.nb$power;

Sk.builtin.complex.prototype.nb$negative = function () {
    var real;
    var imag;
    // this == a
    var areal = this.tp$getattr("real").v;
    var aimag = this.tp$getattr("imag").v;

    real = -areal;
    imag = -aimag;

    return new Sk.builtin.complex(new Sk.builtin.float_(real), new Sk.builtin.float_(imag));
};

Sk.builtin.complex.prototype.nb$positive = function () {
    return Sk.builtin.complex.check_number_or_complex(this);
};

/**
 *  check if op is instance of complex or a sub-type
 */
Sk.builtin.complex._complex_check = function(op) {
    if(op === undefined) {
        return false;
    }

    if(op instanceof Sk.builtin.complex || (op.tp$name && op.tp$name === "complex")) {
        return true;
    }

    // ToDo: check if op is sub-class of complex
    if(Sk.builtin.issubclass(op, Sk.builtin.complex)) {
        return true;
    }

    return false;
};

Sk.builtin.complex.prototype.tp$richcompare = function(w, op) {
    var result;
    var equal;
    var i;

    if(op !== "Eq" && op !== "NotEq") {
        throw new Sk.builtin.NotImplementedError();
    }

    // assert(PyComplex_Check(v)));
    i = Sk.builtin.complex.check_number_or_complex(this);
    var _real = i.tp$getattr("real").v;
    var _imag = i.tp$getattr("imag").v;

    if(Sk.builtin.checkInt(w)) {
        /* Check for 0.0 imaginary part first to avoid the rich
         * comparison when possible.
         */

        // if true, the complex number has just a real part
        if(_imag === 0.0) {
            equal = Sk.misceval.richCompareBool(new Sk.builtin.float_(_real), w, op);
        } else {
            equal = false;
        }
    } else if(Sk.builtin.checkFloat(w)) {
        equal = (_real === Sk.ffi.remapToJs(w) && _imag === 0.0);
    } else if(Sk.builtin._complex_check(w)) {
        // ToDo: figure if we need to call to_complex
        var w_real = i.tp$getattr("real").v;
        var w_imag = i.tp$getattr("imag").v;
        equal = _real === w_real && _imag === w_imag;
    } else {
        throw new Sk.builtin.NotImplementedError();
    }

    // invert result if op == NotEq
    if(op === "NotEq") {
        equal = !equal;
    }

    // wrap as bool
    result = Sk.builtin.bool(equal);

    return result;
};

// Despite what jshint may want us to do, these two  functions need to remain
// as == and !=  Unless you modify the logic of numberCompare do not change
// these.
Sk.builtin.complex.prototype.__eq__ = function (me, other) {
    return Sk.builtin.complex.prototype.tp$richcompare.call(me, other, "Eq");
};

Sk.builtin.complex.prototype.__ne__ = function (me, other) {
    return Sk.builtin.complex.prototype.tp$richcompare.call(me, other, "NotEq");
};

Sk.builtin.complex.prototype.__lt__ = function (me, other) {
    throw new Sk.builtin.TypeError("unorderable types: " + Sk.abstr.typeName(me) + " < " + Sk.abstr.typeName(other));
};

Sk.builtin.complex.prototype.__le__ = function (me, other) {
    throw new Sk.builtin.TypeError("unorderable types: " + Sk.abstr.typeName(me) + " <= " + Sk.abstr.typeName(other));
};

Sk.builtin.complex.prototype.__gt__ = function (me, other) {
    throw new Sk.builtin.TypeError("unorderable types: " + Sk.abstr.typeName(me) + " > " + Sk.abstr.typeName(other));
};

Sk.builtin.complex.prototype.__ge__ = function (me, other) {
    throw new Sk.builtin.TypeError("unorderable types: " + Sk.abstr.typeName(me) + " >= " + Sk.abstr.typeName(other));
};

Sk.builtin.complex.prototype.__float__ = function (self) {
    throw new Sk.builtin.TypeError("can't convert complex to float");
};

Sk.builtin.complex.prototype.__float__ = function (self) {
    throw new Sk.builtin.TypeError("can't convert complex to int");
};


Sk.builtin.complex.prototype.tp$getattr = function(name) {
    if(name != null && (Sk.builtin.checkString(name) || typeof name === "string")) {
        var _name = name;

        // get javascript string
        if(Sk.builtin.checkString(name)) {
            _name = Sk.ffi.remapToJs(name);
        }

        if(_name === "real" || _name === "imag") {
            return this[_name];
        }
    }

    // if we have not returned yet, try the genericgetattr
    return Sk.builtin.object.prototype.GenericGetAttr.call(this, name);
};

Sk.builtin.complex.prototype.tp$setattr = function(name, value) {
    if(name != null && (Sk.builtin.checkString(name) || typeof name === "string")) {
        var _name = name;

        // get javascript string
        if(Sk.builtin.checkString(name)) {
            _name = Sk.ffi.remapToJs(name);
        }

        if(_name === "real" || _name === "imag") {
            throw new Sk.builtin.AttributeError("readonly attribute");
        }
    }

    // if we have not returned yet, try the genericgetattr
    return Sk.builtin.object.prototype.GenericSetAttr.call(this, name, value);
};

Sk.builtin.complex.prototype["$r"] = function () {
    if(this.tp$getattr("real").v === 0) {
        return new Sk.builtin.str(this.tp$getattr("imag").v + "j"); // only imag part
    } else {
        return new Sk.builtin.str("(" + this.tp$getattr("real").v + "+" + this.tp$getattr("imag").v + "j)");
    }
};

Sk.builtin.complex.prototype.tp$str = function () {
    if(this.tp$getattr("real").v === 0) {
        return new Sk.builtin.str(this.tp$getattr("imag").v + "j"); // only imag part
    } else {
        return new Sk.builtin.str("(" + this.tp$getattr("real").v + "+" + this.tp$getattr("imag").v + "j)");
    }
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

Sk.builtin.complex.prototype.__abs__  = new Sk.builtin.func(function (self) {
    var hypot = Math.hypot || function() {
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

    var result;
    var _real = this.tp$getattr("real").v;
    var _imag = this.tp$getattr("imag").v;

    if(!Sk.builtin.complex._is_finite(_real) || !Sk.builtin.complex._is_finite(_imag)) {
        /* C99 rules: if either the real or the imaginary part is an
           infinity, return infinity, even if the other part is a
           NaN.
        */

        if(Sk.builtin.complex._is_infinity(_real)) {
            result = Math.abs(_real);
            return new Sk.builtin.float_(result);
        }

        if(Sk.builtin.complex._is_infinity(_imag)) {
            result = Math.abs(_imag);
            return new Sk.builtin.float_(result);
        }

         /* either the real or imaginary part is a NaN,
           and neither is infinite. Result should be NaN. */

        return new Sk.builtin.nmber(NaN, Sk.builtin.nmber.float$);
    }

    result = hypot(_real, _imag);

    if(!Sk.builtin.complex._is_finite(result)) {
        throw new Sk.builtin.OverflowError("absolute value too large");
    }

    return new Sk.builtin.float_(result);
});

Sk.builtin.complex.prototype.__bool__   = new Sk.builtin.func(function (self) {
    return Sk.builtin.bool(self.tp$getattr("real").v || self.tp$getattr("real").v);
});

goog.exportSymbol("Sk.builtin.complex", Sk.builtin.complex);
