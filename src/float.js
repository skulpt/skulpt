Sk.builtin.float_ = function(x)
{
    if (x instanceof Sk.builtin.str)
    {
		var tmp;
        if (x.v === "inf") tmp = Infinity;
        else if (x.v === "-inf") tmp = -Infinity;
        else if (!isNaN(x.v))
            tmp = parseFloat(x.v);
        else {
            throw new Sk.builtin.ValueError("float: Argument: " + x.v + " is not number");
        }
		return new Sk.builtin.nmber(tmp, Sk.builtin.nmber.float$);
    }

	x = Sk.builtin.asnum$(x);
	return new Sk.builtin.nmber(x, Sk.builtin.nmber.float$);
};

Sk.builtin.float_.prototype.tp$name = "float";
Sk.builtin.float_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('float', Sk.builtin.float_);
