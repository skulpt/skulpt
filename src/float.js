import { lookupSpecial, setUpInheritance, typeName } from './abstract';
import { remapToJs } from './ffi';
import { pyCheckArgs } from './function';
import { TypeError, ZeroDivisionError, NegativePowerError } from './errors';
import { NotImplementedError } from './object';

/**
 * @namespace Sk.builtin
 */
export class float_ {
    /**
     * @constructor
     * float_
     *
     * @description
     * Constructor for Python float. Also used for builtin float().
     *
     * @extends {Sk.builtin.numtype}
     *
     * @param {!(Object|number|string)} x Object or number to convert to Python float.
     * @return {float_} Python float
     */
    constructor(x) {
        var tmp;
        if (x === undefined) {
            return new float_(0.0);
        }

        if (!(this instanceof float_)) {
            return new float_(x);
        }


        if (x instanceof Sk.builtin.str) {
            return str_to_float(x.v);
        }

        // Floats are just numbers
        if (typeof x === "number" || x instanceof int_ || x instanceof lng || x instanceof float_) {
            tmp = Sk.builtin.asnum$(x);
            if (typeof tmp === "string") {
                return _str_to_float(tmp);
            }
            this.v = tmp;
            return this;
        }

        // Convert booleans
        if (x instanceof Sk.builtin.bool) {
            this.v = Sk.builtin.asnum$(x);
            return this;
        }

        // this is a special internal case
        if(typeof x === "boolean") {
            this.v = x ? 1.0 : 0.0;
            return this;
        }

        if (typeof x === "string") {
            this.v = parseFloat(x);
            return this;
        }

        // try calling __float__
        var special = lookupSpecial(x, "__float__");
        if (special != null) {
            // method on builtin, provide this arg
            return Sk.misceval.callsim(special, x);
        }

        throw new TypeError("float() argument must be a string or a number");
    }

    nb$int_() {
        var v = this.v;

        if (v < 0) {
            v = Math.ceil(v);
        } else {
            v = Math.floor(v);
        }

        // this should take care of int/long fitting
        return new int_(v);
    }

    nb$float_() {
        return this;
    }

    nb$lng() {
        return new lng(this.v);
    }

    /**
    * Checks for float subtypes, though skulpt does not allow to
    * extend them for now.
    *
    * Javascript function, returns Javascript object.
    * @param {Object} op The object to check as subtype.
    * @return {boolean} true if op is a subtype of float_, false otherwise
    */
    static PyFloat_Check(op) {
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

        if (Sk.builtin.issubclass(op.ob$type, float_)) {
            return true;
        }

        return false;
    }

    /**
     * Checks if ob is a Python float.
     *
     * This method is just a wrapper, but uses the correct cpython API name.
     *
     * Javascript function, returns Javascript object.
     * @param {Object} op The object to check.
     * @return {boolean} true if op is an instance of float_, false otherwise
     */
    static PyFloat_Check_Exact = function (op) {
        return Sk.builtin.checkFloat(op);
    }

    static PyFloat_AsDouble(op) {
        var f; // nb_float;
        var fo; // PyFloatObject *fo;
        var val;

        // it is a subclass or direct float
        if (op && float_.PyFloat_Check(op)) {
            return remapToJs(op);
        }

        if (op == null) {
            throw new Error("bad argument for internal PyFloat_AsDouble function");
        }

        // check if special method exists (nb_float is not implemented in skulpt, hence we use __float__)
        f = Sk.builtin.type.typeLookup(op.ob$type, "__float__");
        if (f == null) {
            throw new TypeError("a float is required");
        }

        // call internal float method
        fo = Sk.misceval.callsim(f, op);

        // return value of __float__ must be a python float
        if (!float_.PyFloat_Check(fo)) {
            throw new TypeError("nb_float should return float object");
        }

        val = remapToJs(fo);

        return val;
    }

    /**
     * Return this instance's Javascript value.
     *
     * Javascript function, returns Javascript object.
     *
     * @return {number} This instance's value.
     */
    tp$index() {
        return this.v;
    }

    /** @override */
    tp$hash() {
        //the hash of all numbers should be an int and since javascript doesn't really
        //care every number can be an int.
        return this.nb$int_();
    }

    /**
     * Returns a copy of this instance.
     *
     * Javascript function, returns Python object.
     *
     * @return {float_} The copy
     */
    clone() {
        return new float_(this.v);
    }

    /**
     * Returns this instance's value as a string formatted using fixed-point notation.
     *
     * Javascript function, returns Javascript object.
     *
     * @param  {Object|number} x The numer of digits to appear after the decimal point.
     * @return {string}   The string representation of this instance's value.
     */
    toFixed(x) {
        x = Sk.builtin.asnum$(x);
        return this.v.toFixed(x);
    }

    /** @override */
    nb$add(other) {
        if (other instanceof int_ || other instanceof float_) {
            return new float_(this.v + other.v);
        } else if (other instanceof lng) {
            return new float_(this.v + parseFloat(other.str$(10, true)));
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$reflected_add(other) {
        // Should not automatically call this.nb$add, as nb$add may have
        // been overridden by a subclass
        return float_.prototype.nb$add.call(this, other);
    }

    /** @override */
    nb$subtract(other) {
        if (other instanceof int_ || other instanceof float_) {
            return new float_(this.v - other.v);
        } else if (other instanceof lng) {
            return new float_(this.v - parseFloat(other.str$(10, true)));
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$reflected_subtract(other) {
        // Should not automatically call this.nb$add, as nb$add may have
        // been overridden by a subclass
        var negative_this = this.nb$negative();
        return float_.prototype.nb$add.call(negative_this, other);
    }

    /** @override */
    nb$multiply(other) {
        if (other instanceof int_ || other instanceof float_) {
            return new float_(this.v * other.v);
        } else if (other instanceof lng) {
            return new float_(this.v * parseFloat(other.str$(10, true)));
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$reflected_multiply(other) {
        // Should not automatically call this.nb$multiply, as nb$multiply may have
        // been overridden by a subclass
        return this.nb$multiply(other);
    }

    /** @override */
    nb$divide(other) {
        if (other instanceof int_ || other instanceof float_) {

            if (other.v === 0) {
                throw new ZeroDivisionError("integer division or modulo by zero");
            }

            if (this.v === Infinity) {
                if (other.v === Infinity || other.v === -Infinity) {
                    return new float_(NaN);
                } else if (other.nb$isnegative()) {
                    return new float_(-Infinity);
                } else {
                    return new float_(Infinity);
                }
            }
            if (this.v === -Infinity) {
                if (other.v === Infinity || other.v === -Infinity) {
                    return new float_(NaN);
                } else if (other.nb$isnegative()) {
                    return new float_(Infinity);
                } else {
                    return new float_(-Infinity);
                }
            }

            return new float_(this.v / other.v);
        }

        if (other instanceof lng) {
            if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
                throw new ZeroDivisionError("integer division or modulo by zero");
            }

            if (this.v === Infinity) {
                if (other.nb$isnegative()) {
                    return new float_(-Infinity);
                } else {
                    return new float_(Infinity);
                }
            }
            if (this.v === -Infinity) {
                if (other.nb$isnegative()) {
                    return new float_(Infinity);
                } else {
                    return new float_(-Infinity);
                }
            }

            return new float_(this.v / parseFloat(other.str$(10, true)));
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$reflected_divide(other) {
        if (other instanceof int_ ||
            other instanceof lng) {
            other = new float_(other);
        }

        if (other instanceof float_) {
            return other.nb$divide(this);
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$floor_divide(other) {

        if (other instanceof int_ || other instanceof float_) {

            if (this.v === Infinity || this.v === -Infinity) {
                return new float_(NaN);
            }

            if (other.v === 0) {
                throw new ZeroDivisionError("integer division or modulo by zero");
            }

            if (other.v === Infinity) {
                if (this.nb$isnegative()) {
                    return new float_(-1);
                } else {
                    return new float_(0);
                }
            }
            if (other.v === -Infinity) {
                if (this.nb$isnegative() || !this.nb$nonzero()) {
                    return new float_(0);
                } else {
                    return new float_(-1);
                }
            }

            return new float_(Math.floor(this.v / other.v));
        }

        if (other instanceof lng) {
            if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
                throw new ZeroDivisionError("integer division or modulo by zero");
            }

            if (this.v === Infinity || this.v === -Infinity) {
                return new float_(NaN);
            }

            return new float_(Math.floor(this.v / parseFloat(other.str$(10, true))));
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$reflected_floor_divide(other) {
        if (other instanceof int_ ||
            other instanceof lng) {
            other = new float_(other);
        }

        if (other instanceof float_) {
            return other.nb$floor_divide(this);
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$remainder(other) {
        var thisAsLong;
        var op2;
        var tmp;
        var result;

        if (other instanceof int_ || other instanceof float_) {

            if (other.v === 0) {
                throw new ZeroDivisionError("integer division or modulo by zero");
            }

            if (this.v === 0) {
                return new float_(0);
            }

            if (other.v === Infinity) {
                if (this.v === Infinity || this.v === -Infinity) {
                    return new float_(NaN);
                } else if (this.nb$ispositive()) {
                    return new float_(this.v);
                } else {
                    return new float_(Infinity);
                }
            }

            //  Javacript logic on negatives doesn't work for Python... do this instead
            tmp = this.v % other.v;

            if (this.v < 0) {
                if (other.v > 0 && tmp < 0) {
                    tmp = tmp + other.v;
                }
            } else {
                if (other.v < 0 && tmp !== 0) {
                    tmp = tmp + other.v;
                }
            }

            if (other.v < 0 && tmp === 0) {
                tmp = -0.0; // otherwise the sign gets lost by javascript modulo
            } else if (tmp === 0 && Infinity/tmp === -Infinity) {
                tmp = 0.0;
            }

            return new float_(tmp);
        }

        if (other instanceof lng) {
            if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
                throw new $1("integer division or modulo by zero");
            }

            if (this.v === 0) {
                return new float_(0);
            }

            op2 = parseFloat(other.str$(10, true));
            tmp = this.v % op2;

            if (tmp < 0) {
                if (op2 > 0 && tmp !== 0) {
                    tmp = tmp + op2;
                }
            } else {
                if (op2 < 0 && tmp !== 0) {
                    tmp = tmp + op2;
                }
            }

            if (other.nb$isnegative() && tmp === 0) {
                tmp = -0.0; // otherwise the sign gets lost by javascript modulo
            } else if (tmp === 0 && Infinity/tmp === -Infinity) {
                tmp = 0.0;
            }

            return new float_(tmp);
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }


    /** @override */
    nb$reflected_remainder(other) {
        if (other instanceof int_ ||
            other instanceof lng) {
            other = new float_(other);
        }

        if (other instanceof float_) {
            return other.nb$remainder(this);
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$divmod(other) {
        if (other instanceof int_ ||
            other instanceof lng) {
            other = new float_(other);
        }

        if (other instanceof float_) {
            return new Sk.builtin.tuple([
                this.nb$floor_divide(other),
                this.nb$remainder(other)
            ]);
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$reflected_divmod(other) {
        if (other instanceof int_ ||
            other instanceof lng) {
            other = new float_(other);
        }

        if (other instanceof float_) {
            return new Sk.builtin.tuple([
                other.nb$floor_divide(this),
                other.nb$remainder(this)
            ]);
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$power(other, mod) {
        var thisAsLong;
        var result;

        if (other instanceof int_ || other instanceof float_) {
            if (this.v < 0 && other.v % 1 !== 0) {
                throw new NegativePowerError("cannot raise a negative number to a fractional power");
            }
            if (this.v === 0 && other.v < 0) {
                throw new NegativePowerError("cannot raise zero to a negative power");
            }

            result = new float_(Math.pow(this.v, other.v));

            if ((Math.abs(result.v) === Infinity) &&
                (Math.abs(this.v) !== Infinity) &&
                (Math.abs(other.v) !== Infinity)) {
                throw new OverflowError("Numerical result out of range");
            }
            return result;
        }

        if (other instanceof lng) {
            if (this.v === 0 && other.longCompare(Sk.builtin.biginteger.ZERO) < 0) {
                throw new NegativePowerError("cannot raise zero to a negative power");
            }

            return new float_(Math.pow(this.v, parseFloat(other.str$(10, true))));
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$abs() {
        return new float_(Math.abs(this.v));
    }

    /** @override */
    nb$inplace_add = float_.prototype.nb$add;

    /** @override */
    nb$inplace_subtract = float_.prototype.nb$subtract;

    /** @override */
    nb$inplace_multiply = float_.prototype.nb$multiply;

    /** @override */
    nb$inplace_divide = float_.prototype.nb$divide;

    /** @override */
    nb$inplace_remainder = float_.prototype.nb$remainder;

    /** @override */
    nb$inplace_floor_divide = float_.prototype.nb$floor_divide;

    /** @override */
    nb$inplace_power = float_.prototype.nb$power;

    /**
     * @override
     *
     * @return {float_} A copy of this instance with the value negated.
     */
    nb$negative() {
        return new float_(-this.v);
    }

    /** @override */
    nb$positive() {
        return this.clone();
    }

    /** @override */
    nb$nonzero() {
        return this.v !== 0;
    }

    /** @override */
    nb$isnegative() {
        return this.v < 0;
    }

    /** @override */
    nb$ispositive() {
        return this.v >= 0;
    }

    /**
     * Compare this instance's value to another Python object's value.
     *
     * Returns NotImplemented if comparison between float and other type is unsupported.
     *
     * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
     *
     * @return {(number|Sk.builtin.NotImplemented)} negative if this < other, zero if this == other, positive if this > other
     */
    numberCompare(other) {
        var diff;
        var tmp;
        var thisAsLong;

        if (other instanceof int_ || other instanceof float_) {
            if (this.v == Infinity && other.v == Infinity) {
                return 0;
            }
            if (this.v == -Infinity && other.v == -Infinity) {
                return 0;
            }
            return this.v - other.v;
        }

        if (other instanceof lng) {
            if (this.v % 1 === 0) {
                thisAsLong = new lng(this.v);
                tmp = thisAsLong.longCompare(other);
                return tmp;
            }
            diff = this.nb$subtract(other);
            if (diff instanceof float_) {
                return diff.v;
            } else if (diff instanceof lng) {
                return diff.longCompare(Sk.builtin.biginteger.ZERO);
            }
        }

        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    // Despite what jshint may want us to do, these two  functions need to remain
    // as == and !=  Unless you modify the logic of numberCompare do not change
    // these.

    /** @override */
    ob$eq(other) {
        if (other instanceof int_ ||
            other instanceof lng ||
            other instanceof float_) {
            return new Sk.builtin.bool(this.numberCompare(other) == 0); //jshint ignore:line
        } else if (other instanceof Sk.builtin.none) {
            return Sk.builtin.bool.false$;
        } else {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
    }

    /** @override */
    ob$ne(other) {
        if (other instanceof int_ ||
            other instanceof lng ||
            other instanceof float_) {
            return new Sk.builtin.bool(this.numberCompare(other) != 0); //jshint ignore:line
        } else if (other instanceof Sk.builtin.none) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
    }

    /** @override */
    ob$lt(other) {
        if (other instanceof int_ ||
            other instanceof lng ||
            other instanceof float_) {
            return new Sk.builtin.bool(this.numberCompare(other) < 0);
        } else {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
    }

    /** @override */
    ob$le(other) {
        if (other instanceof int_ ||
            other instanceof lng ||
            other instanceof float_) {
            return new Sk.builtin.bool(this.numberCompare(other) <= 0);
        } else {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
    }

    /** @override */
    ob$gt(other) {
        if (other instanceof int_ ||
            other instanceof lng ||
            other instanceof float_) {
            return new Sk.builtin.bool(this.numberCompare(other) > 0);
        } else {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
    }

    /** @override */
    ob$ge(other) {
        if (other instanceof int_ ||
            other instanceof lng ||
            other instanceof float_) {
            return new Sk.builtin.bool(this.numberCompare(other) >= 0);
        } else {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
    }

    /**
     * Round this instance to a given number of digits, or zero if omitted.
     *
     * Implements `__round__` dunder method.
     *
     * Javascript function, returns Python object.
     *
     * @param  {int_} self This instance.
     * @param  {Object|number=} ndigits The number of digits after the decimal point to which to round.
     * @return {float_|int_} The rounded float.
     */
    round$(self, ndigits) {
        pyCheckArgs("__round__", arguments, 1, 2);

        var result, multiplier, number, num10, rounded, bankRound, ndigs;

        if ((ndigits !== undefined) && !Sk.misceval.isIndex(ndigits)) {
            throw new TypeError("'" + typeName(ndigits) + "' object cannot be interpreted as an index");
        }

        number = Sk.builtin.asnum$(self);
        if (ndigits === undefined) {
            ndigs = 0;
        } else {
            ndigs = Sk.misceval.asIndex(ndigits);
        }

        if (Sk.__future__.bankers_rounding) {
            num10 = number * Math.pow(10, ndigs);
            rounded = Math.round(num10);
            bankRound = (((((num10>0)?num10:(-num10))%1)===0.5)?(((0===(rounded%2)))?rounded:(rounded-1)):rounded);
            result = bankRound / Math.pow(10, ndigs);
            if (ndigits === undefined) {
                return new int_(result);
            } else {
                return new float_(result);
            }
        } else {
            multiplier = Math.pow(10, ndigs);
            result = Math.round(number * multiplier) / multiplier;

            return new float_(result);
        }
    }

    __format__(obj, format_spec) {
        var formatstr;
        pyCheckArgs("__format__", arguments, 2, 2);

        if (!Sk.builtin.checkString(format_spec)) {
            if (Sk.__future__.exceptions) {
                throw new TypeError("format() argument 2 must be str, not " + typeName(format_spec));
            } else {
                throw new TypeError("format expects arg 2 to be string or unicode, not " + typeName(format_spec));
            }
        } else {
            formatstr = remapToJs(format_spec);
            if (formatstr !== "") {
                throw new NotImplementedError("format spec is not yet implemented");
            }
        }

        return new Sk.builtin.str(obj);
    }

    conjugate = new func(function (self) {
        return new float_(self.v);
    });

    /** @override */
    $r() {
        return new Sk.builtin.str(this.str$(10, true));
    }

    /**
     * Return the string representation of this instance.
     *
     * Javascript function, returns Python object.
     *
     * @return {Sk.builtin.str} The Python string representation of this instance.
     */
    tp$str() {
        return new Sk.builtin.str(this.str$(10, true));
    }

    /**
     * Convert this instance's value to a Javascript string.
     *
     * Javascript function, returns Javascript object.
     *
     * @param {number} base The base of the value.
     * @param {boolean} sign true if the value should be signed, false otherwise.
     * @return {string} The Javascript string representation of this instance.
     */
    str$(base, sign) {
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
            tmp = work.toPrecision(12);

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
                while (tmp.charAt(tmp.length-1) == "0") {
                    tmp = tmp.substring(0,tmp.length-1);
                }
                if (tmp.charAt(tmp.length-1) == ".") {
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
        if(this.v === 0 && 1/this.v === -Infinity) {
            tmp = "-" + tmp;
        }

        if (tmp.indexOf(".") < 0 && tmp.indexOf("E") < 0 && tmp.indexOf("e") < 0) {
            tmp = tmp + ".0";
        }

        return tmp;
    }
}

setUpInheritance("float", float_, numtype);

function _str_to_float(str) {
    var tmp;

    if (str.match(/^-inf$/i)) {
        tmp = -Infinity;
    } else if (str.match(/^[+]?inf$/i)) {
        tmp = Infinity;
    } else if (str.match(/^[-+]?nan$/i)) {
        tmp = NaN;
    } else if (!isNaN(str)) {
        tmp = parseFloat(str);
    } else {
        throw new ValueError("float: Argument: " + str + " is not number");
    }
    return new float_(tmp);
};

