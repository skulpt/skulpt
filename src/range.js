/**
 * @constructor
 * @param {number} start
 * @param {number} stop
 * @param {number} step
 * @param {Object} lst
 */
Sk.builtin.range_ = function (start, stop, step, lst) {
    this.v = lst;
    this.$start = start;
    this.$stop = stop;
    this.$step = step;
};

Sk.abstr.setUpInheritance("range", Sk.builtin.range_, Sk.builtin.object);
Sk.builtin.range_.sk$acceptable_as_base_class = false;
Sk.builtin.range_.prototype.tp$as_sequence_or_mapping = true;

Sk.builtin.range_.prototype.tp$doc =
    "range(stop) -> range object\nrange(start, stop[, step]) -> range object\n\nReturn an object that produces a sequence of integers from start (inclusive)\nto stop (exclusive) by step.  range(i, j) produces i, i+1, i+2, ..., j-1.\nstart defaults to 0, and stop is omitted!  range(4) produces 0, 1, 2, 3.\nThese are exactly the valid indices for a list of 4 elements.\nWhen step is given, it specifies the increment (or decrement).";

Sk.builtin.range_.prototype.tp$new = function (args, kwargs) {
    if (kwargs && kwargs.length) {
        throw new Sk.builtin.TypeError("range() takes no keyword arguments");
    }
    return Sk.builtin.range(...args);
};

Sk.builtin.range_.prototype.$r = function () {
    let name = "range(" + this.$start + ", " + this.$stop;
    if (this.$step != 1) {
        name += ", " + this.$step;
    }
    name += ")";
    return new Sk.builtin.str(name);
};

Sk.builtin.range_.prototype.mp$subscript = function (index) {
    var sub, start, stop, step;
    sub = this.v.mp$subscript(index);
    if (sub instanceof Sk.builtin.list) {
        if (Sk.builtin.checkNone(index.start)) {
            start = this.v.mp$subscript(0).v;
        } else {
            try {
                start = this.v.mp$subscript(index.start).v;
            } catch (exc) {
                // start is before beginning of current range
                start = this.$start;
            }
        }

        try {
            stop = this.v.mp$subscript(index.stop).v;
        } catch (exc) {
            // stop is past end of current range
            stop = this.$stop;
        }

        if (Sk.builtin.checkNone(index.step)) {
            // Implied 1
            step = 1;
        } else {
            step = Sk.misceval.asIndex(index.step);
        }
        // Scale by range's current step
        step = step * this.$step;

        return new Sk.builtin.range_(start, stop, step, sub);
    }
    return sub;
};

Sk.builtin.range_.prototype.sq$contains = function (item) {
    return this.v.sq$contains(item);
};

Sk.builtin.range_.prototype.sq$length = function () {
    return this.v.sq$length();
};

Sk.builtin.range_.prototype.tp$richcompare = function (w, op) {
    if (w.ob$type == Sk.builtin.range_) {
        w = w.v;
    }
    return this.v.tp$richcompare(w, op);
};

Sk.builtin.range_.prototype.tp$iter = function () {
    // Hijack the list iterator
    const iter = this.v.tp$iter();
    iter.tp$name = "range_iterator";
    return iter;
};

Sk.builtin.range_.prototype.tp$getsets = {
    start: {
        $get: function () {
            return new Sk.builtin.int_(this.$start);
        },
    },
    step: {
        $get: function () {
            return new Sk.builtin.int_(this.$step);
        },
    },
    stop: {
        $get: function () {
            return new Sk.builtin.int_(this.$stop);
        },
    },
};

Sk.builtin.range_.prototype.tp$methods = {
    // __reversed__: {
    //     $meth: function () {
    //         return Sk.misceval.callsimArray(this.v.__reversed__, []);
    //     },
    //     $flags:{NoArgs: true},
    //     $textsig: null,
    //     $doc: "Return a reverse iterator." },
    // __reduce__: {
    //     $meth: methods.__reduce__,
    //     $flags:{},
    //     $textsig: null,
    //     $doc: "" },
    count: {
        $meth: function (item) {
            return Sk.misceval.callsimArray(this.v.count, [this.v, item]);
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "rangeobject.count(value) -> integer -- return number of occurrences of value",
    },
    index: {
        $meth: function (item) {
            return Sk.misceval.callsimArray(this.v.index, [this.v, item]);
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "rangeobject.index(value, [start, [stop]]) -> integer -- return index of value.\nRaise ValueError if the value is not present.",
    },
};
