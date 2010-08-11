Sk.abstr = {};

//
//
//
//
// Number
//
//
//
//

Sk.abstr.binop_type_error = function(v, w, name)
{
    throw new TypeError("unsupported operand type(s) for " + name + ": '"
            + v.tp$name + "' and '" + w.tp$name + "'");
};

// this can't be a table for closure
Sk.abstr.boNameToSlotFunc_ = function(obj, name)
{
    /* todo;
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
        */
};

Sk.abstr.binary_op_ = function(v, w, opname)
{
    var ret;
    var vop = Sk.abstr.boNameToSlotFunc_(v, opname);
    if (vop !== undefined)
    {
        ret = vop.call(v, w);
        if (ret !== undefined) return ret;
    }
    var wop = Sk.abstr.boNameToSlotFunc_(w, opname);
    if (wop !== undefined)
    {
        ret = wop.call(w, v);
        if (ret !== undefined) return ret;
    }

    if (opname === "Add" && v.sq$concat)
        return v.sq$concat(w);
    else if (opname === "Mult" && v.sq$repeat)
        return Sk.abstr.sequenceRepeat(v.sq$repeat, v, w);
    else if (opname === "Mult" && w.sq$repeat)
        return Sk.abstr.sequenceRepeat(w.sq$repeat, w, v);

    Sk.abstr.binop_type_error(v, w, opname);
};

Sk.abstr.binary_iop_ = function(v, w, opname)
{
    var vop = Sk.abstr.boNameToSlotFunc_(v, opname);
    var wop = Sk.abstr.boNameToSlotFunc_(w, opname);

    Sk.abstr.binop_type_error(v, w, opname);
};

//
// handle upconverting a/b from number to long if op causes too big/small a
// result, or if either of the ops are already longs
Sk.abstr.numOpAndPromote = function(a, b, opfn)
{
    if (typeof a === "number" && typeof b === "number")
    {
        var ans = opfn(a, b);
        // todo; handle float
        if (ans > Sk.builtin.lng.threshold$ || ans < -Sk.builtin.lng.threshold$)
            return [Sk.builtin.lng.fromInt$(a), Sk.builtin.lng.fromInt$(b)];
        else
            return ans;
    }
    else if (a.constructor === Sk.builtin.lng && typeof b === "number")
        return [a, Sk.builtin.lng.fromInt$(b)];
    else if (b.constructor === Sk.builtin.lng && typeof a === "number")
        return [Sk.builtin.lng.fromInt$(a), b];

    return undefined;
};

Sk.abstr.boNumPromote_ = {
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
    "RShift": function(a, b) { return a >> b; }
};

Sk.abstr.numberBinOp = function(v, w, op)
{
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
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

    return Sk.abstr.binary_op_(v, w, op);
};

Sk.abstr.numberInplaceBinOp = function(v, w, op)
{
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined)
    {
        var tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number")
        {
            return tmp;
        }
        v = tmp[0];
        w = tmp[1];
    }

    return Sk.abstr.binary_iop_(v, w, op);
};

Sk.abstr.numberUnaryOp = function(v, op)
{
    if (v === false && op === "Not") return true;
    else if (v === true && op === "Not") return false;
    else if (typeof v === "number")
    {
        if (op === "USub") return -v;
        else if (op === "Not") return Sk.builtin.object.isTrue$(v) ? false : true;
        else if (op === "UAdd") return v;
        else if (op === "Invert") return ~v;
    }
    goog.asserts.fail("todo; unary op dispatch");
};

//
//
//
//
// Sequence
//
//
//
//

Sk.abstr.fixSeqIndex_ = function(seq, i)
{
    if (i < 0 && seq.sq$length)
        i += seq.sq$length();
    return i;
};

Sk.abstr.sequenceContains = function(seq, ob)
{
    if (seq.sq$contains) return seq.sq$contains(ob);

    if (!seq.tp$iter) throw new TypeError("argument of type '" + seq.tp$name + "' is not iterable");
    
    for (var it = seq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        if (Sk.misceval.richCompareBool(i, ob, "Eq"))
            return true;
    }
    return false;
};

Sk.abstr.sequenceSetItem = function(seq, i, x)
{
    goog.asserts.fail();
};

Sk.abstr.sequenceDelItem = function(seq, i)
{
    if (seq.sq$ass_item)
    {
        i = Sk.abstr.fixSeqIndex_(seq, i);
        return seq.sq$ass_item(i, null);
    }
    throw new TypeError("'" + seq.tp$name + "' object does not support item deletion");
};

Sk.abstr.sequenceRepeat = function(f, seq, n)
{
    goog.asserts.fail("need to implement nb$index");
    /*
    var count = n.nb$index();
    if (count === undefined)
    {
        throw new TypeError("can't multiply sequence by non-int of type '" + n.tp$name + "'");
    }
    return f.call(seq, n);
    */
};

Sk.abstr.sequenceGetSlice = function(seq, i1, i2)
{
    if (seq.sq$slice)
    {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        return seq.sq$slice(i1, i2);
    }
    else if (seq.mp$subscript)
    {
        return seq.mp$subscript(new Sk.builtin.slice(i1, i2));
    }
    throw new TypeError("'" + seq.tp$name + "' object is unsliceable");
};

Sk.abstr.sequenceDelSlice = function(seq, i1, i2)
{
    if (seq.sq$ass_slice)
    {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        return seq.sq$ass_slice(i1, i2, null);
    }
    throw new TypeError("'" + seq.tp$name + "' doesn't support slice deletion");
};

Sk.abstr.sequenceSetSlice = function(seq, ilow, ihigh, x)
{
    goog.asserts.fail();
};



//
//
//
//
// Object
//
//
//
//

Sk.abstr.objectDelItem = function(o, key)
{
    if (o.mp$ass_subscript)
        return o.mp$ass_subscript(key, null);
    if (o.sq$ass_item)
    {
        var keyValue = Sk.misceval.asIndex(key);
        if (keyValue === undefined)
            throw new TypeError("sequence index must be integer, not '" + key.tp$name + "'");
        return Sk.abstr.sequenceDelItem(o, keyValue);
    }
    throw new TypeError("'" + o.tp$name + "' object does not support item deletion");
};

Sk.abstr.objectGetItem = function(o, key)
{
    goog.asserts.fail();
};

Sk.abstr.objectSetItem = function(o, key, v)
{
    goog.asserts.fail();
};
