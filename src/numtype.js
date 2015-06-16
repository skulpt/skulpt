/**
 * @constructor
 * Sk.builtin.numtype
 *
 * @description
 * Abstract class for Python numeric types.
 *
 * @extends {Sk.builtin.object}
 *
 * @return {undefined} Cannot instantiate a Sk.builtin.numtype object
 */
Sk.builtin.numtype = function () {

    Sk.abstr.setUpObject(this);

};

Sk.abstr.setUpInheritance("NumericType", Sk.builtin.numtype, Sk.builtin.object);

/**
 * Python wrapper of \_\_abs\_\_ method.
 *
 * @name  __abs__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__abs__"] = new Sk.builtin.func(function (self) {

    if (self.nb$abs === undefined) {
        throw new Sk.builtin.NotImplementedError("__abs__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__abs__", arguments, 0, 0, false, true);
    return self.nb$abs();

});

/**
 * Python wrapper of \_\_neg\_\_ method.
 *
 * @name  __neg__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__neg__"] = new Sk.builtin.func(function (self) {

    if (self.nb$negative === undefined) {
        throw new Sk.builtin.NotImplementedError("__neg__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__neg__", arguments, 0, 0, false, true);
    return self.nb$negative();

});

/**
 * Python wrapper of \_\_pos\_\_ method.
 *
 * @name  __pos__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__pos__"] = new Sk.builtin.func(function (self) {

    if (self.nb$positive === undefined) {
        throw new Sk.builtin.NotImplementedError("__pos__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__pos__", arguments, 0, 0, false, true);
    return self.nb$positive();

});

/**
 * Python wrapper of \_\_int\_\_ method.
 *
 * @name  __int__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__int__"] = new Sk.builtin.func(function (self) {

    if (self.nb$int_ === undefined) {
        throw new Sk.builtin.NotImplementedError("__int__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__int__", arguments, 0, 0, false, true);
    return self.nb$int_();

});

/**
 * Python wrapper of \_\_long\_\_ method.
 *
 * @name  __long__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__long__"] = new Sk.builtin.func(function (self) {

    if (self.nb$lng === undefined) {
        throw new Sk.builtin.NotImplementedError("__long__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__long__", arguments, 0, 0, false, true);
    return self.nb$lng();

});

/**
 * Python wrapper of \_\_float\_\_ method.
 *
 * @name  __float__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__float__"] = new Sk.builtin.func(function (self) {

    if (self.nb$float_ === undefined) {
        throw new Sk.builtin.NotImplementedError("__float__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__float__", arguments, 0, 0, false, true);
    return self.nb$float_();

});

/**
 * Python wrapper of \_\_add\_\_ method.
 *
 * @name  __add__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__add__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$add === undefined) {
        throw new Sk.builtin.NotImplementedError("__add__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__add__", arguments, 1, 1, false, true);
    return self.nb$add(other);

});

/**
 * Python wrapper of \_\_radd\_\_ method.
 *
 * @name  __radd__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__radd__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_add === undefined) {
        throw new Sk.builtin.NotImplementedError("__radd__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__radd__", arguments, 1, 1, false, true);
    return self.nb$reflected_add(other);

});

/**
 * Python wrapper of \_\_sub\_\_ method.
 *
 * @name  __sub__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__sub__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$subtract === undefined) {
        throw new Sk.builtin.NotImplementedError("__sub__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__sub__", arguments, 1, 1, false, true);
    return self.nb$subtract(other);

});

/**
 * Python wrapper of \_\_rsub\_\_ method.
 *
 * @name  __rsub__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rsub__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_subtract === undefined) {
        throw new Sk.builtin.NotImplementedError("__rsub__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rsub__", arguments, 1, 1, false, true);
    return self.nb$reflected_subtract(other);

});

/**
 * Python wrapper of \_\_mul\_\_ method.
 *
 * @name  __mul__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__mul__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$multiply === undefined) {
        throw new Sk.builtin.NotImplementedError("__mul__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__mul__", arguments, 1, 1, false, true);
    return self.nb$multiply(other);

});

/**
 * Python wrapper of \_\_rmul\_\_ method.
 *
 * @name  __rmul__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rmul__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_multiply === undefined) {
        throw new Sk.builtin.NotImplementedError("__rmul__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rmul__", arguments, 1, 1, false, true);
    return self.nb$reflected_multiply(other);

});

/**
 * Python wrapper of \_\_div\_\_ method.
 *
 * @name  __div__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__div__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__div__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__div__", arguments, 1, 1, false, true);
    return self.nb$divide(other);

});

/**
 * Python wrapper of \_\_rdiv\_\_ method.
 *
 * @name  __rdiv__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rdiv__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__rdiv__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rdiv__", arguments, 1, 1, false, true);
    return self.nb$reflected_divide(other);

});

/**
 * Python wrapper of \_\_floordiv\_\_ method.
 *
 * @name  __floordiv__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__floordiv__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$floor_divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__floordiv__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__floordiv__", arguments, 1, 1, false, true);
    return self.nb$floor_divide(other);

});

/**
 * Python wrapper of \_\_rfloordiv\_\_ method.
 *
 * @name  __rfloordiv__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rfloordiv__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_floor_divide === undefined) {
        throw new Sk.builtin.NotImplementedError("__rfloordiv__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rfloordiv__", arguments, 1, 1, false, true);
    return self.nb$reflected_floor_divide(other);

});

/**
 * Python wrapper of \_\_mod\_\_ method.
 *
 * @name  __mod__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__mod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$remainder === undefined) {
        throw new Sk.builtin.NotImplementedError("__mod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__mod__", arguments, 1, 1, false, true);
    return self.nb$remainder(other);

});

/**
 * Python wrapper of \_\_rmod\_\_ method.
 *
 * @name  __rmod__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rmod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_remainder === undefined) {
        throw new Sk.builtin.NotImplementedError("__rmod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rmod__", arguments, 1, 1, false, true);
    return self.nb$reflected_remainder(other);

});

/**
 * Python wrapper of \_\_divmod\_\_ method.
 *
 * @name  __divmod__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__divmod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$divmod === undefined) {
        throw new Sk.builtin.NotImplementedError("__divmod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__divmod__", arguments, 1, 1, false, true);
    return self.nb$divmod(other);

});

/**
 * Python wrapper of \_\_rdivmod\_\_ method.
 *
 * @name  __rdivmod__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rdivmod__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_divmod === undefined) {
        throw new Sk.builtin.NotImplementedError("__rdivmod__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rdivmod__", arguments, 1, 1, false, true);
    return self.nb$reflected_divmod(other);

});

/**
 * Python wrapper of \_\_pow\_\_ method.
 *
 * @name  __pow__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__pow__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$power === undefined) {
        throw new Sk.builtin.NotImplementedError("__pow__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__pow__", arguments, 1, 1, false, true);
    return self.nb$power(other);

});

/**
 * Python wrapper of \_\_rpow\_\_ method.
 *
 * @name  __rpow__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__rpow__"] = new Sk.builtin.func(function (self, other) {

    if (self.nb$reflected_power === undefined) {
        throw new Sk.builtin.NotImplementedError("__rpow__ is not yet implemented");
    }

    Sk.builtin.pyCheckArgs("__rpow__", arguments, 1, 1, false, true);
    return self.nb$reflected_power(other);

});

/**
 * Python wrapper of \_\_coerce\_\_ method.
 *
 * @name  __coerce__
 * @instance
 * @memberOf Sk.builtin.numtype.prototype
 */
Sk.builtin.numtype.prototype["__coerce__"] = new Sk.builtin.func(function (self, other) {

    throw new Sk.builtin.NotImplementedError("__coerce__ is not yet implemented");

});

Sk.abstr.registerPythonFunctions(Sk.builtin.numtype,
    ["__abs__", "__neg__", "__pos__", "__int__", "__long__", "__float__",
     "__add__", "__radd__", "__sub__", "__rsub__", "__mul__", "__rmul__",
     "__div__", "__rdiv__", "__floordiv__", "__rfloordiv__",
     "__mod__", "__rmod__", "__divmod__", "__rdivmod__", "__coerce__"]);

/**
 * Add a Python object to this instance and return the result (i.e. this + other).
 *
 * Returns NotImplemented if addition between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to add.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the addition.
 */
Sk.builtin.numtype.prototype.nb$add = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_add = function (other) {
    return this.nb$add(other);
};

Sk.builtin.numtype.prototype.nb$inplace_add = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Subtract a Python object from this instance and return the result (i.e. this - other).
 *
 * Returns NotImplemented if subtraction between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The Python object to subtract.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the subtraction.
 */
Sk.builtin.numtype.prototype.nb$subtract = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_subtract = function (other) {
    var negative_this = this.nb$negative();
    return negative_this.nb$add(other);
};

Sk.builtin.numtype.prototype.nb$inplace_subtract = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Multiply this instance by a Python object and return the result (i.e. this * other).
 *
 * Returns NotImplemented if multiplication between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The multiplier, which must be a Python object.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the multiplication
 */
Sk.builtin.numtype.prototype.nb$multiply = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};


Sk.builtin.numtype.prototype.nb$reflected_multiply = function (other) {
    return this.nb$multiply(other);
};

Sk.builtin.numtype.prototype.nb$inplace_multiply = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Divide this instance by a Python object and return the result (i.e this / other).
 *
 * Returns NotImplemented if division between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The divisor, which must be a Python object.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the division
 */
Sk.builtin.numtype.prototype.nb$divide = function (other) {
    return this.nb$floor_divide(other);
};

Sk.builtin.numtype.prototype.nb$reflected_divide = function (other) {
    return this.nb$reflected_floor_divide(other);
};

Sk.builtin.numtype.prototype.nb$inplace_divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Floor divide this instance by a Python object and return the result (i.e. this // other).
 *
 * Returns NotImplemented if floor division between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The divisor, which must be a Python object.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the floor division
 */
Sk.builtin.numtype.prototype.nb$floor_divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_floor_divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_floor_divide = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Modulo this instance by a Python object and return the result (i.e. this % other).
 *
 * Returns NotImplemented if modulation between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The divisor, which must be a Python object.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the modulation
 */
Sk.builtin.numtype.prototype.nb$remainder = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_remainder = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_remainder = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the quotient and the remainder of this instance and a given Python object and return the result.
 *
 * Returns NotImplemented if division or modulo operations between this type and other type are unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The divisor, which must be a Python object.
 * @return {(Sk.builtin.tuple|Sk.builtin.NotImplemented)} The result of the operation.
 * If both operations are supported, a Python tuple containing (quotient, remainder) in that order.
 */
Sk.builtin.numtype.prototype.nb$divmod = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_divmod = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Raise this instance by a Python object, optionally modulo the exponent, and return the final result.
 *
 * If mod is undefined, return this \*\* other. Else, return (this \*\* other) % mod.
 *
 * Returns NotImplemented if exponentiation or modulation between this type and other type is unsupported.
 *
 * Javscript function, returns Python object.
 *
 * @param  {!Sk.builtin.object} other The exponent, which must be a Python object.
 * @param  {!Sk.builtin.object=} mod The optional divisor, which must be a Python object if defined.
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The result of the exponentiation.
 */
Sk.builtin.numtype.prototype.nb$power = function (other, mod) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$reflected_power = function (other, mod) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

Sk.builtin.numtype.prototype.nb$inplace_power = function (other) {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the absolute value of this instance and return.
 *
 * Javascript function, returns Python object.
 *
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} The absolute value
 */
Sk.builtin.numtype.prototype.nb$abs = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the unary negative of this instance (i.e. -this).
 *
 * Javscript function, returns Python object.
 *
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} A copy of this instance with the value negated
 */
Sk.builtin.numtype.prototype.nb$negative = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Compute the unary positive of this instance (i.e. +this).
 *
 * Javscript function, returns Python object.
 *
 * @return {(Sk.builtin.numtype|Sk.builtin.NotImplemented)} A copy of this instance with the value unchanged
 */
Sk.builtin.numtype.prototype.nb$positive = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is nonzero.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this instance is not equal to zero, false otherwise
 */
Sk.builtin.numtype.prototype.nb$nonzero = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is negative.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this instance is negative, false otherwise
 */
Sk.builtin.numtype.prototype.nb$isnegative = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};

/**
 * Determine if this instance is positive.
 *
 * Javscript function, returns Javascript object or Sk.builtin.NotImplemented.
 *
 * @return {(boolean|Sk.builtin.NotImplemented)} true if this instance is positive, false otherwise
 */
Sk.builtin.numtype.prototype.nb$ispositive = function () {
    return Sk.builtin.NotImplemented.NotImplemented$;
};
