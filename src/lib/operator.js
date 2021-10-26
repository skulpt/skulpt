/*
 *  __author__: Isaac Dontje Lindell (i@isaacdontjelindell.com)
 *
 *  Implementation of the Python operator module.
 */
function $builtinmodule(name) {
    const {
        builtin: {
            bool: pyBool,
            int_: pyInt,
            str: pyStr,
            list: pyList,
            tuple: pyTuple,
            abs: pyAbs,
            len: pyLen,
            none: { none$: pyNone },
            NotImplemented: { NotImplemented$: pyNotImplemented },
            checkString,
            checkInt,
            TypeError: pyTypeError,
            ValueError,
        },
        abstr: {
            numberBinOp,
            numberUnaryOp,
            numberInplaceBinOp,
            buildNativeClass,
            setUpModuleMethods,
            checkNoKwargs,
            checkArgsLen,
            gattr: objectGetAttr,
            objectGetItem,
            objectSetItem,
            objectDelItem,
            lookupSpecial,
            sequenceConcat,
            sequenceInPlaceConcat,
            sequenceContains,
            sequenceGetCountOf,
            sequenceGetIndexOf,
            typeName,
        },
        misceval: {
            objectRepr,
            richCompareBool,
            chain: chainOrSuspend,
            callsimArray: pyCall,
            callsimOrSuspendArray: pyCallOrSuspend,
            asIndexOrThrow,
        },
        generic: { objectGetAttr: genericGetAttr },
    } = Sk;

    const operator = {
        __name__: new pyStr("operator"),
        __doc__: new pyStr(
            "Operator interface.\n\nThis module exports a set of functions implemented in javascript corresponding\nto the intrinsic operators of Python.  For example, operator.add(x, y)\nis equivalent to the expression x+y.  The function names are those\nused for special methods; variants without leading and trailing\n'__' are also provided for convenience."
        ),
        __all__: new pyList(
            [
                "abs",
                "add",
                "and_",
                "attrgetter",
                "concat",
                "contains",
                "countOf",
                "delitem",
                "eq",
                "floordiv",
                "ge",
                "getitem",
                "gt",
                "iadd",
                "iand",
                "iconcat",
                "ifloordiv",
                "ilshift",
                "imatmul",
                "imod",
                "imul",
                "index",
                "indexOf",
                "inv",
                "invert",
                "ior",
                "ipow",
                "irshift",
                "is_",
                "is_not",
                "isub",
                "itemgetter",
                "itruediv",
                "ixor",
                "le",
                "length_hint",
                "lshift",
                "lt",
                "matmul",
                "methodcaller",
                "mod",
                "mul",
                "ne",
                "neg",
                "not_",
                "or_",
                "pos",
                "pow",
                "rshift",
                "setitem",
                "sub",
                "truediv",
                "truth",
                "xor",
            ].map((x) => new pyStr(x))
        ),
    };

    operator.itemgetter = buildNativeClass("operator.itemgetter", {
        constructor: function itemgetter(items) {
            this.items = items;
            this.oneitem = items.length === 1;
            this.item = items[0];
            this.in$repr = false;
        },
        slots: {
            tp$getattr: genericGetAttr,
            tp$new(args, kwargs) {
                checkNoKwargs("itemgetter", kwargs);
                checkArgsLen("itemgetter", args, 1);
                return new operator.itemgetter(args);
            },
            tp$call(args, kwargs) {
                checkNoKwargs("itemgetter", kwargs);
                checkArgsLen("itemgetter", args, 1, 1);
                const obj = args[0];
                if (this.oneitem) {
                    return objectGetItem(obj, this.item, true);
                }
                return new pyTuple(this.items.map((x) => objectGetItem(obj, x)));
            },
            tp$doc: "Return a callable object that fetches the given item(s) from its operand.\n\
            After f = itemgetter(2), the call f(r) returns r[2].\n\
            After g = itemgetter(2, 5, 3), the call g(r) returns (r[2], r[5], r[3])",
            $r() {
                if (this.in$repr) {
                    return new pyStr(this.tp$name + "(...)");
                }
                this.in$repr = true;
                const ret = this.tp$name + "(" + this.items.map((x) => objectRepr(x)).join(", ") + ")";
                this.in$repr = false;
                return ret;
            },
        },
    });

    operator.attrgetter = buildNativeClass("operator.attrgetter", {
        constructor: function attrgetter(attrs) {
            this.attrs = attrs;
            this.oneattr = attrs.length === 1;
            this.attr = attrs[0];
            this.in$repr = false;
        },
        slots: {
            tp$getattr: genericGetAttr,
            tp$new(args, kwargs) {
                checkNoKwargs("attrgetter", kwargs);
                checkArgsLen("attrgetter", args, 1);
                const attrs = [];
                for (let i = 0; i < args.length; i++) {
                    const attr = args[i];
                    if (!checkString(attr)) {
                        throw new pyTypeError("attribute name must be a string");
                    }
                    const jsAttr = attr.toString();
                    if (jsAttr.includes(".")) {
                        attrs.push(jsAttr.split(".").map((x) => new pyStr(x)));
                    } else {
                        attrs.push([attr]);
                    }
                }
                return new operator.attrgetter(attrs);
            },
            tp$call(args, kwargs) {
                checkNoKwargs("attrgetter", kwargs);
                checkArgsLen("attrgetter", args, 1, 1);
                const obj = args[0];
                if (this.oneattr) {
                    return this.attr.reduce((obj, attr) => objectGetAttr(obj, attr), obj);
                }
                const ret = this.attrs.map((attrs) => attrs.reduce((obj, attr) => objectGetAttr(obj, attr), obj));
                return new pyTuple(ret);
            },
            tp$doc: "attrgetter(attr, ...) --> attrgetter object\n\nReturn a callable object that fetches the given attribute(s) from its operand.\nAfter f = attrgetter('name'), the call f(r) returns r.name.\nAfter g = attrgetter('name', 'date'), the call g(r) returns (r.name, r.date).\nAfter h = attrgetter('name.first', 'name.last'), the call h(r) returns\n(r.name.first, r.name.last).",
            $r() {
                if (this.in$repr) {
                    return new pyStr(this.tp$name + "(...)");
                }
                this.in$repr = true;
                const ret = this.tp$name + "(" + this.items.map((x) => objectRepr(x)).join(", ") + ")";
                this.in$repr = false;
                return ret;
            },
        },
    });

    operator.methodcaller = buildNativeClass("operator.methodcaller", {
        constructor: function methodcaller($name, args, kwargs) {
            this.$name = $name;
            this.args = args;
            this.kwargs = kwargs || [];
            this.in$repr = false;
        },
        slots: {
            tp$getattr: genericGetAttr,
            tp$new(args, kwargs) {
                checkArgsLen("methodcaller", args, 1);
                const $name = args[0];
                if (!checkString($name)) {
                    throw new pyTypeError("method name must be a string");
                }
                return new operator.methodcaller($name, args.slice(1), kwargs);
            },
            tp$call(args, kwargs) {
                checkNoKwargs("methodcaller", kwargs);
                checkArgsLen("methodcaller", args, 1, 1);
                const obj = args[0];
                return chainOrSuspend(objectGetAttr(obj, this.$name, true), (method) =>
                    pyCallOrSuspend(method, this.args, this.kwargs)
                );
            },
            tp$doc: "methodcaller(name, ...) --> methodcaller object\n\nReturn a callable object that calls the given method on its operand.\nAfter f = methodcaller('name'), the call f(r) returns r.name().\nAfter g = methodcaller('name', 'date', foo=1), the call g(r) returns\nr.name('date', foo=1).",
            $r() {
                if (this.in$repr) {
                    return new pyStr(this.tp$name + "(...)");
                }
                this.in$repr = true;
                let ret = [objectRepr(this.$name)];
                ret.push(...this.args.map((x) => objectRepr(x)));
                for (let i = 0; i < this.kwargs.length; i += 2) {
                    ret.push(this.kwargs[i] + "=" + objectRepr(this.kwargs[i + 1]));
                }
                ret = this.tp$name + "(" + ret.join(", ") + ")";
                this.in$repr = false;
                return ret;
            },
        },
    });

    const BINOP_CALL_FLAGS = { MinArgs: 2, MaxArgs: 2 };
    const BINOP_TEXTSIG = "($module, a, b, /)";
    const UOP_CALL_FLAGS = { OneArg: true };
    const UOP_TEXTSIG = "($module, a, /)";

    setUpModuleMethods("operator", operator, {
        lt: {
            $meth: (a, b) => pyBool(richCompareBool(a, b, "Lt")),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a < b.",
        },
        le: {
            $meth: (a, b) => pyBool(richCompareBool(a, b, "LtE")),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a <= b.",
        },
        eq: {
            $meth: (a,b) => pyBool(richCompareBool(a, b, "Eq")),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a == b.",
        },
        ne: {
            $meth: (a, b) => pyBool(richCompareBool(a, b, "NotEq")),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a != b.",
        },
        ge: {
            $meth: (a, b) => pyBool(richCompareBool(a, b, "GtE")),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a >= b.",
        },
        gt: {
            $meth: (a, b) => pyBool(richCompareBool(a, b, "Gt")),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a > b.",
        },
        not_: {
            $meth: (obj) => numberUnaryOp(obj, "Not"),
            $flags: UOP_CALL_FLAGS,
            $textsig: UOP_TEXTSIG,
            $doc: "Same as not a.",
        },
        truth: {
            $meth: (obj) => pyBool(obj),
            $flags: UOP_CALL_FLAGS,
            $textsig: UOP_TEXTSIG,
            $doc: "Return True if a is true, False otherwise.",
        },
        is_: {
            $meth: (a, b) => pyBool(richCompareBool(a, b, "Is")),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a is b.",
        },
        is_not: {
            $meth: (a, b) => pyBool(richCompareBool(a, b, "IsNot")),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a is not b.",
        },
        abs: {
            $meth: (obj) => pyAbs(obj),
            $flags: UOP_CALL_FLAGS,
            $textsig: UOP_TEXTSIG,
            $doc: "Same as abs(a).",
        },
        add: {
            $meth: (a, b) => numberBinOp(a, b, "Add"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a + b.",
        },
        and_: {
            $meth: (a, b) => numberBinOp(a, b, "BitAnd"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a & b.",
        },
        floordiv: {
            $meth: (a, b) => numberBinOp(a, b, "FloorDiv"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a // b.",
        },
        index: {
            $meth: (a) => new pyInt(asIndexOrThrow(a)),
            $flags: UOP_CALL_FLAGS,
            $textsig: UOP_TEXTSIG,
            $doc: "Same as a.__index__()",
        },
        inv: {
            $meth: (obj) => numberUnaryOp(obj, "Invert"),
            $flags: UOP_CALL_FLAGS,
            $textsig: UOP_TEXTSIG,
            $doc: "Same as ~a.",
        },
        invert: {
            $meth: (obj) => numberUnaryOp(obj, "Invert"),
            $flags: UOP_CALL_FLAGS,
            $textsig: UOP_TEXTSIG,
            $doc: "Same as ~a.",
        },
        lshift: {
            $meth: (a, b) => numberBinOp(a, b, "LShift"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a << b.",
        },
        mod: {
            $meth: (a, b) => numberBinOp(a, b, "Mod"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a % b.",
        },
        mul: {
            $meth: (a, b) => numberBinOp(a, b, "Mult"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a * b.",
        },
        matmul: {
            $meth: (a, b) => numberBinOp(a, b, "MatMult"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a @ b.",
        },
        neg: {
            $meth: (obj) => numberUnaryOp(obj, "USub"),
            $flags: UOP_CALL_FLAGS,
            $textsig: UOP_TEXTSIG,
            $doc: "Same as -a.",
        },
        or_: {
            $meth: (a, b) => numberBinOp(a, b, "BitOr"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a | b.",
        },
        pos: {
            $meth: (obj) => numberUnaryOp(obj, "UAdd"),
            $flags: UOP_CALL_FLAGS,
            $textsig: UOP_TEXTSIG,
            $doc: "Same as +a.",
        },
        pow: {
            $meth: (a, b) => numberBinOp(a, b, "Pow"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a ** b.",
        },
        rshift: {
            $meth: (a, b) => numberBinOp(a, b, "RShift"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a >> b.",
        },
        sub: {
            $meth: (a, b) => numberBinOp(a, b, "Sub"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a - b.",
        },
        truediv: {
            $meth: (a, b) => numberBinOp(a, b, "Div"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a / b.",
        },
        xor: {
            $meth: (a, b) => numberBinOp(a, b, "BitXor"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a ^ b.",
        },
        concat: {
            $meth: (a, b) => sequenceConcat(a, b),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a + b, for a and b sequences.",
        },
        contains: {
            $meth: (a, b) => pyBool(sequenceContains(a, b)),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as b in a (note reversed operands).",
        },
        countOf: {
            $meth: (a, b) => sequenceGetCountOf(a, b),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Return the number of times b occurs in a.",
        },
        delitem: {
            $meth: (a, b) => chainOrSuspend(objectDelItem(a, b, true), () => pyNone),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as del a[b].",
        },
        getitem: {
            $meth: (a, b) => objectGetItem(a, b),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a[b].",
        },
        indexOf: {
            $meth: (a, b) => sequenceGetIndexOf(a, b),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Return the first index of b in a.",
        },
        setitem: {
            $meth: (a, b, c) => chainOrSuspend(objectSetItem(a, b, c, true), () => pyNone),
            $flags: { MinArgs: 3, MaxArgs: 3 },
            $textsig: "($module, a, b, c, /)",
            $doc: "Same as a[b] = c.",
        },
        length_hint: {
            $meth: function length_hint(obj, d) {
                if (d === undefined) {
                    d = new pyInt(0);
                } else if (!checkInt(d)) {
                    throw new pyTypeError("'" + typeName(d) + "' object cannot be interpreted as an integer");
                }
                try {
                    return pyLen(obj);
                } catch (e) {
                    if (!(e instanceof pyTypeError)) {
                        throw e;
                    }
                }
                const func = lookupSpecial(obj, pyStr.$length_hint);
                if (func === undefined) {
                    return d;
                }
                let val;
                try {
                    val = pyCall(func, []);
                } catch (e) {
                    if (!(e instanceof pyTypeError)) {
                        throw e;
                    }
                    return d;
                }
                if (val === pyNotImplemented) {
                    return d;
                }
                if (!checkInt(val)) {
                    throw new pyTypeError("__length_hint__ must be an integer, not " + typeName(val));
                } else if (val.nb$isnegative()) {
                    throw new ValueError("__length_hint__() should return >= 0");
                }
                return val;
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($module, obj, default=0, /)",
            $doc: "Return an estimate of the number of items in obj.\n\nThis is useful for presizing containers when building from an iterable.\n\nIf the object supports len(), the result will be exact.\nOtherwise, it may over- or under-estimate by an arbitrary amount.\nThe result will be an integer >= 0.",
        },
        iadd: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "Add"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a += b.",
        },
        iand: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "BitAnd"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a &= b.",
        },
        iconcat: {
            $meth: (a, b) => sequenceInPlaceConcat(a, b),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a += b, for a and b sequences.",
        },
        ifloordiv: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "FloorDiv"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a //= b.",
        },
        ilshift: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "LShift"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a <<= b.",
        },
        imod: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "Mod"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a %= b.",
        },
        imul: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "Mult"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a *= b.",
        },
        imatmul: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "MatMult"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a @= b.",
        },
        ior: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "BitOr"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a |= b.",
        },
        ipow: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "Pow"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a **= b.",
        },
        irshift: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "RShift"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a >>= b.",
        },
        isub: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "Sub"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a -= b.",
        },
        itruediv: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "Div"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a /= b.",
        },
        ixor: {
            $meth: (a, b) => numberInplaceBinOp(a, b, "BitXor"),
            $flags: BINOP_CALL_FLAGS,
            $textsig: BINOP_TEXTSIG,
            $doc: "Same as a ^= b.",
        },
    });

    Object.assign(operator, {
        __abs__: operator.abs,
        __add__: operator.add,
        __and__: operator.and,
        __concat__: operator.concat,
        __contains__: operator.contains,
        __delitem__: operator.delitem,
        __eq__: operator.eq,
        __floordiv__: operator.floordiv,
        __ge__: operator.ge,
        __getitem__: operator.getitem,
        __gt__: operator.gt,
        __iadd__: operator.iadd,
        __iand__: operator.iand,
        __iconcat__: operator.iconcat,
        __ifloordiv__: operator.ifloordiv,
        __ilshift__: operator.ilshift,
        __imatmul__: operator.imatmul,
        __imod__: operator.imod,
        __imul__: operator.imul,
        __index__: operator.index,
        __inv__: operator.inv,
        __invert__: operator.invert,
        __ior__: operator.ior,
        __ipow__: operator.ipow,
        __irshift__: operator.irshift,
        __isub__: operator.isub,
        __itruediv__: operator.itruediv,
        __ixor__: operator.ixor,
        __le__: operator.le,
        __lshift__: operator.lshift,
        __lt__: operator.lt,
        __matmul__: operator.matmul,
        __mod__: operator.mod,
        __mul__: operator.mul,
        __ne__: operator.ne,
        __neg__: operator.neg,
        __not__: operator.not,
        __or__: operator.or,
        __pos__: operator.pos,
        __pow__: operator.pow,
        __rshift__: operator.rshift,
        __setitem__: operator.setitem,
        __sub__: operator.sub,
        __truediv__: operator.truediv,
        __xor__: operator.xor,
        _abs: pyAbs,
        // py2
        div: operator.truediv,
        __div__: operator.truediv,
    });

    return operator;
}
