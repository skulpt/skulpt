Sk.builtin.int_ = function(x, base)
{
    if (x instanceof Sk.builtin.str)
    {
        // todo; this should handle longs too
		base = Sk.builtin.asnum$(base);
        if (base === undefined) base = 10; // default radix is 10, not dwim
		if ( x.v.substring(0,2).toLowerCase() == '0x' && base != 16 && base != 0) {
			throw new Sk.builtin.ValueError("int: Argument: " + x.v + " is not a valid literal");
		}
		if ( x.v.substring(0,2).toLowerCase() == '0b' ) { 
			if (base != 2 && base != 0) {
				throw new Sk.builtin.ValueError("int: Argument: " + x.v + " is not a valid literal");
			} else {
				x.v = x.v.substring(2);
				base = 2;
			}
		}

        if (!isNaN(x.v) && x.v.indexOf(".") < 0)
            return new Sk.builtin.nmber(parseInt(x.v, base), Sk.builtin.nmber.int$);
        else {
            throw new Sk.builtin.ValueError("int: Argument: " + x.v + " is not a valid literal");
        }

    }

	if (x instanceof Sk.builtin.lng) {
		if (x.cantBeInt())
			return new Sk.builtin.lng(x);
		else
			return new Sk.builtin.nmber(x.str$(10, true), Sk.builtin.nmber.int$);
	}

	x = Sk.builtin.asnum$(x);
	if (x % 1 != 0) {
		if (x < 0)
			x = -Math.floor(-x);
		else
			x = Math.floor(x);
    }
	return new Sk.builtin.nmber(x, Sk.builtin.nmber.int$);
};

Sk.builtin.int_.prototype.tp$name = "int";
Sk.builtin.int_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('int', Sk.builtin.int_);
