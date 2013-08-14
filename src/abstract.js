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

Sk.abstr.typeName = function(v) {
    var vtypename;
    if (v instanceof Sk.builtin.nmber) {
        vtypename = v.skType;
    } else if (v.tp$name !== undefined) {
        vtypename = v.tp$name;
    } else {
        vtypename = "<invalid type>";
    };
    return vtypename;
};

Sk.abstr.binop_type_error = function(v, w, name)
{
    var vtypename = Sk.abstr.typeName(v);
    var wtypename = Sk.abstr.typeName(w);

    throw new Sk.builtin.TypeError("unsupported operand type(s) for " + name + ": '"
            + vtypename + "' and '" + wtypename + "'");
};

Sk.abstr.boNameToSlotFuncLhs_ = function(obj, name) {
  if (obj === null) {
    return undefined;
  };
  switch (name) {
    case "Add":      return obj.nb$add          ? obj.nb$add :          obj['__add__'];
    case "Sub":      return obj.nb$subtract     ? obj.nb$subtract :     obj['__sub__'];
    case "Mult":     return obj.nb$multiply     ? obj.nb$multiply :     obj['__mul__'];
    case "Div":      return obj.nb$divide       ? obj.nb$divide :       obj['__div__'];
    case "FloorDiv": return obj.nb$floor_divide ? obj.nb$floor_divide : obj['__floordiv__'];
    case "Mod":      return obj.nb$remainder    ? obj.nb$remainder :    obj['__mod__'];
    case "Pow":      return obj.nb$power        ? obj.nb$power :        obj['__pow__'];
    case "LShift":   return obj.nb$lshift       ? obj.nb$lshift :       obj['__lshift__'];
    case "RShift":   return obj.nb$rshift       ? obj.nb$rshift :       obj['__rshift__'];
    case "BitAnd":   return obj.nb$and          ? obj.nb$and :          obj['__and__'];
    case "BitXor":   return obj.nb$xor          ? obj.nb$xor :          obj['__xor__'];
    case "BitOr":    return obj.nb$or           ? obj.nb$or :           obj['__or__'];
  }
};

Sk.abstr.boNameToSlotFuncRhs_ = function(obj, name) {
  if (obj === null) {
    return undefined;
  };
  switch (name) {
    case "Add":      return obj.nb$add          ? obj.nb$add :          obj['__radd__'];
    case "Sub":      return obj.nb$subtract     ? obj.nb$subtract :     obj['__rsub__'];
    case "Mult":     return obj.nb$multiply     ? obj.nb$multiply :     obj['__rmul__'];
    case "Div":      return obj.nb$divide       ? obj.nb$divide :       obj['__rdiv__'];
    case "FloorDiv": return obj.nb$floor_divide ? obj.nb$floor_divide : obj['__rfloordiv__'];
    case "Mod":      return obj.nb$remainder    ? obj.nb$remainder :    obj['__rmod__'];
    case "Pow":      return obj.nb$power        ? obj.nb$power :        obj['__rpow__'];
    case "LShift":   return obj.nb$lshift       ? obj.nb$lshift :       obj['__rlshift__'];
    case "RShift":   return obj.nb$rshift       ? obj.nb$rshift :       obj['__rrshift__'];
    case "BitAnd":   return obj.nb$and          ? obj.nb$and :          obj['__rand__'];
    case "BitXor":   return obj.nb$xor          ? obj.nb$xor :          obj['__rxor__'];
    case "BitOr":    return obj.nb$or           ? obj.nb$or :           obj['__ror__'];
  }
};

Sk.abstr.iboNameToSlotFunc_ = function(obj, name) {
  switch (name) {
    case "Add":      return obj.nb$inplace_add          ? obj.nb$inplace_add          : obj['__iadd__'];
    case "Sub":      return obj.nb$inplace_subtract     ? obj.nb$inplace_subtract     : obj['__isub__'];
    case "Mult":     return obj.nb$inplace_multiply     ? obj.nb$inplace_multiply     : obj['__imul__'];
    case "Div":      return obj.nb$inplace_divide       ? obj.nb$inplace_divide       : obj['__idiv__'];
    case "FloorDiv": return obj.nb$inplace_floor_divide ? obj.nb$inplace_floor_divide : obj['__ifloordiv__'];
    case "Mod":      return obj.nb$inplace_remainder;
    case "Pow":      return obj.nb$inplace_power;
    case "LShift":   return obj.nb$inplace_lshift       ? obj.nb$inplace_lshift       : obj['__ilshift__'];
    case "RShift":   return obj.nb$inplace_rshift       ? obj.nb$inplace_rshift       : obj['__irshift__'];
    case "BitAnd":   return obj.nb$inplace_and;
    case "BitOr":    return obj.nb$inplace_or;
    case "BitXor":   return obj.nb$inplace_xor          ? obj.nb$inplace_xor          : obj['__ixor__'];
  }
};

Sk.abstr.binary_op_ = function(v, w, opname)
{
    var ret;
    var vop = Sk.abstr.boNameToSlotFuncLhs_(v, opname);
    if (vop !== undefined)
    {
        if (vop.call) {
            ret = vop.call(v, w);
        } else {
            ret = Sk.misceval.callsim(vop,v,w)
        }
        if (ret !== undefined) return ret;
    }
    var wop = Sk.abstr.boNameToSlotFuncRhs_(w, opname);
    if (wop !== undefined)
    {
        if (wop.call) {
            ret = wop.call(w, v);
        } else {
            ret = Sk.misceval.callsim(wop,w,v)
        }
        if (ret !== undefined) return ret;
    }
    Sk.abstr.binop_type_error(v, w, opname);
};

Sk.abstr.binary_iop_ = function(v, w, opname)
{
    var ret;
    var vop = Sk.abstr.iboNameToSlotFunc_(v, opname);
    if (vop !== undefined)
    {
    if (vop.call) {
            ret = vop.call(v, w);
    } else {  // assume that vop is an __xxx__ type method
        ret = Sk.misceval.callsim(vop,v,w); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined) return ret;
    }
    var wop = Sk.abstr.iboNameToSlotFunc_(w, opname);
    if (wop !== undefined)
    {
    if (wop.call) {
            ret = wop.call(w, v);
    } else { // assume that wop is an __xxx__ type method
        ret = Sk.misceval.callsim(wop,w,v); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined) return ret;
    }
    Sk.abstr.binop_type_error(v, w, opname);
};

//
// handle upconverting a/b from number to long if op causes too big/small a
// result, or if either of the ops are already longs
Sk.abstr.numOpAndPromote = function(a, b, opfn)
{
    if (a === null || b === null) {
        return undefined;
    };

    if (typeof a === "number" && typeof b === "number")
    {
        var ans = opfn(a, b);
        // todo; handle float   Removed RNL (bugs in lng, and it should be a question of precision, not magnitude -- this was just wrong)
        if ( (ans > Sk.builtin.lng.threshold$ || ans < -Sk.builtin.lng.threshold$) && Math.floor(ans) === ans) {
            return [Sk.builtin.lng.fromInt$(a), Sk.builtin.lng.fromInt$(b)];
        } else
            return ans;
    }
    else if (a === undefined || b === undefined) {
        throw new Sk.builtin.NameError('Undefined variable in expression')
    }

    if (a.constructor === Sk.builtin.lng) {
//      if (b.constructor == Sk.builtin.nmber)
//          if (b.skType == Sk.builtin.nmber.float$) {
//              var tmp = new Sk.builtin.nmber(a.tp$str(), Sk.builtin.nmber.float$);
//              return [tmp, b];
//          } else
//              return [a, b.v];
        return [a, b];
    } else if (a.constructor === Sk.builtin.nmber) {
        return [a, b];
    } else if (typeof a === "number") {
        var tmp = new Sk.builtin.nmber(a, undefined);
        return [tmp, b];
    } else
        return undefined;
};

Sk.abstr.boNumPromote_ = {
    "Add": function(a, b) { return a + b; },
    "Sub": function(a, b) { return a - b; },
    "Mult": function(a, b) { return a * b; },
    "Mod": function(a, b) { 
        if (b === 0)
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        var m = a % b; return ((m * b) < 0 ? (m + b) : m); 
    },
    "Div": function(a, b) {
        if (b === 0)
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        else
            return a / b;
    },
    "FloorDiv": function(a, b) { 
        if (b === 0)
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        else
            return Math.floor(a / b); // todo; wrong? neg?
    },
    "Pow": Math.pow,
    "BitAnd": function(a, b) { 
        var m = a & b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "BitOr": function(a, b) {
        var m = a | b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "BitXor": function(a, b) {
        var m = a ^ b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "LShift": function(a, b) { 
    if (b < 0) {
        throw new Sk.builtin.ValueError("negative shift count");
    }
    var m = a << b;
    if (m > a) {
        return m; 
    }
    else {
        // Fail, this will get recomputed with longs
        return a * Math.pow(2, b);
    }
    },
    "RShift": function(a, b) { 
        if (b < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        var m = a >> b;
        if ((a > 0) && (m < 0)) {
            // fix incorrect sign extension
            m = m & (Math.pow(2, 32-b) - 1);
        }
        return m; 
    }
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
        else if (tmp !== undefined &&  tmp.constructor === Sk.builtin.nmber)
        {
            return tmp;
        }
        else if (tmp !== undefined && tmp.constructor === Sk.builtin.lng)
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
goog.exportSymbol("Sk.abstr.numberBinOp", Sk.abstr.numberBinOp);

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
        else if (tmp !== undefined &&  tmp.constructor === Sk.builtin.nmber)
        {
            return tmp;
        }
        else if (tmp !== undefined && tmp.constructor === Sk.builtin.lng)
        {
            return tmp;
        }
        else if (tmp !== undefined)
        {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return Sk.abstr.binary_iop_(v, w, op);
};
goog.exportSymbol("Sk.abstr.numberInplaceBinOp", Sk.abstr.numberInplaceBinOp);

Sk.abstr.numberUnaryOp = function(v, op)
{
    if (op === "Not") return Sk.misceval.isTrue(v) ? Sk.builtin.bool.false$ : Sk.builtin.bool.true$;
    else if (v instanceof Sk.builtin.nmber || v instanceof Sk.builtin.bool) {
    var value = Sk.builtin.asnum$(v);
    if (op === "USub") return new Sk.builtin.nmber(-value, value.skType);
        if (op === "UAdd") return new Sk.builtin.nmber(value, value.skType);
        if (op === "Invert") return new Sk.builtin.nmber(~value, value.skType);
    }
    else
    {
        if (op === "USub" && v.nb$negative) return v.nb$negative();
        if (op === "UAdd" && v.nb$positive) return v.nb$positive();
        if (op === "Invert" && v.nb$invert) return v.nb$invert();
    }

    var vtypename = Sk.abstr.typeName(v);
    throw new Sk.builtin.TypeError("unsupported operand type for " + op + " '" + vtypename + "'");
};
goog.exportSymbol("Sk.abstr.numberUnaryOp", Sk.abstr.numberUnaryOp);

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
    i = Sk.builtin.asnum$(i);
    if (i < 0 && seq.sq$length)
        i += seq.sq$length();
    return i;
};

Sk.abstr.sequenceContains = function(seq, ob)
{
    if (seq.sq$contains) return seq.sq$contains(ob);

    var seqtypename = Sk.abstr.typeName(seq);
    if (!seq.tp$iter) throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
    
    for (var it = seq.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext())
    {
        if (Sk.misceval.richCompareBool(i, ob, "Eq"))
            return true;
    }
    return false;
};

Sk.abstr.sequenceGetItem = function(seq, i)
{
    goog.asserts.fail();
};

Sk.abstr.sequenceSetItem = function(seq, i, x)
{
    goog.asserts.fail();
};

Sk.abstr.sequenceDelItem = function(seq, i)
{
    if (seq.sq$del_item)
    {
        i = Sk.abstr.fixSeqIndex_(seq, i);
        seq.sq$del_item(i);
        return;
    }

    var seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object does not support item deletion");
};

Sk.abstr.sequenceRepeat = function(f, seq, n)
{
    n = Sk.builtin.asnum$(n);
    var count = Sk.misceval.asIndex(n);
    if (count === undefined)
    {
        var ntypename = Sk.abstr.typeName(n);
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + ntypename + "'");
    }
    return f.call(seq, n);
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

    var seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object is unsliceable");
};

Sk.abstr.sequenceDelSlice = function(seq, i1, i2)
{
    if (seq.sq$del_slice)
    {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        seq.sq$del_slice(i1, i2);
        return;
    }

    var seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' doesn't support slice deletion");
};

Sk.abstr.sequenceSetSlice = function(seq, i1, i2, x)
{
    if (seq.sq$ass_slice)
    {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        seq.sq$ass_slice(i1, i2, x);
    }
    else if (seq.mp$ass_subscript)
    {
        seq.mp$ass_subscript(new Sk.builtin.slice(i1, i2), x);
    }
    else
    {
        var seqtypename = Sk.abstr.typeName(seq);
        throw new Sk.builtin.TypeError("'" + seqtypename + "' object doesn't support slice assignment");
    }
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
    if (o !== null)
    {
        if (o.mp$del_subscript) {
            o.mp$del_subscript(key);
            return;
        }
        if (o.sq$ass_item)
        {
            var keyValue = Sk.misceval.asIndex(key);
            if (keyValue === undefined) {
                var keytypename = Sk.abstr.typeName(key);
                throw new Sk.builtin.TypeError("sequence index must be integer, not '" + keytypename + "'");
            }
            Sk.abstr.sequenceDelItem(o, keyValue);
            return;
        }
        // if o is a slice do something else...
    }

    var otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' object does not support item deletion");
};
goog.exportSymbol("Sk.abstr.objectDelItem", Sk.abstr.objectDelItem);

Sk.abstr.objectGetItem = function(o, key)
{
    if (o !== null) 
    {
        if (o.mp$subscript)
            return o.mp$subscript(key);
        else if (Sk.misceval.isIndex(key) && o.sq$item)
            return Sk.abstr.sequenceGetItem(o, Sk.misceval.asIndex(key));
        else if (o.tp$getitem) {
            return o.tp$getitem(key);
        }
    }

    var otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support indexing");
};
goog.exportSymbol("Sk.abstr.objectGetItem", Sk.abstr.objectGetItem);

Sk.abstr.objectSetItem = function(o, key, v)
{
    if (o !== null) 
    {
        if (o.mp$ass_subscript)
            return o.mp$ass_subscript(key, v);
        else if (Sk.misceval.isIndex(key) && o.sq$ass_item)
            return Sk.abstr.sequenceSetItem(o, Sk.misceval.asIndex(key), v);
    else if (o.tp$setitem)
        return o.tp$setitem(key, v);
    }

    var otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support item assignment");
};
goog.exportSymbol("Sk.abstr.objectSetItem", Sk.abstr.objectSetItem);



Sk.abstr.gattr = function(obj, nameJS)
{
    var objname = Sk.abstr.typeName(obj);

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }

    var ret = undefined;

    if (obj['__getattr__']) {
        ret = Sk.misceval.callsim(obj['__getattr__'], obj, nameJS);
    } else if (obj.tp$getattr !== undefined) {
        ret = obj.tp$getattr(nameJS);
    }

    if (ret === undefined) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");       
    }
 
    return ret;
};
goog.exportSymbol("Sk.abstr.gattr", Sk.abstr.gattr);

Sk.abstr.sattr = function(obj, nameJS, data)
{
    var objname = Sk.abstr.typeName(obj);

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    } else if (obj['__setattr__']) {
        Sk.misceval.callsim(obj['__setattr__'], obj, nameJS, data);
    } else if (obj.tp$setattr !== undefined) {
        obj.tp$setattr(nameJS, data);
    } else {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }
};
goog.exportSymbol("Sk.abstr.sattr", Sk.abstr.sattr);

Sk.abstr.iter = function(obj)
{
    if (obj.tp$iter) {
        return obj.tp$iter();
    }
    else {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) + "' object is not iterable");
    }
};
goog.exportSymbol("Sk.abstr.iter", Sk.abstr.iter);

Sk.abstr.iternext = function(it)
{
    return it.tp$iternext();
};
goog.exportSymbol("Sk.abstr.iternext", Sk.abstr.iternext);
