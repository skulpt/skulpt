/**
 * @constructor
 * @param {number} start
 * @param {number} stop
 * @param {number} step
 * @param {Object} lst
 */
Sk.builtin.range_ = Sk.abstr.buildNativeClass("range", {
    constructor: function range(start, stop, step, lst) {
        this.start = start;
        this.stop = stop;
        this.step = step;
        this.v = lst;
    },
    slots: {
        tp$getattr: Sk.generic.getAttr,
        tp$as_sequence_or_mapping: true,
        tp$doc:
            "range(stop) -> range object\nrange(start, stop[, step]) -> range object\n\nReturn an object that produces a sequence of integers from start (inclusive)\nto stop (exclusive) by step.  range(i, j) produces i, i+1, i+2, ..., j-1.\nstart defaults to 0, and stop is omitted!  range(4) produces 0, 1, 2, 3.\nThese are exactly the valid indices for a list of 4 elements.\nWhen step is given, it specifies the increment (or decrement).",
        tp$new(args, kwargs) {
            Sk.abstr.checkNoKwargs("range", kwargs);
            Sk.abstr.checkArgsLen("range", args, 1, 3);
            return rangeFromPy(args[0], args[1], args[2]);
        },
        $r() {
            let repr = "range(" + this.start + ", " + this.stop;
            if (this.step != 1) {
                repr += ", " + this.step;
            }
            repr += ")";
            return new Sk.builtin.str(repr);
        },
        tp$richcompare(w, op) {
            if ((op !== "Eq" && op !== "NotEq") || w.ob$type !== Sk.builtin.range_) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            w = new Sk.builtin.list(w.v);
            return new Sk.builtin.list(this.v).tp$richcompare(w, op);
        },
        tp$iter() {
            return new range_iter_(this);
        },
        nb$bool() {
            return this.v.length !== 0;
        },
        // sequence and mapping slots
        sq$contains(item) {
            const lst = this.v;
            for (let i = 0; i < lst.length; i++) {
                if (Sk.misceval.richCompareBool(item, lst[i], "Eq")) {
                    return true;
                }
            }
            return false;
        },
        sq$length() {
            return this.v.length;
        },
        mp$subscript(index) {
            if (Sk.misceval.isIndex(index)) {
                let i = Sk.misceval.asIndexSized(index);
                if (i < 0) {
                    i = this.v.length + i;
                }
                if (i < 0 || i >= this.v.length) {
                    throw new Sk.builtin.IndexError("range object index out of range");
                }
                return this.v[i];
            } else if (index.constructor === Sk.builtin.slice) {
                const ret = [];
                const lst = this.v;
                index.sssiter$(lst.length, (i) => {
                    ret.push(lst[i]);
                });
                let { start, stop, step } = index.slice$indices(lst.length);
                start = Sk.misceval.asIndex(lst[start]) || this.start;
                stop = Sk.misceval.asIndex(lst[stop]) || this.stop;
                if (typeof this.step === "number") {
                    step = step * this.step;
                } else {
                    step = JSBI.multiply(this.step, JSBI.BigInt(step));
                }
                return new Sk.builtin.range_(start, stop, step, ret);
            }
            throw new Sk.builtin.TypeError("range indices must be integers or slices, not " + Sk.abstr.typeName(index));
        },
    },
    getsets: {
        start: {
            $get() {
                return new Sk.builtin.int_(this.start);
            },
        },
        step: {
            $get() {
                return new Sk.builtin.int_(this.step);
            },
        },
        stop: {
            $get() {
                return new Sk.builtin.int_(this.stop);
            },
        },
    },
    methods: {
        __reversed__: {
            $meth() {
                return new reverserange_iter_(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Return a reverse iterator.",
        },
        // __reduce__: {
        //     $meth: methods.__reduce__,
        //     $flags:{},
        //     $textsig: null,
        //     $doc: "" },
        count: {
            $meth(item) {
                let count = 0;
                for (let i = 0; i < this.v.length; i++) {
                    if (Sk.misceval.richCompareBool(item, this.v[i], "Eq")) {
                        count++;
                    }
                }
                return new Sk.builtin.int_(count);
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "rangeobject.count(value) -> integer -- return number of occurrences of value",
        },
        index: {
            $meth(item) {
                for (let i = 0; i < this.v.length; i++) {
                    if (Sk.misceval.richCompareBool(item, this.v[i], "Eq")) {
                        return new Sk.builtin.int_(i);
                    }
                }
                throw new Sk.builtin.ValueError(Sk.misceval.objectRepr(item) + "is not in range");
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "rangeobject.index(value, [start, [stop]]) -> integer -- return index of value.\nRaise ValueError if the value is not present.",
        },
    },
    proto: {
        sk$asarray() {
            return this.v.slice(0);
        },
    },
    flags: {
        sk$acceptable_as_base_class: false,
    },
});

function rangeFromPy(start, stop, step) {
    start = start === undefined ? start : Sk.misceval.asIndexOrThrow(start);
    stop = stop === undefined ? stop : Sk.misceval.asIndexOrThrow(stop);
    step = step === undefined ? step : Sk.misceval.asIndexOrThrow(step);
    if (stop === undefined && step === undefined) {
        stop = start;
        start = 0;
        step = 1;
    } else if (step === undefined) {
        step = 1;
    } else if (step === 0) {
        throw new Sk.builtin.ValueError("range() step argument must not be zero");
    }
    const ret = [];
    if (typeof start === "number" && typeof stop === "number" && typeof step === "number") {
        if (step > 0) {
            for (let i = start; i < stop; i += step) {
                ret.push(new Sk.builtin.int_(i));
            }
        } else {
            for (let i = start; i > stop; i += step) {
                ret.push(new Sk.builtin.int_(i));
            }
        }
    } else {
        // This is going to be slow
        let i;
        start = i = JSBI.BigInt(start);
        step = JSBI.BigInt(step);
        stop = JSBI.BigInt(stop);
        if (JSBI.greaterThan(step, JSBI.__ZERO)) {
            while (JSBI.lessThan(i, stop)) {
                ret.push(new Sk.builtin.int_(convertIfSafe(i)));
                i = JSBI.add(i, step);
            }
        } else {
            while (JSBI.greaterThan(i, stop)) {
                ret.push(new Sk.builtin.int_(convertIfSafe(i)));
                i = JSBI.add(i, step);
            }
        }
        start = convertIfSafe(start);
        step = convertIfSafe(step);
        stop = convertIfSafe(stop);
    }
    return new Sk.builtin.range_(start, stop, step, ret);
}

var range_iter_ = Sk.abstr.buildIteratorClass("range_iterator", {
    constructor: function range_iter_(range_obj) {
        this.$index = 0;
        this.$seq = range_obj.v;
    },
    iternext() {
        return this.$seq[this.$index++];
        // we could check that the index is not outside of range
        // but it will still return undefined so no need?
    },
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});

var reverserange_iter_ = Sk.abstr.buildIteratorClass("range_reverseiterator", {
    constructor: function range_iter(range_obj) {
        this.$seq = range_obj.v;
        this.$index = this.$seq.length - 1;
    },
    iternext() {
        return this.$seq[this.$index--];
    },
    methods: {
        __length_hint__: Sk.generic.iterReverseLengthHintMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});

function convertIfSafe(v) {
    if (JSBI.lessThan(v, JSBI.__MAX_SAFE) && JSBI.greaterThan(v, JSBI.__MIN_SAFE)) {
        return JSBI.toNumber(v);
    }
    return v;
}

/**
 *
 * @description
 * Python 2 implementations of range and xrange
 *
 * @param {*} start
 * @param {*} stop
 * @param {*} step
 * @ignore
 */
Sk.builtin.range = Sk.builtin.xrange = function range(start, stop, step) {
    const ret = rangeFromPy(start, stop, step);
    return new Sk.builtin.list(ret.v);
};
