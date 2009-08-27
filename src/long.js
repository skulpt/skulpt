// long aka "bigint" implementation
// it's better not to think about how many processor-level instructions this is causing!


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
		while (--i >= 0 && a.digit$[i] == b.digit$[i])
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

Long$.prototype.__nonzero__ = function()
{
    return this.size$ !== 0;
};

// divide this by non-zero digit n (inplace). return remainder.
Long$.prototype.divrem_$ = function(n)
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
        var t = tmp.divrem_$(10);
        //print("after d:",tmp.digit$, "s:",tmp.size$);
        //print("t:",t);
        ret = "0123456789".substring(t, t + 1) + ret;
    }
    return new Str$((this.size$ < 0 ? "-" : "") + ret + "L");
};
