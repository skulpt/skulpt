/**
 * @constructor
 * @param {Object} iterable
 * @param {number=} start
 * @extends Sk.builtin.object
 */
Sk.builtin.enumerate = function enumerate (iterable, start) {
    if (!(this instanceof Sk.builtin.enumerate)) {
        return new Sk.builtin.enumerate(iterable, start);
    }
    this.$iterable = iterable;
    this.$index = start;
    return this;
};
Sk.abstr.setUpInheritance("enumerate", Sk.builtin.enumerate, Sk.builtin.object);
Sk.exportSymbol("Sk.builtin.enumerate", Sk.builtin.enumerate);

Sk.builtin.enumerate.prototype.tp$doc = "Return an enumerate object.\n\n  iterable\n    an object supporting iteration\n\nThe enumerate object yields pairs containing a count (from start, which\ndefaults to zero) and a value yielded by the iterable argument.\n\nenumerate is useful for obtaining an indexed list:\n    (0, seq[0]), (1, seq[1]), (2, seq[2]), ..."

Sk.builtin.enumerate.prototype.tp$new = function (args, kwargs) {
    args = Sk.abstr.copyKeywordsToNamedArgs("enumerate",["iterable", "start"], args, kwargs);
    if (args[0] === undefined) {
        throw new Sk.builtin.TypeError("__new__() missing 1 required positional argument: 'iterable'");
    }
    const iterable = Sk.abstr.iter(args[0]);
    let start = args[1];
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

Sk.builtin.enumerate.prototype.tp$iternext = function (canSuspend) {
    var next = this.$iterable.tp$iternext(canSuspend);
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
Sk.abstr.setUpInheritance("filter", Sk.builtin.filter_, Sk.builtin.object);
Sk.exportSymbol("Sk.builtin.filter_", Sk.builtin.filter_);

Sk.builtin.filter_.prototype.tp$doc = "Return an iterator yielding those items of iterable for which function(item)\nis true. If function is None, return the items that are true."

Sk.builtin.filter_.prototype.tp$new = function (args, kwargs) {
    args = Sk.abstr.copyKeywordsToNamedArgs("filter", ["predicate", "iterable"], args, kwargs);
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


/**
 * @constructor
 * @param {Object} seq
 * @extends Sk.builtin.object
 */
Sk.builtin.reversed = function reversed (seq) {
    this.idx = seq.sq$length() - 1;
    this.seq = seq;
    return this;
};
Sk.abstr.setUpInheritance("reversed", Sk.builtin.reversed, Sk.builtin.object);

Sk.builtin.reversed.prototype.tp$doc = "Return a reverse iterator over the values of the given sequence."

Sk.builtin.reversed.prototype.tp$new = function (args, kwargs) {
    if (this === Sk.builtin.reversed.prototype) {
        Sk.abstr.checkNoKwargs("reversed", kwargs);
    }
    Sk.abstr.checkArgsLen("reversed", args, 1, 1);
    let seq = args[0];
    const special = Sk.abstr.lookupSpecial(seq, Sk.builtin.str.$reversed);
    if (special !== undefined) {
        return Sk.misceval.callsimArray(special, [seq]);
    } else if (!Sk.builtin.checkSequence(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not a sequence");
    }
    if (this === Sk.builtin.reversed.prototype) {
        return new Sk.builtin.reversed(seq);
    } else {
        const instance = new this.constructor;
        Sk.builtin.reversed.call(instance, seq);
        return instance;
    }
};

Sk.builtin.reversed.prototype.tp$iternext = function () {
    if (this.idx < 0) {
        return undefined;
    }
    try {
        const i = Sk.misceval.asIndex(this.idx);
        const next = Sk.abstr.sequenceGetItem(this.seq, i);
        this.idx--;
        return next;
    } catch (e) {
        if (e instanceof Sk.builtin.IndexError) {
            this.idx = -1;
            return undefined;
        } else {
            throw e;
        }
    }
};

Sk.builtin.reversed.prototype.tp$methods = {
    __length_hint__: {
        $meth: function __length_hint__ (self) {
            return self.idx >= 0 ? Sk.builtin.int_(self.idx) : Sk.builtin.int_(0);
        },
        $flags: {NoArgs: true}
    }
}

/**
 * @constructor
 * @param {Array} JS Array of iterator objects
 * @extends Sk.builtin.object
 */
Sk.builtin.zip_ = function zip_ (iters) {
    this.iters = iters;
    return this;
};
Sk.abstr.setUpInheritance("zip", Sk.builtin.zip_, Sk.builtin.object);

Sk.exportSymbol("Sk.builtin.zip_", Sk.builtin.zip_);

Sk.builtin.zip_.prototype.tp$doc = "zip(iter1 [,iter2 [...]]) --> zip object\n\nReturn a zip object whose .__next__() method returns a tuple where\nthe i-th element comes from the i-th iterable argument.  The .__next__()\nmethod continues until the shortest iterable in the argument sequence\nis exhausted and then it raises StopIteration."


Sk.builtin.zip_.prototype.tp$new = function (args, kwargs) {
    if (this === Sk.builtin.zip_.prototype) {
        Sk.abstr.checkNoKwargs("zip", kwargs);
    } 
    const iters = [];
    for (let i = 0; i < args.length; i++) {
        try {
            iters.push(Sk.abstr.iter(args[i]));
        } catch (e) {
            if (e instanceof Sk.builtin.TypeError) {
                throw new Sk.builtin.TypeError("zip argument #" + (i + 1) + " must support iteration");         
            } else {
                throw e;
            }
        }
    }
    if (this === Sk.builtin.zip_.prototype) {
        return new Sk.builtin.zip_(iters);
    } else {
        const instance = new this.constructor;
        Sk.builtin.zip_.call(instance, iters);
        return instance;
    }
};


Sk.builtin.zip_.prototype.tp$iternext = function () {
    if (this.iters.length === 0) {
        return undefined;
    }
    const tup = [];
    for (i = 0; i < this.iters.length; i++) {
        next = this.iters[i].tp$iternext();
        if (next === undefined) {
            return undefined;
        }
        tup.push(next);
    }
    return new Sk.builtin.tuple(tup);
};


/**
 * @constructor
 * @param {Sk.builtin.func} func
 * @param {Array} array of iterators
 * @extends Sk.builtin.object
 */
Sk.builtin.map_ = function map_ (func, iters) {
    this.func = func;
    this.iters = iters;
    return this;
};
Sk.abstr.setUpInheritance("map", Sk.builtin.map_, Sk.builtin.object);

Sk.exportSymbol("Sk.builtin.map_", Sk.builtin.map_);

Sk.builtin.map_.prototype.tp$doc = "map(func, *iterables) --> map object\n\nMake an iterator that computes the function using arguments from\neach of the iterables.  Stops when the shortest iterable is exhausted."

Sk.builtin.map_.prototype.tp$new = function (args, kwargs) {
    if (this === Sk.builtin.map_.prototype) {
        Sk.abstr.checkNoKwargs("map", kwargs);
    }
    Sk.abstr.checkArgsLen("map", args, 2);
    const func = args[0];
    const iters = [];
    for (let i=1; i < args.length; i++) {
        iters.push(Sk.abstr.iter(args[i]));
    }
    if (this === Sk.builtin.map_.prototype) {
        return new Sk.builtin.map_(func, iters);
    } else {
        const instance = new this.constructor;
        Sk.builtin.map_.call(instance, func, iters);
        return instance;
    } 
};

Sk.builtin.map_.prototype.tp$iternext = function () {
    const args = [];
    let next;
    for (let i = 0; i < this.iters.length; i++) {
        next = this.iters[i].tp$iternext();
        if (next === undefined) {
            return undefined;
        }
        args.push(next);
    }
    return Sk.misceval.callsimArray(this.func, args);
};


