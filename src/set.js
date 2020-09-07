/**
 * @constructor
 * @param {Array.<Object>} S
 */
Sk.builtin.set = function (S) {
    var it, i;
    var obj, len;

    if (!(this instanceof Sk.builtin.set)) {
        // Called directly from Python
        Sk.builtin.pyCheckArgsLen("set", arguments.length, 0, 1);
        return new Sk.builtin.set(S);
    }

    this.set_reset_();

    if (S !== undefined) {
        obj = S;
        if (obj.sk$asarray) {
            obj = obj.sk$asarray();
        }

        if (Object.prototype.toString.apply(obj) === "[object Array]") {
            len = obj.length;
            for (i = 0; i < len; i++) {
                Sk.builtin.set.prototype["add"].func_code(this, obj[i]);
            }
        } else if (Sk.builtin.checkIterable(obj)) {
            for (it = Sk.abstr.iter(obj), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                Sk.builtin.set.prototype["add"].func_code(this, i);
            }
        } else {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(S) + "' " + "object is not iterable");
        }
    }

    return this;
};
Sk.abstr.setUpInheritance("set", Sk.builtin.set, Sk.builtin.object);
Sk.abstr.markUnhashable(Sk.builtin.set);

Sk.builtin.set.prototype.__class__ = Sk.builtin.set;

Sk.builtin.set.prototype.set_reset_ = function () {
    this.v = new Sk.builtin.dict([]);
};

Sk.builtin.set.prototype["$r"] = function () {
    var it, i;
    var ret = [];
    for (it = Sk.abstr.iter(this), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        ret.push(Sk.misceval.objectRepr(i).v);
    }

    if(Sk.__future__.python3) {
        if (ret.length === 0) {
            return new Sk.builtin.str("set()");
        } else {
            return new Sk.builtin.str("{" + ret.join(", ") + "}");
        }
    } else {
        return new Sk.builtin.str("set([" + ret.join(", ") + "])");
    }
};

Sk.builtin.set.prototype.sk$asarray = function () {
    return this.v.sk$asarray();
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

Sk.builtin.set.prototype.nb$and = function(other){
    if (Sk.__future__.python3 && !(other instanceof Sk.builtin.set)) {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for &: 'set' and '" + Sk.abstr.typeName(other) + "'");
    }

    return this["intersection"].func_code(this, other);
};

Sk.builtin.set.prototype.nb$or = function(other){
    if (Sk.__future__.python3 && !(other instanceof Sk.builtin.set)) {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for |: 'set' and '" + Sk.abstr.typeName(other) + "'");
    }

    return this["union"].func_code(this, other);
};

Sk.builtin.set.prototype.nb$xor = function(other){
    if (Sk.__future__.python3 && !(other instanceof Sk.builtin.set)) {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for ^: 'set' and '" + Sk.abstr.typeName(other) + "'");
    }

    return this["symmetric_difference"].func_code(this, other);
};

Sk.builtin.set.prototype.nb$subtract = function(other){
    if (Sk.__future__.python3 && !(other instanceof Sk.builtin.set)) {
        throw new Sk.builtin.TypeError("unsupported operand type(s) for -: 'set' and '" + Sk.abstr.typeName(other) + "'");
    }

    return this["difference"].func_code(this, other);
};

Sk.builtin.set.prototype["__iter__"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, false, true);
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

Sk.builtin.set.prototype["issubset"] = new Sk.builtin.func(function (self, other) {
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

Sk.builtin.set.prototype["issuperset"] = new Sk.builtin.func(function (self, other) {
    Sk.builtin.pyCheckArgsLen("issuperset", arguments.length, 2, 2);
    return Sk.builtin.set.prototype["issubset"].func_code(other, self);
});

Sk.builtin.set.prototype["union"] = new Sk.builtin.func(function (self) {
    var S, i, new_args;

    Sk.builtin.pyCheckArgsLen("union", arguments.length, 1);

    S = Sk.builtin.set.prototype["copy"].func_code(self);
    new_args = [S];
    for (i = 1; i < arguments.length; i++) {
        new_args.push(arguments[i]);
    }

    Sk.builtin.set.prototype["update"].func_code.apply(null, new_args);
    return S;
});

Sk.builtin.set.prototype["intersection"] = new Sk.builtin.func(function (self) {
    var S, i, new_args;

    Sk.builtin.pyCheckArgsLen("intersection", arguments.length, 1);

    S = Sk.builtin.set.prototype["copy"].func_code(self);
    new_args = [S];
    for (i = 1; i < arguments.length; i++) {
        new_args.push(arguments[i]);
    }

    Sk.builtin.set.prototype["intersection_update"].func_code.apply(null, new_args);
    return S;
});

Sk.builtin.set.prototype["difference"] = new Sk.builtin.func(function (self, other) {
    var S, i, new_args;

    Sk.builtin.pyCheckArgsLen("difference", arguments.length, 2);

    S = Sk.builtin.set.prototype["copy"].func_code(self);
    new_args = [S];
    for (i = 1; i < arguments.length; i++) {
        new_args.push(arguments[i]);
    }

    Sk.builtin.set.prototype["difference_update"].func_code.apply(null, new_args);
    return S;
});

Sk.builtin.set.prototype["symmetric_difference"] = new Sk.builtin.func(function (self, other) {
    var it, item, S;

    Sk.builtin.pyCheckArgsLen("symmetric_difference", arguments.length, 2, 2);

    S = Sk.builtin.set.prototype["union"].func_code(self, other);
    for (it = Sk.abstr.iter(S), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
        if (Sk.abstr.sequenceContains(self, item) && Sk.abstr.sequenceContains(other, item)) {
            Sk.builtin.set.prototype["discard"].func_code(S, item);
        }
    }
    return S;
});

Sk.builtin.set.prototype["copy"] = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("copy", arguments.length, 1, 1);
    return new Sk.builtin.set(self);
});

Sk.builtin.set.prototype["update"] = new Sk.builtin.func(function (self, other) {
    var i, it, item, arg;

    Sk.builtin.pyCheckArgsLen("update", arguments.length, 2);

    for (i = 1; i < arguments.length; i++) {
        arg = arguments[i];
        if (!Sk.builtin.checkIterable(arg)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(arg) + "' object is not iterable");
        }
        for (it = Sk.abstr.iter(arg), item = it.tp$iternext();
            item !== undefined;
            item = it.tp$iternext()) {
            Sk.builtin.set.prototype["add"].func_code(self, item);
        }
    }

    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype["intersection_update"] = new Sk.builtin.func(function (self, other) {
    var i, it, item;

    Sk.builtin.pyCheckArgsLen("intersection_update", arguments.length, 2);
    for (i = 1; i < arguments.length; i++) {
        if (!Sk.builtin.checkIterable(arguments[i])) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(arguments[i]) +
                                           "' object is not iterable");
        }
    }

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
    var i, it, item;

    Sk.builtin.pyCheckArgsLen("difference_update", arguments.length, 2);
    for (i = 1; i < arguments.length; i++) {
        if (!Sk.builtin.checkIterable(arguments[i])) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(arguments[i]) +
                                           "' object is not iterable");
        }
    }

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
    Sk.builtin.pyCheckArgsLen("symmetric_difference_update", arguments.length, 2, 2);

    var sd = Sk.builtin.set.prototype["symmetric_difference"].func_code(self, other);
    self.set_reset_();
    Sk.builtin.set.prototype["update"].func_code(self, sd);
    return Sk.builtin.none.none$;
});


Sk.builtin.set.prototype["add"] = new Sk.builtin.func(function (self, item) {
    Sk.builtin.pyCheckArgsLen("add", arguments.length, 2, 2);

    self.v.mp$ass_subscript(item, true);
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype["discard"] = new Sk.builtin.func(function (self, item) {
    Sk.builtin.pyCheckArgsLen("discard", arguments.length, 2, 2);

    Sk.builtin.dict.prototype["pop"].func_code(self.v, item,
                                               Sk.builtin.none.none$);
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype["pop"] = new Sk.builtin.func(function (self) {
    var it, item;

    Sk.builtin.pyCheckArgsLen("pop", arguments.length, 1, 1);

    if (self.sq$length() === 0) {
        throw new Sk.builtin.KeyError("pop from an empty set");
    }

    it = Sk.abstr.iter(self);
    item = it.tp$iternext();
    Sk.builtin.set.prototype["discard"].func_code(self, item);
    return item;
});

Sk.builtin.set.prototype["remove"] = new Sk.builtin.func(function (self, item) {
    Sk.builtin.pyCheckArgsLen("remove", arguments.length, 2, 2);

    self.v.mp$del_subscript(item);
    return Sk.builtin.none.none$;
});

Sk.builtin.set.prototype.__contains__ = new Sk.builtin.func(function(self, item) {
    Sk.builtin.pyCheckArgsLen("__contains__", arguments.length, 2, 2);
    return new Sk.builtin.bool(self.sq$contains(item));
});

Sk.exportSymbol("Sk.builtin.set", Sk.builtin.set);

/**
 * @constructor
 * @param {Object} obj
 */
Sk.builtin.set_iter_ = function (obj) {
    var iterobj;
    if (!(this instanceof Sk.builtin.set_iter_)) {
        return new Sk.builtin.set_iter_(obj);
    }

    iterobj = Sk.builtin.create_dict_iter_(obj.v);

    // Add set-specific attributes
    iterobj.$obj = obj;
    iterobj.$r = function () {
        return new Sk.builtin.str("<setiterator>");
    };

    return iterobj;
};

Sk.abstr.setUpInheritance("setiterator", Sk.builtin.set_iter_, Sk.builtin.object);

Sk.builtin.set_iter_.prototype.__class__ = Sk.builtin.set_iter_;

Sk.builtin.set_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
    Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, true, false);
    return self;
});

Sk.builtin.set_iter_.prototype.next$ = function (self) {
    var ret = self.tp$iternext();
    if (ret === undefined) {
        throw new Sk.builtin.StopIteration();
    }
    return ret;
};
