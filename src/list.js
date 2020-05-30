/**
 * @constructor
 * @param {Array.<Object>=} L
 * @param {boolean=} canSuspend (defaults to true in this case, as list() is used directly from Python)
 * @extends Sk.builtin.object
 */
Sk.builtin.list = function (L) {
    // this is an internal function and should be called with an array object
    if (L === undefined) {
        L = [];
    }
    Sk.asserts.assert(Array.isArray(L) && this instanceof Sk.builtin.list);
    this.v = L;
};

Sk.abstr.setUpInheritance("list", Sk.builtin.list, Sk.builtin.object);

Sk.abstr.markUnhashable(Sk.builtin.list);

Sk.builtin.list.prototype.tp$as_sequence_or_mapping = true;

Sk.builtin.list.prototype.tp$doc =
    "Built-in mutable sequence.\n\nIf no argument is given, the constructor creates a new empty list.\nThe argument must be an iterable if specified.";

Sk.builtin.list.prototype.tp$new = Sk.generic.new(Sk.builtin.list);

Sk.builtin.list.prototype.tp$init = function (args, kwargs) {
    // this will be an Sk.builtin.list.prototype or a sk$klass.prototype that inherits from Sk.builtin.list.prototype
    Sk.abstr.checkNoKwargs("list", kwargs);
    Sk.abstr.checkArgsLen("list", args, 0, 1);
    const arg = args[0];
    if (arg === undefined) {
        return Sk.builtin.none.none$;
    }
    if (arg.sk$asarray && !arg.hp$type) {
        this.v = arg.sk$asarray();
        return Sk.builtin.none.none$;
    }
    const self = this;
    return Sk.misceval.chain(
        Sk.misceval.iterFor(Sk.abstr.iter(arg), (i) => {
            self.v.push(i);
        }),
        () => {
            return Sk.builtin.none.none$;
        }
    );
};

Sk.builtin.list.prototype.$r = function () {
    var it, i;
    var ret = [];
    for (it = Sk.abstr.iter(this), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (i === this) {
            ret.push("[...]");
        } else {
            ret.push(Sk.misceval.objectRepr(i).v);
        }
    }
    return new Sk.builtin.str("[" + ret.join(", ") + "]");
};

Sk.builtin.list.prototype.tp$richcompare = function (w, op) {
    // todo; can't figure out where cpy handles this silly case (test/run/t96.py)
    // perhaps by trapping a stack overflow? otherwise i'm not sure for more
    // complicated cases. bleh
    //
    // if the comparison allows for equality then short-circuit it here
    var k;
    var i;
    var wl;
    var vl;
    var v;
    if (this === w && Sk.misceval.opAllowsEquality(op)) {
        return true;
    }

    // w not a list
    if (!(w instanceof Sk.builtin.list)) {
        // shortcuts for eq/not
        if (op === "Eq") {
            return false;
        }
        if (op === "NotEq") {
            return true;
        }

        if (Sk.__future__.python3) {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        // todo; other types should have an arbitrary order
        return false;
    }

    v = this.v;
    w = w.v;
    vl = v.length;
    wl = w.length;

    for (i = 0; i < vl && i < wl; ++i) {
        k = Sk.misceval.richCompareBool(v[i], w[i], "Eq");
        if (!k) {
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
};

Sk.builtin.list.prototype.tp$iter = function () {
    return new Sk.builtin.list_iter_(this);
};

Sk.builtin.list.prototype.sq$length = function () {
    return this.v.length;
};

Sk.builtin.list.prototype.mp$subscript = function (index) {
    var ret;
    var i;
    if (Sk.misceval.isIndex(index)) {
        i = Sk.misceval.asIndex(index);
        if (typeof i !== "number") {
            throw new Sk.builtin.IndexError("cannot fit '" + Sk.abstr.typeName(index) + "' into an index-sized integer");
        }
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.length + i;
            }
            if (i < 0 || i >= this.v.length) {
                throw new Sk.builtin.IndexError("list index out of range");
            }
            return this.v[i];
        }
    } else if (index instanceof Sk.builtin.slice) {
        ret = [];
        index.sssiter$(this, function (i, wrt) {
            ret.push(wrt.v[i]);
        });
        return new Sk.builtin.list(ret, false);
    }

    throw new Sk.builtin.TypeError("list indices must be integers, not " + Sk.abstr.typeName(index));
};

Sk.builtin.list.prototype.mp$ass_subscript = function (index, value) {
    var i;
    var j;
    var tosub;
    var indices;
    if (Sk.misceval.isIndex(index)) {
        i = Sk.misceval.asIndex(index);
        if (typeof i !== "number") {
            throw new Sk.builtin.IndexError("cannot fit '" + Sk.abstr.typeName(index) + "' into an index-sized integer");
        }
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.length + i;
            }
            this.sq$ass_item(i, value);
            return;
        }
    } else if (index instanceof Sk.builtin.slice) {
        indices = index.$slice_indices(this.v.length);
        if (indices[2] === 1) {
            this.sq$ass_slice(indices[0], indices[1], value);
        } else {
            tosub = [];
            index.sssiter$(this, function (i, wrt) {
                tosub.push(i);
            });
            j = 0;
            if (tosub.length !== value.v.length) {
                throw new Sk.builtin.ValueError(
                    "attempt to assign sequence of size " + value.v.length + " to extended slice of size " + tosub.length
                );
            }
            for (i = 0; i < tosub.length; ++i) {
                this.v.splice(tosub[i], 1, value.v[j]);
                j += 1;
            }
        }
        return;
    }

    throw new Sk.builtin.TypeError("list indices must be integers, not " + Sk.abstr.typeName(index));
};

Sk.builtin.list.prototype.sq$concat = function (other) {
    // other not a list
    var i;
    var ret;
    if (!other.ob$type || other.ob$type != Sk.builtin.list) {
        throw new Sk.builtin.TypeError("can only concatenate list to list");
    }

    ret = this.v.slice();
    for (i = 0; i < other.v.length; ++i) {
        ret.push(other.v[i]);
    }
    return new Sk.builtin.list(ret, false);
};

// Sk.builtin.list.prototype.nb$add = Sk.builtin.list.prototype.nb$reflected_add = Sk.builtin.list.prototype.sq$concat;

Sk.builtin.list.prototype.sq$repeat = function (n) {
    var j;
    var i;
    var ret;
    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    n = Sk.misceval.asIndex(n);
    if (typeof n !== "number") {
        throw new Sk.builtin.OverflowError("cannot fit '" + Sk.abstr.typeName(n) + "' into an index-sized integer");
    }
    ret = [];
    for (i = 0; i < n; ++i) {
        for (j = 0; j < this.v.length; ++j) {
            ret.push(this.v[j]);
        }
    }
    return new Sk.builtin.list(ret, false);
};

// Sk.builtin.list.prototype.nb$multiply = Sk.builtin.list.prototype.nb$reflected_multiply = Sk.builtin.list.prototype.sq$repeat;

Sk.builtin.list.prototype.sq$contains = function (item) {
    var it, i;

    for (it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.misceval.richCompareBool(i, item, "Eq")) {
            return true;
        }
    }
    return false;
};

Sk.builtin.list.prototype.nb$inplace_add = function (other) {
    var it, i;
    var newb;
    if (!Sk.builtin.checkIterable(other)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) + "' object is not iterable");
    }

    if (this == other) {
        // Handle extending list with itself
        newb = [];
        for (it = Sk.abstr.iter(other), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            newb.push(i);
        }

        // Concatenate
        this.v.push.apply(this.v, newb);
    } else {
        for (it = Sk.abstr.iter(other), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            this.v.push(i);
        }
    }

    return this;
};

Sk.builtin.list.prototype.nb$inplace_multiply = function (n) {
    var j;
    var i;
    var len;
    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    // works on list itself --> inplace
    n = Sk.misceval.asIndex(n);
    if (typeof n !== "number") {
        throw new Sk.builtin.OverflowError("cannot fit '" + Sk.abstr.typeName(n) + "' into an index-sized integer");
    }
    len = this.v.length;
    for (i = 1; i < n; ++i) {
        for (j = 0; j < len; ++j) {
            this.v.push(this.v[j]);
        }
    }

    return this;
};

//TODO: Delete should be really just trigger subscript with null as the value
Sk.builtin.list.prototype.$list_del_item = function (i) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 || i >= this.v.length) {
        throw new Sk.builtin.IndexError("list assignment index out of range");
    }
    this.$list_del_slice(i, i + 1);
};

Sk.builtin.list.prototype.$list_del_slice = function (ilow, ihigh) {
    var args;
    ilow = Sk.builtin.asnum$(ilow);
    ihigh = Sk.builtin.asnum$(ihigh);
    args = [];
    args.unshift(ihigh - ilow);
    args.unshift(ilow);
    this.v.splice.apply(this.v, args);
};

Sk.builtin.list.prototype.sq$ass_item = function (i, v) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 || i >= this.v.length) {
        throw new Sk.builtin.IndexError("list assignment index out of range");
    }
    this.v[i] = v;
};

Sk.builtin.list.prototype.sq$ass_slice = function (ilow, ihigh, v) {
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

/*
 Sk.builtin.list.prototype.sq$item = list_item;
 Sk.builtin.list.prototype.sq$slice = list_slice;
 */
Sk.builtin.list.prototype.sq$del_item = Sk.builtin.list.prototype.$list_del_item;
Sk.builtin.list.prototype.sq$del_slice = Sk.builtin.list.prototype.$list_del_slice;

Sk.builtin.list.prototype.$list_del_subscript = function (index) {
    var offdir;
    var dec;
    var self;
    var indices;
    var i;
    if (Sk.misceval.isIndex(index)) {
        i = Sk.misceval.asIndex(index);
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.length + i;
            }
            this.$list_del_item(i);
            return;
        }
    } else if (index instanceof Sk.builtin.slice) {
        indices = index.$slice_indices(this.v.length);
        if (indices[2] === 1) {
            this.$list_del_slice(indices[0], indices[1]);
        } else {
            self = this;
            dec = 0; // offset of removal for next index (because we'll have removed, but the iterator is giving orig indices)
            offdir = indices[2] > 0 ? 1 : 0;
            index.sssiter$(this, function (i, wrt) {
                self.v.splice(i - dec, 1);
                dec += offdir;
            });
        }
        return;
    }

    throw new Sk.builtin.TypeError("list indices must be integers, not " + typeof index);
};

// TODO: this should really be mp$ass_subscript with a null value
Sk.builtin.list.prototype.mp$del_subscript = Sk.builtin.list.prototype.$list_del_subscript;

/**
 * @param {?=} self
 * @param {?=} cmp optional
 * @param {?=} key optional
 * @param {?=} reverse optional
 */
Sk.builtin.list.prototype.$list_sort = function sort(self, cmp, key, reverse) {
    var mucked;
    var j;
    var keyvalue;
    var item;
    var i;
    var zero;
    var timsort;
    var has_key = key !== undefined && key !== null && key !== Sk.builtin.none.none$;
    var has_cmp = cmp !== undefined && cmp !== null && cmp !== Sk.builtin.none.none$;
    var rev;

    if (reverse === undefined) {
        rev = false;
    } else if (reverse === Sk.builtin.none.none$) {
        throw new Sk.builtin.TypeError("an integer is required");
    } else {
        rev = Sk.misceval.isTrue(reverse);
    }
    timsort = new Sk.builtin.timSort(self);

    self.v = [];
    zero = new Sk.builtin.int_(0);

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
        for (i = 0; i < timsort.listlength; i++) {
            item = timsort.list.v[i];
            keyvalue = Sk.misceval.callsimArray(key, [item]);
            timsort.list.v[i] = [keyvalue, item];
        }
    } else if (has_cmp) {
        timsort.lt = function (a, b) {
            var res = Sk.misceval.callsimArray(cmp, [a, b]);
            return Sk.misceval.richCompareBool(res, zero, "Lt");
        };
    }

    if (rev) {
        timsort.list.$list_reverse(timsort.list);
    }

    timsort.sort();

    if (rev) {
        timsort.list.$list_reverse(timsort.list);
    }

    if (has_key) {
        for (j = 0; j < timsort.listlength; j++) {
            item = timsort.list.v[j][1];
            timsort.list.v[j] = item;
        }
    }

    mucked = self.sq$length() > 0;

    self.v = timsort.list.v;

    if (mucked) {
        throw new Sk.builtin.OperationError("list modified during sort");
    }

    return Sk.builtin.none.none$;
};

/**
 * @param {Sk.builtin.list=} self optional
 **/
Sk.builtin.list.prototype.$list_reverse = function () {
    const len = this.v.length;
    const old = this.v;
    const newarr = [];
    for (let i = len - 1; i > -1; --i) {
        newarr.push(old[i]);
    }
    this.v = newarr;
    return Sk.builtin.none.none$;
};

Sk.builtin.list.prototype.$index = function (item, start, stop) {
    var i;
    var obj;
    var len;
    if (start !== undefined && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers");
    }
    if (stop !== undefined && !Sk.builtin.checkInt(stop)) {
        throw new Sk.builtin.TypeError("slice indices must be integers");
    }

    len = this.v.length;
    obj = this.v;

    start = start === undefined ? 0 : start.v;
    if (start < 0) {
        start = start + len >= 0 ? start + len : 0;
    }

    stop = stop === undefined ? len : stop.v;
    if (stop < 0) {
        stop = stop + len >= 0 ? stop + len : 0;
    }

    for (i = start; i < stop; ++i) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            return new Sk.builtin.int_(i);
        }
    }
    throw new Sk.builtin.ValueError("list.index(x): x not in list");
};

//TODO: __reversed__,;

Sk.builtin.list.prototype.tp$methods = {
    // __getitem__: {
    //     $meth: methods.__getitem__,
    //     $flags: {},
    //     $textsig: "on",
    //     $doc: "x.__getitem__(y) <==> x[y]"
    // },
    // __reversed__: {
    //     $meth: methods.__reversed__,
    //     $flags: { NoArgs: true },
    //     $textsig: "($self, /)",
    //     $doc: "Return a reverse iterator over the list."
    // },
    // __sizeof__: {
    //     $meth: methods.__sizeof__,
    //     $flags: { NoArgs: true },
    //     $textsig: "($self, /)",
    //     $doc: "Return the size of the list in memory, in bytes."
    // },
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
            return new Sk.builtin.list(this.v.slice());
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
    index: {
        $meth: Sk.builtin.list.prototype.$index,
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
        $meth: Sk.builtin.list.prototype.$list_reverse,
        $flags: { NoArgs: true },
        $textsig: "($self, /)",
        $doc: "Reverse *IN PLACE*.",
    },
    // sort: {
    //     // TODO: py3 implementation is different
    //     $meth: null,
    //     $flags: { FastCall: true },
    //     $textsig: "($self, /, *, key=None, reverse=False)",
    //     $doc: "Stable sort *IN PLACE*."
    // },
};

Sk.abstr.setUpSlots(Sk.builtin.list);
Sk.abstr.setUpMethods(Sk.builtin.list);

// TODO: make this into a sk_method
Sk.builtin.list.prototype.$list_sort.co_varnames = ["__self__", "cmp", "key", "reverse"];
Sk.builtin.list.prototype.$list_sort.$defaults = [Sk.builtin.none.none$, Sk.builtin.none.none$, false];
Sk.builtin.list.prototype["sort"] = new Sk.builtin.func(Sk.builtin.list.prototype.$list_sort);

Sk.exportSymbol("Sk.builtin.list", Sk.builtin.list);
