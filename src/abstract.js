/**
 * @namespace Sk.abstr
 *
 * @description
 * A collection of functions that can be used to interact with Skulpt Python Objects
 */
Sk.abstr = {};

/**@typedef {Sk.builtin.object}*/var pyObject;
/** @typedef {Sk.builtin.type|FunctionConstructor}*/var typeObject;


/**
 * @function
 * @description
 * Typically used withing error messages
 *
 * @example
 * throw new Sk.builtin.TypeError("expected an 'int' (got '" + Sk.abstr.typeName(i) + "'");
 *
 * @param {*} obj
 * @returns {string} - returns the typeName of any pyObject or `<invaid type>` if a JS object was passed
 */
Sk.abstr.typeName = function (obj) {
    if (obj != null && obj.tp$name !== undefined) {
        return obj.tp$name;
    } else {
        return "<invalid type>";
    }
};

const binop_name_to_symbol = {
    Add: "+",
    Sub: "-",
    Mult: "*",
    MatMult: "@",
    Div: "/",
    FloorDiv: "//",
    Mod: "%",
    DivMod: "divmod()",
    Pow: "** or pow()",
    LShift: "<<",
    RShift: ">>",
    BitAnd: "&",
    BitXor: "^",
    BitOr: "|",
};

function binop_type_error(v, w, name) {
    const vtypename = Sk.abstr.typeName(v);
    const wtypename = Sk.abstr.typeName(w);
    throw new Sk.builtin.TypeError("unsupported operand type(s) for " + binop_name_to_symbol[name] + ": '" + vtypename + "' and '" + wtypename + "'");
};

function biniop_type_error(v, w, name) {
    const vtypename = Sk.abstr.typeName(v);
    const wtypename = Sk.abstr.typeName(w);
    throw new Sk.builtin.TypeError("unsupported operand type(s) for " + binop_name_to_symbol[name] + "=: '" + vtypename + "' and '" + wtypename + "'");
};

const uop_name_to_symbol = {
    UAdd: "+",
    USub: "-",
    Invert: "~",
};
function unop_type_error(v, name) {
    var vtypename = Sk.abstr.typeName(v);
    throw new Sk.builtin.TypeError("bad operand type for unary " + uop_name_to_symbol[name] + ": '" + vtypename + "'");
};

/**
 * lookup and return the LHS object slot function method.  This could be either a builtin slot function or a dunder method defined by the user.
 * 
 * @param obj
 * @param name
 * 
 * @returns {Function|undefined}
 * 
 * @private
 */
function boNameToSlotFuncLhs_(obj, name) {
    switch (name) {
        case "Add":
            return obj.nb$add;
        case "Sub":
            return obj.nb$subtract;
        case "Mult":
            return obj.nb$multiply;
        case "MatMult":
            if (Sk.__future__.python3) {
                return obj.nb$matrix_multiply;
            }
        case "Div":
            return obj.nb$divide;
        case "FloorDiv":
            return obj.nb$floor_divide;
        case "Mod":
            return obj.nb$remainder;
        case "DivMod":
            return obj.nb$divmod;
        case "Pow":
            return obj.nb$power;
        case "LShift":
            return obj.nb$lshift;
        case "RShift":
            return obj.nb$rshift;
        case "BitAnd":
            return obj.nb$and;
        case "BitXor":
            return obj.nb$xor;
        case "BitOr":
            return obj.nb$or;
    }
};

function boNameToSlotFuncRhs_(obj, name) {
    switch (name) {
        case "Add":
            return obj.nb$reflected_add;
        case "Sub":
            return obj.nb$reflected_subtract;
        case "Mult":
            return obj.nb$reflected_multiply;
        case "MatMult":
            if (Sk.__future__.python3) {
                return obj.nb$reflected_matrix_multiply;
            }
        case "Div":
            return obj.nb$reflected_divide;
        case "FloorDiv":
            return obj.nb$reflected_floor_divide;
        case "Mod":
            return obj.nb$reflected_remainder;
        case "DivMod":
            return obj.nb$reflected_divmod;
        case "Pow":
            return obj.nb$reflected_power;
        case "LShift":
            return obj.nb$reflected_lshift;
        case "RShift":
            return obj.nb$reflected_rshift;
        case "BitAnd":
            return obj.nb$reflected_and;
        case "BitXor":
            return obj.nb$reflected_xor;
        case "BitOr":
            return obj.nb$reflected_or;
    }
};

function iboNameToSlotFunc_(obj, name) {
    switch (name) {
        case "Add":
            return obj.nb$inplace_add;
        case "Sub":
            return obj.nb$inplace_subtract;
        case "Mult":
            return obj.nb$inplace_multiply;
        case "MatMult":
            if (Sk.__future__.python3) {
                return obj.nb$inplace_matrix_multiply;
            }
        case "Div":
            return obj.nb$inplace_divide;
        case "FloorDiv":
            return obj.nb$inplace_floor_divide;
        case "Mod":
            return obj.nb$inplace_remainder;
        case "Pow":
            return obj.nb$inplace_power;
        case "LShift":
            return obj.nb$inplace_lshift;
        case "RShift":
            return obj.nb$inplace_rshift;
        case "BitAnd":
            return obj.nb$inplace_and;
        case "BitOr":
            return obj.nb$inplace_or;
        case "BitXor":
            return obj.nb$inplace_xor;
    }
};

function uoNameToSlotFunc_(obj, name) {
    switch (name) {
        case "USub":
            return obj.nb$negative;
        case "UAdd":
            return obj.nb$positive;
        case "Invert":
            return obj.nb$invert;
    }
};

function binary_op_(v, w, opname) {
    // All Python inheritance is now enforced with Javascript inheritance
    // (see Sk.abstr.setUpInheritance). This checks if w's type is a strict
    // subclass of v's type
    const w_type = w.constructor;
    const v_type = v.constructor;
    const w_is_subclass = w_type !== v_type && w_type.sk$baseClass === undefined && w instanceof v_type;

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
        wop = boNameToSlotFuncRhs_(w, opname);
        // only use the reflected slot if it has actually be overridden
        if (wop !== undefined && wop !== boNameToSlotFuncRhs_(v, opname)) {
            ret = wop.call(w, v);
            if (ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }

    const vop = boNameToSlotFuncLhs_(v, opname);
    if (vop !== undefined) {
        ret = vop.call(v, w);
        if (ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    // Don't retry RHS if failed above
    if (!w_is_subclass) {
        wop = boNameToSlotFuncRhs_(w, opname);
        if (wop !== undefined) {
            ret = wop.call(w, v);
            if (ret !== Sk.builtin.NotImplemented.NotImplemented$) {
                return ret;
            }
        }
    }

};

function binary_iop_(v, w, opname) {
    const vop = iboNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        const ret = vop.call(v, w);
        if (ret !== Sk.builtin.NotImplemented.NotImplemented$) {
            return ret;
        }
    }
    // If there wasn't an in-place operation, fall back to the binop
    return binary_op_(v, w, opname);
};

function unary_op_(v, opname) {
    const vop = uoNameToSlotFunc_(v, opname);
    if (vop !== undefined) {
        return vop.call(v);
    }
};

/**
 * @function
 * @description
 * Perform a binary operation with any pyObjects that support the operation
 * @param {pyObject} v
 * @param {pyObject} w
 * @param {string} op - `Add`, `Sub`, `Mult`, `Divide`, ...
 *
 * @throws {Sk.builtin.TypeError}
 */
Sk.abstr.numberBinOp = function (v, w, op) {
    return binary_op_(v, w, op) || binop_type_error(v, w, op);
};
Sk.exportSymbol("Sk.abstr.numberBinOp", Sk.abstr.numberBinOp);

/**
 * @function
 * @description
 * Perform an inplace operation with any pyObjects that support the operation
 * @param {pyObject} v
 * @param {pyObject} w
 * @param {string} op - `Add`, `Sub`, `Mult`, `Divide`, ...
 *
 * @throws {Sk.builtin.TypeError}
 */
Sk.abstr.numberInplaceBinOp = function (v, w, op) {
    return binary_iop_(v, w, op) || biniop_type_error(v, w, op);
};
Sk.exportSymbol("Sk.abstr.numberInplaceBinOp", Sk.abstr.numberInplaceBinOp);

/**
 * @function
 * @description
 * Perform a unary operation with any pyObjects that support the operation
 * @param {pyObject} v
 * @param {string} op - `UAdd`, `USub`
 *
 * @throws {Sk.builtin.TypeError}
 */
Sk.abstr.numberUnaryOp = function (v, op) {
    if (op === "Not") {
        return Sk.misceval.isTrue(v) ? Sk.builtin.bool.false$ : Sk.builtin.bool.true$;
    }
    return unary_op_(v, op) || unop_type_error(v, op);
};
Sk.exportSymbol("Sk.abstr.numberUnaryOp", Sk.abstr.numberUnaryOp);

/**
 * @deprecated
 */
Sk.abstr.fixSeqIndex_ = function (seq, i) {
    i = Sk.builtin.asnum$(i);
    if (i < 0 && seq.sq$length) {
        i += seq.sq$length();
    }
    return i;
};

/**
 * @param {pyObject} seq
 * @param {pyObject} ob
 * @param {boolean=} canSuspend
 * 
 */
Sk.abstr.sequenceContains = function (seq, ob, canSuspend) {
    if (seq.sq$contains) {
        return seq.sq$contains(ob, canSuspend);
    }
    const r = Sk.misceval.iterFor(
        Sk.abstr.iter(seq),
        function (i) {
            if (i === ob || Sk.misceval.richCompareBool(i, ob, "Eq")) {
                return new Sk.misceval.Break(true);
            } else {
                return false;
            }
        },
        false
    );
    return canSuspend ? r : Sk.misceval.retryOptionalSuspensionOrThrow(r);
};

Sk.abstr.sequenceConcat = function (seq1, seq2) {
    if (seq1.sq$concat) {
        return seq1.sq$concat(seq2);
    }
    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq1) + "' object can't be concatenated");
};

/**
 * @param {pyObject} seq 
 * @param {pyObject} ob 
 */
Sk.abstr.sequenceGetIndexOf = function (seq, ob) {
    if (seq.index) {
        return Sk.misceval.callsimArray(seq.index, [seq, ob]);
    }
    let index = 0;
    for (let it = Sk.abstr.iter(seq), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
            return new Sk.builtin.int_(index);
        }
        index += 1;
    }
    throw new Sk.builtin.ValueError("sequence.index(x): x not in sequence");
};

/**
 * @param {pyObject} seq 
 * @param {pyObject} ob 
 */
Sk.abstr.sequenceGetCountOf = function (seq, ob) {
    if (seq.count) {
        return Sk.misceval.callsimArray(seq.count, [seq, ob]);
    }
    let count = 0;
    for (let it = Sk.abstr.iter(seq), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (Sk.misceval.richCompareBool(ob, i, "Eq")) {
            count += 1;
        }
    }
    return new Sk.builtin.int_(count);
};

Sk.abstr.sequenceGetItem = function (seq, i, canSuspend) {
    if (typeof i === "number") {
        i = new Sk.builtin.int_(i);
    }
    return Sk.abstr.objectGetItem(seq, i, canSuspend);
};

Sk.abstr.sequenceSetItem = function (seq, i, x, canSuspend) {
    if (typeof i === "number") {
        i = new Sk.builtin.int_(i);
    }
    return Sk.abstr.objectSetItem(seq, i, x, canSuspend);
};

Sk.abstr.sequenceDelItem = function (seq, i, canSuspend) {
    return Sk.abstr.objectDelItem(seq, i, canSuspend);
};

Sk.abstr.sequenceGetSlice = function (seq, i1, i2) {
    return Sk.abstr.objectGetItem(seq, new Sk.builtin.slice(i1, i2));
};

Sk.abstr.sequenceDelSlice = function (seq, i1, i2) {
    return Sk.abstr.objectDelItem(seq, new Sk.builtin.slice(i1, i2));
};

Sk.abstr.sequenceSetSlice = function (seq, i1, i2, x) {
    return Sk.abstr.objectSetItem(seq, new Sk.builtin.slice(i1, i2));
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
Sk.abstr.mappingUnpackIntoKeywordArray = function (jsArray, pyMapping, pyCodeObject) {
    if (pyMapping instanceof Sk.builtin.dict) {
        pyMapping.$items().forEach(([key, val]) => {
            if (!Sk.builtin.checkString(key)) {
                throw new Sk.builtin.TypeError((pyCodeObject.$qualname ? pyCodeObject.$qualname + "() " : "") + "keywords must be strings");
            } 
            jsArray.push(key.v);
            jsArray.push(val);
        });
        return;
    }

    const keyf = Sk.abstr.lookupSpecial(pyMapping, Sk.builtin.str.$keys);
    if (keyf === undefined) {
        throw new Sk.builtin.TypeError("Object is not a mapping");
    }
    return Sk.misceval.chain(Sk.misceval.callsimOrSuspendArray(keyf), (keys) =>
        Sk.misceval.iterFor(Sk.abstr.iter(keys), (key) => {
            if (!Sk.builtin.checkString(key)) {
                throw new Sk.builtin.TypeError((pyCodeObject.$qualname ? pyCodeObject.$qualname + "() " : "") + "keywords must be strings");
            }
            return Sk.misceval.chain(pyMapping.mp$subscript(key, true), (val) => {
                jsArray.push(key.v);
                jsArray.push(val);
            });
        })
    );
};

/**
 *
 * @function
 * @description
 * A helper function used by native js functions whose call method is FastCall i.e. the args and kwargs are provided as Array objects.
 *
 * @param {string} func_name - used for error messages
 * @param {Array<null|string>} varnames - Argument names to map to. For position only arguments use null
 * @param {Array} args - typically provided by the `tp$call` method
 * @param {Array|undefined} kwargs - typically provided the `tp$call` method
 * @param {Array=} defaults
 * @throws {Sk.builtin.TypeError}
 *
 * @example
 * // base is a possible keyword argument for int_ and x is a position only argument
 * Sk.builtin.int_.prototype.tp$new = function(args, kwargs) {
 *     args = Sk.abstr.copyKeywordsToNamedArgs("int", [null, "base"], args, kwargs, [
 *         new Sk.builtin.int_(0),
 *         Sk.builtin.none.none$
 *     ]);
 * }
 */
Sk.abstr.copyKeywordsToNamedArgs = function (func_name, varnames, args, kwargs, defaults) {
    // args is an array, kwargs is an array or undefined
    kwargs = kwargs || [];

    const nargs = args.length + kwargs.length / 2;
    if (nargs > varnames.length) {
        throw new Sk.builtin.TypeError(func_name + "() expected at most " + varnames.length + " arguments (" + nargs + " given)");
    }
    if (!kwargs.length && defaults === undefined) {
        // no defaults supplied
        return args;
    } else if (nargs === varnames.length && !kwargs.length) {
        // position only arguments match
        return args;
    } else if (nargs === 0 && varnames.length === (defaults && defaults.length)) {
        // a fast case - no args so just return the defaults
        return defaults;
    }
    args = args.slice(0); // make a copy of args

    for (let i = 0; i < kwargs.length; i += 2) {
        const name = kwargs[i]; // JS string
        const value = kwargs[i + 1]; // Python value
        const idx = varnames.indexOf(name);

        if (idx >= 0) {
            if (args[idx] !== undefined) {
                throw new Sk.builtin.TypeError(func_name + "() got multiple values for argument '" + name + "'");
            }
            args[idx] = value;
        } else {
            throw new Sk.builtin.TypeError(func_name + "() got an unexpected keyword argument '" + name + "'");
        }
    }
    if (defaults) {
        const nargs = varnames.length;
        for (let i = nargs - 1; i >= 0; i--) {
            if (args[i] === undefined) {
                args[i] = defaults[defaults.length - 1 - (nargs - 1 - i)];
            }
        }
        const missing = varnames.filter((x, i) => args[i] === undefined);
        if (missing.length) {
            throw new Sk.builtin.TypeError(func_name + "() missing " + missing.length + " required positional arguments: " + missing.join(", "));
        }
    }

    return args;
};
Sk.exportSymbol("Sk.abstr.copyKeywordsToNamedArgs", Sk.abstr.copyKeywordsToNamedArgs);

/**
 * @function
 * @param {string} func_name
 * @param {Array|undefined} kwargs
 * @throws {Sk.builtin.TypeError}
 */
Sk.abstr.checkNoKwargs = function (func_name, kwargs) {
    if (kwargs && kwargs.length) {
        throw new Sk.builtin.TypeError(func_name + "() takes no keyword arguments");
    }
};
Sk.exportSymbol("Sk.abstr.checkNoKwargs", Sk.abstr.checkNoKwargs);

/**
 * @function
 * @param {string} func_name
 * @param {Array} args
 * @param {Array|undefined=} kwargs
 *
 * @throws {Sk.builtin.TypeError}
 */
Sk.abstr.checkNoArgs = function (func_name, args, kwargs) {
    const nargs = args.length + (kwargs ? kwargs.length : 0);
    if (nargs) {
        throw new Sk.builtin.TypeError(func_name + "() takes no arguments (" + nargs + " given)");
    }
};
Sk.exportSymbol("Sk.abstr.checkNoArgs", Sk.abstr.checkNoArgs);

/**
 * @function
 * @param {string} func_name
 * @param {Array} args
 * @param {Array|undefined=} kwargs
 * @throws {Sk.builtin.TypeError}
 */
Sk.abstr.checkOneArg = function (func_name, args, kwargs) {
    Sk.abstr.checkNoKwargs(func_name, kwargs);
    if (args.length !== 1) {
        throw new Sk.builtin.TypeError(func_name + "() takes exactly one argument (" + args.length + " given)");
    }
};
Sk.exportSymbol("Sk.abstr.checkOneArg", Sk.abstr.checkOneArg);

/**
 * @function
 * @param {string} func_name
 * @param {Array} args
 * @param {number} minargs
 * @param {number=} [maxargs=Infinity]
 * @throws {Sk.builtin.TypeError}
 *
 */
Sk.abstr.checkArgsLen = function (func_name, args, minargs, maxargs) {
    const nargs = args.length;
    let msg;
    if (maxargs === undefined) {
        maxargs = Infinity;
    }
    if (nargs < minargs || nargs > maxargs) {
        if (minargs === maxargs) {
            msg = func_name + "() takes exactly " + minargs + " arguments";
        } else if (nargs < minargs) {
            msg = func_name + "() takes at least " + minargs + " arguments";
        } else {
            msg = func_name + "() takes at most " + maxargs + " arguments";
        }
        msg += " (" + nargs + " given)";
        throw new Sk.builtin.TypeError(msg);
    }
};
Sk.exportSymbol("Sk.abstr.checkArgsLen", Sk.abstr.checkArgsLen);

Sk.abstr.objectFormat = function (obj, format_spec) {
    const meth = Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$format); // inherited from object so guaranteed to exist
    const result = Sk.misceval.callsimArray(meth, [format_spec]);
    if (!Sk.builtin.checkString(result)) {
        throw new Sk.builtin.TypeError("__format__ must return a str, not " + Sk.abstr.typeName(result));
    }
    return result;
};

/**
 * 
 * @param {pyObject} obj 
 * 
 * @returns {Number} the hash value a number less than Number.MAX_SAFE_INTEGER 
 * @throws {Sk.buitin.TypeError} if the object is unhashable
 */
Sk.abstr.objectHash = function (obj) {
    const hash_func = obj.tp$hash;
    if (hash_func !== undefined) {
        if (Sk.builtin.checkNone(hash_func)) {
            throw new Sk.builtin.TypeError("unhashable type: '" + Sk.abstr.typeName(obj) + "'");
        }
        return obj.tp$hash();
    }
    throw new Sk.builtin.TypeError("unsupported Javascript type");
};

Sk.abstr.objectAdd = function (a, b) {
    if (a.nb$add) {
        return a.nb$add(b);
    }
    const atypename = Sk.abstr.typeName(a);
    const btypename = Sk.abstr.typeName(b);
    throw new Sk.builtin.TypeError("unsupported operand type(s) for +: '" + atypename + "' and '" + btypename + "'");
};

// in Python 2.6, this behaviour seems to be defined for numbers and bools (converts bool to int)
Sk.abstr.objectNegative = function (obj) {
    if (obj.nb$negative) {
        return obj.nb$negative();
    }
    throw new Sk.builtin.TypeError("bad operand type for unary -: '" + Sk.abstr.typeName(obj) + "'");
};

Sk.abstr.objectPositive = function (obj) {
    if (obj.nb$positive) {
        return obj.nb$positive();
    }
    throw new Sk.builtin.TypeError("bad operand type for unary +: '" + Sk.abstr.typeName(obj) + "'");
};

Sk.abstr.objectDelItem = function (o, key, canSuspend) {
    if (o.mp$ass_subscript) {
        return o.mp$ass_subscript(key, undefined, canSuspend);
    }
    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(o) + "' object does not support item deletion");
};
Sk.exportSymbol("Sk.abstr.objectDelItem", Sk.abstr.objectDelItem);

/**
 * 
 * @param {pyObject} o 
 * @param {pyObject} key 
 * @param {boolean=} canSuspend 
 */
Sk.abstr.objectGetItem = function (o, key, canSuspend) {
    if (o.mp$subscript) {
        return o.mp$subscript(key, canSuspend);
    }
    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(o) + "' does not support indexing");
};
Sk.exportSymbol("Sk.abstr.objectGetItem", Sk.abstr.objectGetItem);

/**
 * 
 * @param {pyObject} o 
 * @param {pyObject} key 
 * @param {pyObject=} v 
 * @param {boolean=} canSuspend 
 */
Sk.abstr.objectSetItem = function (o, key, v, canSuspend) {
    if (o.mp$ass_subscript) {
        return o.mp$ass_subscript(key, v, canSuspend);
    }
    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(o) + "' does not support item assignment");
};
Sk.exportSymbol("Sk.abstr.objectSetItem", Sk.abstr.objectSetItem);

/**
 * 
 * @param {pyObject} obj 
 * @param {Sk.builtin.str} pyName 
 * @param {boolean=} canSuspend 
 */
Sk.abstr.gattr = function (obj, pyName, canSuspend) {
    // let the getattr and setattr's deal with reserved words - we don't want to pass a mangled pyName to tp$getattr!!
    const ret = obj.tp$getattr(pyName, canSuspend);
    if (ret === undefined) {
        throw new Sk.builtin.AttributeError(obj.sk$attrError() + " has no attribute '" + pyName.$jsstr() + "'");
    } else if (ret.$isSuspension) {
        return Sk.misceval.chain(ret, function (r) {
            if (r === undefined) {
                throw new Sk.builtin.AttributeError(obj.sk$attrError() + " has no attribute '" + pyName.$jsstr() + "'");
            }
            return r;
        });
    } else {
        return ret;
    }
};
Sk.exportSymbol("Sk.abstr.gattr", Sk.abstr.gattr);

Sk.abstr.sattr = function (obj, pyName, data, canSuspend) {
    return obj.tp$setattr(pyName, data, canSuspend);
};
Sk.exportSymbol("Sk.abstr.sattr", Sk.abstr.sattr);

Sk.abstr.iternext = function (it, canSuspend) {
    return it.tp$iternext(canSuspend);
};
Sk.exportSymbol("Sk.abstr.iternext", Sk.abstr.iternext);

/**
 * @function
 *
 * @description
 * Get the iterator for a Python object  This iterator could be one of the following.
 * This is the preferred mechanism for consistently getting the correct iterator.  You should
 * not just use tp$iter because that could lead to incorrect behavior of a user created class.
 *
 * - `tp$iter`
 * - A user defined `__iter__` method
 * - A user defined `__getitem__` method
 *
 * @param {pyObject} obj
 *
 * @throws {Sk.builtin.TypeError} If the object passed is not iterable
 * @returns {pyObject}
 */
Sk.abstr.iter = function (obj) {
    if (obj.tp$iter) {
        const iter = obj.tp$iter();
        if (iter.tp$iternext) {
            // only a valid iterator if there is a tp$iternext
            return iter;
        }
        throw new Sk.builtin.TypeError("iter() returned non-iterator of type '" + Sk.abstr.typeName(iter) + "'");
    }
    if (obj.mp$subscript) {
        return new Sk.builtin.seq_iter_(obj);
    }

    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(obj) + "' object is not iterable");
};
Sk.exportSymbol("Sk.abstr.iter", Sk.abstr.iter);


/**
 * @description
 * Special method look up.
 * Checks whether the attribute is defined on object type's prototype
 *
 * @returns {undefined | Object} Return undefined if not found or the function
 *
 * @param {pyObject} obj
 * @param {Sk.builtin.str} pyName
 */
Sk.abstr.lookupSpecial = function (obj, pyName) {
    var obtype = obj.ob$type;
    if (obtype === undefined) {
        Sk.asserts.fail("javascript object sent to lookupSpecial");
        return;
    }
    var func = obtype.$typeLookup(pyName);
    if (func === undefined) {
        return;
    } else if (func.tp$descr_get !== undefined) {
        func = func.tp$descr_get(obj, obtype);
    }
    return func;
};
Sk.exportSymbol("Sk.abstr.lookupSpecial", Sk.abstr.lookupSpecial);


Sk.abstr.typeLookup = function (type_obj, pyName) {
    const res = type_obj.$typeLookup(pyName);
    if (res !== undefined && res.tp$descr_get) {
        return res.tp$descr_get(null, type_obj);
    }
    return res;
};

/**
 * Mark a class as unhashable and prevent its `__hash__` function from being called.
 * @param  {*} thisClass The class to mark as unhashable.
 * @return {undefined}
 */
Sk.abstr.markUnhashable = function (thisClass) {
    const proto = thisClass.prototype;
    proto.__hash__ = Sk.builtin.none.none$;
    proto.tp$hash = Sk.builtin.none.none$;
};

/**
 * @description
 * Set up inheritance between two Python classes. This allows only for single
 * inheritance -- multiple inheritance is not supported by Javascript.
 * multiple inheritance is dealt with by tp$getattr implementations
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
 * @param {FunctionConstructor} child     The subclass.
 * @param {FunctionConstructor=} [parent=Sk.builtin.object]    The base of child.
 * @param {FunctionConstructor=} [metaclass=Sk.builtin.type]
 * 
 * @returns {FunctionConstructor}
 * 
 */
Sk.abstr.setUpInheritance = function (childName, child, parent, metaclass) {
    metaclass = metaclass || Sk.builtin.type;
    parent = parent === undefined ? Sk.builtin.object : parent;
    const parentproto = parent !== null ? parent.prototype : null;
    Object.setPrototypeOf(child, metaclass.prototype);
    Object.setPrototypeOf(child.prototype, parentproto);
    Object.defineProperties(child.prototype, {
        sk$object: { value: child, writable: true },
        ob$type: { value: child, writable: true },
        tp$name: { value: childName, writable: true },
        tp$base: { value: parent, writable: true },
    });
};


/**
 * This function is called in {@link Sk.doOneTimeInitialization}
 * and {@link Sk.abstr.buildNativeClass}
 *
 * @param  {FunctionConstructor} child
 *
 */
Sk.abstr.setUpBuiltinMro = function (child) {
    let base = child.prototype.tp$base;
    const bases = base === null ? [] : [base];
    if (base === Sk.builtin.object || base === null) {
        Object.defineProperty(child, "sk$baseClass", { value: true, writable: true });
        Object.defineProperty(child.prototype, "sk$builtinBase", { value: child, writable: true });
    }
    const mro = [child];
    while (base !== null) {
        mro.push(base);
        base = base.prototype.tp$base;
    }
    
    // internally we keep the mro and bases as array objects
    // the wrapper descripor returns the tuple of the array
    Object.defineProperties(child.prototype, {
        sk$prototypical: { value: true, writable: true },
        tp$bases: { value: bases, writable: true },
        tp$mro: { value: mro, writable: true },
    });
    Object.defineProperty(child, "$typeLookup", {
        value: function (pyName) {
            var jsName = pyName.$mangled;
            return this.prototype[jsName];
        },
        writable: true,
    });
};

/**
 * @param {FunctionConstructor} klass 
 * @param {Object=} getsets 
 */
Sk.abstr.setUpGetSets = function (klass, getsets) {
    if (Sk.builtin.getset_descriptor === undefined) {
        return;
    }
    const klass_proto = klass.prototype;
    getsets = getsets || klass_proto.tp$getsets || {};
    Object.entries(getsets).forEach(([getset_name, getset_def]) => {
        getset_def.$name = getset_name;
        klass_proto[getset_name] = new Sk.builtin.getset_descriptor(klass, getset_def);
    });
    Object.defineProperty(klass_proto, "tp$getsets", { value: null, writable: true });
};

/**
 * 
 * @param {FunctionConstructor} klass 
 * @param {Object=} methods 
 */
Sk.abstr.setUpMethods = function (klass, methods) {
    if (Sk.builtin.method_descriptor === undefined) {
        return;
    }
    const klass_proto = klass.prototype;
    methods = methods || klass_proto.tp$methods || {};
    Object.entries(methods).forEach(([method_name, method_def]) => {
        method_def.$name = method_name;
        klass_proto[method_name] = new Sk.builtin.method_descriptor(klass, method_def);
    });
    Object.defineProperty(klass_proto, "tp$methods", { value: null, writable: true });
};

/**
 * 
 * @param {FunctionConstructor} klass 
 * @param {Object=} methods 
 */
Sk.abstr.setUpClassMethods = function (klass, methods) {
    if (Sk.builtin.classmethod_descriptor === undefined) {
        return;
    }
    const klass_proto = klass.prototype;
    methods = methods || klass_proto.tp$classmethods || {};
    Object.entries(methods).forEach(([method_name, method_def]) => {
        method_def.$name = method_name;
        klass_proto[method_name] = new Sk.builtin.classmethod_descriptor(klass, method_def);
    });
    Object.defineProperty(klass_proto, "tp$classmethods", { value: null, writable: true });
};

const op2shortcut = Object.entries({
    Eq: "ob$eq",
    NotEq: "ob$ne",
    Gt: "ob$gt",
    GtE: "ob$ge",
    Lt: "ob$lt",
    LtE: "ob$le",
});

function _set_up_richcompare_wrappers(slots) {
    op2shortcut.forEach(([op, shortcut]) => {
        slots[shortcut] = function (other) {
            return this.tp$richcompare(other, op);
        };
    });
}

function _set_up_reflected_number_slots(slots) {
    // do the reflected slots
    const reflected_slots = Sk.reflectedNumberSlots;
    Object.keys(reflected_slots).forEach((slot_name) => {
        if (slots[slot_name] !== undefined) {
            const reflected_slot_def = reflected_slots[slot_name];
            const reflect_name = reflected_slot_def.reflected;
            const reflected_slot = slots[reflect_name];
            if (reflected_slot !== undefined) {
                // the reflected slot was already defined so don't recreate it
                if (reflected_slot === null) {
                    delete slots[reflect_name]; // e.g. Counter doesn't want reflected slots
                }
            } else {
                // either the reflected slot is a function or it's undefined
                // if it's undefined then the reflected slot is the same as non reflected slot - like nb$add
                slots[reflect_name] = reflected_slot_def.slot || slots[slot_name];
            }
        }
    });
}

function _set_up_sequence_to_number_slots(slots) {
    const sequenceToNumber = Sk.sequenceAndMappingSlots;
    Object.keys(sequenceToNumber).forEach((slot_name) => {
        if (slots[slot_name] !== undefined) {
            const equiv_slots = sequenceToNumber[slot_name];
            equiv_slots.forEach((equv_slot_name) => {
                slots[equv_slot_name] = slots[slot_name];
            });
        }
    });
}

/**
 * 
 * @param {FunctionConstructor} klass
 * @param {Object=} slots 
 */
Sk.abstr.setUpSlots = function (klass, slots) {
    if (Sk.builtin.wrapper_descriptor === undefined) {
        return;
    }
    const proto = klass.prototype;
    slots = slots || proto.tp$slots || {};

    // set up the raw slots on the proto

    // start with tp$new - we couldn't call genericnew before the klass was defined so call it now
    if (slots.tp$new === Sk.generic.new) {
        slots.tp$new = Sk.generic.new(klass);
    }

    // wrap ob$eq slots into tp$richcompare
    if (slots.tp$richcompare) {
        // Either a klass defines a tp$richcompare slot or ob$eq slots
        // if tp$richcompare is defined then create all the ob$eq slots
        _set_up_richcompare_wrappers(slots);
    }

    // setup some reflected slots
    if (slots.tp$as_number) {
        _set_up_reflected_number_slots(slots);
    }

    // turn sequence slots into number slots
    if (slots.tp$as_sequence_or_mapping) {
        _set_up_sequence_to_number_slots(slots);
    }

    // make all slots non-enumerable - makes the dir implementation easier
    Object.entries(slots).forEach(([slot_name, value]) => {
        Object.defineProperty(proto, slot_name, {
            value: value,
            writable: true,
        });
    });

    if (slots.tp$new) {
        proto.__new__ = new Sk.builtin.sk_method(Sk.generic.newMethodDef, klass);
        // this property is used in the implementation of calling __new__
        Object.defineProperty(proto, "sk$staticNew", {value: klass, writable: true});
    }

    function wrap_func(dunder_name, wrapped_func) {
        const slot_def = Sk.slots[dunder_name];
        // we do this here because in the generic.wrapperCall methods the wrapped_func
        // the wrapped func should have a $name property and a $flags property (for minArgs)
        proto[dunder_name] = new Sk.builtin.wrapper_descriptor(klass, slot_def, wrapped_func);
    }

    function set_up_slot(dunder_name, wrapped_func) {
        // some slots get multpile dunders
        if (typeof dunder_name === "string") {
            wrap_func(dunder_name, wrapped_func);
        } else {
            dunder_name.forEach((related_dunder_name) => {
                wrap_func(related_dunder_name, wrapped_func);
            });
        }
    }

    // main slots
    Sk.subSlots.main_slots.forEach(([slot_name, dunder_name]) => {
        const wrapped_func = slots[slot_name];
        if (wrapped_func !== undefined) {
            set_up_slot(dunder_name, wrapped_func);
        }
    });

    // __hash__
    const hash = slots.tp$hash;
    if (hash !== undefined) {   
        if (typeof hash === "function") {
            wrap_func("__hash__", hash);
        } else if (hash === Sk.builtin.none.none$) {
            proto.__hash__ = hash;
        } else {
            Sk.asserts.fail("invalid tp$hash");
        }
    }

    // number_slots
    if (slots.tp$as_number) {
        Sk.subSlots.number_slots.forEach(([slot_name, dunder_name]) => {
            const wrapped_func = slots[slot_name];
            if (wrapped_func !== undefined) {
                set_up_slot(dunder_name, wrapped_func);
            }
        });
    }

    // as_sequence_or_mapping slots
    if (slots.tp$as_sequence_or_mapping) {
        Sk.subSlots.sequence_and_mapping_slots.forEach(([slot_name, dunder_name]) => {
            const wrapped_func = slots[slot_name];
            if (wrapped_func !== undefined) {
                set_up_slot(dunder_name, wrapped_func);
            }
        });
    }

    Object.defineProperty(proto, "tp$slots", { value: null, writable: true });
};

/**
 * @function
 * @param {string} typename
 * @param {Object} options An object literal that provides the functionality of the typobject
 * @returns {FunctionConstructor}
 *
 * @description
 * this can be called to create a native typeobj
 * options include
 * ```
 * - base: default to {@link Sk.builtin.object}
 * - meta: default to {@link Sk.builtin.type}
 *
 * - slots: skulpt slot functions that will be allocated slot wrappers
 * - methods: method objects `{$meth: Function, $flags: callmethod, $doc: string, $textsic: string|null}`,
 * - getsets: getset objects `{$get: Function, $set: Function, $doc: string}`,
 * - classmethods: classmethod objects `{$meth: Function, $flags: callmethod, $doc: string, $textsic: string|null}`,
 *
 * - flags: Object allocated directly onto class like `klass.sk$acceptable_as_base_class`
 * - proto: Object allocated onto the prototype useful for private methods
 * ```
 * See most builtin type objects for examples
 *
 */
Sk.abstr.buildNativeClass = function (typename, options) {
    options = options || {};
    Sk.asserts.assert(options.hasOwnProperty("constructor"), "A constructor is required to build a native class");

    /**@type {FunctionConstructor} */
    let typeobject = options.constructor;

    let mod;
    if (typename.includes(".")) {
        // you should define the module like "collections.defaultdict" for static classes
        const mod_typename = typename.split(".");
        typename = mod_typename.pop();
        mod = mod_typename.join(".");
    }
    // set the prototypical chains for inheritance
    Sk.abstr.setUpInheritance(typename, typeobject, options.base, options.meta);

    // Native classes can only be single inheritance objects
    Sk.abstr.setUpBuiltinMro(typeobject);

    const type_proto = typeobject.prototype;

    Object.defineProperties(type_proto, {
        // memoise these and make them null later
        tp$slots: {value: options.slots, writable: true},
        tp$getsets: {value: options.getsets, writable: true},
        tp$methods: {value: options.methods, writable: true},
        tp$classmethods: {value: options.classmethods, writable: true},
    });

    Sk.abstr.setUpSlots(typeobject, /**@lends {typeobject.prototype} */ options.slots || {});
    Sk.abstr.setUpMethods(typeobject, options.methods);
    Sk.abstr.setUpGetSets(typeobject, options.getsets);
    Sk.abstr.setUpClassMethods(typeobject, options.classmethods);

    if (mod !== undefined) {
        type_proto.__module__ = new Sk.builtin.str(mod);
    }
    
    const proto = options.proto || {};
    Object.entries(proto).forEach(([p, val]) => {
        Object.defineProperty(type_proto, p, {
            value: val,
            writable: true,
            enumerable: !(p.includes("$") || (p in Object.prototype)), 
            // only make these private in these cases otherwise they're public methods
        });
    });

    const flags = options.flags || {};
    Object.entries(flags).forEach(([flag, val]) => {
        Object.defineProperty(typeobject, flag, {
            value: val,
            writable: true,
        }); 
    });

    // str might not have been created yet
    if (Sk.builtin.str !== undefined && type_proto.hasOwnProperty("tp$doc") && !type_proto.hasOwnProperty("__doc__")) {
        const docstr = type_proto.tp$doc || null;
        if (typeof docstr === "string") {
            type_proto.__doc__ = new Sk.builtin.str(docstr);
        } else {
            type_proto.__doc__ = Sk.builtin.none.none$;
        }
    }
    return typeobject;
};

/**
 * @function
 * 
 * @param {string} typename e.g. "itertools.chain"
 * @param {Object} iterator minimum options `{constructor: function, iternext: function}`
 *
 * @description
 * effectively a wrapper for easily defining an iterator
 * `tp$iter` slot is added and returns self
 *
 * define a constructor in the usual way
 *
 * define `tp$iternext` using iternext in the object literal
 * mostly as a convenience
 * you can also define `tp$iternext` in the slots which will take priority
 *
 * the main benefit of this helper function is to reduce some repetitive code for defining an iterator class
 *
 * If you want a generic iterator see {@link Sk.miscival.iterator}
 *
 * 
 * @example
 * Sk.builtin.tuple_iter_ = Sk.abstr.buildIteratorClass("tuple_iterator", {
    constructor: function tuple_iter_(tuple) {
        this.$index = 0;
        this.$seq = tuple.sk$asarray();
    },
    iternext: function () {
        if (this.$index >= this.$seq.length) {
            return undefined;
        }
        return this.$seq[this.$index++];
    }
});
 * @returns {FunctionConstructor}
 *
 */

Sk.abstr.buildIteratorClass = function (typename, iterator) {
    Sk.asserts.assert(iterator.hasOwnProperty("constructor"), "must provide a constructor");
    iterator.slots = iterator.slots || {};
    iterator.slots.tp$iter = Sk.generic.selfIter;
    iterator.slots.tp$iternext = iterator.slots.tp$iternext || iterator.iternext;
    iterator.slots.tp$getattr = iterator.slots.tp$getattr || Sk.generic.getAttr;
    let ret = Sk.abstr.buildNativeClass(typename, iterator);
    Sk.abstr.built$iterators.push(ret);
    return ret;
};

Sk.abstr.built$iterators = [];

Sk.abstr.setUpModuleMethods = function (module_name, module, method_defs) {
    Object.entries(method_defs).forEach(([method_name, method_def]) => {
        method_def.$name = method_def.$name || method_name; // operator e.g. some methods share method_defs
        module[method_name] = new Sk.builtin.sk_method(method_def, null, module_name);
    });
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
 * @deprecated
 */
Sk.abstr.superConstructor = function (thisClass, self, args) {
    var argumentsForConstructor = Array.prototype.slice.call(arguments, 2);
    thisClass.prototype.tp$base.apply(self, argumentsForConstructor);
};
