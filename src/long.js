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


Long$ = function(size)
{
    this.digit$ = new Array(Math.abs(size));
    this.size$ = size;
    return this;
};

Long$.SHIFT$ = 15;
Long$.BASE$ = 1 << Long$.SHIFT$;
Long$.MASK$ = Long$.BASE$ - 1;

Long$.fromInt$ = function(ival)
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
        t >>= Long$.SHIFT$;
    }

    var ret = new Long$(ndigits);
    if (negative) ret.size$ = -ret.size$;
    t = ival;
    var i = 0;
    while (t)
    {
        ret.digit$[i] = t & Long$.MASK$;
        t >>= Long$.SHIFT$;
        i += 1;
    }

    return ret;
};

Long$.prototype.clone = function()
{
    var ret = new Long$(this.size$);
    ret.digit$ = this.digit$.slice(0);
    return ret;
};

Long$.prototype.__add__ = function(other)
{
    // todo; upconvert other to long

    var z;
    if (this.size$ < 0)
    {
        if (other.size$ < 0)
        {
            z = Long$.add$(this, other);
            if (z && z.size$ !== 0)
                z.size$ = -z.size$;
        }
        else
        {
            z = Long$.sub$(other, this);
        }
    }
    else
    {
        if (other.size$ < 0)
            z = Long$.sub$(this, other);
        else
            z = Long$.add$(this, other);
    }
    return z;
};

Long$.prototype.__sub__ = function(other)
{
    // todo; upconvert other

    var z;
    if (this.size$ < 0)
    {
        if (other.size$ < 0)
            z = Long$.sub$(this, other);
        else
            z = Long$.add$(this, other);
        if (z.size$ !== 0)
            z.size$ = -z.size$;
    }
    else
    {
        if (other.size < 0)
            z = Long$.add$(this, other);
        else
            z = Long$.sub$(this, other);
    }
    return z;
};

Long$.prototype.__mul__ = function(other)
{
    // todo; upconvert
    var z = Long$.mul$(this, other);
	if (this.size$ * other.size$ < 0)
		z.size$ = -z.size$;
    return z;
};

Long$.prototype.__pow__ = function(n)
{
    // todo; upconvert n

    var ret = Long$.fromInt$(1);
    var x = this.clone();
    while (n.size$ > 0)
    {
        if (n.digit$[0] % 2 !== 0) // odd
        {
            ret = Long$.mul$(ret, x);
            n.digit$[0] &= ~1;
        }
        x = Long$.mul$(x, x);
        n.divremInt$(2);
    }
    return ret;
};

Long$.divrem$ = function(other)
{
    var size_a = Math.abs(this.size$);
    var size_b = Math.abs(other.size$);
    var z;
    var rem;

    if (other.size$ === 0)
        throw new ZeroDivisionError("long division or modulo by zero");

    if (size_a < size_b ||
            a.digit$[size_a - 1] < b.digit$[size_b - 1])
    {
        // |a| < |b|
        return [0, a];
    }
    if (size_b === 1)
    {
        z = a.clone();
        var remi = z.divremInt$(b.digit$[0]);
        rem = new Long$(1);
        rem.digit$[0] = remi;
    }
	else
    {
        var tmp = Long$.divremFull$(a, b);
        z = tmp[0];
        rem = tmp[1];
	}
    // z has sign of a*b, remainder has sign of a so that a=b*z+r
    if ((a.size$ < 0) !== (b.size$ < 0))
        z.size$ = -z.size$;
    if (a.size$ < 0 && rem.size$ !== 0)
        rem.size$ = -rem.size$;
    return [z, rem];
};

Long$.divremFull$ = function(v1, w1)
{
    throw "todo;";
    /*
    var size_v = Math.abs(v1.size$);
    var size_w = Math.abs(w1.size$);
    var d = Long$.BASE$ / (w1.digit[size_w - 1] + 1);
    var v = Long$.mulInt$(v1, d);
    var w = Long$.mulInt$(w1, d);
    */
};

Long$.normalize$ = function(v)
{
    var j = Math.abs(v.size$);
    var i = j;

	while (i > 0 && v.digit$[i - 1] === 0)
		--i;
	if (i !== j)
        v.size$ = v.size$ < 0 ? -i : i;
	return v;
}

// Add the absolute values of two longs
Long$.add$ = function(a, b)
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

    z = new Long$(size_a + 1);
	for (i = 0; i < size_b; ++i)
    {
		carry += a.digit$[i] + b.digit$[i];
		z.digit$[i] = carry & Long$.MASK$;
		carry >>= Long$.SHIFT$;
	}
	for (; i < size_a; ++i)
    {
		carry += a.digit$[i];
		z.digit$[i] = carry & Long$.MASK$;
		carry >>= Long$.SHIFT$;
	}
	z.digit$[i] = carry;
	return Long$.normalize$(z);
}

// Subtract the absolute values of two longs

Long$.sub$ = function(a, b)
{
    var size_a = Math.abs(a.size$);
    var size_b = Math.abs(b.size$);
    var z;
    var i;
    var sign = 1;
    var borrow = 0;

	// Ensure a is the larger of the two
    if (size_a < size_b)
    {
        sign = -1;
        var tmp = a; a = b; b = tmp;
        tmp = size_a; size_a = size_b; size_b = tmp;
    }
	else if (size_a == size_b)
    {
		// Find highest digit where a and b differ
		i = size_a;
		while (--i >= 0 && a.digit$[i] === b.digit$[i])
			;
		if (i < 0) return new Long$(0);
		if (a.digit$[i] < b.digit$[i])
        {
			sign = -1;
            var tmp = a; a = b; b = tmp;
		}
		size_a = size_b = i + 1;
	}
    z = new Long$(size_a);
	for (i = 0; i < size_b; ++i)
    {
        // todo; this isn't true in js i don't think
		// The following assumes unsigned arithmetic
	    // works modulo 2**N for some N>SHIFT
		borrow = a.digit$[i] - b.digit$[i] - borrow;
		z.digit$[i] = borrow & Long$.MASK$;
		borrow >>= Long$.SHIFT$;
		borrow &= 1; // Keep only one sign bit
	}
	for (; i < size_a; ++i)
    {
		borrow = a.digit$[i] - borrow;
		z.digit$[i] = borrow & Long$.MASK$;
		borrow >>= Long$.SHIFT$;
		borrow &= 1; // Keep only one sign bit
	}
    if (borrow !== 0) throw "assert";
	if (sign < 0)
		z.size$ = -z.size$;
	return Long$.normalize$(z);
};

// "grade school" multiplication, ignoring the signs.
// returns abs of product.
// todo; karatsuba is O better after a few 100 digits long, but more
// complicated for now.
Long$.mul$ = function(a, b)
{
    var size_a = Math.abs(a.size$);
    var size_b = Math.abs(b.size$);
    var z = new Long$(size_a + size_b);
    for (var i = 0; i < size_a + size_b; ++i) z.digit$[i] = 0;

    //print("size_a",size_a,"size_b",size_b,"tot", size_a+size_b);
    for (var i = 0; i < size_a; ++i)
    {
        var carry = 0;
        var k = i;
        var f = a.digit$[i];
        for (var j = 0; j < size_b; ++j)
        {
            carry += z.digit$[k] + b.digit$[j] * f;
            //print("@",k,j,carry);
            z.digit$[k++] = carry & Long$.MASK$;
            //print("stored:",z.digit$[i]);
            carry >>= Long$.SHIFT$;
            //print("carry shifted to:",carry);
            if (carry > Long$.MASK$) throw "assert";
        }
        if (carry)
            z.digit$[k++] += carry & Long$.MASK$;
    }

    Long$.normalize$(z);
    return z;
};

Long$.prototype.__nonzero__ = function()
{
    return this.size$ !== 0;
};

// divide this by non-zero digit n (inplace). return remainder.
Long$.prototype.divremInt$ = function(n)
{
    var rem;
    var cur = Math.abs(this.size$);
    while (--cur >= 0)
    {
        var hi;
        rem = (rem << Long$.SHIFT$) + this.digit$[cur];
        this.digit$[cur] = hi = Math.floor(rem / n);
        rem -= hi * n;
    }
    Long$.normalize$(this);
    return rem;
};

// todo; always base 10 right now, not sure if/where the magic belongs for other bases
Long$.prototype.__repr__ = function()
{
    if (this.size$ === 0) return new Str$("0L");
    var ret = "";

    var tmp = this.clone();
    while (tmp.__nonzero__())
    {
        //print("before d:",tmp.digit$, "s:",tmp.size$);
        var t = tmp.divremInt$(10);
        //print("after d:",tmp.digit$, "s:",tmp.size$);
        //print("t:",t);
        ret = "0123456789".substring(t, t + 1) + ret;
    }
    return new Str$((this.size$ < 0 ? "-" : "") + ret + "L");
};
