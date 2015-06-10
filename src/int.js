/* jslint nomen: true, bitwise: true */
/* global Sk: true */

/*
 * type int, all integers are created with this method, it is also used
 * for the builtin int()
 *
 * Takes also implemented __int__ and __trunc__ methods for x into account
 * and tries to use __index__ and/or __int__ if base is not a number
 */
Sk.builtin.int_ = function (x, base) {
    "use strict";
    var val;
    var ret; // return value
    var magicName; // name of magic method

    if (!(this instanceof Sk.builtin.int_)) {
        return new Sk.builtin.int_(x, base);
    }

    if (x instanceof Sk.builtin.int_ && base === undefined) {
        this.v = x.v;
        return this;
    }

    // if base is not of type int, try calling .__index__
    if(base !== undefined && !Sk.builtin.checkInt(base)) {
        if(base.tp$getattr("__index__")) {
            base = Sk.misceval.callsim(base.__index__, base);
        } else if(base.tp$getattr("__int__")) {
            base = Sk.misceval.callsim(base.__int__, base);
        } else if(Sk.builtin.checkFloat(base)) {
            throw new Sk.builtin.TypeError("integer argument expected, got " + Sk.abstr.typeName(base));
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

Sk.builtin.int_.co_varnames = [ "base" ];
Sk.builtin.int_.co_numargs = 2;
Sk.builtin.int_.$defaults = [ new Sk.builtin.int_(10) ];

Sk.builtin.int_.prototype.__int__ = new Sk.builtin.func(function(self) {
    return self;
});

Sk.builtin.int_.prototype.__trunc__ = new Sk.builtin.func(function(self) {
    return self;
});

Sk.builtin.int_.prototype.__index__ = new Sk.builtin.func(function(self) {
    return self;
});

Sk.builtin.int_.prototype.__float__ = new Sk.builtin.func(function(self) {
    return new Sk.builtin.float_(Sk.ffi.remapToJs(self));
});

Sk.builtin.int_.prototype.__complex__ = new Sk.builtin.func(function(self) {
    throw new Sk.builtin.TypeError("__complex__ is not implemented for type 'int'.");
});

Sk.builtin.int_.prototype.tp$name = "int";
Sk.builtin.int_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("int", Sk.builtin.int_);

Sk.builtin.int_.prototype.tp$index = function () {
    return this.v;
};

Sk.builtin.int_.prototype.tp$hash = function () {
    //the hash of all numbers should be an int and since javascript doesn't really
    //care every number can be an int.
    return new Sk.builtin.int_(this.v);
};

//  Threshold to determine when types should be converted to long
Sk.builtin.int_.threshold$ = Math.pow(2, 53) - 1;

Sk.builtin.int_.prototype.clone = function () {
    return new Sk.builtin.int_(this.v);
};

Sk.builtin.int_.prototype.nb$add = function (other) {
    var thisAsLong, thisAsFloat;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

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


Sk.builtin.int_.prototype.nb$subtract = function (other) {
    var thisAsLong, thisAsFloat;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

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

Sk.builtin.int_.prototype.nb$multiply = function (other) {
    var product, thisAsLong, thisAsFloat;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

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

Sk.builtin.int_.prototype.nb$divide = function (other) {
    return this.nb$floor_divide(other);
};

Sk.builtin.int_.prototype.nb$floor_divide = function (other) {
    var thisAsLong, thisAsFloat;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

    if (other instanceof Sk.builtin.int_) {

        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        return new Sk.builtin.int_(Math.floor(this.v / other.v));
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

Sk.builtin.int_.prototype.nb$remainder = function (other) {
    var thisAsLong, thisAsFloat;
    var tmp;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

    if (other instanceof Sk.builtin.int_) {

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

Sk.builtin.int_.prototype.nb$divmod = function (other) {
    var thisAsLong;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
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

Sk.builtin.int_.prototype.nb$power = function (other) {
    var thisAsLong;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

    if (other instanceof Sk.builtin.int_) {
        return new Sk.builtin.int_(Math.pow(this.v, other.v));
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

Sk.builtin.int_.prototype.nb$and = function (other) {
    var thisAsLong;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

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

Sk.builtin.int_.prototype.nb$or = function (other) {
    var thisAsLong;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

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

Sk.builtin.int_.prototype.nb$xor = function (other) {
    var thisAsLong;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

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

Sk.builtin.int_.prototype.nb$lshift = function (other) {
    var thisAsLong;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

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
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$lshift(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$rshift = function (other) {
    var thisAsLong;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.int_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.int_(0);
    }

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
            return new Sk.builtin.int_(tmp);
        }
    }

    if (other instanceof Sk.builtin.lng) {
        thisAsLong = new Sk.builtin.lng(this.v);
        return thisAsLong.nb$rshift(other);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.int_.prototype.nb$invert = function () {
    return new Sk.builtin.int_(~this.v);
};

Sk.builtin.int_.prototype.nb$inplace_add = Sk.builtin.int_.prototype.nb$add;

Sk.builtin.int_.prototype.nb$inplace_subtract = Sk.builtin.int_.prototype.nb$subtract;

Sk.builtin.int_.prototype.nb$inplace_multiply = Sk.builtin.int_.prototype.nb$multiply;

Sk.builtin.int_.prototype.nb$inplace_divide = Sk.builtin.int_.prototype.nb$divide;

Sk.builtin.int_.prototype.nb$inplace_remainder = Sk.builtin.int_.prototype.nb$remainder;

Sk.builtin.int_.prototype.nb$inplace_floor_divide = Sk.builtin.int_.prototype.nb$floor_divide;

Sk.builtin.int_.prototype.nb$inplace_power = Sk.builtin.int_.prototype.nb$power;

Sk.builtin.int_.prototype.nb$inplace_and = Sk.builtin.int_.prototype.nb$and;

Sk.builtin.int_.prototype.nb$inplace_or = Sk.builtin.int_.prototype.nb$or;

Sk.builtin.int_.prototype.nb$inplace_xor = Sk.builtin.int_.prototype.nb$xor;

Sk.builtin.int_.prototype.nb$inplace_lshift = Sk.builtin.int_.prototype.nb$lshift;

Sk.builtin.int_.prototype.nb$inplace_rshift = Sk.builtin.int_.prototype.nb$rshift;

Sk.builtin.int_.prototype.nb$negative = function () {
    return new Sk.builtin.int_(-this.v);
};

Sk.builtin.int_.prototype.nb$positive = function () {
    return this.clone();
};

Sk.builtin.int_.prototype.nb$nonzero = function () {
    return this.v !== 0;
};

Sk.builtin.int_.prototype.nb$isnegative = function () {
    return this.v < 0;
};

Sk.builtin.int_.prototype.nb$ispositive = function () {
    return this.v >= 0;
};

Sk.builtin.int_.prototype.numberCompare = function (other) {
    if (other instanceof Sk.builtin.int_) {
        return this.v - other.v;
    }

    if (other === Sk.builtin.bool.true$) {
        return this.v - 1;
    }

    if (other === Sk.builtin.bool.false$) {
        return this.v - 0;
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

// Despite what jshint may want us to do, these two  functions need to remain
// as == and !=  Unless you modify the logic of numberCompare do not change
// these.
Sk.builtin.int_.prototype.__eq__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.bool) {
        return (me.numberCompare(other) == 0) && !(other instanceof Sk.builtin.none); //jshint ignore:line
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.int_.prototype.__ne__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.bool) {
        return (me.numberCompare(other) != 0) || (other instanceof Sk.builtin.none); //jshint ignore:line
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.int_.prototype.__lt__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) < 0;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.int_.prototype.__le__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) <= 0;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.int_.prototype.__gt__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) > 0;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.int_.prototype.__ge__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) >= 0;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

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

Sk.builtin.int_.prototype["$r"] = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

Sk.builtin.int_.prototype.tp$str = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

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

// Takes a JavaScript string and returns a number using the
// parser and negater functions (for int/long right now)
//
// parser should take a string that is a postive number which only
// contains characters that are valid in the given base and a base and
// return a number
//
// negater should take a number and return its negation
//
// fname is a string containing the function name to be used in error
// messages
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