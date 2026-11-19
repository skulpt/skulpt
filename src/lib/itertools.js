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
            RuntimeError,
            OverflowError,
            checkNone,
            checkNumber,
            checkComplex,
        },
        misceval: {
            arrayFromIterable,
            Break,
            callsimOrSuspendArray: pyCallOrSuspend,
            chain: chainOrSuspend,
            isTrue,
            iterArray,
            iterFor,
            retryOptionalSuspensionOrThrow,
            richCompareBool,
            tryCatch,
            tryFinally,
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
            this.initial = initial;
            this.total = undefined;
        },
        iternext(canSuspend) {
            if (this.initial !== undefined) {
                this.total = this.initial;
                this.initial = undefined;
                return this.total;
            }
            const element = this.iter.tp$iternext(true);
            const result =
                element && element.$isSuspension
                    ? chainOrSuspend(element, (element) => this.$add(element))
                    : this.$add(element);
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
        },
        proto: {
            $add(element) {
                if (element === undefined) {
                    return;
                }
                const total =
                    this.total === undefined
                        ? element
                        : this.func === undefined
                          ? numberBinOp(this.total, element, "Add")
                          : pyCallOrSuspend(this.func, [this.total, element]);
                if (total.$isSuspension) {
                    return chainOrSuspend(total, (total) => {
                        this.total = total;
                        return total;
                    });
                }
                this.total = total;
                return total;
            },
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
                func = checkNone(func) ? undefined : func;
                initial = checkNone(initial) ? undefined : initial;
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
        iternext(canSuspend) {
            const item = this.current_it === null ? undefined : this.current_it.tp$iternext(true);
            if (item !== undefined && !item.$isSuspension) {
                return item;
            }
            const result =
                item === undefined
                    ? this.$nextIterable()
                    : chainOrSuspend(item, (item) => (item === undefined ? this.$nextIterable() : item));
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
        },
        proto: {
            $nextIterable() {
                this.current_it = null;
                if (this.iterables === null) {
                    return;
                }
                const source = {
                    tp$iternext: () =>
                        tryCatch(
                            () => this.iterables.tp$iternext(true),
                            (error) => {
                                this.iterables = null;
                                throw error;
                            }
                        ),
                };
                const result = iterFor(source, (iterable) => {
                    try {
                        this.current_it = pyIter(iterable);
                    } catch (error) {
                        this.iterables = null;
                        throw error;
                    }
                    return chainOrSuspend(this.current_it.tp$iternext(true), (item) => {
                        if (item !== undefined) {
                            return Break(item);
                        }
                    });
                });
                return chainOrSuspend(result, (item) => {
                    if (item === undefined) {
                        this.iterables = this.current_it = null;
                    }
                    return item;
                });
            },
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
        r = asIndexSized(r, OverflowError);
        return chainOrSuspend(arrayFromIterable(iterable, true), (pool) => {
            if (r < 0) {
                throw new ValueError("r must be non-negative");
            }
            if (this === combinations_proto) {
                return new combinations_proto.constructor(pool, r);
            }
            const instance = new this.constructor();
            combinations_proto.constructor.call(instance, pool, r);
            return instance;
        });
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
            this.data = data;
            this.selectors = selectors;
        },
        iternext(canSuspend) {
            const result = iterFor(this.data, (item) =>
                chainOrSuspend(
                    this.selectors.tp$iternext(true),
                    (selector) => (selector === undefined ? undefined : isTrue(selector)),
                    (selected) => {
                        if (selected === undefined) {
                            return Break();
                        }
                        if (selected) {
                            return Break(item);
                        }
                    }
                )
            );
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
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
            this.i = 0;
        },
        iternext(canSuspend) {
            if (this.iter === null) {
                return this.$nextSaved();
            }
            const result = chainOrSuspend(this.iter.tp$iternext(true), (element) => {
                if (element !== undefined) {
                    this.saved.push(element);
                    return element;
                }
                this.iter = null;
                return this.$nextSaved();
            });
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
        },
        proto: {
            $nextSaved() {
                const element = this.saved[this.i];
                if (++this.i >= this.saved.length) {
                    this.i = 0;
                }
                return element;
            },
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
            this.passed = false;
        },
        iternext(canSuspend) {
            if (this.passed) {
                return this.iter.tp$iternext(canSuspend);
            }
            const result = iterFor(this.iter, (item) =>
                chainOrSuspend(
                    pyCallOrSuspend(this.predicate, [item]),
                    (value) => isTrue(value),
                    (passed) => {
                        if (!passed) {
                            this.passed = true;
                            return Break(item);
                        }
                    }
                )
            );
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
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
            const result = iterFor(this.iter, (item) =>
                chainOrSuspend(
                    this.predicate === undefined ? item : pyCallOrSuspend(this.predicate, [item]),
                    (value) => isTrue(value),
                    (passed) => {
                        if (!passed) {
                            return Break(item);
                        }
                    }
                )
            );
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
        },
        slots: {
            tp$doc: "filterfalse(function or None, sequence) --> filterfalse object\n\nReturn those items of sequence for which function(item) is false.\nIf function is None, return the items that are false.",
            tp$new(args, kwargs) {
                checkNoKwargs("filterfalse", kwargs);
                checkArgsLen("filterfalse", args, 2, 2);
                const predicate = checkNone(args[0]) || args[0] === pyBool ? undefined : args[0];
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
        iternext(canSuspend) {
            const parent = this.groupby;
            if (parent.grouper !== this) {
                return;
            }
            const result = chainOrSuspend(
                parent.currval === undefined ? parent.$advance() : parent.currkey,
                (key) => {
                    if (key === undefined || parent.grouper !== this) {
                        return false;
                    }
                    return this.key === key || richCompareBool(this.key, key, "Eq");
                },
                (matches) => {
                    if (matches && parent.grouper === this) {
                        const item = parent.currval;
                        parent.currval = parent.currkey = undefined;
                        return item;
                    }
                }
            );
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
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
        iternext(canSuspend) {
            this.grouper = null;
            const result = this.$nextGroup(this.currval === undefined ? this.$advance() : this.currkey);
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
        },
        proto: {
            $advance() {
                const item = this.iter.tp$iternext(true);
                if (item === undefined) {
                    return;
                }
                return item.$isSuspension
                    ? chainOrSuspend(item, (item) => (item === undefined ? undefined : this.$setCurrent(item)))
                    : this.$setCurrent(item);
            },
            $setCurrent(item) {
                const key = this.keyf === undefined ? item : pyCallOrSuspend(this.keyf, [item]);
                if (key.$isSuspension) {
                    return chainOrSuspend(key, (key) => {
                        this.currval = item;
                        this.currkey = key;
                        return key;
                    });
                }
                this.currval = item;
                this.currkey = key;
                return key;
            },
            $nextGroup(key) {
                // Continue synchronously until a new group or an actual suspension.
                while (key !== undefined) {
                    if (key.$isSuspension) {
                        return chainOrSuspend(key, (key) => this.$nextGroup(key));
                    }
                    const matches =
                        this.tgtkey !== undefined && (this.tgtkey === key || richCompareBool(this.tgtkey, key, "Eq"));
                    if (!matches) {
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
        iternext(canSuspend) {
            const result = tryCatch(
                () => {
                    if (this.iter === null || (this.index === this.nextIndex && this.index >= this.stop)) {
                        this.iter = null;
                        return;
                    }
                    if (this.index === this.nextIndex) {
                        const item = this.iter.tp$iternext(true);
                        if (item === undefined) {
                            this.iter = null;
                            return;
                        }
                        if (!item.$isSuspension) {
                            this.index++;
                            this.nextIndex = Math.min(this.nextIndex + this.step, this.stop);
                            return item;
                        }
                        const result = chainOrSuspend(item, (item) => {
                            if (item === undefined) {
                                this.iter = null;
                            } else {
                                this.index++;
                                this.nextIndex = Math.min(this.nextIndex + this.step, this.stop);
                            }
                            return item;
                        });
                        return result;
                    }
                    const skipped = iterFor(this.iter, (item) => {
                        const index = this.index++;
                        if (index === this.nextIndex) {
                            this.nextIndex = Math.min(this.nextIndex + this.step, this.stop);
                            return Break(item);
                        }
                        if (this.index === this.nextIndex && this.index >= this.stop) {
                            return Break();
                        }
                    });
                    const result = chainOrSuspend(skipped, (item) => {
                        if (item === undefined) {
                            this.iter = null;
                        }
                        return item;
                    });
                    return result;
                },
                (error) => {
                    this.iter = null;
                    throw error;
                }
            );
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
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
                return chainOrSuspend(arrayFromIterable(iterable, true), (pool) => {
                    r = checkNone(r) ? pool.length : asIndexSized(r, OverflowError);
                    if (r < 0) {
                        throw new ValueError("r must be non-negative");
                    }
                    if (this === mod.permutations.prototype) {
                        return new mod.permutations(pool, r);
                    }
                    const instance = new this.constructor();
                    mod.permutations.call(instance, pool, r);
                    return instance;
                });
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
        iternext(canSuspend) {
            if (this.it === null) {
                return;
            }
            const result = tryCatch(
                () =>
                    chainOrSuspend(this.old === null ? this.it.tp$iternext(true) : this.old, (old) => {
                        if (old === undefined || this.it === null) {
                            this.it = this.old = null;
                            return;
                        }
                        this.old = old;
                        return chainOrSuspend(this.it.tp$iternext(true), (item) => {
                            if (item === undefined) {
                                this.it = this.old = null;
                                return;
                            }
                            this.old = item;
                            return new pyTuple([old, item]);
                        });
                    }),
                (error) => {
                    this.it = this.old = null;
                    throw error;
                }
            );
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
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
                if (repeat < 0) {
                    throw new ValueError("repeat argument cannot be negative");
                }
                const iterables = [];
                const collected =
                    repeat === 0
                        ? undefined
                        : iterArray(args, (iterable) =>
                              chainOrSuspend(arrayFromIterable(iterable, true), (pool) => {
                                  iterables.push(pool);
                              })
                          );
                return chainOrSuspend(collected, () => {
                    const n = iterables.length;
                    const pools = new Array(n * repeat);
                    for (let i = 0; i < pools.length; i++) {
                        pools[i] = iterables[i % n];
                    }
                    if (this === mod.product.prototype) {
                        return new mod.product(pools);
                    }
                    const instance = new this.constructor();
                    mod.product.call(instance, pools);
                    return instance;
                });
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
            const result = chainOrSuspend(this.iter.tp$iternext(true), (args) => {
                if (args !== undefined) {
                    return chainOrSuspend(arrayFromIterable(args, true), (unpacked) =>
                        pyCallOrSuspend(this.func, unpacked)
                    );
                }
            });
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
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
        iternext(canSuspend) {
            const result = chainOrSuspend(this.iter.tp$iternext(true), (item) => {
                if (item !== undefined) {
                    return chainOrSuspend(
                        pyCallOrSuspend(this.predicate, [item]),
                        (value) => isTrue(value),
                        (passed) => {
                            if (passed) {
                                return item;
                            }
                            this.tp$iternext = () => undefined;
                        }
                    );
                }
            });
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
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

    // Each cursor retains only the unread suffix of the shared buffer.
    mod._tee = buildIteratorClass("itertools._tee", {
        constructor: function _tee(source, node) {
            this.source = source;
            this.node = node;
        },
        iternext(canSuspend) {
            const node = this.node;
            if (node.next !== null) {
                this.node = node.next;
                return node.value;
            }
            if (this.source.running) {
                throw new RuntimeError("cannot re-enter the tee iterator");
            }
            this.source.running = true;
            return tryFinally(
                () => {
                    const result = chainOrSuspend(this.source.iter.tp$iternext(true), (item) => {
                        if (item !== undefined) {
                            node.value = item;
                            node.next = this.node = { next: null };
                        }
                        return item;
                    });
                    return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
                },
                () => {
                    this.source.running = false;
                }
            );
        },
        slots: {
            tp$new(args, kwargs) {
                checkOneArg("_tee", args, kwargs);
                return teeFromIterable(args[0]);
            },
        },
        methods: {
            __copy__: {
                $meth() {
                    return new mod._tee(this.source, this.node);
                },
                $flags: { NoArgs: true },
                $textsig: null,
            },
        },
    });

    function teeFromIterable(iterable) {
        const iter = pyIter(iterable);
        if (iter instanceof mod._tee) {
            return new mod._tee(iter.source, iter.node);
        }
        return new mod._tee({ iter, running: false }, { next: null });
    }

    mod.tee = new pyFunc(function tee(iterable, n) {
        checkArgsLen("tee", arguments, 1, 2);
        n = n === undefined ? 2 : asIndexSized(n, OverflowError);
        if (n < 0) {
            throw new ValueError("n must be >= 0");
        }
        if (!n) {
            return new pyTuple([]);
        }
        const first = teeFromIterable(iterable);
        const copies = new Array(n);
        copies[0] = first;
        for (let i = 1; i < n; i++) {
            copies[i] = new mod._tee(first.source, first.node);
        }
        return new pyTuple(copies);
    });

    mod.zip_longest = buildIteratorClass("itertools.zip_longest", {
        constructor: function zip_longest(iters, fillvalue) {
            this.iters = iters;
            this.fillvalue = fillvalue;
            this.active = this.iters.length;
        },
        iternext(canSuspend) {
            const result = tryCatch(
                () => {
                    if (!this.active) {
                        return;
                    }
                    const values = [];
                    const result = iterArray(this.iters, (iter) => {
                        if (iter === null) {
                            values.push(this.fillvalue);
                            return;
                        }
                        return chainOrSuspend(iter.tp$iternext(true), (item) => {
                            if (item === undefined) {
                                this.iters[values.length] = null;
                                if (--this.active === 0) {
                                    return Break();
                                }
                                item = this.fillvalue;
                            }
                            values.push(item);
                        });
                    });
                    const row = chainOrSuspend(result, () => {
                        if (this.active) {
                            return new pyTuple(values);
                        }
                    });
                    return row;
                },
                (error) => {
                    this.active = 0;
                    throw error;
                }
            );
            return canSuspend ? result : retryOptionalSuspensionOrThrow(result);
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
