/**
 * @constructor
 * @param {Array.<Object>} S
 */
Sk.builtin.frozenset = function (S) {
    var it, i;
    var obj, len;

    if (!(this instanceof Sk.builtin.frozenset)) {
        Sk.builtin.pyCheckArgsLen("frozenset", arguments.length, 0, 1);
        return new Sk.builtin.frozenset(S);
    }

    this.frozenset_reset_();

    if (S !== undefined) {
        obj = S;
        if (obj.sk$asarray) {
            obj = obj.sk$asarray();
        }

        if (Object.prototype.toString.apply(obj) === "[object Array]") {
            len = obj.length;
            for (i = 0; i < len; i++) {
                this.v.mp$ass_subscript(obj[i], true);
            }
        } else if (Sk.builtin.checkIterable(obj)) {
            for (it = Sk.abstr.iter(obj), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                this.v.mp$ass_subscript(i, true);
            }
        } else {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(S) + "' " + "object is not iterable");
        }
    }

    return this;
};
Sk.abstr.setUpInheritance("frozenset", Sk.builtin.frozenset, Sk.builtin.object);

Sk.builtin.frozenset.prototype.__class__ = Sk.builtin.frozenset;

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
            return new Sk.builtin.str("frozenset()");
        } else {
            return new Sk.builtin.str("frozenset({" + ret.join(", ") + "})");
        }
    } else {
        return new Sk.builtin.str("frozenset([" + ret.join(", ") + "])");
    }
};

Sk.builtin.frozenset.prototype.sk$asarray = function () {
    return this.v.sk$asarray();
};

Sk.builtin.frozenset.prototype.tp$hash = function () {
    // numbers taken from Cpython 2.7 hash function
    let hash = 1927868237;
    const entries = this.sk$asarray();
    hash *= entries.length + 1;
    for (let i = 0; i < entries.length; i++) {
        const h = Sk.builtin.hash(entries[i]).v;
        hash ^= (h ^ (h << 16) ^ 89869747) * 3644798167;
    }
    hash = hash * 69069 + 907133923;
    hash = new Sk.builtin.int_(hash);
    this.$savedHash_ = hash;
    return hash;
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
    return new Sk.builtin.set_iter_(self);
});

Sk.builtin.frozenset.prototype.tp$iter = function () {
    return new Sk.builtin.set_iter_(this);
};

Sk.builtin.frozenset.prototype.sq$length = function () {
    return this["v"].mp$length();
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

Sk.builtin.frozenset.prototype.__contains__ = new Sk.builtin.func(function(self, item) {
    Sk.builtin.pyCheckArgsLen("__contains__", arguments.length, 2, 2);
    return new Sk.builtin.bool(self.sq$contains(item));
});
