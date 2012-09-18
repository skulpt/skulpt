var $builtinmodule = function(name)
{
    var mod = {};
    mod.pi = Math.PI;
    mod.e = Math.E;

    mod.abs = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("abs", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return Math.abs(x);
    });

//	RNL	added
    mod.fabs = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("fabs", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return Math.abs(x);
    });

    mod.asin = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("asin", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return Math.asin(rad);
    });

    mod.acos = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("acos", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return Math.acos(rad);
    });

    mod.atan = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("atan", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return Math.atan(rad);
    });

    mod.atan2 = new Sk.builtin.func(function(y, x) {
        Sk.builtin.pyCheckArgs("atan2", arguments, 2, 2);
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return Math.atan2(y, x);
    });

    mod.sin = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("sin", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return Math.sin(rad);
    });

    mod.cos = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("cos", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return Math.cos(rad);
    });

    mod.tan = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("tan", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return Math.tan(rad);
    });

    mod.ceil = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("ceil", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return Math.ceil(x);
    });

    mod.floor = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("floor", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return Math.floor(x);
    });

    mod.sqrt = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("sqrt", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return Math.sqrt(x);
    });

    mod.trunc = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("trunc", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return x | 0;
    });

    mod.log = new Sk.builtin.func(function(x, base) {
        Sk.builtin.pyCheckArgs("log", arguments, 1, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        if (base === undefined) {
	    return Math.log(x);            
        } else {
            Sk.builtin.pyCheckType("base", "number", Sk.builtin.checkNumber(base));
            return Math.log(x) / Math.log(base);
        }
    });

    mod.log10 = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("log10", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return Math.log(x) / Math.log(10);
    });

    mod.exp = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("exp", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return Math.exp(x);
    });

    mod.pow = new Sk.builtin.func(function(x,y) {
        Sk.builtin.pyCheckArgs("pow", arguments, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

	return Math.pow(x,y);
    });

    mod.radians = new Sk.builtin.func(function(deg) {
        Sk.builtin.pyCheckArgs("radians", arguments, 1, 1);
        Sk.builtin.pyCheckType("deg", "number", Sk.builtin.checkNumber(deg));

	return Math.PI / 180.0 * deg;
    });

    mod.degrees = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("degrees", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return 180.0 / Math.PI * rad;
    });

    return mod;
}