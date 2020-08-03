/**
 * @constructor
 * Sk.builtin.bool
 *
 * @description
 * Constructor for Python bool. Also used for builtin bool() function.
 *
 * Where possible, do not create a new instance but use the constants 
 * Sk.builtin.bool.true$ or Sk.builtin.bool.false$. These are defined in src/constant.js
 *
 * @extends {Sk.builtin.int_}
 *
 * @param  {(Object|number|boolean)} x Value to evaluate as true or false
 * @return {Sk.builtin.bool} Sk.builtin.bool.true$ if x is true, Sk.builtin.bool.false$ otherwise
 */
Sk.builtin.bool = function (x) {
    Sk.builtin.pyCheckArgsLen("bool", arguments.length, 1);
    if (Sk.misceval.isTrue(x)) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.bool.false$;
    }
};

Sk.abstr.setUpInheritance("bool", Sk.builtin.bool, Sk.builtin.int_);

Sk.builtin.bool.prototype["$r"] = function () {
    if (this.v) {
        return new Sk.builtin.str("True");
    }
    return new Sk.builtin.str("False");
};

Sk.builtin.bool.prototype.tp$hash = function () {
    return new Sk.builtin.int_(this.v);
};

Sk.builtin.bool.prototype.__int__ = new Sk.builtin.func(function(self) {
    var v = Sk.builtin.asnum$(self);

    return new Sk.builtin.int_(v);
});

Sk.builtin.bool.prototype.__float__ = new Sk.builtin.func(function(self) {
    return new Sk.builtin.float_(Sk.ffi.remapToJs(self));
});

Sk.builtin.bool.prototype.__format__ = new Sk.builtin.func(function(self) {
    return self.$r();
});

Sk.builtin.bool.prototype.nb$and = function (other) {
    if (other.ob$type === Sk.builtin.bool) {
        return new Sk.builtin.bool(this.v & other.v);
    }
    return Sk.builtin.int_.prototype.nb$and.call(this, other);
};

Sk.builtin.bool.prototype.nb$or = function (other) {
    if (other.ob$type === Sk.builtin.bool) {
        return new Sk.builtin.bool(this.v | other.v);
    }
    return Sk.builtin.int_.prototype.nb$or.call(this, other);
};

Sk.builtin.bool.prototype.nb$xor = function (other) {
    if (other.ob$type === Sk.builtin.bool) {
        return new Sk.builtin.bool(this.v ^ other.v);
    }
    return Sk.builtin.int_.prototype.nb$xor.call(this, other);
};

Sk.builtin.bool.prototype.ob$eq = function (other) {
    return Sk.builtin.int_.prototype.ob$eq.call(this, other);
};
Sk.builtin.bool.prototype.ob$ne = function (other) {
    return Sk.builtin.int_.prototype.ob$ne.call(this, other);
};
Sk.builtin.bool.prototype.ob$lt = function (other) {
    return Sk.builtin.int_.prototype.ob$lt.call(this, other);
};
Sk.builtin.bool.prototype.ob$le = function (other) {
    return Sk.builtin.int_.prototype.ob$le.call(this, other);
};
Sk.builtin.bool.prototype.ob$gt = function (other) {
    return Sk.builtin.int_.prototype.ob$gt.call(this, other);
};
Sk.builtin.bool.prototype.ob$ge = function (other) {
    return Sk.builtin.int_.prototype.ob$ge.call(this, other);
};

Sk.exportSymbol("Sk.builtin.bool", Sk.builtin.bool);

/**
 * Python bool True constant.
 * @type {Sk.builtin.bool}
 * @member {Sk.builtin.bool}
 */
Sk.builtin.bool.true$ = /** @type {Sk.builtin.bool} */ (Object.create(Sk.builtin.bool.prototype, {
    v: { value: 1, enumerable: true },
}));

/**
 * Python bool False constant.
 * @type {Sk.builtin.bool}
 * @member {Sk.builtin.bool}
 */
Sk.builtin.bool.false$ = /** @type {Sk.builtin.bool} */ (Object.create(Sk.builtin.bool.prototype, {
    v: { value: 0, enumerable: true },
}));
