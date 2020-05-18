/**
 * @constructor
 * @param {Array.<Object>|Object} L
 */
Sk.builtin.tuple = function (L) {
    // this is used internally and L must be an Array or undefined. 
    if (!(this instanceof Sk.builtin.tuple)) {
        return new Sk.builtin.tuple(L);
    }
    if (L === undefined) {
        L = [];
    }
    this.v = L;
    
    return this;
};

Sk.abstr.setUpInheritance("tuple", Sk.builtin.tuple, Sk.builtin.seqtype);

Sk.builtin.tuple.prototype.tp$doc = "Built-in immutable sequence.\n\nIf no argument is given, the constructor returns an empty tuple.\nIf iterable is specified the tuple is initialized from iterable's items.\n\nIf the argument is a tuple, the return value is the same object."

Sk.builtin.tuple.prototype.tp$new = function (args, kwargs) {
    // this will be Sk.builtin.prototype or a prototype that inherits from Sk.builtin.tuple.prototype
    if (this !== Sk.builtin.tuple.prototype) {
        return Sk.builtin.tuple.prototype.$subtype_new.call(this, args, kwargs);
    }

    if (kwargs && kwargs.length) {
        throw new Sk.builtin.TypeError("tuple() takes no keyword arguments")
    } else if (args && args.length > 1) {
        throw new Sk.builtin.TypeError("tuple expected at most 1 argument, got " + args.length)
    }
    const L = [];
    const arg = args[0];

    if (arg === undefined) {
        return new Sk.builtin.tuple(L);
    }

    if (arg instanceof Sk.builtin.tuple) {
        return arg;
    }

    Sk.misceval.iterFor(Sk.abstr.iter(arg), function (i) {
        L.push(i);
    })

    return new Sk.builtin.tuple(L);
};



// temporary for testing
Sk.builtin.tuple.prototype.__new__ = new Sk.builtin.func(function (cls, arg) {
    return cls.prototype.tp$new([arg]);
}
);

Sk.builtin.tuple.prototype.$subtype_new = function (args, kwargs) {
    // should we check that this is indeed a subtype of tuple?
    const instance = new this.constructor;
    // pass the args but ignore the kwargs for subtyping
    const tuple = Sk.builtin.tuple.prototype.tp$new(args);
    instance.v = tuple.v;
    delete tuple;
    return instance;
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
    if (typeof n !== "number") {
        throw new Sk.builtin.OverflowError("cannot fit '" + Sk.abstr.typeName(n) + "' into an index-sized integer");
    }
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
    if (!w.ob$type ||
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
    if (other.ob$type != Sk.builtin.tuple) {
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

Sk.exportSymbol("Sk.builtin.tuple", Sk.builtin.tuple);

