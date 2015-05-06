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

/* doc string, needs to initialized later */
// Sk.builtin.bool.prototype.__doc__ = new Sk.builtin.str("bool(x) -> bool\n\nReturns True when the argument x is true, False otherwise.\nThe builtins True and False are the only two instances of the class bool.\nThe class bool is a subclass of the class int, and cannot be subclassed.");

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