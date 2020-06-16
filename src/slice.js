/**
 * @constructor
 * @param {Object} start
 * @param {Object=} stop
 * @param {Object=} step
 */
Sk.builtin.slice = Sk.abstr.buildNativeClass("slice", {
    constructor: function slice(start, stop, step) {
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

        return this;
    },
    slots: {
        tp$getattr: Sk.generic.getAttr,
        tp$doc: "slice(stop)\nslice(start, stop[, step])\n\nCreate a slice object.  This is used for extended slicing (e.g. a[0:10:2]).",
        tp$hash: Sk.builtin.none.none$,
        tp$new: function (args, kwargs) {
            Sk.abstr.checkNoKwargs("slice", kwargs);
            Sk.abstr.checkArgsLen("slice", args, 1, 3);
            return new Sk.builtin.slice(...args);
        },
        $r: function () {
            const a = Sk.builtin.repr(this.start).v;
            const b = Sk.builtin.repr(this.stop).v;
            const c = Sk.builtin.repr(this.step).v;
            return new Sk.builtin.str("slice(" + a + ", " + b + ", " + c + ")");
        },
        tp$richcompare: function (w, op) {
            // w not a slice
            var t1, t2;
            if (!w.ob$type || w.ob$type != Sk.builtin.slice) {
                // shortcuts for eq/not
                if (op === "Eq") {
                    return false;
                }
                if (op === "NotEq") {
                    return true;
                }
                if (Sk.__future__.python3) {
                    return Sk.builtin.NotImplemented.NotImplemented$;
                }
                // todo; other types should have an arbitrary order
                return false;
            }
            // This is how CPython does it
            t1 = new Sk.builtin.tuple([this.start, this.stop, this.step]);
            t2 = new Sk.builtin.tuple([w.start, w.stop, w.step]);

            return t1.tp$richcompare(t2, op);
        },
    },
    getsets: {
        start: {
            $get: function () {
                return this.start;
            },
        },
        step: {
            $get: function () {
                return this.step;
            },
        },
        stop: {
            $get: function () {
                return this.stop;
            },
        },
    },
    methods: {
        indices: {
            $meth: function indices(length) {
                length = Sk.builtin.asnum$(length);
                const sss = this.$slice_indices(length);

                return new Sk.builtin.tuple([new Sk.builtin.int_(sss[0]), new Sk.builtin.int_(sss[1]), new Sk.builtin.int_(sss[2])]);
            },
            $doc:
                "S.indices(len) -> (start, stop, stride)\n\nAssuming a sequence of length len, calculate the start and stop\nindices, and the stride length of the extended slice described by\nS. Out of bounds indices are clipped in a manner consistent with the\nhandling of normal slices.",
            $textsig: null,
            $flags: { OneArg: true },
        },
    },
    proto: {
        $slice_indices: function (length) {
            var start, stop, step;

            if (Sk.misceval.isIndex(this.step) && Sk.misceval.asIndex(this.step) === 0) {
                // technically a pure slice object can have a zero step...
                throw new Sk.builtin.ValueError("slice step cannot be zero");
            }

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
        },
        sssiter$: function (wrt, f) {
            var i;
            var wrtv = Sk.builtin.asnum$(wrt);
            var sss = this.$slice_indices(typeof wrtv === "number" ? wrtv : wrt.v.length);
            if (sss[2] > 0) {
                for (i = sss[0]; i < sss[1]; i += sss[2]) {
                    if (f(i, wrtv) === false) {
                        return;
                    }
                } //	wrt or wrtv? RNL
            } else {
                for (i = sss[0]; i > sss[1]; i += sss[2]) {
                    if (f(i, wrtv) === false) {
                        return;
                    }
                } //	wrt or wrtv? RNL
            }
        },
    },
    flags: {
        sk$acceptable_as_base_class: false,
    },
});
