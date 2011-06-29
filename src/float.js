Sk.builtin.float_ = function(x)
{
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
    return x;
};

Sk.builtin.float_.prototype.tp$name = "float";
Sk.builtin.float_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('float', Sk.builtin.float_);
