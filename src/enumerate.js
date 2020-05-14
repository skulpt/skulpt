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


    return this;
};

Sk.abstr.setUpInheritance("enumerate", Sk.builtin.enumerate, Sk.builtin.object);

Sk.builtin.enumerate.prototype.tp$doc = "Return an enumerate object.\n\n  iterable\n    an object supporting iteration\n\nThe enumerate object yields pairs containing a count (from start, which\ndefaults to zero) and a value yielded by the iterable argument.\n\nenumerate is useful for obtaining an indexed list:\n    (0, seq[0]), (1, seq[1]), (2, seq[2]), ..."

Sk.builtin.enumerate.prototype.tp$new = function (args, kwargs) {
    if (kwargs) {
        for (let i = 1; i < kwargs.length ; i += 2) {
            args.push(kwargs[i]);
        }
        if (kwargs.length && kwargs[0] !== "start") {
                throw new Sk.builtin.TypeError("'" + kwargs[0] + "' is an invalid keyword argument for enumerate()")
            }
    }
    if (args.length > 2) {
        throw new Sk.builtin.TypeError("enumerate() takes at most 2 arguments ("+args.length+" given)")
    }
    const iterable = args[0];
    const start = args[1];
    if (this === Sk.builtin.enumerate.prototype) {
        return new Sk.builtin.enumerate(iterable, start);
    } else {
        const instance = new this.constructor;
        Sk.builtin.enumerate.call(instance, iterable, start);
        return instance;
    }    
};



Sk.builtin.enumerate.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    return self.tp$iter();
});

Sk.builtin.enumerate.prototype.next$ = function (self) {
    return self.tp$iternext();
};
Sk.builtin.enumerate.co_varnames = ["iterable", "start"];
Sk.builtin.enumerate.co_argcount = 2;
Sk.builtin.enumerate.$defaults = [Sk.builtin.none.none$,0];
Sk.builtin.enumerate.co_name = Sk.builtin.str("enumerate");

Sk.builtin.enumerate.prototype["$r"] = function () {
    return new Sk.builtin.str("<enumerate object>");
};
