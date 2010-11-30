// long aka "bigint" implementation
//
// the representation used is similar to python 2.6's:
//
// - each 'digit' of the long is 15 bits, which gives enough space in each to
// perform a multiplication without losing precision in the mantissa of
// javascript's number representation (a double).
//
// - the numbers are stored as the absolute value of the number, with an
// additional size field that's the number of digits in the long. if size < 0,
// the number is negative, and it's 0 if the long is 0.
//
// some of the implementation is also ported from longobject.c in python2.6.
//
// it's better not to think about how many processor-level instructions this
// is causing!

/**
 * @constructor
 * @param {number} $size number of digits
 */
Sk.builtin.lng = function(x, $size) /* long is a reserved word */
{
    if (x)
    {
        return Sk.builtin.lng.fromInt$(x);
    }

    if (!(this instanceof Sk.builtin.lng)) return new Sk.builtin.lng(x, $size);

    this.digit$ = new Array(Math.abs($size));
    this.size$ = $size;
    return this;
};

Sk.builtin.lng.tp$index = function()
{
    goog.asserts.fail("todo;");
};

Sk.builtin.lng.prototype.tp$name = "long";
Sk.builtin.lng.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('long', Sk.builtin.lng);

Sk.builtin.lng.SHIFT$ = 15;
Sk.builtin.lng.BASE$ = 1 << Sk.builtin.lng.SHIFT$;
Sk.builtin.lng.MASK$ = Sk.builtin.lng.BASE$ - 1;
Sk.builtin.lng.threshold$ = Math.pow(2, 30);

Sk.builtin.lng.fromInt$ = function(ival)
{
    var negative = false;
    if (ival < 0)
    {
        ival = -ival;
        negative = true;
    }

    var t = ival;
    var ndigits = 0;
    while (t)
    {
        ndigits += 1;
        t >>= Sk.builtin.lng.SHIFT$;
    }

    var ret = new Sk.builtin.lng(undefined, ndigits);
    if (negative) ret.size$ = -ret.size$;
    t = ival;
    var i = 0;
    while (t)
    {
        ret.digit$[i] = t & Sk.builtin.lng.MASK$;
        t >>= Sk.builtin.lng.SHIFT$;
        i += 1;
    }

    return ret;
};


// mul by single digit, ignoring sign
Sk.builtin.lng.mulInt$ = function(a, n)
{
    var size_a = Math.abs(a.size$);
    var z = new Sk.builtin.lng(undefined, size_a + 1);
    var carry = 0;
    var i;

    for (i = 0; i < size_a; ++i)
    {
        carry += a.digit$[i] * n;
        z.digit$[i] = carry & Sk.builtin.lng.MASK$;
        carry >>= Sk.builtin.lng.SHIFT$;
    }
    z.digit$[i] = carry;
    return Sk.builtin.lng.normalize$(z);
};

// js string (not Sk.builtin.str) -> long. used to create longs in transformer, respects
// 0x, 0o, 0b, etc.
Sk.longFromStr = function(s)
{
    goog.asserts.assert(s.charAt(s.length - 1) !== "L" && s.charAt(s.length - 1) !== 'l', "L suffix should be removed before here");

    //print("initial fromJsStr:",s);
    var neg = false;
    if (s.substr(0, 1) === "-")
    {
        s = s.substr(1);
        neg = true;
    }
    var base = 10;
    if (s.substr(0, 2) === "0x" || s.substr(0, 2) === "0X")
    {
        s = s.substr(2);
        base = 16;
    }
    else if (s.substr(0, 2) === "0o")
    {
        s = s.substr(2);
        base = 8;
    }
    else if (s.substr(0, 1) === "0")
    {
        s = s.substr(1);
        base = 8;
    }
    else if (s.substr(0, 2) === "0b")
    {
        s = s.substr(2);
        base = 2;
    }
    //print("base:",base, "rest:",s);
    var ret = Sk.builtin.lng.fromInt$(0);
    var col = Sk.builtin.lng.fromInt$(1);
    var add;
    for (var i = s.length - 1; i >= 0; --i)
    {
        add = Sk.builtin.lng.mulInt$(col, parseInt(s.substr(i, 1), 16));
        ret = ret.nb$add(add);
        col = Sk.builtin.lng.mulInt$(col, base);
        //print("i", i, "ret", ret.digit$, ret.size$, "col", col.digit$, col.size$, ":",s.substr(i, 1), ":",parseInt(s.substr(i, 1), 10));
    }
    if (neg) ret.size$ = -ret.size$;
    return ret;
};
goog.exportSymbol("Sk.longFromStr", Sk.longFromStr);

Sk.builtin.lng.prototype.clone = function()
{
    var ret = new Sk.builtin.lng(undefined, this.size$);
    ret.digit$ = this.digit$.slice(0);
    return ret;
};

Sk.builtin.lng.prototype.nb$add = function(other)
{
    // todo; upconvert other to long

    var z;
    if (this.size$ < 0)
    {
        if (other.size$ < 0)
        {
            z = Sk.builtin.lng.add$(this, other);
            z.size$ = -z.size$;
        }
        else
        {
            z = Sk.builtin.lng.sub$(other, this);
        }
    }
    else
    {
        if (other.size$ < 0)
            z = Sk.builtin.lng.sub$(this, other);
        else
            z = Sk.builtin.lng.add$(this, other);
    }
    return z;
};

Sk.builtin.lng.prototype.nb$inplace_add = Sk.builtin.lng.prototype.nb$add;

Sk.builtin.lng.prototype.nb$subtract = function(other)
{
    // todo; upconvert other

    var z;
    if (this.size$ < 0)
    {
        if (other.size$ < 0)
            z = Sk.builtin.lng.sub$(this, other);
        else
            z = Sk.builtin.lng.add$(this, other);
        z.size$ = -z.size$;
    }
    else
    {
        if (other.size < 0)
            z = Sk.builtin.lng.add$(this, other);
        else
            z = Sk.builtin.lng.sub$(this, other);
    }
    return z;
};

Sk.builtin.lng.prototype.nb$multiply = function(other)
{
    // todo; upconvert
    var z = Sk.builtin.lng.mul$(this, other);
	if (this.size$ * other.size$ < 0)
		z.size$ = -z.size$;
    return z;
};

Sk.builtin.lng.prototype.nb$power = function(n)
{
    // todo; upconvert n

    var ret = Sk.builtin.lng.fromInt$(1);
    var x = this.clone();
    while (n.size$ > 0)
    {
        if (n.digit$[0] % 2 !== 0) // odd
        {
            ret = Sk.builtin.lng.mul$(ret, x);
            n.digit$[0] &= ~1;
        }
        x = Sk.builtin.lng.mul$(x, x);
        n.divremInt$(2);
    }
    if (this.size$ < 0) ret.size$ = -ret.size$;
    return ret;
};

Sk.builtin.lng.prototype.nb$negative = function()
{
    var ret = this.clone();
    ret.size$ = -ret.size$;
    return ret;
};

Sk.builtin.lng.prototype.nb$positive = function() { return this; };

Sk.builtin.lng.prototype.divrem$ = function(other)
{
    var size_a = Math.abs(this.size$);
    var size_b = Math.abs(other.size$);
    var z;
    var rem;

    if (other.size$ === 0)
        throw new Sk.builtin.ZeroDivisionError("long division or modulo by zero");

    if (size_a < size_b ||
            this.digit$[size_a - 1] < other.digit$[size_b - 1])
    {
        // |this| < |other|
        return [0, this];
    }
    if (size_b === 1)
    {
        z = this.clone();
        var remi = z.divremInt$(other.digit$[0]);
        rem = new Sk.builtin.lng(undefined, 1);
        rem.digit$[0] = remi;
    }
	else
    {
        var tmp = Sk.builtin.lng.divremFull$(this, other);
        z = tmp[0];
        rem = tmp[1];
	}
    // z has sign of this*other, remainder has sign of a so that this=other*z+r
    if ((this.size$ < 0) !== (other.size$ < 0))
        z.size$ = -z.size$;
    if (this.size$ < 0 && rem.size$ !== 0)
        rem.size$ = -rem.size$;
    return [z, rem];
};

Sk.builtin.lng.divremFull$ = function(v1, w1)
{
    throw "todo;";
    /*
    var size_v = Math.abs(v1.size$);
    var size_w = Math.abs(w1.size$);
    var d = Sk.builtin.lng.BASE$ / (w1.digit[size_w - 1] + 1);
    var v = Sk.builtin.lng.mulInt$(v1, d);
    var w = Sk.builtin.lng.mulInt$(w1, d);
    */
};

Sk.builtin.lng.normalize$ = function(v)
{
    var j = Math.abs(v.size$);
    var i = j;

	while (i > 0 && v.digit$[i - 1] === 0)
		--i;
	if (i !== j)
        v.size$ = v.size$ < 0 ? -i : i;
	return v;
};

// Add the absolute values of two longs
Sk.builtin.lng.add$ = function(a, b)
{
    var size_a = Math.abs(a.size$);
    var size_b = Math.abs(b.size$);
    var z;
    var i;
    var carry = 0;

    // ensure a is the larger of the two
    if (size_a < size_b)
    {
        var tmp = a; a = b; b = tmp;
        tmp = size_a; size_a = size_b; size_b = tmp;
    }

    z = new Sk.builtin.lng(undefined, size_a + 1);
	for (i = 0; i < size_b; ++i)
    {
		carry += a.digit$[i] + b.digit$[i];
		z.digit$[i] = carry & Sk.builtin.lng.MASK$;
		carry >>= Sk.builtin.lng.SHIFT$;
	}
	for (; i < size_a; ++i)
    {
		carry += a.digit$[i];
		z.digit$[i] = carry & Sk.builtin.lng.MASK$;
		carry >>= Sk.builtin.lng.SHIFT$;
	}
	z.digit$[i] = carry;
	return Sk.builtin.lng.normalize$(z);
};

// Subtract the absolute values of two longs

Sk.builtin.lng.sub$ = function(a, b)
{
    var size_a = Math.abs(a.size$);
    var size_b = Math.abs(b.size$);
    var z;
    var i;
    var sign = 1;
    var borrow = 0;
    var tmp;

	// Ensure a is the larger of the two
    if (size_a < size_b)
    {
        sign = -1;
        tmp = a; a = b; b = tmp;
        tmp = size_a; size_a = size_b; size_b = tmp;
    }
	else if (size_a === size_b)
    {
		// Find highest digit where a and b differ
		i = size_a;
		while (--i >= 0 && a.digit$[i] === b.digit$[i])
        {
            // nothing
        }
		if (i < 0) return new Sk.builtin.lng(undefined, 0);
		if (a.digit$[i] < b.digit$[i])
        {
			sign = -1;
            tmp = a; a = b; b = tmp;
		}
		size_a = size_b = i + 1;
	}
    z = new Sk.builtin.lng(undefined, size_a);
	for (i = 0; i < size_b; ++i)
    {
        // todo; this isn't true in js i don't think
		// The following assumes unsigned arithmetic
	    // works modulo 2**N for some N>SHIFT
		borrow = a.digit$[i] - b.digit$[i] - borrow;
		z.digit$[i] = borrow & Sk.builtin.lng.MASK$;
		borrow >>= Sk.builtin.lng.SHIFT$;
		borrow &= 1; // Keep only one sign bit
	}
	for (; i < size_a; ++i)
    {
		borrow = a.digit$[i] - borrow;
		z.digit$[i] = borrow & Sk.builtin.lng.MASK$;
		borrow >>= Sk.builtin.lng.SHIFT$;
		borrow &= 1; // Keep only one sign bit
	}
    goog.asserts.assert(borrow === 0);
	if (sign < 0)
		z.size$ = -z.size$;
	return Sk.builtin.lng.normalize$(z);
};

// "grade school" multiplication, ignoring the signs.
// returns abs of product.
// todo; karatsuba is O better after a few 100 digits long, but more
// complicated for now.
Sk.builtin.lng.mul$ = function(a, b)
{
    var size_a = Math.abs(a.size$);
    var size_b = Math.abs(b.size$);
    var z = new Sk.builtin.lng(undefined, size_a + size_b);
    var i;
    for (i = 0; i < size_a + size_b; ++i) z.digit$[i] = 0;

    //print("size_a",size_a,"size_b",size_b,"tot", size_a+size_b);
    for (i = 0; i < size_a; ++i)
    {
        var carry = 0;
        var k = i;
        var f = a.digit$[i];
        for (var j = 0; j < size_b; ++j)
        {
            carry += z.digit$[k] + b.digit$[j] * f;
            //print("@",k,j,carry);
            z.digit$[k++] = carry & Sk.builtin.lng.MASK$;
            //print("stored:",z.digit$[i]);
            carry >>= Sk.builtin.lng.SHIFT$;
            //print("carry shifted to:",carry);
            goog.asserts.assert(carry <= Sk.builtin.lng.MASK$);
        }
        if (carry)
            z.digit$[k++] += carry & Sk.builtin.lng.MASK$;
    }

    Sk.builtin.lng.normalize$(z);
    return z;
};

Sk.builtin.lng.prototype.nb$nonzero = function()
{
    return this.size$ !== 0;
};

// divide this by non-zero digit n (inplace). return remainder.
Sk.builtin.lng.prototype.divremInt$ = function(n)
{
    var rem;
    var cur = Math.abs(this.size$);
    while (--cur >= 0)
    {
        var hi;
        rem = (rem << Sk.builtin.lng.SHIFT$) + this.digit$[cur];
        this.digit$[cur] = hi = Math.floor(rem / n);
        rem -= hi * n;
    }
    Sk.builtin.lng.normalize$(this);
    return rem;
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
    if (this.size$ === 0) return "0";

    if (base === undefined) base = 10;
    if (sign === undefined) sign = true;

    var ret = "";

    var tmp = this.clone();
    while (tmp.nb$nonzero())
    {
        //print("before d:",tmp.digit$, "s:",tmp.size$);
        var t = tmp.divremInt$(base);
        //print("after d:",tmp.digit$, "s:",tmp.size$);
        //print("t:",t);
        ret = "0123456789abcdef".substring(t, t + 1) + ret;
    }
    return (sign && this.size$ < 0 ? "-" : "") + ret;
};
