/**
 * @todo subclassing incomplete for certain objects
 * those that take no kwargs should ignore kwargs if called by a subclass
 * probably little need to consider this for now - subclassing an itertools object would be rare...
 */

var $builtinmodule = function (name) {
    const {
        abstr: {
            buildIteratorClass,
            checkOneArg,
            checkNoKwargs,
            checkArgsLen,
            copyKeywordsToNamedArgs,
            iter: pyIter,
            numberBinOp,
            typeName,
        },
        builtin: {
            tuple: pyTuple,
            bool: pyBool,
            bool: { false$: pyFalse },
            int_: pyInt,
            str: pyStr,
            func: pyFunc,
            none: { none$: pyNone },
            TypeError: pyTypeError,
            ValueError,
            OverflowError,
            checkNone,
            checkNumber,
            checkComplex,
        },
        misceval: {
            arrayFromIterable,
            Break,
            callsimArray: pyCall,
            chain: chainOrSuspend,
            isTrue,
            iterFor,
            retryOptionalSuspensionOrThrow,
            richCompareBool,
            tryCatch,
            asIndexSized,
            isIndex,
            objectRepr,
        },
        generic: { classGetItem },
    } = Sk;

    const mod = {};

    mod.accumulate = buildIteratorClass("itertools.accumulate", {
        constructor: function accumulate(iter, func, initial) {
            this.iter = iter;
            this.func = func;
            this.total = initial;
            // different initial iteration
            this.tp$iternext = () => {
                this.total = checkNone(this.total) ? this.iter.tp$iternext() : this.total;
                this.tp$iternext = this.constructor.prototype.tp$iternext;
                return this.total;
            };
        },
        iternext(canSuspend) {
            let element = this.iter.tp$iternext();
            if (element !== undefined) {
                this.total = pyCall(this.func, [this.total, element]);
                return this.total;
            }
        },
        slots: {
            tp$doc: "accumulate(iterable[, func, initial]) --> accumulate object\n\nReturn series of accumulated sums (or other binary function results).",
            tp$new(args, kwargs) {
                // initial is a keyword only argument;
                checkArgsLen("accumulate", args, 0, 2);
                let [iter, func, initial] = copyKeywordsToNamedArgs(
                    "accumulate",
                    ["iterable", "func", "initial"],
                    args,
                    kwargs,
                    [pyNone, pyNone]
                );
                iter = pyIter(iter);
                func = checkNone(func) ? new pyFunc((a, b) => numberBinOp(a, b, "Add")) : func;
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

    mod.batched = buildIteratorClass("itertools.batched", {
        constructor: function batched(iterable, n, strict) {
            this.it = iterable;
            this.n = n;
            this.strict = strict;
        },
        slots: {
            tp$new(args, kws) {
                checkArgsLen("batched", args, 2, 2);
                let [iterable, n, strict] = copyKeywordsToNamedArgs("batched", [null, null, "strict"], args, kws, [
                    pyFalse,
                ]);
                n = asIndexSized(n, OverflowError);
                if (n < 1) {
                    throw new ValueError("n must be at least one");
                }

                return new mod.batched(pyIter(iterable), n, isTrue(strict));
            },
            tp$doc: "Batch data into tuples of length n. The last batch may be shorter than n.",
        },
        iternext(canSuspend) {
            if (this.it === null) {
                return;
            }
            const batch = [];
            const result = tryCatch(
                () =>
                    chainOrSuspend(
                        iterFor(this.it, (item) => {
                            batch.push(item);
                            if (batch.length === this.n) {
                                return Break();
                            }
                        }),
                        () => {
                            if (batch.length < this.n) {
                                this.it = null;
                                if (!batch.length) {
                                    return;
                                }
                                if (this.strict) {
                                    throw new ValueError("batched(): incomplete batch");
                                }
                            }
                            return new pyTuple(batch);
                        }
                    ),
                (error) => {
                    this.it = null;
                    throw error;
                }
            );
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
        },
    });

    mod.chain = buildIteratorClass("itertools.chain", {
        constructor: function chain(iterables) {
            this.iterables = iterables;
            this.current_it = null;
        },
        iternext() {
            while (this.iterables !== null) {
                if (this.current_it === null) {
                    let iterable;
                    try {
                        iterable = this.iterables.tp$iternext();
                        if (iterable === undefined) {
                            this.iterables = null;
                            return;
                        }
                        this.current_it = pyIter(iterable);
                    } catch (error) {
                        this.iterables = null;
                        throw error;
                    }
                }
                const item = this.current_it.tp$iternext();
                if (item !== undefined) return item;
                this.current_it = null;
            }
        },
        slots: {
            tp$doc: "chain(*iterables) --> chain object\n\nReturn a chain object whose .__next__() method returns elements from the\nfirst iterable until it is exhausted, then elements from the next\niterable, until all of the iterables are exhausted.",
            tp$new(args, kwargs) {
                checkNoKwargs("chain", kwargs);
                args = new pyTuple(args.slice(0)).tp$iter();
                if (this === mod.chain.prototype) {
                    return new mod.chain(args);
                } else {
                    const instance = new this.constructor();
                    mod.chain.call(instance, args);
                    return instance;
                }
            },
        },
        classmethods: Object.assign(
            {
                from_iterable: {
                    $meth(iterable) {
                        const iterables = pyIter(iterable);
                        return new mod.chain(iterables);
                    },
                    $flags: { OneArg: true },
                    $doc: "chain.from_iterable(iterable) --> chain object\n\nAlternate chain() constructor taking a single iterable argument\nthat evaluates lazily.",
                    $textsig: null,
                },
            },
            classGetItem
        ),
    });

    /**
     * Utility function for combinations and combinations_with_replacement
     * @param {Object} combinations_proto
     * @param {Array} args
     * @param {Array|undefined} kwargs
     */
    function combinationsNew(combinations_proto, args, kwargs) {
        let iterable, r;
        [iterable, r] = copyKeywordsToNamedArgs(combinations_proto.tp$name, ["iterable", "r"], args, kwargs, []);
        const pool = arrayFromIterable(iterable);
        r = asIndexSized(r, OverflowError);
        if (r < 0) {
            throw new ValueError("r must be non-negative");
        }
        if (this === combinations_proto) {
            return new combinations_proto.constructor(pool, r);
        } else {
            const instance = new this.constructor();
            combinations_proto.constructor.call(instance, pool, r);
            return instance;
        }
    }

    mod.combinations = buildIteratorClass("itertools.combinations", {
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
                return new pyTuple(this.pool.slice(0, this.r));
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
            return new pyTuple(res);
        },
        slots: {
            tp$doc: "combinations(iterable, r) --> combinations object\n\nReturn successive r-length combinations of elements in the iterable.\n\ncombinations(range(4), 3) --> (0,1,2), (0,1,3), (0,2,3), (1,2,3)",
            tp$new(args, kwargs) {
                return combinationsNew.call(this, mod.combinations.prototype, args, kwargs);
            },
        },
    });

    mod.combinations_with_replacement = buildIteratorClass("itertools.combinations_with_replacement", {
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
                return new pyTuple(res);
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
            return new pyTuple(res);
        },
        slots: {
            tp$doc: "combinations_with_replacement(iterable, r) --> combinations_with_replacement object\n\nReturn successive r-length combinations of elements in the iterable\nallowing individual elements to have successive repeats.\ncombinations_with_replacement('ABC', 2) --> AA AB AC BB BC CC",
            tp$new(args, kwargs) {
                return combinationsNew.call(this, mod.combinations_with_replacement.prototype, args, kwargs);
            },
        },
    });

    mod.compress = buildIteratorClass("itertools.compress", {
        constructor: function compress(data, selectors) {
            ((this.data = data), (this.selectors = selectors));
        },
        iternext() {
            while (true) {
                const item = this.data.tp$iternext();
                if (item === undefined) return;
                const selector = this.selectors.tp$iternext();
                if (selector === undefined) return;
                if (isTrue(selector)) return item;
            }
        },
        slots: {
            tp$doc: "compress(data, selectors) --> iterator over selected data\n\nReturn data elements corresponding to true selector elements.\nForms a shorter iterator from selected data elements using the\nselectors to choose the data elements.",
            tp$new(args, kwargs) {
                let data, selectors;
                [data, selectors] = copyKeywordsToNamedArgs("compress", ["data", "selectors"], args, kwargs, []);
                data = pyIter(data);
                selectors = pyIter(selectors);
                if (this === mod.compress.prototype) {
                    return new mod.compress(data, selectors);
                } else {
                    const instance = new this.constructor();
                    mod.compress.call(instance, data, selectors);
                    return instance;
                }
            },
        },
    });

    mod.count = buildIteratorClass("itertools.count", {
        constructor: function count(start, step) {
            this.start = start;
            this.step = step;
        },
        iternext() {
            const tmp = this.start;
            this.start = numberBinOp(this.start, this.step, "Add");
            return tmp;
        },
        slots: {
            tp$doc: "count(start=0, step=1) --> count object\n\nReturn a count object whose .__next__() method returns consecutive values.\nEquivalent to:\n\n    def count(firstval=0, step=1):\n        x = firstval\n        while 1:\n            yield x\n            x += step\n",
            tp$new(args, kwargs) {
                const [start, step] = copyKeywordsToNamedArgs("count", ["start", "step"], args, kwargs, [
                    new pyInt(0),
                    new pyInt(1),
                ]);
                if (!checkNumber(start) && !checkComplex(start)) {
                    throw new pyTypeError("a number is required");
                }
                if (!checkNumber(step) && !checkComplex(step)) {
                    throw new pyTypeError("a number is required");
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
                const start_repr = objectRepr(this.start);
                let step_repr = objectRepr(this.step);
                step_repr = step_repr === "1" ? "" : ", " + step_repr;
                return new pyStr(typeName(this) + "(" + start_repr + step_repr + ")");
            },
        },
    });

    mod.cycle = buildIteratorClass("itertools.cycle", {
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
            tp$doc: "cycle(iterable) --> cycle object\n\nReturn elements from the iterable until it is exhausted.\nThen repeat the sequence indefinitely.",
            tp$new(args, kwargs) {
                checkOneArg("cycle", args, kwargs);
                const iter = pyIter(args[0]);
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

    mod.dropwhile = buildIteratorClass("itertools.dropwhile", {
        constructor: function dropwhile(predicate, iter) {
            this.predicate = predicate;
            this.iter = iter;
            this.passed;
        },
        iternext() {
            let x = this.iter.tp$iternext();
            while (this.passed === undefined && x !== undefined) {
                const val = pyCall(this.predicate, [x]);
                if (!isTrue(val)) {
                    this.passed = true;
                    return x;
                }
                x = this.iter.tp$iternext();
            }
            return x;
        },
        slots: {
            tp$doc: "dropwhile(predicate, iterable) --> dropwhile object\n\nDrop items from the iterable while predicate(item) is true.\nAfterwards, return every element until the iterable is exhausted.",
            tp$new(args, kwargs) {
                checkNoKwargs("dropwhile", kwargs);
                checkArgsLen("dropwhile", args, 2, 2);
                const predicate = args[0];
                const iter = pyIter(args[1]);
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

    mod.filterfalse = buildIteratorClass("itertools.filterfalse", {
        constructor: function filterfalse(predicate, iter) {
            this.predicate = predicate;
            this.iter = iter;
        },
        iternext(canSuspend) {
            let x = this.iter.tp$iternext();
            if (x === undefined) {
                return;
            }
            let val = pyCall(this.predicate, [x]);
            while (isTrue(val)) {
                x = this.iter.tp$iternext();
                if (x === undefined) {
                    return;
                }
                val = pyCall(this.predicate, [x]);
            }
            return x;
        },
        slots: {
            tp$doc: "filterfalse(function or None, sequence) --> filterfalse object\n\nReturn those items of sequence for which function(item) is false.\nIf function is None, return the items that are false.",
            tp$new(args, kwargs) {
                checkNoKwargs("filterfalse", kwargs);
                checkArgsLen("filterfalse", args, 2, 2);
                const predicate = checkNone(args[0]) ? pyBool : args[0];
                const iter = pyIter(args[1]);
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

    mod._grouper = buildIteratorClass("itertools._grouper", {
        constructor: function _grouper(groupby, key) {
            this.groupby = groupby;
            this.key = key;
        },
        iternext() {
            const parent = this.groupby;
            if (parent.grouper !== this) return;
            const key = parent.currval === undefined ? parent.$advance() : parent.currkey;
            if (key === undefined || parent.grouper !== this) return;
            if (this.key === key || richCompareBool(this.key, key, "Eq")) {
                const item = parent.currval;
                parent.currval = parent.currkey = undefined;
                return item;
            }
        },
    });

    mod.groupby = buildIteratorClass("itertools.groupby", {
        constructor: function groupby(iter, keyf) {
            this.iter = iter;
            this.keyf = keyf;
            // The parent buffers one item. Its active grouper consumes it, or the parent skips it.
            this.currval = this.currkey = this.tgtkey = undefined;
            this.grouper = null;
        },
        iternext() {
            this.grouper = null;
            return this.$nextGroup(this.currval === undefined ? this.$advance() : this.currkey);
        },
        proto: {
            $advance() {
                const item = this.iter.tp$iternext();
                if (item !== undefined) return this.$setCurrent(item);
            },
            $setCurrent(item) {
                const key = this.keyf === undefined ? item : pyCall(this.keyf, [item]);
                this.currval = item;
                this.currkey = key;
                return key;
            },
            $nextGroup(key) {
                while (key !== undefined) {
                    if (
                        this.tgtkey === undefined ||
                        !(this.tgtkey === key || richCompareBool(this.tgtkey, key, "Eq"))
                    ) {
                        return this.$startGroup();
                    }
                    key = this.$advance();
                }
            },
            $startGroup() {
                this.tgtkey = this.currkey;
                this.grouper = new mod._grouper(this, this.tgtkey);
                return new pyTuple([this.tgtkey, this.grouper]);
            },
        },
        slots: {
            tp$doc: "groupby(iterable, key=None) -> make an iterator that returns consecutive\nkeys and groups from the iterable.  If the key function is not specified or\nis None, the element itself is used for grouping.\n",
            tp$new(args, kwargs) {
                let iter, key;
                [iter, key] = copyKeywordsToNamedArgs("groupby", ["iterable", "key"], args, kwargs, [pyNone]);
                iter = pyIter(iter);
                key = checkNone(key) ? undefined : key;
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

    mod.islice = buildIteratorClass("itertools.islice", {
        constructor: function islice(iter, start, stop, step) {
            this.iter = iter;
            this.index = 0;
            this.nextIndex = start;
            this.stop = stop;
            this.step = step;
        },
        iternext() {
            if (this.iter === null) return;
            try {
                while (this.index < this.nextIndex) {
                    if (this.iter.tp$iternext() === undefined) {
                        this.iter = null;
                        return;
                    }
                    this.index++;
                }
                if (this.index >= this.stop) {
                    this.iter = null;
                    return;
                }
                const item = this.iter.tp$iternext();
                if (item === undefined) {
                    this.iter = null;
                    return;
                }
                this.index++;
                this.nextIndex = Math.min(this.nextIndex + this.step, this.stop);
                return item;
            } catch (error) {
                this.iter = null;
                throw error;
            }
        },
        slots: {
            tp$doc: "islice(iterable, stop) --> islice object\nislice(iterable, start, stop[, step]) --> islice object\n\nReturn an iterator whose next() method returns selected values from an\niterable.  If start is specified, will skip all preceding elements;\notherwise, start defaults to zero.  Step defaults to one.  If\nspecified as another value, step determines how many values are \nskipped between successive calls.  Works like a slice() on a list\nbut returns an iterator.",
            tp$new(args, kwargs) {
                checkNoKwargs("islice", kwargs);
                checkArgsLen("islice", args, 2, 4);
                const iter = pyIter(args[0]);
                let start = args[1],
                    stop = args[2],
                    step = args[3];
                if (stop === undefined) {
                    stop = start;
                    start = pyNone;
                    step = pyNone;
                } else if (step === undefined) {
                    step = pyNone;
                }

                // check stop first
                if (!(checkNone(stop) || isIndex(stop))) {
                    throw new ValueError("Stop for islice() must be None or an integer: 0 <= x <= sys.maxsize.");
                } else {
                    stop = checkNone(stop) ? Number.MAX_SAFE_INTEGER : asIndexSized(stop);
                    if (stop < 0 || stop > Number.MAX_SAFE_INTEGER) {
                        throw new ValueError("Stop for islice() must be None or an integer: 0 <= x <= sys.maxsize.");
                    }
                }

                // check start
                if (!(checkNone(start) || isIndex(start))) {
                    throw new ValueError("Indices for islice() must be None or an integer: 0 <= x <= sys.maxsize.");
                } else {
                    start = checkNone(start) ? 0 : asIndexSized(start);
                    if (start < 0 || start > Number.MAX_SAFE_INTEGER) {
                        throw new ValueError("Indices for islice() must be None or an integer: 0 <= x <= sys.maxsize.");
                    }
                }

                // check step
                if (!(checkNone(step) || isIndex(step))) {
                    throw new ValueError("Step for islice() must be a positive integer or None");
                } else {
                    step = checkNone(step) ? 1 : asIndexSized(step);
                    if (step <= 0 || step > Number.MAX_SAFE_INTEGER) {
                        throw new ValueError("Step for islice() must be a positive integer or None.");
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

    mod.permutations = buildIteratorClass("itertools.permutations", {
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
                return new pyTuple(this.pool.slice(0, this.r));
            };
        },
        iternext(canSuspend) {
            for (let i = this.r - 1; i >= 0; i--) {
                this.cycles[i]--;
                if (this.cycles[i] == 0) {
                    this.indices.push(this.indices.splice(i, 1)[0]); // push ith element to the end
                    this.cycles[i] = this.n - i;
                } else {
                    const j = this.cycles[i];
                    [this.indices[i], this.indices[this.n - j]] = [this.indices[this.n - j], this.indices[i]]; //swap elements;
                    const res = this.indices.map((i) => this.pool[i]).slice(0, this.r);
                    return new pyTuple(res);
                }
            }
            this.r = 0;
            return;
        },
        slots: {
            tp$doc: "permutations(iterable[, r]) --> permutations object\n\nReturn successive r-length permutations of elements in the iterable.\n\npermutations(range(3), 2) --> (0,1), (0,2), (1,0), (1,2), (2,0), (2,1)",
            tp$new(args, kwargs) {
                let iterable, r;
                [iterable, r] = copyKeywordsToNamedArgs("permutations", ["iterable", "r"], args, kwargs, [pyNone]);
                const pool = arrayFromIterable(iterable);
                r = checkNone(r) ? pool.length : asIndexSized(r, OverflowError);
                if (r < 0) {
                    throw new ValueError("r must be non-negative");
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

    mod.pairwise = buildIteratorClass("itertools.pairwise", {
        constructor: function pairwise(iter) {
            this.it = iter;
            this.old = null;
        },
        slots: {
            tp$new(args, kws) {
                checkOneArg("pairwise", args, kws);
                const iterable = args[0];
                const iter = pyIter(iterable);
                return new mod.pairwise(iter);
            },
            tp$doc: "Return an iterator of overlapping pairs taken from the input iterator.\n\n    s -> (s0,s1), (s1,s2), (s2, s3), ...",
        },
        iternext() {
            if (this.it === null) return;
            try {
                const old = this.old === null ? this.it.tp$iternext() : this.old;
                if (old === undefined || this.it === null) {
                    this.it = this.old = null;
                    return;
                }
                this.old = old;
                const item = this.it.tp$iternext();
                if (item === undefined) {
                    this.it = this.old = null;
                    return;
                }
                this.old = item;
                return new pyTuple([old, item]);
            } catch (error) {
                this.it = this.old = null;
                throw error;
            }
        },
    });

    mod.product = buildIteratorClass("itertools.product", {
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
                return new pyTuple(res);
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
                return new pyTuple(res);
            }
        },
        slots: {
            tp$doc: "product(*iterables, repeat=1) --> product object\n\nCartesian product of input iterables.  Equivalent to nested for-loops.\n\nFor example, product(A, B) returns the same as:  ((x,y) for x in A for y in B).\nThe leftmost iterators are in the outermost for-loop, so the output tuples\ncycle in a manner similar to an odometer (with the rightmost element changing\non every iteration).\n\nTo compute the product of an iterable with itself, specify the number\nof repetitions with the optional repeat keyword argument. For example,\nproduct(A, repeat=4) means the same as product(A, A, A, A).\n\nproduct('ab', range(3)) --> ('a',0) ('a',1) ('a',2) ('b',0) ('b',1) ('b',2)\nproduct((0,1), (0,1), (0,1)) --> (0,0,0) (0,0,1) (0,1,0) (0,1,1) (1,0,0) ...",
            tp$new(args, kwargs) {
                let [repeat] = copyKeywordsToNamedArgs("product", ["repeat"], [], kwargs, [new pyInt(1)]);
                repeat = asIndexSized(repeat, OverflowError);
                if (repeat < 0) throw new ValueError("repeat argument cannot be negative");
                const iterables = repeat === 0 ? [] : args.map((iterable) => arrayFromIterable(iterable));
                const n = iterables.length;
                const pools = new Array(n * repeat);
                for (let i = 0; i < pools.length; i++) pools[i] = iterables[i % n];
                if (this === mod.product.prototype) return new mod.product(pools);
                const instance = new this.constructor();
                mod.product.call(instance, pools);
                return instance;
            },
        },
    });

    mod.repeat = buildIteratorClass("itertools.repeat", {
        constructor: function repeat(object, times) {
            this.object = object;
            this.times = times === undefined ? undefined : Math.max(0, times);
            if (times === undefined) {
                this.tp$iternext = () => {
                    return this.object;
                };
            }
        },
        iternext() {
            if (this.times > 0) {
                this.times--;
                return this.object;
            }
        },
        slots: {
            tp$doc: "repeat(object [,times]) -> create an iterator which returns the object\nfor the specified number of times.  If not specified, returns the object\nendlessly.",
            tp$new(args, kwargs) {
                let object, times;
                [object, times] = copyKeywordsToNamedArgs("repeat", ["object", "times"], args, kwargs, [null]);
                if (times !== null) {
                    times = asIndexSized(times, OverflowError);
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
                const object_repr = objectRepr(this.object);
                const times_repr = this.times === undefined ? "" : ", " + (this.times >= 0 ? this.times : 0);
                return new pyStr(typeName(this) + "(" + object_repr + times_repr + ")");
            },
        },
        methods: {
            __length_hint__: {
                $meth() {
                    if (this.times === undefined) {
                        throw new pyTypeError("len() of unsized object");
                    }
                    return new pyInt(this.times);
                },
                $flags: { NoArgs: true },
                $textsig: null,
            },
        },
    });

    mod.starmap = buildIteratorClass("itertools.starmap", {
        constructor: function starmap(func, iter) {
            this.func = func;
            this.iter = iter;
        },
        iternext(canSuspend) {
            const args = this.iter.tp$iternext();
            if (args === undefined) {
                return;
            }
            const unpack = arrayFromIterable(args);
            const val = pyCall(this.func, unpack);
            return val;
        },
        slots: {
            tp$new(args, kwargs) {
                let func, iter;
                [func, iter] = copyKeywordsToNamedArgs("starmap", ["func", "iterable"], args, kwargs, []);
                iter = pyIter(iter);
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

    mod.takewhile = buildIteratorClass("itertools.takewhile", {
        constructor: function takewhile(predicate, iter) {
            this.predicate = predicate;
            this.iter = iter;
        },
        iternext() {
            const x = this.iter.tp$iternext();
            if (x !== undefined) {
                const val = pyCall(this.predicate, [x]);
                if (isTrue(val)) {
                    return x;
                } else {
                    // failed
                    this.tp$iternext = () => undefined;
                }
            }
        },
        slots: {
            tp$doc: "takewhile(predicate, iterable) --> takewhile object\n\nReturn successive entries from an iterable as long as the \npredicate evaluates to true for each entry.",
            tp$new(args, kwargs) {
                checkNoKwargs("takewhile", kwargs);
                checkArgsLen("takewhile", args, 2, 2);
                const predicate = args[0];
                const iter = pyIter(args[1]);
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

    mod.tee = new pyFunc(function () {
        throw new Sk.builtin.NotImplementedError("tee is not yet implemented in Skulpt");
    });

    mod.zip_longest = buildIteratorClass("itertools.zip_longest", {
        constructor: function zip_longest(iters, fillvalue) {
            this.iters = iters;
            this.fillvalue = fillvalue;
            this.active = this.iters.length;
        },
        iternext() {
            if (!this.active) return;
            const values = [];
            try {
                for (let i = 0; i < this.iters.length; i++) {
                    const iter = this.iters[i];
                    if (iter === null) {
                        values.push(this.fillvalue);
                        continue;
                    }
                    let item = iter.tp$iternext();
                    if (item === undefined) {
                        this.iters[i] = null;
                        if (--this.active === 0) return;
                        item = this.fillvalue;
                    }
                    values.push(item);
                }
                return new pyTuple(values);
            } catch (error) {
                this.active = 0;
                throw error;
            }
        },
        slots: {
            tp$doc: "zip_longest(iter1 [,iter2 [...]], [fillvalue=None]) --> zip_longest object\n\nReturn a zip_longest object whose .__next__() method returns a tuple where\nthe i-th element comes from the i-th iterable argument.  The .__next__()\nmethod continues until the longest iterable in the argument sequence\nis exhausted and then it raises StopIteration.  When the shorter iterables\nare exhausted, the fillvalue is substituted in their place.  The fillvalue\ndefaults to None or can be specified by a keyword argument.\n",
            tp$new(args, kwargs) {
                const [fillvalue] = copyKeywordsToNamedArgs("zip_longest", ["fillvalue"], [], kwargs, [pyNone]);
                const iterables = [];
                for (let i = 0; i < args.length; i++) {
                    iterables.push(pyIter(args[i]));
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

    mod.__doc__ = new pyStr("An implementation of the python itertools module in Skulpt");
    mod.__package__ = new pyStr("");

    return mod;
};
