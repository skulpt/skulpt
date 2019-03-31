/**
 * for reversed comparison: Gt -> Lt, etc.
 */
const swappedOp_ = {
    "Eq"   : "Eq",
    "NotEq": "NotEq",
    "Lt"   : "GtE",
    "LtE"  : "Gt",
    "Gt"   : "LtE",
    "GtE"  : "Lt",
    "Is"   : "IsNot",
    "IsNot": "Is",
    "In_"  : "NotIn",
    "NotIn": "In_"
};

/**
* @param{*} v
* @param{*} w
* @param{string} op
* @param{boolean=} canSuspend
 */
export function richCompareBool(v, w, op, canSuspend) {
    // v and w must be Python objects. will return Javascript true or false for internal use only
    // if you want to return a value from richCompareBool to Python you must wrap as bool first
    var wname,
        vname,
        ret,
        swapped_method,
        method,
        swapped_shortcut,
        shortcut,
        v_has_shortcut,
        w_has_shortcut,
        op2method,
        op2shortcut,
        vcmp,
        wcmp,
        w_seq_type,
        w_num_type,
        v_seq_type,
        v_num_type,
        sequence_types,
        numeric_types,
        w_type,
        v_type;

    goog.asserts.assert((v !== null) && (v !== undefined), "passed null or undefined parameter to richCompareBool");
    goog.asserts.assert((w !== null) && (w !== undefined), "passed null or undefined parameter to richCompareBool");

    v_type = new type(v);
    w_type = new type(w);

    // Python has specific rules when comparing two different builtin types
    // currently, this code will execute even if the objects are not builtin types
    // but will fall through and not return anything in this section
    if ((v_type !== w_type) &&
        (op === "GtE" || op === "Gt" || op === "LtE" || op === "Lt")) {
        // note: sets are omitted here because they can only be compared to other sets
        numeric_types = [float_.prototype.ob$type,
            int_.prototype.ob$type,
            lng.prototype.ob$type,
            bool.prototype.ob$type];
        sequence_types = [dict.prototype.ob$type,
            enumerate.prototype.ob$type,
            list.prototype.ob$type,
            str.prototype.ob$type,
            tuple.prototype.ob$type];

        v_num_type = numeric_types.indexOf(v_type);
        v_seq_type = sequence_types.indexOf(v_type);
        w_num_type = numeric_types.indexOf(w_type);
        w_seq_type = sequence_types.indexOf(w_type);

        // NoneTypes are considered less than any other type in Python
        // note: this only handles comparing NoneType with any non-NoneType.
        // Comparing NoneType with NoneType is handled further down.
        if (v_type === none.prototype.ob$type) {
            switch (op) {
                case "Lt":
                    return true;
                case "LtE":
                    return true;
                case "Gt":
                    return false;
                case "GtE":
                    return false;
            }
        }

        if (w_type === none.prototype.ob$type) {
            switch (op) {
                case "Lt":
                    return false;
                case "LtE":
                    return false;
                case "Gt":
                    return true;
                case "GtE":
                    return true;
            }
        }

        // numeric types are always considered smaller than sequence types in Python
        if (v_num_type !== -1 && w_seq_type !== -1) {
            switch (op) {
                case "Lt":
                    return true;
                case "LtE":
                    return true;
                case "Gt":
                    return false;
                case "GtE":
                    return false;
            }
        }

        if (v_seq_type !== -1 && w_num_type !== -1) {
            switch (op) {
                case "Lt":
                    return false;
                case "LtE":
                    return false;
                case "Gt":
                    return true;
                case "GtE":
                    return true;
            }
        }

        // in Python, different sequence types are ordered alphabetically
        // by name so that dict < list < str < tuple
        if (v_seq_type !== -1 && w_seq_type !== -1) {
            switch (op) {
                case "Lt":
                    return v_seq_type < w_seq_type;
                case "LtE":
                    return v_seq_type <= w_seq_type;
                case "Gt":
                    return v_seq_type > w_seq_type;
                case "GtE":
                    return v_seq_type >= w_seq_type;
            }
        }
    }


    // handle identity and membership comparisons
    if (op === "Is") {
        if (v instanceof int_ && w instanceof int_) {
            return v.numberCompare(w) === 0;
        } else if (v instanceof float_ && w instanceof float_) {
            return v.numberCompare(w) === 0;
        } else if (v instanceof lng && w instanceof lng) {
            return v.longCompare(w) === 0;
        }

        return v === w;
    }

    if (op === "IsNot") {
        if (v instanceof int_ && w instanceof int_) {
            return v.numberCompare(w) !== 0;
        } else if (v instanceof float_ && w instanceof float_) {
            return v.numberCompare(w) !== 0;
        }else if (v instanceof lng && w instanceof lng) {
            return v.longCompare(w) !== 0;
        }

        return v !== w;
    }

    if (op === "In") {
        return chain(sequenceContains(w, v, canSuspend), isTrue);
    }
    if (op === "NotIn") {
        return chain(sequenceContains(w, v, canSuspend),
                                 function(x) { return !isTrue(x); });
    }

    // Call Javascript shortcut method if exists for either object

    op2shortcut = {
        "Eq"   : "ob$eq",
        "NotEq": "ob$ne",
        "Gt"   : "ob$gt",
        "GtE"  : "ob$ge",
        "Lt"   : "ob$lt",
        "LtE"  : "ob$le"
    };

    shortcut = op2shortcut[op];
    v_has_shortcut = v.constructor.prototype.hasOwnProperty(shortcut);
    if (v_has_shortcut) {
        if ((ret = v[shortcut](w)) !== NotImplemented.NotImplemented$) {
            return isTrue(ret);
        }
    }

    swapped_shortcut = op2shortcut[swappedOp_[op]];
    w_has_shortcut = w.constructor.prototype.hasOwnProperty(swapped_shortcut);
    if (w_has_shortcut) {

        if ((ret = w[swapped_shortcut](v)) !== NotImplemented.NotImplemented$) {
            return isTrue(ret);
        }
    }

    // use comparison methods if they are given for either object
    if (v.tp$richcompare && (ret = v.tp$richcompare(w, op)) !== undefined) {
        if (ret != NotImplemented.NotImplemented$) {
            return isTrue(ret);
        }
    }

    if (w.tp$richcompare && (ret = w.tp$richcompare(v, swappedOp_[op])) !== undefined) {
        if (ret != NotImplemented.NotImplemented$) {
            return isTrue(ret);
        }
    }


    // depending on the op, try left:op:right, and if not, then
    // right:reversed-top:left

    op2method = {
        "Eq"   : "__eq__",
        "NotEq": "__ne__",
        "Gt"   : "__gt__",
        "GtE"  : "__ge__",
        "Lt"   : "__lt__",
        "LtE"  : "__le__"
    };

    method = lookupSpecial(v, op2method[op]);
    if (method && !v_has_shortcut) {
        ret = callsim(method, v, w);
        if (ret != NotImplemented.NotImplemented$) {
            return isTrue(ret);
        }
    }

    swapped_method = lookupSpecial(w, op2method[swappedOp_[op]]);
    if (swapped_method && !w_has_shortcut) {
        ret = callsim(swapped_method, w, v);
        if (ret != NotImplemented.NotImplemented$) {
            return isTrue(ret);
        }
    }

    vcmp = lookupSpecial(v, "__cmp__");
    if (vcmp) {
        try {
            ret = callsim(vcmp, v, w);
            if (checkNumber(ret)) {
                ret = asnum$(ret);
                if (op === "Eq") {
                    return ret === 0;
                } else if (op === "NotEq") {
                    return ret !== 0;
                } else if (op === "Lt") {
                    return ret < 0;
                } else if (op === "Gt") {
                    return ret > 0;
                } else if (op === "LtE") {
                    return ret <= 0;
                } else if (op === "GtE") {
                    return ret >= 0;
                }
            }

            if (ret !== NotImplemented.NotImplemented$) {
                throw new TypeError("comparison did not return an int");
            }
        } catch (e) {
            throw new TypeError("comparison did not return an int");
        }
    }

    wcmp = lookupSpecial(w, "__cmp__");
    if (wcmp) {
        // note, flipped on return value and call
        try {
            ret = callsim(wcmp, w, v);
            if (checkNumber(ret)) {
                ret = asnum$(ret);
                if (op === "Eq") {
                    return ret === 0;
                } else if (op === "NotEq") {
                    return ret !== 0;
                } else if (op === "Lt") {
                    return ret > 0;
                } else if (op === "Gt") {
                    return ret < 0;
                } else if (op === "LtE") {
                    return ret >= 0;
                } else if (op === "GtE") {
                    return ret <= 0;
                }
            }

            if (ret !== NotImplemented.NotImplemented$) {
                throw new TypeError("comparison did not return an int");
            }
        } catch (e) {
            throw new TypeError("comparison did not return an int");
        }
    }

    // handle special cases for comparing None with None or Bool with Bool
    if (((v instanceof none) && (w instanceof none)) ||
        ((v instanceof bool) && (w instanceof bool))) {
        // Javascript happens to return the same values when comparing null
        // with null or true/false with true/false as Python does when
        // comparing None with None or True/False with True/False

        if (op === "Eq") {
            return v.v === w.v;
        }
        if (op === "NotEq") {
            return v.v !== w.v;
        }
        if (op === "Gt") {
            return v.v > w.v;
        }
        if (op === "GtE") {
            return v.v >= w.v;
        }
        if (op === "Lt") {
            return v.v < w.v;
        }
        if (op === "LtE") {
            return v.v <= w.v;
        }
    }


    // handle equality comparisons for any remaining objects
    if (op === "Eq") {
        if ((v instanceof str) && (w instanceof str)) {
            return v.v === w.v;
        }
        return v === w;
    }
    if (op === "NotEq") {
        if ((v instanceof str) && (w instanceof str)) {
            return v.v !== w.v;
        }
        return v !== w;
    }

    vname = typeName(v);
    wname = typeName(w);
    throw new ValueError("don't know how to compare '" + vname + "' and '" + wname + "'");
}

export function objectRepr(v) {
    goog.asserts.assert(v !== undefined, "trying to repr undefined");
    if ((v === null) || (v instanceof none)) {
        return new str("None");
    } else if (v === true) {
        // todo; these should be consts
        return new str("True");
    } else if (v === false) {
        return new str("False");
    } else if (typeof v === "number") {
        return new str("" + v);
    } else if (!v["$r"]) {
        if (v.tp$name) {
            return new str("<" + v.tp$name + " object>");
        } else {
            return new str("<unknown>");
        }
    } else if (v.constructor === float_) {
        if (v.v === Infinity) {
            return new str("inf");
        } else if (v.v === -Infinity) {
            return new str("-inf");
        } else {
            return v["$r"]();
        }
    } else if (v.constructor === int_) {
        return v["$r"]();
    } else {
        return v["$r"]();
    }
}

export function opAllowsEquality(op) {
    switch (op) {
        case "LtE":
        case "Eq":
        case "GtE":
            return true;
    }
    return false;
}

export function isTrue(x) {
    var ret;
    if (x === true) {
        return true;
    }
    if (x === false) {
        return false;
    }
    if (x === null) {
        return false;
    }
    if (x.constructor === none) {
        return false;
    }

    if (x.constructor === NotImplemented) {
        return false;
    }

    if (x.constructor === bool) {
        return x.v;
    }
    if (typeof x === "number") {
        return x !== 0;
    }
    if (x instanceof lng) {
        return x.nb$nonzero();
    }
    if (x.constructor === int_) {
        return x.v !== 0;
    }
    if (x.constructor === float_) {
        return x.v !== 0;
    }
    if (x["__nonzero__"]) {
        ret = callsim(x["__nonzero__"], x);
        if (!checkInt(ret)) {
            throw new TypeError("__nonzero__ should return an int");
        }
        return asnum$(ret) !== 0;
    }
    if (x["__len__"]) {
        ret = callsim(x["__len__"], x);
        if (!checkInt(ret)) {
            throw new TypeError("__len__ should return an int");
        }
        return asnum$(ret) !== 0;
    }
    if (x.mp$length) {
        return asnum$(x.mp$length()) !== 0;
    }
    if (x.sq$length) {
        return asnum$(x.sq$length()) !== 0;
    }
    return true;
};