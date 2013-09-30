/**
 * @constructor
 * @param {Object} start
 * @param {Object=} stop
 * @param {Object=} step
 */
Sk.builtin.slice = function slice(start, stop, step)
{
    if (!(this instanceof Sk.builtin.slice)) return new Sk.builtin.slice(start, stop, step);

    if (stop === undefined && step === undefined)
    {
        stop = start;
        start = Sk.builtin.none.none$;
    }
    if (stop === undefined) stop = Sk.builtin.none.none$;
    if (step === undefined) step = Sk.builtin.none.none$;
    this.start = start;
    this.stop = stop;
    this.step = step;

    this.__class__ = Sk.builtin.slice;

    return this;
};

Sk.builtin.slice.prototype.tp$name = 'slice';
Sk.builtin.slice.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj('slice', Sk.builtin.slice);

Sk.builtin.slice.prototype['$r'] = function()
{
    var a = Sk.builtin.repr(this.start).v;
    var b = Sk.builtin.repr(this.stop).v;
    var c = Sk.builtin.repr(this.step).v;
    return new Sk.builtin.str("slice(" + a + ", " + b + ", " + c + ")");
};

// todo;this is currently the only way I can find to make the start, step and stop attributes accessible, but I'm not sure it's the best.
Sk.builtin.slice.prototype.tp$getattr = function(name)
{
    // Maybe not very pretty, but very direct, and I don't think there is much you would be able to access in this way that you shouldn't.
    // todo;Should we call the generic get attribute function? (If so, Closure needs to be told it's okay.)
    return this[name];// || Sk.builtin.object.prototype.GenericGetAttr.call(this, name);
};

Sk.builtin.slice.prototype.tp$richcompare = function(w, op)
{
    // w not a slice
    if (!w.__class__ || w.__class__ != Sk.builtin.slice)
    {
        // shortcuts for eq/not
        if (op === 'Eq') return false;
        if (op === 'NotEq') return true;

        // todo; other types should have an arbitrary order
        return false;
    }

    // This is how CPython does it
    var t1, t2;
    t1 = new Sk.builtin.tuple([this.start,this.stop,this.step]);
    t2 = new Sk.builtin.tuple([w.start,w.stop,w.step]);
    
    return t1.tp$richcompare(t2, op);
};

Sk.builtin.slice.prototype.indices = function(length)
{
	var start = Sk.builtin.asnum$(this.start), 
	    stop  = Sk.builtin.asnum$(this.stop),
	    step  = Sk.builtin.asnum$(this.step);

    if (((start !== null) && !Sk.builtin.checkInt(start))
        || ((stop !== null) && !Sk.builtin.checkInt(stop))
        || ((step !== null) && !Sk.builtin.checkInt(step))) {
        throw new Sk.builtin.TypeError("slice indices must be integers or None");
    }

	length = Sk.builtin.asnum$(length);
    // this seems ugly, better way?
    var i;
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
