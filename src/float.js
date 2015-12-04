/**
 * @namespace Sk.builtin
 */

/**
 * @constructor
 * Sk.builtin.float_
 *
 * @description
 * Constructor for Python float. Also used for builtin float().
 *
 * @extends {Sk.builtin.numtype}
 *
 * @param {!(Object|number|string)} x Object or number to convert to Python float.
 * @return {Sk.builtin.float_} Python float
 */
Sk.builtin.float_ = function (x) {
    var tmp;
    if (x === undefined) {
        return new Sk.builtin.float_(0.0);
    }

    if (!(this instanceof Sk.builtin.float_)) {
        return new Sk.builtin.float_(x);
    }


    if (x instanceof Sk.builtin.str) {

        if (x.v.match(/^-inf$/i)) {
            tmp = -Infinity;
        } else if (x.v.match(/^[+]?inf$/i)) {
            tmp = Infinity;
        } else if (x.v.match(/^[-+]?nan$/i)) {
            tmp = NaN;
        } else if (!isNaN(x.v)) {
            tmp = parseFloat(x.v);
        } else {
            throw new Sk.builtin.ValueError("float: Argument: " + x.v + " is not number");
        }
        return new Sk.builtin.float_(tmp);
    }

    // Floats are just numbers
    if (typeof x === "number" || x instanceof Sk.builtin.int_ || x instanceof Sk.builtin.lng || x instanceof Sk.builtin.float_) {
        this.v = Sk.builtin.asnum$(x);
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
    var special = Sk.abstr.lookupSpecial(x, "__float__");
    if (special != null) {
        // method on builtin, provide this arg
        return Sk.misceval.callsim(special, x);
    }

    throw new Sk.builtin.TypeError("float() argument must be a string or a number");
};

Sk.abstr.setUpInheritance("float", Sk.builtin.float_, Sk.builtin.numtype);

Sk.builtin.float_.prototype.nb$int_ = function () {
    var v = this.v;

    if (v < 0) {
        v = Math.ceil(v);
    } else {
        v = Math.floor(v);
    }

    // this should take care of int/long fitting
    return new Sk.builtin.int_(v);
};

Sk.builtin.float_.prototype.nb$float_ = function() {
    return this;
};

Sk.builtin.float_.prototype.nb$lng = function () {
    return new Sk.builtin.lng(this.v);
};

/**
 * Checks for float subtypes, though skulpt does not allow to
 * extend them for now.
 *
 * Javascript function, returns Javascript object.
 * @param {Object} op The object to check as subtype.
 * @return {boolean} true if op is a subtype of Sk.builtin.float_, false otherwise
 */
Sk.builtin.float_.PyFloat_Check = function (op) {
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

    if (Sk.builtin.issubclass(op.ob$type, Sk.builtin.float_)) {
        return true;
    }

    return false;
};

/**
 * Checks if ob is a Python float.
 *
 * This method is just a wrapper, but uses the correct cpython API name.
 *
 * Javascript function, returns Javascript object.
 * @param {Object} op The object to check.
 * @return {boolean} true if op is an instance of Sk.builtin.float_, false otherwise
 */
Sk.builtin.float_.PyFloat_Check_Exact = function (op) {
    return Sk.builtin.checkFloat(op);
};

Sk.builtin.float_.PyFloat_AsDouble = function (op) {
    var f; // nb_float;
    var fo; // PyFloatObject *fo;
    var val;

    // it is a subclass or direct float
    if (op && Sk.builtin.float_.PyFloat_Check(op)) {
        return Sk.ffi.remapToJs(op);
    }

    if (op == null) {
        throw new Error("bad argument for internal PyFloat_AsDouble function");
    }

    // check if special method exists (nb_float is not implemented in skulpt, hence we use __float__)
    f = Sk.builtin.type.typeLookup(op.ob$type, "__float__");
    if (f == null) {
        throw new Sk.builtin.TypeError("a float is required");
    }

    // call internal float method
    fo = Sk.misceval.callsim(f, op);

    // return value of __float__ must be a python float
    if (!Sk.builtin.float_.PyFloat_Check(fo)) {
        throw new Sk.builtin.TypeError("nb_float should return float object");
    }

    val = Sk.ffi.remapToJs(fo);

    return val;
};

/**
 * Return this instance's Javascript value.
 *
 * Javascript function, returns Javascript object.
 *
 * @return {number} This instance's value.
 */
Sk.builtin.float_.prototype.tp$index = function () {
    return this.v;
};

/** @override */
Sk.builtin.float_.prototype.tp$hash = function () {
    //the hash of all numbers should be an int and since javascript doesn't really
    //care every number can be an int.
    return this.nb$int_();
};


/**
 * Returns a copy of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.float_} The copy
 */
Sk.builtin.float_.prototype.clone = function () {
    return new Sk.builtin.float_(this.v);
};

/**
 * Returns this instance's value as a string formatted using fixed-point notation.
 *
 * Javascript function, returns Javascript object.
 *
 * @param  {Object|number} x The numer of digits to appear after the decimal point.
 * @return {string}   The string representation of this instance's value.
 */
Sk.builtin.float_.prototype.toFixed = function (x) {
    x = Sk.builtin.asnum$(x);
    return this.v.toFixed(x);
};

/** @override */
Sk.builtin.float_.prototype.nb$add = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(this.v + other.v);
    } else if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.float_(this.v + parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_add = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    return Sk.builtin.float_.prototype.nb$add.call(this, other);
};

/** @override */
Sk.builtin.float_.prototype.nb$subtract = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(this.v - other.v);
    } else if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.float_(this.v - parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_subtract = function (other) {
    // Should not automatically call this.nb$add, as nb$add may have
    // been overridden by a subclass
    var negative_this = this.nb$negative();
    return Sk.builtin.float_.prototype.nb$add.call(negative_this, other);
};

/** @override */
Sk.builtin.float_.prototype.nb$multiply = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(this.v * other.v);
    } else if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.float_(this.v * parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_multiply = function (other) {
    // Should not automatically call this.nb$multiply, as nb$multiply may have
    // been overridden by a subclass
    return Sk.builtin.float_.prototype.nb$multiply.call(this, other);
};

/** @override */
Sk.builtin.float_.prototype.nb$divide = function (other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {

        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === Infinity) {
            if (other.v === Infinity || other.v === -Infinity) {
                return new Sk.builtin.float_(NaN);
            } else if (other.nb$isnegative()) {
                return new Sk.builtin.float_(-Infinity);
            } else {
                return new Sk.builtin.float_(Infinity);
            }
        }
        if (this.v === -Infinity) {
            if (other.v === Infinity || other.v === -Infinity) {
                return new Sk.builtin.float_(NaN);
            } else if (other.nb$isnegative()) {
                return new Sk.builtin.float_(Infinity);
            } else {
                return new Sk.builtin.float_(-Infinity);
            }
        }

        return new Sk.builtin.float_(this.v / other.v);
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === Infinity) {
            if (other.nb$isnegative()) {
                return new Sk.builtin.float_(-Infinity);
            } else {
                return new Sk.builtin.float_(Infinity);
            }
        }
        if (this.v === -Infinity) {
            if (other.nb$isnegative()) {
                return new Sk.builtin.float_(Infinity);
            } else {
                return new Sk.builtin.float_(-Infinity);
            }
        }

        return new Sk.builtin.float_(this.v / parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_divide = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return other.nb$divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$floor_divide = function (other) {

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {

        if (this.v === Infinity || this.v === -Infinity) {
            return new Sk.builtin.float_(NaN);
        }

        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (other.v === Infinity) {
            if (this.nb$isnegative()) {
                return new Sk.builtin.float_(-1);
            } else {
                return new Sk.builtin.float_(0);
            }
        }
        if (other.v === -Infinity) {
            if (this.nb$isnegative() || !this.nb$nonzero()) {
                return new Sk.builtin.float_(0);
            } else {
                return new Sk.builtin.float_(-1);
            }
        }

        return new Sk.builtin.float_(Math.floor(this.v / other.v));
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === Infinity || this.v === -Infinity) {
            return new Sk.builtin.float_(NaN);
        }

        return new Sk.builtin.float_(Math.floor(this.v / parseFloat(other.str$(10, true))));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_floor_divide = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return other.nb$floor_divide(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$remainder = function (other) {
    var thisAsLong;
    var op2;
    var tmp;
    var result;

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {

        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === 0) {
            return new Sk.builtin.float_(0);
        }

        if (other.v === Infinity) {
            if (this.v === Infinity || this.v === -Infinity) {
                return new Sk.builtin.float_(NaN);
            } else if (this.nb$ispositive()) {
                return new Sk.builtin.float_(this.v);
            } else {
                return new Sk.builtin.float_(Infinity);
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

        return new Sk.builtin.float_(tmp);
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === 0) {
            return new Sk.builtin.float_(0);
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

        return new Sk.builtin.float_(tmp);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_remainder = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return other.nb$remainder(this);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$divmod = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_divmod = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng) {
        other = new Sk.builtin.float_(other);
    }

    if (other instanceof Sk.builtin.float_) {
        return new Sk.builtin.tuple([
            other.nb$floor_divide(this),
            other.nb$remainder(this)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$power = function (other, mod) {
    var thisAsLong;
    var result;

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        if (this.v < 0 && other.v % 1 !== 0) {
            throw new Sk.builtin.NegativePowerError("cannot raise a negative number to a fractional power");
        }
        if (this.v === 0 && other.v < 0) {
            throw new Sk.builtin.NegativePowerError("cannot raise zero to a negative power");
        }

        result = new Sk.builtin.float_(Math.pow(this.v, other.v));

        if ((Math.abs(result.v) === Infinity) &&
            (Math.abs(this.v) !== Infinity) &&
            (Math.abs(other.v) !== Infinity)) {
            throw new Sk.builtin.OverflowError("Numerical result out of range");
        }
        return result;
    }

    if (other instanceof Sk.builtin.lng) {
        if (this.v === 0 && other.longCompare(Sk.builtin.biginteger.ZERO) < 0) {
            throw new Sk.builtin.NegativePowerError("cannot raise zero to a negative power");
        }

        return new Sk.builtin.float_(Math.pow(this.v, parseFloat(other.str$(10, true))));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$reflected_power = function (n, mod) {
    if (n instanceof Sk.builtin.int_ ||
        n instanceof Sk.builtin.lng) {
        n = new Sk.builtin.float_(n);
    }

    if (n instanceof Sk.builtin.float_) {
        return n.nb$power(this, mod);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

/** @override */
Sk.builtin.float_.prototype.nb$abs = function () {
    return new Sk.builtin.float_(Math.abs(this.v));
};

/** @override */
Sk.builtin.float_.prototype.nb$inplace_add = Sk.builtin.float_.prototype.nb$add;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_subtract = Sk.builtin.float_.prototype.nb$subtract;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_multiply = Sk.builtin.float_.prototype.nb$multiply;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_divide = Sk.builtin.float_.prototype.nb$divide;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_remainder = Sk.builtin.float_.prototype.nb$remainder;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_floor_divide = Sk.builtin.float_.prototype.nb$floor_divide;

/** @override */
Sk.builtin.float_.prototype.nb$inplace_power = Sk.builtin.float_.prototype.nb$power;

/**
 * @override
 *
 * @return {Sk.builtin.float_} A copy of this instance with the value negated.
 */
Sk.builtin.float_.prototype.nb$negative = function () {
    return new Sk.builtin.float_(-this.v);
};

/** @override */
Sk.builtin.float_.prototype.nb$positive = function () {
    return this.clone();
};

/** @override */
Sk.builtin.float_.prototype.nb$nonzero = function () {
    return this.v !== 0;
};

/** @override */
Sk.builtin.float_.prototype.nb$isnegative = function () {
    return this.v < 0;
};

/** @override */
Sk.builtin.float_.prototype.nb$ispositive = function () {
    return this.v >= 0;
};

/**
 * Compare this instance's value to another Python object's value.
 *
 * Returns NotImplemented if comparison between float and other type is unsupported.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(number|Sk.builtin.NotImplemented)} negative if this < other, zero if this == other, positive if this > other
 */
Sk.builtin.float_.prototype.numberCompare = function (other) {
    var diff;
    var tmp;
    var thisAsLong;

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        if (this.v == Infinity && other.v == Infinity) {
            return 0;
        }
        if (this.v == -Infinity && other.v == -Infinity) {
            return 0;
        }
        return this.v - other.v;
    }

    if (other instanceof Sk.builtin.lng) {
        if (this.v % 1 === 0) {
            thisAsLong = new Sk.builtin.lng(this.v);
            tmp = thisAsLong.longCompare(other);
            return tmp;
        }
        diff = this.nb$subtract(other);
        if (diff instanceof Sk.builtin.float_) {
            return diff.v;
        } else if (diff instanceof Sk.builtin.lng) {
            return diff.longCompare(Sk.builtin.biginteger.ZERO);
        }
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

// Despite what jshint may want us to do, these two  functions need to remain
// as == and !=  Unless you modify the logic of numberCompare do not change
// these.

/** @override */
Sk.builtin.float_.prototype.ob$eq = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) == 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$ne = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) != 0); //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$lt = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) < 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$le = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) <= 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$gt = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_) {
        return new Sk.builtin.bool(this.numberCompare(other) > 0);
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

/** @override */
Sk.builtin.float_.prototype.ob$ge = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
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
 * @return {Sk.builtin.float_} The rounded float.
 */
Sk.builtin.float_.prototype.__round__ = function (self, ndigits) {
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

    return new Sk.builtin.float_(result);
};

Sk.builtin.float_.prototype.conjugate = new Sk.builtin.func(function (self) {
    return new Sk.builtin.float_(self.v);
});

/** @override */
Sk.builtin.float_.prototype["$r"] = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

/**
 * Return the string representation of this instance.
 *
 * Javascript function, returns Python object.
 *
 * @return {Sk.builtin.str} The Python string representation of this instance.
 */
Sk.builtin.float_.prototype.tp$str = function () {
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
Sk.builtin.float_.prototype.str$ = function (base, sign) {
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
};