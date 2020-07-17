/**
 * @constructor
 * @param {number} start
 * @param {number} stop
 * @param {number} step
 * @param {Object} lst
 */
Sk.builtin.range_ = function (start, stop, step, lst) {
    if (!(this instanceof Sk.builtin.range_)) {
        return new Sk.builtin.range_(start, stop, step, lst);
    }

    this.v = lst;
    this.$start = start;
    this.$stop = stop;
    this.$step = step;

    this.$r = function () {
        var name = "range(" + this.$start + ", " + this.$stop;
        if (this.$step != 1) {
            name += ", " + this.$step;
        }
        name += ")";
        return new Sk.builtin.str(name);
    };

    return this;
};

Sk.abstr.setUpInheritance("range", Sk.builtin.range_, Sk.builtin.object);

Sk.builtin.range_.prototype.__class__ = Sk.builtin.range_;

Sk.builtin.range_.prototype.mp$subscript = function (index) {
    var sub, start, stop, step;
    sub = this.v.mp$subscript(index);
    if (sub instanceof Sk.builtin.list) {
        if (Sk.builtin.checkNone(index.start)) {
            start = this.v.mp$subscript(new Sk.builtin.int_(0)).v;
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

Sk.builtin.range_.prototype.__getitem__ = new Sk.builtin.func(function (self, index) {
    return Sk.builtin.range_.prototype.mp$subscript.call(self, index);
});

Sk.builtin.range_.prototype.sq$contains = function (item) {
    return this.v.sq$contains(item);
};

Sk.builtin.range_.prototype.sq$length = function () {
    return this.v.sq$length();
};

Sk.builtin.range_.prototype.tp$richcompare = function (w, op) {
    if (w.__class__ == Sk.builtin.range_) {
        w = w.v;
    }
    return this.v.tp$richcompare(w, op);
};

Sk.builtin.range_.prototype.tp$iter = function () {
    // Hijack the list iterator
    var iter = this.v.tp$iter();
    iter.$r = function () {
        return new Sk.builtin.str("<rangeiterator>");
    };
    return iter;
};

Sk.builtin.range_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 1, 1);
    return self.tp$iter();
});

Sk.builtin.range_.prototype.__contains__ = new Sk.builtin.func(function (self, item) {
    Sk.builtin.pyCheckArgsLen("__contains__", arguments.length, 2, 2);
    return new Sk.builtin.bool(self.sq$contains(item));
});

Sk.builtin.range_.prototype["index"] = new Sk.builtin.func(function (self, item, start, stop) {
    Sk.builtin.pyCheckArgsLen("index", arguments.length, 2, 4);
    return Sk.misceval.callsimArray(self.v.index, [self.v, item, start, stop]);
});

Sk.builtin.range_.prototype["count"] = new Sk.builtin.func(function (self, item) {
    Sk.builtin.pyCheckArgsLen("count", arguments.length, 2, 2);
    return Sk.misceval.callsimArray(self.v.count, [self.v, item]);
});
