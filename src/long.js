import { typeName, setUpInheritance } from './abstract';
import { remapToJs } from './ffi';
import { func, pyCheckArgs, checkString, checkNumber } from './function';
import { TypeError, ValueError } from './errors';
import { NotImplementedError, NotImplemented } from './object';
import { asnum$ } from './builtin';
import { isIndex, asIndex } from './misceval';
import { numtype } from './numtype';
import { str } from './str';
import { int_, str2number } from './int';
import { float_ } from './float';
import { tuple } from './tuple';
import { true$, false$ } from './constants';
import { bool } from './bool'

import biginteger from 'big-integer';
// long aka "bignumber" implementation
//

export class lng extends numtype { /* long is a reserved word */
    /**
     * @constructor
     * lng
     *
     * @description
     * Constructor for Python long. Also used for builtin long().
     *
     * @extends {numtype}
     *
     * @param {*} x Object or number to convert to Python long.
     * @param {number=} base Optional base.
     * @return {lng} Python long
     */
    constructor(x, base) {
        base = asnum$(base);

        if (x === undefined) {
            this.biginteger = new biginteger(0);
            return this;
        }
        if (x instanceof lng) {
            this.biginteger = x.biginteger.clone();
            return this;
        }
        if (x instanceof biginteger) {
            this.biginteger = x;
            return this;
        }
        if (x instanceof String || typeof x === "string") {
            return longFromStr(x, base);
        }
        if (x instanceof str) {
            return longFromStr(x.v, base);
        }

        if ((x !== undefined) && (!checkString(x) && !checkNumber(x))) {
            if (x === true) {
                x = 1;
            } else if (x === false) {
                x = 0;
            } else {
                throw new TypeError("long() argument must be a string or a number, not '" + typeName(x) + "'");
            }
        }

        x = asnum$nofloat(x);
        this.biginteger = new biginteger(x);
        return this;
    }


    /* NOTE: See constants used for kwargs in constants.js */

    tp$index() {
        return parseInt(this.str$(10, true), 10);
    }

    tp$hash() {
        return new int_(this.tp$index());
    }

    nb$int_() {
        if (this.cantBeInt()) {
            return new lng(this);
        }

        return new int_(this.toInt$());
    }

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

            return new str(obj);
        }
    }

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
            return new Sk.builtin.lng(result);
        } else {
            multiplier = Math.pow(10, ndigs);
            result = Math.round(number * multiplier) / multiplier;

            return new lng(result);
        }
    }

    __index__ = new func(function(self) {
        return self.nb$int_(self);
    });

    nb$lng_() {
        return this;
    }

    nb$float_() {
        return new float_(remapToJs(this));
    }

    //    Threshold to determine when types should be converted to long
    static MAX_INT$ = new lng(int_.threshold$);
    static MIN_INT$ = new lng(-int_.threshold$);

    cantBeInt() {
        return (this.longCompare(lng.MAX_INT$) > 0) || (this.longCompare(lng.MIN_INT$) < 0);
    }

    static fromInt$(ival) {
        return new lng(ival);
    }


    toInt$() {
        return this.biginteger.toJSNumber();
    }

    clone() {
        return new lng(this);
    }

    conjugate = new func(function (self) {
        return self.clone();
    });

    nb$add(other) {
        var thisAsFloat;

        if (other instanceof float_) {
            thisAsFloat = new float_(this.str$(10, true));
            return thisAsFloat.nb$add(other);
        }

        if (other instanceof int_) {
            //    Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return new lng(this.biginteger.add(other.biginteger));
        }

        if (other instanceof biginteger) {
            return new lng(this.biginteger.add(other));
        }

        return NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$reflected_add(other) {
        // Should not automatically call this.nb$add, as nb$add may have
        // been overridden by a subclass
        return nb$add.call(this, other);
    }

    nb$inplace_add = lng.prototype.nb$add;

    nb$subtract(other) {
        var thisAsFloat;

        if (other instanceof float_) {
            thisAsFloat = new float_(this.str$(10, true));
            return thisAsFloat.nb$subtract(other);
        }

        if (other instanceof int_) {
            //    Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return new lng(this.biginteger.subtract(other.biginteger));
        }

        if (other instanceof biginteger) {
            return new lng(this.biginteger.subtract(other));
        }

        return NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$reflected_subtract(other) {
        // Should not automatically call this.nb$add, as nb$add may have
        // been overridden by a subclass
        var negative_this = this.nb$negative();
        return nb$add.call(negative_this, other);
    }

    nb$inplace_subtract = lng.prototype.nb$subtract;

    nb$multiply(other) {
        var thisAsFloat;

        if (other instanceof float_) {
            thisAsFloat = new float_(this.str$(10, true));
            return thisAsFloat.nb$multiply(other);
        }

        if (other instanceof int_) {
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return new lng(this.biginteger.multiply(other.biginteger));
        }

        if (other instanceof biginteger) {
            return new lng(this.biginteger.multiply(other));
        }

        return NotImplemented.NotImplemented$;
    }

    /** @override */
    nb$reflected_multiply(other) {
        // Should not automatically call this.nb$multiply, as nb$multiply may have
        // been overridden by a subclass
        return nb$multiply.call(this, other);
    }

    nb$inplace_multiply = lng.prototype.nb$multiply;

    nb$divide(other) {
        var thisAsFloat, thisneg, otherneg, result;

        if (other instanceof float_) {
            thisAsFloat = new float_(this.str$(10, true));
            return thisAsFloat.nb$divide(other);
        }

        if (other instanceof int_) {
            //    Promote an int to long
            other = new lng(other.v);
        }

        //    Standard, long result mode

        if (other instanceof lng) {
            //    Special logic to round DOWN towards negative infinity for negative results
            thisneg = this.nb$isnegative();
            otherneg = other.nb$isnegative();
            if ((thisneg && !otherneg) || (otherneg && !thisneg)) {
                result = this.biginteger.divmod(other.biginteger);
                //    If remainder is zero or positive, just return division result
                if (result.remainder.compare(biginteger.ZERO) === 0) {
                    //    No remainder, just return result
                    return new lng(result[0]);
                }
                //    Reminder... subtract 1 from the result (like rounding to neg infinity)
                result = result.quotient.subtract(biginteger.ONE);
                return new lng(result);
            }
            return new lng(this.biginteger.divide(other.biginteger));
        }

        return NotImplemented.NotImplemented$;
    }

    nb$reflected_divide(other) {
        var thisneg, otherneg, result;

        if (other instanceof int_) {
            //  Promote an int to long
            other = new lng(other.v);
        }

        //    Standard, long result mode
        if (other instanceof lng) {
            return other.nb$divide(this);
        }

        return NotImplemented.NotImplemented$;
    }

    nb$floor_divide(other) {
        var thisAsFloat;

        if (other instanceof float_) {
            thisAsFloat = new float_(this.str$(10, true));
            return thisAsFloat.nb$floor_divide(other);
        }

        if (other instanceof int_) {
            //  Promote an int to long
            other = new lng(other.v);
        }

        //    Standard, long result mode
        if (other instanceof lng) {
            return other.nb$divide(this);
        }

        return NotImplemented.NotImplemented$;
    }

    nb$divmod(other) {
        if (other instanceof int_) {
            // Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return new tuple([
                this.nb$floor_divide(other),
                this.nb$remainder(other)
            ]);
        }

        return NotImplemented.NotImplemented$;
    }

    nb$reflected_divmod(other) {
        if (other instanceof int_) {
            // Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return new tuple([
                other.nb$floor_divide(this),
                other.nb$remainder(this)
            ]);
        }

        return NotImplemented.NotImplemented$;
    }

    nb$inplace_divide = lng.prototype.nb$divide;

    nb$floor_divide = lng.prototype.nb$divide;

    nb$reflected_floor_divide = lng.prototype.nb$reflected_divide;

    nb$inplace_floor_divide = lng.prototype.nb$floor_divide;

    nb$remainder(other) {
        var thisAsFloat, tmp;

        if (this.biginteger.compare(biginteger.ZERO) === 0) {
            if (other instanceof float_) {
                return new float_(0);
            }
            return new lng(0);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.str$(10, true));
            return thisAsFloat.nb$remainder(other);
        }

        if (other instanceof int_) {
            //    Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {

            tmp = new lng(this.biginteger.remainder(other.biginteger));
            if (this.nb$isnegative()) {
                if (other.nb$ispositive() && tmp.nb$nonzero()) {
                    tmp = tmp.nb$add(other).nb$remainder(other);
                }
            } else {
                if (other.nb$isnegative() && tmp.nb$nonzero()) {
                    tmp = tmp.nb$add(other);
                }
            }
            return tmp;
        }

        return NotImplemented.NotImplemented$;
    }

    nb$reflected_remainder(other) {
        if (other instanceof int_) {
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return other.nb$remainder(this);
        }

        return NotImplemented.NotImplemented$;
    }

    nb$inplace_remainder = lng.prototype.nb$remainder;

    nb$divmod(other) {
        var thisAsFloat;

        if (other === true$) {
            other = new lng(1);
        }

        if (other === false$) {
            other = new lng(0);
        }

        if (other instanceof int_) {
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return new tuple([
                this.nb$floor_divide(other),
                this.nb$remainder(other)
            ]);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this.str$(10, true));
            return thisAsFloat.nb$divmod(other);
        }

        return NotImplemented.NotImplemented$;
    }

    /**
     * @param {number|Object} n
     * @param {number|Object=} mod
     * @suppress {checkTypes}
     */
    nb$power(n, mod) {
        var thisAsFloat;
        if (mod !== undefined) {
            n = new biginteger(asnum$(n));
            mod = new biginteger(asnum$(mod));

            return new lng(this.biginteger.modPow(n, mod));
        }

        if (n instanceof float_ ||
            (n instanceof int_ && n.v < 0)) {
            thisAsFloat = new float_(this.str$(10, true));
            return thisAsFloat.nb$power(n);
        }

        if (n instanceof int_) {
            //    Promote an int to long
            n = new lng(n.v);
        }

        if (n instanceof lng) {
            if (mod !== undefined) {
                n = new biginteger(asnum$(n));
                mod = new biginteger(asnum$(mod));

                return new lng(this.biginteger.modPow(n, mod));
            }

            if (n.nb$isnegative()) {
                thisAsFloat = new float_(this.str$(10, true));
                return thisAsFloat.nb$power(n);
            }
            return new lng(this.biginteger.pow(n.biginteger));
        }

        if (n instanceof biginteger) {
            if (mod !== undefined) {
                mod = new biginteger(asnum$(mod));

                return new lng(this.biginteger.modPow(n, mod));
            }

            if (n.isnegative()) {
                thisAsFloat = new float_(this.str$(10, true));
                return thisAsFloat.nb$power(n);
            }
            return new lng(this.biginteger.pow(n));
        }

        return NotImplemented.NotImplemented$;
    }

    nb$reflected_power(n, mod) {
        if (n instanceof int_) {
            // Promote an int to long
            n = new lng(n.v);
        }

        if (n instanceof lng) {
            return n.nb$power(this, mod);
        }

        return NotImplemented.NotImplemented$;
    }

    nb$inplace_power = lng.prototype.nb$power;

    /**
     * Compute the absolute value of this instance and return.
     *
     * Javascript function, returns Python object.
     *
     * @return {lng} The absolute value
     */
    nb$abs() {
        return new lng(this.biginteger.abs());
    }

    nb$lshift(other) {

        if (other instanceof int_) {
            //  Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            if (other.biginteger.isNegative()) {
                throw new ValueError("negative shift count");
            }
            return new lng(this.biginteger.shiftLeft(other.biginteger));
        }
        if (other instanceof biginteger) {
            if (other.isNegative()) {
                throw new ValueError("negative shift count");
            }
            return new lng(this.biginteger.shiftLeft(other));
        }

        return NotImplemented.NotImplemented$;
    }

    nb$reflected_lshift(other) {
        if (other instanceof int_) {
            // Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return other.nb$lshift(this);
        }

        return NotImplemented.NotImplemented$;
    }

    nb$inplace_lshift = lng.prototype.nb$lshift;

    nb$rshift(other) {
        if (other instanceof int_) {
            //  Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            if (other.biginteger.isNegative()) {
                throw new ValueError("negative shift count");
            }
            return new lng(this.biginteger.shiftRight(other.biginteger));
        }
        if (other instanceof biginteger) {
            if (other.isNegative()) {
                throw new ValueError("negative shift count");
            }
            return new lng(this.biginteger.shiftRight(other));
        }

        return NotImplemented.NotImplemented$;
    }

    nb$reflected_rshift(other) {
        if (other instanceof int_) {
            // Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return other.nb$rshift(this);
        }

        return NotImplemented.NotImplemented$;
    }

    nb$inplace_rshift = lng.prototype.nb$rshift;

    nb$and(other) {
        if (other instanceof int_) {
            //  Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return new lng(this.biginteger.and(other.biginteger));
        }
        if (other instanceof biginteger) {
            return new lng(this.biginteger.and(other));
        }

        return NotImplemented.NotImplemented$;
    }

    nb$reflected_and = lng.prototype.nb$and;

    nb$inplace_and = lng.prototype.nb$and;

    nb$or(other) {
        if (other instanceof int_) {
            //  Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return new lng(this.biginteger.or(other.biginteger));
        }
        if (other instanceof biginteger) {
            return new lng(this.biginteger.or(other));
        }

        return NotImplemented.NotImplemented$;
    }


    nb$reflected_or = lng.prototype.nb$or;

    nb$inplace_or = lng.prototype.nb$or;

    nb$xor(other) {
        if (other instanceof int_) {
            //  Promote an int to long
            other = new lng(other.v);
        }

        if (other instanceof lng) {
            return new lng(this.biginteger.xor(other.biginteger));
        }
        if (other instanceof biginteger) {
            return new lng(this.biginteger.xor(other));
        }

        return NotImplemented.NotImplemented$;
    }

    nb$reflected_xor = lng.prototype.nb$xor;

    nb$inplace_xor = lng.prototype.nb$xor;

    /**
     * @override
     *
     * @return {lng} A copy of this instance with the value negated.
     */
    nb$negative() {
        return new lng(this.biginteger.multiply(-1));
    }

    nb$invert() {
        return new lng(this.biginteger.not());
    }

    nb$positive() {
        return this.clone();
    }

    nb$nonzero() {
        return this.biginteger.compare(biginteger.ZERO) !== 0;
    }

    nb$isnegative() {
        return this.biginteger.isNegative();
    }

    nb$ispositive() {
        return !this.biginteger.isNegative();
    }

    longCompare(other) {
        var otherAsLong, thisAsFloat;

        if (typeof other === "number") {
            other = new lng(other);
        }

        if (other instanceof int_ ||
            (other instanceof float_ && other.v % 1 === 0)) {
            otherAsLong = new lng(other.v);
            return this.longCompare(otherAsLong);
        }

        if (other instanceof float_) {
            thisAsFloat = new float_(this);
            return thisAsFloat.numberCompare(other);
        }

        if (other instanceof lng) {
            return this.biginteger.subtract(other.biginteger);
        } else if (other instanceof biginteger) {
            return this.biginteger.subtract(other);
        }

        return NotImplemented.NotImplemented$;
    }

    //tests fail if ===
    ob$eq(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.longCompare(other) == 0); //jshint ignore:line
        } else if (other instanceof none) {
            return false$;
        } else {
            return NotImplemented.NotImplemented$;
        }
    }

    ob$ne(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.longCompare(other) != 0); //jshint ignore:line
        } else if (other instanceof none) {
            return true$;
        } else {
            return NotImplemented.NotImplemented$;
        }
    }

    ob$lt(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.longCompare(other) < 0);
        } else {
            return NotImplemented.NotImplemented$;
        }
    }

    ob$le(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.longCompare(other) <= 0);
        } else {
            return NotImplemented.NotImplemented$;
        }
    }

    ob$gt(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.longCompare(other) > 0);
        } else {
            return NotImplemented.NotImplemented$;
        }
    }

    ob$ge(other) {
        if (other instanceof int_ || other instanceof lng ||
            other instanceof float_) {
            return new bool(this.longCompare(other) >= 0);
        } else {
            return NotImplemented.NotImplemented$;
        }
    }

    $r() {
        return new str(this.str$(10, true) + "L");
    }

    tp$str() {
        return new str(this.str$(10, true));
    }

    str$(base, sign) {
        var work;
        if (sign === undefined) {
            sign = true;
        }

        work = sign ? this.biginteger : this.biginteger.abs();

        if (base === undefined || base === 10) {
            return work.toString();
        }

        //    Another base... convert...
        return work.toString(base);
    }
}

setUpInheritance("long", lng, numtype);

// js string (not str) -> long. used to create longs in transformer, respects
// 0x, 0o, 0b, etc.
export function longFromStr(s, base) {
    // l/L are valid digits with base >= 22
    // goog.asserts.assert(s.charAt(s.length - 1) !== "L" && s.charAt(s.length - 1) !== 'l', "L suffix should be removed before here");

    var parser = function (s, base) {
            if (base === 10) {
                return new biginteger(s);
            }
            return new biginteger(s, base);
        },
        b = str2number(s, base, parser, function (x) {
            return x.multiply(-1);
        }, "long");

    return new lng(b);
}