var $builtinmodule = function (name) {
    var mod = {};
    mod.pi = new Sk.builtin.float_(Math.PI);
    mod.e = new Sk.builtin.float_(Math.E);

    mod.fabs = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("fabs", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.abs(Sk.builtin.asnum$(x)));
    });

    mod.asin = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgs("asin", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.asin(Sk.builtin.asnum$(rad)));
    });

    mod.acos = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgs("acos", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.acos(Sk.builtin.asnum$(rad)));
    });

    mod.atan = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgs("atan", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.atan(Sk.builtin.asnum$(rad)));
    });

    mod.atan2 = new Sk.builtin.func(function (y, x) {
        Sk.builtin.pyCheckArgs("atan2", arguments, 2, 2);
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.atan2(Sk.builtin.asnum$(y), Sk.builtin.asnum$(x)));
    });

    mod.sin = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgs("sin", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.sin(Sk.builtin.asnum$(rad)));
    });

    mod.cos = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgs("cos", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.cos(Sk.builtin.asnum$(rad)));
    });

    mod.tan = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgs("tan", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        return new Sk.builtin.float_(Math.tan(Sk.builtin.asnum$(rad)));
    });

    mod.asinh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("asinh", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var L = x + Math.sqrt(x * x + 1);

        return new Sk.builtin.float_(Math.log(L));
    });

    mod.acosh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("acosh", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var L = x + Math.sqrt(x * x - 1);

        return new Sk.builtin.float_(Math.log(L));
    });

    mod.atanh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("atanh", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var L = (1 + x) / (1 - x);

        return new Sk.builtin.float_(Math.log(L) / 2);
    });

    mod.sinh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("sinh", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var e = Math.E;
        var p = Math.pow(e, x);
        var n = 1 / p;
        var result = (p - n) / 2;

        return new Sk.builtin.float_(result);
    });

    mod.cosh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("cosh", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var e = Math.E;
        var p = Math.pow(e, x);
        var n = 1 / p;
        var result = (p + n) / 2;

        return new Sk.builtin.float_(result);
    });

    mod.tanh = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("tanh", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Sk.builtin.asnum$(x);

        var e = Math.E;
        var p = Math.pow(e, x);
        var n = 1 / p;
        var result = ((p - n) / 2) / ((p + n) / 2);

        return new Sk.builtin.float_(result);
    });

    mod.ceil = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("ceil", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.ceil(Sk.builtin.asnum$(x)));
    });

    // returns y with the sign of x
    mod.copysign = new Sk.builtin.func(function (x, y) {
        Sk.builtin.pyCheckArgs("ceil", arguments, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        var _x = Sk.ffi.remapToJs(x);
        var _y = Sk.ffi.remapToJs(y);
        var res;

        var isNeg_x = _x < 0;
        var isNeg_y = _x < 0;

        // special case for floats with negative zero
        if(Sk.builtin.checkFloat(x)) {
            if(_x === 0) {
                isNeg_x = 1/_x === -Infinity ? true : false;
            }
        }

        if(Sk.builtin.checkFloat(y)) {
            if(_y === 0) {
                isNeg_y = 1/_y === -Infinity ? true : false;
            }
        }

        // if both signs are equal, just return _y
        if((isNeg_x && isNeg_y) || (!isNeg_x && !isNeg_y)) {
            res = _y;
        } else if((isNeg_x && !isNeg_y) || (!isNeg_x && isNeg_y)) {
            // if different, invert sign
            if(y === 0) {
                // special case for zero
                res = isNeg_x ? -0.0 : 0.0;
            } else {
                res = _y * -1;
            }
        }

        return new Sk.builtin.float_(res);
    });

    mod.floor = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("floor", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.floor(Sk.builtin.asnum$(x)));
    });

    mod.sqrt = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("sqrt", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.sqrt(Sk.builtin.asnum$(x)));
    });

    mod.trunc = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("trunc", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.int_(Sk.builtin.asnum$(x) | 0);
    });

    mod.log = new Sk.builtin.func(function (x, base) {
        Sk.builtin.pyCheckArgs("log", arguments, 1, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        if (base === undefined) {
            return new Sk.builtin.float_(Math.log(Sk.builtin.asnum$(x)));
        } else {
            Sk.builtin.pyCheckType("base", "number", Sk.builtin.checkNumber(base));
            var ret = Math.log(Sk.builtin.asnum$(x)) / Math.log(Sk.builtin.asnum$(base));
            return new Sk.builtin.float_(ret);
        }
    });

    mod.log10 = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("log10", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        var ret = Math.log(Sk.builtin.asnum$(x)) / Math.log(10);
        return new Sk.builtin.float_(ret);
    });

    /* Return True if x is infinite, and False otherwise. */
    mod.isinf = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("isinf", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        var _x = Sk.builtin.asnum$(x);
        if(isFinite(_x) && !isNaN(_x)) {
            return Sk.builtin.bool.false$;
        } else {
            return Sk.builtin.bool.true$
        }
    });

    /* Return True if x is a NaN (not a number), and False otherwise. */
    mod.isnan = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("isnan", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "float", Sk.builtin.checkFloat(x));

        var _x = Sk.builtin.asnum$(x);
        if(isNaN(_x)) {
            return Sk.builtin.bool.true$;
        } else {
            return Sk.builtin.bool.false$;
        }
    });

    mod.exp = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("exp", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.exp(Sk.builtin.asnum$(x)));
    });

    mod.pow = new Sk.builtin.func(function (x, y) {
        Sk.builtin.pyCheckArgs("pow", arguments, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        return new Sk.builtin.float_(Math.pow(Sk.builtin.asnum$(x), Sk.builtin.asnum$(y)));
    });

    mod.radians = new Sk.builtin.func(function (deg) {
        Sk.builtin.pyCheckArgs("radians", arguments, 1, 1);
        Sk.builtin.pyCheckType("deg", "number", Sk.builtin.checkNumber(deg));

        var ret = Math.PI / 180.0 * Sk.builtin.asnum$(deg);
        return new Sk.builtin.float_(ret);
    });

    mod.degrees = new Sk.builtin.func(function (rad) {
        Sk.builtin.pyCheckArgs("degrees", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

        var ret = 180.0 / Math.PI * Sk.builtin.asnum$(rad);
        return new Sk.builtin.float_(ret);
    });

    mod.hypot = new Sk.builtin.func(function (x, y) {
        Sk.builtin.pyCheckArgs("hypot", arguments, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        x = Sk.builtin.asnum$(x);
        y = Sk.builtin.asnum$(y);
        return new Sk.builtin.float_(Math.sqrt((x * x) + (y * y)));
    });

    mod.factorial = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("factorial", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        x = Math.floor(Sk.builtin.asnum$(x));
        var r = 1;
        for (var i = 2; i <= x; i++) {
            r *= i;
        }
        return new Sk.builtin.int_(r);
    });

    return mod;
}