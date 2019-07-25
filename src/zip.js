/**
 * @constructor
 * @param {Object} iterable
 * @extends Sk.builtin.object
 */
Sk.builtin.zip_ = function zip_ () {
    var i;
    var iters;
    var next;
    if (!(this instanceof Sk.builtin.zip_)) {
        return new Sk.builtin.zip_(...arguments);
    }
    if (arguments.length === 0) {
        return new Sk.builtin.zip_(new Sk.builtin.list([]));
    }
    iters = [];
    for (i = 0; i < arguments.length; i++) {
        try {
            iters.push(Sk.abstr.iter(arguments[i]));
        } catch (e) {
            if (e instanceof Sk.builtin.TypeError) {
                throw new Sk.builtin.TypeError("zip argument #" + (i + 1) + " must support iteration");         
            } else {
                throw e;
            }
        }
    }

    this.tp$iter = function () {
        return this;
    };

    this.tp$iternext = function () {
        var tup = [];
        for (i = 0; i < iters.length; i++) {
            next = iters[i].tp$iternext();
            if (next === undefined) {
                return undefined;
            }
            tup.push(next);
        }
        return new Sk.builtin.tuple(tup);
    };
    this.__class__ = Sk.builtin.zip_;

    return this;
};

Sk.abstr.setUpInheritance("zip", Sk.builtin.zip_, Sk.builtin.object);

Sk.builtin.zip_.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.zip_.prototype.next$ = function (self) {
    return self.tp$iternext();
};

Sk.builtin.zip_.prototype["$r"] = function () {
    return new Sk.builtin.str("<zip object>");
};

Sk.exportSymbol("Sk.builtin.zip_", Sk.builtin.zip_);