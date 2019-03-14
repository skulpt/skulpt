import { remapToPy } from './ffi';
//
// Number
//

export function typeName(v) {
    var vtypename;
    if (v.tp$name !== undefined) {
        vtypename = v.tp$name;
    } else {
        vtypename = "<invalid type>";
    }
    return vtypename;
}

function binop_type_error(v, w, name) {
    var vtypename = typeName(v),
        wtypename = typeName(w);

    throw new Sk.builtin.TypeError("unsupported operand type(s) for " + name + ": '" + vtypename + "' and '" + wtypename + "'");
}

function unop_type_error(v, name) {
    var vtypename = typeName(v),
        uop = {
            "UAdd"  : "+",
            "USub"  : "-",
            "Invert": "~"
        }[name];

    throw new Sk.builtin.TypeError("bad operand type for unary " + uop + ": '" + vtypename + "'");
}

/**
 * lookup and return the LHS object slot function method.  This coudl be either a builtin slot function or a dunder method defined by the user.
 * @param obj
 * @param name
 * @returns {Object|null|undefined}
 * @private
 */
function boNameToSlotFuncLhs_(obj, name) {
    if (obj === null) {
        return undefined;
    }

    switch (name) {
    case "Add":
        return obj.nb$add ? obj.nb$add : obj["__add__"];
    case "Sub":
        return obj.nb$subtract ? obj.nb$subtract : obj["__sub__"];
    case "Mult":
        return obj.nb$multiply ? obj.nb$multiply : obj["__mul__"];
    case "Div":
        return obj.nb$divide ? obj.nb$divide : obj["__div__"];
    case "FloorDiv":
        return obj.nb$floor_divide ? obj.nb$floor_divide : obj["__floordiv__"];
    case "Mod":
        return obj.nb$remainder ? obj.nb$remainder : obj["__mod__"];
    case "DivMod":
        return obj.nb$divmod ? obj.nb$divmod : obj["__divmod__"];
    case "Pow":
        return obj.nb$power ? obj.nb$power : obj["__pow__"];
    case "LShift":
        return obj.nb$lshift ? obj.nb$lshift : obj["__lshift__"];
    case "RShift":
        return obj.nb$rshift ? obj.nb$rshift : obj["__rshift__"];
    case "BitAnd":
        return obj.nb$and ? obj.nb$and : obj["__and__"];
    case "BitXor":
        return obj.nb$xor ? obj.nb$xor : obj["__xor__"];
    case "BitOr":
        return obj.nb$or ? obj.nb$or : obj["__or__"];
    }
}

function boNameToSlotFuncRhs_(obj, name) {
    if (obj === null) {
        return undefined;
    }

    switch (name) {
    case "Add":
        return obj.nb$reflected_add ? obj.nb$reflected_add : obj["__radd__"];
    case "Sub":
        return obj.nb$reflected_subtract ? obj.nb$reflected_subtract : obj["__rsub__"];
    case "Mult":
        return obj.nb$reflected_multiply ? obj.nb$reflected_multiply : obj["__rmul__"];
    case "Div":
        return obj.nb$reflected_divide ? obj.nb$reflected_divide : obj["__rdiv__"];
    case "FloorDiv":
        return obj.nb$reflected_floor_divide ? obj.nb$reflected_floor_divide : obj["__rfloordiv__"];
    case "Mod":
        return obj.nb$reflected_remainder ? obj.nb$reflected_remainder : obj["__rmod__"];
    case "DivMod":
        return obj.nb$reflected_divmod ? obj.nb$reflected_divmod : obj["__rdivmod__"];
    case "Pow":
        return obj.nb$reflected_power ? obj.nb$reflected_power : obj["__rpow__"];
    case "LShift":
        return obj.nb$reflected_lshift ? obj.nb$reflected_lshift : obj["__rlshift__"];
    case "RShift":
        return obj.nb$reflected_rshift ? obj.nb$reflected_rshift : obj["__rrshift__"];
    case "BitAnd":
        return obj.nb$reflected_and ? obj.nb$reflected_and : obj["__rand__"];
    case "BitXor":
        return obj.nb$reflected_xor ? obj.nb$reflected_xor : obj["__rxor__"];
    case "BitOr":
        return obj.nb$reflected_or ? obj.nb$reflected_or : obj["__ror__"];
    }
}

function iboNameToSlotFunc_(obj, name) {
    switch (name) {
    case "Add":
        return obj.nb$inplace_add ? obj.nb$inplace_add : obj["__iadd__"];
    case "Sub":
        return obj.nb$inplace_subtract ? obj.nb$inplace_subtract : obj["__isub__"];
    case "Mult":
        return obj.nb$inplace_multiply ? obj.nb$inplace_multiply : obj["__imul__"];
    case "Div":
        return obj.nb$inplace_divide ? obj.nb$inplace_divide : obj["__idiv__"];
    case "FloorDiv":
        return obj.nb$inplace_floor_divide ? obj.nb$inplace_floor_divide : obj["__ifloordiv__"];
    case "Mod":
        return obj.nb$inplace_remainder;
    case "Pow":
        return obj.nb$inplace_power;
    case "LShift":
        return obj.nb$inplace_lshift ? obj.nb$inplace_lshift : obj["__ilshift__"];
    case "RShift":
        return obj.nb$inplace_rshift ? obj.nb$inplace_rshift : obj["__irshift__"];
    case "BitAnd":
        return obj.nb$inplace_and;
    case "BitOr":
        return obj.nb$inplace_or;
    case "BitXor":
        return obj.nb$inplace_xor ? obj.nb$inplace_xor : obj["__ixor__"];
    }
}

function uoNameToSlotFunc_(obj, name) {
    if (obj === null) {
        return undefined;
    }
    switch (name) {
    case "USub":
        return obj.nb$negative ? obj.nb$negative : obj["__neg__"];
    case "UAdd":
        return obj.nb$positive ? obj.nb$positive : obj["__pos__"];
    case "Invert":
        return obj.nb$invert ? obj.nb$invert : obj["__invert__"];
    }
}

function binary_op_(v, w, opname) {
    var wop;
    var ret;
    var vop;

    // All Python inheritance is now enforced with Javascript inheritance
    // (see setUpInheritance). This checks if w's type is a strict
    // subclass of v's type
    var w_is_subclass = w.constructor.prototype instanceof v.constructor;

    // From the Python 2.7 docs:
    //
    // "If the right operand’s type is a subclass of the left operand’s type and
    // that subclass provides the reflected method for the operation, this
    // method will be called before the left operand’s non-reflected method.
    // This behavior allows subclasses to override their ancestors’ operations."
    //
    // -- https://docs.python.org/2/reference/datamodel.html#index-92

    if (w_is_subclass) {
        wop = boNameToSlotFuncRhs_(w, opname);
        if (wop !== undefined) {
            if (wop.call) {
                ret = wop.call(w, v);
            } else {
                ret = Sk.misceval.callsim(wop, w, v);
            }
            if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }

    vop = boNameToSlotFuncLhs_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v, w);
        } else {
            ret = Sk.misceval.callsim(vop, v, w);
        }
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    // Don't retry RHS if failed above
    if (!w_is_subclass) {
        wop = boNameToSlotFuncRhs_(w, opname);
        if (wop !== undefined) {
            if (wop.call) {
                ret = wop.call(w, v);
            } else {
                ret = Sk.misceval.callsim(wop, w, v);
            }
            if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }
    binop_type_error(v, w, opname);
}

function binary_iop_(v, w, opname) {
    var wop;
    var ret;
    var vop = iboNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v, w);
        } else {  // assume that vop is an __xxx__ type method
            ret = Sk.misceval.callsim(vop, v, w);
        }
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    // If there wasn't an in-place operation, fall back to the binop
    return binary_op_(v, w, opname);
}

function unary_op_(v, opname) {
    var ret;
    var vop = uoNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v);
        } else {  // assume that vop is an __xxx__ type method
            ret = Sk.misceval.callsim(vop, v); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined) {
            return ret;
        }
    }
    unop_type_error(v, opname);
}

//
// handle upconverting a/b from number to long if op causes too big/small a
// result, or if either of the ops are already longs
function numOpAndPromote(a, b, opfn) {
    var tmp;
    var ans;
    if (a === null || b === null) {
        return undefined;
    }

    if (typeof a === "number" && typeof b === "number") {
        ans = opfn(a, b);
        // todo; handle float   Removed RNL (bugs in lng, and it should be a question of precision, not magnitude -- this was just wrong)
        if ((ans > Sk.builtin.int_.threshold$ || ans < -Sk.builtin.int_.threshold$) && Math.floor(ans) === ans) {
            return [Sk.builtin.lng.fromInt$(a), Sk.builtin.lng.fromInt$(b)];
        } else {
            return ans;
        }
    } else if (a === undefined || b === undefined) {
        throw new Sk.builtin.NameError("Undefined variable in expression");
    }

    if (a.constructor === Sk.builtin.lng) {
        return [a, b];
    } else if ((a.constructor === Sk.builtin.int_ ||
                a.constructor === Sk.builtin.float_) &&
                b.constructor === Sk.builtin.complex) {
        // special case of upconverting nmber and complex
        // can we use here the Sk.builtin.checkComplex() method?
        tmp = new Sk.builtin.complex(a);
        return [tmp, b];
    } else if (a.constructor === Sk.builtin.int_ ||
               a.constructor === Sk.builtin.float_) {
        return [a, b];
    } else if (typeof a === "number") {
        tmp = Sk.builtin.assk$(a);
        return [tmp, b];
    } else {
        return undefined;
    }
}

boNumPromote_ = {
    "Add"     : function (a, b) {
        return a + b;
    },
    "Sub"     : function (a, b) {
        return a - b;
    },
    "Mult"    : function (a, b) {
        return a * b;
    },
    "Mod"     : function (a, b) {
        var m;
        if (b === 0) {
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        }
        m = a % b;
        return ((m * b) < 0 ? (m + b) : m);
    },
    "Div"     : function (a, b) {
        if (b === 0) {
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        } else {
            return a / b;
        }
    },
    "FloorDiv": function (a, b) {
        if (b === 0) {
            throw new Sk.builtin.ZeroDivisionError("division or modulo by zero");
        } else {
            return Math.floor(a / b);
        } // todo; wrong? neg?
    },
    "Pow"     : Math.pow,
    "BitAnd"  : function (a, b) {
        var m = a & b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "BitOr"   : function (a, b) {
        var m = a | b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "BitXor"  : function (a, b) {
        var m = a ^ b;
        if (m < 0) {
            m = m + 4294967296; // convert back to unsigned
        }
        return m;
    },
    "LShift"  : function (a, b) {
        var m;
        if (b < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        m = a << b;
        if (m > a) {
            return m;
        } else {
            // Fail, this will get recomputed with longs
            return a * Math.pow(2, b);
        }
    },
    "RShift"  : function (a, b) {
        var m;
        if (b < 0) {
            throw new Sk.builtin.ValueError("negative shift count");
        }
        m = a >> b;
        if ((a > 0) && (m < 0)) {
            // fix incorrect sign extension
            m = m & (Math.pow(2, 32 - b) - 1);
        }
        return m;
    }
}

export function numberBinOp(v, w, op) {
    var tmp;
    var numPromoteFunc = boNumPromote_[op];
    if (numPromoteFunc !== undefined) {
        tmp = numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number") {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.int_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.float_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.lng) {
            return tmp;
        } else if (tmp !== undefined) {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return binary_op_(v, w, op);
}

export function numberInplaceBinOp(v, w, op) {
    var tmp;
    var numPromoteFunc = boNumPromote_[op];
    if (numPromoteFunc !== undefined) {
        tmp = numOpAndPromote(v, w, numPromoteFunc);
        if (typeof tmp === "number") {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.int_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.float_) {
            return tmp;
        } else if (tmp !== undefined && tmp.constructor === Sk.builtin.lng) {
            return tmp;
        } else if (tmp !== undefined) {
            v = tmp[0];
            w = tmp[1];
        }
    }

    return binary_iop_(v, w, op);
}

export function numberUnaryOp(v, op) {
    var value;
    if (op === "Not") {
        return Sk.misceval.isTrue(v) ? Sk.builtin.bool.false$ : Sk.builtin.bool.true$;
    } else if (v instanceof Sk.builtin.bool) {
        value = Sk.builtin.asnum$(v);
        if (op === "USub") {
            return new Sk.builtin.int_(-value);
        }
        if (op === "UAdd") {
            return new Sk.builtin.int_(value);
        }
        if (op === "Invert") {
            return new Sk.builtin.int_(~value);
        }
    } else {
        if (op === "USub" && v.nb$negative) {
            return v.nb$negative();
        }
        if (op === "UAdd" && v.nb$positive) {
            return v.nb$positive();
        }
        if (op === "Invert" && v.nb$invert) {
            return v.nb$invert();
        }
    }

    return unary_op_(v, op);
}

//
// Sequence
//

export function fixSeqIndex_(seq, i) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 && seq.sq$length) {
        i += seq.sq$length();
    }
    return i;
}

/**
 * @param {*} seq
 * @param {*} ob
 * @param {boolean=} canSuspend
 */
export function sequenceContains(seq, ob, canSuspend) {
    var seqtypename;
    var special;
    var r;

    if (seq.sq$contains) {
        return seq.sq$contains(ob);
    }

    /**
     *  Look for special method and call it, we have to distinguish between built-ins and
     *  python objects
     */
    special = lookupSpecial(seq, "__contains__");
    if (special != null) {
        // method on builtin, provide this arg
        return Sk.misceval.isTrue(Sk.misceval.callsim(special, seq, ob));
    }

    if (!Sk.builtin.checkIterable(seq)) {
        seqtypename = typeName(seq);
        throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
    }

    r = Sk.misceval.iterFor(iter(seq), function(i) {
        if (Sk.misceval.richCompareBool(i, ob, "Eq")) {
            return new Sk.misceval.Break(true);
        } else {
            return false;
        }
    }, false);

    return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
}

export function sequenceConcat(seq1, seq2) {
    var seq1typename;
    if (seq1.sq$concat) {
        return seq1.sq$concat(seq2);
    }
    seq1typename = typeName(seq1);
    throw new Sk.builtin.TypeError("'" + seq1typename + "' object can't be concatenated");
}

export function sequenceGetIndexOf(seq, ob) {
    var seqtypename;
    var i, it;
    var index;
    if (seq.index) {
        return Sk.misceval.callsim(seq.index, seq, ob);
    }
    if (Sk.builtin.checkIterable(seq)) {
        index = 0;
        for (it = iter(seq), i = it.tp$iternext();
             i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
                return new Sk.builtin.int_(index);
            }
            index += 1;
        }
        throw new Sk.builtin.ValueError("sequence.index(x): x not in sequence");
    }

    seqtypename = typeName(seq);
    throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
}

export function sequenceGetCountOf(seq, ob) {
    var seqtypename;
    var i, it;
    var count;
    if (seq.count) {
        return Sk.misceval.callsim(seq.count, seq, ob);
    }
    if (Sk.builtin.checkIterable(seq)) {
        count = 0;
        for (it = iter(seq), i = it.tp$iternext();
             i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
                count += 1;
            }
        }
        return new Sk.builtin.int_(count);
    }

    seqtypename = typeName(seq);
    throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
}

export function sequenceGetItem(seq, i, canSuspend) {
    var seqtypename;
    if (seq.mp$subscript) {
        return seq.mp$subscript(i);
    }

    seqtypename = typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object is unsubscriptable");
}

export function sequenceSetItem(seq, i, x, canSuspend) {
    var seqtypename;
    if (seq.mp$ass_subscript) {
        return seq.mp$ass_subscript(i, x);
    }

    seqtypename = typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object does not support item assignment");
}

export function sequenceDelItem(seq, i) {
    var seqtypename;
    if (seq.sq$del_item) {
        i = fixSeqIndex_(seq, i);
        seq.sq$del_item(i);
        return;
    }

    seqtypename = typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object does not support item deletion");
}

export function sequenceRepeat(f, seq, n) {
    var ntypename;
    var count;
    n = Sk.builtin.asnum$(n);
    count = Sk.misceval.asIndex(n);
    if (count === undefined) {
        ntypename = typeName(n);
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + ntypename + "'");
    }
    return f.call(seq, n);
}

export function sequenceGetSlice(seq, i1, i2) {
    var seqtypename;
    if (seq.sq$slice) {
        i1 = fixSeqIndex_(seq, i1);
        i2 = fixSeqIndex_(seq, i2);
        return seq.sq$slice(i1, i2);
    } else if (seq.mp$subscript) {
        return seq.mp$subscript(new Sk.builtin.slice(i1, i2));
    }

    seqtypename = typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object is unsliceable");
}

export function sequenceDelSlice(seq, i1, i2) {
    var seqtypename;
    if (seq.sq$del_slice) {
        i1 = fixSeqIndex_(seq, i1);
        i2 = fixSeqIndex_(seq, i2);
        seq.sq$del_slice(i1, i2);
        return;
    }

    seqtypename = typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' doesn't support slice deletion");
}

export function sequenceSetSlice(seq, i1, i2, x) {
    var seqtypename;
    if (seq.sq$ass_slice) {
        i1 = fixSeqIndex_(seq, i1);
        i2 = fixSeqIndex_(seq, i2);
        seq.sq$ass_slice(i1, i2, x);
    } else if (seq.mp$ass_subscript) {
        seq.mp$ass_subscript(new Sk.builtin.slice(i1, i2), x);
    } else {
        seqtypename = typeName(seq);
        throw new Sk.builtin.TypeError("'" + seqtypename + "' object doesn't support slice assignment");
    }
}

// seq - Python object to unpack
// n   - JavaScript number of items to unpack
export function sequenceUnpack(seq, n) {
    var res = [];
    var it, i;

    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + typeName(seq) + "' object is not iterable");
    }

    for (it = iter(seq), i = it.tp$iternext();
         (i !== undefined) && (res.length < n);
         i = it.tp$iternext()) {
        res.push(i);
    }

    if (res.length < n) {
        throw new Sk.builtin.ValueError("need more than " + res.length + " values to unpack");
    }
    if (i !== undefined) {
        throw new Sk.builtin.ValueError("too many values to unpack");
    }

    // Return Javascript array of items
    return res;
}

//
// Object
//

export function objectFormat(obj, format_spec) {
    var meth; // PyObject
    var result; // PyObject

    // Find the (unbound!) __format__ method (a borrowed reference)
    meth = lookupSpecial(obj, "__format__");
    if (meth == null) {
        throw new Sk.builtin.TypeError("Type " + typeName(obj) + " doesn't define __format__");
    }

    // And call it
    result = Sk.misceval.callsim(meth, obj, format_spec);
    if (!Sk.builtin.checkString(result)) {
        throw new Sk.builtin.TypeError("__format__ must return a str, not " + typeName(result));
    }

    return result;
}

export function objectAdd(a, b) {
    var btypename;
    var atypename;
    if (a.nb$add) {
        return a.nb$add(b);
    }

    atypename = typeName(a);
    btypename = typeName(b);
    throw new Sk.builtin.TypeError("unsupported operand type(s) for +: '" + atypename + "' and '" + btypename + "'");
}

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
export function objectNegative(obj) {
    var objtypename;
    var obj_asnum = Sk.builtin.asnum$(obj); // this will also convert bool type to int

    if (obj instanceof Sk.builtin.bool) {
        obj = new Sk.builtin.int_(obj_asnum);
    }

    if (obj.nb$negative) {
        return obj.nb$negative();
    }

    objtypename = typeName(obj);
    throw new Sk.builtin.TypeError("bad operand type for unary -: '" + objtypename + "'");
}

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
export function objectPositive(obj) {
    var objtypename = typeName(obj);
    var obj_asnum = Sk.builtin.asnum$(obj); // this will also convert bool type to int

    if (obj instanceof Sk.builtin.bool) {
        obj = new Sk.builtin.int_(obj_asnum);
    }

    if (obj.nb$negative) {
        return obj.nb$positive();
    }

    throw new Sk.builtin.TypeError("bad operand type for unary +: '" + objtypename + "'");
}

export function objectDelItem(o, key) {
    var otypename;
    var keytypename;
    var keyValue;
    if (o !== null) {
        if (o.mp$del_subscript) {
            o.mp$del_subscript(key);
            return;
        }
        if (o.sq$ass_item) {
            keyValue = Sk.misceval.asIndex(key);
            if (keyValue === undefined) {
                keytypename = typeName(key);
                throw new Sk.builtin.TypeError("sequence index must be integer, not '" + keytypename + "'");
            }
            sequenceDelItem(o, keyValue);
            return;
        }
        // if o is a slice do something else...
    }

    otypename = typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' object does not support item deletion");
}

export function objectGetItem(o, key, canSuspend) {
    var otypename;
    if (o !== null) {
        if (o.tp$getitem) {
            return o.tp$getitem(key, canSuspend);
        } else if (o.mp$subscript) {
            return o.mp$subscript(key, canSuspend);
        } else if (Sk.misceval.isIndex(key) && o.sq$item) {
            return sequenceGetItem(o, Sk.misceval.asIndex(key), canSuspend);
        }
    }

    otypename = typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support indexing");
}

export function objectSetItem(o, key, v, canSuspend) {
    var otypename;
    if (o !== null) {
        if (o.tp$setitem) {
            return o.tp$setitem(key, v, canSuspend);
        } else if (o.mp$ass_subscript) {
            return o.mp$ass_subscript(key, v, canSuspend);
        } else if (Sk.misceval.isIndex(key) && o.sq$ass_item) {
            return sequenceSetItem(o, Sk.misceval.asIndex(key), v, canSuspend);
        }
    }

    otypename = typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support item assignment");
}


export function gattr(obj, nameJS, canSuspend) {
    var ret, f;
    var objname = typeName(obj);

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }

    if (obj.tp$getattr !== undefined) {
        ret = obj.tp$getattr(nameJS, canSuspend);
    }

    ret = Sk.misceval.chain(ret, function(r) {
        if (r === undefined) {
            throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
        }
        return r;
    });

    return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
}


export function sattr(obj, nameJS, data, canSuspend) {
    var objname = typeName(obj), r, setf;

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }

    if (obj.tp$setattr !== undefined) {
        return obj.tp$setattr(nameJS, data, canSuspend);
    } else {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }
}


export function iternext(it, canSuspend) {
    return it.tp$iternext(canSuspend);
}


/**
 * Get the iterator for a Python object  This iterator could be one of the following.
 * This is the preferred mechanism for consistently getting the correct iterator.  You should
 * not just use tp$iter because that could lead to incorrect behavior of a user created class.
 *
 * - tp$iter
 * - A user defined `__iter__` method
 * - A user defined `__getitem__` method
 *
 * @param obj
 *
 * @throws {Sk.builtin.TypeError}
 * @returns {Object}
 */

export function iter(obj) {
    var iter;
    var getit;
    var ret;

    /**
     * Builds an iterator around classes that have a __getitem__ method.
     *
     * @constructor
     */
    var seqIter = function (obj) {
        this.idx = 0;
        this.myobj = obj;
        this.getitem = lookupSpecial(obj, "__getitem__");
        this.tp$iternext = function () {
            var ret;
            try {
                ret = Sk.misceval.callsim(this.getitem, this.myobj, ToPy(this.idx));
            } catch (e) {
                if (e instanceof Sk.builtin.IndexError || e instanceof Sk.builtin.StopIteration) {
                    return undefined;
                } else {
                    throw e;
                }
            }
            this.idx++;
            return ret;
        };
    };

    if (obj.tp$getattr) {
        iter =  lookupSpecial(obj,"__iter__");
        if (iter) {
            ret = Sk.misceval.callsim(iter, obj);
            if (ret.tp$iternext) {
                return ret;
            }
        }
    }
    if (obj.tp$iter) {
        try {  // catch and ignore not iterable error here.
            ret = obj.tp$iter();
            if (ret.tp$iternext) {
                return ret;
            }
        } catch (e) { }
    }
    getit = lookupSpecial(obj, "__getitem__");
    if (getit) {
        // create internal iterobject if __getitem__
        return new seqIter(obj);
    }
    throw new Sk.builtin.TypeError("'" + typeName(obj) + "' object is not iterable");
}

/**
 * Special method look up. First try getting the method via
 * internal dict and getattr. If getattr is not present (builtins)
 * try if method is defined on the object itself
 *
 * @returns {null|Object} Return null if not found or the function
 */
export function lookupSpecial(op, str) {
    var res;
    var obtp;
    if (op.ob$type) {
        obtp = op.ob$type;
    } else {
        return null;
    }

    return Sk.builtin.type.typeLookup(obtp, str);
}

/**
 * Mark a class as unhashable and prevent its `__hash__` function from being called.
 * @param  {function(...[?])} thisClass The class to mark as unhashable.
 * @return {undefined}
 */
export function markUnhashable(thisClass) {
    var proto = thisClass.prototype;
    proto.__hash__ = Sk.builtin.none.none$;
    proto.tp$hash = Sk.builtin.none.none$;
}

/**
 * Set up inheritance between two Python classes. This allows only for single
 * inheritance -- multiple inheritance is not supported by Javascript.
 *
 * Javascript's inheritance is prototypal. This means that properties must
 * be defined on the superclass' prototype in order for subclasses to inherit
 * them.
 *
 * ```
 * Sk.superclass.myProperty                 # will NOT be inherited
 * Sk.superclass.prototype.myProperty       # will be inherited
 * ```
 *
 * In order for a class to be subclassable, it must (directly or indirectly)
 * inherit from Sk.builtin.object so that it will be properly initialized in
 * {@link Sk.doOneTimeInitialization} (in src/import.js). Further, all Python
 * builtins should inherit from Sk.builtin.object.
 *
 * @param {string} childName The Python name of the child (subclass).
 * @param {function(...[?])} child     The subclass.
 * @param {function(...[?])} parent    The superclass.
 * @return {undefined}
 */
export function setUpInheritance(childName, child, parent) {
    child.prototype.tp$base = parent;
    child.prototype.tp$name = childName;
    child.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(childName, child);
}

/**
 * Call the super constructor of the provided class, with the object `self` as
 * the `this` value of that constructor. Any arguments passed to this function
 * after `self` will be passed as-is to the constructor.
 *
 * @param  {function(...[?])} thisClass The subclass.
 * @param  {Object} self      The instance of the subclas.
 * @param  {...?} args Arguments to pass to the constructor.
 * @return {undefined}
 */
export function superConstructor(thisClass, self, args) {
    var argumentsForConstructor = Array.prototype.slice.call(arguments, 2);
    thisClass.prototype.tp$base.apply(self, argumentsForConstructor);
}
