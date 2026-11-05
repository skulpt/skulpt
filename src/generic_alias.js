Sk.builtin.GenericAlias = Sk.abstr.buildNativeClass("types.GenericAlias", {
    constructor: function GenericAlias(origin, args) {
        this.$origin = origin;
        if (!(args instanceof Sk.builtin.tuple)) {
            args = new Sk.builtin.tuple([args]);
        }
        this.$args = args;
        this.$params = null;
    },
    slots: {
        tp$as_number: true,
        nb$or(other) {
            return Sk.builtin.UnionType.$or.call(this, other);
        },
        nb$reflected_or(other) {
            return Sk.builtin.UnionType.$or.call(other, this);
        },
        tp$new(args, kwargs) {
            Sk.abstr.checkNoKwargs("GenericAlias", kwargs);
            Sk.abstr.checkArgsLen("GenericAlias", args, 2, 2);
            return new Sk.builtin.GenericAlias(args[0], args[1]);
        },
        tp$getattr(pyName, canSuspend) {
            if (Sk.builtin.checkString(pyName)) {
                if (!this.attr$exc.includes(pyName.v)) {
                    return this.$origin.tp$getattr(pyName, canSuspend);
                }
            }
            return Sk.generic.getAttr.call(this, pyName, canSuspend);
        },
        $r() {
            const origin_repr = this.ga$repr(this.$origin);
            let arg_repr = "";
            this.$args.v.forEach((arg, i) => {
                arg_repr += i > 0 ? ", " : "";
                arg_repr += this.ga$repr(arg);
            });
            if (!arg_repr) {
                arg_repr = "()";
            }
            return new Sk.builtin.str(origin_repr + "[" + arg_repr + "]");
        },
        tp$doc: "Represent a PEP 585 generic type\n\nE.g. for t = list[int], t.origin is list and t.args is (int,).",
        tp$hash() {
            const h0 = Sk.abstr.objectHash(this.$origin);
            if (h0 == -1) {
                return -1;
            }
            const h1 = Sk.abstr.objectHash(this.$args);
            if (h1 == -1) {
                return -1;
            }
            return h0 ^ h1;
        },
        tp$call(args, kwargs) {
            const obj = Sk.misceval.callsimArray(this.$origin, args, kwargs);
            try {
                obj.tp$setattr(new Sk.builtin.str("__orig_class__"), this);
            } catch (e) {
                if (!(e instanceof Sk.builtin.AttributeError) && !(e instanceof Sk.builtin.TypeError)) {
                    throw e;
                }
            }
            return obj;
        },
        tp$richcompare(other, op) {
            if (!(other instanceof Sk.builtin.GenericAlias) || (op !== "Eq" && op !== "NotEq")) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            const eq = Sk.misceval.richCompareBool(this.$origin, other.$origin, "Eq");
            if (!eq) {
                return op === "Eq" ? eq : !eq;
            }
            const res = Sk.misceval.richCompareBool(this.$args, other.$args, "Eq");
            return op === "Eq" ? res : !res;
        },
        tp$as_sequence_or_mapping: true,
        mp$subscript(item) {
            if (this.$params === null) {
                this.mk$params();
            }
            const args = Sk.builtin.GenericAlias.$substitute(this.$args.v, this.$params.v, item);
            return new Sk.builtin.GenericAlias(this.$origin, new Sk.builtin.tuple(args));
        },
    },
    methods: {
        __mro_entries__: {
            $meth(bases) {
                return new Sk.builtin.tuple([this.$origin]);
            },
            $flags: { OneArg: true },
        },
        __instancecheck__: {
            $meth(_) {
                throw new Sk.builtin.TypeError("isinstance() argument 2 cannot be a parameterized generic");
            },
            $flags: { OneArg: true },
        },
        __subclasscheck__: {
            $meth(_) {
                throw new Sk.builtin.TypeError("issubclass() argument 2 cannot be a parameterized generic");
            },
            $flags: { OneArg: true },
        },
    },
    getsets: {
        __parameters__: {
            $get() {
                if (this.$params === null) {
                    this.mk$params();
                }
                return this.$params;
            },
            $doc: "Type variables in the GenericAlias.",
        },
        __origin__: {
            $get() {
                return this.$origin;
            },
        },
        __args__: {
            $get() {
                return this.$args;
            },
        },
    },
    proto: {
        // functions here match similar functions in Objects/genericaliasobject.c
        mk$params() {
            this.$params = new Sk.builtin.tuple(Sk.builtin.GenericAlias.$typeParameters(this.$args.v));
        },
        ga$repr(item) {
            if (item === Sk.builtin.Ellipsis) {
                return "...";
            }
            if (Sk.abstr.lookupSpecial(item, this.str$orig)) {
                if (Sk.abstr.lookupSpecial(item, this.str$args)) {
                    return Sk.misceval.objectRepr(item);
                }
            }
            const qualname = Sk.abstr.lookupSpecial(item, Sk.builtin.str.$qualname);
            if (qualname === undefined) {
                return Sk.misceval.objectRepr(item);
            }
            const mod = Sk.abstr.lookupSpecial(item, Sk.builtin.str.$module);
            if (mod === undefined || Sk.builtin.checkNone(mod)) {
                return Sk.misceval.objectRepr(item);
            } else if (mod.toString() === "builtins") {
                return qualname.toString();
            }
            return mod.toString() + "." + qualname.toString();
        },
        str$orig: new Sk.builtin.str("__origin__"),
        str$args: new Sk.builtin.str("__args__"),
        attr$exc: [
            "__origin__",
            "__args__",
            "__parameters__",
            "__mro_entries__",
            "__reduce_ex__", // needed so we don't look up object.__reduce_ex__
            "__reduce__",
        ],
    },
});

// Shared with typing aliases: preserve parameter identity and declaration order,
// including parameters carried by nested aliases (Objects/genericaliasobject.c).
Sk.builtin.GenericAlias.$typeParameters = function (args) {
    const parameters = [];
    for (const arg of args) {
        let values = [];
        if (arg.$isTypeParameter) {
            values = [arg];
        } else if (!arg.sk$type) {
            const nested = Sk.abstr.lookupAttr(arg, new Sk.builtin.str("__parameters__"));
            if (nested instanceof Sk.builtin.tuple) {
                values = nested.v;
            }
        }
        for (const parameter of values) {
            if (!parameters.includes(parameter)) {
                parameters.push(parameter);
            }
        }
    }
    return parameters;
};

Sk.builtin.GenericAlias.$substitute = function (args, parameters, item) {
    const values = item instanceof Sk.builtin.tuple ? item.v : [item];
    if (parameters.length === 0) {
        throw new Sk.builtin.TypeError("There are no type variables left in this alias");
    }
    if (parameters.some((parameter) => parameter.$isVariadic)) {
        throw new Sk.builtin.NotImplementedError("Parameter-pack substitution is not supported");
    }
    if (values.length !== parameters.length) {
        throw new Sk.builtin.TypeError("Expected " + parameters.length + " type arguments, got " + values.length);
    }
    const replacements = new Map(parameters.map((parameter, i) => [parameter, values[i]]));
    return args.map((arg) => {
        if (replacements.has(arg)) {
            return replacements.get(arg);
        }
        if (!arg.sk$type) {
            const nested = Sk.abstr.lookupAttr(arg, new Sk.builtin.str("__parameters__"));
            if (nested instanceof Sk.builtin.tuple && nested.v.length) {
                const newArgs = nested.v.map((parameter) => replacements.has(parameter) ? replacements.get(parameter) : parameter);
                return Sk.abstr.objectGetItem(arg, new Sk.builtin.tuple(newArgs));
            }
        }
        return arg;
    });
};
