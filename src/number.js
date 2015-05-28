// long aka "bignumber" implementation
//
//  Using javascript BigInteger by Tom Wu
/**
 * @constructor
 */
Sk.builtin.nmber = function (x, skType)    /* number is a reserved word */ {
    var result;
    if (!(this instanceof Sk.builtin.nmber)) {
        return new Sk.builtin.nmber(x, skType);
    }

    if (x instanceof Sk.builtin.str) {
        x = x.v;
    }

    if (x instanceof Sk.builtin.nmber) {
        this.v = x.v;
        this.skType = x.skType;
    } else if (typeof x === "number") {
        this.v = x;
        if (skType === undefined) {
            if (x > Sk.builtin.nmber.threshold$ || x < -Sk.builtin.nmber.threshold$ || x % 1 !== 0) {
                this.skType = Sk.builtin.nmber.float$;
            }
            else {
                this.skType = Sk.builtin.nmber.int$;
            }
        } else {
            this.skType = skType;
            if (skType === Sk.builtin.nmber.int$) {
                if (x > Sk.builtin.nmber.threshold$ || x < -Sk.builtin.nmber.threshold$) {
                    return new Sk.builtin.lng(x);
                }
            }
        }
    } else if (typeof x === "string") {
        result = Sk.numberFromStr(x);
        if (skType !== undefined) {
            result.skType = skType;
        }
        if (skType === Sk.builtin.nmber.int$) {
            if (result.v > Sk.builtin.nmber.threshold$ || result.v < -Sk.builtin.nmber.threshold$ - 1) {
                return new Sk.builtin.lng(x);
            }
        }
        return result;
    } else if (x instanceof Sk.builtin.lng) {
        return Sk.numberFromStr(x.str$(10, true));
    } else if (x instanceof Sk.builtin.biginteger) {
        result = Sk.numberFromStr(x.toString());
        if (skType !== undefined) {
            result.skType = skType;
        }
        if (skType === Sk.builtin.nmber.int$) {
            if (result.v > Sk.builtin.nmber.threshold$ || result.v < -Sk.builtin.nmber.threshold$) {
                return new Sk.builtin.lng(x);
            }
        }
    } else {
        this.v = 0;
        if (skType === undefined) {
            this.skType = Sk.builtin.nmber.int$;
        }
        else {
            this.skType = skType;
        }
    }

    /**
     * adjust sign of zero
     * only floats have negative zeros
     * This can be removed, when we have a proper numeric tower
     */
    if (this.skType === Sk.builtin.nmber.int$) {
        this.v = this.v === 0 ? 0 : this.v;
    }

    return this;
};

Sk.builtin.nmber.prototype.tp$index = function () {
    return this.v;
};

Sk.builtin.nmber.prototype.tp$hash = function () {
    //the hash of all numbers should be an int and since javascript doesn't really 
    //care every number can be an int.
    return new Sk.builtin.nmber(this.v, Sk.builtin.nmber.int$);
};

Sk.builtin.nmber.prototype.tp$name = "number";
Sk.builtin.nmber.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("number", Sk.builtin.nmber);

//	Threshold to determine when types should be converted to long
Sk.builtin.nmber.threshold$ = Math.pow(2, 53) - 1;
Sk.builtin.nmber.float$ = "float";
Sk.builtin.nmber.int$ = "int";

Sk.builtin.nmber.fromInt$ = function (ival) {
    return new Sk.builtin.nmber(ival, undefined);
};

// js string (not Sk.builtin.str) -> long. used to create longs in transformer, respects
// 0x, 0o, 0b, etc.
Sk.numberFromStr = function (s) {
    var s1;
    var tmp;
    var res;
    if (s == "inf") {
        return new Sk.builtin.nmber(Infinity, undefined);
    }
    if (s == "-inf") {
        return new Sk.builtin.nmber(-Infinity, undefined);
    }

    res = new Sk.builtin.nmber(0, undefined);

    if (s.indexOf(".") !== -1 || s.indexOf("e") !== -1 || s.indexOf("E") !== -1) {
        res.v = parseFloat(s);
        res.skType = Sk.builtin.nmber.float$;
        return res;
    }

    // ugly gunk to placate an overly-nanny closure-compiler:
    // http://code.google.com/p/closure-compiler/issues/detail?id=111
    // this is all just to emulate "parseInt(s)" with no radix.
    tmp = s;
    if (s.charAt(0) === "-") {
        tmp = s.substr(1);
    }
    if (tmp.charAt(0) === "0" && (tmp.charAt(1) === "x" || tmp.charAt(1) === "X")) {
        s1 = parseInt(s, 16);
    }
    else if (tmp.charAt(0) === "0" && (tmp.charAt(1) === "b" || tmp.charAt(1) === "B")) {
        s1 = parseInt(s, 2);
    }
    else if (tmp.charAt(0) === "0") {
        s1 = parseInt(s, 8);
    }
    else {
        s1 = parseInt(s, 10);
    }

    res.v = s1;
    res.skType = Sk.builtin.nmber.int$;
    return res;
};
goog.exportSymbol("Sk.numberFromStr", Sk.numberFromStr);

Sk.builtin.nmber.prototype.clone = function () {
    return new Sk.builtin.nmber(this, undefined);
};

Sk.builtin.nmber.prototype.toFixed = function (x) {
    x = Sk.builtin.asnum$(x);
    return this.v.toFixed(x);
};

Sk.builtin.nmber.prototype.nb$add = function (other) {
    var thisAsLong;
    var result;

    if (typeof other === "number") {
        other = new Sk.builtin.nmber(other, undefined);
    }
    else if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.nmber) {
        result = new Sk.builtin.nmber(this.v + other.v, undefined);
        if (this.skType === Sk.builtin.nmber.float$ || other.skType === Sk.builtin.nmber.float$) {
            result.skType = Sk.builtin.nmber.float$;
        }
        else {
            result.skType = Sk.builtin.nmber.int$;
            if (result.v > Sk.builtin.nmber.threshold$ || result.v < -Sk.builtin.nmber.threshold$) {
                //	Promote to long
                result = new Sk.builtin.lng(this.v).nb$add(other.v);
            }
        }
        return result;
    }

    if (other instanceof Sk.builtin.lng) {
        if (this.skType === Sk.builtin.nmber.float$) {  // float + long --> float
            result = new Sk.builtin.nmber(this.v + parseFloat(other.str$(10, true)), Sk.builtin.nmber.float$);
        } else {	//	int + long --> long
            thisAsLong = new Sk.builtin.lng(this.v);
            result = thisAsLong.nb$add(other);
        }
        return result;
    }

    return undefined;
};


Sk.builtin.nmber.prototype.nb$subtract = function (other) {
    var thisAsLong;
    var result;

    if (typeof other === "number") {
        other = new Sk.builtin.nmber(other, undefined);
    }
    else if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.nmber) {
        result = new Sk.builtin.nmber(this.v - other.v, undefined);
        if (this.skType === Sk.builtin.nmber.float$ || other.skType === Sk.builtin.nmber.float$) {
            result.skType = Sk.builtin.nmber.float$;
        }
        else {
            result.skType = Sk.builtin.nmber.int$;
            if (result.v > Sk.builtin.nmber.threshold$ || result.v < -Sk.builtin.nmber.threshold$) {
                //	Promote to long
                result = new Sk.builtin.lng(this.v).nb$subtract(other.v);
            }
        }
        return result;
    }

    if (other instanceof Sk.builtin.lng) {
        if (this.skType === Sk.builtin.nmber.float$) {  // float + long --> float
            result = new Sk.builtin.nmber(this.v - parseFloat(other.str$(10, true)), Sk.builtin.nmber.float$);
        } else {	//	int - long --> long
            thisAsLong = new Sk.builtin.lng(this.v);
            result = thisAsLong.nb$subtract(other);
        }
        return result;
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$multiply = function (other) {
    var thisAsLong;
    var result;

    if (typeof other === "number") {
        other = new Sk.builtin.nmber(other, undefined);
    }
    else if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.nmber) {
        result = new Sk.builtin.nmber(this.v * other.v, undefined);
        if (this.skType === Sk.builtin.nmber.float$ || other.skType === Sk.builtin.nmber.float$) {
            result.skType = Sk.builtin.nmber.float$;
        }
        else {
            result.skType = Sk.builtin.nmber.int$;
            if (result.v > Sk.builtin.nmber.threshold$ || result.v < -Sk.builtin.nmber.threshold$) {
                //	Promote to long
                result = new Sk.builtin.lng(this.v).nb$multiply(other.v);
            }
        }
        return result;
    }

    if (other instanceof Sk.builtin.lng) {
        if (this.skType === Sk.builtin.nmber.float$) {  // float + long --> float
            result = new Sk.builtin.nmber(this.v * parseFloat(other.str$(10, true)), Sk.builtin.nmber.float$);
        } else {	//	int - long --> long
            thisAsLong = new Sk.builtin.lng(this.v);
            result = thisAsLong.nb$multiply(other);
        }
        return result;
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$divide = function (other) {
    var thisAsLong;
    var result;

    if (typeof other === "number") {
        other = new Sk.builtin.nmber(other, undefined);
    }
    else if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.nmber) {
        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === Infinity) {
            if (other.v === Infinity || other.v === -Infinity) {
                return new Sk.builtin.nmber(NaN, Sk.builtin.nmber.float$);
            }
            else if (other.nb$isnegative()) {
                return new Sk.builtin.nmber(-Infinity, Sk.builtin.nmber.float$);
            }
            else {
                return new Sk.builtin.nmber(Infinity, Sk.builtin.nmber.float$);
            }
        }
        if (this.v === -Infinity) {
            if (other.v === Infinity || other.v === -Infinity) {
                return new Sk.builtin.nmber(NaN, Sk.builtin.nmber.float$);
            }
            else if (other.nb$isnegative()) {
                return new Sk.builtin.nmber(Infinity, Sk.builtin.nmber.float$);
            }
            else {
                return new Sk.builtin.nmber(-Infinity, Sk.builtin.nmber.float$);
            }
        }

        result = new Sk.builtin.nmber(this.v / other.v, undefined);
        if (this.skType === Sk.builtin.nmber.float$ || other.skType === Sk.builtin.nmber.float$ || Sk.python3) {
            result.skType = Sk.builtin.nmber.float$;
        }
        else {
            result.v = Math.floor(result.v);
            result.skType = Sk.builtin.nmber.int$;
            if (result.v > Sk.builtin.nmber.threshold$ || result.v < -Sk.builtin.nmber.threshold$) {
                //	Promote to long
                result = new Sk.builtin.lng(this.v).nb$divide(other.v);
            }
        }
        return result;
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === Infinity) {
            if (other.nb$isnegative()) {
                return new Sk.builtin.nmber(-Infinity, Sk.builtin.nmber.float$);
            }
            else {
                return new Sk.builtin.nmber(Infinity, Sk.builtin.nmber.float$);
            }
        }
        if (this.v === -Infinity) {
            if (other.nb$isnegative()) {
                return new Sk.builtin.nmber(Infinity, Sk.builtin.nmber.float$);
            }
            else {
                return new Sk.builtin.nmber(-Infinity, Sk.builtin.nmber.float$);
            }
        }

        if (this.skType === Sk.builtin.nmber.float$ || Sk.python3) {  // float / long --> float
            result = new Sk.builtin.nmber(this.v / parseFloat(other.str$(10, true)), Sk.builtin.nmber.float$);
        } else {	//	int - long --> long
            thisAsLong = new Sk.builtin.lng(this.v);
            result = thisAsLong.nb$divide(other);
        }
        return result;
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$floor_divide = function (other) {
    var thisAsLong;
    var result;

    if (typeof other === "number") {
        other = new Sk.builtin.nmber(other, undefined);
    }
    else if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (this.v === Infinity || this.v === -Infinity) {
        return new Sk.builtin.nmber(NaN, Sk.builtin.nmber.float$);
    }

    if (other instanceof Sk.builtin.nmber) {
        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (other.v === Infinity) {
            if (this.nb$isnegative()) {
                return new Sk.builtin.nmber(-1, Sk.builtin.nmber.float$);
            }
            else {
                return new Sk.builtin.nmber(0, Sk.builtin.nmber.float$);
            }
        }
        if (other.v === -Infinity) {
            if (this.nb$isnegative() || !this.nb$nonzero()) {
                return new Sk.builtin.nmber(0, Sk.builtin.nmber.float$);
            }
            else {
                return new Sk.builtin.nmber(-1, Sk.builtin.nmber.float$);
            }
        }

        result = new Sk.builtin.nmber(Math.floor(this.v / other.v), undefined);
        if (this.skType === Sk.builtin.nmber.float$ || other.skType === Sk.builtin.nmber.float$) {
            result.skType = Sk.builtin.nmber.float$;
        }
        else {
            result.v = Math.floor(result.v);
            result.skType = Sk.builtin.nmber.int$;
            if (result.v > Sk.builtin.nmber.threshold$ || result.v < -Sk.builtin.nmber.threshold$) {
                //	Promote to long
                result = new Sk.builtin.lng(this.v).nb$floor_divide(other.v);
            }
        }
        return result;
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }
        if (this.skType === Sk.builtin.nmber.float$) {  // float / long --> float
            result = Math.floor(this.v / parseFloat(other.str$(10, true)));
            result = new Sk.builtin.nmber(result, Sk.builtin.nmber.float$);
        } else {	//	int - long --> long
            thisAsLong = new Sk.builtin.lng(this.v);
            result = thisAsLong.nb$floor_divide(other);
        }
        return result;
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$remainder = function (other) {
    var thisAsLong;
    var op2;
    var tmp;
    var result;

    if (typeof other === "number") {
        other = new Sk.builtin.nmber(other, undefined);
    }
    else if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.nmber) {
        if (other.v === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === 0) {
            if (this.skType == Sk.builtin.nmber.float$ || other.skType == Sk.builtin.nmber.float$) {
                return new Sk.builtin.nmber(0, Sk.builtin.nmber.float$);
            }
            else {
                return new Sk.builtin.nmber(0, Sk.builtin.nmber.int$);
            }
        }

        if (other.v === Infinity) {
            if (this.v === Infinity || this.v === -Infinity) {
                return new Sk.builtin.nmber(NaN, Sk.builtin.nmber.float$);
            }
            else if (this.nb$ispositive()) {
                return new Sk.builtin.nmber(this.v, Sk.builtin.nmber.float$);
            }
            else {
                return new Sk.builtin.nmber(Infinity, Sk.builtin.nmber.float$);
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

        // <float> % <int|long|bool> --> zero must not have negative sign
        if (this.skType === Sk.builtin.nmber.float$ || other.skType === Sk.builtin.nmber.float$) {        
            result = new Sk.builtin.nmber(tmp, Sk.builtin.nmber.float$);
        } else {
            // <not float> % <not float> --> zero must not have negative sign
            tmp = tmp === 0 ? 0 : tmp; // transforms negative zero to positive one
            result = new Sk.builtin.nmber(tmp, Sk.builtin.nmber.int$);
            if (result.v > Sk.builtin.nmber.threshold$ || result.v < -Sk.builtin.nmber.threshold$) {
                //  Promote to long
                result = new Sk.builtin.lng(this.v).nb$remainder(other.v);
            }
        }
        return result;
    }

    if (other instanceof Sk.builtin.lng) {
        if (other.longCompare(Sk.builtin.biginteger.ZERO) === 0) {
            throw new Sk.builtin.ZeroDivisionError("integer division or modulo by zero");
        }

        if (this.v === 0) {
            if (this.skType === Sk.builtin.nmber.int$) {
                return new Sk.builtin.lng(0);
            }
            else {
                return new Sk.builtin.nmber(0, this.skType);
            }
        }

        if (this.skType === Sk.builtin.nmber.float$) {  // float / long --> float
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

            result = new Sk.builtin.nmber(tmp, Sk.builtin.nmber.float$);
        } else {    //  int - long --> long
            thisAsLong = new Sk.builtin.lng(this.v);
            result = thisAsLong.nb$remainder(other);
        }
        return result;
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$divmod = function (other) {
    var thisAsLong;
    var result;

    if (typeof other === "number") {
        other = new Sk.builtin.nmber(other, undefined);
    }
    else if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.nmber || other instanceof Sk.builtin.lng) {
        return new Sk.builtin.tuple([
            this.nb$floor_divide(other),
            this.nb$remainder(other)
        ]);
    }

    return undefined;

};

Sk.builtin.nmber.prototype.nb$power = function (other) {
    var thisAsLong;
    var result;

    if (typeof other === "number") {
        other = new Sk.builtin.nmber(other, undefined);
    }
    else if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.bool) {
        other = new Sk.builtin.nmber(Sk.builtin.asnum$(other), undefined);
    }

    if (other instanceof Sk.builtin.nmber) {
        if (this.v < 0 && other.v % 1 !== 0) {
            throw new Sk.builtin.NegativePowerError("cannot raise a negative number to a fractional power");
        }
        if (this.v === 0 && other.v < 0) {
            throw new Sk.builtin.NegativePowerError("cannot raise zero to a negative power");
        }

        result = new Sk.builtin.nmber(Math.pow(this.v, other.v), undefined);
        if (this.skType === Sk.builtin.nmber.float$ || other.skType === Sk.builtin.nmber.float$ || other.v < 0) {
            result.skType = Sk.builtin.nmber.float$;
        }
        else {
            result.v = Math.floor(result.v);
            result.skType = Sk.builtin.nmber.int$;
            if (result.v > Sk.builtin.nmber.threshold$ || result.v < -Sk.builtin.nmber.threshold$) {
                //	Promote to long
                result = new Sk.builtin.lng(this.v).nb$power(other.v);
            }
        }
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
        if (this.skType === Sk.builtin.nmber.float$ || other.nb$isnegative()) {  // float / long --> float
            result = new Sk.builtin.nmber(Math.pow(this.v, parseFloat(other.str$(10, true))), Sk.builtin.nmber.float$);
        } else {	//	int - long --> long
            thisAsLong = new Sk.builtin.lng(this.v);
            result = thisAsLong.nb$power(other);
        }
        return result;
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$and = function (other) {
    var tmp;
    other = Sk.builtin.asnum$(other);
    tmp = this.v & other;
    if ((tmp !== undefined) && (tmp < 0)) {
        tmp = tmp + 4294967296; // convert back to unsigned
    }

    if (tmp !== undefined) {
        return new Sk.builtin.nmber(tmp, undefined);
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$or = function (other) {
    var tmp;
    other = Sk.builtin.asnum$(other);
    tmp = this.v | other;
    if ((tmp !== undefined) && (tmp < 0)) {
        tmp = tmp + 4294967296; // convert back to unsigned
    }

    if (tmp !== undefined) {
        return new Sk.builtin.nmber(tmp, undefined);
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$xor = function (other) {
    var tmp;
    other = Sk.builtin.asnum$(other);
    tmp = this.v ^ other;
    if ((tmp !== undefined) && (tmp < 0)) {
        tmp = tmp + 4294967296; // convert back to unsigned
    }

    if (tmp !== undefined) {
        return new Sk.builtin.nmber(tmp, undefined);
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$lshift = function (other) {
    var tmp;
    var shift = Sk.builtin.asnum$(other);

    if (shift !== undefined) {
        if (shift < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        tmp = this.v << shift;
        if (tmp <= this.v) {
            // Fail, recompute with longs
            return Sk.builtin.lng.fromInt$(this.v).nb$lshift(shift);
        }
    }

    if (tmp !== undefined) {
        return new Sk.builtin.nmber(tmp, this.skType);
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$rshift = function (other) {
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
        return new Sk.builtin.nmber(tmp, this.skType);
    }

    return undefined;
};

Sk.builtin.nmber.prototype.nb$inplace_add = Sk.builtin.nmber.prototype.nb$add;

Sk.builtin.nmber.prototype.nb$inplace_subtract = Sk.builtin.nmber.prototype.nb$subtract;

Sk.builtin.nmber.prototype.nb$inplace_multiply = Sk.builtin.nmber.prototype.nb$multiply;

Sk.builtin.nmber.prototype.nb$inplace_divide = Sk.builtin.nmber.prototype.nb$divide;

Sk.builtin.nmber.prototype.nb$inplace_remainder = Sk.builtin.nmber.prototype.nb$remainder;

Sk.builtin.nmber.prototype.nb$inplace_floor_divide = Sk.builtin.nmber.prototype.nb$floor_divide;

Sk.builtin.nmber.prototype.nb$inplace_power = Sk.builtin.nmber.prototype.nb$power;

Sk.builtin.nmber.prototype.nb$inplace_and = Sk.builtin.nmber.prototype.nb$and;

Sk.builtin.nmber.prototype.nb$inplace_or = Sk.builtin.nmber.prototype.nb$or;

Sk.builtin.nmber.prototype.nb$inplace_xor = Sk.builtin.nmber.prototype.nb$xor;

Sk.builtin.nmber.prototype.nb$inplace_lshift = Sk.builtin.nmber.prototype.nb$lshift;

Sk.builtin.nmber.prototype.nb$inplace_rshift = Sk.builtin.nmber.prototype.nb$rshift;

Sk.builtin.nmber.prototype.nb$negative = function () {
    return new Sk.builtin.nmber(-this.v, undefined);
};

Sk.builtin.nmber.prototype.nb$positive = function () {
    return this.clone();
};

Sk.builtin.nmber.prototype.nb$nonzero = function () {
    return this.v !== 0;
};

Sk.builtin.nmber.prototype.nb$isnegative = function () {
    return this.v < 0;
};

Sk.builtin.nmber.prototype.nb$ispositive = function () {
    return this.v >= 0;
};

Sk.builtin.nmber.prototype.numberCompare = function (other) {
    var diff;
    var tmp;
    var thisAsLong;
    if (other instanceof Sk.builtin.bool) {
        other = Sk.builtin.asnum$(other);
    }

    if (other instanceof Sk.builtin.none) {
        other = 0;
    }

    if (typeof other === "number") {
        return this.v - other;
    }

    if (other instanceof Sk.builtin.nmber) {
        if (this.v == Infinity && other.v == Infinity) {
            return 0;
        }
        if (this.v == -Infinity && other.v == -Infinity) {
            return 0;
        }
        return this.v - other.v;
    }

    if (other instanceof Sk.builtin.lng) {
        if (this.skType === Sk.builtin.nmber.int$ || this.v % 1 === 0) {
            thisAsLong = new Sk.builtin.lng(this.v);
            tmp = thisAsLong.longCompare(other);
            return tmp;
        }
        diff = this.nb$subtract(other);
        if (diff instanceof Sk.builtin.nmber) {
            return diff.v;
        } else if (diff instanceof Sk.builtin.lng) {
            return diff.longCompare(Sk.builtin.biginteger.ZERO);
        }
    }

    return undefined;
};

// Despite what jshint may want us to do, these two  functions need to remain
// as == and !=  Unless you modify the logic of numberCompare do not change
// these.
Sk.builtin.nmber.prototype.__eq__ = function (me, other) {
    return (me.numberCompare(other) == 0) && !(other instanceof Sk.builtin.none); //jshint ignore:line
};

Sk.builtin.nmber.prototype.__ne__ = function (me, other) {
    return (me.numberCompare(other) != 0) || (other instanceof Sk.builtin.none); //jshint ignore:line
};

Sk.builtin.nmber.prototype.__lt__ = function (me, other) {
    return me.numberCompare(other) < 0;
};

Sk.builtin.nmber.prototype.__le__ = function (me, other) {
    return me.numberCompare(other) <= 0;
};

Sk.builtin.nmber.prototype.__gt__ = function (me, other) {
    return me.numberCompare(other) > 0;
};

Sk.builtin.nmber.prototype.__ge__ = function (me, other) {
    return me.numberCompare(other) >= 0;
};

Sk.builtin.nmber.prototype.__round__ = function (self, ndigits) {
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

    return new Sk.builtin.nmber(result, Sk.builtin.nmber.float$);
};

Sk.builtin.nmber.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;

Sk.builtin.nmber.prototype["$r"] = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

Sk.builtin.nmber.prototype.tp$str = function () {
    return new Sk.builtin.str(this.str$(10, true));
};

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
Sk.builtin.nmber.PyOS_double_to_string = function(val, format_code, precision, flags, type) {
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
        t = Sk.builtin.nmber.PyOS_double_to_string.Py_DTST_NAN;
    } else if (val === Infinity) {
        buf = "inf";
        t = Sk.builtin.nmber.PyOS_double_to_string.Py_DTST_INFINITE;
    } else if (val === -Infinity) {
        buf = "-inf";
        t = Sk.builtin.nmber.PyOS_double_to_string.Py_DTST_INFINITE;       
    } else {
        t = Sk.builtin.nmber.PyOS_double_to_string.Py_DTST_FINITE;
        if(flags & Sk.builtin.nmber.PyOS_double_to_string.Py_DTSF_ADD_DOT_0) {
            format_code = "g"; // "Z"; _PyOS_ascii_formatd converts "Z" to "g"
        }

        // ToDo: call snprintf here
        // ToDo: call ascii_formatd
        var format_str = "%";
        format_str += flags & Sk.builtin.nmber.PyOS_double_to_string.Py_DTSF_ALT ? "#" : "";
        
        if(precision != null) {
            format_str += ".";
            format_str += precision;
        }

        format_str += format_code;
        format_str = new Sk.builtin.str(format_str);

        /** 
         * We cann call nb$remainder with val, because it gets unwrapped and it doesn't matter if it is
         * already a javascript number. If we do not pass a float, we can't distinguish between ints and floats
         * and therefore we can't adjust the sign of the zero accordingly
         */
        buf = format_str.nb$remainder(new Sk.builtin.nmber(val, Sk.builtin.nmber.float$));
        buf = buf.v; // get javascript string
    }

    /**
     * Add sign when requested. It's convenient (esp. when formatting complex numbers) to
     * include sign even for inf and nan.
     */
    if(flags & Sk.builtin.nmber.PyOS_double_to_string.Py_DTSF_SIGN && buf[0] !== "-") {
        buf = "+" + buf;
    }

    if(upper) {
        // Convert to upper case
        buf = buf.toUpperCase();
    }

    return buf;
};

/* PyOS_double_to_string's "flags" parameter can be set to 0 or more of: */
Sk.builtin.nmber.PyOS_double_to_string.Py_DTSF_SIGN = 0x01; // always add the sign
Sk.builtin.nmber.PyOS_double_to_string.Py_DTSF_ADD_DOT_0 = 0x02; // if the result is an integer add ".0"
Sk.builtin.nmber.PyOS_double_to_string.Py_DTSF_ALT = 0x04; // "alternate" formatting. it's format_code specific

/* PyOS_double_to_string's "type", if non-NULL, will be set to one of: */
Sk.builtin.nmber.PyOS_double_to_string.Py_DTST_FINITE = 0; 
Sk.builtin.nmber.PyOS_double_to_string.Py_DTST_INFINITE = 1; 
Sk.builtin.nmber.PyOS_double_to_string.Py_DTST_NAN = 2; 

Sk.builtin.nmber.prototype.str$ = function (base, sign) {
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
        if (this.skType == Sk.builtin.nmber.float$) {
            tmp = work.toPrecision(12);

            // transform fractions with 4 or more leading zeroes into exponents
            idx = tmp.indexOf(".");
            pre = work.toString().slice(0, idx);
            post = work.toString().slice(idx);

            if (pre.match(/^-?0$/) && post.slice(1).match(/^0{4,}/)) {
                if (tmp.length < 12) {
                    tmp = work.toExponential();
                }
                else {
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
            tmp = work.toString();
        }
    } else {
        tmp = work.toString(base);
    }

    if (this.skType !== Sk.builtin.nmber.float$) {
        return tmp;
    }

    // restore negative zero sign, only applies to floats
    if(this.v === 0 && 1/this.v === -Infinity) {
        tmp = "-" + tmp;
    }

    if (tmp.indexOf(".") < 0 && tmp.indexOf("E") < 0 && tmp.indexOf("e") < 0) {
        tmp = tmp + ".0";
    }
    return tmp;
};

goog.exportSymbol("Sk.builtin.nmber", Sk.builtin.nmber);
