Sk.builtin.float_ = function(x)
{
    if (x === undefined)
    {
        return new Sk.builtin.nmber(0.0, Sk.builtin.nmber.float$);
    }

    if (x instanceof Sk.builtin.str)
    {
		var tmp;

	if (x.v.match(/^-inf$/i)) {
	    tmp = -Infinity;
	}
	else if (x.v.match(/^[+]?inf$/i)) {
	    tmp = Infinity;
	}
	else if (x.v.match(/^[-+]?nan$/i)) {
	    tmp = NaN;
	}

        else if (!isNaN(x.v))
            tmp = parseFloat(x.v);
        else {
            throw new Sk.builtin.ValueError("float: Argument: " + x.v + " is not number");
        }
		return new Sk.builtin.nmber(tmp, Sk.builtin.nmber.float$);
    }

    // Floats are just numbers
    if (typeof x === "number" || x instanceof Sk.builtin.nmber
	|| x instanceof Sk.builtin.lng)
    {
	x = Sk.builtin.asnum$(x);
        return new Sk.builtin.nmber(x, Sk.builtin.nmber.float$);
    }

    // Convert booleans
    if (x instanceof Sk.builtin.bool)
    {
	x = Sk.builtin.asnum$(x);
	return new Sk.builtin.nmber(x, Sk.builtin.nmber.float$);
    }

    throw new Sk.builtin.TypeError("float() argument must be a string or a number");
};

Sk.builtin.float_.prototype.tp$name = "float";
Sk.builtin.float_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('float', Sk.builtin.float_);
