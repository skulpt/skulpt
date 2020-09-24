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
        tp$new(args, kwargs) {
            Sk.abstr.checkNoKwargs("slice", kwargs);
            Sk.abstr.checkArgsLen("slice", args, 1, 3);
            return new Sk.builtin.slice(...args);
        },
        $r() {
            const a = Sk.misceval.objectRepr(this.start);
            const b = Sk.misceval.objectRepr(this.stop);
            const c = Sk.misceval.objectRepr(this.step);
            return new Sk.builtin.str("slice(" + a + ", " + b + ", " + c + ")");
        },
        tp$richcompare(w, op) {
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
    getsets: /**@lends {Sk.builtin.slice.prototype} */ {
        start: {
            $get() {
                return this.start;
            },
        },
        step: {
            $get() {
                return this.step;
            },
        },
        stop: {
            $get() {
                return this.stop;
            },
        },
    },
    methods: /**@lends {Sk.builtin.slice.prototype} */ {
        indices: {
            $meth: function indices(length) {
                length = Sk.misceval.asIndexSized(length, Sk.builtin.OverflowError); // let's not support lengths larger than this.
                // don't support large lengths here which seems fair. 
                if (length < 0) {
                    throw new Sk.builtin.TypeError("length should not be negative");
                }
                const {start, stop, step} = this.slice$indices(length);
                return new Sk.builtin.tuple([new Sk.builtin.int_(start), new Sk.builtin.int_(stop), new Sk.builtin.int_(step)]);
            },
            $doc:
                "S.indices(len) -> (start, stop, stride)\n\nAssuming a sequence of length len, calculate the start and stop\nindices, and the stride length of the extended slice described by\nS. Out of bounds indices are clipped in a manner consistent with the\nhandling of normal slices.",
            $textsig: null,
            $flags: { OneArg: true },
        },
    },
    proto: /**@lends {Sk.builtin.slice.prototype} */ {
        slice$as_indices (sized) {
            let start, stop, step;
            const msg = "slice indices must be integers or None or have an __index__ method";
            let getIndex;
            if (sized) {
                getIndex = (idx) => Sk.misceval.asIndexSized(idx, null, msg);
            } else {
                getIndex = (idx) => Sk.misceval.asIndexOrThrow(idx, msg);
            }
            if (Sk.builtin.checkNone(this.step)) {
                step = 1;
            } else {
                step = getIndex(this.step);
                if (step === 0) {
                    throw new Sk.builtin.ValueError("slice step cannot be zero");
                }
            }
            if (Sk.builtin.checkNone(this.start)) {
                start = null;
            } else {
                start = getIndex(this.start);
            }
            if (Sk.builtin.checkNone(this.stop)) {
                stop = null;
            } else {
                stop = getIndex(this.stop);
            }
            return {start: start, stop: stop, step: step};
        },
        $wrt(length, start, stop, step, sized) {
            let idxFromNeg;
            if (sized) {
                idxFromNeg = (idx) => JSBI.__isBigInt(idx) ? JSBI.add(idx, JSBI.BigInt(length)) : idx + length;
            } else {
                idxFromNeg = (idx) => idx + length;
            }

            if (step > 0) {
                if (start === null) {
                    start = 0;
                } else if (start < 0) {
                    start = idxFromNeg(start);
                    if (start < 0) {
                        start = 0;
                    }
                }
                if (stop === null) {
                    stop = length;
                } else if (stop > length) {
                    stop = length;
                } else if (stop < 0) {
                    stop = idxFromNeg(stop);
                }
            } else {
                if (start === null) {
                    start = length - 1;
                } else if (start >= length) {
                    start = length - 1;
                } else if (start < 0) {
                    start = idxFromNeg(start);
                }
                if (stop === null) {
                    stop = -1;
                } else if (stop < 0) {
                    stop = idxFromNeg(stop);
                    if (stop < 0) {
                        stop = -1;
                    }
                }
            }

            return {start: start, stop: stop, step: step};
        },
        slice$indices(length, sized) {
            let {start, stop, step} = this.slice$as_indices(true, sized);
            return this.$wrt(length, start, stop, step, sized);
        },
        /**
         * used by objects like str, list, tuple that can return a slice
         * @param {number} len
         * @param {Function} f
         */
        sssiter$(len, f) {
            let {start, stop, step} = this.slice$indices(len, true);
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

/**
 * 
 * @param {*} pyObj 
 * @param {*} start 
 * @param {*} end 
 * 
 * @private
 * 
 * @description
 * helper function for methods that adjust their start, end arguments with respect to
 * a python sequence type object
 */
Sk.builtin.slice.startEnd$wrt = function (pyObj, start, end) {
    const len = pyObj.sq$length();
    const msg = "slice indices must be integers or have an __index__ method";
    if (start === undefined || Sk.builtin.checkNone(start)) {
        start = 0;
    } else {
        start = Sk.misceval.asIndexSized(start, null, msg);
        if (start < 0) {
            start = start + len;
            if (start < 0) {
                start = 0;
            }
        }
    }

    if (end === undefined || Sk.builtin.checkNone(end)) {
        end = len;
    } else {
        end = Sk.misceval.asIndexSized(end, null, msg);
        if (end < 0) {
            end = end + len;
            if (end < 0) {
                end = 0;
            }
        } else if (end > len) {
            end = len;
        }
    }
    return { start: start, end: end };
};
