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
            if (this.$entered_repr !== undefined) {
                return new Sk.builtin.str("[...]");
            }
            this.$entered_repr = true;
            const ret = new Sk.builtin.str("[" + this.v.map((x) => Sk.misceval.objectRepr(x)).join(", ") + "]");
            this.$entered_repr = undefined;
            return ret;
        },
        tp$richcompare: function (w, op) {
            // if the comparison allows for equality then short-circuit it here
            if (this === w && Sk.misceval.opAllowsEquality(op)) {
                return true;
            }
            if (!(w instanceof Sk.builtin.list)) {
                if (Sk.__future__.python3) {
                    return Sk.builtin.NotImplemented.NotImplemented$;
                }
                return op === "NotEq" ? true : false; // py 2 mode...
            }
            let i;
            const v = this.v;
            w = w.v;
            const vl = v.length;
            const wl = w.length;
            if (vl != wl && (op === "Eq" || op === "NotEq")) {
                /* Shortcut: if the lengths differ, the lists differ */
                return op === "Eq" ? false : true;
            }
            for (i = 0; i < vl && i < wl; ++i) {
                if (v[i] === w[i] || Sk.misceval.richCompareBool(v[i], w[i], "Eq")) {
                    continue;
                } else {
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
            return new Sk.builtin.list_iter_(this);
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
            n = Sk.misceval.asIndex(n);
            if (typeof n !== "number") {
                throw new Sk.builtin.OverflowError("cannot fit '" + Sk.abstr.typeName(n) + "' into an index-sized integer");
            }
            const ret = [];
            for (let i = 0; i < n; ++i) {
                for (let j = 0; j < this.v.length; ++j) {
                    ret.push(this.v[j]);
                }
            }
            return new Sk.builtin.list(ret);
        },
        mp$subscript: function (index) {
            if (Sk.misceval.isIndex(index)) {
                let i = Sk.misceval.asIndexOrThrow(index);
                if (typeof i !== "number") {
                    throw new Sk.builtin.IndexError("cannot fit '" + Sk.abstr.typeName(index) + "' into an index-sized integer");
                }
                if (i < 0) {
                    i = this.v.length + i;
                }
                if (i < 0 || i >= this.v.length) {
                    throw new Sk.builtin.IndexError("list index out of range");
                }
                return this.v[i];
            } else if (index.constructor === Sk.builtin.slice) {
                const ret = [];
                const lst = this.v;
                index.sssiter$(lst.length, (i) => {
                    ret.push(lst[i]);
                });
                return new Sk.builtin.list(ret);
            }
            throw new Sk.builtin.TypeError("list indices must be integers, not " + Sk.abstr.typeName(index));
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
            other = Sk.misceval.arrayFromIterable(other);
            this.v.push(...other);
            return this;
        },
        sq$inplace_repeat: function (n) {
            if (!Sk.misceval.isIndex(n)) {
                throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
            }
            n = Sk.misceval.asIndex(n);
            if (typeof n !== "number") {
                throw new Sk.builtin.OverflowError("cannot fit '" + Sk.abstr.typeName(n) + "' into an index-sized integer");
            }
            const len = this.v.length;
            for (let i = 1; i < n; ++i) {
                for (let j = 0; j < len; ++j) {
                    this.v.push(this.v[j]);
                }
            }
            return this;
        },
    },
    methods: /** @lends {Sk.builtin.list.prototype}*/ {
        __reversed__: {
            $meth: function () {
                return new Sk.builtin.reverselist_iter_(this);
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: "Return a reverse iterator over the list.",
        },
        clear: {
            $meth: function () {
                this.v = [];
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
                if (!Sk.builtin.checkNumber(i)) {
                    throw new Sk.builtin.TypeError("an integer is required");
                }
                i = Sk.builtin.asnum$(i);
                if (i < 0) {
                    i = i + this.v.length;
                }
                if (i < 0) {
                    i = 0;
                } else if (i > this.v.length) {
                    i = this.v.length;
                }
                this.v.splice(i, 0, x);
                return Sk.builtin.none.none$;
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($self, index, object, /)",
            $doc: "Insert object before index.",
        },
        extend: {
            $meth: function (iterable) {
                this.nb$inplace_add(iterable);
                return Sk.builtin.none.none$;
            },
            $flags: { OneArg: true },
            $textsig: "($self, iterable, /)",
            $doc: "Extend list by appending elements from the iterable.",
        },
        pop: {
            $meth: function (i) {
                if (i === undefined) {
                    i = this.v.length - 1;
                }
                if (!Sk.builtin.checkNumber(i)) {
                    throw new Sk.builtin.TypeError("an integer is required");
                }
                i = Sk.builtin.asnum$(i);
                if (i < 0) {
                    i = i + this.v.length;
                }
                if (i < 0 || i >= this.v.length) {
                    throw new Sk.builtin.IndexError("pop index out of range");
                }
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
                const idx = this.$index(item);
                this.v.splice(Sk.builtin.asnum$(idx), 1);
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
                return this.$index(value, start, stop);
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
                    if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
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
                return this.$list_reverse();
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
    },
});

Sk.exportSymbol("Sk.builtin.list", Sk.builtin.list);

/**
 * @function
 * @param {Sk.builtin.object} index
 * @param {Sk.builtin.object} value
 *
 * @description
 * called by mp$ass_subscript when assigning a value rather than deleting
 *
 */
Sk.builtin.list.prototype.ass$subscript = function (index, value) {
    if (Sk.misceval.isIndex(index)) {
        let i = Sk.misceval.asIndexOrThrow(index);
        if (typeof i !== "number") {
            throw new Sk.builtin.IndexError("cannot fit '" + Sk.abstr.typeName(index) + "' into an index-sized integer");
        }
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.length + i;
            }
            this.ass$item(i, value);
            return;
        }
    } else if (index instanceof Sk.builtin.slice) {
        const indices = index.$slice_indices(this.v.length);
        if (indices[2] === 1) {
            this.ass$slice(indices[0], indices[1], value);
        } else {
            const tosub = [];
            index.sssiter$(this.v.length, (i) => {
                tosub.push(i);
            });
            let j = 0;
            if (tosub.length !== value.v.length) {
                throw new Sk.builtin.ValueError(
                    "attempt to assign sequence of size " + value.v.length + " to extended slice of size " + tosub.length
                );
            }
            for (let i = 0; i < tosub.length; ++i) {
                this.v.splice(tosub[i], 1, value.v[j]);
                j += 1;
            }
        }
        return;
    }
    throw new Sk.builtin.TypeError("list indices must be integers, not " + Sk.abstr.typeName(index));
};

/**
 * @function
 * @param {Sk.builtin.object} index
 *
 * @description
 * called by mp$ass_subscript when deleting an index/slice
 *
 */
Sk.builtin.list.prototype.del$subscript = function (index) {
    if (Sk.misceval.isIndex(index)) {
        let i = Sk.misceval.asIndex(index);
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.length + i;
            }
            this.del$item(i);
            return;
        }
    } else if (index instanceof Sk.builtin.slice) {
        const indices = index.$slice_indices(this.v.length);
        if (indices[2] === 1) {
            this.del$slice(indices[0], indices[1]);
        } else {
            const lst = this.v;
            let dec = 0; // offset of removal for next index (because we'll have removed, but the iterator is giving orig indices)
            const offdir = indices[2] > 0 ? 1 : 0;
            index.sssiter$(lst.length, (i) => {
                lst.splice(i - dec, 1);
                dec += offdir;
            });
        }
        return;
    }
    throw new Sk.builtin.TypeError("list indices must be integers, not " + Sk.abstr.typeName(index));
};

Sk.builtin.list.prototype.del$item = function (i) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 || i >= this.v.length) {
        throw new Sk.builtin.IndexError("list assignment index out of range");
    }
    this.del$slice(i, i + 1);
};

Sk.builtin.list.prototype.del$slice = function (ilow, ihigh) {
    ilow = Sk.builtin.asnum$(ilow);
    ihigh = Sk.builtin.asnum$(ihigh);
    const args = [];
    args.unshift(ihigh - ilow);
    args.unshift(ilow);
    this.v.splice.apply(this.v, args);
};

Sk.builtin.list.prototype.ass$item = function (i, v) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 || i >= this.v.length) {
        throw new Sk.builtin.IndexError("list assignment index out of range");
    }
    this.v[i] = v;
};

Sk.builtin.list.prototype.ass$slice = function (ilow, ihigh, v) {
    const args = [];
    ilow = Sk.builtin.asnum$(ilow);
    ihigh = Sk.builtin.asnum$(ihigh);

    if (Sk.builtin.checkIterable(v)) {
        const iter = Sk.abstr.iter(v);
        for (let i = iter.tp$iternext(); i !== undefined; i = iter.tp$iternext()) {
            args.push(i);
        }
    } else {
        throw new Sk.builtin.TypeError("can only assign an iterable");
    }
    args.unshift(ihigh - ilow);
    args.unshift(ilow);
    this.v.splice.apply(this.v, args);
};

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
    } else if (reverse === Sk.builtin.none.none$) {
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
        timsort.list.$list_reverse();
    }

    timsort.sort();

    if (rev) {
        timsort.list.$list_reverse();
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

/**
 * @this {Sk.builtin.list}
 **/
Sk.builtin.list.prototype.$list_reverse = function () {
    this.v.reverse();
    return Sk.builtin.none.none$;
};

Sk.builtin.list.prototype.$index = function (item, start, stop) {
    if (start !== undefined && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers");
    }
    if (stop !== undefined && !Sk.builtin.checkInt(stop)) {
        throw new Sk.builtin.TypeError("slice indices must be integers");
    }

    const len = this.v.length;
    const obj = this.v;

    start = start === undefined ? 0 : start.v;
    if (start < 0) {
        start = start + len >= 0 ? start + len : 0;
    }

    stop = stop === undefined ? len : stop.v;
    if (stop < 0) {
        stop = stop + len >= 0 ? stop + len : 0;
    }

    for (let i = start; i < stop; ++i) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            return new Sk.builtin.int_(i);
        }
    }
    throw new Sk.builtin.ValueError("list.index(x): x not in list");
};

Sk.builtin.list.py2$methods = {
    sort: {
        $name: "sort",
        $meth: function (cmp, key, reverse) {
            return this.list$sort(cmp, key, reverse);
        },
        $flags: {
            NamedArgs: ["cmp", "key", "reverse"],
            Defaults: [Sk.builtin.none.none$, Sk.builtin.none.none$, false], //use false since bool not defined yet
        },
        $textsig: "($self, cmp=None, key=None, reverse=False)",
        $doc: "Stable sort *IN PLACE*.",
    },
};
