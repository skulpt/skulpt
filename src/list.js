/**
 * @constructor
 * @param {Array.<Object>=} L
 * @param {boolean=} canSuspend (defaults to true in this case, as list() is used directly from Python)
 * @extends Sk.builtin.object
 */
Sk.builtin.list = function (L, canSuspend) {
    var v, it, thisList;

    if (this instanceof Sk.builtin.list) {
        canSuspend = canSuspend || false;
    } else {
        // Default to true in this case, because 'list' gets called directly from Python
        return new Sk.builtin.list(L, canSuspend || true);
    }

    this.__class__ = Sk.builtin.list;

    if (L === undefined) {
        v = [];
    } else if (Object.prototype.toString.apply(L) === "[object Array]") {
        v = L;
    } else if (Sk.builtin.checkIterable(L)) {
        v = [];
        it = Sk.abstr.iter(L);

        thisList = this;

        return (function next(i) {
            while(true) {
                if (i instanceof Sk.misceval.Suspension) {
                    return new Sk.misceval.Suspension(next, i);
                } else if (i === undefined) {
                    // done!
                    thisList.v = v;
                    return thisList;
                } else {
                    v.push(i);
                    i = it.tp$iternext(canSuspend);
                }
            }
        })(it.tp$iternext(canSuspend));
    } else {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(L)+ "' " +"object is not iterable");
    }

    this["v"] = this.v = v;
    return this;
};

Sk.abstr.setUpInheritance("list", Sk.builtin.list, Sk.builtin.seqtype);
Sk.abstr.markUnhashable(Sk.builtin.list);

Sk.builtin.list.prototype.list_concat_ = function (other) {
    // other not a list
    var i;
    var ret;
    if (!other.__class__ || other.__class__ != Sk.builtin.list) {
        throw new Sk.builtin.TypeError("can only concatenate list to list");
    }

    ret = this.v.slice();
    for (i = 0; i < other.v.length; ++i) {
        ret.push(other.v[i]);
    }
    return new Sk.builtin.list(ret, false);
};

Sk.builtin.list.prototype.list_extend_ = function (other) {
    var it, i;
    var newb;
    if (!Sk.builtin.checkIterable(other)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) +
            "' object is not iterable");
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
                goog.asserts.fail();
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
    Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, true, false);
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
    var j;
    var i;
    var ret;
    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    n = Sk.misceval.asIndex(n);
    ret = [];
    for (i = 0; i < n; ++i) {
        for (j = 0; j < this.v.length; ++j) {
            ret.push(this.v[j]);
        }
    }
    return new Sk.builtin.list(ret, false);
};
Sk.builtin.list.prototype.nb$multiply = Sk.builtin.list.prototype.sq$repeat;
Sk.builtin.list.prototype.nb$inplace_multiply = function(n) {
    var j;
    var i;
    var len;
    if (!Sk.misceval.isIndex(n)) {
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
    }

    // works on list itself --> inplace
    n = Sk.misceval.asIndex(n);
    len = this.v.length;
    for (i = 1; i < n; ++i) {
        for (j = 0; j < len; ++j) {
            this.v.push(this.v[j]);
        }
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
    var it, i;

    for (it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.misceval.richCompareBool(i, item, "Eq")) {
            return true;
        }
    }
    return false;
};
/*
 Sk.builtin.list.prototype.sq$inplace_concat = list_inplace_concat;
 Sk.builtin.list.prototype.sq$inplace_repeat = list_inplace_repeat;
 */

Sk.builtin.list.prototype.list_subscript_ = function (index) {
    var ret;
    var i;
    if (Sk.misceval.isIndex(index)) {
        i = Sk.misceval.asIndex(index);
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

Sk.builtin.list.prototype.list_ass_subscript_ = function (index, value) {
    var i;
    var j;
    var tosub;
    var indices;
    if (Sk.misceval.isIndex(index)) {
        i = Sk.misceval.asIndex(index);
        if (i !== undefined) {
            if (i < 0) {
                i = this.v.length + i;
            }
            this.list_ass_item_(i, value);
            return;
        }
    } else if (index instanceof Sk.builtin.slice) {
        indices = index.slice_indices_(this.v.length);
        if (indices[2] === 1) {
            this.list_ass_slice_(indices[0], indices[1], value);
        } else {
            tosub = [];
            index.sssiter$(this, function (i, wrt) {
                tosub.push(i);
            });
            j = 0;
            if (tosub.length !== value.v.length) {
                throw new Sk.builtin.ValueError("attempt to assign sequence of size " + value.v.length + " to extended slice of size " + tosub.length);
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

Sk.builtin.list.prototype.list_del_subscript_ = function (index) {
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
            this.list_del_item_(i);
            return;
        }
    } else if (index instanceof Sk.builtin.slice) {
        indices = index.slice_indices_(this.v.length);
        if (indices[2] === 1) {
            this.list_del_slice_(indices[0], indices[1]);
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

Sk.builtin.list.prototype.mp$subscript = Sk.builtin.list.prototype.list_subscript_;
Sk.builtin.list.prototype.mp$ass_subscript = Sk.builtin.list.prototype.list_ass_subscript_;
Sk.builtin.list.prototype.mp$del_subscript = Sk.builtin.list.prototype.list_del_subscript_;

Sk.builtin.list.prototype.__getitem__ = new Sk.builtin.func(function (self, index) {
    return Sk.builtin.list.prototype.list_subscript_.call(self, index);
});

/**
 * @param {?=} self
 * @param {?=} cmp optional
 * @param {?=} key optional
 * @param {?=} reverse optional
 */
Sk.builtin.list.prototype.list_sort_ = function (self, cmp, key, reverse) {
    var mucked;
    var j;
    var keyvalue;
    var item;
    var i;
    var zero;
    var timsort;
    var has_key = key !== undefined && key !== null;
    var has_cmp = cmp !== undefined && cmp !== null;
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
                var res = Sk.misceval.callsim(cmp, a[0], b[0]);
                return Sk.misceval.richCompareBool(res, zero, "Lt");
            };
        } else {
            timsort.lt = function (a, b) {
                return Sk.misceval.richCompareBool(a[0], b[0], "Lt");
            };
        }
        for (i = 0; i < timsort.listlength; i++) {
            item = timsort.list.v[i];
            keyvalue = Sk.misceval.callsim(key, item);
            timsort.list.v[i] = [keyvalue, item];
        }
    } else if (has_cmp) {
        timsort.lt = function (a, b) {
            var res = Sk.misceval.callsim(cmp, a, b);
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

/**
 * @param {Sk.builtin.list=} self optional
 **/
Sk.builtin.list.prototype.list_reverse_ = function (self) {
    var i;
    var newarr;
    var old;
    var len;
    Sk.builtin.pyCheckArgs("reverse", arguments, 1, 1);

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
    Sk.builtin.pyCheckArgs("append", arguments, 2, 2);

    self.v.push(item);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype["insert"] = new Sk.builtin.func(function (self, i, x) {
    Sk.builtin.pyCheckArgs("insert", arguments, 3, 3);
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
    Sk.builtin.pyCheckArgs("extend", arguments, 2, 2);
    self.list_extend_(b);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype["pop"] = new Sk.builtin.func(function (self, i) {
    var ret;
    Sk.builtin.pyCheckArgs("pop", arguments, 1, 2);
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
    Sk.builtin.pyCheckArgs("remove", arguments, 2, 2);

    idx = Sk.builtin.list.prototype["index"].func_code(self, item);
    self.v.splice(Sk.builtin.asnum$(idx), 1);
    return Sk.builtin.none.none$;
});

Sk.builtin.list.prototype["index"] = new Sk.builtin.func(function (self, item, start, stop) {
    var i;
    var obj;
    var len;
    Sk.builtin.pyCheckArgs("index", arguments, 2, 4);
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
    Sk.builtin.pyCheckArgs("count", arguments, 2, 2);

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

// Make sure that key/value variations of lst.sort() work
// See issue 45 on github as to possible alternate approaches to this and
// why this was chosen - csev
Sk.builtin.list.prototype["sort"].func_code["co_varnames"] = ["__self__", "cmp", "key", "reverse"];
goog.exportSymbol("Sk.builtin.list", Sk.builtin.list);

/**
 * @constructor
 * @param {Object} lst
 */
Sk.builtin.list_iter_ = function (lst) {
    if (!(this instanceof Sk.builtin.list_iter_)) {
        return new Sk.builtin.list_iter_(lst);
    }
    this.$index = 0;
    this.lst = lst.v.slice();
    this.sq$length = this.lst.length;
    this.tp$iter = this;
    this.tp$iternext = function () {
        if (this.$index >= this.sq$length) {
            return undefined;
        }
        return this.lst[this.$index++];
    };
    this.$r = function () {
        return new Sk.builtin.str("listiterator");
    };
    return this;
};

Sk.abstr.setUpInheritance("listiterator", Sk.builtin.list_iter_, Sk.builtin.object);

Sk.builtin.list_iter_.prototype.__class__ = Sk.builtin.list_iter_;

Sk.builtin.list_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    return self;
});

Sk.builtin.list_iter_.prototype["next"] = new Sk.builtin.func(function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
});
