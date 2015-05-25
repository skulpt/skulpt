/**
 * @constructor
 * @param {Array.<Object>} L
 */
Sk.builtin.dict = function dict (L) {
    var v;
    var it, k;
    var i;
    if (!(this instanceof Sk.builtin.dict)) {
        return new Sk.builtin.dict(L);
    }

    if (L === undefined) {
        L = [];
    }

    this.size = 0;

    if (Object.prototype.toString.apply(L) === "[object Array]") {
        // Handle dictionary literals
        for (i = 0; i < L.length; i += 2) {
            this.mp$ass_subscript(L[i], L[i + 1]);
        }
    } else if (L instanceof Sk.builtin.dict) {
        // Handle calls of type "dict(mapping)" from Python code
        for (it = L.tp$iter(), k = it.tp$iternext();
             k !== undefined;
             k = it.tp$iternext()) {
            v = L.mp$subscript(k);
            if (v === undefined) {
                //print(k, "had undefined v");
                v = null;
            }
            this.mp$ass_subscript(k, v);
        }
    } else if (L.tp$iter) {
        // Handle calls of type "dict(iterable)" from Python code
        for (it = L.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            if (i.mp$subscript) {
                this.mp$ass_subscript(i.mp$subscript(0), i.mp$subscript(1));
            } else {
                throw new Sk.builtin.TypeError("element " + this.size + " is not a sequence");
            }
        }
    } else {
        throw new Sk.builtin.TypeError("object is not iterable");
    }

    this.__class__ = Sk.builtin.dict;

    return this;
};

Sk.builtin.dict.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("dict", Sk.builtin.dict);

var kf = Sk.builtin.hash;

Sk.builtin.dict.prototype.key$lookup = function (bucket, key) {
    var item;
    var eq;
    var i;

    for (i = 0; i < bucket.items.length; i++) {
        item = bucket.items[i];
        eq = Sk.misceval.richCompareBool(item.lhs, key, "Eq");
        if (eq) {
            return item;
        }
    }

    return null;
};

Sk.builtin.dict.prototype.key$pop = function (bucket, key) {
    var item;
    var eq;
    var i;

    for (i = 0; i < bucket.items.length; i++) {
        item = bucket.items[i];
        eq = Sk.misceval.richCompareBool(item.lhs, key, "Eq");
        if (eq) {
            bucket.items.splice(i, 1);
            this.size -= 1;
            return item;
        }
    }
    return undefined;
};

// Perform dictionary lookup, either return value or undefined if key not in dictionary
Sk.builtin.dict.prototype.mp$lookup = function (key) {
    var k = kf(key);
    var bucket = this[k.v];
    var item;

    // todo; does this need to go through mp$ma_lookup

    if (bucket !== undefined) {
        item = this.key$lookup(bucket, key);
        if (item) {
            return item.rhs;
        }
    }

    // Not found in dictionary     
    return undefined;
};

Sk.builtin.dict.prototype.mp$subscript = function (key) {
    var s;
    var res = this.mp$lookup(key);

    if (res !== undefined) {
        // Found in dictionary
        return res;
    }
    else {
        // Not found in dictionary
        s = new Sk.builtin.str(key);
        throw new Sk.builtin.KeyError(s.v);
    }
};

Sk.builtin.dict.prototype.sq$contains = function (ob) {
    var res = this.mp$lookup(ob);

    return (res !== undefined);
};

Sk.builtin.dict.prototype.mp$ass_subscript = function (key, w) {
    var k = kf(key);
    var bucket = this[k.v];
    var item;

    if (bucket === undefined) {
        // New bucket
        bucket = {$hash: k, items: [
            {lhs: key, rhs: w}
        ]};
        this[k.v] = bucket;
        this.size += 1;
        return;
    }

    item = this.key$lookup(bucket, key);
    if (item) {
        item.rhs = w;
        return;
    }

    // Not found in dictionary
    bucket.items.push({lhs: key, rhs: w});
    this.size += 1;
};

Sk.builtin.dict.prototype.mp$del_subscript = function (key) {
    var k = kf(key);
    var bucket = this[k.v];
    var item;
    var s;

    // todo; does this need to go through mp$ma_lookup

    if (bucket !== undefined) {
        item = this.key$pop(bucket, key);
        if (item !== undefined) {
            return;
        }
    }

    // Not found in dictionary     
    s = new Sk.builtin.str(key);
    throw new Sk.builtin.KeyError(s.v);
};

Sk.builtin.dict.prototype.tp$iter = function () {
    var ret;
    var i;
    var bucket;
    var k;
    var allkeys = [];
    for (k in this) {
        if (this.hasOwnProperty(k)) {
            bucket = this[k];
            if (bucket && bucket.$hash !== undefined) // skip internal stuff. todo; merge pyobj and this
            {
                for (i = 0; i < bucket.items.length; i++) {
                    allkeys.push(bucket.items[i].lhs);
                }
            }
        }
    }
    //print(allkeys);

    ret =
    {
        tp$iter    : function () {
            return ret;
        },
        $obj       : this,
        $index     : 0,
        $keys      : allkeys,
        tp$iternext: function () {
            // todo; StopIteration
            if (ret.$index >= ret.$keys.length) {
                return undefined;
            }
            return ret.$keys[ret.$index++];
            // return ret.$obj[ret.$keys[ret.$index++]].lhs;
        }
    };
    return ret;
};

Sk.builtin.dict.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__iter__", arguments, 1, 1);

    return self.tp$iter();
});

Sk.builtin.dict.prototype["$r"] = function () {
    var v;
    var iter, k;
    var ret = [];
    for (iter = this.tp$iter(), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        v = this.mp$subscript(k);
        if (v === undefined) {
            //print(k, "had undefined v");
            v = null;
        }
        ret.push(Sk.misceval.objectRepr(k).v + ": " + Sk.misceval.objectRepr(v).v);
    }
    return new Sk.builtin.str("{" + ret.join(", ") + "}");
};

Sk.builtin.dict.prototype.mp$length = function () {
    return this.size;
};

Sk.builtin.dict.prototype.tp$getattr = Sk.builtin.object.prototype.GenericGetAttr;
Sk.builtin.dict.prototype.tp$hash = Sk.builtin.object.prototype.HashNotImplemented;

Sk.builtin.dict.prototype.tp$richcompare = function (other, op) {
    // if the comparison allows for equality then short-circuit it here
    var otherv;
    var v;
    var iter, k;
    var otherl;
    var thisl;
    if (this === other && Sk.misceval.opAllowsEquality(op)) {
        return true;
    }

    // Only support Eq and NotEq comparisons
    switch (op) {
        case "Lt":
            return undefined;
        case "LtE":
            return undefined;
        case "Eq":
            break;
        case "NotEq":
            break;
        case "Gt":
            return undefined;
        case "GtE":
            return undefined;
        default:
            goog.asserts.fail();
    }

    if (!(other instanceof Sk.builtin.dict)) {
        return op !== "Eq";
    }

    thisl = this.size;
    otherl = other.size;

    if (thisl !== otherl) {
        return op !== "Eq";
    }

    for (iter = this.tp$iter(), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        v = this.mp$subscript(k);
        otherv = other.mp$subscript(k);

        if (!Sk.misceval.richCompareBool(v, otherv, "Eq")) {
            return op !== "Eq";
        }
    }

    return op === "Eq";
};

Sk.builtin.dict.prototype["get"] = new Sk.builtin.func(function (self, k, d) {
    var ret;

    if (d === undefined) {
        d = Sk.builtin.none.none$;
    }

    ret = self.mp$lookup(k);
    if (ret === undefined) {
        ret = d;
    }

    return ret;
});

Sk.builtin.dict.prototype["pop"] = new Sk.builtin.func(function (self, key, d) {
    var k = kf(key);
    var bucket = self[k.v];
    var item;
    var s;

    // todo; does this need to go through mp$ma_lookup
    if (bucket !== undefined) {
        item = self.key$pop(bucket, key);
        if (item !== undefined) {
            return item.rhs;
        }
    }

    // Not found in dictionary     
    if (d !== undefined) {
        return d;
    }

    s = new Sk.builtin.str(key);
    throw new Sk.builtin.KeyError(s.v);
});

Sk.builtin.dict.prototype["has_key"] = new Sk.builtin.func(function (self, k) {
    return Sk.builtin.bool(self.sq$contains(k));
});

Sk.builtin.dict.prototype["items"] = new Sk.builtin.func(function (self) {
    var v;
    var iter, k;
    var ret = [];

    for (iter = self.tp$iter(), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        v = self.mp$subscript(k);
        if (v === undefined) {
            //print(k, "had undefined v");
            v = null;
        }
        ret.push(new Sk.builtin.tuple([k, v]));
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype["keys"] = new Sk.builtin.func(function (self) {
    var iter, k;
    var ret = [];

    for (iter = self.tp$iter(), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        ret.push(k);
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype["values"] = new Sk.builtin.func(function (self) {
    var v;
    var iter, k;
    var ret = [];

    for (iter = self.tp$iter(), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        v = self.mp$subscript(k);
        if (v === undefined) {
            v = null;
        }
        ret.push(v);
    }
    return new Sk.builtin.list(ret);
});

Sk.builtin.dict.prototype["clear"] = new Sk.builtin.func(function (self) {
    var k;
    var iter;

    for (iter = self.tp$iter(), k = iter.tp$iternext();
         k !== undefined;
         k = iter.tp$iternext()) {
        self.mp$del_subscript(k);
    }
});

Sk.builtin.dict.prototype["setdefault"] = new Sk.builtin.func(function (self, key, default_) {
    try {
        return self.mp$subscript(key);
    }
    catch (e) {
        if (default_ === undefined) {
            default_ = Sk.builtin.none.none$;
        }
        self.mp$ass_subscript(key, default_);
        return default_;
    }
});

Sk.builtin.dict.prototype["copy"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.copy is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["fromkeys"] = new Sk.builtin.func(function (seq, value) {
    throw new Sk.builtin.NotImplementedError("dict.fromkeys is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["iteritems"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.iteritems is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["iterkeys"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.iterkeys is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["itervalues"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.itervalues is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["popitem"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.popitem is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["update"] = new Sk.builtin.func(function (self, other) {
    throw new Sk.builtin.NotImplementedError("dict.update is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["viewitems"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.viewitems is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["viewkeys"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.viewkeys is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["viewvalues"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.viewvalues is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype.tp$name = "dict";

goog.exportSymbol("Sk.builtin.dict", Sk.builtin.dict);
