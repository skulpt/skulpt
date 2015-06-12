Sk.builtin.bool = function (x) {
    Sk.builtin.pyCheckArgs("bool", arguments, 1);
    if (Sk.misceval.isTrue(x)) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.bool.false$;
    }
};

Sk.builtin.bool.prototype.tp$name = "bool";
Sk.builtin.bool.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("bool", Sk.builtin.bool);

Sk.builtin.bool.prototype["$r"] = function () {
    if (this.v) {
        return new Sk.builtin.str("True");
    }
    return new Sk.builtin.str("False");
};

Sk.builtin.bool.prototype.__int__ = new Sk.builtin.func(function(self) {
    var v = Sk.builtin.asnum$(self);

    return new Sk.builtin.int_(v);
});

Sk.builtin.bool.prototype.__float__ = new Sk.builtin.func(function(self) {
    return new Sk.builtin.float_(Sk.ffi.remapToJs(self));
});

goog.exportSymbol("Sk.builtin.bool", Sk.builtin.bool);
