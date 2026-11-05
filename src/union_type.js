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
        this.$params = null;
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
        tp$as_sequence_or_mapping: true,
        mp$subscript(item) {
            const parameters = this.tp$getattr(new Sk.builtin.str("__parameters__")).v;
            const args = Sk.builtin.GenericAlias.$substitute(this.$args.v, parameters, item);
            return Sk.builtin.UnionType.$make(args);
        },
    },
    methods: {
        __mro_entries__: {
            $meth(bases) {
                throw new Sk.builtin.TypeError("Cannot subclass " + Sk.misceval.objectRepr(this));
            },
            $flags: { OneArg: true },
        },
    },
    getsets: {
        __parameters__: {
            $get() {
                if (this.$params === null) {
                    this.$params = new Sk.builtin.tuple(Sk.builtin.GenericAlias.$typeParameters(this.$args.v));
                }
                return this.$params;
            },
        },
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
    // CPython separates hashable and unhashable members. Compare only within
    // the matching bucket, avoiding unrelated metaclass equality callbacks.
    const unique = [];
    const hashable = new Map();
    const unhashable = [];
    for (let i = 0; i < flattened.length; i++) {
        const arg = flattened[i];
        let hash;
        try {
            hash = Sk.abstr.objectHash(arg);
        } catch (error) {
            if (!(error instanceof Sk.builtin.TypeError)) {
                throw error;
            }
        }
        let bucket = unhashable;
        if (hash !== undefined) {
            bucket = hashable.get(hash);
            if (bucket === undefined) {
                bucket = [];
                hashable.set(hash, bucket);
            }
        }
        if (!bucket.some((existing) => existing === arg || Sk.misceval.richCompareBool(existing, arg, "Eq"))) {
            bucket.push(arg);
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
    const valid = (arg) => arg.sk$type || arg === Sk.builtin.none.none$ ||
        arg instanceof Sk.builtin.GenericAlias || arg instanceof Sk.builtin.UnionType;
    if ((this === Sk.builtin.none.none$ && other === Sk.builtin.none.none$) || !args.every(valid)) {
        return Sk.builtin.NotImplemented.NotImplemented$;
    }
    return Sk.builtin.UnionType.$make(args);
};
