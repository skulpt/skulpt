var $builtinmodule = function(name)
{
    var mod = {};
    mod.pi = Sk.builtin.assk$(Math.PI, Sk.builtin.float$);
    mod.e =  Sk.builtin.assk$(Math.E, Sk.builtin.float$);

    mod.abs = new Sk.builtin.func(function(x) {
	return Sk.builtin.assk$(Math.abs(Sk.builtin.asnum$(x)), undefined);
    });

//	RNL	added
    mod.fabs = new Sk.builtin.func(function(x) {
	return Sk.builtin.assk$(Math.abs(Sk.builtin.asnum$(x)), Sk.builtin.float$);
    });

    mod.asin = new Sk.builtin.func(function(rad) {
	return Sk.builtin.assk$(Math.asin(Sk.builtin.asnum$(rad)), undefined);
    });

    mod.acos = new Sk.builtin.func(function(rad) {
	return Sk.builtin.assk$(Math.acos(Sk.builtin.asnum$(rad)), undefined);
    });

    mod.atan = new Sk.builtin.func(function(rad) {
	return Sk.builtin.assk$(Math.atan(Sk.builtin.asnum$(rad)), undefined);
    });

    mod.sin = new Sk.builtin.func(function(rad) {
	return Sk.builtin.assk$(Math.sin(Sk.builtin.asnum$(rad)), undefined);
    });

    mod.cos = new Sk.builtin.func(function(rad) {
	return Sk.builtin.assk$(Math.cos(Sk.builtin.asnum$(rad)), undefined);
    });

    mod.tan = new Sk.builtin.func(function(rad) {
	return Sk.builtin.assk$(Math.tan(Sk.builtin.asnum$(rad)), undefined);
    });

    mod.ceil = new Sk.builtin.func(function(x) {
	return Sk.builtin.assk$(Math.ceil(Sk.builtin.asnum$(x)), undefined);
    });

    mod.floor = new Sk.builtin.func(function(x) {
	return Sk.builtin.assk$(Math.floor(Sk.builtin.asnum$(x)), undefined);
    });

    mod.sqrt = new Sk.builtin.func(function(x) {
	return Sk.builtin.assk$(Math.sqrt(Sk.builtin.asnum$(x)), undefined);
    });

    mod.log = new Sk.builtin.func(function(x) {
	return Sk.builtin.assk$(Math.log(Sk.builtin.asnum$(x)), undefined);
    });

    mod.exp = new Sk.builtin.func(function(x) {
	return Sk.builtin.assk$(Math.exp(Sk.builtin.asnum$(x)), undefined);
    });

    mod.pow = new Sk.builtin.func(function(x,y) {
	return Sk.builtin.assk$(Math.pow(Sk.builtin.asnum$(x),Sk.builtin.asnum$(y)), undefined);
    });

    mod.radians = new Sk.builtin.func(function(deg) {
	return Sk.builtin.assk$(Math.PI / 180.0 * Sk.builtin.asnum$(deg), undefined);
    });

    mod.degrees = new Sk.builtin.func(function(rad) {
	return Sk.builtin.assk$(180.0 / Math.PI * Sk.builtin.asnum$(rad), undefined);
    });

    return mod;
}
