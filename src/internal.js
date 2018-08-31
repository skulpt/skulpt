if (!Sk.internal) {
    Sk.internal = {};
}

/**
 * builtins are supposed to come from the __builtin__ module, but we don't do
 * that yet.
 * todo; these should all be func objects too, otherwise str() of them won't
 * work, etc.
 */

Sk.internal.asnum$ = function (a) {
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (a instanceof Sk.builtin.none) {
        return null;
    }
    if (a instanceof Sk.builtin.bool) {
        if (a.v) {
            return 1;
        }
        return 0;
    }
    if (typeof a === "number") {
        return a;
    }
    if (typeof a === "string") {
        return a;
    }
    if (a instanceof Sk.builtin.int_) {
        return a.v;
    }
    if (a instanceof Sk.builtin.float_) {
        return a.v;
    }
    if (a instanceof Sk.builtin.lng) {
        if (a.cantBeInt()) {
            return a.str$(10, true);
        }
        return a.toInt$();
    }
    if (a.constructor === Sk.builtin.biginteger) {
        if ((a.trueCompare(new Sk.builtin.biginteger(Sk.builtin.int_.threshold$)) > 0) ||
            (a.trueCompare(new Sk.builtin.biginteger(-Sk.builtin.int_.threshold$)) < 0)) {
            return a.toString();
        }
        return a.intValue();
    }

    return a;
};

goog.exportSymbol("Sk.internal.asnum$", Sk.internal.asnum$);

/**
 * Return a Python number (either float or int) from a Javascript number.
 *
 * Javacsript function, returns Python object.
 *
 * @param  {number} a Javascript number to transform into Python number.
 * @return {(Sk.builtin.int_|Sk.builtin.float_)} A Python number.
 */
Sk.builtin.assk$ = function (a) {
    if (a % 1 === 0) {
        return new Sk.builtin.int_(a);
    } else {
        return new Sk.builtin.float_(a);
    }
};
goog.exportSymbol("Sk.builtin.assk$", Sk.builtin.assk$);

Sk.internal.asnum$nofloat = function (a) {
    var decimal;
    var mantissa;
    var expon;
    if (a === undefined) {
        return a;
    }
    if (a === null) {
        return a;
    }
    if (a.constructor === Sk.builtin.none) {
        return null;
    }
    if (a.constructor === Sk.builtin.bool) {
        if (a.v) {
            return 1;
        }
        return 0;
    }
    if (typeof a === "number") {
        a = a.toString();
    }
    if (a.constructor === Sk.builtin.int_) {
        a = a.v.toString();
    }
    if (a.constructor === Sk.builtin.float_) {
        a = a.v.toString();
    }
    if (a.constructor === Sk.builtin.lng) {
        a = a.str$(10, true);
    }
    if (a.constructor === Sk.builtin.biginteger) {
        a = a.toString();
    }

    //  Sk.debugout("INITIAL: " + a);

    //  If not a float, great, just return this
    if (a.indexOf(".") < 0 && a.indexOf("e") < 0 && a.indexOf("E") < 0) {
        return a;
    }

    expon = 0;

    if (a.indexOf("e") >= 0) {
        mantissa = a.substr(0, a.indexOf("e"));
        expon = a.substr(a.indexOf("e") + 1);
    } else if (a.indexOf("E") >= 0) {
        mantissa = a.substr(0, a.indexOf("e"));
        expon = a.substr(a.indexOf("E") + 1);
    } else {
        mantissa = a;
    }

    expon = parseInt(expon, 10);

    decimal = mantissa.indexOf(".");

    //  Simplest case, no decimal
    if (decimal < 0) {
        if (expon >= 0) {
            // Just add more zeroes and we're done
            while (expon-- > 0) {
                mantissa += "0";
            }
            return mantissa;
        } else {
            if (mantissa.length > -expon) {
                return mantissa.substr(0, mantissa.length + expon);
            } else {
                return 0;
            }
        }
    }

    //  Negative exponent OR decimal (neg or pos exp)
    if (decimal === 0) {
        mantissa = mantissa.substr(1);
    } else if (decimal < mantissa.length) {
        mantissa = mantissa.substr(0, decimal) + mantissa.substr(decimal + 1);
    } else {
        mantissa = mantissa.substr(0, decimal);
    }

    decimal = decimal + expon;
    while (decimal > mantissa.length) {
        mantissa += "0";
    }

    if (decimal <= 0) {
        mantissa = 0;
    } else {
        mantissa = mantissa.substr(0, decimal);
    }

    return mantissa;
};
goog.exportSymbol("Sk.internal.asnum$nofloat", Sk.internal.asnum$nofloat);

Sk.internal.hash = function hash (value) {
    var junk;
    Sk.builtin.pyCheckArgs("hash", arguments, 1, 1);

    // Useless object to get compiler to allow check for __hash__ property
    junk = {__hash__: function () {
        return 0;
    }};

    if (value instanceof Object) {
        if (Sk.builtin.checkNone(value.tp$hash)) {
            // python sets the hash function to None , so we have to catch this case here
            throw new Sk.builtin.TypeError(new Sk.builtin.str("unhashable type: '" + Sk.abstr.typeName(value) + "'"));
        } else if (value.tp$hash !== undefined) {
            if (value.$savedHash_) {
                return value.$savedHash_;
            }
            value.$savedHash_ = value.tp$hash();
            return value.$savedHash_;
        } else {
            if (value.__hash === undefined) {
                Sk.internal.hashCount += 1;
                value.__hash = Sk.internal.hashCount;
            }
            return new Sk.builtin.int_(value.__hash);
        }
    } else if (typeof value === "number" || value === null ||
        value === true || value === false) {
        throw new Sk.builtin.TypeError("unsupported Javascript type");
    }

    return new Sk.builtin.str((typeof value) + " " + String(value));
    // todo; throw properly for unhashable types
};
goog.exportSymbol("Sk.internal.hash", Sk.internal.hash);

Sk.internal.isinstance = function isinstance (obj, type) {
    var issubclass;
    var i;
    Sk.builtin.pyCheckArgs("isinstance", arguments, 2, 2);
    if (!Sk.builtin.checkClass(type) && !(type instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("isinstance() arg 2 must be a class, type, or tuple of classes and types");
    }

    if (type === Sk.builtin.none.prototype.ob$type) {
        if (obj instanceof Sk.builtin.none) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    }

    // Normal case
    if (obj.ob$type === type) {
        return Sk.builtin.bool.true$;
    }

    // Handle tuple type argument
    if (type instanceof Sk.builtin.tuple) {
        for (i = 0; i < type.v.length; ++i) {
            if (Sk.misceval.isTrue(Sk.internal.isinstance(obj, type.v[i]))) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    }

    // Check for Javascript inheritance
    if (obj instanceof type) {
        return Sk.builtin.bool.true$;
    }


    issubclass = function (klass, base) {
        var i;
        var bases;
        if (klass === base) {
            return Sk.builtin.bool.true$;
        }
        if (klass["$d"] === undefined) {
            return Sk.builtin.bool.false$;
        }
        bases = klass["$d"].mp$subscript(Sk.builtin.type.basesStr_);
        for (i = 0; i < bases.v.length; ++i) {
            if (Sk.misceval.isTrue(issubclass(bases.v[i], base))) {
                return Sk.builtin.bool.true$;
            }
        }
        return Sk.builtin.bool.false$;
    };

    return issubclass(obj.ob$type, type);
};

goog.exportSymbol("Sk.internal.isinstance", Sk.internal.isinstance);

Sk.internal.issubclass = function issubclass (c1, c2) {
    var i;
    var issubclass_internal;
    Sk.builtin.pyCheckArgs("issubclass", arguments, 2, 2);
    if (!Sk.builtin.checkClass(c2) && !(c2 instanceof Sk.builtin.tuple)) {
        throw new Sk.builtin.TypeError("issubclass() arg 2 must be a classinfo, type, or tuple of classes and types");
    }

    issubclass_internal = function (klass, base) {
        var i;
        var bases;
        if (klass === base) {
            return true;
        }
        if (klass["$d"] === undefined) {
            return false;
        }
        if (klass["$d"].mp$subscript) {
            bases = klass["$d"].mp$subscript(Sk.builtin.type.basesStr_);
        } else {
            return false;
        }
        for (i = 0; i < bases.v.length; ++i) {
            if (issubclass_internal(bases.v[i], base)) {
                return true;
            }
        }
        return false;
    };

    if (Sk.builtin.checkClass(c2)) {
        /* Quick test for an exact match */
        if (c1 === c2) {
            return true;
        }

        return issubclass_internal(c1, c2);
    }

    // Handle tuple type argument
    if (c2 instanceof Sk.builtin.tuple) {
        for (i = 0; i < c2.v.length; ++i) {
            if (Sk.internal.issubclass(c1, c2.v[i])) {
                return true;
            }
        }
        return false;
    }
};
goog.exportSymbol("Sk.internal.issubclass", Sk.internal.issubclass);