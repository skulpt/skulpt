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
            const left = new Sk.builtin.frozenset(this.$args.v);
            const right = new Sk.builtin.frozenset(other.$args.v);
            return Sk.misceval.richCompareBool(left, right, op);
        },
        tp$as_number: true,
        nb$or(other) {
            return Sk.builtin.UnionType.$or.call(this, other);
        },
        nb$reflected_or(other) {
            return Sk.builtin.UnionType.$or.call(other, this);
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
        const arg = args[i] === Sk.builtin.none.none$ ? Sk.builtin.none : args[i];
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
    // Generic aliases compare structurally, even when created separately.
    const unique = [];
    for (let i = 0; i < flattened.length; i++) {
        const arg = flattened[i];
        if (!unique.some((existing) => Sk.misceval.richCompareBool(existing, arg, "Eq"))) {
            unique.push(arg);
        }
    }
    // If only one type remains, return it directly (like CPython)
    if (unique.length === 1) {
        return unique[0];
    }
    return new Sk.builtin.UnionType(unique);
};

// Shared by type, GenericAlias and UnionType; typing objects handle reflected dispatch.
Sk.builtin.UnionType.$or = function (other) {
    const args = [this, other];
    if ((this === Sk.builtin.none.none$ && other === Sk.builtin.none.none$) ||
        !args.every((arg) => arg.sk$type || arg === Sk.builtin.none.none$ ||
        arg instanceof Sk.builtin.GenericAlias || arg instanceof Sk.builtin.UnionType)) {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
    return Sk.builtin.UnionType.$make(args);
};
