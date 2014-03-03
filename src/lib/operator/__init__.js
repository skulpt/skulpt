/*
 *  __author__: Isaac Dontje Lindell (i@isaacdontjelindell.com)
 *
 *  Implementation of the Python operator module.
 */

var $builtinmodule = function(name) {
    var mod = {};

    mod.lt = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Lt')); });
    mod.__lt__ = mod.lt;

    mod.le = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'LtE')); });
    mod.__le__ = mod.le;

    mod.gt = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Gt')); });
    mod.__gt__ = mod.gt;

    mod.ge = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'GtE')); });
    mod.__ge__ = mod.ge;

    mod.eq = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Eq')); });
    mod.__eq__ = mod.eq;

    mod.ne = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'NotEq')); });
    mod.__ne__ = mod.ne;

    mod.is_ = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Is')); });

    mod.is_not = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'IsNot')); });

    mod.abs = new Sk.builtin.func(function(obj) { return Sk.misceval.callsim(Sk.builtin.abs, obj); });
    mod.__abs__ = mod.abs;

    return mod;
};
