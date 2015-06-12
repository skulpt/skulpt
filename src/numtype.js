Sk.builtin.numtype = function () {

    Sk.builtin.numtype.prototype.tp$base.call(this);

};

Sk.abstr.setUpInheritance("NumericType", Sk.builtin.numtype, Sk.builtin.object);

Sk.builtin.numtype.prototype["__abs__"] = new Sk.builtin.func(function (self) {

    if (self.nb$abs === undefined) {
        throw new Sk.builtin.NotImplementedError("__abs__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__abs__", arguments, 0, 0, false, true);
    return self.nb$abs();

});

Sk.builtin.numtype.prototype["__neg__"] = new Sk.builtin.func(function (self) {

    if (self.nb$negative === undefined) {
        throw new Sk.builtin.NotImplementedError("__neg__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__neg__", arguments, 0, 0, false, true);
    return self.nb$negative();

});

Sk.builtin.numtype.prototype["__pos__"] = new Sk.builtin.func(function (self) {

    if (self.nb$positive === undefined) {
        throw new Sk.builtin.NotImplementedError("__pos__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__pos__", arguments, 0, 0, false, true);
    return self.nb$positive();

});

Sk.builtin.numtype.prototype["__int__"] = new Sk.builtin.func(function (self) {

    if (self.nb$int_ === undefined) {
        throw new Sk.builtin.NotImplementedError("__int__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__int__", arguments, 0, 0, false, true);
    return self.nb$int_();

});

Sk.builtin.numtype.prototype["__long__"] = new Sk.builtin.func(function (self) {

    if (self.nb$lng === undefined) {
        throw new Sk.builtin.NotImplementedError("__long__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__long__", arguments, 0, 0, false, true);
    return self.nb$lng();

});

Sk.builtin.numtype.prototype["__float__"] = new Sk.builtin.func(function (self) {

    if (self.nb$float_ === undefined) {
        throw new Sk.builtin.NotImplementedError("__float__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__float__", arguments, 0, 0, false, true);
    return self.nb$float_();

});

Sk.builtin.numtype.prototype["__add__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$add === undefined) {
        throw new Sk.builtin.NotImplementedError("__add__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__add__", arguments, 1, 1, false, true);
    return self.nb$add(other);

});

Sk.builtin.numtype.prototype["__radd__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_add === undefined) {
        throw new Sk.builtin.NotImplementedError("__radd__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__radd__", arguments, 1, 1, false, true);
    return self.nb$reflected_add(other);

});

Sk.builtin.numtype.prototype["__sub__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$subtract === undefined) {
        throw new Sk.builtin.NotImplementedError("__sub__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__sub__", arguments, 1, 1, false, true);
    return self.nb$subtract(other);

});

Sk.builtin.numtype.prototype["__rsub__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_subtract === undefined) {
        throw new Sk.builtin.NotImplementedError("__rsub__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rsub__", arguments, 1, 1, false, true);
    return self.nb$reflected_subtract(other);

});

Sk.builtin.numtype.prototype["__mul__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$multiply === undefined) {
        throw new Sk.builtin.NotImplementedError("__mul__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__mul__", arguments, 1, 1, false, true);
    return self.nb$multiply(other);

});

Sk.builtin.numtype.prototype["__rmul__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_multiply === undefined) {
        throw new Sk.builtin.NotImplementedError("__rmul__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rmul__", arguments, 1, 1, false, true);
    return self.nb$reflected_multiply(other);

});

Sk.builtin.numtype.prototype["__div__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__div__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__div__", arguments, 1, 1, false, true);
    return self.nb$divide(other);

});

Sk.builtin.numtype.prototype["__rdiv__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__rdiv__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rdiv__", arguments, 1, 1, false, true);
    return self.nb$reflected_divide(other);

});

Sk.builtin.numtype.prototype["__floordiv__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$floor_divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__floordiv__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__floordiv__", arguments, 1, 1, false, true);
    return self.nb$floor_divide(other);

});

Sk.builtin.numtype.prototype["__rfloordiv__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_floor_divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__rfloordiv__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rfloordiv__", arguments, 1, 1, false, true);
    return self.nb$reflected_floor_divide(other);

});

Sk.builtin.numtype.prototype["__mod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$remainder === undefined) {
        throw new Sk.builtin.NotImplementedError("__mod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__mod__", arguments, 1, 1, false, true);
    return self.nb$remainder(other);

});

Sk.builtin.numtype.prototype["__rmod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_remainder === undefined) {
        throw new Sk.builtin.NotImplementedError("__rmod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rmod__", arguments, 1, 1, false, true);
    return self.nb$reflected_remainder(other);

});

Sk.builtin.numtype.prototype["__divmod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$divmod === undefined) {
        throw new Sk.builtin.NotImplementedError("__divmod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__divmod__", arguments, 1, 1, false, true);
    return self.nb$divmod(other);

});

Sk.builtin.numtype.prototype["__rdivmod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_divmod === undefined) {
        throw new Sk.builtin.NotImplementedError("__rdivmod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rdivmod__", arguments, 1, 1, false, true);
    return self.nb$reflected_divmod(other);

});

Sk.builtin.numtype.prototype["__pow__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$power === undefined) {
        throw new Sk.builtin.NotImplementedError("__pow__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__pow__", arguments, 1, 1, false, true);
    return self.nb$power(other);

});

Sk.builtin.numtype.prototype["__rpow__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_power === undefined) {
        throw new Sk.builtin.NotImplementedError("__rpow__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rpow__", arguments, 1, 1, false, true);
    return self.nb$reflected_power(other);

});

Sk.builtin.numtype.prototype["__coerce__"] = new Sk.builtin.func(function (self, other) {

    throw new Sk.builtin.NotImplementedError("__coerce__ is not yet implemented");

});

Sk.abstr.registerPythonFunctions(Sk.builtin.numtype,
    ["__abs__", "__neg__", "__pos__", "__int__", "__long__", "__float__",
     "__add__", "__radd__", "__sub__", "__rsub__", "__mul__", "__rmul__",
     "__div__", "__rdiv__", "__floordiv__", "__rfloordiv__",
     "__mod__", "__rmod__", "__divmod__", "__rdivmod__", "__coerce__"]);


Sk.builtin.numtype.prototype.nb$reflected_add = function (other) {
    return this.nb$add(other);
};

Sk.builtin.numtype.prototype.nb$reflected_subtract = function (other) {
    var negative_this = this.nb$negative();
    return negative_this.nb$add(other);
};

Sk.builtin.numtype.prototype.nb$reflected_multiply = function (other) {
    return this.nb$multiply(other);
};
