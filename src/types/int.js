import { numberBinOp } from '../abstract';
import { remapToJs } from '../ffi';
import { pyCheckArgs, checkInt, checkNumber, checkString } from '../function/checks';
import { func } from '../function';
import { TypeError, AttributeError, ZeroDivisionError, NotImplementedError } from '../errors';
import { none, NotImplemented } from './object';
import { asnum$ } from '../builtin';
import { callsim, isIndex, asIndex } from '../misceval';
import { numtype } from './numtype';
import { lng } from './long';
import { bool } from './bool';
import { str } from './str';
import { float_ } from './float';
import { tuple } from './tuple';
import { true$, false$ } from '../constants';
import { typeName, setUpInheritance } from '../type';

export class int_ extends numtype {
    /**
     * @constructor
     * int_
     *
     * @description
     * Constructor for Python int. If provided number is greater than integer threshold, will return a Python long instead.
     *
     * type int, all integers are created with this method, it is also used
     * for the builtin int()
     *
     * Takes also implemented `__int__` and `__trunc__` methods for x into account
     * and tries to use `__index__` and/or `__int__` if base is not a number
     *
     * @extends {numtype}
     *
     * @param  {!(Object|number)} x    Python object or Javascript number to convert to Python int
     * @param  {!(Object|number)=} base Optional base, can only be used when x is str
     * @return {(int_|lng)}      Python int (or long, if overflow)
     */
    constructor(x, base) {
        var val;
        var ret; // return value
        var magicName; // name of magic method

        if (this instanceof bool) {
            return this;
        }

        if (x instanceof int_ && base === undefined) {
            this.v = x.v;
            return this;
        }

        // if base is not of type int, try calling .__index__
        if(base !== undefined && base !== undefined && !checkInt(base)) {
            if (checkFloat(base)) {
                throw new TypeError("integer argument expected, got " + typeName(base));
            } else if (base.__index__) {
                base = callsim(base.__index__, base);
            } else if(base.__int__) {
                base = callsim(base.__int__, base);
            } else {
                throw new AttributeError(typeName(base) + " instance has no attribute '__index__' or '__int__'");
            }
        }

        if (x instanceof str) {
            base = asnum$(base);

            val = str2number(x.v, base, parseInt, function (x) {
                return -x;
            }, "int");

            if ((val > int_.threshold$) || (val < -int_.threshold$)) {
                // Too big for int, convert to long
                return new lng(x, base);
            }

            this.v = val;
            return this;
        }

        if (base !== undefined && base !== Sk.builtin.none.none$) {
            throw new TypeError("int() can't convert non-string with explicit base");
        }

        if (x === undefined || x === none) {
            x = 0;
        }

        /**
         * try calling special methods:
         *  1. __int__
         *  2. __trunc__
         */
        if(x !== undefined && (x.tp$getattr && x.tp$getattr("__int__"))) {
            // calling a method which contains im_self and im_func
            // causes skulpt to automatically map the im_self as first argument
            ret = callsim(x.tp$getattr("__int__"));
            magicName = "__int__";
        } else if(x !== undefined && x.__int__) {
            // required for internal types
            // __int__ method is on prototype
            ret = callsim(x.__int__, x);
            magicName = "__int__";
        } else if(x !== undefined && (x.tp$getattr && x.tp$getattr("__trunc__"))) {
            ret = callsim(x.tp$getattr("__trunc__"));
            magicName = "__trunc__";
        } else if(x !== undefined && x.__trunc__) {
            ret = callsim(x.__trunc__, x);
            magicName = "__trunc__";
        }

        // check return type of magic methods
        if(ret !== undefined && !checkInt(ret)) {
            throw new TypeError(magicName + " returned non-Integral (type " + typeName(ret)+")");
        } else if(ret !== undefined){
            x = ret; // valid return value, proceed in function
        }

        // check type even without magic numbers
        if(!checkNumber(x)) {
            throw new TypeError("int() argument must be a string or a number, not '" + typeName(x) + "'");
        }

        x = asnum$(x);
        if (x > int_.threshold$ || x < -int_.threshold$) {
            return new lng(x);
        }
        if ((x > -1) && (x < 1)) {
            x = 0;
        }

        this.v = parseInt(x, base);
        return this;
    };

    static $shiftconsts = [0.5, 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864, 134217728, 268435456, 536870912, 1073741824, 2147483648, 4294967296, 8589934592, 17179869184, 34359738368, 68719476736, 137438953472, 274877906944, 549755813888, 1099511627776, 2199023255552, 4398046511104, 8796093022208, 17592186044416, 35184372088832, 70368744177664, 140737488355328, 281474976710656, 562949953421312, 1125899906842624, 2251799813685248, 4503599627370496, 9007199254740992];

    /* NOTE: See constants used for kwargs in constants.js */

    nb$int_() {
        return this;
    };

    nb$float_() {
        return new float_(this.v);
    };

    nb$lng() {
        return new lng(this.v);
    };

    /**
     * Python wrapper of `__trunc__` dunder method.
     *
     * @instance
     */
    __trunc__ = new func(function(self) {
        return self;
    });

    /**
     * Python wrapper of `__index__` dunder method.
     *
     * @instance
     */
    __index__ = new func(function(self) {
        return self;
    });

    /**
     * Python wrapper of `__complex__` dunder method.
     *
     * @instance
     */
    __complex__ = new func(function(self) {
        return NotImplemented.NotImplemented$;
    });

    /**
     * Return this instance's Javascript value.
     *
     * Javascript function, returns Javascript object.
     *
     * @return {number} This instance's value.
     */
    tp$index() {
        return this.v;
    };

    /** @override */
    tp$hash() {
        //the hash of all numbers should be an int and since javascript doesn't really
        //care every number can be an int.
        return new int_(this.v);
    };

    /**
     * Threshold to determine when types should be converted to long.
     *
     * Note: be sure to check against threshold in both positive and negative directions.
     *
     * @type {number}
     */
    static threshold$ = Math.pow(2, 53) - 1;

    /**
     * Returns a copy of this instance.
     *
     * Javascript function, returns Python object.
     *
     * @return {int_} The copy
     */
    clone() {
        return new int_(this.v);
    };

    /** @override */
    nb$add(other) {
        var thisAsLong, thisAsFloat;

        if (other instanceof int_) {
            return new int_(this.v + other.v);
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$add(other);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.v);
            return thisAsFloat.nb$add(other);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$reflected_add(other) {
        // Should not automatically call this.nb$add, as nb$add may have
        // been overridden by a subclass
        return int_.prototype.nb$add.call(this, other);
    };

    /** @override */
    nb$subtract(other) {
        var thisAsLong, thisAsFloat;

        if (other instanceof int_) {
            return new int_(this.v - other.v);
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$subtract(other);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.v);
            return thisAsFloat.nb$subtract(other);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$reflected_subtract(other) {
        // Should not automatically call this.nb$add, as nb$add may have
        // been overridden by a subclass
        var negative_this = this.nb$negative();
        return int_.prototype.nb$add.call(negative_this, other);
    };

    /** @override */
    nb$multiply(other) {
        var product, thisAsLong, thisAsFloat;

        if (other instanceof int_) {
            product = this.v * other.v;

            if (product > int_.threshold$ ||
                product < -int_.threshold$) {
                thisAsLong = new lng(this.v);
                return thisAsLong.nb$multiply(other);
            } else {
                return new int_(product);
            }
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$multiply(other);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.v);
            return thisAsFloat.nb$multiply(other);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$reflected_multiply(other) {
        // Should not automatically call this.nb$multiply, as nb$multiply may have
        // been overridden by a subclass
        return int_.prototype.nb$multiply.call(this, other);
    };

    /** @override */
    nb$divide(other) {
        var thisAsLong, thisAsFloat;
        if (Sk.__future__.division) {
            thisAsFloat = new float_(this.v);
            return thisAsFloat.nb$divide(other);
        }

        if (other instanceof int_) {
            return this.nb$floor_divide(other);
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$divide(other);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.v);
            return thisAsFloat.nb$divide(other);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$reflected_divide(other) {
        return this.nb$reflected_floor_divide(other);
    };

    /** @override */
    nb$floor_divide(other) {
        var thisAsLong, thisAsFloat;

        if (other instanceof int_) {

            if (other.v === 0) {
                throw new ZeroDivisionError("integer division or modulo by zero");
            }

            return new int_(Math.floor(this.v / other.v));
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$floor_divide(other);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.v);
            return thisAsFloat.nb$floor_divide(other);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$reflected_floor_divide(other) {
        if (other instanceof int_) {
            return other.nb$divide(this);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$remainder(other) {
        var thisAsLong, thisAsFloat;
        var tmp;
        var divResult;

        if (other instanceof int_) {
            //  Javacript logic on negatives doesn't work for Python... do this instead
            divResult = numberBinOp(this, other, "FloorDiv");
            tmp = numberBinOp(divResult, other, "Mult");
            tmp = numberBinOp(this, tmp, "Sub");
            tmp = tmp.v;

            if (other.v < 0 && tmp === 0) {
                tmp = -0.0; // otherwise the sign gets lost by javascript modulo
            } else if (tmp === 0 && Infinity/tmp === -Infinity) {
                tmp = 0.0;
            }

            return new int_(tmp);
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$remainder(other);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.v);
            return thisAsFloat.nb$remainder(other);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$reflected_remainder(other) {
        if (other instanceof int_) {
            return other.nb$remainder(this);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$divmod(other) {
        var thisAsLong, thisAsFloat;

        if (other instanceof int_) {
            return new tuple([
                this.nb$floor_divide(other),
                this.nb$remainder(other)
            ]);
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$divmod(other);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.v);
            return thisAsFloat.nb$divmod(other);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$reflected_divmod(other) {
        if (other instanceof int_) {
            return new tuple([
                other.nb$floor_divide(this),
                other.nb$remainder(this)
            ]);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$power(other, mod) {
        var power, ret, thisAsLong, thisAsFloat;

        if (other instanceof int_ && (mod === undefined || mod instanceof int_)) {

            power = Math.pow(this.v, other.v);

            if (power > int_.threshold$ ||
                power < -int_.threshold$) {
                thisAsLong = new lng(this.v);
                ret = thisAsLong.nb$power(other, mod);
            } else if (other.v < 0) {
                ret = new float_(power);
            } else {
                ret = new int_(power);
            }

            if (mod !== undefined) {
                if (other.v < 0) {
                    throw new TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
                }

                return ret.nb$remainder(mod);
            } else {
                return ret;
            }
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$power(other);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.v);
            return thisAsFloat.nb$power(other);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$reflected_power(other, mod) {
        if (other instanceof int_) {
            return other.nb$power(this, mod);
        }

        return NotImplemented.NotImplemented$;
    };

    /** @override */
    nb$abs() {
        return new int_(Math.abs(this.v));
    };

    /**
     * Compute the bitwise AND of this instance and a Python object (i.e. this & other).
     *
     * Returns NotImplemented if bitwise AND operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object to AND with this one
     * @return {(int_|lng|NotImplemented)} The result of the conjunction
     */
    nb$and(other) {
        var thisAsLong, thisAsFloat;

        if (other instanceof int_) {
            var tmp;
            other = asnum$(other);
            tmp = this.v & other;
            if ((tmp !== undefined) && (tmp < 0)) {
                tmp = tmp + 4294967296; // convert back to unsigned
            }

            if (tmp !== undefined) {
                return new int_(tmp);
            }
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$and(other);
        }

        return NotImplemented.NotImplemented$;
    };

    nb$reflected_and = int_.prototype.nb$and;

    /**
     * Compute the bitwise OR of this instance and a Python object (i.e. this | other).
     *
     * Returns NotImplemented if bitwise OR operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object to OR with this one
     * @return {(int_|lng|NotImplemented)} The result of the disjunction
     */
    nb$or(other) {
        var thisAsLong;

        if (other instanceof int_) {
            var tmp;
            other = asnum$(other);
            tmp = this.v | other;
            if ((tmp !== undefined) && (tmp < 0)) {
                tmp = tmp + 4294967296; // convert back to unsigned
            }

            if (tmp !== undefined) {
                return new int_(tmp);
            }
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$and(other);
        }

        return NotImplemented.NotImplemented$;
    };

    nb$reflected_or = int_.prototype.nb$or;

    /**
     * Compute the bitwise XOR of this instance and a Python object (i.e. this ^ other).
     *
     * Returns NotImplemented if bitwise XOR operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object to XOR with this one
     * @return {(int_|lng|NotImplemented)} The result of the exclusive disjunction
     */
    nb$xor(other) {
        var thisAsLong;

        if (other instanceof int_) {
            var tmp;
            other = asnum$(other);
            tmp = this.v ^ other;
            if ((tmp !== undefined) && (tmp < 0)) {
                tmp = tmp + 4294967296; // convert back to unsigned
            }

            if (tmp !== undefined) {
                return new int_(tmp);
            }
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$xor(other);
        }

        return NotImplemented.NotImplemented$;
    };

    nb$reflected_xor = int_.prototype.nb$xor;

    /**
     * Compute the bitwise left shift of this instance by a Python object (i.e. this << other).
     *
     * Returns NotImplemented if bitwise left shift operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object by which to left shift
     * @return {(int_|lng|NotImplemented)} The result of the left shift
     */
    nb$lshift(other) {
        var thisAsLong;

        if (this.v === 0) {
            return this;
        }

        if (other instanceof int_) {
            var tmp;
            var shift = asnum$(other);

            if (shift !== undefined) {
                if (shift < 0) {
                    throw new ValueError("negative shift count");
                }

                if (shift > 53) {
                    return new lng(this.v).nb$lshift(new int_(shift));
                }

                tmp = this.v * 2 * int_.$shiftconsts[shift];
                if (tmp > int_.threshold$ || tmp < -int_.threshold$) {
                    // Fail, recompute with longs
                    return new lng(tmp);
                }
            }

            if (tmp !== undefined) {
                tmp = /** @type {number} */ (tmp);
                return new int_(tmp);
            }
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$lshift(other);
        }

        return NotImplemented.NotImplemented$;
    };

    nb$reflected_lshift(other) {
        if (other instanceof int_) {
            return other.nb$lshift(this);
        }

        return NotImplemented.NotImplemented$;
    };

    /**
     * Compute the bitwise right shift of this instance by a Python object (i.e. this >> other).
     *
     * Returns NotImplemented if bitwise right shift operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object by which to right shift
     * @return {(int_|lng|NotImplemented)} The result of the right shift
     */
    nb$rshift(other) {
        var thisAsLong;

        if (other instanceof int_) {
            var tmp;
            var shift = asnum$(other);

            if (shift !== undefined) {
                if (shift < 0) {
                    throw new ValueError("negative shift count");
                }
                tmp = this.v >> shift;
                if ((this.v > 0) && (tmp < 0)) {
                    // Fix incorrect sign extension
                    tmp = tmp & (Math.pow(2, 32 - shift) - 1);
                }
            }

            if (tmp !== undefined) {
                tmp = /** @type {number} */ (tmp);
                return new int_(tmp);
            }
        }

        if (other instanceof lng) {
            thisAsLong = new lng(this.v);
            return thisAsLong.nb$rshift(other);
        }

        return NotImplemented.NotImplemented$;
    };

    nb$reflected_rshift(other) {
        if (other instanceof int_) {
            return other.nb$rshift(this);
        }

        return NotImplemented.NotImplemented$;
    };

    /**
     * Compute the bitwise inverse of this instance (i.e. ~this).
     *
     * Javscript function, returns Python object.
     *
     * @return {int_} The result of the inversion
     */
    nb$invert() {
        return new int_(~this.v);
    };

    /** @override */
    nb$inplace_add = int_.prototype.nb$add;

    /** @override */
    nb$inplace_subtract = int_.prototype.nb$subtract;

    /** @override */
    nb$inplace_multiply = int_.prototype.nb$multiply;

    /** @override */
    nb$inplace_divide = int_.prototype.nb$divide;

    /** @override */
    nb$inplace_remainder = int_.prototype.nb$remainder;

    /** @override */
    nb$inplace_floor_divide = int_.prototype.nb$floor_divide;

    /** @override */
    nb$inplace_power = int_.prototype.nb$power;

    /**
     * @function
     * @name  nb$inplace_and
     * @memberOf int_.prototype
     * @description
     * Compute the bitwise AND of this instance and a Python object (i.e. this &= other).
     *
     * Returns NotImplemented if inplace bitwise AND operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object to AND with this one
     * @return {(int_|lng|NotImplemented)} The result of the conjunction
     */
    nb$inplace_and = int_.prototype.nb$and;

    /**
     * @function
     * @name  nb$inplace_or
     * @memberOf int_.prototype
     * @description
     * Compute the bitwise OR of this instance and a Python object (i.e. this |= other).
     *
     * Returns NotImplemented if inplace bitwise OR operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object to OR with this one
     * @return {(int_|lng|NotImplemented)} The result of the disjunction
     */
    nb$inplace_or = int_.prototype.nb$or;

    /**
     * @function
     * @name  nb$inplace_xor
     * @memberOf int_.prototype
     * @description
     * Compute the bitwise XOR of this instance and a Python object (i.e. this ^= other).
     *
     * Returns NotImplemented if inplace bitwise XOR operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object to XOR with this one
     * @return {(int_|lng|NotImplemented)} The result of the exclusive disjunction
     */
    nb$inplace_xor = int_.prototype.nb$xor;

    /**
     * @function
     * @name  nb$inplace_lshift
     * @memberOf int_.prototype
     * @description
     * Compute the bitwise left shift of this instance by a Python object (i.e. this <<= other).
     *
     * Returns NotImplemented if inplace bitwise left shift operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object by which to left shift
     * @return {(int_|lng|NotImplemented)} The result of the left shift
     */
    nb$inplace_lshift = int_.prototype.nb$lshift;

    /**
     * @function
     * @name  nb$inplace_rshift
     * @memberOf int_.prototype
     * @description
     * Compute the bitwise right shift of this instance by a Python object (i.e. this >>= other).
     *
     * Returns NotImplemented if inplace bitwise right shift operation between int and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object by which to right shift
     * @return {(int_|lng|NotImplemented)} The result of the right shift
     */
    nb$inplace_rshift = int_.prototype.nb$rshift;

    /**
     * @override
     *
     * @return {int_} A copy of this instance with the value negated.
     */
    nb$negative() {
        return new int_(-this.v);
    };

    /** @override */
    nb$positive() {
        return this.clone();
    };

    /** @override */
    nb$nonzero() {
        return this.v !== 0;
    };

    /** @override */
    nb$isnegative() {
        return this.v < 0;
    };

    /** @override */
    nb$ispositive() {
        return this.v >= 0;
    };

    /**
     * Compare this instance's value to another Python object's value.
     *
     * Returns NotImplemented if comparison between int and other type is unsupported.
     *
     * Javscript function, returns Javascript object or NotImplemented.
     *
     * @return {(number|NotImplemented)} negative if this < other, zero if this == other, positive if this > other
     */
    numberCompare(other) {
        if (other instanceof int_) {
            return this.v - other.v;
        }

        if (other instanceof lng) {
            return -other.longCompare(this);
        }

        if (other instanceof float_) {
            return -other.numberCompare(this);
        }

        return NotImplemented.NotImplemented$;
    };

    // Despite what jshint may want us to do, these two  functions need to remain
    // as == and !=  Unless you modify the logic of numberCompare do not change
    // these.

    /** @override */
    ob$eq(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.numberCompare(other) == 0); //jshint ignore:line
        } else if (other instanceof none) {
            return false$;
        } else {
            return NotImplemented.NotImplemented$;
        }
    };

    /** @override */
    ob$ne(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.numberCompare(other) != 0); //jshint ignore:line
        } else if (other instanceof none) {
            return true$;
        } else {
            return NotImplemented.NotImplemented$;
        }
    };

    /** @override */
    ob$lt(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.numberCompare(other) < 0);
        } else {
            return NotImplemented.NotImplemented$;
        }
    };

    /** @override */
    ob$le(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.numberCompare(other) <= 0);
        } else {
            return NotImplemented.NotImplemented$;
        }
    };

    /** @override */
    ob$gt(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.numberCompare(other) > 0);
        } else {
            return NotImplemented.NotImplemented$;
        }
    };

    /** @override */
    ob$ge(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.numberCompare(other) >= 0);
        } else {
            return NotImplemented.NotImplemented$;
        }
    };

    /**
     * Round this instance to a given number of digits, or zero if omitted.
     *
     * Implements `__round__` dunder method.
     *
     * Javascript function, returns Python object.
     *
     * @param  {int_} self This instance.
     * @param  {Object|number=} ndigits The number of digits after the decimal point to which to round.
     * @return {int_} The rounded integer.
     */
    round$(self, ndigits) {
        pyCheckArgs("__round__", arguments, 1, 2);

        var result, multiplier, number, num10, rounded, bankRound, ndigs;

        if ((ndigits !== undefined) && !isIndex(ndigits)) {
            throw new TypeError("'" + typeName(ndigits) + "' object cannot be interpreted as an index");
        }

        number = asnum$(self);
        if (ndigits === undefined) {
            ndigs = 0;
        } else {
            ndigs = asIndex(ndigits);
        }

        if (Sk.__future__.bankers_rounding) {
            num10 = number * Math.pow(10, ndigs);
            rounded = Math.round(num10);
            bankRound = (((((num10>0)?num10:(-num10))%1)===0.5)?(((0===(rounded%2)))?rounded:(rounded-1)):rounded);
            result = bankRound / Math.pow(10, ndigs);
            return new int_(result);
        } else {
            multiplier = Math.pow(10, ndigs);
            result = Math.round(number * multiplier) / multiplier;

            return new int_(result);
        }
    };

    __format__(obj, format_spec) {
        var formatstr;
        pyCheckArgs("__format__", arguments, 2, 2);

        if (!checkString(format_spec)) {
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

        return new str(obj);
    };

    conjugate = new func(function (self) {
        return new int_(self.v);
    });

    /** @override */
    $r() {
        return new str(this.str$(10, true));
    };

    /**
     * Return the string representation of this instance.
     *
     * Javascript function, returns Python object.
     *
     * @return {str} The Python string representation of this instance.
     */
    tp$str() {
        return new str(this.str$(10, true));
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
    str$(base, sign) {
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
     * @override
     */
    tp$toJS() {
        return this.v;
    }
}

setUpInheritance("int", int_, numtype);

/**
 * Takes a JavaScript string and returns a number using the parser and negater
 *  functions (for int/long right now)
 * @param  {string} s       Javascript string to convert to a number.
 * @param  {(number)} base    The base of the number.
 * @param  {function(*, (number|undefined)): number} parser  Function which should take
 *  a string that is a postive number which only contains characters that are
 *  valid in the given base and a base and return a number.
 * @param  {function((number|biginteger)): number} negater Function which should take a
 *  number and return its negation
 * @param  {string} fname   The name of the calling function, to be used in error messages
 * @return {number}         The number equivalent of the string in the given base
 */
export function str2number(s, base, parser, negater, fname) {
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
            throw new ValueError(fname + "() base must be >= 2 and <= 36");
        }
    }

    if (s.substring(0, 2).toLowerCase() === "0x") {
        if (base === 16 || base === 0) {
            s = s.substring(2);
            base = 16;
        } else if (base < 34) {
            throw new ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0b") {
        if (base === 2 || base === 0) {
            s = s.substring(2);
            base = 2;
        } else if (base < 12) {
            throw new ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0o") {
        if (base === 8 || base === 0) {
            s = s.substring(2);
            base = 8;
        } else if (base < 25) {
            throw new ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
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
        throw new ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
    }

    // check all characters are valid
    for (i = 0; i < s.length; i = i + 1) {
        ch = s.charCodeAt(i);
        val = base;
        if ((ch >= 48) && (ch <= 57)) {
            // 0-9
            val = ch - 48;
        } else if ((ch >= 65) && (ch <= 90)) {
            // A-Z
            val = ch - 65 + 10;
        } else if ((ch >= 97) && (ch <= 122)) {
            // a-z
            val = ch - 97 + 10;
        }

        if (val >= base) {
            throw new ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    }

    // parse number
    val = parser(s, base);
    if (neg) {
        val = negater(val);
    }
    return val;
}
