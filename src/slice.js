import { setUpInheritance } from './abstract';
import { pyCheckArgs, func, checkNone } from './function';
import { ValueError, TypeError } from './errors';
import { str } from './str';
import { object, none } from './object';
import { tuple } from './tuple';
import { int_ } from './int';
import { repr } from './builtin'

export class slice extends object {
    /**
     * @constructor
     * @param {Object} start
     * @param {Object=} stop
     * @param {Object=} step
     */
    constructor(start, stop, step) {
        pyCheckArgs("slice", arguments, 1, 3, false, false);

        if ((step !== undefined) && Sk.misceval.isIndex(step) && (Sk.misceval.asIndex(step) === 0)) {
            throw new ValueError("slice step cannot be zero");
        }

        if (stop === undefined && step === undefined) {
            stop = start;
            start = none.none$;
        }
        if (stop === undefined) {
            stop = none.none$;
        }
        if (step === undefined) {
            step = none.none$;
        }
        this.start = start;
        this.stop = stop;
        this.step = step;

        this.__class__ = slice;

        this["$d"] = new dict([
            slice$start, this.start,
            slice$stop, this.stop,
            slice$step, this.step]);

        return this;
    }

    $r() {
        var a = repr(this.start).v;
        var b = repr(this.stop).v;
        var c = repr(this.step).v;
        return new str("slice(" + a + ", " + b + ", " + c + ")");
    }

    tp$richcompare(w, op) {
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
        t1 = new tuple([this.start, this.stop, this.step]);
        t2 = new tuple([w.start, w.stop, w.step]);

        return t1.tp$richcompare(t2, op);
    }

    /* Internal indices function */
    slice_indices_(length) {
        var start, stop, step;

        if (checkNone(this.start)) {
            start = null;
        } else if (Sk.misceval.isIndex(this.start)) {
            start = Sk.misceval.asIndex(this.start);
        } else {
            throw new TypeError("slice indices must be integers or None");
        }

        if (checkNone(this.stop)) {
            stop = null;
        } else if (Sk.misceval.isIndex(this.stop)) {
            stop = Sk.misceval.asIndex(this.stop);
        } else {
            throw new TypeError("slice indices must be integers or None");
        }

        if (checkNone(this.step)) {
            step = null;
        } else if (Sk.misceval.isIndex(this.step)) {
            step = Sk.misceval.asIndex(this.step);
        } else {
            throw new TypeError("slice indices must be integers or None");
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
    }

    indices = new func(function (self, length) {
        pyCheckArgs("indices", arguments, 2, 2, false, false);

        length = Sk.builtin.asnum$(length);
        var sss = self.slice_indices_(length);

        return new tuple([
            new int_(sss[0]),
            new int_(sss[1]),
            new int_(sss[2])]);
    });

    sssiter$(wrt, f) {
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
    }
}

const slice$start = new str("start");
const slice$stop = new str("stop");
const slice$step = new str("step");

setUpInheritance("slice", slice, object);
