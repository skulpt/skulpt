var $builtinmodule = function(name)
{
    var mod = {};
    mod.pi = Math.PI;
    mod.e = Math.E;

    mod.abs = new Sk.builtin.func(function(x) {
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

    mod.log = new Sk.builtin.func(function(x) {
	return Math.log(x);
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