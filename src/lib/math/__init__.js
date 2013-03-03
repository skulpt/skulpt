var $builtinmodule = function(name)
{
    var mod = {};
    mod.pi = Sk.builtin.assk$(Math.PI, Sk.builtin.nmber.float$);
    mod.e =  Sk.builtin.assk$(Math.E, Sk.builtin.nmber.float$);

    mod.abs = new Sk.builtin.func(function(x) {
		return Sk.builtin.assk$(Math.abs(Sk.builtin.asnum$(x)), undefined);
    });

//	RNL	added
    mod.fabs = new Sk.builtin.func(function(x) {
		return Sk.builtin.assk$(Math.abs(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.asin = new Sk.builtin.func(function(rad) {
		return Sk.builtin.assk$(Math.asin(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.acos = new Sk.builtin.func(function(rad) {
		return Sk.builtin.assk$(Math.acos(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.atan = new Sk.builtin.func(function(rad) {
		return Sk.builtin.assk$(Math.atan(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.atan2 = new Sk.builtin.func(function(x, y) {
		return Sk.builtin.assk$(Math.atan2(Sk.builtin.asnum$(x), Sk.builtin.asnum$(y)), Sk.builtin.nmber.float$);
    });

    mod.sin = new Sk.builtin.func(function(rad) {
		return Sk.builtin.assk$(Math.sin(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.cos = new Sk.builtin.func(function(rad) {
		return Sk.builtin.assk$(Math.cos(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.tan = new Sk.builtin.func(function(rad) {
		return Sk.builtin.assk$(Math.tan(Sk.builtin.asnum$(rad)), Sk.builtin.nmber.float$);
    });

    mod.ceil = new Sk.builtin.func(function(x) {
		return Sk.builtin.assk$(Math.ceil(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.floor = new Sk.builtin.func(function(x) {
		return Sk.builtin.assk$(Math.floor(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.sqrt = new Sk.builtin.func(function(x) {
		return Sk.builtin.assk$(Math.sqrt(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.log = new Sk.builtin.func(function(x, b) {
		if (b) {
			return Sk.builtin.assk$((Math.log(Sk.builtin.asnum$(x)) / Math.log(Sk.builtin.asnum$(b))), Sk.builtin.nmber.float$);
		}
		return Sk.builtin.assk$(Math.log(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.log10 = new Sk.builtin.func(function(x, b) {
		return Sk.builtin.assk$((Math.log(Sk.builtin.asnum$(x)) / Math.log(Sk.builtin.asnum$(10))), Sk.builtin.nmber.float$);
	});

    mod.exp = new Sk.builtin.func(function(x) {
		return Sk.builtin.assk$(Math.exp(Sk.builtin.asnum$(x)), Sk.builtin.nmber.float$);
    });

    mod.pow = new Sk.builtin.func(function(x,y) {
		return Sk.builtin.assk$(Math.pow(Sk.builtin.asnum$(x),Sk.builtin.asnum$(y)), Sk.builtin.nmber.float$);
    });

    mod.radians = new Sk.builtin.func(function(deg) {
		return Sk.builtin.assk$(Math.PI / 180.0 * Sk.builtin.asnum$(deg), Sk.builtin.nmber.float$);
    });

    mod.degrees = new Sk.builtin.func(function(rad) {
		return Sk.builtin.assk$(180.0 / Math.PI * Sk.builtin.asnum$(rad), Sk.builtin.nmber.float$);
    });

    mod.trunc = new Sk.builtin.func(function(x) {
		return Sk.builtin.assk$(Math.floor(Sk.builtin.asnum$(x)), Sk.builtin.nmber.int$);
    });

    mod.hypot = new Sk.builtin.func(function(x, y) {
		x = Sk.builtin.asnum$(x);
		y = Sk.builtin.asnum$(y);
		return Sk.builtin.assk$(Math.sqrt((x*x)+(y*y)), Sk.builtin.nmber.float$);
    });

	mod.factorial = new Sk.builtin.func(function(x) {
		x = Math.floor(Sk.builtin.asnum$(x));
		var r = 1;
		for (var i = 2; i <= x; i++)
			r *= i;
		return Sk.builtin.assk$(r, Sk.builtin.nmber.int$);
	});

    return mod;
}
