/**
 * @constructor
 * @param {Array.<Object>} S
 */
Sk.builtin.frozenset = function (S) {
    // internal function S is an Array or undefined
    if (!(this instanceof Sk.builtin.frozenset)) {
        return new Sk.builtin.frozenset(S);
    }

    if (S === undefined) {
        S = [];
    }

    this.v = new Sk.builtin.dict(S);

    return this;
};


Sk.abstr.setUpInheritance("frozenset", Sk.builtin.frozenset, Sk.builtin.object);

Sk.builtin.frozenset.prototype.tp$doc = "frozenset() -> empty frozenset object\nfrozenset(iterable) -> frozenset object\n\nBuild an immutable unordered collection of unique elements."

Sk.builtin.frozenset.prototype.tp$new = function (args, kwargs) {
    if (this !== Sk.builtin.frozenset.prototype) {
        return Sk.builtin.frozenset.prototype.$subtype_new.call(this, args, kwargs);
    }

    if (kwargs && kwargs.length) {
        throw new Sk.builtin.TypeError("frozenset() takes no keyword arguments")
    } else if (args.length > 1) {
        throw new Sk.builtin.TypeError("frozenset expected at most 1 arguments, got " + args.length)
    }
    const arg = args[0];
    const S = [];
    if (arg !== undefined) {
        Sk.misceval.iterFor(Sk.abstr.iter(arg), function (i) {
            S.push(i);
            S.push(true);
        });
    }
    return new Sk.builtin.frozenset(S);
};

Sk.builtin.frozenset.prototype.$subtype_new = function (args, kwargs) {
    debugger;
    const instance = new this.constructor;
    // pass the args but ignore the kwargs for subtyping
    const frozenset = Sk.builtin.frozenset.prototype.tp$new(args);
    instance.v = frozenset.v;
    delete frozenset;
    return instance;
};

Sk.builtin.frozenset.prototype.frozenset_reset_ = function () {
    this.v = new Sk.builtin.dict([]);
};

Sk.builtin.frozenset.prototype["$r"] = function () {
    var it, i;
    var ret = [];
    for (it = Sk.abstr.iter(this), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        ret.push(Sk.misceval.objectRepr(i).v);
    }

    if(Sk.__future__.python3){
        if (ret.length === 0) {
            return new Sk.builtin.str(Sk.abstr.typeName(this) + "()");
        } else {
            return new Sk.builtin.str(Sk.abstr.typeName(this) + "({" + ret.join(", ") + "})");
        }
    } else {
        return new Sk.builtin.str(Sk.abstr.typeName(this) + "([" + ret.join(", ") + "])");
    }
};

Sk.builtin.frozenset.prototype.ob$eq = function (other) {

    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    if (!(other instanceof Sk.builtin.frozenset)) {
        return Sk.builtin.bool.false$;
    }

    if (Sk.builtin.frozenset.prototype.sq$length.call(this) !==
        Sk.builtin.frozenset.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issubset"].func_code(this, other);
};

Sk.builtin.frozenset.prototype.ob$ne = function (other) {

    if (this === other) {
        return Sk.builtin.bool.false$;
    }

    if (!(other instanceof Sk.builtin.frozenset)) {
        return Sk.builtin.bool.true$;
    }

    if (Sk.builtin.frozenset.prototype.sq$length.call(this) !==
        Sk.builtin.frozenset.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.true$;
    }

    if (this["issubset"].func_code(this, other).v) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.bool.true$;
    }
};

Sk.builtin.frozenset.prototype.ob$lt = function (other) {

    if (this === other) {
        return Sk.builtin.bool.false$;
    }

    if (Sk.builtin.frozenset.prototype.sq$length.call(this) >=
        Sk.builtin.frozenset.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issubset"].func_code(this, other);
};

Sk.builtin.frozenset.prototype.ob$le = function (other) {

    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    if (Sk.builtin.frozenset.prototype.sq$length.call(this) >
        Sk.builtin.frozenset.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issubset"].func_code(this, other);
};

Sk.builtin.frozenset.prototype.ob$gt = function (other) {

    if (this === other) {
        return Sk.builtin.bool.false$;
    }

    if (Sk.builtin.frozenset.prototype.sq$length.call(this) <=
        Sk.builtin.frozenset.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issuperset"].func_code(this, other);
};

Sk.builtin.frozenset.prototype.ob$ge = function (other) {

    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    if (Sk.builtin.frozenset.prototype.sq$length.call(this) <
        Sk.builtin.frozenset.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issuperset"].func_code(this, other);
};

Sk.builtin.frozenset.prototype.nb$and = function(other){
    if (Sk.__future__.python3 && !(other instanceof Sk.builtin.frozenset)) {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for &: 'frozenset' and '" + Sk.abstr.typeName(other) + "'");
    }

    return this["intersection"].func_code(this, other);
};

Sk.builtin.frozenset.prototype.nb$or = function(other){
    if (Sk.__future__.python3 && !(other instanceof Sk.builtin.frozenset)) {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for |: 'frozenset' and '" + Sk.abstr.typeName(other) + "'");
    }

    return this["union"].func_code(this, other);
};

Sk.builtin.frozenset.prototype.nb$xor = function(other){
    if (Sk.__future__.python3 && !(other instanceof Sk.builtin.frozenset)) {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for ^: 'frozenset' and '" + Sk.abstr.typeName(other) + "'");
    }

    return this["symmetric_difference"].func_code(this, other);
};

Sk.builtin.frozenset.prototype.nb$subtract = function(other){
    if (Sk.__future__.python3 && !(other instanceof Sk.builtin.frozenset)) {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for -: 'frozenset' and '" + Sk.abstr.typeName(other) + "'");
    }

    return this["difference"].func_code(this, other);
};

Sk.builtin.frozenset.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, false, true);
    return new Sk.builtin.frozenset_iter_(self);
});

Sk.builtin.frozenset.prototype.tp$iter = function () {
    return new Sk.builtin.frozenset_iter_(this);
};

Sk.builtin.frozenset.prototype.sq$length = function () {
    return this["v"].sq$length();
};

Sk.builtin.frozenset.prototype.sq$contains = function(ob) {
    return this["v"].sq$contains(ob);
};

Sk.builtin.frozenset.prototype["isdisjoint"] = new Sk.builtin.func(function (self, other) {
    // requires all items in self to not be in other
    var isIn;
    var it, item;

    Sk.builtin.pyCheckArgsLen("isdisjoint", arguments.length, 2, 2);
    if (!Sk.builtin.checkIterable(other)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) + "' object is not iterable");
    }

    for (it = Sk.abstr.iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        isIn = Sk.abstr.sequenceContains(other, item);
        if (isIn) {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;
});

Sk.builtin.frozenset.prototype["issubset"] = new Sk.builtin.func(function (self, other) {
    var isIn;
    var it, item;
    var selfLength, otherLength;

    Sk.builtin.pyCheckArgsLen("issubset", arguments.length, 2, 2);
    if (!Sk.builtin.checkIterable(other)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(other) + "' object is not iterable");
    }

    selfLength = self.sq$length();
    otherLength = other.sq$length();

    if (selfLength > otherLength) {
        // every item in this set can't be in other if it's shorter!
        return Sk.builtin.bool.false$;
    }
    for (it = Sk.abstr.iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        isIn = Sk.abstr.sequenceContains(other, item);
        if (!isIn) {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;
});

Sk.builtin.frozenset.prototype["issuperset"] = new Sk.builtin.func(function (self, other) {
    Sk.builtin.pyCheckArgsLen("issuperset", arguments.length, 2, 2);
    return Sk.builtin.frozenset.prototype["issubset"].func_code(other, self);
});

Sk.builtin.frozenset.prototype["union"] = new Sk.builtin.func(function (self) {
    var S, i, new_args;

    Sk.builtin.pyCheckArgsLen("union", arguments.length, 1);

    S = Sk.builtin.frozenset.prototype["copy"].func_code(self);
    new_args = [S];
    for (i = 1; i < arguments.length; i++) {
        new_args.push(arguments[i]);
    }

    var i, it, item, arg;
    for (i = 0; i < new_args.length; i++) {
        arg = new_args[i];
        if (!Sk.builtin.checkIterable(arg)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(arg) + "' object is not iterable");
        }
        for (it = Sk.abstr.iter(arg), item = it.tp$iternext();
            item !== undefined;
            item = it.tp$iternext()) {
            S.v.mp$ass_subscript(item, true);
        }
    }
    return S;
});

Sk.builtin.frozenset.prototype["intersection"] = new Sk.builtin.func(function (self) {
    var S, i, new_args;

    Sk.builtin.pyCheckArgsLen("intersection", arguments.length, 1);

    S = Sk.builtin.frozenset.prototype["copy"].func_code(self);
    new_args = [S];
    for (i = 1; i < arguments.length; i++) {
        new_args.push(arguments[i]);
    }

    var i, it, item;
    
    for (i = 1; i < arguments.length; i++) {
        if (!Sk.builtin.checkIterable(arguments[i])) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(arguments[i]) +
                                           "' object is not iterable");
        }
    }

    for (it = Sk.abstr.iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        for (i = 1; i < arguments.length; i++) {
            if (!Sk.abstr.sequenceContains(arguments[i], item)) {
                // discard
                Sk.builtin.dict.prototype["pop"].func_code(S.v, item, Sk.builtin.none.none$);
                break;
            }
        }
    }
    return S;
});

Sk.builtin.frozenset.prototype["difference"] = new Sk.builtin.func(function (self, other) {
    var S, i, new_args;

    Sk.builtin.pyCheckArgsLen("difference", arguments.length, 2);

    S = Sk.builtin.frozenset.prototype["copy"].func_code(self);
    new_args = [S];
    for (i = 1; i < arguments.length; i++) {
        new_args.push(arguments[i]);
    }

    var i, it, item;

    for (i = 1; i < arguments.length; i++) {
        if (!Sk.builtin.checkIterable(arguments[i])) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(arguments[i]) +
                                           "' object is not iterable");
        }
    }

    for (it = Sk.abstr.iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        for (i = 1; i < arguments.length; i++) {
            if (Sk.abstr.sequenceContains(arguments[i], item)) {
                // discard
                Sk.builtin.dict.prototype["pop"].func_code(S.v, item, Sk.builtin.none.none$);
                break;
            }
        }
    }

    return S;
});


Sk.builtin.frozenset.prototype["symmetric_difference"] = new Sk.builtin.func(function (self, other) {
    var it, item, S;

    Sk.builtin.pyCheckArgsLen("symmetric_difference", arguments.length, 2, 2);

    S = Sk.builtin.frozenset.prototype["union"].func_code(self, other);
    for (it = Sk.abstr.iter(S), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        if (Sk.abstr.sequenceContains(self, item) && Sk.abstr.sequenceContains(other, item)) {
            // discard
            Sk.builtin.dict.prototype["pop"].func_code(S.v, item, Sk.builtin.none.none$);
        }
    }
    return S;
});

Sk.builtin.frozenset.prototype["copy"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("copy", arguments.length, 1, 1);
    return new Sk.builtin.frozenset(self);
});

Sk.exportSymbol("Sk.builtin.frozenset", Sk.builtin.frozenset);

/**
 * @constructor
 * @param {Object} obj
 */
Sk.builtin.frozenset_iter_ = function (obj) {
    var allkeys, k, i, bucket, buckets;
    if (!(this instanceof Sk.builtin.frozenset_iter_)) {
        return new Sk.builtin.frozenset_iter_(obj);
    }
    this.$obj = obj;
    this.tp$iter = this;
    allkeys = [];
    buckets = obj.v.buckets;
    for (k in buckets) {
        if (buckets.hasOwnProperty(k)) {
            bucket = buckets[k];
            if (bucket && bucket.$hash !== undefined && bucket.items !== undefined) {
                // skip internal stuff. todo; merge pyobj and this
                for (i = 0; i < bucket.items.length; i++) {
                    allkeys.push(bucket.items[i].lhs);
                }
            }
        }
    }
    this.$index = 0;
    this.$keys = allkeys;
    this.tp$iternext = function () {
        if (this.$index >= this.$keys.length) {
            return undefined;
        }
        return this.$keys[this.$index++];
    };
    this.$r = function () {
        return new Sk.builtin.str("frozensetiterator");
    };
    return this;
};

Sk.abstr.setUpInheritance("frozensetiterator", Sk.builtin.frozenset_iter_, Sk.builtin.object);


Sk.builtin.frozenset_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, true, false);
    return self;
});

Sk.builtin.frozenset_iter_.prototype.next$ = function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
};

Sk.builtin.frozenset.prototype.__contains__ = new Sk.builtin.func(function(self, item) {
    Sk.builtin.pyCheckArgsLen("__contains__", arguments.length, 2, 2);
    return new Sk.builtin.bool(self.sq$contains(item));
});
