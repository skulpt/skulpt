/* global Sk: true, goog:true */

// long aka "bignumber" implementation
//
//  Using javascript BigInteger by Tom Wu
/**
 * @constructor
 * Sk.builtin.lng
 *
 * @description
 * Constructor for Python long. Also used for builtin long().
 *
 * @extends {Sk.builtin.numtype}
 * 
 * @param {*} x Object or number to convert to Python long.
 * @param {number=} base Optional base.
 * @return {Sk.builtin.lng} Python long
 */
Sk.builtin.lng = function (x, base) {   /* long is a reserved word */
    base = Sk.builtin.asnum$(base);
    if (!(this instanceof Sk.builtin.lng)) {
        return new Sk.builtin.lng(x, base);
    }


    if (x === undefined) {
        this.biginteger = new Sk.builtin.biginteger(0);
        return this;
    }
    if (x instanceof Sk.builtin.lng) {
        this.biginteger = x.biginteger.clone();
        return this;
    }
    if (x instanceof Sk.builtin.biginteger) {
        this.biginteger = x;
        return this;
    }
    if (x instanceof String || typeof x === "string") {
        return Sk.longFromStr(x, base);
    }
    if (x instanceof Sk.builtin.str) {
        return Sk.longFromStr(x.v, base);
    }

    if ((x !== undefined) && (!Sk.builtin.checkString(x) && !Sk.builtin.checkNumber(x))) {
        if (x === true) {
            x = 1;
        } else if (x === false) {
            x = 0;
        } else {
            throw new Sk.builtin.TypeError("long() argument must be a string or a number, not '" + Sk.abstr.typeName(x) + "'");
        }
    }

    x = Sk.builtin.asnum$nofloat(x);
    this.biginteger = new Sk.builtin.biginteger(x);
    return this;
};

Sk.abstr.setUpInheritance("long", Sk.builtin.lng, Sk.builtin.numtype);

/* NOTE: See constants used for kwargs in constants.js */

Sk.builtin.lng.prototype.tp$index = function () {
    return parseInt(this.str$(10, true), 10);
};

Sk.builtin.lng.prototype.tp$hash = function () {
    return new Sk.builtin.int_(this.tp$index());
};

Sk.builtin.lng.prototype.nb$int_ = function() {
    if (this.cantBeInt()) {
        return new Sk.builtin.lng(this);
    }

    return new Sk.builtin.int_(this.toInt$());
};

Sk.builtin.lng.prototype.__index__ = new Sk.builtin.func(function(self) {
    return self.nb$int_(self);
});

Sk.builtin.lng.prototype.nb$lng_ = function () {
    return this;
};

Sk.builtin.lng.prototype.nb$float_ = function() {
    return new Sk.builtin.float_(Sk.ffi.remapToJs(this));
};

//    Threshold to determine when types should be converted to long
//Sk.builtin.lng.threshold$ = Sk.builtin.int_.threshold$;

Sk.builtin.lng.MAX_INT$ = new Sk.builtin.lng(Sk.builtin.int_.threshold$);
Sk.builtin.lng.MIN_INT$ = new Sk.builtin.lng(-Sk.builtin.int_.threshold$);

Sk.builtin.lng.prototype.cantBeInt = function () {
    return (this.longCompare(Sk.builtin.lng.MAX_INT$) > 0) || (this.longCompare(Sk.builtin.lng.MIN_INT$) < 0);
};

Sk.builtin.lng.fromInt$ = function (ival) {
    return new Sk.builtin.lng(ival);
};

// js string (not Sk.builtin.str) -> long. used to create longs in transformer, respects
// 0x, 0o, 0b, etc.
Sk.longFromStr = function (s, base) {
    // l/L are valid digits with base >= 22
    // goog.asserts.assert(s.charAt(s.length - 1) !== "L" && s.charAt(s.length - 1) !== 'l', "L suffix should be removed before here");

    var parser = function (s, base) {
            if (base === 10) {
                return new Sk.builtin.biginteger(s);
            }
            return new Sk.builtin.biginteger(s, base);
        },
        biginteger = Sk.str2number(s, base, parser, function (x) {
            return x.negate();
        }, "long");

    return new Sk.builtin.lng(biginteger);
};
goog.exportSymbol("Sk.longFromStr", Sk.longFromStr);

Sk.builtin.lng.prototype.toInt$ = function () {
    return this.biginteger.intValue();
};

Sk.builtin.lng.prototype.clone = function () {
    return new Sk.builtin.lng(this);
};

Sk.builtin.lng.prototype.conjugate = new Sk.builtin.func(function (self) {
    return self.clone();
});

Sk.builtin.lng.prototype.nb$add = function (other) {
    var thisAsFloat;

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$add(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //    Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.add(other.biginteger));
    }

    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.add(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.lng.prototype.nb$reflected_add = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    return Sk.builtin.lng.prototype.nb$add.call(this, other);
};

Sk.builtin.lng.prototype.nb$inplace_add = Sk.builtin.lng.prototype.nb$add;

Sk.builtin.lng.prototype.nb$subtract = function (other) {
    var thisAsFloat;

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$subtract(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //    Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.subtract(other.biginteger));
    }

    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.subtract(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.lng.prototype.nb$reflected_subtract = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    var negative_this = this.nb$negative();
    return Sk.builtin.lng.prototype.nb$add.call(negative_this, other);
};

Sk.builtin.lng.prototype.nb$inplace_subtract = Sk.builtin.lng.prototype.nb$subtract;

Sk.builtin.lng.prototype.nb$multiply = function (other) {
    var thisAsFloat;
    
    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$multiply(other);
    }

    if (other instanceof Sk.builtin.int_) {
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.multiply(other.biginteger));
    }

    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.multiply(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.lng.prototype.nb$reflected_multiply = function (other) {
    // Should not automatically call this.nb$multiply, as nb$multiply may have
    // been overridden by a subclass
    return Sk.builtin.lng.prototype.nb$multiply.call(this, other);
};

Sk.builtin.lng.prototype.nb$inplace_multiply = Sk.builtin.lng.prototype.nb$multiply;

Sk.builtin.lng.prototype.nb$divide = function (other) {
    var thisAsFloat, thisneg, otherneg, result;

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$divide(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //    Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    //    Standard, long result mode

    if (other instanceof Sk.builtin.lng) {
        //    Special logic to round DOWN towards negative infinity for negative results
        thisneg = this.nb$isnegative();
        otherneg = other.nb$isnegative();
        if ((thisneg && !otherneg) || (otherneg && !thisneg)) {
            result = this.biginteger.divideAndRemainder(other.biginteger);
            //    If remainder is zero or positive, just return division result
            if (result[1].trueCompare(Sk.builtin.biginteger.ZERO) === 0) {
                //    No remainder, just return result
                return new Sk.builtin.lng(result[0]);
            }
            //    Reminder... subtract 1 from the result (like rounding to neg infinity)
            result = result[0].subtract(Sk.builtin.biginteger.ONE);
            return new Sk.builtin.lng(result);
        }
        return new Sk.builtin.lng(this.biginteger.divide(other.biginteger));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_divide = function (other) {
    var thisneg, otherneg, result;

    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    //    Standard, long result mode
    if (other instanceof Sk.builtin.lng) {
        return other.nb$divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$floor_divide = function (other) {
    var thisAsFloat;

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$floor_divide(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    //    Standard, long result mode
    if (other instanceof Sk.builtin.lng) {
        return other.nb$divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$divmod = function (other) {
    if (other instanceof Sk.builtin.int_) {
        // Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_divmod = function (other) {
    if (other instanceof Sk.builtin.int_) {
        // Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.tuple([
            other.nb$floor_divide(this),
            other.nb$remainder(this)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_divide = Sk.builtin.lng.prototype.nb$divide;

Sk.builtin.lng.prototype.nb$floor_divide = Sk.builtin.lng.prototype.nb$divide;

Sk.builtin.lng.prototype.nb$reflected_floor_divide = Sk.builtin.lng.prototype.nb$reflected_divide;

Sk.builtin.lng.prototype.nb$inplace_floor_divide = Sk.builtin.lng.prototype.nb$floor_divide;

Sk.builtin.lng.prototype.nb$remainder = function (other) {
    var thisAsFloat, tmp;

    if (this.biginteger.trueCompare(Sk.builtin.biginteger.ZERO) === 0) {
        if (other instanceof Sk.builtin.float_) {
            return new Sk.builtin.float_(0);
        }
        return new Sk.builtin.lng(0);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$remainder(other);
    }

    if (other instanceof Sk.builtin.int_) {
        //    Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {

        tmp = new Sk.builtin.lng(this.biginteger.remainder(other.biginteger));
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

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_remainder = function (other) {
    if (other instanceof Sk.builtin.int_) {
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return other.nb$remainder(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_remainder = Sk.builtin.lng.prototype.nb$remainder;

Sk.builtin.lng.prototype.nb$divmod = function (other) {
    var thisAsFloat;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.lng(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.lng(0);
    }

    if (other instanceof Sk.builtin.int_) {
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$divmod(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * @param {number|Object} n
 * @param {number|Object=} mod
 * @suppress {checkTypes}
 */
Sk.builtin.lng.prototype.nb$power = function (n, mod) {
    var thisAsFloat;
    if (mod !== undefined) {
        n = new Sk.builtin.biginteger(Sk.builtin.asnum$(n));
        mod = new Sk.builtin.biginteger(Sk.builtin.asnum$(mod));

        return new Sk.builtin.lng(this.biginteger.modPowInt(n, mod));
    }

    if (n instanceof Sk.builtin.float_ || 
        (n instanceof Sk.builtin.int_ && n.v < 0)) {
        thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
        return thisAsFloat.nb$power(n);
    }

    if (n instanceof Sk.builtin.int_) {
        //    Promote an int to long
        n = new Sk.builtin.lng(n.v);
    }

    if (n instanceof Sk.builtin.lng) {
        if (mod !== undefined) {
            n = new Sk.builtin.biginteger(Sk.builtin.asnum$(n));
            mod = new Sk.builtin.biginteger(Sk.builtin.asnum$(mod));

            return new Sk.builtin.lng(this.biginteger.modPowInt(n, mod));
        }

        if (n.nb$isnegative()) {
            thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
            return thisAsFloat.nb$power(n);
        }
        return new Sk.builtin.lng(this.biginteger.pow(n.biginteger));
    }

    if (n instanceof Sk.builtin.biginteger) {
        if (mod !== undefined) {
            mod = new Sk.builtin.biginteger(Sk.builtin.asnum$(mod));

            return new Sk.builtin.lng(this.biginteger.modPowInt(n, mod));
        }

        if (n.isnegative()) {
            thisAsFloat = new Sk.builtin.float_(this.str$(10, true));
            return thisAsFloat.nb$power(n);
        }
        return new Sk.builtin.lng(this.biginteger.pow(n));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_power = function (n, mod) {
    if (n instanceof Sk.builtin.int_) {
        // Promote an int to long
        n = new Sk.builtin.lng(n.v);
    }

    if (n instanceof Sk.builtin.lng) {
        return n.nb$power(this, mod);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_power = Sk.builtin.lng.prototype.nb$power;

/**
 * Compute the absolute value of this instance and return.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.lng} The absolute value
 */
Sk.builtin.lng.prototype.nb$abs = function () {
    return new Sk.builtin.lng(this.biginteger.bnAbs());
};

Sk.builtin.lng.prototype.nb$lshift = function (other) {

    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.biginteger.signum() < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        return new Sk.builtin.lng(this.biginteger.shiftLeft(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        if (other.signum() < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        return new Sk.builtin.lng(this.biginteger.shiftLeft(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_lshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        // Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return other.nb$lshift(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_lshift = Sk.builtin.lng.prototype.nb$lshift;

Sk.builtin.lng.prototype.nb$rshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.biginteger.signum() < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        return new Sk.builtin.lng(this.biginteger.shiftRight(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        if (other.signum() < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        return new Sk.builtin.lng(this.biginteger.shiftRight(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_rshift = function (other) {
    if (other instanceof Sk.builtin.int_) {
        // Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return other.nb$rshift(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$inplace_rshift = Sk.builtin.lng.prototype.nb$rshift;

Sk.builtin.lng.prototype.nb$and = function (other) {
    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.and(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.and(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_and = Sk.builtin.lng.prototype.nb$and;

Sk.builtin.lng.prototype.nb$inplace_and = Sk.builtin.lng.prototype.nb$and;

Sk.builtin.lng.prototype.nb$or = function (other) {
    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.or(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.or(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};


Sk.builtin.lng.prototype.nb$reflected_or = Sk.builtin.lng.prototype.nb$or;

Sk.builtin.lng.prototype.nb$inplace_or = Sk.builtin.lng.prototype.nb$or;

Sk.builtin.lng.prototype.nb$xor = function (other) {
    if (other instanceof Sk.builtin.int_) {
        //  Promote an int to long
        other = new Sk.builtin.lng(other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.lng(this.biginteger.xor(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
        return new Sk.builtin.lng(this.biginteger.xor(other));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.lng.prototype.nb$reflected_xor = Sk.builtin.lng.prototype.nb$xor;

Sk.builtin.lng.prototype.nb$inplace_xor = Sk.builtin.lng.prototype.nb$xor;

/**
 * @override
 *
 * @return {Sk.builtin.lng} A copy of this instance with the value negated.
 */
Sk.builtin.lng.prototype.nb$negative = function () {
    return new Sk.builtin.lng(this.biginteger.negate());
};

Sk.builtin.lng.prototype.nb$invert = function () {
    return new Sk.builtin.lng(this.biginteger.not());
};

Sk.builtin.lng.prototype.nb$positive = function () {
    return this.clone();
};

Sk.builtin.lng.prototype.nb$nonzero = function () {
    return this.biginteger.trueCompare(Sk.builtin.biginteger.ZERO) !== 0;
};

Sk.builtin.lng.prototype.nb$isnegative = function () {
    return this.biginteger.isnegative();
};

Sk.builtin.lng.prototype.nb$ispositive = function () {
    return !this.biginteger.isnegative();
};

Sk.builtin.lng.prototype.longCompare = function (other) {
    var otherAsLong, thisAsFloat;

    if (typeof other === "number") {
        other = new Sk.builtin.lng(other);
    }

    if (other instanceof Sk.builtin.int_ || 
        (other instanceof Sk.builtin.float_ && other.v % 1 === 0)) {
        otherAsLong = new Sk.builtin.lng(other.v);
        return this.longCompare(otherAsLong);
    }

    if (other instanceof Sk.builtin.float_) {
        thisAsFloat = new Sk.builtin.float_(this);
        return thisAsFloat.numberCompare(other);
    }

    if (other instanceof Sk.builtin.lng) {
        return this.biginteger.subtract(other.biginteger);
    } else if (other instanceof Sk.builtin.biginteger) {
        return this.biginteger.subtract(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

//tests fail if ===
Sk.builtin.lng.prototype.ob$eq = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) == 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$ne = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) != 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$lt = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) < 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$le = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) <= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$gt = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) > 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.ob$ge = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.longCompare(other) >= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.lng.prototype.$r = function () {
    return new Sk.builtin.str(this.str$(10, true) + "L");
};

Sk.builtin.lng.prototype.tp$str = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

Sk.builtin.lng.prototype.str$ = function (base, sign) {
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
};