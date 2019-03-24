import { setUpInheritance, lookupSpecial, typeName } from './abstract';
import { remapToJs } from './ffi';
import { func, pyCheckArgs, checkString, checkComplex, checkNumber, checkNone, checkInt, checkFloat } from './function';
import { TypeError, ZeroDivisionError, AttributeError, OverflowError } from './errors';
import { NotImplementedError, NotImplemented } from './object';
import { asnum$ } from './builtin';
import { false$, true$ } from './constants';
import { numtype } from './numtype';
import { typeLookup } from './type';
import { float_ } from './float';
import { int_ } from './int';
import { bool } from './bool';
import { tuple } from './tuple';
import { type } from './type';
import { issubclass } from './builtin';
import { str } from './str';
import { richCompareBool, callsim } from './misceval';

/**
 * hypot is a ESCMA6 function and maybe not available across all browsers
 */
const hypot = hypot || function() {
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

export class complex {
    /**
     * complex_new see https://hg.python.org/cpython/file/f0e2caad4200/Objects/complexobject.c#l911
     * @constructor
     * @param {Object} real part of the complex number
     * @param {?Object=} imag part of the complex number
     * @this {object}
     *
     * Prefering here == instead of ===, otherwise also undefined has to be matched explicitly
     *
     * FIXME: it seems that we somehow need to call __float__/__int__ if arguments provide those methods
     *
     */
    constructor(real, imag) {
        pyCheckArgs("complex", arguments, 0, 2);

        var r, i, tmp; // PyObject
        var nbr, nbi; // real, imag as numbers
        var own_r = false;
        var cr = {}; // PyComplexObject
        var ci = {}; // PyComplexObject
        var cr_is_complex = false;
        var ci_is_complex = false;

        // check if kwargs
        // ToDo: this is only a temporary replacement
        r = real == null ? false$ : real; // r = Py_False;
        i = imag;

        // handle case if passed in arguments are of type complex
        if (r instanceof complex && i == null) {
            return real;
        }

        if (r != null && checkString(r)) {
            if(i != null) {
                throw new TypeError("complex() can't take second arg if first is a string");
            }

            return complex.complex_subtype_from_string(r);
        }

        if (i != null && checkString(i)) {
            throw new TypeError("complex() second arg can't be a string");
        }


        // try_complex_special_method
        tmp = complex.try_complex_special_method(r);
        if (tmp != null && tmp !== NotImplemented.NotImplemented$) {
            if (!checkComplex(tmp)) {
                throw new TypeError("__complex__ should return a complex object");
            }

            r = tmp;
        }

        // this check either returns a javascript number or the passed object
        // but it actually, should check for r->ob_type->tp_as_number
        // this check is useless
        nbr = asnum$(r);
        if (i != null) {
            nbi = asnum$(i);
        }

        // this function mimics the tp_as_number->nb_float check in cpython
        var nb_float = function(op) {
            if(checkNumber(op)) {
                return true;
            }

            if(typeLookup(op.ob$type, "__float__") !== undefined) {
                return true;
            }
        };

        // check for valid arguments
        if (nbr == null || (!nb_float(r) && !ScheckComplex(r)) || ((i != null) && (nbi == null || (!nb_float(i) && !checkComplex(i))))) {
            throw new TypeError("complex() argument must be a string or number");
        }

        /* If we get this far, then the "real" and "imag" parts should
        both be treated as numbers, and the constructor should return a
        complex number equal to (real + imag*1j).

        Note that we do NOT assume the input to already be in canonical
        form; the "real" and "imag" parts might themselves be complex
        numbers, which slightly complicates the code below. */

        if (complex._complex_check(r)) {
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
            tmp = float_.PyFloat_AsDouble(r); // tmp = PyNumber_Float(r);

            if (tmp == null) {
                return null;
            }

            cr.real = tmp;
            cr.imag = 0.0;
        }

        if (i == null) {
            ci.real = 0.0;
        } else if (complex._complex_check(i)) {
            ci.real = i.real.v;
            ci.imag = i.imag.v;
            ci_is_complex = true;
        } else {
            /* The "imag" part really is entirely imaginary, and
            contributes nothing in the real direction.
            Just treat it as a double. */
            tmp = float_.PyFloat_AsDouble(i);

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

        // adjust for negated imaginary literal
        if (cr.real === 0 && (ci.real < 0 || complex._isNegativeZero(ci.real))) {
            cr.real = -0;
        }

        // save them as properties
        this.real = new float_(cr.real);
        this.imag = new float_(ci.real);

        this.__class__ = complex;

        return this;
    };

    nb$int_() {
        throw new TypeError("can't convert complex to int");
    }

    nb$float_() {
        throw new TypeError("can't convert complex to float");
    }

    nb$lng() {
        throw new TypeError("can't convert complex to long");
    }

    /**
     * Otherwise google closure complains about ZeroDivisionError not being
     * defined
     * @suppress {missingProperties}
     *
     * implementation based on complexobject.c:c_quot
     */
    nb$divide(other) {
        var real;
        var imag;

        other = complex.check_number_or_complex(other);

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
                throw new ZeroDivisionError("complex division by zero");
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
            goog.asserts.assert(bimag !== 0.0);
            real = (areal * ratio + aimag) / denom;
            imag = (aimag * ratio - areal) / denom;
        } else {
            // At least one of b.real or b.imag is a NaN
            real = NaN;
            imag = NaN;
        }

        return new complex(new float_(real), new float_(imag));
    }

    nb$floor_divide(other) {
        throw new TypeError("can't take floor of complex number.");
    }

    nb$remainder(other) {
        throw new TypeError("can't mod complex numbers.");
    }

    /**
     * @param {?Object=} z, modulo operation
     */
    nb$power(other, z) {
        var p;
        var exponent;
        var int_exponent;
        var a, b;

        // none is allowed
        if (z != null && !checkNone(z)) {
            throw new ValueError("complex modulo");
        }

        a = this;
        b = complex.check_number_or_complex(other);

        exponent = b;
        int_exponent = b.real.v | 0; // js convert to int
        if (exponent.imag.v === 0.0 && exponent.real.v === int_exponent) {
            p = complex.c_powi(a, int_exponent);
        } else {
            p = complex.c_pow(a, exponent);
        }

        return p;
    }

    nb$subtract(other) {
        var result; // Py_complex
        var a, b; // Py_complex

        a = complex.check_number_or_complex(this);
        b = complex.check_number_or_complex(other);

        result = complex._c_diff(a, b);

        return result;
    }

    nb$multiply(other) {
        var real;
        var imag;
        var a, b; // Py_complex

        a = this;
        b = complex.check_number_or_complex(other);

        real = a.real.v * b.real.v - a.imag.v * b.imag.v;
        imag = a.real.v * b.imag.v + a.imag.v * b.real.v;

        return new complex(new float_(real), new float_(imag));
    };

    /**
        _PyHASH_IMAG refers to _PyHASH_MULTIPLIER which refers to 1000003
    */
    tp$hash() {
        return new int_(this.tp$getattr("imag").v * 1000003 + this.tp$getattr("real").v);
    }

    nb$add(other) {
        var real;
        var imag;

        other = complex.check_number_or_complex(other);

        real = this.tp$getattr("real").v + other.tp$getattr("real").v;
        imag = this.tp$getattr("imag").v + other.tp$getattr("imag").v;

        return new complex(new float_(real), new float_(imag));
    }

    tp$str() {
        return complex.complex_format(this, null, "g"); // g, 12 == Py_Float_STR_PRECISION
    }

    _internalGenericGetAttr = object.prototype.GenericGetAttr;

    /**
     * Custom getattr impl. to get the c.real and c.imag to work. Though we should
     * consider to implement tp$members that always are attributs on the class and
     * will be used in the genericgetattr method.
     * Would be super easy to implement the readonly stuff too.
     *
     */
    tp$getattr(name) {
        if (name != null && (checkString(name) || typeof name === "string")) {
            var _name = name;

            // get javascript string
            if (checkString(name)) {
                _name = remapToJs(name);
            }

            if (_name === "real" || _name === "imag") {
                return this[_name];
            }
        }

        // if we have not returned yet, try the genericgetattr
        return this._internalGenericGetAttr(name);
    }

    tp$setattr(name, value) {
        if (name != null && (checkString(name) || typeof name === "string")) {
            var _name = name;

            // get javascript string
            if (checkString(name)) {
                _name = remapToJs(name);
            }

            if (_name === "real" || _name === "imag") {
                throw new AttributeError("readonly attribute");
            }
        }

        // builtin: --> all is readonly (I am not happy with this)
        throw new AttributeError("'complex' object attribute '" + name + "' is readonly");
    }

    nb$negative() {
        var real;
        var imag;
        // this == a
        var areal = this.real.v;
        var aimag = this.imag.v;

        real = -areal;
        imag = -aimag;

        return new complex(new float_(real), new float_(imag));
    }

    nb$positive() {
        return complex.check_number_or_complex(this);
    }

    tp$richcompare = function (w, op) {
        var result;
        var equal;
        var i;

        if (op !== "Eq" && op !== "NotEq") {
            if(checkNumber(w) || complex._complex_check(w)) {
                throw new TypeError("no ordering relation is defined for complex numbers");
            }

            return NotImplemented.NotImplemented$;
        }

        // assert(PyComplex_Check(v)));
        i = complex.check_number_or_complex(this);
        var _real = i.tp$getattr("real").v;
        var _imag = i.tp$getattr("imag").v;

        if (checkInt(w)) {
            /* Check for 0.0 imaginary part first to avoid the rich
             * comparison when possible.
             */

            // if true, the complex number has just a real part
            if (_imag === 0.0) {
                equal = richCompareBool(new float_(_real), w, op);
                result = new bool( equal);
                return result;
            } else {
                equal = false;
            }
        } else if (checkFloat(w)) {
            equal = (_real === float_.PyFloat_AsDouble(w) && _imag === 0.0);
        } else if (complex._complex_check(w)) {
            // ToDo: figure if we need to call to_complex
            var w_real = w.tp$getattr("real").v;
            var w_imag = w.tp$getattr("imag").v;
            equal = _real === w_real && _imag === w_imag;
        } else {
            return NotImplemented.NotImplemented$;
        }

        // invert result if op == NotEq
        if(op === "NotEq") {
            equal = !equal;
        }

        // wrap as bool
        result = new bool( equal);

        return result;
    }

    $r() {
        return complex.complex_format(this, 0, "r");
    }

    nb$inplace_add = complex.prototype.nb$add;

    nb$inplace_subtract = complex.prototype.nb$subtract;

    nb$inplace_multiply = complex.prototype.nb$multiply;

    nb$inplace_divide = complex.prototype.nb$divide;

    nb$inplace_remainder = complex.prototype.nb$remainder;

    nb$inplace_floor_divide = complex.prototype.nb$floor_divide;

    nb$inplace_power = complex.prototype.nb$power;

    __doc__ = new str("complex(real[, imag]) -> complex number\n\nCreate a complex number from a real part and an optional imaginary part.\nThis is equivalent to (real + imag*1j) where imag defaults to 0.");

    __eq__ = func(function (me, other) {
        return complex.prototype.tp$richcompare.call(me, other, "Eq");
    });

    __ne__ = func(function (me, other) {
        return complex.prototype.tp$richcompare.call(me, other, "NotEq");
    });

        /**
     * Do we really need to implement those? Otherwise I can't find in Sk.abstr a place where this particular
     * expcetion is thrown.git co
     */
    __lt__ = func(function (me, other) {
        throw new TypeError("unorderable types: " + typeName(me) + " < " + typeName(other));
    });

    __le__ = func(function (me, other) {
        throw new TypeError("unorderable types: " + typeName(me) + " <= " + typeName(other));
    });

    __gt__ = func(function (me, other) {
        throw new TypeError("unorderable types: " + typeName(me) + " > " + typeName(other));
    });

    __ge__ = func(function (me, other) {
        throw new TypeError("unorderable types: " + typeName(me) + " >= " + typeName(other));
    });

    __float__ = func(function (self) {
        throw new TypeError("can't convert complex to float");
    });

    __int__ = func(function (self) {
        throw new TypeError("can't convert complex to int");
    });

    /**
     * @suppress {missingProperties}
     */
    __abs__  = new func(function (self) {
        var result;
        var _real = self.real.v;
        var _imag = self.imag.v;

        if (!complex._is_finite(_real) || !complex._is_finite(_imag)) {
            /* C99 rules: if either the real or the imaginary part is an
            infinity, return infinity, even if the other part is a
            NaN.
            */

            if (complex._is_infinity(_real)) {
                result = Math.abs(_real);
                return new float_(result);
            }

            if (complex._is_infinity(_imag)) {
                result = Math.abs(_imag);
                return new float_(result);
            }

            /* either the real or imaginary part is a NaN,
            and neither is infinite. Result should be NaN. */

            return new float_(NaN);
        }

        result = hypot(_real, _imag);

        if (!complex._is_finite(result)) {
            throw new OverflowError("absolute value too large");
        }

        return new float_(result);
    });

    __bool__   = new func(function (self) {
        return new bool( self.tp$getattr("real").v || self.tp$getattr("real").v);
    });

    __truediv__ = new func(function (self, other){
        pyCheckArgs("__truediv__", arguments, 1, 1, true);
        return self.nb$divide.call(self, other);
    });

    __hash__ = new func(function (self){
        pyCheckArgs("__hash__", arguments, 0, 0, true);

        return self.tp$hash.call(self);
    });

    __add__ = new func(function (self, other){
        pyCheckArgs("__add__", arguments, 1, 1, true);
        return self.nb$add.call(self, other);
    });

    __repr__ = new func(function (self){
        pyCheckArgs("__repr__", arguments, 0, 0, true);

        return self["r$"].call(self);
    });

    __str__ = new func(function (self){
        pyCheckArgs("__str__", arguments, 0, 0, true);

        return self.tp$str.call(self);
    });

    __sub__ = new func(function (self, other){
        pyCheckArgs("__sub__", arguments, 1, 1, true);
        return self.nb$subtract.call(self, other);
    });

    __mul__ = new func(function (self, other){
        pyCheckArgs("__mul__", arguments, 1, 1, true);
        return self.nb$multiply.call(self, other);
    });

    __div__ = new func(function (self, other){
        pyCheckArgs("__div__", arguments, 1, 1, true);
        return self.nb$divide.call(self, other);
    });

    __floordiv__ = new func(function (self, other){
        pyCheckArgs("__floordiv__", arguments, 1, 1, true);
        return self.nb$floor_divide.call(self, other);
    });

    __mod__ = new func(function (self, other){
        pyCheckArgs("__mod__", arguments, 1, 1, true);
        return self.nb$remainder.call(self, other);
    });

    __pow__ = new func(function (self, other, z){
        pyCheckArgs("__pow__", arguments, 1, 2, true);
        return self.nb$power.call(self, other, z);
    });

    __neg__ = new func(function (self){
        pyCheckArgs("__neg__", arguments, 0, 0, true);
        return self.nb$negative.call(self);
    });

    __pos__ = new func(function (self){
        pyCheckArgs("__pos__", arguments, 0, 0, true);
        return self.nb$positive.call(self);
    });

    conjugate = new func(function (self){
        pyCheckArgs("conjugate", arguments, 0, 0, true);
        var _imag = self.imag.v;
        _imag = -_imag;

        return new complex(self.real, new float_(_imag));
    });

    // deprecated
    __divmod__ = new func(function (self, other){
        pyCheckArgs("__divmod__", arguments, 1, 1, true);

        var div, mod; // Py_complex
        var d, m, z; // PyObject
        var a, b; // Py_complex
        a = complex.check_number_or_complex(self);
        b = complex.check_number_or_complex(other);

        div = a.nb$divide.call(a, b); // the raw divisor value

        div.real = new float_(Math.floor(div.real.v));
        div.imag = new float_(0.0);

        mod = a.nb$subtract.call(a, b.nb$multiply.call(b, div));

        z = new tuple([div, mod]);

        return z;
    });

    __getnewargs__ = new func(function (self){
        pyCheckArgs("__getnewargs__", arguments, 0, 0, true);

        return new tuple([self.real, self.imag]);
    });

    __nonzero__ = new func(function (self){
        pyCheckArgs("__nonzero__", arguments, 0, 0, true);

        if(self.real.v !== 0.0 || self.imag.v !== 0.0) {
            return true$;
        } else {
            return false$;
        }
    });


    /**
     * https://hg.python.org/cpython/file/3cf2990d19ab/Objects/complexobject.c#l907
     * also see _PyComplex_FormatAdvanced
     *
     * We currently use the signature (self, format_spec) instead of (self, args). So we do
     * not need to unwrap the args.
     */
    __format__ = new func(function (self, format_spec){
        var result; // PyObject

        if (format_spec == null) {
            return null;
        }

        if (checkString(format_spec)) {
            result = complex._PyComplex_FormatAdvanced(self, format_spec);

            return result;
        }


        throw new TypeError("__format__ requires str or unicode");
    });


    static _isNegativeZero(val) {
        if (val !== 0) {
            return false;
        }

        return 1/val === -Infinity;
    }

    /**
     * Internal method to check if op has __complex__
     */
    static try_complex_special_method(op) {
        var complexstr = new str("__complex__");
        var f; // PyObject
        var res;

        // return early
        if (op == null) {
            return null;
        }

        // the lookup special method does already all the magic
        f = lookupSpecial(op, "__complex__");

        if (f != null) {
            // method on builtin, provide this arg
            res = callsim(f, op);

            return res;
        }

        return null;
    }

    /**
        Check if given argument is number or complex and always
        returns complex type.
    */
    static check_number_or_complex(other) {
        /* exit early */
        if (!checkNumber(other) && other.tp$name !== "complex") {
            throw new TypeError("unsupported operand type(s) for +: 'complex' and '" + typeName(other) + "'");
        }

        /* converting to complex allows us to use always only one formula */
        if (checkNumber(other)) {
            other = new complex(other); // create complex
        }

        return other;
    }

    /**
        Parses a string repr of a complex number
    */
    static complex_subtype_from_string(val) {
        var index;
        var start;
        var val_wws;              // val with removed beginning ws and (
        var x = 0.0, y = 0.0;     // real, imag parts
        var got_bracket = false;  // flag for braces
        var len;                  // total length of val
        var match;                // regex result

        // first check if val is javascript string or python string
        if (checkString(val)) {
            val = remapToJs(val);
        } else if (typeof val !== "string") {
            throw new TypeError("provided unsupported string-alike argument");
        }

        /* This is an python specific error, this does not do any harm in js, but we want
        * to be as close to the orginial impl. as possible.
        *
        * Check also for empty strings. They are not allowed.
        */
        if (val.indexOf("\0") !== -1 || val.length === 0 || val === "") {
            throw new ValueError("complex() arg is a malformed string");
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
            } else if(val[index] === "+" || val[index] === "-") {
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
                    throw new ValueError("complex() arg is malformed string");
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
                throw new ValueError("complex() arg is malformed string");
            }

            index++;

            while (val[index] === " ") {
                index++;
            }
        }

        /* we should now be at the end of the string */
        if (val.length !== index) {
            throw new ValueError("complex() arg is malformed string");
        }

        // return here complex number parts
        return new complex(new float_(x), new float_(y));
    }

    /* internal subtract/diff function that calls internal float diff */
    static _c_diff = function (a, b) {
        var r, i; // Py_Float
        r = a.real.nb$subtract.call(a.real, b.real);
        i = a.imag.nb$subtract.call(a.imag, b.imag);

        return new complex(r, i);
    }

    // power of complex a and complex exponent b
    static c_pow = function (a, b) {
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
            if(bimag !== 0.0 || breal < 0.0) {
                throw new ZeroDivisionError("complex division by zero");
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

        return new complex(new float_(real), new float_(imag));
    }

    // power of complex x and integer exponent n
    static c_powi = function (x, n) {
        var cn; // Py_complex
        var c1;

        if (n > 100 || n < -100) {
            cn = new complex(new float_(n), new float_(0.0));
            return complex.c_pow(x, cn);
        } else if (n > 0) {
            return complex.c_powu(x, n);
        } else {
            //  return c_quot(c_1,c_powu(x,-n));
            c1 = new complex(new float_(1.0), new float_(0.0));
            return c1.nb$divide(complex.c_powu(x,-n));
        }
    };

    static c_powu = function (x, n) {
        var r, p; // Py_complex
        var mask = 1;
        r = new complex(new float_(1.0), new float_(0.0));
        p = x;

        while (mask > 0 && n >= mask) {
            if (n & mask) {
                r = r.nb$multiply(p);
            }

            mask <<= 1;
            p = p.nb$multiply(p);
        }

        return r;
    }

    /**
     *  check if op is instance of complex or a sub-type
     */
    static _complex_check = function (op) {
        if (op === undefined) {
            return false;
        }

        if (op instanceof complex || (op.tp$name && op.tp$name === "complex")) {
            return true;
        }

        // check if type of ob is a subclass
        if (issubclass(new type(op), complex)) {
            return true;
        }

        return false;
    }

    /**
     * Internal format function for repr and str
     * It is not intended for __format__ calls
     *
     * This functions assumes, that v is always instance of complex
     */
    static complex_format = function (v, precision, format_code){
        function copysign (a, b) {
            return b < 0 ? -Math.abs(a) : Math.abs(a);
        }

        if (v == null || !complex._complex_check(v)) {
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
            im = complex.PyOS_double_to_string(v.imag.v, format_code, precision, 0, null);
            // im = v.imag.v;
        } else {
            /* Format imaginary part with sign, real part without */
            pre = complex.PyOS_double_to_string(v.real.v, format_code, precision, 0, null);
            re = pre;

            im = complex.PyOS_double_to_string(v.imag.v, format_code, precision, complex.PyOS_double_to_string.Py_DTSF_SIGN, null);

            if (v.imag.v === 0 && 1/v.imag.v === -Infinity && im && im[0] !== "-"){
                im = "-" + im; // force negative zero sign
            }

            lead = "(";
            tail = ")";
        }

        result = "" + lead + re + im + "j" + tail; // concat all parts

        return new str(result);
    }

    static _PyComplex_FormatAdvanced = function(self, format_spec) {
        throw new NotImplementedError("__format__ is not implemented for complex type.");
    }

    /**
        Return true if float or double are is neither infinite nor NAN, else false
        Value is already a Javascript object
    */
    static _is_finite = function (val) {
        return !isNaN(val) && val !== Infinity && val !== -Infinity;
    }

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
Sk.builtin.complex.prototype.int$format = function __format__(self, format_spec){
    var result; // PyObject

    if (format_spec == null) {
        return null;
    }
    throw new TypeError("__format__ requires str or unicode");
};
Sk.builtin.complex.prototype.int$format.co_name = new Sk.builtin.str("__format__");
Sk.builtin.complex.prototype.__format__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$format);

Sk.builtin.complex._PyComplex_FormatAdvanced = function(self, format_spec) {
    throw new NotImplementedError("__format__ is not implemented for complex type.");
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
Sk.builtin.complex.prototype.int$abs = function __abs__(self) {
    var result;
    var _real = self.real.v;
    var _imag = self.imag.v;

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
        throw new OverflowError("absolute value too large");
    }

    return new Sk.builtin.float_(result);
};
Sk.builtin.complex.prototype.int$abs.co_name = new Sk.builtin.str("__abs__");
Sk.builtin.complex.prototype.__abs__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$abs);

Sk.builtin.complex.prototype.int$bool = function __bool__(self) {
    return new Sk.builtin.bool( self.tp$getattr("real").v || self.tp$getattr("real").v);
};
Sk.builtin.complex.prototype.int$bool.co_name = new Sk.builtin.str("__bool__");
Sk.builtin.complex.prototype.__bool__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$bool);

Sk.builtin.complex.prototype.int$truediv = function __truediv__(self, other){
    pyCheckArgs("__truediv__", arguments, 1, 1, true);
    return self.nb$divide.call(self, other);
};
Sk.builtin.complex.prototype.int$truediv.co_name = new Sk.builtin.str("__truediv__");
Sk.builtin.complex.prototype.__truediv__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$truediv);

Sk.builtin.complex.prototype.int$hash = function __hash__(self){
    pyCheckArgs("__hash__", arguments, 0, 0, true);

    return self.tp$hash.call(self);
};
Sk.builtin.complex.prototype.int$hash.co_name = new Sk.builtin.str("__hash__");
Sk.builtin.complex.prototype.__hash__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$hash);

Sk.builtin.complex.prototype.int$add = function __add__(self, other){
    pyCheckArgs("__add__", arguments, 1, 1, true);
    return self.nb$add.call(self, other);
};
Sk.builtin.complex.prototype.int$add.co_name = new Sk.builtin.str("__add__");
Sk.builtin.complex.prototype.__add__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$add);


Sk.builtin.complex.prototype.int$repr = function __repr__(self){
    pyCheckArgs("__repr__", arguments, 0, 0, true);

    return self["r$"].call(self);
};
Sk.builtin.complex.prototype.int$repr.co_name = new Sk.builtin.str("__repr__");
Sk.builtin.complex.prototype.__repr__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$repr);

Sk.builtin.complex.prototype.int$str = function __str__(self){
    pyCheckArgs("__str__", arguments, 0, 0, true);

    return self.tp$str.call(self);
};
Sk.builtin.complex.prototype.int$str.co_name = new Sk.builtin.str("__str__");
Sk.builtin.complex.prototype.__str__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$str);

Sk.builtin.complex.prototype.int$sub = function __sub__(self, other){
    pyCheckArgs("__sub__", arguments, 1, 1, true);
    return self.nb$subtract.call(self, other);
};
Sk.builtin.complex.prototype.int$sub.co_name = new Sk.builtin.str("__sub__");
Sk.builtin.complex.prototype.__sub__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$sub);

Sk.builtin.complex.prototype.int$mul = function __mul__(self, other){
    pyCheckArgs("__mul__", arguments, 1, 1, true);
    return self.nb$multiply.call(self, other);
};
Sk.builtin.complex.prototype.int$mul.co_name = new Sk.builtin.str("__mul__");
Sk.builtin.complex.prototype.__mul__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$mul);

Sk.builtin.complex.prototype.int$div = function __div__(self, other){
    pyCheckArgs("__div__", arguments, 1, 1, true);
    return self.nb$divide.call(self, other);
};
Sk.builtin.complex.prototype.int$div.co_name = new Sk.builtin.str("__div__");
Sk.builtin.complex.prototype.__div__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$div);

Sk.builtin.complex.prototype.int$floordiv = function __floordiv__(self, other){
    pyCheckArgs("__floordiv__", arguments, 1, 1, true);
    return self.nb$floor_divide.call(self, other);
};
Sk.builtin.complex.prototype.int$floordiv.co_name = new Sk.builtin.str("__floordiv__");
Sk.builtin.complex.prototype.__floordiv__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$floordiv);

Sk.builtin.complex.prototype.int$mod = function __mod__(self, other){
    pyCheckArgs("__mod__", arguments, 1, 1, true);
    return self.nb$remainder.call(self, other);
};
Sk.builtin.complex.prototype.int$mod.co_name = new Sk.builtin.str("__mod__");
Sk.builtin.complex.prototype.__mod__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$mod);

Sk.builtin.complex.prototype.int$pow = function __pow__(self, other, z){
    pyCheckArgs("__pow__", arguments, 1, 2, true);
    return self.nb$power.call(self, other, z);
};
Sk.builtin.complex.prototype.int$pow.co_name = new Sk.builtin.str("__pow__");
Sk.builtin.complex.prototype.__pow__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$pow);

Sk.builtin.complex.prototype.int$neg = function __neg__(self){
    pyCheckArgs("__neg__", arguments, 0, 0, true);
    return self.nb$negative.call(self);
};
Sk.builtin.complex.prototype.__neg__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$neg);

Sk.builtin.complex.prototype.int$pos = function __pos__(self){
    pyCheckArgs("__pos__", arguments, 0, 0, true);
    return self.nb$positive.call(self);
};
Sk.builtin.complex.prototype.int$pos.co_name = new Sk.builtin.str("__pos__");
Sk.builtin.complex.prototype.__pos__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$pos);

Sk.builtin.complex.prototype.int$conjugate = function conjugate(self){
    pyCheckArgs("conjugate", arguments, 0, 0, true);
    var _imag = self.imag.v;
    _imag = -_imag;

    return new Sk.builtin.complex(self.real, new Sk.builtin.float_(_imag));
};
Sk.builtin.complex.prototype.int$conjugate.co_name = new Sk.builtin.str("conjugate");
Sk.builtin.complex.prototype.conjugate = new Sk.builtin.func(Sk.builtin.complex.prototype.int$conjugate);

// deprecated
Sk.builtin.complex.prototype.int$divmod = function __divmod__(self, other){
    pyCheckArgs("__divmod__", arguments, 1, 1, true);

    var div, mod; // Py_complex
    var d, m, z; // PyObject
    var a, b; // Py_complex
    a = Sk.builtin.complex.check_number_or_complex(self);
    b = Sk.builtin.complex.check_number_or_complex(other);

    div = a.nb$divide.call(a, b); // the raw divisor value

    div.real = new Sk.builtin.float_(Math.floor(div.real.v));
    div.imag = new Sk.builtin.float_(0.0);

    mod = a.nb$subtract.call(a, b.nb$multiply.call(b, div));

    z = new Sk.builtin.tuple([div, mod]);

    return z;
};
Sk.builtin.complex.prototype.int$divmod.co_name = new Sk.builtin.str("__divmod__");
Sk.builtin.complex.prototype.__divmod__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$divmod);

Sk.builtin.complex.prototype.int$getnewargs = function __getnewargs__(self){
    pyCheckArgs("__getnewargs__", arguments, 0, 0, true);

    return new Sk.builtin.tuple([self.real, self.imag]);
};
Sk.builtin.complex.prototype.int$getnewargs.co_name = new Sk.builtin.str("__getnewargs__");
Sk.builtin.complex.prototype.__getnewargs__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$getnewargs);

Sk.builtin.complex.prototype.int$nonzero = function __nonzero__(self){
    pyCheckArgs("__nonzero__", arguments, 0, 0, true);

    if(self.real.v !== 0.0 || self.imag.v !== 0.0) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.bool.false$;
    }
};
Sk.builtin.complex.prototype.int$nonzero.co_name = new Sk.builtin.str("__nonzero__");
Sk.builtin.complex.prototype.__nonzero__ = new Sk.builtin.func(Sk.builtin.complex.prototype.int$nonzero);

    static _is_infinity = function (val) {
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
     */
    static PyOS_double_to_string = function(val, format_code, precision, flags, type) {
        var format;
        var buf;
        var t;
        var exp;
        var upper = false;

        // Validate format code, and map upper and lower case
        switch(format_code) {
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
                if(precision !== 0) {
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
        if(isNaN(val)) {
            buf = "nan";
            t = complex.PyOS_double_to_string.Py_DTST_NAN;
        } else if (val === Infinity) {
            buf = "inf";
            t = complex.PyOS_double_to_string.Py_DTST_INFINITE;
        } else if (val === -Infinity) {
            buf = "-inf";
            t = complex.PyOS_double_to_string.Py_DTST_INFINITE;
        } else {
            t = complex.PyOS_double_to_string.Py_DTST_FINITE;
            if(flags & complex.PyOS_double_to_string.Py_DTSF_ADD_DOT_0) {
                format_code = "g"; // "Z"; _PyOS_ascii_formatd converts "Z" to "g"
            }

            // ToDo: call snprintf here
            // ToDo: call ascii_formatd
            var format_str = "%";
            format_str += flags & complex.PyOS_double_to_string.Py_DTSF_ALT ? "#" : "";

            if(precision != null) {
                format_str += ".";
                format_str += precision;
            }

            format_str += format_code;
            format_str = new str(format_str);

            /**
             * We cann call nb$remainder with val, because it gets unwrapped and it doesn't matter if it is
             * already a javascript number. If we do not pass a float, we can't distinguish between ints and floats
             * and therefore we can't adjust the sign of the zero accordingly
             */
            buf = format_str.nb$remainder(new float_(val));
            buf = buf.v; // get javascript string
        }

        /**
         * Add sign when requested. It's convenient (esp. when formatting complex numbers) to
         * include sign even for inf and nan.
         */
        if(flags & complex.PyOS_double_to_string.Py_DTSF_SIGN && buf[0] !== "-") {
            buf = "+" + buf;
        }

        if(upper) {
            // Convert to upper case
            buf = buf.toUpperCase();
        }

        return buf;
    }
}

/* PyOS_double_to_string's "flags" parameter can be set to 0 or more of: */
complex.PyOS_double_to_string.Py_DTSF_SIGN = 0x01; // always add the sign
complex.PyOS_double_to_string.Py_DTSF_ADD_DOT_0 = 0x02; // if the result is an integer add ".0"
complex.PyOS_double_to_string.Py_DTSF_ALT = 0x04; // "alternate" formatting. it's format_code specific

/* PyOS_double_to_string's "type", if non-NULL, will be set to one of: */
complex.PyOS_double_to_string.Py_DTST_FINITE = 0;
complex.PyOS_double_to_string.Py_DTST_INFINITE = 1;
complex.PyOS_double_to_string.Py_DTST_NAN = 2;

setUpInheritance("complex", complex, numtype);

