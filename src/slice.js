Slice$ = function(start, stop, step)
{
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
};

Slice$.prototype.__str__ = function()
{
    var a = repr(this.start).v;
    var b = repr(this.stop).v;
    var c = repr(this.step).v;
    return new Str$("slice(" + a + ", " + b + ", " + c + ")");
};

Slice$.prototype.indices = function(length)
{
    // this seems ugly, better way?
    var start = this.start, stop = this.stop, step = this.step, i;
    if (!step) step = 1;
    if (step > 0)
    {
        if (!start) start = 0;
        if (!stop) stop = length;
        if (start < 0) start = length + start;
        if (stop < 0) stop = length + stop;
    }
    else
    {
        if (!start) start = length - 1;
        else if (start < 0) start = length + start;
        if (!stop) stop = -1;
        else if (stop < 0) stop = length + stop;
    }
    return [start, stop, step];
};

Slice$.prototype.sssiter$ = function(wrt, f)
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
