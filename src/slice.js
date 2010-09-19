/**
 * @constructor
 * @param {number} start
 * @param {number=} stop
 * @param {null|number=} step
 */
Sk.builtin.slice = function slice(start, stop, step)
{
    if (!(this instanceof Sk.builtin.slice)) return new Sk.builtin.slice(start, stop, step);

    if (stop === undefined && step === undefined)
    {
        stop = start;
        start = null;
    }
    if (!start) start = null;
    if (stop === undefined) stop = null;
    if (step === undefined) step = null;
    this.start = start;
    this.stop = stop;
    this.step = step;
    return this;
};

Sk.builtin.slice.prototype.tp$str = function()
{
    var a = Sk.builtin.repr(this.start).v;
    var b = Sk.builtin.repr(this.stop).v;
    var c = Sk.builtin.repr(this.step).v;
    return new Sk.builtin.str("slice(" + a + ", " + b + ", " + c + ")");
};

Sk.builtin.slice.prototype.indices = function(length)
{
    // this seems ugly, better way?
    var start = this.start, stop = this.stop, step = this.step, i;
    if (step === null) step = 1;
    if (step > 0)
    {
        if (start === null) start = 0;
        if (stop === null) stop = length;
        if (start < 0) start = length + start;
        if (stop < 0) stop = length + stop;
    }
    else
    {
        if (start === null) start = length - 1;
        else if (start < 0) start = length + start;
        if (stop === null) stop = -1;
        else if (stop < 0) stop = length + stop;
    }
    return [start, stop, step];
};

Sk.builtin.slice.prototype.sssiter$ = function(wrt, f)
{
    var sss = this.indices(typeof wrt === "number" ? wrt : wrt.v.length);
    if (sss[2] > 0)
    {
        var i;
        for (i = sss[0]; i < sss[1]; i += sss[2])
            if (f(i, wrt) === false) return;
    }
    else
    {
        for (i = sss[0]; i > sss[1]; i += sss[2])
            if (f(i, wrt) === false) return;

    }
};
