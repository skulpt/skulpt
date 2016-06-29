/**
 * @constructor
 * @param {Array.<Object>|Object} L
 */
Sk.builtin.tuple = function (L) {
    var it, i;
    if (!(this instanceof Sk.builtin.tuple)) {
        return new Sk.builtin.tuple(L);
    }


    if (L === undefined) {
        L = [];
    }

    if (Object.prototype.toString.apply(L) === "[object Array]") {
        this.v = L;
    } else {
        if (Sk.builtin.checkIterable(L)) {
            this.v = [];
            for (it = Sk.abstr.iter(L), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                this.v.push(i);
            }
        } else {
            throw new Sk.builtin.TypeError("expecting Array or iterable");
        }
    }

    this.__class__ = Sk.builtin.tuple;

    this["v"] = this.v;
    return this;
};

Sk.abstr.setUpInheritance("tuple", Sk.builtin.tuple, Sk.builtin.seqtype);

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
    var ret;
    var i;
    if (Sk.misceval.isIndex(index)) {
        i = Sk.misceval.asIndex(index);
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
        ret = [];
        index.sssiter$(this, function (i, wrt) {
            ret.push(wrt.v[i]);
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
    var j;
    var i;
    var ret;

    n = Sk.misceval.asIndex(n);
    ret = [];
    for (i = 0; i < n; ++i) {
        for (j = 0; j < this.v.length; ++j) {
            ret.push(this.v[j]);
        }
    }
    return new Sk.builtin.tuple(ret);
};
Sk.builtin.tuple.prototype.nb$multiply = Sk.builtin.tuple.prototype.sq$repeat;
Sk.builtin.tuple.prototype.nb$inplace_multiply = Sk.builtin.tuple.prototype.sq$repeat;

Sk.builtin.tuple.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__iter__", arguments, 1, 1);
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

Sk.builtin.tuple.prototype.sq$contains = function (ob) {
    var it, i;

    for (it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.misceval.richCompareBool(i, ob, "Eq")) {
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

goog.exportSymbol("Sk.builtin.tuple", Sk.builtin.tuple);

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
    this.tp$iter = this;
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

Sk.builtin.tuple_iter_.prototype["next"] = new Sk.builtin.func(function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
});
