/**
 * @constructor
 * @param {Array.<Object>} S
 */
Sk.builtin.set = function (S) {
    var it, i;
    var S_list;
    if (!(this instanceof Sk.builtin.set)) {
        return new Sk.builtin.set(S);
    }


    if (typeof(S) === "undefined") {
        S = [];
    }

    this.set_reset_();
    S_list = new Sk.builtin.list(S);
    // python sorts sets on init, but not thereafter.
    // Skulpt seems to init a new set each time you add/remove something
    //Sk.builtin.list.prototype['sort'].func_code(S);
    for (it = Sk.abstr.iter(S_list), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        Sk.builtin.set.prototype["add"].func_code(this, i);
    }

    this.__class__ = Sk.builtin.set;

    this["v"] = this.v;
    return this;
};
Sk.abstr.setUpInheritance("set", Sk.builtin.set, Sk.builtin.object);
Sk.abstr.markUnhashable(Sk.builtin.set);

Sk.builtin.set.prototype.set_reset_ = function () {
    this.v = new Sk.builtin.dict([]);
};

Sk.builtin.set.prototype["$r"] = function () {
    var it, i;
    var ret = [];
    for (it = Sk.abstr.iter(this), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        ret.push(Sk.misceval.objectRepr(i).v);
    }
    if(Sk.python3) {
        return new Sk.builtin.str("{" + ret.join(", ") + "}");
    } else {
        return new Sk.builtin.str("set([" + ret.join(", ") + "])");
    }
};

Sk.builtin.set.prototype.ob$eq = function (other) {

    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    if (!(other instanceof Sk.builtin.set)) {
        return Sk.builtin.bool.false$;
    }

    if (Sk.builtin.set.prototype.sq$length.call(this) !==
        Sk.builtin.set.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issubset"].func_code(this, other);
};

Sk.builtin.set.prototype.ob$ne = function (other) {

    if (this === other) {
        return Sk.builtin.bool.false$;
    }

    if (!(other instanceof Sk.builtin.set)) {
        return Sk.builtin.bool.true$;
    }

    if (Sk.builtin.set.prototype.sq$length.call(this) !==
        Sk.builtin.set.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.true$;
    }

    if (this["issubset"].func_code(this, other).v) {
        return Sk.builtin.bool.false$;
    } else {
        return Sk.builtin.bool.true$;
    }
};

Sk.builtin.set.prototype.ob$lt = function (other) {

    if (this === other) {
        return Sk.builtin.bool.false$;
    }

    if (Sk.builtin.set.prototype.sq$length.call(this) >=
        Sk.builtin.set.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issubset"].func_code(this, other);
};

Sk.builtin.set.prototype.ob$le = function (other) {

    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    if (Sk.builtin.set.prototype.sq$length.call(this) >
        Sk.builtin.set.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issubset"].func_code(this, other);
};

Sk.builtin.set.prototype.ob$gt = function (other) {

    if (this === other) {
        return Sk.builtin.bool.false$;
    }

    if (Sk.builtin.set.prototype.sq$length.call(this) <=
        Sk.builtin.set.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issuperset"].func_code(this, other);
};

Sk.builtin.set.prototype.ob$ge = function (other) {

    if (this === other) {
        return Sk.builtin.bool.true$;
    }

    if (Sk.builtin.set.prototype.sq$length.call(this) <
        Sk.builtin.set.prototype.sq$length.call(other)) {
        return Sk.builtin.bool.false$;
    }

    return this["issuperset"].func_code(this, other);
};

Sk.builtin.set.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, false, true);
    return new Sk.builtin.set_iter_(self);
});

Sk.builtin.set.prototype.tp$iter = function () {
    return new Sk.builtin.set_iter_(this);
};

Sk.builtin.set.prototype.sq$length = function () {
    return this["v"].mp$length();
};

Sk.builtin.set.prototype.sq$contains = function(ob) {
    return this["v"].sq$contains(ob);
};

Sk.builtin.set.prototype["isdisjoint"] = new Sk.builtin.func(function (self, other) {
    // requires all items in self to not be in other
    var isIn;
    var it, item;
    for (it = Sk.abstr.iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        isIn = Sk.abstr.sequenceContains(other, item);
        if (isIn) {
            return Sk.builtin.bool.false$;
        }
    }
    return Sk.builtin.bool.true$;
});

Sk.builtin.set.prototype["issubset"] = new Sk.builtin.func(function (self, other) {
    var isIn;
    var it, item;
    var selfLength = self.sq$length();
    var otherLength = other.sq$length();
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

Sk.builtin.set.prototype["issuperset"] = new Sk.builtin.func(function (self, other) {
    return Sk.builtin.set.prototype["issubset"].func_code(other, self);
});

Sk.builtin.set.prototype["union"] = new Sk.builtin.func(function (self) {
    var i;
    var S = new Sk.builtin.set(self);
    for (i = 1; i < arguments.length; i++) {
        Sk.builtin.set.prototype["update"].func_code(S, arguments[i]);
    }
    return S;
});

Sk.builtin.set.prototype["intersection"] = new Sk.builtin.func(function (self) {
    var S = Sk.builtin.set.prototype["copy"].func_code(self),
        new_args = Array.prototype.slice.call(arguments); //copy array
    
    new_args[0] = S;
    Sk.builtin.set.prototype["intersection_update"].func_code.apply(null, new_args);
    return S;
});

Sk.builtin.set.prototype["difference"] = new Sk.builtin.func(function (self, other) {
    var S = Sk.builtin.set.prototype["copy"].func_code(self),
        new_args = Array.prototype.slice.call(arguments); //copy array
    
    new_args[0] = S;
    Sk.builtin.set.prototype["difference_update"].func_code.apply(null, new_args);
    return S;
});

Sk.builtin.set.prototype["symmetric_difference"] = new Sk.builtin.func(function (self, other) {
    var it, item;
    var S = Sk.builtin.set.prototype["union"].func_code(self, other);
    for (it = Sk.abstr.iter(S), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        if (Sk.abstr.sequenceContains(self, item) && Sk.abstr.sequenceContains(other, item)) {
            Sk.builtin.set.prototype["discard"].func_code(S, item);
        }
    }
    return S;
});

Sk.builtin.set.prototype["copy"] = new Sk.builtin.func(function (self) {
    return new Sk.builtin.set(self);
});

Sk.builtin.set.prototype["update"] = new Sk.builtin.func(function (self, other) {
    var it, item;
    for (it = Sk.abstr.iter(other), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        Sk.builtin.set.prototype["add"].func_code(self, item);
    }
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype["intersection_update"] = new Sk.builtin.func(function (self, other) {
    var i;
    var it, item;
    for (it = Sk.abstr.iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        for (i = 1; i < arguments.length; i++) {
            if (!Sk.abstr.sequenceContains(arguments[i], item)) {
                Sk.builtin.set.prototype["discard"].func_code(self, item);
                break;
            }
        }
    }
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype["difference_update"] = new Sk.builtin.func(function (self, other) {
    var i;
    var it, item;
    for (it = Sk.abstr.iter(self), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        for (i = 1; i < arguments.length; i++) {
            if (Sk.abstr.sequenceContains(arguments[i], item)) {
                Sk.builtin.set.prototype["discard"].func_code(self, item);
                break;
            }
        }
    }
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype["symmetric_difference_update"] = new Sk.builtin.func(function (self, other) {
    var sd = Sk.builtin.set.prototype["symmetric_difference"].func_code(self, other);
    self.set_reset_();
    Sk.builtin.set.prototype["update"].func_code(self, sd);
    return Sk.builtin.none.none$;
});


Sk.builtin.set.prototype["add"] = new Sk.builtin.func(function (self, item) {
    self.v.mp$ass_subscript(item, true);
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype["discard"] = new Sk.builtin.func(function (self, item) {
    Sk.builtin.dict.prototype["pop"].func_code(self.v, item,
        Sk.builtin.none.none$);
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype["pop"] = new Sk.builtin.func(function (self) {
    var it, item;
    if (self.sq$length() === 0) {
        throw new Sk.builtin.KeyError("pop from an empty set");
    }

    it = Sk.abstr.iter(self);
    item = it.tp$iternext();
    Sk.builtin.set.prototype["discard"].func_code(self, item);
    return item;
});

Sk.builtin.set.prototype["remove"] = new Sk.builtin.func(function (self, item) {
    self.v.mp$del_subscript(item);
    return Sk.builtin.none.none$;
});

goog.exportSymbol("Sk.builtin.set", Sk.builtin.set);

/**
 * @constructor
 * @param {Object} obj
 */
Sk.builtin.set_iter_ = function (obj) {
    var allkeys, k, i, bucket;
    if (!(this instanceof Sk.builtin.set_iter_)) {
        return new Sk.builtin.set_iter_(obj);
    }
    this.$obj = obj;
    this.tp$iter = this;
    allkeys = [];
    for (k in obj.v) {
        if (obj.v.hasOwnProperty(k)) {
            bucket = obj.v[k];
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
        return new Sk.builtin.str("setiterator");
    };
    return this;
};

Sk.abstr.setUpInheritance("setiterator", Sk.builtin.set_iter_, Sk.builtin.object);

Sk.builtin.set_iter_.prototype.__class__ = Sk.builtin.set_iter_;

Sk.builtin.set_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgs("__iter__", arguments, 0, 0, true, false);
    return self;
});

Sk.builtin.set_iter_.prototype["next"] = new Sk.builtin.func(function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
});
