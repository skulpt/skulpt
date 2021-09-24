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
        tp$new(args, kwargs) {
            Sk.abstr.checkNoKwargs("GenericAlias", kwargs);
            Sk.abstr.checkArgsLen("GenericAlias", args, 2, 2);
            return new Sk.builtin.GenericAlias(args[0], args[1]);
        },
        tp$getattr(pyName, canSuspend) {
            if (Sk.builtin.checkString(pyName)) {
                if (!this.attr$exc.includes(pyName)) {
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
            const nparams = this.$params.sq$length();
            if (nparams === 0) {
                throw new Sk.builtin.TypeError("There are no type variables left in " + Sk.misceval.objectRepr(this));
            }

            /**@todo the following only makes sense when we do typing*/

            // const is_tuple = item instanceof Sk.builtin.tuple;
            // if (is_tuple) {
            //     const nitems = item.sq$length();
            //     if (nitems !== nparams) {
            //         throw new Sk.builtin.TypeError("Too " + (nitems > nparams ? "many" : "few") + " arguments for " + Sk.misceval.objectRepr(this));
            //     }
            // }
            // const args = this.$args.v;
            // const new_args = [];
            // args.forEach((arg) => {
            //     if (this.is$typevar(arg)) {
            //         const iparam = this.tuple$index(this.$params.v, arg);
            //         if (is_tuple) {
            //             arg = item.v[iparam];
            //         } else {
            //             arg = item;
            //         }
            //     }
            //     new_args.push(arg);
            // });
            // const res = new Sk.builtin.GenericAlias(this.$origin, new Sk.builtin.tuple(new_args));
            // return res;
        },
    },
    methods: {
        __mro_entries__: {
            $meth() {
                return new Sk.builtin.tuple([this.$origin]);
            },
            $flags: { NoArgs: true },
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
            const arg_arr = this.$args.v;
            const params = [];
            arg_arr.forEach((t) => {
                if (this.is$typevar(t)) {
                    if (this.tuple$index(params, t) < 0) {
                        params.push(t);
                    }
                }
            });
            this.$params = new Sk.builtin.tuple(params);
        },
        tuple$index(tup_arr, item) {
            return tup_arr.indexOf(item);
        },
        is$typevar(type) {
            if (type.tp$name !== "TypeVar") {
                return false;
            }
            const module = Sk.abstr.lookupSpecial(type, Sk.builtin.str.$module);
            if (module === undefined) {
                // throw some sort of error but all objects have __module_ so we shouldn't be here.
                throw Sk.builtin.RuntimeError("found object withought a __module__");
            }
            return module.toString() === "typing";
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
        ].map((x) => new Sk.builtin.str(x)),
    },
});
