Sk.builtin.float_ = function(x)
{
    if (x === undefined)
    {
        return 0.0;
    }

    if (x instanceof Sk.builtin.str)
    {
        if (x.v === "inf") return Infinity;
        if (x.v === "-inf") return -Infinity;
        if (!isNaN(x.v))
            return parseFloat(x.v);
        else {
            throw new Sk.builtin.ValueError("float: Argument: " + x.v + " is not number");
        }
    }

    if (typeof x === "number")
    {
        return x;   
    }

    throw new Sk.builtin.TypeError("float() argument must be a string or a number");
};

Sk.builtin.float_.prototype.tp$name = "float";
Sk.builtin.float_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('float', Sk.builtin.float_);
