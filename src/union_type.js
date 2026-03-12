/**
 * @constructor
 * @extends {Sk.builtin.object}
 * @description
 * Implementation of PEP 604 Union Type (types.UnionType)
 * Represents the result of `int | str` syntax
 */
Sk.builtin.UnionType = Sk.abstr.buildNativeClass("types.UnionType", {
    constructor: function UnionType(args) {
        // Constructor receives already flattened and deduplicated unique array
        this.$args = new Sk.builtin.tuple(args);
    },
    slots: {
        tp$new(args, kwargs) {
            Sk.abstr.checkNoKwargs("UnionType", kwargs);
            throw new Sk.builtin.TypeError("cannot create 'types.UnionType' instances");
        },
        $r() {
            // "int | str | None"
            const parts = [];
            const args = this.$args.v;
            for (let i = 0; i < args.length; i++) {
                parts.push(this.ut$repr(args[i]));
            }
            return new Sk.builtin.str(parts.join(" | "));
        },
        tp$hash() {
            // Hash based on frozenset of args for order-independence
            return Sk.abstr.objectHash(new Sk.builtin.frozenset(this.$args.v));
        },
        tp$richcompare(other, op) {
            if (!(other instanceof Sk.builtin.UnionType)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            if (op !== "Eq" && op !== "NotEq") {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            // Compare as sets (order-independent)
            const thisArgs = this.$args.v;
            const otherArgs = other.$args.v;
            if (thisArgs.length !== otherArgs.length) {
                return op === "Eq" ? false : true;
            }
            const thisSet = new Set(thisArgs);
            let eq = true;
            for (let i = 0; i < otherArgs.length; i++) {
                if (!thisSet.has(otherArgs[i])) {
                    eq = false;
                    break;
                }
            }
            return op === "Eq" ? eq : !eq;
        },
        tp$as_number: true,
        nb$or(other) {
            // UnionType | X -> new UnionType
            if (other.sk$type || other instanceof Sk.builtin.UnionType) {
                return Sk.builtin.UnionType.$make([...this.$args.v, other]);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
        nb$ror(other) {
            // X | UnionType -> new UnionType
            if (other.sk$type || other instanceof Sk.builtin.UnionType) {
                return Sk.builtin.UnionType.$make([other, ...this.$args.v]);
            }
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
    },
    methods: {
        __mro_entries__: {
            $meth(bases) {
                return this.$args;  // Return tuple of types
            },
            $flags: { OneArg: true },
        },
    },
    getsets: {
        __args__: {
            $get() {
                return this.$args;
            },
        },
    },
    proto: {
        ut$repr(item) {
            // Handle None specially
            if (item === Sk.builtin.none.none$.ob$type) {
                return "None";
            }
            const qualname = Sk.abstr.lookupSpecial(item, Sk.builtin.str.$qualname);
            if (qualname !== undefined) {
                const mod = Sk.abstr.lookupSpecial(item, Sk.builtin.str.$module);
                if (mod !== undefined && !Sk.builtin.checkNone(mod) && mod.toString() !== "builtins") {
                    return mod.toString() + "." + qualname.toString();
                }
                return qualname.toString();
            }
            return Sk.misceval.objectRepr(item);
        },
    },
    flags: {
        sk$unacceptableBase: true,
    },
});

/**
 * Creates a UnionType from an array of types.
 * If only one unique type remains after flattening and deduplication,
 * returns that type directly instead of wrapping in UnionType.
 * @param {Array} args - Array of types
 * @returns {Sk.builtin.UnionType|Object} - UnionType or single type
 */
Sk.builtin.UnionType.$make = function (args) {
    // Flatten any nested UnionTypes and deduplicate
    const flattened = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg instanceof Sk.builtin.UnionType) {
            // Flatten nested unions
            const nested = arg.$args.v;
            for (let j = 0; j < nested.length; j++) {
                flattened.push(nested[j]);
            }
        } else {
            flattened.push(arg);
        }
    }
    // Deduplicate by identity
    const seen = new Set();
    const unique = [];
    for (let i = 0; i < flattened.length; i++) {
        const arg = flattened[i];
        if (!seen.has(arg)) {
            seen.add(arg);
            unique.push(arg);
        }
    }
    // If only one type remains, return it directly (like CPython)
    if (unique.length === 1) {
        return unique[0];
    }
    return new Sk.builtin.UnionType(unique);
};
