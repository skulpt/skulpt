/* jslint nomen: true, bitwise: true */
/* global Sk: true */

/**
 * @namespace Sk.builtin
 */

/**
 * @constructor
 * Sk.builtin.int_
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
 * @extends {Sk.builtin.numtype}
 * 
 * @param  {!(Object|number)} x    Python object or Javascript number to convert to Python int
 * @param  {!(Object|number)=} base Optional base, can only be used when x is Sk.builtin.str
 * @return {(Sk.builtin.int_|Sk.builtin.lng)}      Python int (or long, if overflow)
 */
Sk.builtin.int_ = function (x, base) {
    "use strict";
    var val;
    var ret; // return value
    var magicName; // name of magic method

    if (!(this instanceof Sk.builtin.int_)) {
        return new Sk.builtin.int_(x, base);
    }


    if (this instanceof Sk.builtin.bool) {
        return this;
    }

    if (x instanceof Sk.builtin.int_ && base === undefined) {
        this.v = x.v;
        return this;
    }

    // if base is not of type int, try calling .__index__
    if(base !== undefined && !Sk.builtin.checkInt(base)) {
        if (Sk.builtin.checkFloat(base)) {
            throw new Sk.builtin.TypeError("integer argument expected, got " + Sk.abstr.typeName(base));
        } else if (base.__index__) {
            base = Sk.misceval.callsim(base.__index__, base);
        } else if(base.__int__) {
            base = Sk.misceval.callsim(base.__int__, base);
        } else {
            throw new Sk.builtin.AttributeError(Sk.abstr.typeName(base) + " instance has no attribute '__index__' or '__int__'");
        }
    }

    if (x instanceof Sk.builtin.str) {
        base = Sk.builtin.asnum$(base);

        val = Sk.str2number(x.v, base, parseInt, function (x) {
            return -x;
        }, "int");

        if ((val > Sk.builtin.int_.threshold$) || (val < -Sk.builtin.int_.threshold$)) {
            // Too big for int, convert to long
            return new Sk.builtin.lng(x, base);
        }

        this.v = val;
        return this;
    }

    if (base !== undefined) {
        throw new Sk.builtin.TypeError("int() can't convert non-string with explicit base");
    }

    if (x === undefined || x === Sk.builtin.none) {
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
        ret = Sk.misceval.callsim(x.tp$getattr("__int__"));
        magicName = "__int__";
    } else if(x !== undefined && x.__int__) {
        // required for internal types
        // __int__ method is on prototype
        ret = Sk.misceval.callsim(x.__int__, x);
        magicName = "__int__";
    } else if(x !== undefined && (x.tp$getattr && x.tp$getattr("__trunc__"))) {
        ret = Sk.misceval.callsim(x.tp$getattr("__trunc__"));
        magicName = "__trunc__";
    } else if(x !== undefined && x.__trunc__) {
        ret = Sk.misceval.callsim(x.__trunc__, x);
        magicName = "__trunc__";
    }

    // check return type of magic methods
    if(ret !== undefined && !Sk.builtin.checkInt(ret)) {
        throw new Sk.builtin.TypeError(magicName + " returned non-Integral (type " + Sk.abstr.typeName(ret)+")");
    } else if(ret !== undefined){
        x = ret; // valid return value, proceed in function
    }

    // check type even without magic numbers
    if(!Sk.builtin.checkNumber(x)) {
        throw new Sk.builtin.TypeError("int() argument must be a string or a number, not '" + Sk.abstr.typeName(x) + "'");
    }

    x = Sk.builtin.asnum$(x);
    if (x > Sk.builtin.int_.threshold$ || x < -Sk.builtin.int_.threshold$) {
        return new Sk.builtin.lng(x);
    }
    if ((x > -1) && (x < 1)) {
        x = 0;
    }

    this.v = parseInt(x, base);
    return this;
};

Sk.abstr.setUpInheritance("int", Sk.builtin.int_, Sk.builtin.numtype);

/* NOTE: See constants used for kwargs in constants.js */

Sk.builtin.int_.prototype.nb$int_ = function () {
    return this;
};

Sk.builtin.int_.prototype.nb$float_ = function() {
    return new Sk.builtin.float_(this.v);
};

Sk.builtin.int_.prototype.nb$lng = function () {
    return new Sk.builtin.lng(this.v);
};

/**
 * Python wrapper of `__trunc__` dunder method.
 *
 * @instance
 */
Sk.builtin.int_.prototype.__trunc__ = new Sk.builtin.func(function(self) {
    return self;
});

/**
 * Python wrapper of `__index__` dunder method.
 *
 * @instance
 */
Sk.builtin.int_.prototype.__index__ = new Sk.builtin.func(function(self) {
    return self;
});

/**
 * Python wrapper of `__complex__` dunder method.
 *
 * @instance
 */
Sk.builtin.int_.prototype.__complex__ = new Sk.builtin.func(function(self) {
    return Sk.builtin.NotImplemented.NotImplemented$;
});

/**
 * Return this instance's Javascript value.
 *
 * Javascript function, returns Javascript object.
 *
 * @return {number} This instance's value.
 */
Sk.builtin.int_.prototype.tp$index = function () {
    return this.v;
};

/** @override */
Sk.builtin.int_.prototype.tp$hash = function () {
    //the hash of all numbers should be an int and since javascript doesn't really
    //care every number can be an int.
    return new Sk.builtin.int_(this.v);
};

/**
 * Threshold to determine when types should be converted to long.
 *
 * Note: be sure to check against threshold in both positive and negative directions.
 *
 * @type {number}
 */
Sk.builtin.int_.threshold$ = Math.pow(2, 53) - 1;

/**
 * Returns a copy of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.int_} The copy
 */
Sk.builtin.int_.prototype.clone = function () {
    return new Sk.builtin.int_(this.v);
};

/** @override */
Sk.builtin.int_.prototype.nb$add = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.int_(this.v + other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$add(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$add(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_add = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    return Sk.builtin.int_.prototype.nb$add.call(this, other);
};

/** @override */
Sk.builtin.int_.prototype.nb$subtract = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.int_(this.v - other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$subtract(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$subtract(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_subtract = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    var negative_this = this.nb$negative();
    return Sk.builtin.int_.prototype.nb$add.call(negative_this, other);
};

/** @override */
Sk.builtin.int_.prototype.nb$multiply = function (other) {
    var product, thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        product = this.v * other.v;

        if (product > Sk.builtin.int_.threshold$ ||
            product < -Sk.builtin.int_.threshold$) {
            thisAsLong = new Sk.builtin.lng(this.v);
            return thisAsLong.nb$multiply(other);
        } else {
            return new Sk.builtin.int_(product);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$multiply(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$multiply(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_multiply = function (other) {
    // Should not automatically call this.nb$multiply, as nb$multiply may have
    // been overridden by a subclass
    return Sk.builtin.int_.prototype.nb$multiply.call(this, other);
};

/** @override */
Sk.builtin.int_.prototype.nb$divide = function (other) {
    var thisAsLong, thisAsFloat;
    if (Sk.__future__.division) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$divide(other);
    }

    if (other instanceof Sk.builtin.int_) {
        return this.nb$floor_divide(other);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$divide(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$divide(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_divide = function (other) {
    return this.nb$reflected_floor_divide(other);
};

/** @override */
Sk.builtin.int_.prototype.nb$floor_divide = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {

        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        return new Sk.builtin.int_(Math.floor(this.v / other.v));
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$floor_divide(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$floor_divide(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_floor_divide = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$remainder = function (other) {
    var thisAsLong, thisAsFloat;
    var tmp;
    var divResult;

    if (other instanceof Sk.builtin.int_) {
        //  Javacript logic on negatives doesn't work for Python... do this instead
        divResult = Sk.abstr.numberBinOp(this, other, "FloorDiv");
        tmp = Sk.abstr.numberBinOp(divResult, other, "Mult");
        tmp = Sk.abstr.numberBinOp(this, tmp, "Sub");
        tmp = tmp.v;

        if (other.v < 0 && tmp === 0) {
            tmp = -0.0; // otherwise the sign gets lost by javascript modulo
        } else if (tmp === 0 && Infinity/tmp === -Infinity) {
            tmp = 0.0;
        }

        return new Sk.builtin.int_(tmp);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$remainder(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$remainder(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_remainder = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$remainder(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$divmod = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$divmod(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$divmod(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_divmod = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.tuple([
            other.nb$floor_divide(this),
            other.nb$remainder(this)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$power = function (other, mod) {
    var power, ret, thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_ && (mod === undefined || mod instanceof Sk.builtin.int_)) {

        power = Math.pow(this.v, other.v);

        if (power > Sk.builtin.int_.threshold$ ||
            power < -Sk.builtin.int_.threshold$) {
            thisAsLong = new Sk.builtin.lng(this.v);
            ret = thisAsLong.nb$power(other, mod);
        } else if (other.v < 0) {
            ret = new Sk.builtin.float_(power);
        } else {
            ret = new Sk.builtin.int_(power);
        }

        if (mod !== undefined) {
            if (other.v < 0) {
                throw new Sk.builtin.TypeError("pow() 2nd argument cannot be negative when 3rd argument specified");
            }

            return ret.nb$remainder(mod);
        } else {
            return ret;
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$power(other);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.v);
        return thisAsFloat.nb$power(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$reflected_power = function (other, mod) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$power(this, mod);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.int_.prototype.nb$abs = function () {
    return new Sk.builtin.int_(Math.abs(this.v));
};

/**
 * Compute the bitwise AND of this instance and a Python object (i.e. this & other).
 *
 * Returns NotImplemented if bitwise AND operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to AND with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the conjunction
 */
Sk.builtin.int_.prototype.nb$and = function (other) {
    var thisAsLong, thisAsFloat;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        other = Sk.builtin.asnum$(other);
        tmp = this.v & other;
        if ((tmp !== undefined) && (tmp < 0)) {
            tmp = tmp + 4294967296; // convert back to unsigned
        }

        if (tmp !== undefined) {
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$and(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_and = Sk.builtin.int_.prototype.nb$and;

/**
 * Compute the bitwise OR of this instance and a Python object (i.e. this | other).
 *
 * Returns NotImplemented if bitwise OR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to OR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the disjunction
 */
Sk.builtin.int_.prototype.nb$or = function (other) {
    var thisAsLong;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        other = Sk.builtin.asnum$(other);
        tmp = this.v | other;
        if ((tmp !== undefined) && (tmp < 0)) {
            tmp = tmp + 4294967296; // convert back to unsigned
        }

        if (tmp !== undefined) {
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$and(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_or = Sk.builtin.int_.prototype.nb$or;

/**
 * Compute the bitwise XOR of this instance and a Python object (i.e. this ^ other).
 *
 * Returns NotImplemented if bitwise XOR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to XOR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the exclusive disjunction
 */
Sk.builtin.int_.prototype.nb$xor = function (other) {
    var thisAsLong;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        other = Sk.builtin.asnum$(other);
        tmp = this.v ^ other;
        if ((tmp !== undefined) && (tmp < 0)) {
            tmp = tmp + 4294967296; // convert back to unsigned
        }

        if (tmp !== undefined) {
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$xor(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_xor = Sk.builtin.int_.prototype.nb$xor;

/**
 * Compute the bitwise left shift of this instance by a Python object (i.e. this << other).
 *
 * Returns NotImplemented if bitwise left shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to left shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the left shift
 */
Sk.builtin.int_.prototype.nb$lshift = function (other) {
    var thisAsLong;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        var shift = Sk.builtin.asnum$(other);

        if (shift !== undefined) {
            if (shift < 0) {
                throw new Sk.builtin.ValueError("negative shift count");
            }
            tmp = this.v << shift;
            if (tmp <= this.v) {
                // Fail, recompute with longs
                return new Sk.builtin.lng(this.v).nb$lshift(other);
            }
        }

        if (tmp !== undefined) {
            tmp = /** @type {number} */ (tmp);
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$lshift(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_lshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$lshift(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the bitwise right shift of this instance by a Python object (i.e. this >> other).
 *
 * Returns NotImplemented if bitwise right shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to right shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the right shift
 */
Sk.builtin.int_.prototype.nb$rshift = function (other) {
    var thisAsLong;

    if (other instanceof Sk.builtin.int_) {
        var tmp;
        var shift = Sk.builtin.asnum$(other);

        if (shift !== undefined) {
            if (shift < 0) {
                throw new Sk.builtin.ValueError("negative shift count");
            }
            tmp = this.v >> shift;
            if ((this.v > 0) && (tmp < 0)) {
                // Fix incorrect sign extension
                tmp = tmp & (Math.pow(2, 32 - shift) - 1);
            }
        }

        if (tmp !== undefined) {
            tmp = /** @type {number} */ (tmp);
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$rshift(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$reflected_rshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return other.nb$rshift(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the bitwise inverse of this instance (i.e. ~this).
 *
 * Javscript function, returns Python object.
 *
 * @return {Sk.builtin.int_} The result of the inversion
 */
Sk.builtin.int_.prototype.nb$invert = function () {
    return new Sk.builtin.int_(~this.v);
};

/** @override */
Sk.builtin.int_.prototype.nb$inplace_add = Sk.builtin.int_.prototype.nb$add;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_subtract = Sk.builtin.int_.prototype.nb$subtract;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_multiply = Sk.builtin.int_.prototype.nb$multiply;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_divide = Sk.builtin.int_.prototype.nb$divide;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_remainder = Sk.builtin.int_.prototype.nb$remainder;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_floor_divide = Sk.builtin.int_.prototype.nb$floor_divide;

/** @override */
Sk.builtin.int_.prototype.nb$inplace_power = Sk.builtin.int_.prototype.nb$power;

/**
 * @function
 * @name  nb$inplace_and
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise AND of this instance and a Python object (i.e. this &= other).
 *
 * Returns NotImplemented if inplace bitwise AND operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to AND with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the conjunction
 */
Sk.builtin.int_.prototype.nb$inplace_and = Sk.builtin.int_.prototype.nb$and;

/**
 * @function
 * @name  nb$inplace_or
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise OR of this instance and a Python object (i.e. this |= other).
 *
 * Returns NotImplemented if inplace bitwise OR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to OR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the disjunction
 */
Sk.builtin.int_.prototype.nb$inplace_or = Sk.builtin.int_.prototype.nb$or;

/**
 * @function
 * @name  nb$inplace_xor
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise XOR of this instance and a Python object (i.e. this ^= other).
 *
 * Returns NotImplemented if inplace bitwise XOR operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to XOR with this one
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the exclusive disjunction
 */
Sk.builtin.int_.prototype.nb$inplace_xor = Sk.builtin.int_.prototype.nb$xor;

/**
 * @function
 * @name  nb$inplace_lshift
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise left shift of this instance by a Python object (i.e. this <<= other).
 *
 * Returns NotImplemented if inplace bitwise left shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to left shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the left shift
 */
Sk.builtin.int_.prototype.nb$inplace_lshift = Sk.builtin.int_.prototype.nb$lshift;

/**
 * @function
 * @name  nb$inplace_rshift
 * @memberOf Sk.builtin.int_.prototype
 * @description
 * Compute the bitwise right shift of this instance by a Python object (i.e. this >>= other).
 *
 * Returns NotImplemented if inplace bitwise right shift operation between int and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object by which to right shift
 * @return {(Sk.builtin.int_|Sk.builtin.lng|Sk.builtin.NotImplemented)} The result of the right shift
 */
Sk.builtin.int_.prototype.nb$inplace_rshift = Sk.builtin.int_.prototype.nb$rshift;

/**
 * @override
 *
 * @return {Sk.builtin.int_} A copy of this instance with the value negated.
 */
Sk.builtin.int_.prototype.nb$negative = function () {
    return new Sk.builtin.int_(-this.v);
};

/** @override */
Sk.builtin.int_.prototype.nb$positive = function () {
    return this.clone();
};

/** @override */
Sk.builtin.int_.prototype.nb$nonzero = function () {
    return this.v !== 0;
};

/** @override */
Sk.builtin.int_.prototype.nb$isnegative = function () {
    return this.v < 0;
};

/** @override */
Sk.builtin.int_.prototype.nb$ispositive = function () {
    return this.v >= 0;
};

/**
 * Compare this instance's value to another Python object's value.
 *
 * Returns NotImplemented if comparison between int and other type is unsupported.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(number|Sk.builtin.NotImplemented)} negative if this < other, zero if this == other, positive if this > other
 */
Sk.builtin.int_.prototype.numberCompare = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return this.v - other.v;
    }

    if (other instanceof Sk.builtin.lng) {
        return -other.longCompare(this);
    }

    if (other instanceof Sk.builtin.float_) {
        return -other.numberCompare(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

// Despite what jshint may want us to do, these two  functions need to remain
// as == and !=  Unless you modify the logic of numberCompare do not change
// these.

/** @override */
Sk.builtin.int_.prototype.ob$eq = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) == 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$ne = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) != 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$lt = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) < 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$le = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) <= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$gt = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) > 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.int_.prototype.ob$ge = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) >= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/**
 * Round this instance to a given number of digits, or zero if omitted.
 *
 * Implements `__round__` dunder method.
 *
 * Javascript function, returns Python object.
 *
 * @param  {Sk.builtin.int_} self This instance.
 * @param  {Object|number=} ndigits The number of digits after the decimal point to which to round.
 * @return {Sk.builtin.int_} The rounded integer.
 */
Sk.builtin.int_.prototype.__round__ = function (self, ndigits) {
    Sk.builtin.pyCheckArgs("__round__", arguments, 1, 2);

    var result, multiplier, number;

    if ((ndigits !== undefined) && !Sk.misceval.isIndex(ndigits)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(ndigits) + "' object cannot be interpreted as an index");
    }

    if (ndigits === undefined) {
        ndigits = 0;
    }

    number = Sk.builtin.asnum$(self);
    ndigits = Sk.misceval.asIndex(ndigits);

    multiplier = Math.pow(10, ndigits);
    result = Math.round(number * multiplier) / multiplier;

    return new Sk.builtin.int_(result);
};

Sk.builtin.int_.prototype.conjugate = new Sk.builtin.func(function (self) {
    return new Sk.builtin.int_(self.v);
});

/** @override */
Sk.builtin.int_.prototype["$r"] = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

/**
 * Return the string representation of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.str} The Python string representation of this instance.
 */
Sk.builtin.int_.prototype.tp$str = function () {
    return new Sk.builtin.str(this.str$(10, true));
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
Sk.builtin.int_.prototype.str$ = function (base, sign) {
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
 * Takes a JavaScript string and returns a number using the parser and negater
 *  functions (for int/long right now)
 * @param  {string} s       Javascript string to convert to a number.
 * @param  {number} base    The base of the number.
 * @param  {function(string, number): number} parser  Function which should take
 *  a string that is a postive number which only contains characters that are
 *  valid in the given base and a base and return a number.
 * @param  {function((number|Sk.builtin.biginteger)): number} negater Function which should take a
 *  number and return its negation
 * @param  {string} fname   The name of the calling function, to be used in error messages
 * @return {number}         The number equivalent of the string in the given base
 */
Sk.str2number = function (s, base, parser, negater, fname) {
    "use strict";
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

    if (base === undefined) {
        base = 10;
    } // default radix is 10, not dwim

    if (base < 2 || base > 36) {
        if (base !== 0) {
            throw new Sk.builtin.ValueError(fname + "() base must be >= 2 and <= 36");
        }
    }

    if (s.substring(0, 2).toLowerCase() === "0x") {
        if (base === 16 || base === 0) {
            s = s.substring(2);
            base = 16;
        } else if (base < 34) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0b") {
        if (base === 2 || base === 0) {
            s = s.substring(2);
            base = 2;
        } else if (base < 12) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0o") {
        if (base === 8 || base === 0) {
            s = s.substring(2);
            base = 8;
        } else if (base < 25) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
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
        throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
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
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    }

    // parse number
    val = parser(s, base);
    if (neg) {
        val = negater(val);
    }
    return val;
};

goog.exportSymbol("Sk.builtin.int_", Sk.builtin.int_);