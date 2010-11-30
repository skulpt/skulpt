Sk.builtin.int_ = function(x, base)
{
    if (x instanceof Sk.builtin.str)
    {
        // todo; this should handle longs too
        if (base === undefined) base = 10; // default radix is 10, not dwim
        return parseInt(x.v, base);
    }
    // sneaky way to do truncate, floor doesn't work < 0, round doesn't work on the .5> side
    // bitwise ops convert to 32bit int in the "C-truncate-way" we want.
    return x | 0;
};

Sk.builtin.int_.prototype.tp$name = "int";
Sk.builtin.int_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('int', Sk.builtin.int_);
