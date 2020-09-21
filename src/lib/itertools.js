/**
 * @todo subclassing incomplete for certain objects
 * those that take no kwargs should ignore kwargs if called by a subclass
 * probably little need to consider this for now - subclassing an itertools object would be rare...
 */

var $builtinmodule = function (name) {
    var mod = {};

    mod.accumulate = Sk.abstr.buildIteratorClass("itertools.accumulate", {
        constructor: function accumulate(iter, func, initial) {
            this.iter = iter;
            this.func = func;
            this.total = initial;
            // different initial iteration
            this.tp$iternext = () => {
                this.total = Sk.builtin.checkNone(this.total) ? this.iter.tp$iternext() : this.total;
                this.tp$iternext = this.constructor.prototype.tp$iternext;
                return this.total;
            };
        },
        iternext(canSuspend) {
            let element = this.iter.tp$iternext();
            if (element !== undefined) {
                this.total = Sk.misceval.callsimArray(this.func, [this.total, element]);
                return this.total;
            }
        },
        slots: {
            tp$doc:
                "accumulate(iterable[, func, initial]) --> accumulate object\n\nReturn series of accumulated sums (or other binary function results).",
            tp$new(args, kwargs) {
                // initial is a keyword only argument;
                Sk.abstr.checkArgsLen("accumulate", args, 0, 2);
                let [iter, func, initial] = Sk.abstr.copyKeywordsToNamedArgs("accumulate", ["iterable", "func", "initial"], args, kwargs, [
                    Sk.builtin.none.none$,
                    Sk.builtin.none.none$,
                ]);
                iter = Sk.abstr.iter(iter);
                func = Sk.builtin.checkNone(func) ? new Sk.builtin.func((a, b) => Sk.abstr.numberBinOp(a, b, "Add")) : func;
                if (this === mod.accumulate.prototype) {
                    return new mod.accumulate(iter, func, initial);
                } else {
                    const instance = new this.constructor();
                    mod.accumulate.call(instance, iter, func, initial);
                    return instance;
                }
            },
        },
    });

    mod.chain = Sk.abstr.buildIteratorClass("itertools.chain", {
        constructor: function chain(iterables) {
            this.iterables = iterables;
            this.current_it = null;
            this.tp$iternext = () => {
                // different initial iteration
                this.tp$iternext = this.constructor.prototype.tp$iternext;
                this.current_it = this.iterables.tp$iternext();
                if (this.current_it === undefined) {
                    this.tp$iternext = () => undefined;
                    return;
                }
                this.current_it = Sk.abstr.iter(this.current_it);
                return this.tp$iternext();
            };
        },
        iternext(canSuspend) {
            let element;
            while (element === undefined) {
                element = this.current_it.tp$iternext();
                if (element === undefined) {
                    this.current_it = this.iterables.tp$iternext();
                    if (this.current_it === undefined) {
                        this.tp$iternext = () => undefined;
                        return;
                    }
                    this.current_it = Sk.abstr.iter(this.current_it);
                } else {
                    return element;
                }
            }
        },
        slots: {
            tp$doc:
                "chain(*iterables) --> chain object\n\nReturn a chain object whose .__next__() method returns elements from the\nfirst iterable until it is exhausted, then elements from the next\niterable, until all of the iterables are exhausted.",
            tp$new(args, kwargs) {
                Sk.abstr.checkNoKwargs("chain", kwargs);
                args = new Sk.builtin.tuple(args.slice(0)).tp$iter();
                if (this === mod.chain.prototype) {
                    return new mod.chain(args);
                } else {
                    const instance = new this.constructor();
                    mod.chain.call(instance, args);
                    return instance;
                }
            },
        },
        classmethods: {
            from_iterable: {
                $meth(iterable) {
                    const iterables = Sk.abstr.iter(iterable);
                    return new mod.chain(iterables);
                },
                $flags: { OneArg: true },
                $doc:
                    "chain.from_iterable(iterable) --> chain object\n\nAlternate chain() constructor taking a single iterable argument\nthat evaluates lazily.",
                $textsig: null,
            },
        },
    });

    /**
     * Utility function for combinations and combinations_with_replacement
     * @param {Object} combinations_proto
     * @param {Array} args
     * @param {Array|undefined} kwargs
     */
    function combinationsNew(combinations_proto, args, kwargs) {
        let iterable, r;
        [iterable, r] = Sk.abstr.copyKeywordsToNamedArgs(combinations_proto.tp$name, ["iterable", "r"], args, kwargs, []);
        const pool = Sk.misceval.arrayFromIterable(iterable);
        r = Sk.misceval.asIndexSized(r, Sk.builtin.OverFlowError);
        if (r < 0) {
            throw new Sk.builtin.ValueError("r must be non-negative");
        }
        if (this === combinations_proto) {
            return new combinations_proto.constructor(pool, r);
        } else {
            const instance = new this.constructor();
            combinations_proto.constructor.call(instance, pool, r);
            return instance;
        }
    }

    mod.combinations = Sk.abstr.buildIteratorClass("itertools.combinations", {
        constructor: function combinations(pool, r) {
            this.pool = pool;
            this.r = r;
            this.indices = new Array(r).fill().map((_, i) => i);
            this.n = pool.length;
            this.tp$iternext = () => {
                if (this.r > this.n) {
                    return;
                }
                this.tp$iternext = this.constructor.prototype.tp$iternext;
                return new Sk.builtin.tuple(this.pool.slice(0, this.r));
            };
        },
        iternext(canSuspend) {
            let i,
                found = false;
            for (i = this.r - 1; i >= 0; i--) {
                if (this.indices[i] != i + this.n - this.r) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.r = 0;
                return;
            }
            this.indices[i]++;
            for (let j = i + 1; j < this.r; j++) {
                this.indices[j] = this.indices[j - 1] + 1;
            }
            const res = this.indices.map((i) => this.pool[i]);
            return new Sk.builtin.tuple(res);
        },
        slots: {
            tp$doc:
                "combinations(iterable, r) --> combinations object\n\nReturn successive r-length combinations of elements in the iterable.\n\ncombinations(range(4), 3) --> (0,1,2), (0,1,3), (0,2,3), (1,2,3)",
            tp$new(args, kwargs) {
                return combinationsNew.call(this, mod.combinations.prototype, args, kwargs);
            },
        },
    });

    mod.combinations_with_replacement = Sk.abstr.buildIteratorClass("itertools.combinations_with_replacement", {
        constructor: function combinations_with_replacement(pool, r) {
            this.pool = pool;
            this.r = r;
            this.indices = new Array(r).fill(0);
            this.n = pool.length;
            this.tp$iternext = () => {
                if (this.r && !this.n) {
                    return;
                }
                this.tp$iternext = this.constructor.prototype.tp$iternext;
                const res = this.indices.map((i) => this.pool[i]);
                return new Sk.builtin.tuple(res);
            };
        },
        iternext(canSuspend) {
            let found = false;
            let i;
            for (i = this.r - 1; i >= 0; i--) {
                if (this.indices[i] != this.n - 1) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                this.r = 0;
                return;
            }
            const val = this.indices[i] + 1;
            for (let j = i; j < this.r; j++) {
                this.indices[j] = val;
            }
            const res = this.indices.map((i) => this.pool[i]);
            return new Sk.builtin.tuple(res);
        },
        slots: {
            tp$doc:
                "combinations_with_replacement(iterable, r) --> combinations_with_replacement object\n\nReturn successive r-length combinations of elements in the iterable\nallowing individual elements to have successive repeats.\ncombinations_with_replacement('ABC', 2) --> AA AB AC BB BC CC",
            tp$new(args, kwargs) {
                return combinationsNew.call(this, mod.combinations_with_replacement.prototype, args, kwargs);
            },
        },
    });

    mod.compress = Sk.abstr.buildIteratorClass("itertools.compress", {
        constructor: function compress(data, selectors) {
            (this.data = data), (this.selectors = selectors);
        },
        iternext() {
            let d = this.data.tp$iternext();
            let s = this.selectors.tp$iternext();
            while (d !== undefined && s !== undefined) {
                if (Sk.misceval.isTrue(s)) {
                    return d;
                }
                d = this.data.tp$iternext();
                s = this.selectors.tp$iternext();
            }
        },
        slots: {
            tp$doc:
                "compress(data, selectors) --> iterator over selected data\n\nReturn data elements corresponding to true selector elements.\nForms a shorter iterator from selected data elements using the\nselectors to choose the data elements.",
            tp$new(args, kwargs) {
                let data, selectors;
                [data, selectors] = Sk.abstr.copyKeywordsToNamedArgs("compress", ["data", "selectors"], args, kwargs, []);
                data = Sk.abstr.iter(data);
                selectors = Sk.abstr.iter(selectors);
                if (this === mod.count.prototype) {
                    return new mod.compress(data, selectors);
                } else {
                    const instance = new this.constructor();
                    mod.compress.call(instance, data, selectors);
                    return instance;
                }
            },
        },
    });

    mod.count = Sk.abstr.buildIteratorClass("itertools.count", {
        constructor: function count(start, step) {
            this.start = start;
            this.step = step;
        },
        iternext() {
            const tmp = this.start;
            this.start = Sk.abstr.numberBinOp(this.start, this.step, "Add");
            return tmp;
        },
        slots: {
            tp$doc:
                "count(start=0, step=1) --> count object\n\nReturn a count object whose .__next__() method returns consecutive values.\nEquivalent to:\n\n    def count(firstval=0, step=1):\n        x = firstval\n        while 1:\n            yield x\n            x += step\n",
            tp$new(args, kwargs) {
                const [start, step] = Sk.abstr.copyKeywordsToNamedArgs("count", ["start", "step"], args, kwargs, [
                    new Sk.builtin.int_(0),
                    new Sk.builtin.int_(1),
                ]);
                if (!Sk.builtin.checkNumber(start) && !Sk.builtin.checkComplex(start)) {
                    throw new Sk.builtin.TypeError("a number is required");
                }
                if (!Sk.builtin.checkNumber(step) && !Sk.builtin.checkComplex(step)) {
                    throw new Sk.builtin.TypeError("a number is required");
                }
                if (this === mod.count.prototype) {
                    return new mod.count(start, step);
                } else {
                    const instance = new this.constructor();
                    mod.count.call(instance, start, step);
                    return instance;
                }
            },
            $r() {
                const start_repr = Sk.misceval.objectRepr(this.start);
                let step_repr = Sk.misceval.objectRepr(this.step);
                step_repr = step_repr === "1" ? "" : ", " + step_repr;
                return new Sk.builtin.str(Sk.abstr.typeName(this) + "(" + start_repr + step_repr + ")");
            },
        },
    });

    mod.cycle = Sk.abstr.buildIteratorClass("itertools.cycle", {
        constructor: function cycle(iter) {
            this.iter = iter;
            this.saved = [];
            this.consumed = false;
            this.i = 0;
            this.length;
        },
        iternext() {
            let element;
            if (!this.consumed) {
                element = this.iter.tp$iternext();
                if (element !== undefined) {
                    this.saved.push(element);
                    return element;
                } else {
                    this.consumed = true;
                    this.length = this.saved.length;
                    if (!this.length) {
                        return;
                    }
                }
            }
            element = this.saved[this.i];
            this.i = (this.i + 1) % this.length;
            return element;
        },
        slots: {
            tp$doc:
                "cycle(iterable) --> cycle object\n\nReturn elements from the iterable until it is exhausted.\nThen repeat the sequence indefinitely.",
            tp$new(args, kwargs) {
                Sk.abstr.checkOneArg("cycle", args, kwargs);
                const iter = Sk.abstr.iter(args[0]);
                if (this === mod.cycle.prototype) {
                    return new mod.cycle(iter);
                } else {
                    const instance = new this.constructor();
                    mod.cycle.call(instance, iter);
                    return instance;
                }
            },
        },
    });

    mod.dropwhile = Sk.abstr.buildIteratorClass("itertools.dropwhile", {
        constructor: function dropwhile(predicate, iter) {
            this.predicate = predicate;
            this.iter = iter;
            this.passed;
        },
        iternext() {
            let x = this.iter.tp$iternext();
            while (this.passed === undefined && x !== undefined) {
                const val = Sk.misceval.callsimArray(this.predicate, [x]);
                if (!Sk.misceval.isTrue(val)) {
                    this.passed = true;
                    return x;
                }
                x = this.iter.tp$iternext();
            }
            return x;
        },
        slots: {
            tp$doc:
                "dropwhile(predicate, iterable) --> dropwhile object\n\nDrop items from the iterable while predicate(item) is true.\nAfterwards, return every element until the iterable is exhausted.",
            tp$new(args, kwargs) {
                Sk.abstr.checkNoKwargs("dropwhile", kwargs);
                Sk.abstr.checkArgsLen("dropwhile", args, 2, 2);
                const predicate = args[0];
                const iter = Sk.abstr.iter(args[1]);
                if (this === mod.dropwhile.prototype) {
                    return new mod.dropwhile(predicate, iter);
                } else {
                    const instance = new this.constructor();
                    mod.dropwhile.call(instance, predicate, iter);
                    return instance;
                }
            },
        },
    });

    mod.filterfalse = Sk.abstr.buildIteratorClass("itertools.filterfalse", {
        constructor: function filterfalse(predicate, iter) {
            this.predicate = predicate;
            this.iter = iter;
        },
        iternext(canSuspend) {
            let x = this.iter.tp$iternext();
            if (x === undefined) {
                return;
            }
            let val = Sk.misceval.callsimArray(this.predicate, [x]);
            while (Sk.misceval.isTrue(val)) {
                x = this.iter.tp$iternext();
                if (x === undefined) {
                    return;
                }
                val = Sk.misceval.callsimArray(this.predicate, [x]);
            }
            return x;
        },
        slots: {
            tp$doc:
                "filterfalse(function or None, sequence) --> filterfalse object\n\nReturn those items of sequence for which function(item) is false.\nIf function is None, return the items that are false.",
            tp$new(args, kwargs) {
                Sk.abstr.checkNoKwargs("filterfalse", kwargs);
                Sk.abstr.checkArgsLen("filterfalse", args, 2, 2);
                const predicate = Sk.builtin.checkNone(args[0]) ? Sk.builtin.bool : args[0];
                const iter = Sk.abstr.iter(args[1]);
                if (this === mod.filterfalse.prototype) {
                    return new mod.filterfalse(predicate, iter);
                } else {
                    const instance = new this.constructor();
                    mod.filterfalse.call(instance, predicate, iter);
                    return instance;
                }
            },
        },
    });

    mod._grouper = Sk.abstr.buildIteratorClass("itertools._grouper", {
        constructor: function _grouper(groupby, id) {
            this.groupby = groupby;
            this.tgtkey = groupby.tgtkey;
            this.id = groupby.id;
        },
        iternext(canSuspend) {
            const compare = Sk.misceval.richCompareBool(this.groupby.currkey, this.tgtkey, "Eq");
            if (this.groupby.id === this.id && compare) {
                let tmp = this.groupby.currval;
                this.groupby.currval = this.groupby.iter.tp$iternext();
                if (this.groupby.currval !== undefined) {
                    this.groupby.currkey = Sk.misceval.callsimArray(this.groupby.keyf, [this.groupby.currval]);
                }
                return tmp;
            }
            return;
        },
    });

    mod.groupby = Sk.abstr.buildIteratorClass("itertools.groupby", {
        constructor: function groupby(iter, keyf) {
            this.iter = iter;
            this.keyf = keyf;
            this.currval;
            this.currkey = this.tgtkey = new Sk.builtin.object();
            this.id;
        },
        iternext(canSuspend) {
            this.id = new Object();
            let compare = Sk.misceval.richCompareBool(this.currkey, this.tgtkey, "Eq");
            while (compare) {
                this.currval = this.iter.tp$iternext();
                if (this.currval === undefined) {
                    return;
                }
                this.currkey = Sk.misceval.callsimArray(this.keyf, [this.currval]);
                compare = Sk.misceval.richCompareBool(this.currkey, this.tgtkey, "Eq");
            }
            this.tgtkey = this.currkey;
            const grouper = new mod._grouper(this);
            return new Sk.builtin.tuple([this.currkey, grouper]);
        },
        slots: {
            tp$doc:
                "groupby(iterable, key=None) -> make an iterator that returns consecutive\nkeys and groups from the iterable.  If the key function is not specified or\nis None, the element itself is used for grouping.\n",
            tp$new(args, kwargs) {
                let iter, key;
                [iter, key] = Sk.abstr.copyKeywordsToNamedArgs("groupby", ["iterable", "key"], args, kwargs, [Sk.builtin.none.none$]);
                iter = Sk.abstr.iter(iter);
                key = Sk.builtin.checkNone(key) ? new Sk.builtin.func((x) => x) : key;
                if (this === mod.groupby.prototype) {
                    return new mod.groupby(iter, key);
                } else {
                    const instance = new this.constructor();
                    mod.groupby.call(instance, iter, key);
                    return instance;
                }
            },
        },
    });

    mod.islice = Sk.abstr.buildIteratorClass("itertools.islice", {
        constructor: function islice(iter, start, stop, step) {
            this.iter = iter;
            this.previt = start;
            this.stop = stop;
            this.step = step;
            // different first iteration
            this.tp$iternext = () => {
                this.tp$iternext = this.constructor.prototype.tp$iternext;
                if (this.previt >= this.stop) {
                    // consume generator up to stop and return
                    for (let i = 0; i < this.stop; i++) {
                        this.iter.tp$iternext();
                    }
                    return;
                } else {
                    //conusme generator up to start and yield
                    for (let i = 0; i < this.previt; i++) {
                        this.iter.tp$iternext();
                    }
                    return this.iter.tp$iternext();
                }
            };
        },
        iternext(canSuspend) {
            if (this.previt + this.step >= this.stop) {
                // consume generator up to stop and return
                for (let i = this.previt + 1; i < this.stop; i++) {
                    this.previt += this.step;
                    this.iter.tp$iternext();
                }
                return;
            } else {
                // consume generator up to previt + step and yield
                for (let i = this.previt + 1; i < this.previt + this.step; i++) {
                    this.iter.tp$iternext();
                }
                this.previt += this.step;
                return this.iter.tp$iternext();
            }
        },
        slots: {
            tp$doc:
                "islice(iterable, stop) --> islice object\nislice(iterable, start, stop[, step]) --> islice object\n\nReturn an iterator whose next() method returns selected values from an\niterable.  If start is specified, will skip all preceding elements;\notherwise, start defaults to zero.  Step defaults to one.  If\nspecified as another value, step determines how many values are \nskipped between successive calls.  Works like a slice() on a list\nbut returns an iterator.",
            tp$new(args, kwargs) {
                Sk.abstr.checkNoKwargs("islice", kwargs);
                Sk.abstr.checkArgsLen("islice", args, 2, 4);
                const iter = Sk.abstr.iter(args[0]);
                let start = args[1],
                    stop = args[2],
                    step = args[3];
                if (stop === undefined) {
                    stop = start;
                    start = Sk.builtin.none.none$;
                    step = Sk.builtin.none.none$;
                } else if (step === undefined) {
                    step = Sk.builtin.none.none$;
                }

                // check stop first
                if (!(Sk.builtin.checkNone(stop) || Sk.misceval.isIndex(stop))) {
                    throw new Sk.builtin.ValueError("Stop for islice() must be None or an integer: 0 <= x <= sys.maxsize.");
                } else {
                    stop = Sk.builtin.checkNone(stop) ? Number.MAX_SAFE_INTEGER : Sk.misceval.asIndexSized(stop);
                    if (stop < 0 || stop > Number.MAX_SAFE_INTEGER) {
                        throw new Sk.builtin.ValueError("Stop for islice() must be None or an integer: 0 <= x <= sys.maxsize.");
                    }
                }

                // check start
                if (!(Sk.builtin.checkNone(start) || Sk.misceval.isIndex(start))) {
                    throw new Sk.builtin.ValueError("Indices for islice() must be None or an integer: 0 <= x <= sys.maxsize.");
                } else {
                    start = Sk.builtin.checkNone(start) ? 0 : Sk.misceval.asIndexSized(start);
                    if (start < 0 || start > Number.MAX_SAFE_INTEGER) {
                        throw new Sk.builtin.ValueError("Indices for islice() must be None or an integer: 0 <= x <= sys.maxsize.");
                    }
                }

                // check step
                if (!(Sk.builtin.checkNone(step) || Sk.misceval.isIndex(step))) {
                    throw new Sk.builtin.ValueError("Step for islice() must be a positive integer or None");
                } else {
                    step = Sk.builtin.checkNone(step) ? 1 : Sk.misceval.asIndexSized(step);
                    if (step <= 0 || step > Number.MAX_SAFE_INTEGER) {
                        throw new Sk.builtin.ValueError("Step for islice() must be a positive integer or None.");
                    }
                }

                if (this === mod.islice.prototype) {
                    return new mod.islice(iter, start, stop, step);
                } else {
                    const instance = new this.constructor();
                    mod.islice.call(instance, iter, start, stop, step);
                    return instance;
                }
            },
        },
    });

    mod.permutations = Sk.abstr.buildIteratorClass("itertools.permutations", {
        constructor: function permutations(pool, r) {
            this.pool = pool;
            this.r = r;
            const n = pool.length;
            this.indices = new Array(n).fill().map((_, i) => i);
            this.cycles = new Array(r).fill().map((_, i) => n - i);
            this.n = n;
            this.tp$iternext = () => {
                // different initial iteration
                if (this.r > this.n) {
                    return;
                }
                this.tp$iternext = this.constructor.prototype.tp$iternext;           
                return new Sk.builtin.tuple(this.pool.slice(0, this.r));
            };
        },
        iternext(canSuspend) {
            for (let i = this.r - 1; i >= 0; i--) {
                this.cycles[i]--;
                if (this.cycles[i] == 0) {
                    this.indices.push(this.indices.splice(i, 1)[0]); // push ith element to the end
                    this.cycles[i] = this.n - i;
                } else {
                    j = this.cycles[i];
                    [this.indices[i], this.indices[this.n - j]] = [this.indices[this.n - j], this.indices[i]]; //swap elements;
                    const res = this.indices.map((i) => this.pool[i]).slice(0, this.r);
                    return new Sk.builtin.tuple(res);
                }
            }
            this.r = 0;
            return;
        },
        slots: {
            tp$doc:
                "permutations(iterable[, r]) --> permutations object\n\nReturn successive r-length permutations of elements in the iterable.\n\npermutations(range(3), 2) --> (0,1), (0,2), (1,0), (1,2), (2,0), (2,1)",
            tp$new(args, kwargs) {
                let iterable, r;
                [iterable, r] = Sk.abstr.copyKeywordsToNamedArgs("permutations", ["iterable", "r"], args, kwargs, [Sk.builtin.none.none$]);
                const pool = Sk.misceval.arrayFromIterable(iterable);
                r = Sk.builtin.checkNone(r) ? pool.length : Sk.misceval.asIndexSized(r, Sk.builtin.OverFlowError);
                if (r < 0) {
                    throw new Sk.builtin.ValueError("r must be non-negative");
                }
                if (this === mod.permutations.prototype) {
                    return new mod.permutations(pool, r);
                } else {
                    const instance = new this.constructor();
                    mod.permutations.call(instance, pool, r);
                    return instance;
                }
            },
        },
    });

    mod.product = Sk.abstr.buildIteratorClass("itertools.product", {
        constructor: function product(pools) {
            this.pools = pools;
            this.n = pools.length;
            this.indices = Array(pools.length).fill(0);
            this.pool_sizes = pools.map((x) => x.length);
            this.tp$iternext = () => {
                this.tp$iternext = this.constructor.prototype.tp$iternext;
                const res = this.indices.map((_, i) => this.pools[i][this.indices[i]]);
                if (res.some((element) => element === undefined)) {
                    this.n = 0; // at least one pool arguments is an empty iterator
                    return;
                }
                return new Sk.builtin.tuple(res);
            };
        },
        iternext(canSuspend) {
            let i = this.n - 1;
            while (i >= 0 && i < this.n) {
                this.indices[i]++;
                if (this.indices[i] >= this.pool_sizes[i]) {
                    this.indices[i] = -1;
                    i--;
                } else {
                    i++;
                }
            }
            if (!this.n || this.indices.every((index) => index === -1)) {
                this.n = 0; // we've done all the iterations
                return;
            } else {
                const res = this.indices.map((_, i) => this.pools[i][this.indices[i]]);
                return new Sk.builtin.tuple(res);
            }
        },
        slots: {
            tp$doc:
                "product(*iterables, repeat=1) --> product object\n\nCartesian product of input iterables.  Equivalent to nested for-loops.\n\nFor example, product(A, B) returns the same as:  ((x,y) for x in A for y in B).\nThe leftmost iterators are in the outermost for-loop, so the output tuples\ncycle in a manner similar to an odometer (with the rightmost element changing\non every iteration).\n\nTo compute the product of an iterable with itself, specify the number\nof repetitions with the optional repeat keyword argument. For example,\nproduct(A, repeat=4) means the same as product(A, A, A, A).\n\nproduct('ab', range(3)) --> ('a',0) ('a',1) ('a',2) ('b',0) ('b',1) ('b',2)\nproduct((0,1), (0,1), (0,1)) --> (0,0,0) (0,0,1) (0,1,0) (0,1,1) (1,0,0) ...",
            tp$new(args, kwargs) {
                let [repeat] = Sk.abstr.copyKeywordsToNamedArgs("product", ["repeat"], [], kwargs, [new Sk.builtin.int_(1)]);
                repeat = Sk.misceval.asIndexSized(repeat, Sk.builtin.OverFlowError);
                if (repeat < 0) {
                    throw new Sk.builtin.ValueError("repeat argument cannot be negative");
                }
                const iterables = [];
                for (let i = 0; i < args.length; i++) {
                    iterables.push(Sk.misceval.arrayFromIterable(args[i])); // want each arg as an array
                }
                const pools = [].concat(...Array(repeat).fill(iterables));
                if (this === mod.product.prototype) {
                    return new mod.product(pools);
                } else {
                    const instance = new this.constructor();
                    mod.product.call(instance, pools);
                    return instance;
                }
            },
        },
    });

    mod.repeat = Sk.abstr.buildIteratorClass("itertools.repeat", {
        constructor: function repeat(object, times) {
            this.object = object;
            this.times = times;
            if (times === undefined) {
                this.tp$iternext = () => {
                    return this.object;
                };
            }
        },
        iternext(canSuspend) {
            return this.times-- > 0 ? this.object : undefined;
        },
        slots: {
            tp$doc:
                "repeat(object [,times]) -> create an iterator which returns the object\nfor the specified number of times.  If not specified, returns the object\nendlessly.",
            tp$new(args, kwargs) {
                let object, times;
                [object, times] = Sk.abstr.copyKeywordsToNamedArgs("repeat", ["object", "times"], args, kwargs, [null]);
                if (times !== null) {
                    times = Sk.misceval.asIndexSized(times, Sk.builtin.OverFlowError);
                } else {
                    times = undefined;
                }
                if (this === mod.repeat.prototype) {
                    return new mod.repeat(object, times);
                } else {
                    const instance = new this.constructor();
                    mod.repeat.call(instance, object, times);
                    return instance;
                }
            },
            $r() {
                object_repr = Sk.misceval.objectRepr(this.object);
                times_repr = this.times === undefined ? "" : ", " + (this.times >= 0 ? this.times : 0);
                return new Sk.builtin.str(Sk.abstr.typeName(this) + "(" + object_repr + times_repr + ")");
            },
        },
        methods: {
            __lenght_hint__: {
                $meth() {
                    if (this.times === undefined) {
                        throw new Sk.builtin.TypeError("len() of unsized object");
                    }
                    return new Sk.builtin.int_(this.times);
                },
                $flags: { NoArgs: true },
                $textsig: null,
            },
        },
    });

    mod.starmap = Sk.abstr.buildIteratorClass("itertools.starmap", {
        constructor: function starmap(func, iter) {
            this.func = func;
            this.iter = iter;
        },
        iternext(canSuspend) {
            const args = this.iter.tp$iternext();
            if (args === undefined) {
                return;
            }
            const unpack = Sk.misceval.arrayFromIterable(args);
            const val = Sk.misceval.callsimArray(this.func, unpack);
            return val;
        },
        slots: {
            tp$new(args, kwargs) {
                let func, iter;
                [func, iter] = Sk.abstr.copyKeywordsToNamedArgs("starmap", ["func", "iterable"], args, kwargs, []);
                iter = Sk.abstr.iter(iter);
                func = Sk.builtin.checkNone(func) ? Sk.builtin.bool : func;
                if (this === mod.starmap.prototype) {
                    return new mod.starmap(func, iter);
                } else {
                    const instance = new this.constructor();
                    mod.starmap.call(instance, func, iter);
                    return instance;
                }
            },
        },
    });

    mod.takewhile = Sk.abstr.buildIteratorClass("itertools.takewhile", {
        constructor: function takewhile(predicate, iter) {
            this.predicate = predicate;
            this.iter = iter;
        },
        iternext() {
            const x = this.iter.tp$iternext();
            if (x !== undefined) {
                const val = Sk.misceval.callsimArray(this.predicate, [x]);
                if (Sk.misceval.isTrue(val)) {
                    return x;
                } else {
                    // failed
                    this.tp$iternext = () => undefined;
                }
            }
        },
        slots: {
            tp$doc:
                "takewhile(predicate, iterable) --> takewhile object\n\nReturn successive entries from an iterable as long as the \npredicate evaluates to true for each entry.",
            tp$new(args, kwargs) {
                Sk.abstr.checkNoKwargs("takewhile", kwargs);
                Sk.abstr.checkArgsLen("takewhile", args, 2, 2);
                const predicate = args[0];
                const iter = Sk.abstr.iter(args[1]);
                if (this === mod.takewhile.prototype) {
                    return new mod.takewhile(predicate, iter);
                } else {
                    const instance = new this.constructor();
                    mod.takewhile.call(instance, predicate, iter);
                    return instance;
                }
            },
        },
    });

    mod.tee = new Sk.builtin.func(function () {
        throw new Sk.builtin.NotImplementedError("tee is not yet implemented in Skulpt");
    });

    mod.zip_longest = Sk.abstr.buildIteratorClass("itertools.zip_longest", {
        constructor: function zip_longest(iters, fillvalue) {
            this.iters = iters;
            this.fillvalue = fillvalue;
            this.active = this.iters.length;
        },
        iternext(canSuspend) {
            if (!this.active) {
                return;
            }
            let val;
            const values = [];
            for (let i = 0; i < this.iters.length; i++) {
                val = this.iters[i].tp$iternext();
                if (val === undefined) {
                    this.active--;
                    if (!this.active) {
                        return;
                    }
                    this.iters[i] = new mod.repeat(this.fillvalue);
                    val = this.fillvalue;
                }
                values.push(val);
            }
            return new Sk.builtin.tuple(values);
        },
        slots: {
            tp$doc:
                "zip_longest(iter1 [,iter2 [...]], [fillvalue=None]) --> zip_longest object\n\nReturn a zip_longest object whose .__next__() method returns a tuple where\nthe i-th element comes from the i-th iterable argument.  The .__next__()\nmethod continues until the longest iterable in the argument sequence\nis exhausted and then it raises StopIteration.  When the shorter iterables\nare exhausted, the fillvalue is substituted in their place.  The fillvalue\ndefaults to None or can be specified by a keyword argument.\n",
            tp$new(args, kwargs) {
                const [fillvalue] = Sk.abstr.copyKeywordsToNamedArgs("zip_longest", ["fillvalue"], [], kwargs, [Sk.builtin.none.none$]);
                const iterables = [];
                for (let i = 0; i < args.length; i++) {
                    iterables.push(Sk.abstr.iter(args[i]));
                }
                if (this === mod.zip_longest.prototype) {
                    return new mod.zip_longest(iterables, fillvalue);
                } else {
                    const instance = new this.constructor();
                    mod.zip_longest.call(instance, iterables, fillvalue);
                    return instance;
                }
            },
        },
    });

    mod.__doc__ = new Sk.builtin.str("An implementation of the python itertools module in Skulpt");
    mod.__package__ = new Sk.builtin.str("");

    return mod;
};
