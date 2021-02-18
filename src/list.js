/**
 * @constructor
 * @param {Array} L
 *
 * @extends {Sk.builtin.object}
 */
Sk.builtin.list = Sk.abstr.buildNativeClass("list", {
    constructor: function list(L) {
        // this is an internal function and should be called with an array object
        if (L === undefined) {
            L = [];
        } else if (!Array.isArray(L)) {
            L = Sk.misceval.arrayFromIterable(L); 
            // internal calls to constructor can't suspend - avoid using this;
        }
        Sk.asserts.assert(this instanceof Sk.builtin.list, "bad call to list, use 'new' with an Array of python objects");
        this.v = L;
        this.in$repr = false;
    },
    slots: /** @lends {Sk.builtin.list.prototype}*/ {
        tp$getattr: Sk.generic.getAttr,
        tp$as_sequence_or_mapping: true,
        tp$hash: Sk.builtin.none.none$,
        tp$doc:
            "Built-in mutable sequence.\n\nIf no argument is given, the constructor creates a new empty list.\nThe argument must be an iterable if specified.",
        tp$new: Sk.generic.new,
        tp$init(args, kwargs) {
            // this will be an Sk.builtin.list.prototype or a sk$klass.prototype that inherits from Sk.builtin.list.prototype
            Sk.abstr.checkNoKwargs("list", kwargs);
            Sk.abstr.checkArgsLen("list", args, 0, 1);
            return Sk.misceval.chain(Sk.misceval.arrayFromIterable(args[0], true), (L) => {
                this.v = L;
            });
        },
        $r() {
            if (this.in$repr) {
                return new Sk.builtin.str("[...]");
            }
            this.in$repr = true;
            const ret = this.v.map((x) => Sk.misceval.objectRepr(x));
            this.in$repr = false;
            return new Sk.builtin.str("[" + ret.join(", ") + "]");
        },
        tp$richcompare: Sk.generic.seqCompare,
        tp$iter() {
            return new list_iter_(this);
        },

        // sequence and mapping slots
        sq$length() {
            return this.v.length;
        },
        sq$concat(other) {
            if (!(other instanceof Sk.builtin.list)) {
                throw new Sk.builtin.TypeError("can only concatenate list to list");
            }
            return new Sk.builtin.list(this.v.concat(other.v));
        },
        sq$contains(item) {
            for (let it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                if (i === item || Sk.misceval.richCompareBool(i, item, "Eq")) {
                    return true;
                }
            }
            return false;
        },
        sq$repeat(n) {
            if (!Sk.misceval.isIndex(n)) {
                throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
            }
            n = Sk.misceval.asIndexSized(n, Sk.builtin.OverflowError);
            if (n * this.v.length > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.OverflowError();
            }
            const ret = [];
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < this.v.length; j++) {
                    ret.push(this.v[j]);
                }
            }
            return new Sk.builtin.list(ret);
        },
        mp$subscript(index) {
            if (Sk.misceval.isIndex(index)) {
                let i = Sk.misceval.asIndexSized(index, Sk.builtin.IndexError);
                i = this.list$inRange(i, "list index out of range");
                return this.v[i];
            } else if (index instanceof Sk.builtin.slice) {
                const ret = [];
                index.sssiter$(this.v.length, (i) => {
                    ret.push(this.v[i]);
                });
                return new Sk.builtin.list(ret);
            }
            throw new Sk.builtin.TypeError("list indices must be integers or slices, not " + Sk.abstr.typeName(index));
        },
        mp$ass_subscript(index, value) {
            if (value === undefined) {
                this.del$subscript(index);
            } else {
                this.ass$subscript(index, value);
            }
        },
        sq$inplace_concat(other) {
            if (other === this) {
                // prevent an infinite loop
                this.v.push(...this.v);
                return this;
            }
            return Sk.misceval.chain(
                Sk.misceval.iterFor(Sk.abstr.iter(other), (i) => {
                    this.v.push(i);
                }),
                () => this
            );
        },
        sq$inplace_repeat(n) {
            if (!Sk.misceval.isIndex(n)) {
                throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
            }
            n = Sk.misceval.asIndexSized(n, Sk.builtin.OverflowError);
            const len = this.v.length;
            if (n <= 0) {
                this.v.length = 0;
            } else if (n * len > Number.MAX_SAFE_INTEGER) {
                throw new Sk.builtin.OverflowError();
            }
            
            for (let i = 1; i < n; i++) {
                for (let j = 0; j < len; j++) {
                    this.v.push(this.v[j]);
                }
            }
            return this;
        },
    },
    methods: /** @lends {Sk.builtin.list.prototype}*/ {
        __reversed__: {
            $meth() {
                return new reverselist_iter_(this);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return a reverse iterator over the list.",
        },
        clear: {
            $meth() {
                this.v.length = 0;
                return Sk.builtin.none.none$;
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Remove all items from list.",
        },
        copy: {
            $meth() {
                return new Sk.builtin.list(this.v.slice(0));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return a shallow copy of the list.",
        },
        append: {
            $meth(item) {
                this.v.push(item);
                return Sk.builtin.none.none$;
            },
            $flags: { OneArg: true },
            $textsig: "($self, object, /)",
            $doc: "Append object to the end of the list.",
        },
        insert: {
            $meth(i, x) {
                i = Sk.misceval.asIndexSized(i, Sk.builtin.OverflowError);
                const { start } = Sk.builtin.slice.startEnd$wrt(this, i);
                this.v.splice(start, 0, x);
                return Sk.builtin.none.none$;
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($self, index, object, /)",
            $doc: "Insert object before index.",
        },
        extend: {
            $meth(iterable) {
                if (iterable === this) {
                    // prevent an infinite loop
                    this.v.push(...this.v);
                    return Sk.builtin.none.none$;
                }
                return Sk.misceval.chain(
                    Sk.misceval.iterFor(Sk.abstr.iter(iterable), (i) => {
                        this.v.push(i);
                    }),
                    () => Sk.builtin.none.none$
                );
            },
            $flags: { OneArg: true },
            $textsig: "($self, iterable, /)",
            $doc: "Extend list by appending elements from the iterable.",
        },
        pop: {
            $meth(i) {
                if (i === undefined) {
                    i = this.v.length - 1;
                } else {
                    i = Sk.misceval.asIndexSized(i, Sk.builtin.OverflowError);
                }
                i = this.list$inRange(i, "pop index out of range");
                const res = this.v[i];
                this.v.splice(i, 1);
                return res;
            },
            $flags: { MinArgs: 0, MaxArgs: 1 },
            $textsig: "($self, index=-1, /)",
            $doc: "Remove and return item at index (default last).\n\nRaises IndexError if list is empty or index is out of range.",
        },
        remove: {
            $meth(item) {
                const i = this.list$indexOf(item);
                if (i === -1) {
                    throw new Sk.builtin.ValueError("list.remove(x): x not in list");
                }
                this.v.splice(i, 1);
                return Sk.builtin.none.none$;
            },
            $flags: { OneArg: true },
            $textsig: "($self, value, /)",
            $doc: "Remove first occurrence of value.\n\nRaises ValueError if the value is not present.",
        },
        sort: {
            $meth(args, kwargs) {
                if (args.length) {
                    throw new Sk.builtin.TypeError("sort() takes no positional arguments");
                }
                const [key, reverse] = Sk.abstr.copyKeywordsToNamedArgs("sort", ["key", "reverse"], args, kwargs, [
                    Sk.builtin.none.none$,
                    Sk.builtin.bool.false$,
                ]);
                return this.list$sort(undefined, key, reverse);
            },
            $flags: { FastCall: true },
            $textsig: "($self, /, *, key=None, reverse=False)",
            $doc: "Stable sort *IN PLACE*.",
        },
        index: {
            $meth(value, start, stop) {
                if ((start !== undefined && !Sk.misceval.isIndex(start)) || (stop !== undefined && !Sk.misceval.isIndex(stop))) {
                    // unusually can't have None here so check this first...
                    throw new Sk.builtin.TypeError("slice indices must be integers or have an __index__ method");
                }
                const i = this.list$indexOf(value, start, stop);
                if (i === -1) {
                    throw new Sk.builtin.ValueError(Sk.misceval.objectRepr(value) + " is not in list");
                }
                return new Sk.builtin.int_(i);
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: "($self, value, start=0, stop=sys.maxsize, /)",
            $doc: "Return first index of value.\n\nRaises ValueError if the value is not present.",
        },
        count: {
            $meth(item) {
                let count = 0;
                const len = this.v.length;
                for (let i = 0; i < len; i++) {
                    if (this.v[i] === item || Sk.misceval.richCompareBool(this.v[i], item, "Eq")) {
                        count += 1;
                    }
                }
                return new Sk.builtin.int_(count);
            },
            $flags: { OneArg: true },
            $textsig: "($self, value, /)",
            $doc: "Return number of occurrences of value.",
        },
        reverse: {
            $meth() {
                this.list$reverse();
                return Sk.builtin.none.none$;
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Reverse *IN PLACE*.",
        },
    },
    proto: /** @lends {Sk.builtin.list.prototype}*/ {
        sk$asarray() {
            return this.v.slice(0);
        },
        list$sort,
        list$inRange(i, msg) {
            if (i < 0) {
                i += this.v.length;
            }
            if (i >= 0 && i < this.v.length) {
                return i;
            }
            throw new Sk.builtin.IndexError(msg);
        },
        list$indexOf(item, start, end) {
            ({ start, end } = Sk.builtin.slice.startEnd$wrt(this, start, end));
            for (let i = start; i < end && i < this.v.length; i++) {
                if (this.v[i] === item || Sk.misceval.richCompareBool(this.v[i], item, "Eq")) {
                    return i;
                }
            }
            return -1;
        },
        list$reverse() {
            this.v.reverse();
        },
        ass$subscript(index, value) {
            if (Sk.misceval.isIndex(index)) {
                this.ass$index(index, value);
            } else if (index instanceof Sk.builtin.slice) {
                const { start, stop, step } = index.slice$indices(this.v.length);
                if (step === 1) {
                    this.ass$slice(start, stop, value);
                } else {
                    this.ass$ext_slice(index, value);
                }
            } else {
                throw new Sk.builtin.TypeError("list indices must be integers or slices, not " + Sk.abstr.typeName(index));
            }
        },
        ass$index(index, value) {
            let i = Sk.misceval.asIndexSized(index, Sk.builtin.IndexError);
            i = this.list$inRange(i, "list assignment index out of range");
            this.v[i] = value;
        },
        ass$slice(start, stop, iterable) {
            if (!Sk.builtin.checkIterable(iterable)) {
                throw new Sk.builtin.TypeError("can only assign an iterable");
            }
            const vals = Sk.misceval.arrayFromIterable(iterable);
            this.v.splice(start, stop - start, ...vals);
        },
        ass$ext_slice(slice, iterable) {
            const indices = [];
            slice.sssiter$(this.v.length, (i) => {
                indices.push(i);
            });
            if (!Sk.builtin.checkIterable(iterable)) {
                throw new Sk.builtin.TypeError("must assign iterable to extended slice");
            }
            const vals = Sk.misceval.arrayFromIterable(iterable);
            if (indices.length !== vals.length) {
                throw new Sk.builtin.ValueError("attempt to assign sequence of size " + vals.length + " to extended slice of size " + indices.length);
            }
            for (let i = 0; i < indices.length; i++) {
                this.v.splice(indices[i], 1, vals[i]);
            }
        },
        del$subscript(index) {
            if (Sk.misceval.isIndex(index)) {
                this.del$index(index);
            } else if (index instanceof Sk.builtin.slice) {
                const { start, stop, step } = index.slice$indices(this.v.length);
                if (step === 1) {
                    this.del$slice(start, stop);
                } else {
                    this.del$ext_slice(index, step > 0 ? 1 : 0);
                }
            } else {
                throw new Sk.builtin.TypeError("list indices must be integers, not " + Sk.abstr.typeName(index));
            }
        },
        del$index(index) {
            let i = Sk.misceval.asIndexSized(index, Sk.builtin.IndexError);
            i = this.list$inRange(i, "list assignment index out of range");
            this.v.splice(i, 1);
        },
        del$slice(start, stop) {
            this.v.splice(start, stop - start);
        },
        del$ext_slice(slice, offdir) {
            let dec = 0; // offset of removal for next index (because we'll have removed, but the iterator is giving orig indices)
            slice.sssiter$(this.v.length, (i) => {
                this.v.splice(i - dec, 1);
                dec += offdir;
            });
        },
    },
});

Sk.exportSymbol("Sk.builtin.list", Sk.builtin.list);

/**
 * @function
 * 
 * @param {?=} cmp optional (not supported in py3)
 * @param {?=} key optional (keyword only argument in py3)
 * @param {?=} reverse optional (keyword only argument in py3)
 * 
 * @private
 */
function list$sort(cmp, key, reverse) {
    const has_key = key != null && key !== Sk.builtin.none.none$;
    const has_cmp = cmp != null && cmp !== Sk.builtin.none.none$;
    let rev, item;
    if (reverse === undefined) {
        rev = false;
    } else if (!Sk.builtin.checkInt(reverse)) {
        throw new Sk.builtin.TypeError("an integer is required");
    } else {
        rev = Sk.misceval.isTrue(reverse);
    }
    const timsort = new Sk.builtin.timSort(this);

    this.v = [];
    const zero = new Sk.builtin.int_(0);

    if (has_key) {
        if (has_cmp) {
            timsort.lt = function (a, b) {
                var res = Sk.misceval.callsimArray(cmp, [a[0], b[0]]);
                return Sk.misceval.richCompareBool(res, zero, "Lt");
            };
        } else {
            timsort.lt = function (a, b) {
                return Sk.misceval.richCompareBool(a[0], b[0], "Lt");
            };
        }
        for (let i = 0; i < timsort.listlength; i++) {
            item = timsort.list.v[i];
            const keyvalue = Sk.misceval.callsimArray(key, [item]);
            timsort.list.v[i] = [keyvalue, item];
        }
    } else if (has_cmp) {
        timsort.lt = function (a, b) {
            var res = Sk.misceval.callsimArray(cmp, [a, b]);
            return Sk.misceval.richCompareBool(res, zero, "Lt");
        };
    }

    if (rev) {
        timsort.list.list$reverse();
    }

    timsort.sort();

    if (rev) {
        timsort.list.list$reverse();
    }

    if (has_key) {
        for (let j = 0; j < timsort.listlength; j++) {
            item = timsort.list.v[j][1];
            timsort.list.v[j] = item;
        }
    }

    const mucked = this.sq$length() > 0;

    this.v = timsort.list.v;

    if (mucked) {
        throw new Sk.builtin.ValueError("list modified during sort");
    }

    return Sk.builtin.none.none$;
};

Sk.builtin.list.py2$methods = {
    sort: {
        $name: "sort",
        $meth(args, kwargs) {
            const [cmp, key, reverse] = Sk.abstr.copyKeywordsToNamedArgs("sort", ["cmp", "key", "reverse"], args, kwargs, [
                Sk.builtin.none.none$,
                Sk.builtin.none.none$,
                Sk.builtin.bool.false$,
            ]);
            return this.list$sort(cmp, key, reverse);
        },
        $flags: {
            FastCall: true, // named args might be better here but one of the args is pyFalse
            // and bool class does not exist yet. So use FastCall instead.
        },
        $textsig: "($self, cmp=None, key=None, reverse=False)",
        $doc: "Stable sort *IN PLACE*.",
    },
};

/**
 * @constructor
 * @extends {Sk.builtin.object}
 * @param {Sk.builtin.list} lst
 * @private
 */
var list_iter_ = Sk.abstr.buildIteratorClass("list_iterator", {
    constructor: function list_iter_(lst) {
        this.$index = 0;
        this.$seq = lst.v;
    },
    iternext: Sk.generic.iterNextWithArray,
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});

/**
 * @constructor
 * @extends {Sk.builtin.object}
 * @param {Sk.builtin.list} lst
 * @private
 */
var reverselist_iter_ = Sk.abstr.buildIteratorClass("list_reverseiterator", {
    constructor: function reverselist_iter_(lst) {
        this.$index = lst.v.length - 1;
        this.$seq = lst.v;
    },
    iternext() {
        const item = this.$seq[this.$index--];
        if (item === undefined) {
            this.tp$iternext = () => undefined;
            return undefined;
        }
        return item;
    },
    methods: {
        __length_hint__: Sk.generic.iterReverseLengthHintMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});
