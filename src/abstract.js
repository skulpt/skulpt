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
    const vtypename = Sk.abstr.typeName(v);
    const wtypename = Sk.abstr.typeName(w);

    throw new Sk.builtin.TypeError("unsupported operand type(s) for " + name + ": '" + vtypename + "' and '" + wtypename + "'");
};

Sk.abstr.unop_type_error = function (v, name) {
    var vtypename = Sk.abstr.typeName(v),
        uop = {
            UAdd: "+",
            USub: "-",
            Invert: "~",
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
        case "MatMult":
            if (Sk.__future__.python3) {
                return obj.tp$matmul ? obj.tp$matmul : obj["__matmul__"];
            }
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
        case "MatMult":
            if (Sk.__future__.python3) {
                return obj.tp$reflected_matmul ? obj.tp$reflected_matmul : obj["__rmatmul__"];
            }
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
        case "MatMult":
            if (Sk.__future__.python3) {
                return obj.tp$inplace_matmul ? obj.tp$inplace_matmul : obj["__imatmul__"];
            }
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
    // All Python inheritance is now enforced with Javascript inheritance
    // (see Sk.abstr.setUpInheritance). This checks if w's type is a strict
    // subclass of v's type
    const w_type = w.constructor;
    const v_type = v.constructor;
    const w_is_subclass = w_type !== v_type && w instanceof v_type;

    // From the Python 2.7 docs:
    //
    // "If the right operand’s type is a subclass of the left operand’s type and
    // that subclass provides the reflected method for the operation, this
    // method will be called before the left operand’s non-reflected method.
    // This behavior allows subclasses to override their ancestors’ operations."
    //
    // -- https://docs.python.org/2/reference/datamodel.html#index-92

    let wop;
    let ret;
    if (w_is_subclass) {
        wop = Sk.abstr.boNameToSlotFuncRhs_(w, opname);
        if (wop !== undefined) {
            if (wop.call) {
                ret = wop.call(w, v);
            } else {
                ret = Sk.misceval.callsimArray(wop, [w, v]);
            }
            if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }

    const vop = Sk.abstr.boNameToSlotFuncLhs_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v, w);
        } else {
            ret = Sk.misceval.callsimArray(vop, [v, w]);
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
                ret = Sk.misceval.callsimArray(wop, [w, v]);
            }
            if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }
    Sk.abstr.binop_type_error(v, w, opname);
};

Sk.abstr.binary_iop_ = function (v, w, opname) {
    let ret;
    const vop = Sk.abstr.iboNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v, w);
        } else {  // assume that vop is an __xxx__ type method
            ret = Sk.misceval.callsimArray(vop, [v, w]);
        }
        if (ret !== undefined && ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    // If there wasn't an in-place operation, fall back to the binop
    return Sk.abstr.binary_op_(v, w, opname);
};
Sk.abstr.unary_op_ = function (v, opname) {
    let ret;
    const vop = Sk.abstr.uoNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        if (vop.call) {
            ret = vop.call(v);
        } else {  // assume that vop is an __xxx__ type method
            ret = Sk.misceval.callsimArray(vop, [v]); //  added to be like not-in-place... is this okay?
        }
        if (ret !== undefined) {
            return ret;
        }
    }
    Sk.abstr.unop_type_error(v, opname);
};

Sk.abstr.numberBinOp = function (v, w, op) {
    return Sk.abstr.binary_op_(v, w, op);
};
Sk.exportSymbol("Sk.abstr.numberBinOp", Sk.abstr.numberBinOp);

Sk.abstr.numberInplaceBinOp = function (v, w, op) {
    return Sk.abstr.binary_iop_(v, w, op);
};
Sk.exportSymbol("Sk.abstr.numberInplaceBinOp", Sk.abstr.numberInplaceBinOp);

Sk.abstr.numberUnaryOp = function (v, op) {
    if (op === "Not") {
        return Sk.misceval.isTrue(v) ? Sk.builtin.bool.false$ : Sk.builtin.bool.true$;
    }
    return Sk.abstr.unary_op_(v, op);
};
Sk.exportSymbol("Sk.abstr.numberUnaryOp", Sk.abstr.numberUnaryOp);

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
    special = Sk.abstr.lookupSpecial(seq, Sk.builtin.str.$contains);
    if (special != null) {
        // method on builtin, provide this arg
        return Sk.misceval.isTrue(Sk.misceval.callsimArray(special, [seq, ob]));
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
        return Sk.misceval.callsimArray(seq.index, [seq, ob]);
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
        return Sk.misceval.callsimArray(seq.count, [seq, ob]);
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

/**
 * 
 * @param {*} seq the iterable to unpack
 * @param {*} breakIdx either the starred index or the number of elements to unpack if no star
 * @param {*} numvals the total number of un-starred indices
 * @param {*} hasStar is there a starred index
 * 
 * this function is used in compile code to unpack a sequence to an assignment statement
 * e.g.
 * a, b, c = 1, 2, 3 # seq is the tuple 1,2,3
 * // Sk.abstr.sequenceUncpack(seq, 3, 3, false)
 * // return [int_(1), int_(2), int_(3)]
 * 
 * 
 * a, *b, c = 1,2,3,4 
 * // Sk.abstr.sequenceUncpack(seq, 1, 2, true)
 * // return [int_(1), list(int_(2), int_(3)), int_(4)]
 * 
 */
Sk.abstr.sequenceUnpack = function (seq, breakIdx, numvals, hasStar) {
    if (!Sk.builtin.checkIterable(seq)) {
        throw new Sk.builtin.TypeError("cannot unpack non-iterable " + Sk.abstr.typeName(seq) + " object");
    }
    const it = Sk.abstr.iter(seq);
    const res = [];
    let i = 0;
    let upToStar;
    if (breakIdx > 0) {
        // iterator up to but not including the breakIdx
        upToStar = Sk.misceval.iterFor(it, (nxt) => {
            res.push(nxt);
            if (++i === breakIdx) {
                return new Sk.misceval.Break();
            }
        });
    }

    return Sk.misceval.chain(upToStar, () => {
        if (res.length < breakIdx) {
            throw new Sk.builtin.ValueError("not enough values to unpack (expected at least " + numvals + ", got " + res.length + ")");
        }
        if (!hasStar) {
            // check we've consumed the iterator
            return Sk.misceval.chain(it.tp$iternext(true), (nxt) => {
                if (nxt !== undefined) {
                    throw new Sk.builtin.ValueError("too many values to unpack (expected " + breakIdx + ")");
                }
                return res;
            });
        }
        const starred = [];
        return Sk.misceval.chain(
            Sk.misceval.iterFor(it, (nxt) => {
                starred.push(nxt);
            }),
            () => {
                const starred_end = starred.length + breakIdx - numvals;
                if (starred_end < 0) {
                    throw new Sk.builtin.ValueError(
                        "not enough values to unpack (expected at least " + numvals + ", got " + (numvals + starred_end) + ")"
                    );
                }
                res.push(new Sk.builtin.list(starred.slice(0, starred_end)));
                res.push(...starred.slice(starred_end));
                // Return Javascript array of items
                return res;
            }
        );
    });
};

// Unpack mapping into a JS array of alternating keys/values, possibly suspending
// Skulpt uses a slightly grungy format for keyword args
// into misceval.apply() and friends (alternating JS strings and Python values).
// We should probably migrate that interface to using Python strings
// at some point, but in the meantime we have this function to
// unpack keyword dictionaries into our special format
Sk.abstr.mappingUnpackIntoKeywordArray = function(jsArray, pyMapping, pyCodeObject) {
    return Sk.misceval.chain(pyMapping.tp$getattr(new Sk.builtin.str("items")), function(itemfn) {
        if (!itemfn) { throw new Sk.builtin.TypeError("Object is not a mapping"); }
        return Sk.misceval.callsimOrSuspend(itemfn);
    }, function(items) {
        return Sk.misceval.iterFor(Sk.abstr.iter(items), function(item) {
            if (!item || !item.v) { throw new Sk.builtin.TypeError("Object is not a mapping; items() does not return tuples"); }
            if (!(item.v[0] instanceof Sk.builtin.str)) {
                throw new Sk.builtin.TypeError((pyCodeObject.tp$name ? pyCodeObject.tp$name +":" : "") + "keywords must be strings");
            }
            jsArray.push(item.v[0].v, item.v[1]);
        });
    });
};

//
// Object
//

Sk.abstr.objectFormat = function (obj, format_spec) {
    var meth; // PyObject
    var result; // PyObject

    // Find the (unbound!) __format__ method (a borrowed reference)
    meth = Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$format);
    if (meth == null) {
        return Sk.misceval.callsimArray(Sk.builtin.object.prototype["__format__"], [obj, format_spec]);
    }

    // And call it
    result = Sk.misceval.callsimArray(meth, [obj, format_spec]);
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
    if (obj.nb$negative) {
        return obj.nb$negative();
    }
    throw new Sk.builtin.TypeError("bad operand type for unary -: '" + Sk.abstr.typeName(obj) + "'");
};

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
Sk.abstr.objectPositive = function (obj) {
    if (obj.nb$positive) {
        return obj.nb$positive();
    }
    throw new Sk.builtin.TypeError("bad operand type for unary +: '" + Sk.abstr.typeName(obj) + "'");
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
Sk.exportSymbol("Sk.abstr.objectDelItem", Sk.abstr.objectDelItem);

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
Sk.exportSymbol("Sk.abstr.objectGetItem", Sk.abstr.objectGetItem);

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
Sk.exportSymbol("Sk.abstr.objectSetItem", Sk.abstr.objectSetItem);


Sk.abstr.gattr = function (obj, pyName, canSuspend) {
    // TODO is it even valid to pass something this shape in here?
    // Should this be an assert?
    if (obj === null || !obj.tp$getattr) {
        let objname = Sk.abstr.typeName(obj);
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + pyName.$jsstr() + "'");
    }

    // This function is so hot that we do our own inline suspension checks

    let ret = obj.tp$getattr(pyName, canSuspend);
    let error_name;
    if (ret === undefined) {
        error_name = obj.sk$type ? "type object '" + obj.prototype.tp$name + "'" : "'" + Sk.abstr.typeName(obj) + "' object";
        throw new Sk.builtin.AttributeError(error_name + " has no attribute '" + pyName.$jsstr() + "'");
    } else if (ret.$isSuspension) {
        return Sk.misceval.chain(ret, function(r) {
            if (r === undefined) {
                error_name = obj.sk$type ? "type object '" + obj.prototype.tp$name + "'" : "'" + Sk.abstr.typeName(obj) + "' object";
                throw new Sk.builtin.AttributeError(error_name + " has no attribute '" + pyName.$jsstr() + "'");
            }
            return r;
        });
    } else {
        return ret;
    }
};
Sk.exportSymbol("Sk.abstr.gattr", Sk.abstr.gattr);


Sk.abstr.sattr = function (obj, pyName, data, canSuspend) {
    var objname = Sk.abstr.typeName(obj), r, setf;

    if (obj === null) {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + pyName.$jsstr() + "'");
    }

    if (obj.tp$setattr !== undefined) {
        return obj.tp$setattr(pyName, data, canSuspend);
    } else {
        throw new Sk.builtin.AttributeError("'" + objname + "' object has no attribute '" + pyName.$jsstr() + "'");
    }
};
Sk.exportSymbol("Sk.abstr.sattr", Sk.abstr.sattr);


Sk.abstr.iternext = function (it, canSuspend) {
    return it.tp$iternext(canSuspend);
};
Sk.exportSymbol("Sk.abstr.iternext", Sk.abstr.iternext);


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
        this.getitem = Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$getitem);
        this.tp$iternext = function () {
            var ret;
            try {
                ret = Sk.misceval.callsimArray(this.getitem, [this.myobj, Sk.ffi.remapToPy(this.idx)]);
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

    if (obj.tp$iter) {
        ret = obj.tp$iter();
        if (ret.tp$iternext) {
            return ret;
        } else {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) + "' object is not iterable");
        }
    } else if (Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$getitem)) {
        // create internal iterobject if __getitem__
        return new seqIter(obj);
    }
    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) + "' object is not iterable");
};
Sk.exportSymbol("Sk.abstr.iter", Sk.abstr.iter);

/**
 * Special method look up. First try getting the method via
 * internal dict and getattr. If getattr is not present (builtins)
 * try if method is defined on the object itself
 *
 * @returns {null|Object} Return null if not found or the function
 */
Sk.abstr.lookupSpecial = function(op, pyName) {
    var res;
    var obtp;
    if (op.ob$type) {
        obtp = op.ob$type;
    } else {
        return null;
    }

    return Sk.builtin.type.typeLookup(obtp, pyName);
};
Sk.exportSymbol("Sk.abstr.lookupSpecial", Sk.abstr.lookupSpecial);

/**
 * Mark a class as unhashable and prevent its `__hash__` function from being called.
 * @param  {*} thisClass The class to mark as unhashable.
 * @return {undefined}
 */
Sk.abstr.markUnhashable = function (thisClass) {
    var proto = thisClass.prototype;
    proto.__hash__ = Sk.builtin.none.none$;
    proto.tp$hash = Sk.builtin.none.none$;
};

/**
 * Code taken from goog.inherits
 *
 * Newer versions of the closure library add a "base"attribute,
 * which we don't want/need.  So, this code is the remainder of
 * the goog.inherits function.
 */
Sk.abstr.inherits = function (childCtor, parentCtor) {
    /** @constructor */
    function tempCtor() {}
    tempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new tempCtor();
    /** @override */
    childCtor.prototype.constructor = childCtor;
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
 * @param {*} child     The subclass.
 * @param {*} parent    The superclass.
 * @return {undefined}
 */
Sk.abstr.setUpInheritance = function (childName, child, parent) {
    Sk.abstr.inherits(child, parent);
    child.prototype.tp$base = parent;
    child.prototype.tp$name = childName;
    child.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj(childName, child);
};

/**
 * Call the super constructor of the provided class, with the object `self` as
 * the `this` value of that constructor. Any arguments passed to this function
 * after `self` will be passed as-is to the constructor.
 *
 * @param  {*} thisClass The subclass.
 * @param  {Object} self      The instance of the subclas.
 * @param  {...?} args Arguments to pass to the constructor.
 * @return {undefined}
 */
Sk.abstr.superConstructor = function (thisClass, self, args) {
    var argumentsForConstructor = Array.prototype.slice.call(arguments, 2);
    thisClass.prototype.tp$base.apply(self, argumentsForConstructor);
};
