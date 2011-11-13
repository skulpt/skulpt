Sk.builtin.int_ = function(x, base)
{
    if (x instanceof Sk.builtin.str)
    {
        // todo; this should handle longs too
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
            return parseInt(x.v, base);
        else {
            throw new Sk.builtin.ValueError("int: Argument: " + x.v + " is not a valid literal");
        }

    }
    // sneaky way to do truncate, floor doesn't work < 0, round doesn't work on the .5> side
    // bitwise ops convert to 32bit int in the "C-truncate-way" we want.
    return x | 0;
};

Sk.builtin.int_.prototype.tp$name = "int";
Sk.builtin.int_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('int', Sk.builtin.int_);
