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

    mod.eq = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Eq')); });
    mod.__eq__ = mod.eq;

    mod.ne = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'NotEq')); });
    mod.__ne__ = mod.ne;

    mod.ge = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'GtE')); });
    mod.__ge__ = mod.ge;

    mod.gt = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Gt')); });
    mod.__gt__ = mod.gt;

    // operator.not_(obj)

    mod.truth = new Sk.builtin.func(function(obj) { return Sk.builtin.bool(obj); });

    mod.is_ = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Is')); });

    mod.is_not = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'IsNot')); });

    mod.abs = new Sk.builtin.func(function(obj) { return Sk.misceval.callsim(Sk.builtin.abs, obj); });
    mod.__abs__ = mod.abs;

    mod.add = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$add'].call(a, b); });
    mod.__add__ = mod.add;

    mod.and_ = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$and'].call(a, b); });
    mod.__and__ = mod.and_;

    mod.div = new Sk.builtin.func(function (a, b) { return Sk.builtin.nmber.prototype['nb$divide'].call(a, b); });
    mod.__div__ = mod.div;

    mod.floordiv = new Sk.builtin.func(function (a, b) { return Sk.builtin.nmber.prototype['nb$floor_divide'].call(a, b); });
    mod.__floordiv__ = mod.floordiv;

    // operator.index(a) - return a converted to an integer. Equivalent to a.__index__()

    // operator.inv/operator.invert(obj) - Return the bitwise inverse of the number obj. This is equivalent to ~obj

    mod.lshift = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$lshift'].call(a, b); });
    mod.__lshift__ = mod.lshift;

    mod.mod = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$remainder'].call(a, b); });
    mod.__mod__ = mod.mod;

    mod.mul = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$multiply'].call(a, b); });
    mod.__mul__ = mod.mul;

    mod.neg = new Sk.builtin.func(function(obj) { return Sk.abstr.objectNegative(obj); });
    mod.__neg__ = mod.neg;

    // operator.or_(a,b) - return the bitwise or of a and b

    // operator.pos(obj) - return obj positive (+obj)

    mod.pow = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$power'].call(a, b); });
    mod.__pow__ = mod.pow;

    // operator.rshift(a,b) - return a shifted right by b

    mod.sub = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$subtract'].call(a, b); });
    mod.__sub__ = mod.sub;

    mod.truediv = mod.div;
    mod.__truediv__ = mod.div;

    // operator.xor(a,b) - return the bitwise exclusive or of a and b

    mod.concat = new Sk.builtin.func(function(a, b) { return Sk.abstr.sequenceConcat(a, b); });
    mod.__concat__ = mod.concat;

    mod.contains = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.abstr.sequenceContains(a, b)); });
    mod.__contains__ = mod.contains;

    mod.countOf = new Sk.builtin.func(function(a, b) { return Sk.abstr.sequenceGetCountOf(a, b); });

    mod.delitem = new Sk.builtin.func(function(a, b) { return Sk.abstr.sequenceDelItem(a, b); });
    mod.__delitem__ = mod.delitem;

    mod.getitem = new Sk.builtin.func(function(a, b) { return Sk.abstr.sequenceGetItem(a, b); });
    mod.__getitem__ = mod.getitem;

    mod.indexOf = new Sk.builtin.func(function(a, b) { return Sk.abstr.sequenceGetIndexOf(a, b); });

    mod.setitem = new Sk.builtin.func(function(a, b, c) { return Sk.abstr.sequenceSetItem(a, b, c); });
    mod.__setitem__ = mod.setitem;

    return mod;
};
