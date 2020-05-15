/**
 * @constructor
 * @param {Object} iterable
 * @param {number=} start
 * @extends Sk.builtin.object
 */
Sk.builtin.enumerate = function (iterable, start) {
    if (!(this instanceof Sk.builtin.enumerate)) {
        return new Sk.builtin.enumerate(iterable, start);
    }
    this.$iterable = iterable;
    this.$index = start;
    return this;
};

Sk.exportSymbol("Sk.builtin.enumerate", Sk.builtin.enumerate);
Sk.abstr.setUpInheritance("enumerate", Sk.builtin.enumerate, Sk.builtin.object);

Sk.builtin.enumerate.prototype.tp$doc = "Return an enumerate object.\n\n  iterable\n    an object supporting iteration\n\nThe enumerate object yields pairs containing a count (from start, which\ndefaults to zero) and a value yielded by the iterable argument.\n\nenumerate is useful for obtaining an indexed list:\n    (0, seq[0]), (1, seq[1]), (2, seq[2]), ..."

Sk.builtin.enumerate.prototype.tp$new = function (args, kwargs) {
    args = Sk.abstr.copyKeywordsToNamedArgs(["iterable", "start"], args, kwargs, "enumerate");
    if (args[0] === undefined) {
        throw new Sk.builtin.TypeError("__new__() missing 1 required positional argument: 'iterable'");
    }
    const iterable = Sk.abstr.iter(args[0]);
    const start = args[1];
    if (start !== undefined) {
        if (!Sk.misceval.isIndex(start)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(start) + "' object cannot be interpreted as an index");
        } else {
            start = Sk.misceval.asIndex(start);
        }
    } else {
        start = 0;
    }
    if (this === Sk.builtin.enumerate.prototype) {
        return new Sk.builtin.enumerate(iterable, start);
    } else {
        const instance = new this.constructor;
        Sk.builtin.enumerate.call(instance, iterable, start);
        return instance;
    }
};

Sk.builtin.enumerate.prototype.tp$iter = function () {
    return this;
};

Sk.builtin.enumerate.prototype.tp$iternext = function () {
    var next = this.iterable.tp$iternext();
    if (next === undefined) {
        return undefined;
    }
    const idx = new Sk.builtin.int_(this.$index++);
    return new Sk.builtin.tuple([idx, next]);
};

/**
 * @constructor
 * @param {Object} iterable
 * @extends Sk.builtin.object
 */

Sk.builtin.filter_ = function filter_ (func, iterable) {
   this.func = func;
   this.iterable = iterable;
};

Sk.exportSymbol("Sk.builtin.filter_", Sk.builtin.filter_);
Sk.abstr.setUpInheritance("filter", Sk.builtin.filter_, Sk.builtin.object);

Sk.builtin.filter_.prototype.tp$doc = "Return an iterator yielding those items of iterable for which function(item)\nis true. If function is None, return the items that are true."

Sk.builtin.filter_.prototype.tp$new = function (args, kwargs) {
    args = Sk.abstr.copyKeywordsToNamedArgs(["predicate", "iterable"], args, kwargs, "filter");
    if (args[0] === undefined) {
        throw new Sk.builtin.TypeError("__new__() missing 2 required positional arguments: 'predicate' and 'iterable'");
    } else if (args[1] === undefined) {
        throw new Sk.builtin.TypeError("__new__() missing 1 required positional argument: 'iterable'");
    }
    const func = Sk.builtin.checkNone(args[0]) ? null : args[0];
    const iterable = Sk.abstr.iter(args[1]);
    // in theory you could subclass
    if (this === Sk.builtin.filter.prototype) {
        return new Sk.builtin.filter(func, iterable);
    } else {
        const instance = new this.constructor;
        Sk.builtin.filter.call(instance, func, iterable);
        return instance;
    }
};

Sk.builtin.filter_.prototype.tp$iter = function () {
    return this;
};

Sk.builtin.filter_.prototype.tp$iternext = function () {
    const next = this.iterable.tp$iternext();
    if (next === undefined) {
        return undefined;
    }
    const res = this.func === null ? next : Sk.misceval.callsimArray(this.func, [next]);
    if (Sk.misceval.isTrue(res)) {
        return next;
    } else {
        return this.tp$iternext();
    }
};


