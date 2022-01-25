/*
 *  __author__: Isaac Dontje Lindell (i@isaacdontjelindell.com)
 *
 *  Implementation of the Python operator module.
 */
function $builtinmodule(name) {
    const {
        builtin: {
            str: pyStr,
            tuple: pyTuple,
            list: pyList,
            int_: pyInt,
            bool: pyBool,
            TypeError: pyTypeError,
            ValueError,
            none: { none$: pyNone },
            NotImplemented: { NotImplemented$: pyNotImplemented },
            abs: pyAbs,
            len: pyLen,
            checkString,
            checkInt,
        },
        abstr: {
            buildNativeClass,
            checkNoKwargs,
            checkArgsLen,
            checkOneArg,
            numberUnaryOp,
            numberBinOp,
            numberInplaceBinOp,
            objectGetItem,
            objectDelItem,
            objectSetItem,
            sequenceConcat,
            sequenceContains,
            sequenceGetCountOf,
            sequenceGetIndexOf,
            sequenceInPlaceConcat,
            typeName,
            lookupSpecial,
            gattr: getAttr,
            setUpModuleMethods,
        },
        misceval: {
            richCompareBool,
            asIndexOrThrow,
            chain: chainOrSuspend,
            callsimArray: pyCall,
            callsimOrSuspendArray: pyCallOrSuspend,
            objectRepr,
        },
        generic: { getAttr: genericGetAttr },
    } = Sk;

    // prettier-ignore
    const WITH_DUNDER = [
        "abs",      "add",     "and_",      "concat",  "contains", "delitem", "eq",        "floordiv",
        "ge",       "getitem", "gt",        "iadd",    "iand",     "iconcat", "ifloordiv", "ilshift",
        "imatmul",  "imod",    "imul",      "index",   "inv",      "invert",  "ior",       "ipow",
        "irshift",  "isub",    "itruediv",  "ixor",    "le",       "lshift",  "lt",        "matmul",
        "mod",      "mul",     "ne",        "neg",     "not_",     "or_",     "pos",       "pow",
        "rshift",   "setitem", "sub",       "truediv", "xor"
    ];

    const ALL = [
        "attrgetter",
        "countOf",
        "indexOf",
        "is_",
        "is_not",
        "itemgetter",
        "length_hint",
        "methodcaller",
        "truth",
        ...WITH_DUNDER,
    ].sort();

    const operator = {
        __name__: new pyStr("operator"),
        __doc__: new pyStr(
            "Operator interface.\n\nThis module exports a set of functions implemented in javascript corresponding\nto the intrinsic operators of Python.  For example, operator.add(x, y)\nis equivalent to the expression x+y.  The function names are those\nused for special methods; variants without leading and trailing\n'__' are also provided for convenience."
        ),
        __all__: new pyList(ALL.map((x) => new pyStr(x))),
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
                checkOneArg("itemgetter", args, kwargs);
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
                checkOneArg("attrgetter", args, kwargs);
                const obj = args[0];
                if (this.oneattr) {
                    return this.attr.reduce((obj, attr) => getAttr(obj, attr), obj);
                }
                const ret = this.attrs.map((attrs) => attrs.reduce((obj, attr) => getAttr(obj, attr), obj));
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
                checkOneArg("methodcaller", args, kwargs);
                const obj = args[0];
                return chainOrSuspend(getAttr(obj, this.$name, true), (method) =>
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

    const methodSpec = {
        1: { $flags: { OneArg: true }, $textsig: "($module, a, /)" },
        2: { $flags: { MinArgs: 2, MaxArgs: 2 }, $textsig: "($module, a, b, /)" },
        3: { $flags: { MinArgs: 3, MaxArgs: 3 }, $textsig: "($module, a, b, c, /)" },
    };

    function makeModuleMethod(fn, doc) {
        return { $meth: fn, $doc: doc, ...methodSpec[fn.length] };
    }

    function sameAs(docString) {
        return "Same as " + docString + ".";
    }

    setUpModuleMethods("operator", operator, {
        lt: makeModuleMethod((a, b) => pyBool(richCompareBool(a, b, "Lt")), sameAs("a < b")),
        le: makeModuleMethod((a, b) => pyBool(richCompareBool(a, b, "LtE")), sameAs("a <= b")),
        eq: makeModuleMethod((a, b) => pyBool(richCompareBool(a, b, "Eq")), sameAs("a == b")),
        ne: makeModuleMethod((a, b) => pyBool(richCompareBool(a, b, "NotEq")), sameAs("a != b")),
        ge: makeModuleMethod((a, b) => pyBool(richCompareBool(a, b, "GtE")), sameAs("a >= b")),
        gt: makeModuleMethod((a, b) => pyBool(richCompareBool(a, b, "Gt")), sameAs("a > b")),
        not_: makeModuleMethod((a) => numberUnaryOp(a, "Not"), sameAs("not a")),
        truth: makeModuleMethod((a) => pyBool(a), "Return True if a is true, False otherwise."),
        is_: makeModuleMethod((a, b) => pyBool(richCompareBool(a, b, "Is")), sameAs("a is b")),
        is_not: makeModuleMethod((a, b) => pyBool(richCompareBool(a, b, "IsNot")), sameAs("a is not b")),
        abs: makeModuleMethod((a) => pyAbs(a), sameAs("abs(a)")),
        add: makeModuleMethod((a, b) => numberBinOp(a, b, "Add"), sameAs("a + b")),
        and_: makeModuleMethod((a, b) => numberBinOp(a, b, "BitAnd"), sameAs("a & b")),
        floordiv: makeModuleMethod((a, b) => numberBinOp(a, b, "FloorDiv"), sameAs("a // b")),
        index: makeModuleMethod((a) => new pyInt(asIndexOrThrow(a)), sameAs("a.__index__()")),
        inv: makeModuleMethod((a) => numberUnaryOp(a, "Invert"), sameAs("~a")),
        invert: makeModuleMethod((a) => numberUnaryOp(a, "Invert"), sameAs("~a")),
        lshift: makeModuleMethod((a, b) => numberBinOp(a, b, "LShift"), sameAs("a << b")),
        mod: makeModuleMethod((a, b) => numberBinOp(a, b, "Mod"), sameAs("a % b")),
        mul: makeModuleMethod((a, b) => numberBinOp(a, b, "Mult"), sameAs("a * b")),
        matmul: makeModuleMethod((a, b) => numberBinOp(a, b, "MatMult"), sameAs("a @ b")),
        neg: makeModuleMethod((a) => numberUnaryOp(a, "USub"), sameAs("-a")),
        or_: makeModuleMethod((a, b) => numberBinOp(a, b, "BitOr"), sameAs("a | b")),
        pos: makeModuleMethod((a) => numberUnaryOp(a, "UAdd"), sameAs("+a")),
        pow: makeModuleMethod((a, b) => numberBinOp(a, b, "Pow"), sameAs("a ** b")),
        rshift: makeModuleMethod((a, b) => numberBinOp(a, b, "RShift"), sameAs("a >> b")),
        sub: makeModuleMethod((a, b) => numberBinOp(a, b, "Sub"), sameAs("a - b")),
        truediv: makeModuleMethod((a, b) => numberBinOp(a, b, "Div"), sameAs("a / b")),
        xor: makeModuleMethod((a, b) => numberBinOp(a, b, "BitXor"), sameAs("a ^ b")),
        concat: makeModuleMethod((a, b) => sequenceConcat(a, b), sameAs("a + b, for a and b sequences")),
        contains: makeModuleMethod(
            (a, b) => chainOrSuspend(sequenceContains(a, b), pyBool),
            sameAs("b in a (note reversed operands)")
        ),
        countOf: makeModuleMethod((a, b) => sequenceGetCountOf(a, b), "Return thenumber of times b occurs in a."),
        delitem: makeModuleMethod(
            (a, b) => chainOrSuspend(objectDelItem(a, b, true), () => pyNone),
            sameAs("del a[b]")
        ),
        getitem: makeModuleMethod((a, b) => objectGetItem(a, b, true), sameAs("a[b]")),
        indexOf: makeModuleMethod((a, b) => sequenceGetIndexOf(a, b), "Return the first index of b in a"),
        setitem: makeModuleMethod(
            (a, b, c) => chainOrSuspend(objectSetItem(a, b, c, true), () => pyNone),
            sameAs("a[b] = c")
        ),
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
        iadd: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "Add"), sameAs("a += b")),
        iand: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "BitAnd"), sameAs("a &= b")),
        iconcat: makeModuleMethod((a, b) => sequenceInPlaceConcat(a, b), sameAs("a += b, for a and b sequences")),
        ifloordiv: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "FloorDiv"), sameAs("a //= b")),
        ilshift: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "LShift"), sameAs("a <<= b")),
        imod: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "Mod"), sameAs("a %= b")),
        imul: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "Mult"), sameAs("a *= b")),
        imatmul: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "MatMult"), sameAs("a @= b")),
        ior: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "BitOr"), sameAs("a |= b")),
        ipow: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "Pow"), sameAs("a **= b")),
        irshift: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "RShift"), sameAs("a >>= b")),
        isub: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "Sub"), sameAs("a -= b")),
        itruediv: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "Div"), sameAs("a /= b")),
        ixor: makeModuleMethod((a, b) => numberInplaceBinOp(a, b, "BitXor"), sameAs("a ^= b")),
    });

    // prettier-ignore
    WITH_DUNDER.forEach((op) => {
        operator[`__${op.replace("_", "")}__`] = operator[op];
    });

    // py2
    operator.div = operator.truediv;
    operator.__div__ = operator.div;

    return operator;
}
