/**
 * @constructor
 * @param {Object} iterable
 * @param {number=} start
 * @extends Sk.builtin.object
 */
Sk.builtin.enumerate = function (iterable, start) {
    var it;
    if (!(this instanceof Sk.builtin.enumerate)) {
        return new Sk.builtin.enumerate(iterable, start);
    }


    Sk.builtin.pyCheckArgs("enumerate", arguments, 1, 2);
    if (!Sk.builtin.checkIterable(iterable)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
    }
    if (start !== undefined) {
        if (!Sk.misceval.isIndex(start)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(start) + "' object cannot be interpreted as an index");
        } else {
            start = Sk.misceval.asIndex(start);
        }
    } else {
        start = 0;
    }

    it = iterable.tp$iter();

    this.tp$iter = function () {
        return this;
    };
    this.$index = start;
    this.tp$iternext = function () {
        // todo; StopIteration
        var idx;
        var next = it.tp$iternext();
        if (next === undefined) {
            return undefined;
        }
        idx = new Sk.builtin.int_(this.$index++);
        return new Sk.builtin.tuple([idx, next]);
    };

    this.__class__ = Sk.builtin.enumerate;

    return this;
};

Sk.abstr.setUpInheritance("enumerate", Sk.builtin.enumerate, Sk.builtin.object);

Sk.builtin.enumerate.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.enumerate.prototype["next"] = new Sk.builtin.func(function (self) {
    return self.tp$iternext();
});

Sk.builtin.enumerate.prototype["$r"] = function () {
    return new Sk.builtin.str("<enumerate object>");
};
