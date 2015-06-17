/**
 * @constructor
 * @param {Object} start
 * @param {Object=} stop
 * @param {Object=} step
 */
Sk.builtin.slice = function slice (start, stop, step) {
    Sk.builtin.pyCheckArgs("slice", arguments, 1, 3, false, false);

    if ((step !== undefined) && Sk.misceval.isIndex(step) && (Sk.misceval.asIndex(step) === 0)) {
        throw new Sk.builtin.ValueError("slice step cannot be zero");
    }

    if (!(this instanceof Sk.builtin.slice)) {
        return new Sk.builtin.slice(start, stop, step);
    }


    if (stop === undefined && step === undefined) {
        stop = start;
        start = Sk.builtin.none.none$;
    }
    if (stop === undefined) {
        stop = Sk.builtin.none.none$;
    }
    if (step === undefined) {
        step = Sk.builtin.none.none$;
    }
    this.start = start;
    this.stop = stop;
    this.step = step;

    this.__class__ = Sk.builtin.slice;

    this["$d"] = new Sk.builtin.dict([Sk.builtin.slice$start, this.start,
        Sk.builtin.slice$stop, this.stop,
        Sk.builtin.slice$step, this.step]);

    return this;
};

Sk.abstr.setUpInheritance("slice", Sk.builtin.slice, Sk.builtin.object);

Sk.builtin.slice.prototype["$r"] = function () {
    var a = Sk.builtin.repr(this.start).v;
    var b = Sk.builtin.repr(this.stop).v;
    var c = Sk.builtin.repr(this.step).v;
    return new Sk.builtin.str("slice(" + a + ", " + b + ", " + c + ")");
};

Sk.builtin.slice.prototype.tp$richcompare = function (w, op) {
    // w not a slice
    var t1, t2;
    if (!w.__class__ || w.__class__ != Sk.builtin.slice) {
        // shortcuts for eq/not
        if (op === "Eq") {
            return false;
        }
        if (op === "NotEq") {
            return true;
        }

        // todo; other types should have an arbitrary order
        return false;
    }

    // This is how CPython does it
    t1 = new Sk.builtin.tuple([this.start, this.stop, this.step]);
    t2 = new Sk.builtin.tuple([w.start, w.stop, w.step]);

    return t1.tp$richcompare(t2, op);
};

/* Internal indices function */
Sk.builtin.slice.prototype.slice_indices_ = function (length) {
    var start, stop, step;

    if (Sk.builtin.checkNone(this.start)) {
        start = null;
    } else if (Sk.misceval.isIndex(this.start)) {
        start = Sk.misceval.asIndex(this.start);
    } else {
        throw new Sk.builtin.TypeError("slice indices must be integers or None");
    }

    if (Sk.builtin.checkNone(this.stop)) {
        stop = null;
    } else if (Sk.misceval.isIndex(this.stop)) {
        stop = Sk.misceval.asIndex(this.stop);
    } else {
        throw new Sk.builtin.TypeError("slice indices must be integers or None");
    }

    if (Sk.builtin.checkNone(this.step)) {
        step = null;
    } else if (Sk.misceval.isIndex(this.step)) {
        step = Sk.misceval.asIndex(this.step);
    } else {
        throw new Sk.builtin.TypeError("slice indices must be integers or None");
    }

    // this seems ugly, better way?
    if (step === null) {
        step = 1;
    }
    if (step > 0) {
        if (start === null) {
            start = 0;
        }
        if (stop === null) {
            stop = length;
        }
        if (stop > length) {
            stop = length;
        }
        if (start < 0) {
            start = length + start;
            if (start < 0) {
                start = 0;
            }
        }
        if (stop < 0) {
            stop = length + stop;
        }
    } else {
        if (start === null) {
            start = length - 1;
        }
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
        if (start < 0) {
            start = length + start;
        }
    }

    return [start, stop, step];
};

Sk.builtin.slice.prototype["indices"] = new Sk.builtin.func(function (self, length) {
    Sk.builtin.pyCheckArgs("indices", arguments, 2, 2, false, false);

    length = Sk.builtin.asnum$(length);
    var sss = self.slice_indices_(length);

    return new Sk.builtin.tuple([new Sk.builtin.int_(sss[0]), 
                                 new Sk.builtin.int_(sss[1]), 
                                 new Sk.builtin.int_(sss[2])]);
});

Sk.builtin.slice.prototype.sssiter$ = function (wrt, f) {
    var i;
    var wrtv = Sk.builtin.asnum$(wrt);
    var sss = this.slice_indices_(typeof wrtv === "number" ? wrtv : wrt.v.length);
    if (sss[2] > 0) {
        for (i = sss[0]; i < sss[1]; i += sss[2]) {
            if (f(i, wrtv) === false) {
                return;
            }
        }	//	wrt or wrtv? RNL
    } else {
        for (i = sss[0]; i > sss[1]; i += sss[2]) {
            if (f(i, wrtv) === false) {
                return;
            }
        }	//	wrt or wrtv? RNL

    }
};

Sk.builtin.slice$start = new Sk.builtin.str("start");
Sk.builtin.slice$stop = new Sk.builtin.str("stop");
Sk.builtin.slice$step = new Sk.builtin.str("step");
