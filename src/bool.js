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
 * @extends {Sk.builtin.object}
 * 
 * @param  {(Object|number|boolean)} x Value to evaluate as true or false
 * @return {Sk.builtin.bool} Sk.builtin.bool.true$ if x is true, Sk.builtin.bool.false$ otherwise
 */
Sk.builtin.bool = function (x) {
    if (Sk.misceval.isTrue(x)) {
        return Sk.builtin.bool.true$;
    } else {
        return Sk.builtin.bool.false$;
    }
};

Sk.abstr.setUpInheritance("bool", Sk.builtin.bool, Sk.builtin.int_);

Sk.builtin.bool.sk$acceptable_as_base_class = false;

Sk.builtin.bool.prototype.tp$doc = "bool(x) -> bool\n\nReturns True when the argument x is true, False otherwise.\nThe builtins True and False are the only two instances of the class bool.\nThe class bool is a subclass of the class int, and cannot be subclassed."

Sk.builtin.bool.prototype.tp$new = function (args, kwargs) {
    if (kwargs && kwargs.length) {
        throw new Sk.builtin.TypeError("bool() takes no keyword arguments");
    } else if (args && args.length > 1) {
        throw new Sk.builtin.TypeError("bool expected at most 1 arguments, got "+ args.length);
    }
    return Sk.builtin.bool(args[0]);
};

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

Sk.exportSymbol("Sk.builtin.bool", Sk.builtin.bool);
