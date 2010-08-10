Sk.abstract = {};

Sk.abstract.binop_type_error = function(v, w, name)
{
    throw new TypeError("unsupported operand type(s) for " + name + ": '"
            + v.tp$name + "' and '" + w.tp$name + "'");
};

// this can't be a table for closure
Sk.abstract.boNameToSlotFunc_ = function(obj, name)
{
    switch (name)
    {
        case "Add": return obj.nb$add;
        case "Sub": return obj.nb$subtract;
        case "Mult": return obj.nb$multiply;
        case "Div": return obj.nb$divide;
        case "FloorDiv": return obj.nb$floor_divide;
        case "Mod": return obj.nb$remainder;
        case "Pow": return obj.nb$power;
        case "LShift": return obj.nb$lshift;
        case "RShift": return obj.nb$rshift;
        case "BitAnd": return obj.nb$and;
        case "BitOr": return obj.nb$or;
        case "BitXor": return obj.nb$xor;
        default:
            goog.asserts.fail();
    }
};

Sk.abstract.sequenceRepeat_ = function(f, seq, n)
{
    var count = n.nb$index();
    if (count === undefined)
    {
        throw new TypeError("can't multiply sequence by non-int of type '" + n.tp$name + "'");
    }
    return f.call(seq, n);
};


Sk.abstract.binary_op_ = function(v, w, opname)
{
    var ret;
    var vop = Sk.abstract.boNameToSlotFunc_(v, opname);
    if (vop !== undefined)
    {
        ret = vop.call(v, w);
        if (ret !== undefined) return ret;
    }
    var wop = Sk.abstract.boNameToSlotFunc_(w, opname);
    if (wop !== undefined)
    {
        ret = wop.call(w, v);
        if (ret !== undefined) return ret;
    }

    if (opname === "Add" && v.sq$concat)
        return v.sq$concat(w);
    else if (opname === "Mult" && v.sq$repeat)
        return Sk.abstract.sequenceRepeat_(v.sq$repeat, v, w);
    else if (opname === "Mult" && w.sq$repeat)
        return Sk.abstract.sequenceRepeat_(w.sq$repeat, w, v);

    Sk.abstract.binop_type_error(v, w, opname);
};

Sk.abstract.binary_iop_ = function(v, w, opname)
{
    var vop = Sk.abstract.boNameToSlotFunc_(v, opname);
    var wop = Sk.abstract.boNameToSlotFunc_(w, opname);

    Sk.abstract.binop_type_error(v, w, opname);
};

//
// handle upconverting a/b from number to long if op causes too big/small a
// result, or if either of the ops are already longs
Sk.abstract.numOpAndPromote = function(a, b, opfn)
{
    if (typeof a === "number" && typeof b === "number")
    {
        var ans = opfn(a, b);
        // todo; handle float
        if (ans > Sk.builtin.long.threshold$ || ans < -Sk.builtin.long.threshold$)
            return [Sk.builtin.long.fromInt(a), Sk.builtin.long.fromInt(b)];
        else
            return ans;
    }
    else if (a.constructor === Sk.builtin.long && typeof b === "number")
        return [a, Sk.builtin.long.fromInt$(b)];
    else if (b.constructor === Sk.builtin.long && typeof a === "number")
        return [Sk.builtin.long.fromInt$(a), b];

    return undefined;
};

Sk.abstract.boNumPromote_ = {
    "Add": function(a, b) { return a + b; },
    "Sub": function(a, b) { return a - b; },
    "Mult": function(a, b) { return a * b; },
    "Mod": function(a, b) { return a % b; },
    "Div": function(a, b) { return a / b; },
    "FloorDiv": function(a, b) { return Math.floor(a / b); }, // todo; wrong? neg?
    "Pow": Math.pow,
    "BitAnd": function(a, b) { return a & b; },
    "BitOr": function(a, b) { return a | b; },
    "BitXor": function(a, b) { return a ^ b; },
    "LShift": function(a, b) { return a << b; },
    "RShift": function(a, b) { return a >> b; },
};

Sk.abstract.numberBinOp = function(v, w, op)
{
    var numPromoteFunc = Sk.abstract.boNumPromote_[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = Sk.abstract.numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number")
        {
            return tmp;
        }
        else if (tmp !== undefined)
        {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return Sk.abstract.binary_op_(v, w, op);
};

Sk.abstract.numberInplaceBinOp = function(v, w, op)
{
    var numPromoteFunc = Sk.abstract.boNumPromote_[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = Sk.abstract.numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number")
        {
            return tmp;
        }
        v = tmp[0];
        w = tmp[1];
    }

    return Sk.abstract.binary_iop_(v, w, op);
};

/*
Sk.abstract.number_Add = function(v, w)
{
    if (typeof(v) === 'number' && typeof(w) === 'number')
    {
        var i = v + w;
        if (i >= -Sk.builtin.long.threshold$ && i < Sk.builtin.long.threshold$)
            return i;
    }
    else if (v instanceof Sk.builtin.str && w instanceof Sk.builtin.str)
    {
        return new Sk.builtin.str(v.v + w.v);
    }

    var result = Sk.abstract.binary_op1_(v, w, v.nb$add, w.nb$add);
    if (result === undefined) // wasn't implemented numerically
    {
        if (v.sq$concat)
            return v.sq$concat(w);
        Sk.abstract.binop_type_error(v, w, '+');
    }
    return result;
};

Sk.abstract.number_Sub = function(v, w)
{
    if (typeof(v) === 'number' && typeof(w) === 'number')
    {
        var i = v - w;
        if (i >= -Sk.builtin.long.threshold$ && i < Sk.builtin.long.threshold$)
            return i;
    }
    return Sk.abstract.binary_op_(v, w, v.nb$sub, w.nb$sub, '-')
};

Sk.abstract.sequenceRepeat_ = function(f, seq, n)
{
    var count = n.nb$index();
    if (count === undefined)
    {
        throw new TypeError("can't multiply sequence by non-int of type '" + n.tp$name + "'");
    }
    return f.call(seq, n);
};

Sk.abstract.number_Mult = function(v, w)
{
    var result = Sk.abstract.binary_op1_(v, w, v.nb$multiply, w.nb$multiply);
    if (result === undefined)
    {
        if (v.sq$repeat)
            return Sk.abstract.sequenceRepeat_(v.sq$repeat, v, w);
        else if (w.sq$repeat)
            return Sk.abstract.sequenceRepeat_(w.sq$repeat, w, v);
        Sk.abstract.binop_type_error(v, w, '*');
    }
    return result;
};

*/
