Sk.builtin.bool = function (x) {
    Sk.builtin.pyCheckArgs("bool", arguments, 1);
    if (Sk.misceval.isTrue(x)) {
        return Sk.builtin.bool.true$;
    }
    else {
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

    return new Sk.builtin.nmber(v, Sk.builtin.nmber.int$);
});

Sk.builtin.bool.prototype.__float__ = new Sk.builtin.func(function(self) {
    return new Sk.builtin.nmber(Sk.ffi.remapToJs(self), Sk.builtin.nmber.float$);
});

Sk.builtin.bool.true$ = Object.create(Sk.builtin.bool.prototype, {v: {value: true, enumerable: true}});
Sk.builtin.bool.false$ = Object.create(Sk.builtin.bool.prototype, {v: {value: false, enumerable: true}});

goog.exportSymbol("Sk.builtin.bool", Sk.builtin.bool);