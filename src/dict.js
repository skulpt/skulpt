/**
 * @constructor
 * @param {Array.<Object>} L
 */
Sk.builtin.dict = function dict(L) {
    // calling new Sk.builtin.dict is an internal method that requires an array of key value pairs
    if (L === undefined) {
        L = [];
    }
    Sk.asserts.assert(Array.isArray(L) && this instanceof Sk.builtin.dict);

    this.size = 0;
    this.buckets = {};
    for (let i = 0; i < L.length; i += 2) {
        this.mp$ass_subscript(L[i], L[i + 1]);
    }
};

Sk.abstr.setUpInheritance("dict", Sk.builtin.dict, Sk.builtin.object);
Sk.abstr.markUnhashable(Sk.builtin.dict);

var kf = Sk.builtin.hash;

Sk.builtin.dict.prototype.tp$doc = "dict() -> new empty dictionary\ndict(mapping) -> new dictionary initialized from a mapping object's\n    (key, value) pairs\ndict(iterable) -> new dictionary initialized as if via:\n    d = {}\n    for k, v in iterable:\n        d[k] = v\ndict(**kwargs) -> new dictionary initialized with the name=value pairs\n    in the keyword argument list.  For example:  dict(one=1, two=2)";


Sk.builtin.dict.prototype.tp$new = Sk.generic.new(Sk.builtin.dict);

Sk.builtin.dict.prototype.tp$init = function (args, kwargs) {
    Sk.abstr.checkArgsLen("dict", args, 0, 1);
    debugger;
    const arg = args[0];
    if (arg !== undefined) {
        if (arg instanceof Sk.builtin.dict) {
            // we could use dict_merge but mp$ass_subscript might have been overridden by a subclass 
            const set_item = Sk.builtin.dict.prototype.mp$ass_subscript;
            for (let iter = arg.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                const v = arg.mp$subscript(k);
                if (v === undefined) {
                    throw new Sk.builtin.AttributeError("cannot get item for key: " + k.v);
                }
                set_item.call(this, k, v);
            }
        } else {
            let self = this;
            let idx = 0;
            Sk.misceval.iterFor(Sk.abstr.iter(arg), function (i) {
                if (Sk.builtin.checkSequence(i)) {
                    // should also check that the sq length is not longer than 2.
                    const len = i.sq$length(); //this can't currently suspend
                    if (len !== 2) {
                        throw new Sk.builtin.ValueError("dictionary update sequence element #" + idx + " has length " + len + "; 2 is required");
                    }
                    self.mp$ass_subscript(i.mp$subscript(0), i.mp$subscript(1));
                    idx++;
                } else {
                    throw new Sk.builtin.TypeError("element " + idx + " is not a sequence");
                }
            });
        }
    }
    if (kwargs) {
        for (let i = 0; i < kwargs.length; i += 2) {
            this.mp$ass_subscript(new Sk.builtin.str(kwargs[i]), kwargs[i + 1]);
        }
    }
    return Sk.builtin.none.none$;
};


Sk.builtin.dict.prototype.key$lookup = function (bucket, key) {
    var item;
    var eq;
    var i;

    // Fast path: We spend a *lot* of time looking up strings
    // in dictionaries. (Every attribute access, for starters.)
    if (key.ob$type === Sk.builtin.str) {
        for (i = 0; i < bucket.items.length; i++) {
            item = bucket.items[i];
            if (item.lhs.ob$type === Sk.builtin.str && item.lhs.v === key.v) {
                return item;
            }
        }
        return null;
    }

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
    var bucket = this.buckets[k.v];
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
    Sk.builtin.pyCheckArgsLen("[]", arguments.length, 1, 2, false, false);
    var s;
    var res = this.mp$lookup(key);

    if (res !== undefined) {
        // Found in dictionary
        return res;
    } else {
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
    var bucket = this.buckets[k.v];
    var item;

    if (bucket === undefined) {
        // first check if value w is undefined which would indicate deleting an object
        if (w === undefined) {
            throw new Sk.builtin.AttributeError("dict object has no attribute " + Sk.misceval.objectRepr(key));
        }
        // New bucket
        bucket = {
            $hash: k, items: [
                { lhs: key, rhs: w }
            ]
        };
        this.buckets[k.v] = bucket;
        this.size += 1;
        return;
    }

    item = this.key$lookup(bucket, key);
    if (item) {
        item.rhs = w;
        return;
    } else if (w === undefined) {
        throw new Sk.builtin.AttributeError("dict object has no attribute " + Sk.misceval.objectRepr(key).$jsstr());
    }

    // Not found in dictionary
    bucket.items.push({ lhs: key, rhs: w });
    this.size += 1;
};

Sk.builtin.dict.prototype.mp$del_subscript = function (key) {
    Sk.builtin.pyCheckArgsLen("del", arguments.length, 1, 1, false, false);
    var k = kf(key);
    var bucket = this.buckets[k.v];
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

Sk.builtin.dict.prototype["$r"] = function () {
    var v;
    var iter, k;
    var ret = [];
    // for subclassing we make sure we use the dict get_item method and subclass method;
    const get_item = Sk.builtin.dict.prototype.mp$subscript;
    for (iter = Sk.abstr.iter(this), k = iter.tp$iternext();
        k !== undefined;
        k = iter.tp$iternext()) {
        v = get_item.call(this, k);
        if (v === undefined) {
            //print(k, "had undefined v");
            v = null;
        }

        // we need to check if value is same as object
        // otherwise it would cause an stack overflow
        if (v === this) {
            ret.push(Sk.misceval.objectRepr(k).v + ": {...}");
        } else {
            ret.push(Sk.misceval.objectRepr(k).v + ": " + Sk.misceval.objectRepr(v).v);
        }
    }
    return new Sk.builtin.str("{" + ret.join(", ") + "}");
};

Sk.builtin.dict.prototype.sq$length = function () {
    return this.size;
};

Sk.builtin.dict.prototype["get"] = new Sk.builtin.func(function (self, k, d) {
    Sk.builtin.pyCheckArgsLen("get()", arguments.length, 1, 2, false, true);
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
    Sk.builtin.pyCheckArgsLen("pop()", arguments.length, 1, 2, false, true);
    var k = kf(key);
    var bucket = self.buckets[k.v];
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

Sk.builtin.dict.prototype.haskey$ = function (self, k) {
    Sk.builtin.pyCheckArgsLen("has_key()", arguments.length, 1, 1, false, true);
    return new Sk.builtin.bool(self.sq$contains(k));
};

const dict$views = {
    KEYS: "keys",
    VALUES: "values",
    ITEMS: "items"
};

Sk.builtin.dictview = function (type, dict) {
    this.dict = dict;
    this.type = type;  // from dict$views

    return this;
};

Sk.abstr.setUpInheritance("dictview", Sk.builtin.dictview, Sk.builtin.object);

Sk.builtin.dictview.prototype.$r = function () {
    var rep = "dict_" + this.type + "([";
    var iter, key, value;
    var empty = true;
    for (iter = Sk.abstr.iter(this.dict), key = iter.tp$iternext();
        key !== undefined;
        key = iter.tp$iternext()) {
        empty = false;
        if (this.type === dict$views.KEYS) {
            rep += Sk.misceval.objectRepr(key).v + ", ";
        } else {
            value = this.dict.mp$subscript(key);
            if (value === undefined) {
                value = null;
            }
            if (this.type === dict$views.VALUES) {
                rep += Sk.misceval.objectRepr(value).v + ", ";
            } else if (this.type === dict$views.ITEMS) {
                rep += "(" + Sk.misceval.objectRepr(key).v + ", " + Sk.misceval.objectRepr(value).v + "), ";
            }
        }
    }
    if (!empty) {
        rep = rep.slice(0, -2);
    }
    rep += "])";
    return new Sk.builtin.str(rep);
};

Sk.builtin.dictview.prototype.sq$length = function () {
    return this.dict.sq$length();
};

Sk.builtin.dictview.prototype.sq$contains = function (item) {
    var iter, key, value, pair;
    if (this.type === dict$views.KEYS) {
        return this.dict.sq$contains(item);
    } else if (this.type === dict$views.VALUES) {
        for (iter = Sk.abstr.iter(this.dict), key = iter.tp$iternext();
            key !== undefined;
            key = iter.tp$iternext()) {
            value = this.dict.mp$subscript(key);
            if (value === undefined) {
                value = null;
            }
            if (Sk.misceval.isTrue(Sk.misceval.richCompareBool(value, item, "Eq"))) {
                return true;
            }
        }

        return false;
    } else if (this.type === dict$views.ITEMS) {
        if (item.mp$subscript && item.sq$length && (item.sq$length() === 2)) {
            key = item.mp$subscript(new Sk.builtin.int_(0));
            value = this.dict.mp$lookup(key);
            if (value !== undefined) {
                pair = new Sk.builtin.tuple([key, value]);
                if (Sk.misceval.isTrue(Sk.misceval.richCompareBool(pair, item, "Eq"))) {
                    return true;
                }
            }
        }

        return false;
    }
};

Sk.builtin.dictview.prototype.tp$iter = function () {
    // Hijack the Py2 iterators
    var iter;
    if (this.type === dict$views.KEYS) {
        iter = Sk.builtin.dict.prototype.py2$keys(this.dict).tp$iter();
    } else if (this.type === dict$views.VALUES) {
        iter = this.dict.py2$values(this.dict).tp$iter();
    } else if (this.type === dict$views.ITEMS) {
        iter = this.dict.py2$items(this.dict).tp$iter();
    }
    iter.$r = function () {
        return new Sk.builtin.str("<dict_" + this.type + "iterator>");
    };
    return iter;
};

Sk.builtin.dictview.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, false, true);

    return self.tp$iter();
});


Sk.builtin.dict.prototype.py2$items = function (self) {
    Sk.builtin.pyCheckArgsLen("items", arguments.length, 0, 0, false, true);
    var v;
    var iter, k;
    var ret = [];

    for (iter = Sk.abstr.iter(self), k = iter.tp$iternext();
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
};

Sk.builtin.dict.prototype.py3$items = function (self) {
    Sk.builtin.pyCheckArgsLen("items", arguments.length, 0, 0, false, true);

    return new Sk.builtin.dictview(dict$views.ITEMS, self);
};

Sk.builtin.dict.prototype["items"] = new Sk.builtin.func(Sk.builtin.dict.prototype.py2$items);

Sk.builtin.dict.prototype.py2$keys = function (self) {
    Sk.builtin.pyCheckArgsLen("keys", arguments.length, 0, 0, false, true);
    var iter, k;
    var ret = [];

    for (iter = Sk.abstr.iter(self), k = iter.tp$iternext();
        k !== undefined;
        k = iter.tp$iternext()) {
        ret.push(k);
    }
    return new Sk.builtin.list(ret);
};

Sk.builtin.dict.prototype.py3$keys = function (self) {
    Sk.builtin.pyCheckArgsLen("keys", arguments.length, 0, 0, false, true);

    return new Sk.builtin.dictview(dict$views.KEYS, self);
};

Sk.builtin.dict.prototype["keys"] = new Sk.builtin.func(Sk.builtin.dict.prototype.py2$keys);

Sk.builtin.dict.prototype.py2$values = function (self) {
    Sk.builtin.pyCheckArgsLen("values", arguments.length, 0, 0, false, true);
    var v;
    var iter, k;
    var ret = [];

    for (iter = Sk.abstr.iter(self), k = iter.tp$iternext();
        k !== undefined;
        k = iter.tp$iternext()) {
        v = self.mp$subscript(k);
        if (v === undefined) {
            v = null;
        }
        ret.push(v);
    }
    return new Sk.builtin.list(ret);
};

Sk.builtin.dict.prototype.py3$values = function (self) {
    Sk.builtin.pyCheckArgsLen("values", arguments.length, 0, 0, false, true);

    return new Sk.builtin.dictview(dict$views.VALUES, self);
};

Sk.builtin.dict.prototype["values"] = new Sk.builtin.func(Sk.builtin.dict.prototype.py2$values);

Sk.setupDictIterators = function (python3) {
    if (python3) {
        Sk.builtin.dict.prototype["keys"] = new Sk.builtin.func(Sk.builtin.dict.prototype.py3$keys);
        Sk.builtin.dict.prototype["values"] = new Sk.builtin.func(Sk.builtin.dict.prototype.py3$values);
        Sk.builtin.dict.prototype["items"] = new Sk.builtin.func(Sk.builtin.dict.prototype.py3$items);
    } else {
        Sk.builtin.dict.prototype["keys"] = new Sk.builtin.func(Sk.builtin.dict.prototype.py2$keys);
        Sk.builtin.dict.prototype["values"] = new Sk.builtin.func(Sk.builtin.dict.prototype.py2$values);
        Sk.builtin.dict.prototype["items"] = new Sk.builtin.func(Sk.builtin.dict.prototype.py2$items);
    }
};

Sk.builtin.dict.prototype["clear"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("clear()", arguments.length, 0, 0, false, true);
    var k;
    var iter;

    for (iter = Sk.abstr.iter(self), k = iter.tp$iternext();
        k !== undefined;
        k = iter.tp$iternext()) {
        self.mp$del_subscript(k);
    }
});

Sk.builtin.dict.prototype["setdefault"] = new Sk.builtin.func(function (self, key, default_) {
    try {
        return self.mp$subscript(key);
    } catch (e) {
        if (default_ === undefined) {
            default_ = Sk.builtin.none.none$;
        }
        self.mp$ass_subscript(key, default_);
        return default_;
    }
});

/*
    this function mimics the cpython implementation, which is also the reason for the
    almost similar code, this may be changed in future
*/
Sk.builtin.dict.prototype.dict_merge = function (b) {
    var iter;
    var k, v;
    if (b instanceof Sk.builtin.dict) {
        // fast way
        for (iter = b.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
            v = b.mp$subscript(k);
            if (v === undefined) {
                throw new Sk.builtin.AttributeError("cannot get item for key: " + k.v);
            }
            this.mp$ass_subscript(k, v);
        }
    } else {
        // generic slower way
        var keys = Sk.misceval.callsimArray(b["keys"], [b]);
        for (iter = Sk.abstr.iter(keys), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
            v = b.tp$getitem(k); // get value
            if (v === undefined) {
                throw new Sk.builtin.AttributeError("cannot get item for key: " + k.v);
            }
            this.mp$ass_subscript(k, v);
        }
    }
};

/**
 *   update() accepts either another dictionary object or an iterable of key/value pairs (as tuples or other iterables of length two).
 *   If keyword arguments are specified, the dictionary is then updated with those key/value pairs: d.update(red=1, blue=2).
 *   https://hg.python.org/cpython/file/4ff865976bb9/Objects/dictobject.c
 */
var update_f = function (kwargs, self, other) {
    // case another dict or obj with keys and getitem has been provided
    if (other !== undefined && (other.tp$name === "dict" || other["keys"])) {
        self.dict_merge(other); // we merge with override
    } else if (other !== undefined && Sk.builtin.checkIterable(other)) {
        // 2nd case, we expect an iterable that contains another iterable of length 2
        var iter;
        var k, v;
        var seq_i = 0; // index of current sequence item
        for (iter = Sk.abstr.iter(other), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext(), seq_i++) {
            // check if value is iter
            if (!Sk.builtin.checkIterable(k)) {
                throw new Sk.builtin.TypeError("cannot convert dictionary update sequence element #" + seq_i + " to a sequence");
            }

            // cpython impl. would transform iterable into sequence
            // we just call iternext twice if k has length of 2
            if (k.sq$length() === 2) {
                var k_iter = Sk.abstr.iter(k);
                var k_key = k_iter.tp$iternext();
                var k_value = k_iter.tp$iternext();
                self.mp$ass_subscript(k_key, k_value);
            } else {
                // throw exception
                throw new Sk.builtin.ValueError("dictionary update sequence element #" + seq_i + " has length " + k.sq$length() + "; 2 is required");
            }
        }
    } else if (other !== undefined) {
        // other is not a dict or iterable
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) + "' object is not iterable");
    }

    // apply all key/value pairs of kwargs
    // create here kwargs_dict, there could be exceptions in other cases before
    var kwargs_dict = new Sk.builtins.dict(kwargs);
    self.dict_merge(kwargs_dict);

    // returns none, when successful or throws exception
    return Sk.builtin.none.none$;
};

update_f.co_kwargs = true;
Sk.builtin.dict.prototype.update = new Sk.builtin.func(update_f);


Sk.builtin.dict.prototype.__cmp__ = new Sk.builtin.func(function (self, other, op) {
    // __cmp__ cannot be supported until dict lt/le/gt/ge operations are supported
    return Sk.builtin.NotImplemented.NotImplemented$;
});

Sk.builtin.dict.prototype.tp$iter = function () {
    return new Sk.builtin.dict_iter_(this);
};


/* python3 recommends implementing simple ops */
Sk.builtin.dict.prototype.ob$eq = function (other) {

    var iter, k, v, otherv;

    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    if (!(other instanceof Sk.builtin.dict)) {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }

    if (this.size !== other.size) {
        return Sk.builtin.bool.false$;
    }

    for (iter = this.tp$iter(), k = iter.tp$iternext();
        k !== undefined;
        k = iter.tp$iternext()) {
        v = this.mp$lookup(k);
        otherv = other.mp$lookup(k);

        if (otherv === undefined) {
            return Sk.builtin.bool.false$;
        }

        if (!Sk.misceval.richCompareBool(v, otherv, "Eq")) {
            return Sk.builtin.bool.false$;
        }
    }

    return Sk.builtin.bool.true$;
};

Sk.builtin.dict.prototype.ob$ne = function (other) {

    var isEqual = this.ob$eq(other);

    if (isEqual instanceof Sk.builtin.NotImplemented) {
        return isEqual;
    } else if (isEqual.v) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.bool.true$;
    }

};

Sk.builtin.dict.prototype["copy"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("copy", arguments.length, 0, 0, false, true);

    var it; // Iterator
    var k; // Key of dict item
    var v; // Value of dict item
    var newCopy = new Sk.builtin.dict([]);

    for (it = Sk.abstr.iter(self), k = it.tp$iternext();
        k !== undefined;
        k = it.tp$iternext()) {
        v = self.mp$subscript(k);
        if (v === undefined) {
            v = null;
        }
        newCopy.mp$ass_subscript(k, v);
    }

    return newCopy;
});

Sk.builtin.dict.$fromkeys = function fromkeys(self, seq, value) {
    var k, iter, val, res, iterable;

    if (self instanceof Sk.builtin.dict) {
        // instance call
        Sk.builtin.pyCheckArgsLen("fromkeys", arguments.length, 1, 2, false, true);

        res = self;
        iterable = seq;
        val = value === undefined ? Sk.builtin.none.none$ : value;
    } else {
        // static call
        Sk.builtin.pyCheckArgsLen("fromkeys", arguments.length, 1, 2, false, false);

        res = new Sk.builtin.dict([]);
        iterable = self;
        val = seq === undefined ? Sk.builtin.none.none$ : seq;
    }

    if (!Sk.builtin.checkIterable(iterable)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
    }

    for (iter = Sk.abstr.iter(iterable), k = iter.tp$iternext();
        k !== undefined;
        k = iter.tp$iternext()) {
        res.mp$ass_subscript(k, val);
    }

    return res;
};

Sk.builtin.dict.prototype.sk$asarray = function () {
    let bucket;
    let buckets = this.buckets;
    const allkeys = [];
    for (let k in buckets) {
        if (buckets.hasOwnProperty(k)) {
            bucket = buckets[k];
            if (bucket && bucket.$hash !== undefined && bucket.items !== undefined) {
                // skip internal stuff. todo; merge pyobj and this
                for (let i = 0; i < bucket.items.length; i++) {
                    allkeys.push(bucket.items[i].lhs);
                }
            }
        }
    }
    return allkeys;
};

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

Sk.builtin.dict.prototype["viewitems"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.viewitems is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["viewkeys"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.viewkeys is not yet implemented in Skulpt");
});

Sk.builtin.dict.prototype["viewvalues"] = new Sk.builtin.func(function (self) {
    throw new Sk.builtin.NotImplementedError("dict.viewvalues is not yet implemented in Skulpt");
});

Sk.exportSymbol("Sk.builtin.dict", Sk.builtin.dict);

