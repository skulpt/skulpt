/*
 *  __author__: Isaac Dontje Lindell (i@isaacdontjelindell.com)
 *
 *  Implementation of the Python operator module.
 */

var $builtinmodule = function (name) {
    var mod = {};

    mod.lt = new Sk.builtin.func(function (a, b) {
        return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Lt'));
    });
    mod.__lt__ = mod.lt;

    mod.le = new Sk.builtin.func(function (a, b) {
        return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'LtE'));
    });
    mod.__le__ = mod.le;

    mod.eq = new Sk.builtin.func(function (a, b) {
        return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Eq'));
    });
    mod.__eq__ = mod.eq;

    mod.ne = new Sk.builtin.func(function (a, b) {
        return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'NotEq'));
    });
    mod.__ne__ = mod.ne;

    mod.ge = new Sk.builtin.func(function (a, b) {
        return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'GtE'));
    });
    mod.__ge__ = mod.ge;

    mod.gt = new Sk.builtin.func(function (a, b) {
        return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Gt'));
    });
    mod.__gt__ = mod.gt;

    mod.not_ = new Sk.builtin.func(function (obj) {
        throw new Sk.builtin.NotImplementedError("operator.not_() is not yet implemented in Skulpt");
    });

    mod.truth = new Sk.builtin.func(function (obj) {
        return Sk.builtin.bool(obj);
    });

    mod.is_ = new Sk.builtin.func(function (a, b) {
        return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'Is'));
    });

    mod.is_not = new Sk.builtin.func(function (a, b) {
        return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, 'IsNot'));
    });

    mod.abs = new Sk.builtin.func(function (obj) {
        return Sk.misceval.callsim(Sk.builtin.abs, obj);
    });
    mod.__abs__ = mod.abs;

    // The documentation says that operator.add() is defined for a and b numbers, but
    // CPython (2.6) allows a and b to be other types (e.g. str)
    mod.add = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.objectAdd(a, b);
    });
    mod.__add__ = mod.add;

    mod.and_ = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "BitAnd");
    });
    mod.__and__ = mod.and_;

    mod.div = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "Div");
    });
    mod.__div__ = mod.div;

    mod.floordiv = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "FloorDiv");
    });
    mod.__floordiv__ = mod.floordiv;

    mod.index = new Sk.builtin.func(function (a) {
        return new Sk.builtin.int_(Sk.misceval.asIndex(a));
    });
    mod.__index__ = mod.index;

    // Note: Sk.abstr.numberUnaryOp(obj, 'Invert') looks for the function nb$invert() on obj.
    // However, it doesn't look like that function has been implemented for any existing object types.
    // I've gone ahead and created this function for completeness' sake, but expect any use of it to
    // result in an error.
    mod.inv = new Sk.builtin.func(function (obj) {
        return Sk.abstr.numberUnaryOp(obj, 'Invert');
    });
    mod.__inv__ = mod.inv;
    mod.invert = mod.inv;
    mod.__invert__ = mod.inv;

    mod.lshift = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "LShift");
    });
    mod.__lshift__ = mod.lshift;

    mod.mod = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "Mod");
    });
    mod.__mod__ = mod.mod;

    mod.divmod = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "DivMod");
    });
    mod.__divmod__ = mod.divmod;

    mod.mul = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "Mult");
    });
    mod.__mul__ = mod.mul;

    mod.neg = new Sk.builtin.func(function (obj) {
        return Sk.abstr.objectNegative(obj);
    });
    mod.__neg__ = mod.neg;

    mod.or_ = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "BitOr");
    });
    mod.__or__ = mod.or_;

    mod.pos = new Sk.builtin.func(function (obj) {
        return Sk.abstr.objectPositive(obj);
    });
    mod.__pos__ = mod.pos;

    mod.pow = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "Pow");
    });
    mod.__pow__ = mod.pow;

    mod.rshift = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "RShift");
    });
    mod.__rshift__ = mod.rshift;

    mod.sub = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "Sub");
    });
    mod.__sub__ = mod.sub;

    mod.truediv = mod.div;
    mod.__truediv__ = mod.div;

    mod.xor = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.binary_op_(a, b, "BitXor");
    });
    mod.__xor__ = mod.xor;

    mod.concat = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.sequenceConcat(a, b);
    });
    mod.__concat__ = mod.concat;

    mod.contains = new Sk.builtin.func(function (a, b) {
        return Sk.builtin.bool(Sk.abstr.sequenceContains(a, b));
    });
    mod.__contains__ = mod.contains;

    mod.countOf = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.sequenceGetCountOf(a, b);
    });

    mod.delitem = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.sequenceDelItem(a, b);
    });
    mod.__delitem__ = mod.delitem;

    mod.getitem = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.sequenceGetItem(a, b);
    });
    mod.__getitem__ = mod.getitem;

    mod.indexOf = new Sk.builtin.func(function (a, b) {
        return Sk.abstr.sequenceGetIndexOf(a, b);
    });

    mod.setitem = new Sk.builtin.func(function (a, b, c) {
        return Sk.abstr.sequenceSetItem(a, b, c);
    });
    mod.__setitem__ = mod.setitem;

    return mod;
};
