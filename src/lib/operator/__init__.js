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

    mod.add = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$add'].call(a, b); });
    mod.__add__ = mod.add;

    mod.mod = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$remainder'].call(a, b); });
    mod.__mod__ = mod.mod;

    mod.mul = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$multiply'].call(a, b); });
    mod.__mul__ = mod.mul;

    mod.pow = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$power'].call(a, b); });
    mod.__pow__ = mod.pow;

    mod.sub = new Sk.builtin.func(function(a, b) { return Sk.builtin.nmber.prototype['nb$subtract'].call(a, b); });
    mod.__sub__ = mod.sub;

    mod.truediv = mod.div;
    mod.__truediv__ = mod.div;

    mod.concat = new Sk.builtin.func(function(a, b) {
        var a_type = Sk.abstr.typeName(a);

        var func;
        switch (a_type) {
            case "list":
                func = Sk.builtin.list.prototype['sq$concat'];
                break;
            case "str":
                func = Sk.builtin.str.prototype['sq$concat'];
                break;
            case "tuple":
                func = Sk.builtin.tuple.prototype['sq$concat'];
                break;
            default:
                throw new Sk.builtin.TypeError("concat not defined for type " + a_type);
                break;
        }
        return func.call(a, b);
    });
    mod.__concat__ = mod.concat;

    mod.contains = new Sk.builtin.func(function(a, b) { return Sk.builtin.bool(Sk.abstr.sequenceContains(a, b)); });
    mod.__contains__ = mod.contains;

    mod.indexOf = new Sk.builtin.func(function(a, b) { return Sk.abstr.sequenceGetIndexOf(a, b); });

    mod.countOf = new Sk.builtin.func(function(a, b) { return Sk.abstr.sequenceGetCountOf(a, b); });

    mod.getitem = new Sk.builtin.func(function(a, b) { return Sk.abstr.sequenceGetItem(a, b); });
    mod.__getitem__ = mod.getitem;

    mod.setitem = new Sk.builtin.func(function(a, b, c) { return Sk.abstr.sequenceSetItem(a, b, c); });
    mod.__setitem__ = mod.setitem;

    mod.delitem = new Sk.builtin.func(function(a, b) { return Sk.abstr.sequenceDelItem(a, b); });
    mod.__delitem__ = mod.delitem;

    return mod;
};
