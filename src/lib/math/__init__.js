var $builtinmodule = function(name)
{
    var mod = {};
    mod.pi = Sk.builtin.assk$(Math.PI, Sk.builtin.nmber.float$);
    mod.e =  Sk.builtin.assk$(Math.E, Sk.builtin.nmber.float$);

//	RNL	added
    mod.fabs = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("fabs", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return new Sk.builtin.nmber(Math.abs(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.asin = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("asin", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return new Sk.builtin.nmber(Math.asin(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.acos = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("acos", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return new Sk.builtin.nmber(Math.acos(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.atan = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("atan", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return new Sk.builtin.nmber(Math.atan(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.atan2 = new Sk.builtin.func(function(y, x) {
        Sk.builtin.pyCheckArgs("atan2", arguments, 2, 2);
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return new Sk.builtin.nmber(Math.atan2(Sk.builtin.asnum$(y), Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.sin = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("sin", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return new Sk.builtin.nmber(Math.sin(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.cos = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("cos", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return new Sk.builtin.nmber(Math.cos(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.tan = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("tan", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	return new Sk.builtin.nmber(Math.tan(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.asinh = new Sk.builtin.func(function(x) {
	Sk.builtin.pyCheckArgs("asinh", arguments, 1, 1);
	Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	x = Sk.builtin.asnum$(x);

	var L = x + Math.sqrt(x*x+1);

	return new Sk.builtin.nmber(Math.log(L), Sk.builtin.nmber.float$);
    });

    mod.acosh = new Sk.builtin.func(function(x) {
	Sk.builtin.pyCheckArgs("acosh", arguments, 1, 1);
	Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	x = Sk.builtin.asnum$(x);

	var L = x + Math.sqrt(x*x-1);

	return new Sk.builtin.nmber(Math.log(L), Sk.builtin.nmber.float$);
    });

    mod.atanh = new Sk.builtin.func(function(x) {
	Sk.builtin.pyCheckArgs("atanh", arguments, 1, 1);
	Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	x = Sk.builtin.asnum$(x);

	var L = (1+x)/(1-x);

	return new Sk.builtin.nmber(Math.log(L)/2, Sk.builtin.nmber.float$);
    });

    mod.sinh = new Sk.builtin.func(function(x) {
	Sk.builtin.pyCheckArgs("sinh", arguments, 1, 1);
	Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	x = Sk.builtin.asnum$(x);

	var e = Math.E;
	var p = Math.pow(e, x);
	var n = 1/p;
	var result = (p-n)/2;

	return new Sk.builtin.nmber(result, Sk.builtin.nmber.float$);
    });

    mod.cosh = new Sk.builtin.func(function(x) {
	Sk.builtin.pyCheckArgs("cosh", arguments, 1, 1);
	Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	x = Sk.builtin.asnum$(x);

	var e = Math.E;
	var p = Math.pow(e, x);
	var n = 1/p;
	var result = (p+n)/2;

	return new Sk.builtin.nmber(result, Sk.builtin.nmber.float$);
    });

    mod.tanh = new Sk.builtin.func(function(x) {
	Sk.builtin.pyCheckArgs("tanh", arguments, 1, 1);
	Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	x = Sk.builtin.asnum$(x);

	var e = Math.E;
	var p = Math.pow(e, x);
	var n = 1/p;
	var result = ((p-n)/2)/((p+n)/2);

	return new Sk.builtin.nmber(result, Sk.builtin.nmber.float$);
    });

    mod.ceil = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("ceil", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return new Sk.builtin.nmber(Math.ceil(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.floor = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("floor", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return new Sk.builtin.nmber(Math.floor(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.sqrt = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("sqrt", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return new Sk.builtin.nmber(Math.sqrt(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.trunc = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("trunc", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.nmber(Sk.builtin.asnum$(x)|0, Sk.builtin.nmber.int$);
    });

    mod.log = new Sk.builtin.func(function(x, base) {
        Sk.builtin.pyCheckArgs("log", arguments, 1, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        if (base === undefined) {
	    return new Sk.builtin.nmber(Math.log(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
        } else {
            Sk.builtin.pyCheckType("base", "number", Sk.builtin.checkNumber(base));
            var ret = Math.log(Sk.builtin.asnum$(x)) / Math.log(Sk.builtin.asnum$(base));
	    return new Sk.builtin.nmber(ret, Sk.builtin.nmber.float$);
        }
    });

    mod.log10 = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("log10", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        var ret = Math.log(Sk.builtin.asnum$(x)) / Math.log(10);
	return new Sk.builtin.nmber(ret, Sk.builtin.nmber.float$);
    });

    mod.exp = new Sk.builtin.func(function(x) {
        Sk.builtin.pyCheckArgs("exp", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

	return new Sk.builtin.nmber(Math.exp(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.pow = new Sk.builtin.func(function(x,y) {
        Sk.builtin.pyCheckArgs("pow", arguments, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

	return new Sk.builtin.nmber(Math.pow(Sk.builtin.asnum$(x), Sk.builtin.asnum$(y)), Sk.builtin.nmber.float$);
    });

    mod.radians = new Sk.builtin.func(function(deg) {
        Sk.builtin.pyCheckArgs("radians", arguments, 1, 1);
        Sk.builtin.pyCheckType("deg", "number", Sk.builtin.checkNumber(deg));

	var ret = Math.PI / 180.0 * Sk.builtin.asnum$(deg);
	return new Sk.builtin.nmber(ret, Sk.builtin.nmber.float$);
    });

    mod.degrees = new Sk.builtin.func(function(rad) {
        Sk.builtin.pyCheckArgs("degrees", arguments, 1, 1);
        Sk.builtin.pyCheckType("rad", "number", Sk.builtin.checkNumber(rad));

	var ret = 180.0 / Math.PI * Sk.builtin.asnum$(rad);
	return new Sk.builtin.nmber(ret, Sk.builtin.nmber.float$);
    });

    mod.hypot = new Sk.builtin.func(function(x, y) {
	Sk.builtin.pyCheckArgs("hypot", arguments, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
	Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

		x = Sk.builtin.asnum$(x);
		y = Sk.builtin.asnum$(y);
	return new Sk.builtin.nmber(Math.sqrt((x*x)+(y*y)), Sk.builtin.nmber.float$);
    });

	mod.factorial = new Sk.builtin.func(function(x) {
	    Sk.builtin.pyCheckArgs("factorial", arguments, 1, 1);
            Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

		x = Math.floor(Sk.builtin.asnum$(x));
		var r = 1;
		for (var i = 2; i <= x; i++)
			r *= i;
		return new Sk.builtin.nmber(r, Sk.builtin.nmber.int$);
	});

    return mod;
}