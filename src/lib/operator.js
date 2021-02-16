/*
 *  __author__: Isaac Dontje Lindell (i@isaacdontjelindell.com)
 *
 *  Implementation of the Python operator module.
 */
function $builtinmodule(name) {
    operator = {
        __name__: new Sk.builtin.str("operator"),
        __doc__: new Sk.builtin.str(
            "Operator interface.\n\nThis module exports a set of functions implemented in javascript corresponding\nto the intrinsic operators of Python.  For example, operator.add(x, y)\nis equivalent to the expression x+y.  The function names are those\nused for special methods; variants without leading and trailing\n'__' are also provided for convenience."
        ),
        __all__: new Sk.builtin.list(
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
            ].map((x) => new Sk.builtin.str(x))
        ),
    };

    operator.itemgetter = Sk.abstr.buildNativeClass("operator.itemgetter", {
        constructor: function itemgetter(items) {
            this.items = items;
            this.oneitem = items.length === 1;
            this.item = items[0];
            this.in$repr = false;
        },
        slots: {
            tp$getattr: Sk.generic.getAttr,
            tp$new(args, kwargs) {
                Sk.abstr.checkNoKwargs("itemgetter", kwargs);
                Sk.abstr.checkArgsLen("itemgetter", args, 1);
                return new operator.itemgetter(args);
            },
            tp$call(args, kwargs) {
                Sk.abstr.checkNoKwargs("itemgetter", kwargs);
                Sk.abstr.checkArgsLen("itemgetter", args, 1, 1);
                const obj = args[0];
                if (this.oneitem) {
                    return Sk.abstr.objectGetItem(obj, this.item, true);
                }
                return new Sk.builtin.tuple(this.items.map((x) => Sk.abstr.objectGetItem(obj, x)));
            },
            tp$doc:
                "Return a callable object that fetches the given item(s) from its operand.\n\
            After f = itemgetter(2), the call f(r) returns r[2].\n\
            After g = itemgetter(2, 5, 3), the call g(r) returns (r[2], r[5], r[3])",
            $r() {
                if (this.in$repr) {
                    return new Sk.builtin.str(this.tp$name + "(...)");
                }
                this.in$repr = true;
                const ret = this.tp$name + "(" + this.items.map((x) => Sk.misceval.objectRepr(x)).join(", ") + ")";
                this.in$repr = false;
                return ret;
            },
        },
    });

    operator.attrgetter = Sk.abstr.buildNativeClass("operator.attrgetter", {
        constructor: function attrgetter(attrs) {
            this.attrs = attrs;
            this.oneattr = attrs.length === 1;
            this.attr = attrs[0];
            this.in$repr = false;
        },
        slots: {
            tp$getattr: Sk.generic.getAttr,
            tp$new(args, kwargs) {
                Sk.abstr.checkNoKwargs("attrgetter", kwargs);
                Sk.abstr.checkArgsLen("attrgetter", args, 1);
                const attrs = [];
                for (let i = 0; i < args.length; i++) {
                    const attr = args[i];
                    if (!Sk.builtin.checkString(attr)) {
                        throw new Sk.builtin.TypeError("attribute name must be a string");
                    }
                    if (attr.v.includes(".")) {
                        attrs.push(
                            attr
                                .$jsstr()
                                .split(".")
                                .map((x) => new Sk.builtin.str(x))
                        );
                    } else {
                        attrs.push([attr]);
                    }
                }
                return new operator.attrgetter(attrs);
            },
            tp$call(args, kwargs) {
                Sk.abstr.checkNoKwargs("attrgetter", kwargs);
                Sk.abstr.checkArgsLen("attrgetter", args, 1, 1);
                const obj = args[0];
                if (this.oneattr) {
                    return this.attr.reduce((obj, attr) => Sk.abstr.gattr(obj, attr), obj);
                }
                const ret = this.attrs.map((attrs) => attrs.reduce((obj, attr) => Sk.abstr.gattr(obj, attr), obj));
                return new Sk.builtin.tuple(ret);
            },
            tp$doc:
                "attrgetter(attr, ...) --> attrgetter object\n\nReturn a callable object that fetches the given attribute(s) from its operand.\nAfter f = attrgetter('name'), the call f(r) returns r.name.\nAfter g = attrgetter('name', 'date'), the call g(r) returns (r.name, r.date).\nAfter h = attrgetter('name.first', 'name.last'), the call h(r) returns\n(r.name.first, r.name.last).",
            $r() {
                if (this.in$repr) {
                    return new Sk.builtin.str(this.tp$name + "(...)");
                }
                this.in$repr = true;
                const ret = this.tp$name + "(" + this.items.map((x) => Sk.misceval.objectRepr(x)).join(", ") + ")";
                this.in$repr = false;
                return ret;
            },
        },
    });

    operator.methodcaller = Sk.abstr.buildNativeClass("operator.methodcaller", {
        constructor: function methodcaller($name, args, kwargs) {
            this.$name = $name;
            this.args = args;
            this.kwargs = kwargs || [];
            this.in$repr = false;
        },
        slots: {
            tp$getattr: Sk.generic.getAttr,
            tp$new(args, kwargs) {
                Sk.abstr.checkArgsLen("methodcaller", args, 1);
                const $name = args[0];
                if (!Sk.builtin.checkString($name)) {
                    throw new Sk.builtin.TypeError("method name must be a string");
                }
                return new operator.methodcaller($name, args.slice(1), kwargs);
            },
            tp$call(args, kwargs) {
                Sk.abstr.checkNoKwargs("methodcaller", kwargs);
                Sk.abstr.checkArgsLen("methodcaller", args, 1, 1);
                const obj = args[0];
                return Sk.misceval.chain(Sk.abstr.gattr(obj, this.$name, true), (method) =>
                    Sk.misceval.callsimOrSuspendArray(method, this.args, this.kwargs)
                );
            },
            tp$doc:
                "methodcaller(name, ...) --> methodcaller object\n\nReturn a callable object that calls the given method on its operand.\nAfter f = methodcaller('name'), the call f(r) returns r.name().\nAfter g = methodcaller('name', 'date', foo=1), the call g(r) returns\nr.name('date', foo=1).",
            $r() {
                if (this.in$repr) {
                    return new Sk.builtin.str(this.tp$name + "(...)");
                }
                this.in$repr = true;
                let ret = [Sk.misceval.objectRepr(this.$name)];
                ret.push(...this.args.map((x) => Sk.misceval.objectRepr(x)));
                for (let i = 0; i < this.kwargs.length; i += 2) {
                    ret.push(this.kwargs[i] + "=" + Sk.misceval.objectRepr(this.kwargs[i + 1]));
                }
                ret = this.tp$name + "(" + ret.join(", ") + ")";
                this.in$repr = false;
                return ret;
            },
        },
    });

    Sk.abstr.setUpModuleMethods("operator", operator, {
        lt: {
            $meth: function lt(a, b) {
                return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, "Lt"));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a < b.",
        },
        le: {
            $meth: function le(a, b) {
                return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, "LtE"));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a <= b.",
        },
        eq: {
            $meth: function eq(a, b) {
                return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, "Eq"));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a == b.",
        },
        ne: {
            $meth: function ne(a, b) {
                return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, "NotEq"));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a != b.",
        },
        ge: {
            $meth: function ge(a, b) {
                return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, "GtE"));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a >= b.",
        },
        gt: {
            $meth: function gt(a, b) {
                return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, "Gt"));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a > b.",
        },
        not_: {
            $meth: function not_(obj) {
                return Sk.abstr.numberUnaryOp(obj, "Not");
            },
            $flags: { OneArg: true },
            $textsig: "($module, a, /)",
            $doc: "Same as not a.",
        },
        truth: {
            $meth: function truth(obj) {
                return Sk.builtin.bool(obj);
            },
            $flags: { OneArg: true },
            $textsig: "($module, a, /)",
            $doc: "Return True if a is true, False otherwise.",
        },
        is_: {
            $meth: function is_(a, b) {
                return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, "Is"));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a is b.",
        },
        is_not: {
            $meth: function is_not(a, b) {
                return Sk.builtin.bool(Sk.misceval.richCompareBool(a, b, "IsNot"));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a is not b.",
        },
        abs: {
            $meth: function abs(obj) {
                return Sk.builtin.abs(obj);
            },
            $flags: { OneArg: true },
            $textsig: "($module, a, /)",
            $doc: "Same as abs(a).",
        },
        add: {
            $meth: function add(a, b) {
                return Sk.abstr.numberBinOp(a, b, "Add");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a + b.",
        },
        and_: {
            $meth: function and_(a, b) {
                return Sk.abstr.numberBinOp(a, b, "BitAnd");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a & b.",
        },
        floordiv: {
            $meth: function floordiv(a, b) {
                return Sk.abstr.numberBinOp(a, b, "FloorDiv");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a // b.",
        },
        index: {
            $meth: function index(a) {
                return new Sk.builtin.int_(Sk.misceval.asIndexOrThrow(a));
            },
            $flags: { OneArg: true },
            $textsig: "($module, a, /)",
            $doc: "Same as a.__index__()",
        },
        inv: {
            $meth: function inv(obj) {
                return Sk.abstr.numberUnaryOp(obj, "Invert");
            },
            $flags: { OneArg: true },
            $textsig: "($module, a, /)",
            $doc: "Same as ~a.",
        },
        invert: {
            $meth: function invert(obj) {
                return Sk.abstr.numberUnaryOp(obj, "Invert");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, /)",
            $doc: "Same as ~a.",
        },
        lshift: {
            $meth: function lshift(a, b) {
                return Sk.abstr.numberBinOp(a, b, "LShift");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a << b.",
        },
        mod: {
            $meth: function mod(a, b) {
                return Sk.abstr.numberBinOp(a, b, "Mod");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a % b.",
        },
        mul: {
            $meth: function mul(a, b) {
                return Sk.abstr.numberBinOp(a, b, "Mult");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a * b.",
        },
        matmul: {
            $meth: function matmul(a, b) {
                return Sk.abstr.numberBinOp(a, b, "MatMult");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a @ b.",
        },
        neg: {
            $meth: function neg(obj) {
                return Sk.abstr.numberUnaryOp(obj, "USub");
            },
            $flags: { OneArg: true },
            $textsig: "($module, a, /)",
            $doc: "Same as -a.",
        },
        or_: {
            $meth: function or_(a, b) {
                return Sk.abstr.numberBinOp(a, b, "BitOr");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a | b.",
        },
        pos: {
            $meth: function pos(obj) {
                return Sk.abstr.numberUnaryOp(obj, "UAdd");
            },
            $flags: { OneArg: true },
            $textsig: "($module, a, /)",
            $doc: "Same as +a.",
        },
        pow: {
            $meth: function pow(a, b) {
                return Sk.abstr.numberBinOp(a, b, "Pow");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a ** b.",
        },
        rshift: {
            $meth: function rshift(a, b) {
                return Sk.abstr.numberBinOp(a, b, "RShift");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a >> b.",
        },
        sub: {
            $meth: function sub(a, b) {
                return Sk.abstr.numberBinOp(a, b, "Sub");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a - b.",
        },
        truediv: {
            $meth: function div(a, b) {
                return Sk.abstr.numberBinOp(a, b, "Div");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a / b.",
        },
        xor: {
            $meth: function xor(a, b) {
                return Sk.abstr.numberBinOp(a, b, "BitXor");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a ^ b.",
        },
        concat: {
            $meth: function concat(a, b) {
                return Sk.abstr.sequenceConcat(a, b);
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a + b, for a and b sequences.",
        },
        contains: {
            $meth: function contains(a, b) {
                return Sk.builtin.bool(Sk.abstr.sequenceContains(a, b));
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as b in a (note reversed operands).",
        },
        countOf: {
            $meth: function countOf(a, b) {
                return Sk.abstr.sequenceGetCountOf(a, b);
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Return the number of times b occurs in a.",
        },
        delitem: {
            $meth: function delitem(a, b) {
                return Sk.misceval.chain(Sk.abstr.objectDelItem(a, b, true), () => Sk.builtin.none.none$);
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as del a[b].",
        },
        getitem: {
            $meth: function getitem(a, b) {
                return Sk.abstr.objectGetItem(a, b);
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a[b].",
        },
        indexOf: {
            $meth: function indexOf(a, b) {
                return Sk.abstr.sequenceGetIndexOf(a, b);
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Return the first index of b in a.",
        },
        setitem: {
            $meth: function setitem(a, b, c) {
                return Sk.misceval.chain(Sk.abstr.objectSetItem(a, b, c, true), () => Sk.builtin.none.none$);
            },
            $flags: { MinArgs: 3, MaxArgs: 3 },
            $textsig: "($module, a, b, c, /)",
            $doc: "Same as a[b] = c.",
        },
        length_hint: {
            $meth: function length_hint(obj, d) {
                if (d === undefined) {
                    d = new Sk.builtin.int_(0);
                } else if (!Sk.builtin.checkInt(d)) {
                    throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(d) + "' object cannot be interpreted as an integer");
                }
                try {
                    return Sk.builtin.len(obj);
                } catch (e) {
                    if (!(e instanceof Sk.builtin.TypeError)) {
                        throw e;
                    }
                }
                const func = Sk.abstr.lookupSpecial(obj, Sk.builtin.str.$length_hint);
                if (func !== undefined) {
                    const val = Sk.misceval.callsimArray(func, []);
                    if (val === Sk.builtin.NotImplemented.NotImplemented$) {
                        return d;
                    }
                    if (!Sk.builtin.checkInteger(val)) {
                        throw new Sk.builtin.TypeError("__length_hint__ must be an integer, not " + Sk.abstr.typeName(val));
                    } else if (val.nb$isnegative()) {
                        throw new Sk.builtin.TypeError("__length_hint__() should return >= 0");
                    }
                    return val;
                }
                return d;
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($module, obj, default=0, /)",
            $doc:
                "Return an estimate of the number of items in obj.\n\nThis is useful for presizing containers when building from an iterable.\n\nIf the object supports len(), the result will be exact.\nOtherwise, it may over- or under-estimate by an arbitrary amount.\nThe result will be an integer >= 0.",
        },
        iadd: {
            $meth: function iadd(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "Add");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a += b.",
        },
        iand: {
            $meth: function iand(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "BitAnd");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a &= b.",
        },
        iconcat: {
            $meth: function iconcat(a, b) {
                if (a.sq$inplace_concat !== undefined) {
                    return a.sq$inplace_concat(b);
                } else if (a.sq$concat !== undefined) {
                    return a.sq$concat(b);
                }
                if (!Sk.builtin.checkSequence(a) || !Sk.builtin.checkSequence(b)) {
                    throw new Sk.builtin.TypeError(Sk.abstr.typeName(a) + " object can't be concatenated");
                }
                return Sk.abstr.numberInplaceBinOp(a, b, "Add");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a += b, for a and b sequences.",
        },
        ifloordiv: {
            $meth: function ifloordiv(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "FloorDiv");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a //= b.",
        },
        ilshift: {
            $meth: function ilshift(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "LShift");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a <<= b.",
        },
        imod: {
            $meth: function imod(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "Mod");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a %= b.",
        },
        imul: {
            $meth: function imul(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "Mult");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a *= b.",
        },
        imatmul: {
            $meth: function imatmul(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "MatMult");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a @= b.",
        },
        ior: {
            $meth: function ior(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "BitOr");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a |= b.",
        },
        ipow: {
            $meth: function ipow(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "Pow");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a **= b.",
        },
        irshift: {
            $meth: function irshift(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "LRhift");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a >>= b.",
        },
        isub: {
            $meth: function isub(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "Sub");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a -= b.",
        },
        itruediv: {
            $meth: function idiv(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "Div");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
            $doc: "Same as a /= b.",
        },
        ixor: {
            $meth: function ixor(a, b) {
                return Sk.abstr.numberInplaceBinOp(a, b, "BitXor");
            },
            $flags: { MinArgs: 2, MaxArgs: 2 },
            $textsig: "($module, a, b, /)",
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
        _abs: Sk.builtins.abs,
        // py2
        div: operator.truediv,
        __div__: operator.truediv,
    });

    return operator;
}
