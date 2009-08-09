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

Slice$.prototype.toString = function()
{
    return "slice(" + new Str$(this.start).v + ", " + new Str$(this.stop).v + ", " + new Str$(this.step).v + ")";
};

Slice$.prototype.getsss$ = function(wrt)
{
    // this seems ugly, better way?
    var start = this.start, stop = this.stop, step = this.step, i;
    if (!step) step = 1;
    if (step > 0)
    {
        if (!start) start = 0;
        if (!stop) stop = wrt.v.length;
        if (start < 0) start = wrt.v.length + start;
        if (stop < 0) stop = wrt.v.length + stop;
    }
    else
    {
        if (!start) start = wrt.v.length - 1;
        else if (start < 0) start = wrt.v.length + start;
        if (!stop) stop = -1;
        else if (stop < 0) stop = wrt.v.length + stop;
    }
    return [start, stop, step];
};

Slice$.prototype.sssiter$ = function(wrt, f)
{
    var sss = this.getsss$(wrt);
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
