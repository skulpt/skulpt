/**
 * @constructor
 * @param {Array.<Object>|Object} L
 * @param {boolean=} canSuspend
 */
Sk.builtin.tuple = function (L, canSuspend) {
    if (!(this instanceof Sk.builtin.tuple)) {
        // called from python
        Sk.builtin.pyCheckArgsLen("tuple", arguments.length, 0, 1);
        return new Sk.builtin.tuple(L, true);
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

Sk.abstr.setUpInheritance("tuple", Sk.builtin.tuple, Sk.builtin.seqtype);

Sk.builtin.tuple.prototype.__class__ = Sk.builtin.tuple;

/* Return copy of internal array */
Sk.builtin.tuple.prototype.sk$asarray = function () {
    return this.v.slice(0);
};

Sk.builtin.tuple.prototype["$r"] = function () {
    var ret;
    var i;
    var bits;
    if (this.v.length === 0) {
        return new Sk.builtin.str("()");
    }
    bits = [];
    for (i = 0; i < this.v.length; ++i) {
        bits[i] = Sk.misceval.objectRepr(this.v[i]).v;
    }
    ret = bits.join(", ");
    if (this.v.length === 1) {
        ret += ",";
    }
    return new Sk.builtin.str("(" + ret + ")");
};

Sk.builtin.tuple.prototype.mp$subscript = function (index) {
    let i;
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
                throw new Sk.builtin.IndexError("tuple index out of range");
            }
            return this.v[i];
        }
    } else if (index instanceof Sk.builtin.slice) {
        const ret = [];
        index.sssiter$(this.v.length, (i) => {
            ret.push(this.v[i]);
        });
        return new Sk.builtin.tuple(ret);
    }

    throw new Sk.builtin.TypeError("tuple indices must be integers, not " + Sk.abstr.typeName(index));
};

// todo; the numbers and order are taken from python, but the answer's
// obviously not the same because there's no int wrapping. shouldn't matter,
// but would be nice to make the hash() values the same if it's not too
// expensive to simplify tests.
Sk.builtin.tuple.prototype.tp$hash = function () {
    var y;
    var i;
    var mult = 1000003;
    var x = 0x345678;
    var len = this.v.length;
    for (i = 0; i < len; ++i) {
        y = Sk.builtin.hash(this.v[i]).v;
        if (y === -1) {
            return new Sk.builtin.int_(-1);
        }
        x = (x ^ y) * mult;
        mult += 82520 + len + len;
    }
    x += 97531;
    if (x === -1) {
        x = -2;
    }
    return new Sk.builtin.int_(x | 0);
};

Sk.builtin.tuple.prototype.sq$repeat = function (n) {
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
    return new Sk.builtin.tuple(ret);
};
Sk.builtin.tuple.prototype.nb$multiply = Sk.builtin.tuple.prototype.sq$repeat;
Sk.builtin.tuple.prototype.nb$inplace_multiply = Sk.builtin.tuple.prototype.sq$repeat;

Sk.builtin.tuple.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 1, 1);
    return new Sk.builtin.tuple_iter_(self);
});

Sk.builtin.tuple.prototype.tp$iter = function () {
    return new Sk.builtin.tuple_iter_(this);
};

Sk.builtin.tuple.prototype.tp$richcompare = function (w, op) {
    //print("  tup rc", JSON.stringify(this.v), JSON.stringify(w), op);

    // w not a tuple
    var k;
    var i;
    var wl;
    var vl;
    var v;
    if (!w.__class__ ||
        !Sk.misceval.isTrue(Sk.builtin.isinstance(w, Sk.builtin.tuple))) {
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
    //print("  tup rcb end", i, v[i] instanceof Sk.builtin.str, JSON.stringify(v[i]), w[i] instanceof Sk.builtin.str, JSON.stringify(w[i]), op);
    return Sk.misceval.richCompareBool(v[i], w[i], op);
};

Sk.builtin.tuple.prototype.sq$concat = function (other) {
    var msg;
    if (other.__class__ != Sk.builtin.tuple) {
        msg = "can only concatenate tuple (not \"";
        msg += Sk.abstr.typeName(other) + "\") to tuple";
        throw new Sk.builtin.TypeError(msg);
    }

    return new Sk.builtin.tuple(this.v.concat(other.v));
};

Sk.builtin.tuple.prototype.sq$contains = function (item) {
    var i;
    var obj = this.v;

    for (i = 0; i < obj.length; i++) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            return true;
        }
    }
    return false;
};

Sk.builtin.tuple.prototype.nb$add = Sk.builtin.tuple.prototype.sq$concat;
Sk.builtin.tuple.prototype.nb$inplace_add = Sk.builtin.tuple.prototype.sq$concat;

Sk.builtin.tuple.prototype.sq$length = function () {
    return this.v.length;
};


Sk.builtin.tuple.prototype["index"] = new Sk.builtin.func(function (self, item) {
    var i;
    var len = self.v.length;
    var obj = self.v;
    for (i = 0; i < len; ++i) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            return new Sk.builtin.int_(i);
        }
    }
    throw new Sk.builtin.ValueError("tuple.index(x): x not in tuple");
});

Sk.builtin.tuple.prototype["count"] = new Sk.builtin.func(function (self, item) {
    var i;
    var len = self.v.length;
    var obj = self.v;
    var count = 0;
    for (i = 0; i < len; ++i) {
        if (Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
            count += 1;
        }
    }
    return  new Sk.builtin.int_(count);
});

Sk.exportSymbol("Sk.builtin.tuple", Sk.builtin.tuple);

/**
 * @constructor
 * @param {Object} obj
 */
Sk.builtin.tuple_iter_ = function (obj) {
    if (!(this instanceof Sk.builtin.tuple_iter_)) {
        return new Sk.builtin.tuple_iter_(obj);
    }
    this.$index = 0;
    this.$obj = obj.v.slice();
    this.sq$length = this.$obj.length;
    this.tp$iter = () => this;
    this.tp$iternext = function () {
        if (this.$index >= this.sq$length) {
            return undefined;
        }
        return this.$obj[this.$index++];
    };
    this.$r = function () {
        return new Sk.builtin.str("tupleiterator");
    };
    return this;
};

Sk.abstr.setUpInheritance("tupleiterator", Sk.builtin.tuple_iter_, Sk.builtin.object);

Sk.builtin.tuple_iter_.prototype.__class__ = Sk.builtin.tuple_iter_;

Sk.builtin.tuple_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    return self;
});

Sk.builtin.tuple_iter_.prototype.next$ = function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
};
