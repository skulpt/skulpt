/**
 * @constructor
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
    if (typeof x === "number" || x instanceof Sk.builtin.int_ || x instanceof Sk.builtin.lng) {
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
    var special = Sk.builtin.object.PyObject_LookupSpecial_(x.ob$type, "__float__");
    if (special != null) {
        // method on builtin, provide this arg
        return Sk.misceval.callsim(special, x);
    }

    throw new Sk.builtin.TypeError("float() argument must be a string or a number");
};

Sk.builtin.float_.prototype.__int__ = new Sk.builtin.func(function(self) {
    // get value
    var v = Sk.ffi.remapToJs(self);

    if (v < 0) {
        v = Math.ceil(v);
    } else {
        v = Math.floor(v);
    }

    // this should take care of int/long fitting
    return new Sk.builtin.int_(v);
});

Sk.builtin.float_.prototype.__float__ = new Sk.builtin.func(function(self) {
    return self;
});

/*
 * This checks also for float subtypes, though skulpt does not allow to
 * extend them for now.
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

/*
 * This method is just a wrapper, but uses the correct cpython API name
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

Sk.builtin.float_.prototype.tp$name = "float";
Sk.builtin.float_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("float", Sk.builtin.float_);

Sk.builtin.float_.prototype.tp$index = function () {
    return this.v;
};

Sk.builtin.float_.prototype.tp$hash = function () {
    //the hash of all numbers should be an int and since javascript doesn't really
    //care every number can be an int.
    return this.__int__.func_code(this);
};

Sk.builtin.float_.prototype.clone = function () {
    return new Sk.builtin.float_(this.v);
};

Sk.builtin.float_.prototype.toFixed = function (x) {
    x = Sk.builtin.asnum$(x);
    return this.v.toFixed(x);
};

Sk.builtin.float_.prototype.nb$add = function (other) {
    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.float_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.float_(0);
    }

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(this.v + other.v);
    } else if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.float_(this.v + parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};


Sk.builtin.float_.prototype.nb$subtract = function (other) {
    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.float_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.float_(0);
    }

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(this.v - other.v);
    } else if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.float_(this.v - parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.float_.prototype.nb$multiply = function (other) {
    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.float_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.float_(0);
    }

    if (other instanceof Sk.builtin.int_ || other instanceof Sk.builtin.float_) {
        return new Sk.builtin.float_(this.v * other.v);
    } else if (other instanceof Sk.builtin.lng) {
        return new Sk.builtin.float_(this.v * parseFloat(other.str$(10, true)));
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.float_.prototype.nb$divide = function (other) {
    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.float_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.float_(0);
    }

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

Sk.builtin.float_.prototype.nb$floor_divide = function (other) {

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.float_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.float_(0);
    }

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

        return Sk.builtin.float_(Math.floor(this.v / other.v));
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

Sk.builtin.float_.prototype.nb$remainder = function (other) {
    var thisAsLong;
    var op2;
    var tmp;
    var result;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.float_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.float_(0);
    }

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

Sk.builtin.float_.prototype.nb$divmod = function (other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_ ||
        other instanceof Sk.builtin.bool) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.float_.prototype.nb$power = function (other) {
    var thisAsLong;
    var result;

    if (other === Sk.builtin.bool.true$) {
        other = new Sk.builtin.float_(1);
    }

    if (other === Sk.builtin.bool.false$) {
        other = new Sk.builtin.float_(0);
    }

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

Sk.builtin.float_.prototype.nb$inplace_add = Sk.builtin.float_.prototype.nb$add;

Sk.builtin.float_.prototype.nb$inplace_subtract = Sk.builtin.float_.prototype.nb$subtract;

Sk.builtin.float_.prototype.nb$inplace_multiply = Sk.builtin.float_.prototype.nb$multiply;

Sk.builtin.float_.prototype.nb$inplace_divide = Sk.builtin.float_.prototype.nb$divide;

Sk.builtin.float_.prototype.nb$inplace_remainder = Sk.builtin.float_.prototype.nb$remainder;

Sk.builtin.float_.prototype.nb$inplace_floor_divide = Sk.builtin.float_.prototype.nb$floor_divide;

Sk.builtin.float_.prototype.nb$inplace_power = Sk.builtin.float_.prototype.nb$power;

Sk.builtin.float_.prototype.nb$negative = function () {
    return new Sk.builtin.float_(-this.v);
};

Sk.builtin.float_.prototype.nb$positive = function () {
    return this.clone();
};

Sk.builtin.float_.prototype.nb$nonzero = function () {
    return this.v !== 0;
};

Sk.builtin.float_.prototype.nb$isnegative = function () {
    return this.v < 0;
};

Sk.builtin.float_.prototype.nb$ispositive = function () {
    return this.v >= 0;
};

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
Sk.builtin.float_.prototype.__eq__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_ ||
        other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) == 0; //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return false;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.float_.prototype.__ne__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_ ||
        other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) != 0; //jshint ignore:line
    } else if (other instanceof Sk.builtin.none) {
        return true;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.float_.prototype.__lt__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_ ||
        other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) < 0;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.float_.prototype.__le__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_ ||
        other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) <= 0;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.float_.prototype.__gt__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_ ||
        other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) > 0;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

Sk.builtin.float_.prototype.__ge__ = function (me, other) {
    if (other instanceof Sk.builtin.int_ ||
        other instanceof Sk.builtin.lng ||
        other instanceof Sk.builtin.float_ ||
        other instanceof Sk.builtin.bool) {
        return me.numberCompare(other) >= 0;
    } else {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
};

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

Sk.builtin.float_.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

Sk.builtin.float_.prototype["$r"] = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

Sk.builtin.float_.prototype.tp$str = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

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