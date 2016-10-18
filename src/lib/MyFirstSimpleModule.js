// All module must and always start with var $builtinmodule = statement
// The SK.buildin.func call for adding functions to your module,
// and the SK. miscebal.build class method,
var $builtinmodule = function (name) {
    var mod = {};
    mod.pi = new Sk.builtin.float_(Math.PI);
    mod.e = new Sk.builtin.float_(Math.E);

    mod.sqrt = new Sk.builtin.func(function (x) {
        Sk.builtin.pyCheckArgs("sqrt", arguments, 1, 1);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));

        return new Sk.builtin.float_(Math.sqrt(Sk.builtin.asnum$(x)));
    });

    // it multiple itself
    mod.pow = new Sk.builtin.func(function (x, y) {
        Sk.builtin.pyCheckArgs("pow", arguments, 2, 2);
        Sk.builtin.pyCheckType("x", "number", Sk.builtin.checkNumber(x));
        Sk.builtin.pyCheckType("y", "number", Sk.builtin.checkNumber(y));

        return new Sk.builtin.float_(Math.pow(Sk.builtin.asnum$(x), Sk.builtin.asnum$(y)));
    });


    return mod;
}