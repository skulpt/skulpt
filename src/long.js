// long aka "bignumber" implementation
//
//  Using javascript BigInteger by Tom Wu
/**
 * @constructor
 * @param {*} x
 * @param {number=} base
 */
Sk.builtin.lng = function(x, base)	/* long is a reserved word */
{
    base = Sk.builtin.asnum$(base);
    if (!(this instanceof Sk.builtin.lng)) return new Sk.builtin.lng(x, base);

    if (x === undefined)
	this.biginteger = new Sk.builtin.biginteger(0);
    else if (x instanceof Sk.builtin.lng)
	this.biginteger = x.biginteger.clone();
    else if (x instanceof Sk.builtin.biginteger)
	this.biginteger = x;
    else if (x instanceof String)
	return Sk.longFromStr(x, base);
    else if (x instanceof Sk.builtin.str)
	return Sk.longFromStr(x.v, base);
    else {
	if ((x !== undefined) && (!Sk.builtin.checkString(x)
			      && !Sk.builtin.checkNumber(x)))
	{
	    if (x === true)
		x = 1;
	    else if (x === false)
		x = 0;
	    else
		throw new Sk.builtin.TypeError("long() argument must be a string or a number, not '" + Sk.abstr.typeName(x) + "'");
	}

	x = Sk.builtin.asnum$nofloat(x);
	this.biginteger = new Sk.builtin.biginteger(x);
    }

    return this;
};

Sk.builtin.lng.prototype.tp$index = function()
{
    return parseInt(this.str$(10, true), 10);
};

Sk.builtin.lng.prototype.tp$hash = function()
{
    return new Sk.builtin.nmber(this.tp$index(), Sk.builtin.nmber.int$);
};

Sk.builtin.lng.prototype.tp$name = "long";
Sk.builtin.lng.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('long', Sk.builtin.lng);

//	Threshold to determine when types should be converted to long
Sk.builtin.lng.threshold$ = Math.pow(2, 53);

Sk.builtin.lng.MAX_INT$ = new Sk.builtin.lng(Sk.builtin.lng.threshold$);
Sk.builtin.lng.MIN_INT$ = new Sk.builtin.lng(-Sk.builtin.lng.threshold$);

//Sk.builtin.lng.LONG_DIVIDE$ = 0;
//Sk.builtin.lng.FLOAT_DIVIDE$ = -1;
//Sk.builtin.lng.VARIABLE_DIVIDE$ = -2;
//// Positive values reserved for scaled, fixed precision big number implementations where mode = number of digits to the right of the decimal
//Sk.builtin.lng.dividemode$ = Sk.builtin.lng.LONG_DIVIDE$;

Sk.builtin.lng.prototype.cantBeInt = function() {
	return (this.longCompare(Sk.builtin.lng.MAX_INT$) > 0) || (this.longCompare(Sk.builtin.lng.MIN_INT$) < 0);
}

//Sk.builtin.lng.longDivideMode = function(m) 
//{
//	if (m) {
//		if (m instanceof Sk.builtin.str) {
//			if (m.v == 'float') m = Sk.builtin.lng.FLOAT_DIVIDE$;
//			else if (m.v == 'long')  m = Sk.builtin.lng.LONG_DIVIDE$;
//			else if (m.v == 'variable') m = Sk.builtin.lng.VARIABLE_DIVIDE$;
//			else goog.asserts.assert(true, "Invalid long division mode.");
//		}
//		Sk.builtin.lng.dividemode$ = m;
//	}
//	if (Sk.builtin.lng.dividemode$ == Sk.builtin.lng.FLOAT_DIVIDE$)
//		return new Sk.builtin.str('float');
//	if (Sk.builtin.lng.dividemode$ == Sk.builtin.lng.VARIABLE_DIVIDE$)
//		return new Sk.builtin.str('variable');
//	return new Sk.builtin.str('long'); 
//};

Sk.builtin.lng.fromInt$ = function(ival) 
{
	return new Sk.builtin.lng(ival);
};

// js string (not Sk.builtin.str) -> long. used to create longs in transformer, respects
// 0x, 0o, 0b, etc.
Sk.longFromStr = function(s, base)
{
    // l/L are valid digits with base >= 22
    // goog.asserts.assert(s.charAt(s.length - 1) !== "L" && s.charAt(s.length - 1) !== 'l', "L suffix should be removed before here");

    var parser = function (s, base) {
        if (base == 10)
            return new Sk.builtin.biginteger(s);
        else
            return new Sk.builtin.biginteger(s, base);
    };

    var biginteger = Sk.str2number(s, base, parser, function(x){return x.negate();}, "long");

    return new Sk.builtin.lng(biginteger);
};
goog.exportSymbol("Sk.longFromStr", Sk.longFromStr);

Sk.builtin.lng.prototype.toInt$ = function()
{
    return this.biginteger.intValue();
};

Sk.builtin.lng.prototype.clone = function()
{
	return new Sk.builtin.lng(this);
};

Sk.builtin.lng.prototype.nb$add = function(other)
{
	if (other instanceof Sk.builtin.bool) {
		other = new Sk.builtin.lng(Sk.builtin.asnum$(other));
	}

	if (other instanceof Sk.builtin.nmber) {
		if (other.skType === Sk.builtin.nmber.float$) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$add(other);
		} else {
			//	Promote an int to long
			other = new Sk.builtin.lng(other.v);
		}
	}

	if (other instanceof Sk.builtin.lng) {
		return new Sk.builtin.lng(this.biginteger.add(other.biginteger));
	}

	if (other instanceof Sk.builtin.biginteger) {
		return new Sk.builtin.lng(this.biginteger.add(other));
	}

	return new Sk.builtin.lng(this.biginteger.add(new Sk.builtin.biginteger(other)));
};

Sk.builtin.lng.prototype.nb$inplace_add = Sk.builtin.lng.prototype.nb$add;

Sk.builtin.lng.prototype.nb$subtract = function(other)
{
	if (other instanceof Sk.builtin.bool) {
		other = new Sk.builtin.lng(Sk.builtin.asnum$(other));
	}

	if (other instanceof Sk.builtin.nmber) {
		if (other.skType === Sk.builtin.nmber.float$) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$subtract(other);
		} else {
			//	Promote an int to long
			other = new Sk.builtin.lng(other.v);
		}
	}

	if (other instanceof Sk.builtin.lng) {
		return new Sk.builtin.lng(this.biginteger.subtract(other.biginteger));
	}

	if (other instanceof Sk.builtin.biginteger) {
		return new Sk.builtin.lng(this.biginteger.subtract(other));
	}

	return new Sk.builtin.lng(this.biginteger.subtract(new Sk.builtin.biginteger(other)));
};

Sk.builtin.lng.prototype.nb$inplace_subtract = Sk.builtin.lng.prototype.nb$subtract;

Sk.builtin.lng.prototype.nb$multiply = function(other)
{
	if (other instanceof Sk.builtin.bool) {
		other = new Sk.builtin.lng(Sk.builtin.asnum$(other));
	}

	if (other instanceof Sk.builtin.nmber) {
		if (other.skType === Sk.builtin.nmber.float$) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$multiply(other);
		} else {
			//	Promote an int to long
			other = new Sk.builtin.lng(other.v);
		}
	}

	if (other instanceof Sk.builtin.lng) {
		return new Sk.builtin.lng(this.biginteger.multiply(other.biginteger));
	}

	if (other instanceof Sk.builtin.biginteger) {
		return new Sk.builtin.lng(this.biginteger.multiply(other));
	}

	return new Sk.builtin.lng(this.biginteger.multiply(new Sk.builtin.biginteger(other)));
};

Sk.builtin.lng.prototype.nb$inplace_multiply = Sk.builtin.lng.prototype.nb$multiply;

Sk.builtin.lng.prototype.nb$divide = function(other)
{
	if (other instanceof Sk.builtin.bool) {
		other = new Sk.builtin.lng(Sk.builtin.asnum$(other));
	}

	if (other instanceof Sk.builtin.nmber) {
		if (other.skType === Sk.builtin.nmber.float$) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$divide(other);
		} else {
			//	Promote an int to long
			other = new Sk.builtin.lng(other.v);
		}
	}

	var result;
//	if (Sk.builtin.lng.dividemode$ == Sk.builtin.lng.FLOAT_DIVIDE$ || Sk.builtin.lng.dividemode$ == Sk.builtin.lng.VARIABLE_DIVIDE$) {
//		if (other instanceof Sk.builtin.lng) {
//			result = this.biginteger.divideAndRemainder(other.biginteger);
//		} else if (other instanceof Sk.builtin.biginteger) {
//			result = this.biginteger.divideAndRemainder(other);
//		} else {
//			result = this.biginteger.divideAndRemainder(new Sk.builtin.biginteger(other));
//		}
//
//		//	result = Array of quotient [0], remainder [1]
//
//		if (result [1].compare(Sk.builtin.biginteger.ZERO) != 0) {
//			//	Non-zero remainder -- this will be a float no matter what
//			return parseFloat(this.biginteger.toString()) / parseFloat(other.biginteger.toString());
//		} else {
//			//	No remainder
//			if (Sk.builtin.lng.dividemode$ == Sk.builtin.lng.FLOAT_DIVIDE$)
//				return parseFloat(result [0].toString());		//	Float option with no remainder, return quotient as float
//			else
//				return new Sk.builtin.lng(result [0]);			//	Variable option with no remainder, return new long from quotient
//		}
//	}

//	Standard, long result mode

	if (! (other instanceof Sk.builtin.lng) ) {
		other = new Sk.builtin.lng(other);
	}

	//	Special logic to round DOWN towards negative infinity for negative results
	var thisneg = this.nb$isnegative();
	var otherneg = other.nb$isnegative();
	if ((thisneg && !otherneg) || (otherneg && !thisneg)) {
		result = this.biginteger.divideAndRemainder(other.biginteger);
		//	If remainder is zero or positive, just return division result
		if (result[1].trueCompare(Sk.builtin.biginteger.ZERO) == 0) {
			//	No remainder, just return result
			return new Sk.builtin.lng(result[0]);
		} else {
			//	Reminder... subtract 1 from the result (like rounding to neg infinity)
			result = result[0].subtract(Sk.builtin.biginteger.ONE);
			return new Sk.builtin.lng(result);
		}
	} else {
		return new Sk.builtin.lng(this.biginteger.divide(other.biginteger));
	}
};

Sk.builtin.lng.prototype.nb$inplace_divide = Sk.builtin.lng.prototype.nb$divide;

Sk.builtin.lng.prototype.nb$floor_divide = function(other)
{
	if (other instanceof Sk.builtin.bool) {
		other = new Sk.builtin.lng(Sk.builtin.asnum$(other));
	}

	if (other instanceof Sk.builtin.nmber) {
		if (other.skType === Sk.builtin.nmber.float$) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$floor_divide(other);
		}
	}

	return this.nb$divide(other);
};

Sk.builtin.lng.prototype.nb$inplace_floor_divide = Sk.builtin.lng.prototype.nb$floor_divide;

Sk.builtin.lng.prototype.nb$remainder = function(other)
{
	if (other instanceof Sk.builtin.bool) {
		other = new Sk.builtin.lng(Sk.builtin.asnum$(other));
	}

	if (this.biginteger.trueCompare(Sk.builtin.biginteger.ZERO) === 0)
		if (other instanceof Sk.builtin.nmber && other.skType === Sk.builtin.nmber.float$)
			return new Sk.builtin.nmber(0, Sk.builtin.nmber.float$);
		else
			return new Sk.builtin.lng(0);

	if (other instanceof Sk.builtin.nmber) {
		if (other.skType === Sk.builtin.nmber.float$) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$remainder(other);
		} else {
			//	Promote an int to long
			other = new Sk.builtin.lng(other.v);
		}
	}

	if (! (other instanceof Sk.builtin.lng) ) {
		other = new Sk.builtin.lng(other);
	}

	var tmp = new Sk.builtin.lng(this.biginteger.remainder(other.biginteger));
	if (this.nb$isnegative()) {
		if (other.nb$ispositive() && tmp.nb$nonzero())
			tmp = tmp.nb$add(other).nb$remainder(other);
	} else {
		if (other.nb$isnegative() && tmp.nb$nonzero())
			tmp = tmp.nb$add(other);
	}
	return tmp;

};

Sk.builtin.lng.prototype.nb$inplace_remainder = Sk.builtin.lng.prototype.nb$remainder;

/**
 * @param {number|Object} n
 * @param {number|Object=} mod
 * @suppress {checkTypes}
 */
Sk.builtin.lng.prototype.nb$power = function(n, mod)
{
    if (mod !== undefined)
    {
	n = new Sk.builtin.biginteger(Sk.builtin.asnum$(n));
	mod = new Sk.builtin.biginteger(Sk.builtin.asnum$(mod));

	return new Sk.builtin.lng(this.biginteger.modPowInt(n, mod));
    }
	if (typeof n === "number") {
		if (n < 0) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$power(n);
		} else
			return new Sk.builtin.lng(this.biginteger.pow(new Sk.builtin.biginteger(n)));
	}

	if (n instanceof Sk.builtin.bool) {
	    return new Sk.builtin.lng(this.biginteger.pow(new Sk.builtin.biginteger(Sk.builtin.asnum$(n))));
	}

	if (n instanceof Sk.builtin.nmber) {
		if (n.skType === Sk.builtin.nmber.float$ || n.v < 0) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$power(n);
		} else {
			//	Promote an int to long
			n = new Sk.builtin.lng(n.v);
		}
	}

	if (n instanceof Sk.builtin.lng) {
		if (n.nb$isnegative()) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$power(n);
		} else
			return new Sk.builtin.lng(this.biginteger.pow(n.biginteger));
	}

	if (n instanceof Sk.builtin.biginteger) {
		if (n.isnegative()) {
			var thisAsFloat = new Sk.builtin.nmber(this.str$(10, true), Sk.builtin.nmber.float$);
			return thisAsFloat.nb$power(n);
		}
		return new Sk.builtin.lng(this.biginteger.pow(n));
	}

	return new Sk.builtin.lng(this.biginteger.pow(new Sk.builtin.biginteger(n)));
};

Sk.builtin.lng.prototype.nb$inplace_power = Sk.builtin.lng.prototype.nb$power;

Sk.builtin.lng.prototype.nb$lshift = function(other)
{
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
    
    if (other < 0) {
	throw new Sk.builtin.ValueError("negative shift count");
    }
    other = Sk.builtin.asnum$(other);
    return new Sk.builtin.lng(this.biginteger.shiftLeft(new Sk.builtin.biginteger(other)));
}

Sk.builtin.lng.prototype.nb$inplace_lshift = Sk.builtin.lng.prototype.nb$lshift;

Sk.builtin.lng.prototype.nb$rshift = function(other)
{
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
    
    if (other < 0) {
	throw new Sk.builtin.ValueError("negative shift count");
    }
    other = Sk.builtin.asnum$(other);
    return new Sk.builtin.lng(this.biginteger.shiftRight(new Sk.builtin.biginteger(other)));
}

Sk.builtin.lng.prototype.nb$inplace_rshift = Sk.builtin.lng.prototype.nb$rshift;

Sk.builtin.lng.prototype.nb$and = function(other)
{
    if (other instanceof Sk.builtin.lng) {
	return new Sk.builtin.lng(this.biginteger.and(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
	return new Sk.builtin.lng(this.biginteger.and(other));
    }
    
    other = Sk.builtin.asnum$(other);
    return new Sk.builtin.lng(this.biginteger.and(new Sk.builtin.biginteger(other)));
}

Sk.builtin.lng.prototype.nb$inplace_and = Sk.builtin.lng.prototype.nb$and;

Sk.builtin.lng.prototype.nb$or = function(other)
{
    if (other instanceof Sk.builtin.lng) {
	return new Sk.builtin.lng(this.biginteger.or(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
	return new Sk.builtin.lng(this.biginteger.or(other));
    }
    
    other = Sk.builtin.asnum$(other);
    return new Sk.builtin.lng(this.biginteger.or(new Sk.builtin.biginteger(other)));
}

Sk.builtin.lng.prototype.nb$inplace_or = Sk.builtin.lng.prototype.nb$or;

Sk.builtin.lng.prototype.nb$xor = function(other)
{
    if (other instanceof Sk.builtin.lng) {
	return new Sk.builtin.lng(this.biginteger.xor(other.biginteger));
    }
    if (other instanceof Sk.builtin.biginteger) {
	return new Sk.builtin.lng(this.biginteger.xor(other));
    }
    
    other = Sk.builtin.asnum$(other);
    return new Sk.builtin.lng(this.biginteger.xor(new Sk.builtin.biginteger(other)));
}

Sk.builtin.lng.prototype.nb$inplace_xor = Sk.builtin.lng.prototype.nb$xor;

Sk.builtin.lng.prototype.nb$negative = function()
{
	return new Sk.builtin.lng(this.biginteger.negate());
};

Sk.builtin.lng.prototype.nb$positive = function() { return this.clone(); };

Sk.builtin.lng.prototype.nb$nonzero = function()
{
	return this.biginteger.trueCompare(Sk.builtin.biginteger.ZERO) !== 0;
};

Sk.builtin.lng.prototype.nb$isnegative = function()
{
	return this.biginteger.isnegative();
	//return this.biginteger.trueCompare(Sk.builtin.biginteger.ZERO) < 0;
};

Sk.builtin.lng.prototype.nb$ispositive = function()
{
	return ! this.biginteger.isnegative();
	//return this.biginteger.trueCompare(Sk.builtin.biginteger.ZERO) >= 0;
};

Sk.builtin.lng.prototype.longCompare = function(other)
{
	if (typeof other === "boolean")
		if (other)
			other = 1;
		else
			other = 0;

	var tmp;

	if (typeof other === "number") {
		other = new Sk.builtin.lng(other);
	}

	if (other instanceof Sk.builtin.nmber) {
		if (other.skType === Sk.builtin.nmber.int$ || other.v % 1 == 0) {
			var otherAsLong = new Sk.builtin.lng(other.v);
			return this.longCompare(otherAsLong);
		} else {
			var thisAsFloat = new Sk.builtin.nmber(this, Sk.builtin.nmber.float$);
			return thisAsFloat.numberCompare(other);
		}
	}

	else if (other instanceof Sk.builtin.lng) {
//		tmp = this.biginteger.trueCompare(other.biginteger);
		tmp = this.biginteger.subtract(other.biginteger);
	}

	else if (other instanceof Sk.builtin.biginteger) {
//		tmp = this.biginteger.trueCompare(other);
		tmp = this.biginteger.subtract(other);
	}

	else {
//		tmp = this.biginteger.trueCompare(new Sk.builtin.biginteger(other));
		tmp = this.biginteger.subtract(new Sk.builtin.biginteger(other));
	}

	return tmp;
}

Sk.builtin.lng.prototype.__eq__ = function(me, other) {
	return me.longCompare(other) == 0 && !(other instanceof Sk.builtin.none);
};

Sk.builtin.lng.prototype.__ne__ = function(me, other) {
	return me.longCompare(other) != 0 || (other instanceof Sk.builtin.none);
};

Sk.builtin.lng.prototype.__lt__ = function(me, other) {
	return me.longCompare(other) < 0;
};

Sk.builtin.lng.prototype.__le__ = function(me, other) {
	return me.longCompare(other) <= 0;
};

Sk.builtin.lng.prototype.__gt__ = function(me, other) {
	return me.longCompare(other) > 0;
};

Sk.builtin.lng.prototype.__ge__ = function(me, other) {
	return me.longCompare(other) >= 0;
};

Sk.builtin.lng.prototype['$r'] = function()
{
    return new Sk.builtin.str(this.str$(10, true) + "L");
};

Sk.builtin.lng.prototype.tp$str = function()
{
    return new Sk.builtin.str(this.str$(10, true));
};

Sk.builtin.lng.prototype.str$ = function(base, sign)
{
	if (sign === undefined) sign = true;

	var work = sign ? this.biginteger : this.biginteger.abs();

	if (base === undefined || base === 10) {
		return work.toString();
	}

	//	Another base... convert...
	return work.toString(base);
};
