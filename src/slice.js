/** @typedef {Sk.builtin.object} */ var pyObject;

/**
 * @constructor
 * @extends {Sk.builtin.object}
 * @param {pyObject} start
 * @param {pyObject=} stop
 * @param {pyObject=} step
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
    },
    slots: /**@lends {Sk.builtin.slice.prototype} */ {
        tp$getattr: Sk.generic.getAttr,
        tp$doc: "slice(stop)\nslice(start, stop[, step])\n\nCreate a slice object.  This is used for extended slicing (e.g. a[0:10:2]).",
        tp$hash: Sk.builtin.none.none$,
        tp$new: function (args, kwargs) {
            Sk.abstr.checkNoKwargs("slice", kwargs);
            Sk.abstr.checkArgsLen("slice", args, 1, 3);
            return new Sk.builtin.slice(...args);
        },
        $r: function () {
            const a = Sk.misceval.objectRepr(this.start);
            const b = Sk.misceval.objectRepr(this.stop);
            const c = Sk.misceval.objectRepr(this.step);
            return new Sk.builtin.str("slice(" + a + ", " + b + ", " + c + ")");
        },
        tp$richcompare: function (w, op) {
            // w not a slice - it's not subclassable so no need to use instanceof here
            if (w.ob$type !== Sk.builtin.slice) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            // This is how CPython does it
            const t1 = new Sk.builtin.tuple([this.start, this.stop, this.step]);
            const t2 = new Sk.builtin.tuple([w.start, w.stop, w.step]);
            return t1.tp$richcompare(t2, op);
        },
    },
    getsets: /**@lends {Sk.builtin.slice.prototype} */{
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
    methods: /**@lends {Sk.builtin.slice.prototype} */{
        indices: {
            $meth: function indices(length) {
                length = Sk.misceval.asIndexOrThrow(length);
                if (length < 0) {
                    throw new Sk.builtin.TypeError("length should not be negative");
                }
                const sss = this.$slice_indices(length);
                return new Sk.builtin.tuple([new Sk.builtin.int_(sss[0]), new Sk.builtin.int_(sss[1]), new Sk.builtin.int_(sss[2])]);
            },
            $doc:
                "S.indices(len) -> (start, stop, stride)\n\nAssuming a sequence of length len, calculate the start and stop\nindices, and the stride length of the extended slice described by\nS. Out of bounds indices are clipped in a manner consistent with the\nhandling of normal slices.",
            $textsig: null,
            $flags: { OneArg: true },
        },
    },
    proto: /**@lends {Sk.builtin.slice.prototype} */{
        $slice_indices: function (length) {
            let start, stop, step;
            const msg = "slice indices must be integers or None or have an __index__ method";
            if (Sk.builtin.checkNone(this.step)) {
                step = 1;
            } else {
                step = Sk.misceval.asIndexOrThrow(this.step, msg);
                if (step === 0) {
                    throw new Sk.builtin.ValueError("slice step cannot be zero");
                }
            }
            if (Sk.builtin.checkNone(this.start)) {
                start = null;
            } else {
                start = Sk.misceval.asIndexOrThrow(this.start, msg);
            }
            if (Sk.builtin.checkNone(this.stop)) {
                stop = null;
            } else {
                stop = Sk.misceval.asIndexOrThrow(this.stop, msg);
            }

            if (step > 0) {
                if (start === null) {
                    start = 0;
                } else if (start < 0) {
                    start = length + start;
                    if (start < 0) {
                        start = 0;
                    }
                }
                if (stop === null) {
                    stop = length;
                } else if (stop > length) {
                    stop = length;
                } else if (stop < 0) {
                    stop = length + stop;
                }
            } else {
                if (start === null) {
                    start = length - 1;
                } else if (start >= length) {
                    start = length - 1;
                } else if (start < 0) {
                    start = length + start;
                }
                if (stop === null) {
                    stop = -1;
                } else if (stop < 0) {
                    stop = length + stop;
                    if (stop < 0) {
                        stop = -1;
                    }
                }
            }

            return [start, stop, step];
        },
        /**
         * used by objects like str, list, tuple that can return a slice
         * @param {number} len 
         * @param {Function} f 
         */
        sssiter$: function (len, f) {
            const sss = this.$slice_indices(len);
            const start = sss[0];
            const stop = sss[1];
            const step = sss[2];
            if (step > 0) {
                for (let i = start; i < stop; i += step) {
                    f(i);
                }
            } else {
                for (let i = start; i > stop; i += step) {
                    f(i);
                }
            }
        },
    },
    flags: {
        sk$acceptable_as_base_class: false,
    },
});
