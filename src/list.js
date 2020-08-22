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
        }

        Sk.asserts.assert(Array.isArray(L) && this instanceof Sk.builtin.list, "bad call to list, use 'new' with an Array");
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
        tp$init: function (args, kwargs) {
            // this will be an Sk.builtin.list.prototype or a sk$klass.prototype that inherits from Sk.builtin.list.prototype
            Sk.abstr.checkNoKwargs("list", kwargs);
            Sk.abstr.checkArgsLen("list", args, 0, 1);
            return Sk.misceval.chain(Sk.misceval.arrayFromIterable(args[0], true), (L) => {
                this.v = L;
                return Sk.builtin.none.none$;
            });
        },
        $r: function () {
            if (this.in$repr) {
                return new Sk.builtin.str("[...]");
            }
            this.in$repr = true;
            const ret = this.v.map((x) => Sk.misceval.objectRepr(x));
            this.in$repr = false;
            return new Sk.builtin.str("[" + ret.join(", ") + "]");
        },
        tp$richcompare: function (other, op) {
            // if the comparison allows for equality then short-circuit it here
            if (this === other && Sk.misceval.opAllowsEquality(op)) {
                return true;
            }
            if (!(other instanceof Sk.builtin.list)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            const v = this.v;
            const w = other.v;
            const vl = v.length;
            const wl = w.length;
            if (vl !== wl && (op === "Eq" || op === "NotEq")) {
                /* Shortcut: if the lengths differ, the lists differ */
                return op === "Eq" ? false : true;
            }
            let i;
            for (i = 0; i < vl && i < wl; ++i) {
                if (!(v[i] === w[i] || Sk.misceval.richCompareBool(v[i], w[i], "Eq"))) {
                    break;
                }
            }
            if (i >= vl || i >= wl) {
                // no more items to compare, compare sizes
                switch (op) {
                    case "Lt":
                        return vl < wl;
                    case "LtE":
                        return vl <= wl;
                    case "Eq":
                        return vl === wl;
                    case "NotEq":
                        return vl !== wl;
                    case "Gt":
                        return vl > wl;
                    case "GtE":
                        return vl >= wl;
                    default:
                        Sk.asserts.fail();
                }
            }
            // we have an item that's different
            // shortcuts for eq/not
            if (op === "Eq") {
                return false;
            }
            if (op === "NotEq") {
                return true;
            }
            // or, compare the differing element using the proper operator
            return Sk.misceval.richCompareBool(v[i], w[i], op);
        },
        tp$iter: function () {
            return new list_iter_(this);
        },

        // sequence and mapping slots
        sq$length: function () {
            return this.v.length;
        },
        sq$concat: function (other) {
            if (!(other instanceof Sk.builtin.list)) {
                throw new Sk.builtin.TypeError("can only concatenate list to list");
            }
            return new Sk.builtin.list(this.v.concat(other.v));
        },
        sq$contains: function (item) {
            for (let it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                if (i === item || Sk.misceval.richCompareBool(i, item, "Eq")) {
                    return true;
                }
            }
            return false;
        },
        sq$repeat: function (n) {
            if (!Sk.misceval.isIndex(n)) {
                throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
            }
            n = Sk.misceval.asIndexSized(n, Sk.builtin.OverflowError);
            const ret = [];
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < this.v.length; j++) {
                    ret.push(this.v[j]);
                }
            }
            return new Sk.builtin.list(ret);
        },
        mp$subscript: function (index) {
            if (Sk.misceval.isIndex(index)) {
                let i = Sk.misceval.asIndexSized(index);
                i = this.list$inRange(i, "list index out of range");
                return this.v[i];
            } else if (index instanceof Sk.builtin.slice) {
                const ret = [];
                index.sssiter$(this.v.length, (i) => {
                    ret.push(this.v[i]);
                });
                return new Sk.builtin.list(ret);
            }
            throw new Sk.builtin.TypeError("list indices must be integers or slice, not " + Sk.abstr.typeName(index));
        },
        mp$ass_subscript: function (index, value) {
            if (value === undefined) {
                this.del$subscript(index);
            } else {
                this.ass$subscript(index, value);
            }
            return Sk.builtin.none.none$;
        },
        sq$inplace_concat: function (other) {
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
        sq$inplace_repeat: function (n) {
            if (!Sk.misceval.isIndex(n)) {
                throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
            }
            n = Sk.misceval.asIndexSized(n, Sk.builtin.OverflowError);
            const len = this.v.length;
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
            $meth: function () {
                return new reverselist_iter_(this);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return a reverse iterator over the list.",
        },
        clear: {
            $meth: function () {
                this.v.length = 0;
                return Sk.builtin.none.none$;
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Remove all items from list.",
        },
        copy: {
            $meth: function () {
                return new Sk.builtin.list(this.v.slice(0));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return a shallow copy of the list.",
        },
        append: {
            $meth: function (item) {
                this.v.push(item);
                return Sk.builtin.none.none$;
            },
            $flags: { OneArg: true },
            $textsig: "($self, object, /)",
            $doc: "Append object to the end of the list.",
        },
        insert: {
            $meth: function (i, x) {
                i = Sk.misceval.asIndexSized(i, Sk.builtin.OverflowError);
                const { start } = Sk.builtin.slice.$indices(this, i);
                this.v.splice(start, 0, x);
                return Sk.builtin.none.none$;
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($self, index, object, /)",
            $doc: "Insert object before index.",
        },
        extend: {
            $meth: function (iterable) {
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
            $meth: function (i) {
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
            $meth: function (item) {
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
            $meth: function (args, kwargs) {
                Sk.abstr.checkNoArgs("sort", args);
                const [key, reverse] = Sk.abstr.copyKeywordsToNamedArgs("sort", ["key", "reverse"], [], kwargs, [
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
            $meth: function (value, start, stop) {
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
            $meth: function (item) {
                let count = 0;
                const len = this.v.length;
                const obj = this.v;
                for (let i = 0; i < len; ++i) {
                    if (obj[i] === item || Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
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
            $meth: function () {
                this.list$reverse();
                return Sk.builtin.none.none$;
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Reverse *IN PLACE*.",
        },
    },
    proto: /** @lends {Sk.builtin.list.prototype}*/ {
        sk$asarray: function () {
            return this.v.slice(0);
        },
        list$inRange: function (i, msg) {
            if (i < 0) {
                i += this.v.length;
            }
            if (i >= 0 && i < this.v.length) {
                return i;
            }
            throw new Sk.builtin.IndexError(msg);
        },
        list$indexOf: function (item, start, end) {
            ({ start, end } = Sk.builtin.slice.$indices(this, start, end));
            for (let i = start; i < end; ++i) {
                if (this.v[i] === item || Sk.misceval.richCompareBool(this.v[i], item, "Eq")) {
                    return i;
                }
            }
            return -1;
        },
        list$reverse: function () {
            this.v.reverse();
        },
        ass$subscript: function (index, value) {
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
                throw new Sk.builtin.TypeError("list indices must be integers or slice, not " + Sk.abstr.typeName(index));
            }
        },
        ass$index: function (index, value) {
            let i = Sk.misceval.asIndexSized(index);
            i = this.list$inRange(i, "list assignment index out of range");
            this.v[i] = value;
        },
        ass$slice: function (start, stop, iterable) {
            if (!Sk.builtin.checkIterable(iterable)) {
                throw new Sk.builtin.TypeError("can only assign an iterable");
            }
            const vals = Sk.misceval.arrayFromIterable(iterable);
            this.v.splice(start, stop - start, ...vals);
        },
        ass$ext_slice: function (slice, iterable) {
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
        del$subscript: function (index) {
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
        del$index: function (index) {
            let i = Sk.misceval.asIndexSized(index);
            i = this.list$inRange(i, "list assignment index out of range");
            this.v.splice(i, 1);
        },
        del$slice: function (start, stop) {
            this.v.splice(start, stop - start);
        },
        del$ext_slice: function (slice, offdir) {
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
 * @param {?=} cmp optional (not supported in py3)
 * @param {?=} key optional (keyword only argument in py3)
 * @param {?=} reverse optional (keyword only argument in py3)
 */
Sk.builtin.list.prototype.list$sort = function sort(cmp, key, reverse) {
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
        throw new Sk.builtin.OperationError("list modified during sort");
    }

    return Sk.builtin.none.none$;
};

Sk.builtin.list.py2$methods = {
    sort: {
        $name: "sort",
        $meth: function (args, kwargs) {
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
    iternext: function () {
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
