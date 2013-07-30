/**
 * @constructor
 * @param {null|number} start
 * @param {null|number=} stop
 * @param {null|number=} step
 */
Sk.builtin.slice = function slice(start, stop, step)
{
	start = Sk.builtin.asnum$(start);
	stop  = Sk.builtin.asnum$(stop);
	step  = Sk.builtin.asnum$(step);
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
    
    if (((this.start !== null) && !Sk.builtin.checkInt(this.start))
        || ((this.stop !== null) && !Sk.builtin.checkInt(this.stop))
        || ((this.step !== null) && !Sk.builtin.checkInt(this.step))) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None");
    }

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
	length = Sk.builtin.asnum$(length);
    // this seems ugly, better way?
    var start = this.start, stop = this.stop, step = this.step, i;
    if (step === null) step = 1;
    if (step > 0)
    {
        if (start === null) start = 0;
        if (stop === null) stop = length;
        if (stop > length) {
            stop = length;
        }
        if (start < 0) {
            start = length + start;
            if (start < 0) {
                start = 0;
            }
        }
        if (stop < 0) stop = length + stop;
    }
    else
    {
        if (start === null) start = length - 1;
        if (start >= length) {
            start = length - 1;
        }
        if (stop === null) {
            stop = -1;
        } else if (stop < 0) {
            stop = length + stop;
            if (stop < 0) {
                stop = -1;
            }
        }
        if (start < 0) start = length + start;
    }
    return [start, stop, step];
};

Sk.builtin.slice.prototype.sssiter$ = function(wrt, f)
{
	var wrtv = Sk.builtin.asnum$(wrt);
    var sss = this.indices(typeof wrtv === "number" ? wrtv : wrt.v.length);
    if (sss[2] > 0)
    {
        var i;
        for (i = sss[0]; i < sss[1]; i += sss[2])
            if (f(i, wrtv) === false) return;	//	wrt or wrtv? RNL
    }
    else
    {
        for (i = sss[0]; i > sss[1]; i += sss[2])
            if (f(i, wrtv) === false) return;	//	wrt or wrtv? RNL

    }
};
