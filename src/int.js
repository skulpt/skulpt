Sk.builtin.int_ = function(x, base)
{
    if (x instanceof Sk.builtin.str)
    {
	var s = x.v;

        // todo; this should handle longs too
        if (base === undefined) base = 10; // default radix is 10, not dwim

	if (base < 2 || base > 36) {
	    if (base != 0) {
		throw new Sk.builtin.ValueError("int() base must be >= 2 and <= 36");
	    }
	}

	if ( s.substring(0,2).toLowerCase() == '0x' ) {
	    if (base != 16 && base != 0) {
		throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + x.v + "'");
	    } else {
		base = 16;
	    }
	}
	else if ( s.substring(0,2).toLowerCase() == '0b' ) { 
	    if (base != 2 && base != 0) {
		throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + x.v + "'");
	    } else {
		s = s.substring(2);
		base = 2;
	    }
	}
	else if ( s.charAt(0) == '0' ) {
	    if (s == '0') return 0;
	    if (base == 8 || base == 0) {
		base = 8;
	    }
	}

	// !isNaN is not the right check for all bases
        if (!isNaN(s) && s.indexOf(".") < 0) {
	    var val = parseInt(s, base);
	    if (isNaN(val)) {
		throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + x.v + "'");
	    }
            return val;
	}
        else {
	    throw new Sk.builtin.ValueError("invalid literal for int() with base " + base + ": '" + x.v + "'");
        }
    }

    if (base !== undefined) {
	throw new Sk.builtin.TypeError("int() can't convert non-string with explicit base");
    }

    // sneaky way to do truncate, floor doesn't work < 0, round doesn't work on the .5> side
    // bitwise ops convert to 32bit int in the "C-truncate-way" we want.
    return x | 0;
};

Sk.builtin.int_.prototype.tp$name = "int";
Sk.builtin.int_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('int', Sk.builtin.int_);
