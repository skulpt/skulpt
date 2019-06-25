/**
 * @constructor
 * @param {Object} iterable
 * @param {number=} start
 * @extends Sk.builtin.object
 */
Sk.builtin.zip = function zip () {
    var i;
    var iters;
    var next;
    var args;
    if (!(this instanceof Sk.builtin.zip) && (Sk.__future__.python_version)) {
        return new Sk.builtin.zip(...arguments);
    }
    if (arguments.length === 0) {
        return new Sk.builtin.zip(Sk.builtin.list([]));
    }
    iters = [];
    for (i = 0; i < arguments.length; i++) {
        if (Sk.builtin.checkIterable(arguments[i])) {
            iters.push(Sk.abstr.iter(arguments[i]));
        } else {
            throw new Sk.builtin.TypeError("argument " + i + " must support iteration");
        }
    }
    if (!(Sk.__future__.python_version)) {
        var res;
        var done;
        var el;
        var tup;
        res = [];
        done = false;
        while (!done) {
            tup = [];
            for (i = 0; i < arguments.length; i++) {
                el = iters[i].tp$iternext();
                if (el === undefined) {
                    done = true;
                    break;
                }
                tup.push(el);
            }
            if (!done) {
                res.push(new Sk.builtin.tuple(tup));
            }
        }
        return new Sk.builtin.list(res);
    } else {
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
        this.__class__ = Sk.builtin.zip;

        return this;
    }
};

Sk.abstr.setUpInheritance("zip", Sk.builtin.zip, Sk.builtin.object);

Sk.builtin.zip.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.zip.prototype.next$ = function (self) {
    return self.tp$iternext();
};

Sk.builtin.zip.prototype["$r"] = function () {
    return new Sk.builtin.str("<zip object>");
};
