/** @typedef {Sk.builtin.object} */ var pyObject;

/**
 * @constructor
 * @param {pyObject} iterable
 * @param {number|string=} start
 * @extends Sk.builtin.object
 */
Sk.builtin.enumerate = Sk.abstr.buildIteratorClass("enumerate", {
    constructor: function enumerate(iterable, start) {
        if (!(this instanceof Sk.builtin.enumerate)) {
            throw TypeError("Failed to construct 'enumerate': Please use the 'new' operator");
        }
        this.$iterable = iterable;
        this.$index = start;
        return this;
    },
    iternext: function (canSuspend) {
        const ret = Sk.misceval.chain(this.$iterable.tp$iternext(canSuspend), (next) => {
            if (next === undefined) {
                return undefined;
            }
            return new Sk.builtin.tuple([new Sk.builtin.int_(this.$index++), next]);
        });
        return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
    },
    slots: {
        tp$doc:
            "Return an enumerate object.\n\n  iterable\n    an object supporting iteration\n\nThe enumerate object yields pairs containing a count (from start, which\ndefaults to zero) and a value yielded by the iterable argument.\n\nenumerate is useful for obtaining an indexed list:\n    (0, seq[0]), (1, seq[1]), (2, seq[2]), ...",
        tp$new: function (args, kwargs) {
            let [iterable, start] = Sk.abstr.copyKeywordsToNamedArgs("enumerate", ["iterable", "start"], args, kwargs, [new Sk.builtin.int_(0)]);
            iterable = Sk.abstr.iter(iterable);
            start = Sk.misceval.asIndexOrThrow(start);
            if (this === Sk.builtin.enumerate.prototype) {
                return new Sk.builtin.enumerate(iterable, start);
            } else {
                const instance = new this.constructor();
                Sk.builtin.enumerate.call(instance, iterable, start);
                return instance;
            }
        },
    },
});
Sk.exportSymbol("Sk.builtin.enumerate", Sk.builtin.enumerate);

/**
 * @constructor
 * @param {pyObject} func
 * @param {pyObject} iterable
 * @extends Sk.builtin.object
 */
Sk.builtin.filter_ = Sk.abstr.buildIteratorClass("filter", {
    constructor: function filter_(func, iterable) {
        this.$func = func;
        this.$iterable = iterable;
    },
    iternext: function (canSuspend) {
        const ret = Sk.misceval.iterFor(this.$iterable, (i) => {
            return Sk.misceval.chain(this.check$filter(i), (i) => i ? new Sk.misceval.Break(i) : undefined);
        });
        return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
    },
    slots: {
        tp$doc:
            "Return an iterator yielding those items of iterable for which function(item)\nis true. If function is None, return the items that are true.",
        tp$new: function (args, kwargs) {
            let [func, iterable] = Sk.abstr.copyKeywordsToNamedArgs("filter", ["predicate", "iterable"], args, kwargs, []);
            func = Sk.builtin.checkNone(func) ? null : func;
            iterable = Sk.abstr.iter(iterable);
            // in theory you could subclass
            if (this === Sk.builtin.filter_.prototype) {
                return new Sk.builtin.filter_(func, iterable);
            } else {
                const instance = new this.constructor();
                Sk.builtin.filter_.call(instance, func, iterable);
                return instance;
            }
        },
    },
    proto: {
        check$filter: function (item) {
            let res;
            if (this.$func === null) {
                res = item;
            } else {
                res = Sk.misceval.callsimOrSuspendArray(this.$func, [item]);
            }
            return Sk.misceval.chain(res, (ret) => Sk.misceval.isTrue(ret) ? item : undefined);
        },
    },
});

Sk.exportSymbol("Sk.builtin.filter_", Sk.builtin.filter_);

/**
 * @constructor
 * @param {Object} seq
 * @extends Sk.builtin.object
 */
Sk.builtin.reversed = Sk.abstr.buildIteratorClass("reversed", {
    constructor: function reversed(seq) {
        this.idx = seq.sq$length() - 1;
        this.seq = seq;
        return this;
    },
    iternext: function () {
        if (this.idx < 0) {
            return undefined;
        }
        try {
            const i = new Sk.builtin.int_(this.idx);
            const next = Sk.abstr.objectGetItem(this.seq, i);
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
    },
    slots: {
        tp$doc: "Return a reverse iterator over the values of the given sequence.",
        tp$new: function (args, kwargs) {
            if (this === Sk.builtin.reversed.prototype) {
                Sk.abstr.checkNoKwargs("reversed", kwargs);
            }
            Sk.abstr.checkArgsLen("reversed", args, 1, 1);
            let seq = args[0];
            const special = Sk.abstr.lookupSpecial(seq, Sk.builtin.str.$reversed);
            if (special !== undefined) {
                return Sk.misceval.callsimArray(special, [seq]);
            } else if (!Sk.builtin.checkSequence(seq) || Sk.abstr.lookupSpecial(seq, Sk.builtin.str.$len) === undefined) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not a sequence");
            }
            if (this === Sk.builtin.reversed.prototype) {
                return new Sk.builtin.reversed(seq);
            } else {
                const instance = new this.constructor();
                Sk.builtin.reversed.call(instance, seq);
                return instance;
            }
        },
    },
    methods: {
        __length_hint__: {
            $meth: function __length_hint__(self) {
                return self.idx >= 0 ? new Sk.builtin.int_(self.idx) : new Sk.builtin.int_(0);
            },
            $flags: { NoArgs: true },
        },
    },
});

/**
 * @constructor
 * @param {Array} JS Array of iterator objects
 * @extends Sk.builtin.object
 */
Sk.builtin.zip_ = Sk.abstr.buildIteratorClass("zip", {
    constructor: function zip_(iters) {
        this.iters = iters;
        return this;
    },
    iternext: function () {
        if (this.iters.length === 0) {
            return undefined;
        }
        const tup = [];
        for (let i = 0; i < this.iters.length; i++) {
            const next = this.iters[i].tp$iternext();
            if (next === undefined) {
                return undefined;
            }
            tup.push(next);
        }
        return new Sk.builtin.tuple(tup);
    },
    slots: {
        tp$doc:
            "zip(iter1 [,iter2 [...]]) --> zip object\n\nReturn a zip object whose .__next__() method returns a tuple where\nthe i-th element comes from the i-th iterable argument.  The .__next__()\nmethod continues until the shortest iterable in the argument sequence\nis exhausted and then it raises StopIteration.",
        tp$new: function (args, kwargs) {
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
                const instance = new this.constructor();
                Sk.builtin.zip_.call(instance, iters);
                return instance;
            }
        },
    },
});
Sk.exportSymbol("Sk.builtin.zip_", Sk.builtin.zip_);

/**
 * @constructor
 * @param {Sk.builtin.func} func
 * @param {Array} array of iterators
 * @extends Sk.builtin.object
 */
Sk.builtin.map_ = Sk.abstr.buildIteratorClass("map", {
    constructor: function map_(func, iters) {
        this.func = func;
        this.iters = iters;
        return this;
    },
    iternext: function () {
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
    },
    slots: {
        tp$doc:
            "map(func, *iterables) --> map object\n\nMake an iterator that computes the function using arguments from\neach of the iterables.  Stops when the shortest iterable is exhausted.",
        tp$new: function (args, kwargs) {
            if (this === Sk.builtin.map_.prototype) {
                Sk.abstr.checkNoKwargs("map", kwargs);
            }
            Sk.abstr.checkArgsLen("map", args, 2);
            const func = args[0];
            const iters = [];
            for (let i = 1; i < args.length; i++) {
                iters.push(Sk.abstr.iter(args[i]));
            }
            if (this === Sk.builtin.map_.prototype) {
                return new Sk.builtin.map_(func, iters);
            } else {
                const instance = new this.constructor();
                Sk.builtin.map_.call(instance, func, iters);
                return instance;
            }
        },
    },
});

Sk.exportSymbol("Sk.builtin.map_", Sk.builtin.map_);
