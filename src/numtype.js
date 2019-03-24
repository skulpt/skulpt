import { setUpInheritance } from './abstract';
import { pyCheckArgs, func } from './function';
import { object, NotImplemented } from './object';
import { ExternalError } from './errors';
import { NotImplementedError } from './object';

export class numtype extends object {
    /**
     * @constructor
     * numtype
     *
     * @description
     * Abstract class for Python numeric types.
     *
     * @extends {object}
     *
     * @return {undefined} Cannot instantiate a numtype object
     */
    constructor() {
        throw new ExternalError("Cannot instantiate abstract numtype class");
    }

    /**
     * Python wrapper of `__abs__` method.
     *
     * @name  __abs__
     * @instance
     * @memberOf numtype.prototype
     */
    __abs__ = new func(function (self) {

        if (self.nb$abs === undefined) {
            throw new NotImplementedError("__abs__ is not yet implemented");
        }

        pyCheckArgs("__abs__", arguments, 0, 0, false, true);
        return self.nb$abs();

    });

    /**
     * Python wrapper of `__neg__` method.
     *
     * @name  __neg__
     * @instance
     * @memberOf numtype.prototype
     */
    __neg__ = new func(function (self) {

        if (self.nb$negative === undefined) {
            throw new NotImplementedError("__neg__ is not yet implemented");
        }

        pyCheckArgs("__neg__", arguments, 0, 0, false, true);
        return self.nb$negative();

    });

    /**
     * Python wrapper of `__pos__` method.
     *
     * @name  __pos__
     * @instance
     * @memberOf numtype.prototype
     */
    __pos__ = new func(function (self) {

        if (self.nb$positive === undefined) {
            throw new NotImplementedError("__pos__ is not yet implemented");
        }

        pyCheckArgs("__pos__", arguments, 0, 0, false, true);
        return self.nb$positive();

    });

    /**
     * Python wrapper of `__int__` method.
     *
     * @name  __int__
     * @instance
     * @memberOf numtype.prototype
     */
    __int__ = new func(function (self) {

        if (self.nb$int_ === undefined) {
            throw new NotImplementedError("__int__ is not yet implemented");
        }

        pyCheckArgs("__int__", arguments, 0, 0, false, true);
        return self.nb$int_();

    });

    /**
     * Python wrapper of `__long__` method.
     *
     * @name  __long__
     * @instance
     * @memberOf numtype.prototype
     */
    __long__ = new func(function (self) {

        if (self.nb$lng === undefined) {
            throw new NotImplementedError("__long__ is not yet implemented");
        }

        pyCheckArgs("__long__", arguments, 0, 0, false, true);
        return self.nb$lng();

    });

    /**
     * Python wrapper of `__float__` method.
     *
     * @name  __float__
     * @instance
     * @memberOf numtype.prototype
     */
    __float__ = new func(function (self) {

        if (self.nb$float_ === undefined) {
            throw new NotImplementedError("__float__ is not yet implemented");
        }

        pyCheckArgs("__float__", arguments, 0, 0, false, true);
        return self.nb$float_();

    });

    /**
     * Python wrapper of `__add__` method.
     *
     * @name  __add__
     * @instance
     * @memberOf numtype.prototype
     */
    __add__ = new func(function (self, other) {

        if (self.nb$add === undefined) {
            throw new NotImplementedError("__add__ is not yet implemented");
        }

        pyCheckArgs("__add__", arguments, 1, 1, false, true);
        return self.nb$add(other);

    });

    /**
     * Python wrapper of `__radd__` method.
     *
     * @name  __radd__
     * @instance
     * @memberOf numtype.prototype
     */
    __radd__ = new func(function (self, other) {

        if (self.nb$reflected_add === undefined) {
            throw new NotImplementedError("__radd__ is not yet implemented");
        }

        pyCheckArgs("__radd__", arguments, 1, 1, false, true);
        return self.nb$reflected_add(other);

    });

    /**
     * Python wrapper of `__abs__` method.
     *
     * @name  __abs__
     * @instance
     * @memberOf numtype.prototype
     */
    __abs__ = new func(function (self) {

        if (self.nb$abs === undefined) {
            throw new NotImplementedError("__abs__ is not yet implemented");
        }

        pyCheckArgs("__abs__", arguments, 0, 0, false, true);
        return self.nb$abs();

    });

    /**
     * Python wrapper of `__neg__` method.
     *
     * @name  __neg__
     * @instance
     * @memberOf mumtype.prototype
     */
    __neg__ = new func(function (self) {

        if (self.nb$negative === undefined) {
            throw new NotImplementedError("__neg__ is not yet implemented");
        }

        pyCheckArgs("__neg__", arguments, 0, 0, false, true);
        return self.nb$negative();

    });

    /**
     * Python wrapper of `__pos__` method.
     *
     * @name  __pos__
     * @instance
     * @memberOf mumtype.prototype
     */
    __pos__ = new func(function (self) {

        if (self.nb$positive === undefined) {
            throw new NotImplementedError("__pos__ is not yet implemented");
        }

        pyCheckArgs("__pos__", arguments, 0, 0, false, true);
        return self.nb$positive();

    });

    /**
     * Python wrapper of `__int__` method.
     *
     * @name  __int__
     * @instance
     * @memberOf mumtype.prototype
     */
    __int__ = new func(function (self) {

        if (self.nb$int_ === undefined) {
            throw new NotImplementedError("__int__ is not yet implemented");
        }

        pyCheckArgs("__int__", arguments, 0, 0, false, true);
        return self.nb$int_();

    });

    /**
     * Python wrapper of `__long__` method.
     *
     * @name  __long__
     * @instance
     * @memberOf mumtype.prototype
     */
    __long__ = new func(function (self) {

        if (self.nb$lng === undefined) {
            throw new NotImplementedError("__long__ is not yet implemented");
        }

        pyCheckArgs("__long__", arguments, 0, 0, false, true);
        return self.nb$lng();

    });

    /**
     * Python wrapper of `__float__` method.
     *
     * @name  __float__
     * @instance
     * @memberOf mumtype.prototype
     */
    __float__ = new func(function (self) {

        if (self.nb$float_ === undefined) {
            throw new NotImplementedError("__float__ is not yet implemented");
        }

        pyCheckArgs("__float__", arguments, 0, 0, false, true);
        return self.nb$float_();

    });

    /**
     * Python wrapper of `__add__` method.
     *
     * @name  __add__
     * @instance
     * @memberOf mumtype.prototype
     */
    __add__ = new func(function (self, other) {

        if (self.nb$add === undefined) {
            throw new NotImplementedError("__add__ is not yet implemented");
        }

        pyCheckArgs("__add__", arguments, 1, 1, false, true);
        return self.nb$add(other);

    });

    /**
     * Python wrapper of `__radd__` method.
     *
     * @name  __radd__
     * @instance
     * @memberOf mumtype.prototype
     */
    __radd__ = new func(function (self, other) {

        if (self.nb$reflected_add === undefined) {
            throw new NotImplementedError("__radd__ is not yet implemented");
        }

        pyCheckArgs("__radd__", arguments, 1, 1, false, true);
        return self.nb$reflected_add(other);

    });

    /**
     * Python wrapper of `__sub__` method.
     *
     * @name  __sub__
     * @instance
     * @memberOf mumtype.prototype
     */
    __sub__ = new func(function (self, other) {

        if (self.nb$subtract === undefined) {
            throw new NotImplementedError("__sub__ is not yet implemented");
        }

        pyCheckArgs("__sub__", arguments, 1, 1, false, true);
        return self.nb$subtract(other);

    });

    /**
     * Python wrapper of `__rsub__` method.
     *
     * @name  __rsub__
     * @instance
     * @memberOf mumtype.prototype
     */
    __rsub__ = new func(function (self, other) {

        if (self.nb$reflected_subtract === undefined) {
            throw new NotImplementedError("__rsub__ is not yet implemented");
        }

        pyCheckArgs("__rsub__", arguments, 1, 1, false, true);
        return self.nb$reflected_subtract(other);

    });

    /**
     * Python wrapper of `__mul__` method.
     *
     * @name  __mul__
     * @instance
     * @memberOf mumtype.prototype
     */
    __mul__ = new func(function (self, other) {

        if (self.nb$multiply === undefined) {
            throw new NotImplementedError("__mul__ is not yet implemented");
        }

        pyCheckArgs("__mul__", arguments, 1, 1, false, true);
        return self.nb$multiply(other);

    });

    /**
     * Python wrapper of `__rmul__` method.
     *
     * @name  __rmul__
     * @instance
     * @memberOf mumtype.prototype
     */
    __rmul__ = new func(function (self, other) {

        if (self.nb$reflected_multiply === undefined) {
            throw new NotImplementedError("__rmul__ is not yet implemented");
        }

        pyCheckArgs("__rmul__", arguments, 1, 1, false, true);
        return self.nb$reflected_multiply(other);

    });

    /**
     * Python wrapper of `__div__` method.
     *
     * @name  __div__
     * @instance
     * @memberOf mumtype.prototype
     */
    __div__ = new func(function (self, other) {

        if (self.nb$divide === undefined) {
            throw new NotImplementedError("__div__ is not yet implemented");
        }

        pyCheckArgs("__div__", arguments, 1, 1, false, true);
        return self.nb$divide(other);

    });

    /**
     * Python wrapper of `__rdiv__` method.
     *
     * @name  __rdiv__
     * @instance
     * @memberOf mumtype.prototype
     */
    __rdiv__ = new func(function (self, other) {

        if (self.nb$reflected_divide === undefined) {
            throw new NotImplementedError("__rdiv__ is not yet implemented");
        }

        pyCheckArgs("__rdiv__", arguments, 1, 1, false, true);
        return self.nb$reflected_divide(other);

    });

    /**
     * Python wrapper of `__floordiv__` method.
     *
     * @name  __floordiv__
     * @instance
     * @memberOf mumtype.prototype
     */
    __floordiv__ = new func(function (self, other) {

        if (self.nb$floor_divide === undefined) {
            throw new NotImplementedError("__floordiv__ is not yet implemented");
        }

        pyCheckArgs("__floordiv__", arguments, 1, 1, false, true);
        return self.nb$floor_divide(other);

    });

    /**
     * Python wrapper of `__rfloordiv__` method.
     *
     * @name  __rfloordiv__
     * @instance
     * @memberOf mumtype.prototype
     */
    __rfloordiv__ = new func(function (self, other) {

        if (self.nb$reflected_floor_divide === undefined) {
            throw new NotImplementedError("__rfloordiv__ is not yet implemented");
        }

        pyCheckArgs("__rfloordiv__", arguments, 1, 1, false, true);
        return self.nb$reflected_floor_divide(other);

    });

    /**
     * Python wrapper of `__mod__` method.
     *
     * @name  __mod__
     * @instance
     * @memberOf mumtype.prototype
     */
    __mod__ = new func(function (self, other) {

        if (self.nb$remainder === undefined) {
            throw new NotImplementedError("__mod__ is not yet implemented");
        }

        pyCheckArgs("__mod__", arguments, 1, 1, false, true);
        return self.nb$remainder(other);

    });

    /**
     * Python wrapper of `__rmod__` method.
     *
     * @name  __rmod__
     * @instance
     * @memberOf mumtype.prototype
     */
    __rmod__ = new func(function (self, other) {

        if (self.nb$reflected_remainder === undefined) {
            throw new NotImplementedError("__rmod__ is not yet implemented");
        }

        pyCheckArgs("__rmod__", arguments, 1, 1, false, true);
        return self.nb$reflected_remainder(other);

    });

    /**
     * Python wrapper of `__divmod__` method.
     *
     * @name  __divmod__
     * @instance
     * @memberOf mumtype.prototype
     */
    __divmod__ = new func(function (self, other) {

        if (self.nb$divmod === undefined) {
            throw new NotImplementedError("__divmod__ is not yet implemented");
        }

        pyCheckArgs("__divmod__", arguments, 1, 1, false, true);
        return self.nb$divmod(other);

    });

    /**
     * Python wrapper of `__rdivmod__` method.
     *
     * @name  __rdivmod__
     * @instance
     * @memberOf mumtype.prototype
     */
    __rdivmod__ = new func(function (self, other) {

        if (self.nb$reflected_divmod === undefined) {
            throw new NotImplementedError("__rdivmod__ is not yet implemented");
        }

        pyCheckArgs("__rdivmod__", arguments, 1, 1, false, true);
        return self.nb$reflected_divmod(other);

    });

    /**
     * Python wrapper of `__pow__` method.
     *
     * @name  __pow__
     * @instance
     * @memberOf mumtype.prototype
     */
    __pow__ = new func(function (self, other) {

        if (self.nb$power === undefined) {
            throw new NotImplementedError("__pow__ is not yet implemented");
        }

        pyCheckArgs("__pow__", arguments, 1, 1, false, true);
        return self.nb$power(other);

    });

    /**
     * Python wrapper of `__rpow__` method.
     *
     * @name  __rpow__
     * @instance
     * @memberOf mumtype.prototype
     */
    __rpow__ = new func(function (self, other) {

        if (self.nb$reflected_power === undefined) {
            throw new NotImplementedError("__rpow__ is not yet implemented");
        }

        pyCheckArgs("__rpow__", arguments, 1, 1, false, true);
        return self.nb$reflected_power(other);

    });

    /**
     * Python wrapper of `__coerce__` method.
     *
     * @name  __coerce__
     * @instance
     * @memberOf mumtype.prototype
     */
    __coerce__ = new func(function (self, other) {

        throw new NotImplementedError("__coerce__ is not yet implemented");

    });

    /**
     * Add a Python object to this instance and return the result (i.e. this + other).
     *
     * Returns NotImplemented if addition between this type and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object to add.
     * @return {(mumtype|NotImplemented)} The result of the addition.
     */
    nb$add(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$reflected_add(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$inplace_add(other) {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Subtract a Python object from this instance and return the result (i.e. this - other).
     *
     * Returns NotImplemented if subtraction between this type and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The Python object to subtract.
     * @return {(mumtype|NotImplemented)} The result of the subtraction.
     */
    nb$subtract(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$reflected_subtract(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$inplace_subtract(other) {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Multiply this instance by a Python object and return the result (i.e. this * other).
     *
     * Returns NotImplemented if multiplication between this type and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The multiplier, which must be a Python object.
     * @return {(mumtype|NotImplemented)} The result of the multiplication
     */
    nb$multiply(other) {
        return NotImplemented.NotImplemented$;
    }


    nb$reflected_multiply(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$inplace_multiply(other) {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Divide this instance by a Python object and return the result (i.e this / other).
     *
     * Returns NotImplemented if division between this type and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The divisor, which must be a Python object.
     * @return {(mumtype|NotImplemented)} The result of the division
     */
    nb$divide(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$reflected_divide(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$inplace_divide(other) {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Floor divide this instance by a Python object and return the result (i.e. this // other).
     *
     * Returns NotImplemented if floor division between this type and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The divisor, which must be a Python object.
     * @return {(mumtype|NotImplemented)} The result of the floor division
     */
    nb$floor_divide(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$reflected_floor_divide(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$inplace_floor_divide(other) {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Modulo this instance by a Python object and return the result (i.e. this % other).
     *
     * Returns NotImplemented if modulation between this type and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The divisor, which must be a Python object.
     * @return {(mumtype|NotImplemented)} The result of the modulation
     */
    nb$remainder(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$reflected_remainder(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$inplace_remainder(other) {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Compute the quotient and the remainder of this instance and a given Python object and return the result.
     *
     * Returns NotImplemented if division or modulo operations between this type and other type are unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The divisor, which must be a Python object.
     * @return {(tuple|NotImplemented)} The result of the operation.
     * If both operations are supported, a Python tuple containing (quotient, remainder) in that order.
     */
    nb$divmod(other) {
        return NotImplemented.NotImplemented$;
    }

    nb$reflected_divmod(other) {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Raise this instance by a Python object, optionally modulo the exponent, and return the final result.
     *
     * If mod is undefined, return this \*\* other. Else, return (this \*\* other) % mod.
     *
     * Returns NotImplemented if exponentiation or modulation between this type and other type is unsupported.
     *
     * Javscript function, returns Python object.
     *
     * @param  {!object} other The exponent, which must be a Python object.
     * @param  {!object=} mod The optional divisor, which must be a Python object if defined.
     * @return {(mumtype|NotImplemented)} The result of the exponentiation.
     */
    nb$power(other, mod) {
        return NotImplemented.NotImplemented$;
    }

    nb$reflected_power(other, mod) {
        return NotImplemented.NotImplemented$;
    }

    nb$inplace_power(other) {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Compute the absolute value of this instance and return.
     *
     * Javascript function, returns Python object.
     *
     * @return {(mumtype|NotImplemented)} The absolute value
     */
    nb$abs() {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Compute the unary negative of this instance (i.e. -this).
     *
     * Javscript function, returns Python object.
     *
     * @return {(mumtype|NotImplemented)} A copy of this instance with the value negated
     */
    nb$negative() {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Compute the unary positive of this instance (i.e. +this).
     *
     * Javscript function, returns Python object.
     *
     * @return {(mumtype|NotImplemented)} A copy of this instance with the value unchanged
     */
    nb$positive() {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Determine if this instance is nonzero.
     *
     * Javscript function, returns Javascript object or NotImplemented.
     *
     * @return {(boolean|NotImplemented)} true if this instance is not equal to zero, false otherwise
     */
    nb$nonzero() {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Determine if this instance is negative.
     *
     * Javscript function, returns Javascript object or NotImplemented.
     *
     * @return {(boolean|NotImplemented)} true if this instance is negative, false otherwise
     */
    nb$isnegative() {
        return NotImplemented.NotImplemented$;
    }

    /**
     * Determine if this instance is positive.
     *
     * Javscript function, returns Javascript object or NotImplemented.
     *
     * @return {(boolean|NotImplemented)} true if this instance is positive, false otherwise
     */
    nb$ispositive() {
        return NotImplemented.NotImplemented$;
    }
}

setUpInheritance("NumericType", numtype, object);

numtype.ct = true;



