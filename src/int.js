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
Sk.str2number = function(s, base, parser, negater, fname)
{
    var origs = s;
    var neg = false;

    // strip whitespace from ends
    // s = s.trim();
    s = s.replace(/^\s+|\s+$/g, '');

    // check for minus sign
    if (s.charAt(0) == '-') {
	neg = true;
	s = s.substring(1);
    }

    // check for plus sign
    if (s.charAt(0) == '+') {
	s = s.substring(1);
    }

    if (base === undefined) base = 10; // default radix is 10, not dwim

    if (base < 2 || base > 36) {
	if (base != 0) {
	    throw new Sk.builtin.ValueError(fname + "() base must be >= 2 and <= 36");
	}
    }

    if ( s.substring(0,2).toLowerCase() == '0x' ) {
	if (base != 16 && base != 0) {
	    throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
	} else {
	    s = s.substring(2);
	    base = 16;
	}
    }
    else if ( s.substring(0,2).toLowerCase() == '0b' ) { 
	if (base != 2 && base != 0) {
	    throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
	} else {
	    s = s.substring(2);
	    base = 2;
	}
    }
    else if ( s.substring(0,2).toLowerCase() == '0o' ) {
	if (base != 8 && base != 0) {
	    throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
	} else {
	    s = s.substring(2);
	    base = 8;
	}
    }
    else if ( s.charAt(0) == '0' ) {
	if (s == '0') return 0;
	if (base == 8 || base == 0) {
	    base = 8;
	}
    }

    if (base == 0) base = 10;

    if (s.length === 0) {
	throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
    }

    // check all characters are valid
    var i, ch, val;
    for (i=0; i<s.length; i++) {
	ch = s.charCodeAt(i);
	val = base;
	if ((ch >= 48) && (ch <= 57)) {
	    // 0-9
	    val = ch - 48;
        }
	else if ((ch >= 65) && (ch <= 90)) {
	    // A-Z
	    val = ch - 65 + 10;
        }
        else if ((ch >= 97) && (ch <= 122)) {
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
}

Sk.builtin.int_ = function(x, base)
{
    if ((x !== undefined) && (!Sk.builtin.checkString(x)
			      && !Sk.builtin.checkNumber(x)))
    {
	if (x instanceof Sk.builtin.bool)
	    x = Sk.builtin.asnum$(x);
	else
	    throw new Sk.builtin.TypeError("int() argument must be a string or a number, not '" + Sk.abstr.typeName(x) + "'");
    }

    if (x instanceof Sk.builtin.str)
    {
		base = Sk.builtin.asnum$(base);
        var val = Sk.str2number(x.v, base, parseInt, 
                                function(x){return -x;}, "int");
        if ((val > Sk.builtin.lng.threshold$) 
            || (val < -Sk.builtin.lng.threshold$)) 
        {
            // Too big for int, convert to long
            return new Sk.builtin.lng(x, base);

        }

        return new Sk.builtin.nmber(val, Sk.builtin.nmber.int$);
    }

    if (base !== undefined) {
	throw new Sk.builtin.TypeError("int() can't convert non-string with explicit base");
    }

    if (x instanceof Sk.builtin.lng)
    {
	if (x.cantBeInt())
	    return new Sk.builtin.lng(x);
	else
	    return new Sk.builtin.nmber(x.toInt$(), Sk.builtin.nmber.int$);
    }

    // sneaky way to do truncate, floor doesn't work < 0, round doesn't work on the .5> side
    // bitwise ops convert to 32bit int in the "C-truncate-way" we want.
    x = Sk.builtin.asnum$(x);
    return new Sk.builtin.nmber(x | 0, Sk.builtin.nmber.int$);
};

Sk.builtin.int_.prototype.tp$name = "int";
Sk.builtin.int_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('int', Sk.builtin.int_);
