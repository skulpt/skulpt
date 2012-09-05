var $builtinmodule = function(name)
{
    var mod = {};
    mod.pi = Math.PI;
    mod.e = Math.E;

    mod.abs = new Sk.builtin.func(function(x) {
	return Math.abs(x);
    });

//	RNL	added
    mod.fabs = new Sk.builtin.func(function(x) {
	return Math.abs(x);
    });

    mod.asin = new Sk.builtin.func(function(rad) {
	return Math.asin(rad);
    });

    mod.acos = new Sk.builtin.func(function(rad) {
	return Math.acos(rad);
    });

    mod.atan = new Sk.builtin.func(function(rad) {
	return Math.atan(rad);
    });

    mod.atan2 = new Sk.builtin.func(function(y, x) {
	return Math.atan2(y, x);
    });

    mod.sin = new Sk.builtin.func(function(rad) {
	return Math.sin(rad);
    });

    mod.cos = new Sk.builtin.func(function(rad) {
	return Math.cos(rad);
    });

    mod.tan = new Sk.builtin.func(function(rad) {
	return Math.tan(rad);
    });

    mod.ceil = new Sk.builtin.func(function(x) {
	return Math.ceil(x);
    });

    mod.floor = new Sk.builtin.func(function(x) {
	return Math.floor(x);
    });

    mod.sqrt = new Sk.builtin.func(function(x) {
	return Math.sqrt(x);
    });

    mod.trunc = new Sk.builtin.func(function(x) {
        return x | 0;
    });

    mod.log = new Sk.builtin.func(function(x, base) {
        if (base === undefined) {
	    return Math.log(x);            
        } else {
            return Math.log(x) / Math.log(base);
        }
    });

    mod.log10 = new Sk.builtin.func(function(x) {
        return Math.log(x) / Math.log(10);
    });

    mod.exp = new Sk.builtin.func(function(x) {
	return Math.exp(x);
    });

    mod.pow = new Sk.builtin.func(function(x,y) {
	return Math.pow(x,y);
    });

    mod.radians = new Sk.builtin.func(function(deg) {
	return Math.PI / 180.0 * deg;
    });

    mod.degrees = new Sk.builtin.func(function(rad) {
	return 180.0 / Math.PI * rad;
    });

    return mod;
}