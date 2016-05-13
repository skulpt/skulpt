/**
 * @namespace Sk.abstr
 *
 */
Sk.abstr = {};

//
// Number
//

Sk.abstr.typeName = function (v) {
    var vtypename;
    if (v.tp$name !== undefined) {
        vtypename = v.tp$name;
    } else {
        vtypename = "<invalid type>";
    }
    return vtypename;
};

Sk.abstr.binop_type_error = function (v, w, name) {
    var vtypename = Sk.abstr.typeName(v),
        wtypename = Sk.abstr.typeName(w);

    throw new Sk.builtin.TypeError("unsupported operand type(s) for " + name + ": '" + vtypename + "' and '" + wtypename + "'");
};

Sk.abstr.unop_type_error = function (v, name) {
    var vtypename = Sk.abstr.typeName(v),
        uop = {
            "UAdd"  : "+",
            "USub"  : "-",
            "Invert": "~"
        }[name];

    throw new Sk.builtin.TypeError("bad operand type for unary " + uop + ": '" + vtypename + "'");
};

/**
 * lookup and return the LHS object slot function method.  This coudl be either a builtin slot function or a dunder method defined by the user.
 * @param obj
 * @param name
 * @returns {Object|null|undefined}
 * @private
 */
Sk.abstr.boNameToSlotFuncLhs_ = function (obj, name) {
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
};

Sk.abstr.boNameToSlotFuncRhs_ = function (obj, name) {
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
};

Sk.abstr.iboNameToSlotFunc_ = function (obj, name) {
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
};
Sk.abstr.uoNameToSlotFunc_ = function (obj, name) {
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
};

Sk.abstr.binary_op_ = function (v, w, opname) {
    var wop;
    var ret;
    var vop;

    // All Python inheritance is now enforced with Javascript inheritance
    // (see Sk.abstr.setUpInheritance). This checks if w's type is a strict
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
        wop = Sk.abstr.boNameToSlotFuncRhs_(w, opname);
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

    vop = Sk.abstr.boNameToSlotFuncLhs_(v, opname);
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
        wop = Sk.abstr.boNameToSlotFuncRhs_(w, opname);
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
    Sk.abstr.binop_type_error(v, w, opname);
};

Sk.abstr.binary_iop_ = function (v, w, opname) {
    var wop;
    var ret;
    var vop = Sk.abstr.iboNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v, w);
        } else {  // assume that vop is an __xxx__ type method
            ret = Sk.misceval.callsim(vop, v, w); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    wop = Sk.abstr.iboNameToSlotFunc_(w, opname);
    if (wop !== undefined) {
        if (wop.call) {
            ret = wop.call(w, v);
        } else { // assume that wop is an __xxx__ type method
            ret = Sk.misceval.callsim(wop, w, v); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    Sk.abstr.binop_type_error(v, w, opname);
};
Sk.abstr.unary_op_ = function (v, opname) {
    var ret;
    var vop = Sk.abstr.uoNameToSlotFunc_(v, opname);
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
    Sk.abstr.unop_type_error(v, opname);
};

//
// handle upconverting a/b from number to long if op causes too big/small a
// result, or if either of the ops are already longs
Sk.abstr.numOpAndPromote = function (a, b, opfn) {
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
};

Sk.abstr.boNumPromote_ = {
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
};

Sk.abstr.numberBinOp = function (v, w, op) {
    var tmp;
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined) {
        tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
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

    return Sk.abstr.binary_op_(v, w, op);
};
goog.exportSymbol("Sk.abstr.numberBinOp", Sk.abstr.numberBinOp);

Sk.abstr.numberInplaceBinOp = function (v, w, op) {
    var tmp;
    var numPromoteFunc = Sk.abstr.boNumPromote_[op];
    if (numPromoteFunc !== undefined) {
        tmp = Sk.abstr.numOpAndPromote(v, w, numPromoteFunc);
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

    return Sk.abstr.binary_iop_(v, w, op);
};
goog.exportSymbol("Sk.abstr.numberInplaceBinOp", Sk.abstr.numberInplaceBinOp);

Sk.abstr.numberUnaryOp = function (v, op) {
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

    return Sk.abstr.unary_op_(v, op);
};
goog.exportSymbol("Sk.abstr.numberUnaryOp", Sk.abstr.numberUnaryOp);

//
// Sequence
//

Sk.abstr.fixSeqIndex_ = function (seq, i) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 && seq.sq$length) {
        i += seq.sq$length();
    }
    return i;
};

/**
 * @param {*} seq
 * @param {*} ob
 * @param {boolean=} canSuspend
 */
Sk.abstr.sequenceContains = function (seq, ob, canSuspend) {
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
    special = Sk.abstr.lookupSpecial(seq, "__contains__");
    if (special != null) {
        // method on builtin, provide this arg
        return Sk.misceval.isTrue(Sk.misceval.callsim(special, seq, ob));
    }

    if (!Sk.builtin.checkIterable(seq)) {
        seqtypename = Sk.abstr.typeName(seq);
        throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
    }

    r = Sk.misceval.iterFor(Sk.abstr.iter(seq), function(i) {
        if (Sk.misceval.richCompareBool(i, ob, "Eq")) {
            return new Sk.misceval.Break(true);
        } else {
            return false;
        }
    }, false);

    return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
};

Sk.abstr.sequenceConcat = function (seq1, seq2) {
    var seq1typename;
    if (seq1.sq$concat) {
        return seq1.sq$concat(seq2);
    }
    seq1typename = Sk.abstr.typeName(seq1);
    throw new Sk.builtin.TypeError("'" + seq1typename + "' object can't be concatenated");
};

Sk.abstr.sequenceGetIndexOf = function (seq, ob) {
    var seqtypename;
    var i, it;
    var index;
    if (seq.index) {
        return Sk.misceval.callsim(seq.index, seq, ob);
    }
    if (Sk.builtin.checkIterable(seq)) {
        index = 0;
        for (it = Sk.abstr.iter(seq), i = it.tp$iternext();
             i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
                return new Sk.builtin.int_(index);
            }
            index += 1;
        }
        throw new Sk.builtin.ValueError("sequence.index(x): x not in sequence");
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
};

Sk.abstr.sequenceGetCountOf = function (seq, ob) {
    var seqtypename;
    var i, it;
    var count;
    if (seq.count) {
        return Sk.misceval.callsim(seq.count, seq, ob);
    }
    if (Sk.builtin.checkIterable(seq)) {
        count = 0;
        for (it = Sk.abstr.iter(seq), i = it.tp$iternext();
             i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
                count += 1;
            }
        }
        return new Sk.builtin.int_(count);
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("argument of type '" + seqtypename + "' is not iterable");
};

Sk.abstr.sequenceGetItem = function (seq, i, canSuspend) {
    var seqtypename;
    if (seq.mp$subscript) {
        return seq.mp$subscript(i);
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object is unsubscriptable");
};

Sk.abstr.sequenceSetItem = function (seq, i, x, canSuspend) {
    var seqtypename;
    if (seq.mp$ass_subscript) {
        return seq.mp$ass_subscript(i, x);
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object does not support item assignment");
};

Sk.abstr.sequenceDelItem = function (seq, i) {
    var seqtypename;
    if (seq.sq$del_item) {
        i = Sk.abstr.fixSeqIndex_(seq, i);
        seq.sq$del_item(i);
        return;
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object does not support item deletion");
};

Sk.abstr.sequenceRepeat = function (f, seq, n) {
    var ntypename;
    var count;
    n = Sk.builtin.asnum$(n);
    count = Sk.misceval.asIndex(n);
    if (count === undefined) {
        ntypename = Sk.abstr.typeName(n);
        throw new Sk.builtin.TypeError("can't multiply sequence by non-int of type '" + ntypename + "'");
    }
    return f.call(seq, n);
};

Sk.abstr.sequenceGetSlice = function (seq, i1, i2) {
    var seqtypename;
    if (seq.sq$slice) {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        return seq.sq$slice(i1, i2);
    } else if (seq.mp$subscript) {
        return seq.mp$subscript(new Sk.builtin.slice(i1, i2));
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' object is unsliceable");
};

Sk.abstr.sequenceDelSlice = function (seq, i1, i2) {
    var seqtypename;
    if (seq.sq$del_slice) {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        seq.sq$del_slice(i1, i2);
        return;
    }

    seqtypename = Sk.abstr.typeName(seq);
    throw new Sk.builtin.TypeError("'" + seqtypename + "' doesn't support slice deletion");
};

Sk.abstr.sequenceSetSlice = function (seq, i1, i2, x) {
    var seqtypename;
    if (seq.sq$ass_slice) {
        i1 = Sk.abstr.fixSeqIndex_(seq, i1);
        i2 = Sk.abstr.fixSeqIndex_(seq, i2);
        seq.sq$ass_slice(i1, i2, x);
    } else if (seq.mp$ass_subscript) {
        seq.mp$ass_subscript(new Sk.builtin.slice(i1, i2), x);
    } else {
        seqtypename = Sk.abstr.typeName(seq);
        throw new Sk.builtin.TypeError("'" + seqtypename + "' object doesn't support slice assignment");
    }
};

// seq - Python object to unpack
// n   - JavaScript number of items to unpack
Sk.abstr.sequenceUnpack = function (seq, n) {
    var res = [];
    var it, i;

    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not iterable");
    }

    for (it = Sk.abstr.iter(seq), i = it.tp$iternext();
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
};

//
// Object
//

Sk.abstr.objectFormat = function (obj, format_spec) {
    var meth; // PyObject
    var result; // PyObject

    // If no format_spec is provided, use an empty string
    if(format_spec == null) {
        format_spec = "";
    }

    // Find the (unbound!) __format__ method (a borrowed reference)
    meth = Sk.abstr.lookupSpecial(obj, "__format__");
    if (meth == null) {
        throw new Sk.builtin.TypeError("Type " + Sk.abstr.typeName(obj) + "doesn't define __format__");
    }

    // And call it
    result = Sk.misceval.callsim(meth, obj, format_spec);
    if (!Sk.builtin.checkString(result)) {
        throw new Sk.builtin.TypeError("__format__ must return a str, not " + Sk.abstr.typeName(result));
    }

    return result;
};

Sk.abstr.objectAdd = function (a, b) {
    var btypename;
    var atypename;
    if (a.nb$add) {
        return a.nb$add(b);
    }

    atypename = Sk.abstr.typeName(a);
    btypename = Sk.abstr.typeName(b);
    throw new Sk.builtin.TypeError("unsupported operand type(s) for +: '" + atypename + "' and '" + btypename + "'");
};

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
Sk.abstr.objectNegative = function (obj) {
    var objtypename;
    var obj_asnum = Sk.builtin.asnum$(obj); // this will also convert bool type to int

    if (obj instanceof Sk.builtin.bool) {
        obj = new Sk.builtin.int_(obj_asnum);
    }

    if (obj.nb$negative) {
        return obj.nb$negative();
    }

    objtypename = Sk.abstr.typeName(obj);
    throw new Sk.builtin.TypeError("bad operand type for unary -: '" + objtypename + "'");
};

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
Sk.abstr.objectPositive = function (obj) {
    var objtypename = Sk.abstr.typeName(obj);
    var obj_asnum = Sk.builtin.asnum$(obj); // this will also convert bool type to int

    if (obj instanceof Sk.builtin.bool) {
        obj = new Sk.builtin.int_(obj_asnum);
    }

    if (obj.nb$negative) {
        return obj.nb$positive();
    }

    throw new Sk.builtin.TypeError("bad operand type for unary +: '" + objtypename + "'");
};

Sk.abstr.objectDelItem = function (o, key) {
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
                keytypename = Sk.abstr.typeName(key);
                throw new Sk.builtin.TypeError("sequence index must be integer, not '" + keytypename + "'");
            }
            Sk.abstr.sequenceDelItem(o, keyValue);
            return;
        }
        // if o is a slice do something else...
    }

    otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' object does not support item deletion");
};
goog.exportSymbol("Sk.abstr.objectDelItem", Sk.abstr.objectDelItem);

Sk.abstr.objectGetItem = function (o, key, canSuspend) {
    var otypename;
    if (o !== null) {
        if (o.tp$getitem) {
            return o.tp$getitem(key, canSuspend);
        } else if (o.mp$subscript) {
            return o.mp$subscript(key, canSuspend);
        } else if (Sk.misceval.isIndex(key) && o.sq$item) {
            return Sk.abstr.sequenceGetItem(o, Sk.misceval.asIndex(key), canSuspend);
        }
    }

    otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support indexing");
};
goog.exportSymbol("Sk.abstr.objectGetItem", Sk.abstr.objectGetItem);

Sk.abstr.objectSetItem = function (o, key, v, canSuspend) {
    var otypename;
    if (o !== null) {
        if (o.tp$setitem) {
            return o.tp$setitem(key, v, canSuspend);
        } else if (o.mp$ass_subscript) {
            return o.mp$ass_subscript(key, v, canSuspend);
        } else if (Sk.misceval.isIndex(key) && o.sq$ass_item) {
            return Sk.abstr.sequenceSetItem(o, Sk.misceval.asIndex(key), v, canSuspend);
        }
    }

    otypename = Sk.abstr.typeName(o);
    throw new Sk.builtin.TypeError("'" + otypename + "' does not support item assignment");
};
goog.exportSymbol("Sk.abstr.objectSetItem", Sk.abstr.objectSetItem);


Sk.abstr.gattr = function (obj, nameJS, canSuspend) {
    var ret, f;
    var objname = Sk.abstr.typeName(obj);

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }


    if (obj.tp$getattr !== undefined) {
        f = obj.tp$getattr("__getattribute__");
    }

    if (f !== undefined) {
        ret = Sk.misceval.callsimOrSuspend(f, new Sk.builtin.str(nameJS));
    }

    ret = Sk.misceval.chain(ret, function(ret) {
        var f;

        if (ret === undefined && obj.tp$getattr !== undefined) {
            ret = obj.tp$getattr(nameJS);

            if (ret === undefined) {
                f = obj.tp$getattr("__getattr__");

                if (f !== undefined) {
                    ret = Sk.misceval.callsimOrSuspend(f, new Sk.builtin.str(nameJS));
                }
            }
        }
        return ret;
    }, function(r) {
        if (r === undefined) {
            throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
        }
        return r;
    });

    return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
};
goog.exportSymbol("Sk.abstr.gattr", Sk.abstr.gattr);

Sk.abstr.sattr = function (obj, nameJS, data, canSuspend) {
    var objname = Sk.abstr.typeName(obj), r, setf;

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }

    if (obj.tp$getattr !== undefined) {
        setf = obj.tp$getattr("__setattr__");
        if (setf !== undefined) {
            r = Sk.misceval.callsimOrSuspend(setf, new Sk.builtin.str(nameJS), data);
            return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
        }
    }

    if (obj.tp$setattr !== undefined) {
        obj.tp$setattr(nameJS, data);
    } else {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + nameJS + "'");
    }
};
goog.exportSymbol("Sk.abstr.sattr", Sk.abstr.sattr);


Sk.abstr.iternext = function (it, canSuspend) {
    return it.tp$iternext(canSuspend);
};
goog.exportSymbol("Sk.abstr.iternext", Sk.abstr.iternext);


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

Sk.abstr.iter = function(obj) {
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
        this.getitem = Sk.abstr.lookupSpecial(obj, "__getitem__");
        this.tp$iternext = function () {
            var ret;
            try {
                ret = Sk.misceval.callsim(this.getitem, this.myobj, Sk.ffi.remapToPy(this.idx));
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
        iter =  Sk.abstr.lookupSpecial(obj,"__iter__");
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
    getit = Sk.abstr.lookupSpecial(obj, "__getitem__");
    if (getit) {
        // create internal iterobject if __getitem__
        return new seqIter(obj);
    }
    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) + "' object is not iterable");
};
goog.exportSymbol("Sk.abstr.iter", Sk.abstr.iter);

/**
 * Special method look up. First try getting the method via
 * internal dict and getattr. If getattr is not present (builtins)
 * try if method is defined on the object itself
 *
 * @returns {null|Object} Return null if not found or the function
 */
Sk.abstr.lookupSpecial = function(op, str) {
    var res;
    var obtp;
    if (op.ob$type) {
        obtp = op.ob$type;
    } else {
        return null;
    }

    return Sk.builtin.type.typeLookup(obtp, str);
};
goog.exportSymbol("Sk.abstr.lookupSpecial", Sk.abstr.lookupSpecial);

/**
 * Mark a class as unhashable and prevent its `__hash__` function from being called.
 * @param  {function(...[?])} thisClass The class to mark as unhashable.
 * @return {undefined}
 */
Sk.abstr.markUnhashable = function (thisClass) {
    var proto = thisClass.prototype;
    proto.__hash__ = Sk.builtin.none.none$;
    proto.tp$hash = Sk.builtin.none.none$;
};

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
Sk.abstr.setUpInheritance = function (childName, child, parent) {
    goog.inherits(child, parent);
    child.prototype.tp$base = parent;
    child.prototype.tp$name = childName;
    child.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(childName, child);
};

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
Sk.abstr.superConstructor = function (thisClass, self, args) {
    var argumentsForConstructor = Array.prototype.slice.call(arguments, 2);
    thisClass.prototype.tp$base.apply(self, argumentsForConstructor);
};
