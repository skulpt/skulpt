/**
 * @constructor
 * @param {Array.<Object>=} L
 * @param {boolean=} canSuspend (defaults to true in this case, as list() is used directly from Python)
 * @extends Sk.builtin.object
 */
Sk.builtin.list = function (L, canSuspend) {
    if (!(this instanceof Sk.builtin.list)) {
        // Called from Python
        Sk.builtin.pyCheckArgsLen("list", arguments.length, 0, 1);
        return new Sk.builtin.list(L, true);
    }
    if (L === undefined) {
        this.v = [];
    } else if (Array.isArray(L)) {
        this.v = L;
    } else {
        return Sk.misceval.chain(Sk.misceval.arrayFromIterable(L, canSuspend), (v) => {
            this.v = v;
            return this;
        });
    }
};

Sk.abstr.setUpInheritance("list", Sk.builtin.list, Sk.builtin.seqtype);
Sk.abstr.markUnhashable(Sk.builtin.list);

Sk.builtin.list.prototype.__class__ = Sk.builtin.list;

/* Return copy of internal array */
Sk.builtin.list.prototype.sk$asarray = function () {
    return this.v.slice(0);
};

Sk.builtin.list.prototype.list_concat_ = function (other) {
    if (!other.__class__ || other.__class__ != Sk.builtin.list) {
        throw new Sk.builtin.TypeError("can only concatenate list to list");
    }

    // other guaranteed to be a list
    return new Sk.builtin.list(this.v.concat(other.v), false);
};

Sk.builtin.list.prototype.list_extend_ = function (other) {
    var it, i;

    if (other.sk$asarray) {
        this.v.push.apply(this.v, other.sk$asarray());
        return this;
    }

    if (!Sk.builtin.checkIterable(other)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) +
            "' object is not iterable");
    }

    for (it = Sk.abstr.iter(other), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        this.v.push(i);
    }

    return this;
};

Sk.builtin.list.prototype.list_del_item_ = function (i) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 || i >= this.v.length) {
        throw new Sk.builtin.IndexError("list assignment index out of range");
    }
    this.list_del_slice_(i, i + 1);
};

Sk.builtin.list.prototype.list_del_slice_ = function (ilow, ihigh) {
    var args;
    ilow = Sk.builtin.asnum$(ilow);
    ihigh = Sk.builtin.asnum$(ihigh);
    args = [];
    args.unshift(ihigh - ilow);
    args.unshift(ilow);
    this.v.splice.apply(this.v, args);
};

Sk.builtin.list.prototype.list_ass_item_ = function (i, v) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 || i >= this.v.length) {
        throw new Sk.builtin.IndexError("list assignment index out of range");
    }
    this.v[i] = v;
};

Sk.builtin.list.prototype.list_ass_slice_ = function (ilow, ihigh, v) {
    var args;
    ilow = Sk.builtin.asnum$(ilow);
    ihigh = Sk.builtin.asnum$(ihigh);

    if (Sk.builtin.checkIterable(v)) {
        args = new Sk.builtin.list(v, false).v.slice(0);
    } else {
        throw new Sk.builtin.TypeError("can only assign an iterable");
    }
    args.unshift(ihigh - ilow);
    args.unshift(ilow);
    this.v.splice.apply(this.v, args);
};

Sk.builtin.list.prototype["$r"] = function () {
    var it, i;
    var ret = [];
    for (it = Sk.abstr.iter(this), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if(i === this) {
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
    if (!w.__class__ || w.__class__ != Sk.builtin.list) {
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

Sk.builtin.list.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, true, false);
    return new Sk.builtin.list_iter_(self);
});

Sk.builtin.list.prototype.tp$iter = function () {
    return new Sk.builtin.list_iter_(this);
};

Sk.builtin.list.prototype.sq$length = function () {
    return this.v.length;
};
Sk.builtin.list.prototype.sq$concat = Sk.builtin.list.prototype.list_concat_;
Sk.builtin.list.prototype.nb$add = Sk.builtin.list.prototype.list_concat_;
Sk.builtin.list.prototype.nb$inplace_add = Sk.builtin.list.prototype.list_extend_;
Sk.builtin.list.prototype.sq$repeat = function (n) {
    var i, cnt;
    var ret;
    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    cnt = Sk.misceval.asIndex(n);
    if (typeof cnt !== "number") {
        throw new Sk.builtin.OverflowError("cannot fit '" + Sk.abstr.typeName(n) + "' into an index-sized integer");
    }
    ret = [];
    for (i = 0; i < cnt; ++i) {
        ret.push.apply(ret, this.v);
    }
    return new Sk.builtin.list(ret, false);
};
Sk.builtin.list.prototype.nb$multiply = Sk.builtin.list.prototype.sq$repeat;
Sk.builtin.list.prototype.nb$inplace_multiply = function(n) {
    var i, cnt;

    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    // works on list itself --> inplace
    cnt = Sk.misceval.asIndex(n);
    if (typeof cnt !== "number") {
        throw new Sk.builtin.OverflowError("cannot fit '" + Sk.abstr.typeName(n) + "' into an index-sized integer");
    }
    for (i = 1; i < cnt; ++i) {
        this.v.push.apply(this.v, this.v);
    }

    return this;
};

/*
 Sk.builtin.list.prototype.sq$item = list_item;
 Sk.builtin.list.prototype.sq$slice = list_slice;
 */
Sk.builtin.list.prototype.sq$ass_item = Sk.builtin.list.prototype.list_ass_item_;
Sk.builtin.list.prototype.sq$del_item = Sk.builtin.list.prototype.list_del_item_;
Sk.builtin.list.prototype.sq$ass_slice = Sk.builtin.list.prototype.list_ass_slice_;
Sk.builtin.list.prototype.sq$del_slice = Sk.builtin.list.prototype.list_del_slice_;

Sk.builtin.list.prototype.sq$contains = function (item) {
    var i;
    var obj = this.v;

    for (i = 0; i < obj.length; i++) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            return true;
        }
    }
    return false;
};

Sk.builtin.list.prototype.__contains__ = new Sk.builtin.func(function(self, item) {
    Sk.builtin.pyCheckArgsLen("__contains__", arguments.length, 2, 2);
    return new Sk.builtin.bool(self.sq$contains(item));
});

/*
 Sk.builtin.list.prototype.sq$inplace_concat = list_inplace_concat;
 Sk.builtin.list.prototype.sq$inplace_repeat = list_inplace_repeat;
 */

Sk.builtin.list.prototype.list_subscript_ = function (index) {
    if (Sk.misceval.isIndex(index)) {
        let i = Sk.misceval.asIndex(index);
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
        const ret = [];
        index.sssiter$(this.v.length, (i) => {
            ret.push(this.v[i]);
        });
        return new Sk.builtin.list(ret, false);
    }

    throw new Sk.builtin.TypeError("list indices must be integers, not " + Sk.abstr.typeName(index));
};

Sk.builtin.list.prototype.list_ass_subscript_ = function (index, value) {
    if (Sk.misceval.isIndex(index)) {
        let i = Sk.misceval.asIndex(index);
        if (typeof i !== "number") {
            throw new Sk.builtin.IndexError("cannot fit '" + Sk.abstr.typeName(index) + "' into an index-sized integer");
        }
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.length + i;
            }
            this.list_ass_item_(i, value);
            return;
        }
    } else if (index instanceof Sk.builtin.slice) {
        const indices = index.slice_indices_(this.v.length);
        if (indices[2] === 1) {
            this.list_ass_slice_(indices[0], indices[1], value);
        } else {
            const tosub = [];
            index.sssiter$(this.v.length, (i) => {
                tosub.push(i);
            });
            let j = 0;
            if (tosub.length !== value.v.length) {
                throw new Sk.builtin.ValueError("attempt to assign sequence of size " + value.v.length + " to extended slice of size " + tosub.length);
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

Sk.builtin.list.prototype.list_del_subscript_ = function (index) {
    if (Sk.misceval.isIndex(index)) {
        let i = Sk.misceval.asIndex(index);
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.length + i;
            }
            this.list_del_item_(i);
            return;
        }
    } else if (index instanceof Sk.builtin.slice) {
        const indices = index.slice_indices_(this.v.length);
        if (indices[2] === 1) {
            this.list_del_slice_(indices[0], indices[1]);
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

    throw new Sk.builtin.TypeError("list indices must be integers, not " + typeof index);
};

Sk.builtin.list.prototype.mp$subscript = Sk.builtin.list.prototype.list_subscript_;
Sk.builtin.list.prototype.mp$ass_subscript = Sk.builtin.list.prototype.list_ass_subscript_;
Sk.builtin.list.prototype.mp$del_subscript = Sk.builtin.list.prototype.list_del_subscript_;

Sk.builtin.list.prototype.__getitem__ = new Sk.builtin.func(function (self, index) {
    return Sk.builtin.list.prototype.list_subscript_.call(self, index);
});

Sk.builtin.list.prototype.__setitem__ = new Sk.builtin.func(function (self, index, val) {
    return Sk.builtin.list.prototype.list_ass_subscript_.call(self, index, val);
});

Sk.builtin.list.prototype.__delitem__ = new Sk.builtin.func(function (self, index) {
    return Sk.builtin.list.prototype.list_del_subscript_.call(self, index);
});

/**
 * @param {?=} self
 * @param {?=} cmp optional
 * @param {?=} key optional
 * @param {?=} reverse optional
 */
Sk.builtin.list.prototype.list_sort_ = function sort(self, cmp, key, reverse) {
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
        timsort.list.list_reverse_(timsort.list);
    }

    timsort.sort();

    if (rev) {
        timsort.list.list_reverse_(timsort.list);
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
Sk.builtin.list.prototype.list_sort_.co_varnames = ["__self__", "cmp", "key", "reverse"];
Sk.builtin.list.prototype.list_sort_.$defaults = [Sk.builtin.none.none$, Sk.builtin.none.none$, false];

/**
 * @param {Sk.builtin.list=} self optional
 **/
Sk.builtin.list.prototype.list_reverse_ = function (self) {
    var i;
    var newarr;
    var old;
    var len;
    Sk.builtin.pyCheckArgsLen("reverse", arguments.length, 1, 1);

    len = self.v.length;
    old = self.v;
    newarr = [];
    for (i = len - 1; i > -1; --i) {
        newarr.push(old[i]);
    }
    self["v"] = newarr;
    return Sk.builtin.none.none$;
};

//Sk.builtin.list.prototype.__reversed__ = todo;

Sk.builtin.list.prototype["append"] = new Sk.builtin.func(function (self, item) {
    Sk.builtin.pyCheckArgsLen("append", arguments.length, 2, 2);

    self.v.push(item);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype["insert"] = new Sk.builtin.func(function (self, i, x) {
    Sk.builtin.pyCheckArgsLen("insert", arguments.length, 3, 3);
    if (!Sk.builtin.checkNumber(i)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }

    i = Sk.builtin.asnum$(i);
    if (i < 0) {
        i = i + self.v.length;
    }
    if (i < 0) {
        i = 0;
    } else if (i > self.v.length) {
        i = self.v.length;
    }
    self.v.splice(i, 0, x);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype["extend"] = new Sk.builtin.func(function (self, b) {
    Sk.builtin.pyCheckArgsLen("extend", arguments.length, 2, 2);
    self.list_extend_(b);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype["pop"] = new Sk.builtin.func(function (self, i) {
    var ret;
    Sk.builtin.pyCheckArgsLen("pop", arguments.length, 1, 2);
    if (i === undefined) {
        i = self.v.length - 1;
    }

    if (!Sk.builtin.checkNumber(i)) {
        throw new Sk.builtin.TypeError("an integer is required");
    }

    i = Sk.builtin.asnum$(i);
    if (i < 0) {
        i = i + self.v.length;
    }
    if ((i < 0) || (i >= self.v.length)) {
        throw new Sk.builtin.IndexError("pop index out of range");
    }
    ret = self.v[i];
    self.v.splice(i, 1);
    return ret;
});

Sk.builtin.list.prototype["remove"] = new Sk.builtin.func(function (self, item) {
    var idx;
    Sk.builtin.pyCheckArgsLen("remove", arguments.length, 2, 2);

    idx = Sk.builtin.list.prototype["index"].func_code(self, item);
    self.v.splice(Sk.builtin.asnum$(idx), 1);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype.clear$ = function (self) {
    Sk.builtin.pyCheckArgsLen("clear", arguments.length, 1, 1);
    self.v = [];
    return Sk.builtin.none.none$;
};

Sk.builtin.list.prototype.copy$ = function (self) {
    Sk.builtin.pyCheckArgsLen("copy", arguments.length, 1, 1);
    return new Sk.builtin.list(self);
};

Sk.builtin.list.prototype["index"] = new Sk.builtin.func(function (self, item, start, stop) {
    var i;
    var obj;
    var len;
    Sk.builtin.pyCheckArgsLen("index", arguments.length, 2, 4);
    if (start !== undefined && !Sk.builtin.checkInt(start)) {
        throw new Sk.builtin.TypeError("slice indices must be integers");
    }
    if (stop !== undefined && !Sk.builtin.checkInt(stop)) {
        throw new Sk.builtin.TypeError("slice indices must be integers");
    }

    len = self.v.length;
    obj = self.v;

    start = (start === undefined) ? 0 : start.v;
    if (start < 0) {
        start = ((start + len) >= 0) ? start + len : 0;
    }

    stop = (stop === undefined) ? len : stop.v;
    if (stop < 0) {
        stop = ((stop + len) >= 0) ? stop + len : 0;
    }

    for (i = start; i < stop; ++i) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            return new Sk.builtin.int_(i);
        }
    }
    throw new Sk.builtin.ValueError("list.index(x): x not in list");
});

Sk.builtin.list.prototype["count"] = new Sk.builtin.func(function (self, item) {
    var i;
    var count;
    var obj;
    var len;
    Sk.builtin.pyCheckArgsLen("count", arguments.length, 2, 2);

    len = self.v.length;
    obj = self.v;
    count = 0;
    for (i = 0; i < len; ++i) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            count += 1;
        }
    }
    return new Sk.builtin.int_(count);
});

Sk.builtin.list.prototype["reverse"] = new Sk.builtin.func(Sk.builtin.list.prototype.list_reverse_);
Sk.builtin.list.prototype["sort"] = new Sk.builtin.func(Sk.builtin.list.prototype.list_sort_);

Sk.exportSymbol("Sk.builtin.list", Sk.builtin.list);

/**
 * @constructor
 * @param {Object} lst
 */
Sk.builtin.list_iter_ = function (lst) {
    if (!(this instanceof Sk.builtin.list_iter_)) {
        return new Sk.builtin.list_iter_(lst);
    }
    this.$index = 0;
    this.lst = lst.v;
    this.$done = false;
    this.tp$iter = () => this;
    this.tp$iternext = function () {
        if (this.$done || (this.$index >= this.lst.length)) {
            this.$done = true;
            return undefined;
        }
        return this.lst[this.$index++];
    };
    this.$r = function () {
        return new Sk.builtin.str("<listiterator>");
    };
    return this;
};

Sk.abstr.setUpInheritance("listiterator", Sk.builtin.list_iter_, Sk.builtin.object);

Sk.builtin.list_iter_.prototype.__class__ = Sk.builtin.list_iter_;

Sk.builtin.list_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    return self;
});

Sk.builtin.list_iter_.prototype.next$ = function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
};
