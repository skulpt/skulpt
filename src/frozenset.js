const set_proto = Sk.builtin.set.prototype;
const set_methods = Sk.builtin.setMethodDefs;
/**
 * @constructor
 * @param {Array.<Object>} S
 */
Sk.builtin.frozenset = Sk.abstr.buildNativeClass("frozenset", {
    constructor: function (S) {
        // takes in an array of py objects
        if (S === undefined) {
            S = [];
        }
        Sk.asserts.assert(
            Array.isArray(S) && this instanceof Sk.builtin.frozenset,
            "bad call to frozen set - must be called with an Array and 'new'"
        );
        const L = [];
        for (let i = 0; i < S.length; i++) {
            L.push(S[i]);
            L.push(true);
        }
        this.v = new Sk.builtin.dict(L);
    },
    slots: {
        tp$as_number: true,
        tp$as_sequence_or_mapping: true,
        tp$doc:
            "frozenset() -> empty frozenset object\nfrozenset(iterable) -> frozenset object\n\nBuild an immutable unordered collection of unique elements.",
        tp$hash: undefined,  //todo
        tp$new: function (args, kwargs) {
            if (this !== Sk.builtin.frozenset.prototype) {
                return Sk.builtin.frozenset.prototype.$subtype_new.call(this, args, kwargs);
            }
            Sk.abstr.checkNoKwargs("frozenset", kwargs);
            Sk.abstr.checkArgsLen("frozenset", 0, 1);
            const arg = args[0];
            if (arg !== undefined && arg.ob$type === Sk.builtin.frozenset) {
                return arg;
            }
            const S = Sk.abstr.arrayFromIterable(arg);
            return new Sk.builtin.frozenset(S);
        },
        $r: set_proto.$r,
        tp$iter: set_proto.tp$iter,
        tp$richcompare: set_proto.tp$richcompare,
        // number slots
        nb$subtract: set_proto.nb$subtract,
        nb$and: set_proto.nb$and,
        nb$or: set_proto.nb$or,
        nb$xor: set_proto.nb$xor,
        // as mapping
        sq$length: set_proto.sq$length,
        sq$contains: set_proto.sq$contains,
    },
    methods: {
        copy: set_methods.copy,
        difference: set_methods.difference,
        intersection: set_methods.intersection,
        isdisjoint: set_methods.isdisjoint,
        issubset: set_methods.issubset,
        issuperset: set_methods.issuperset,
        // __reduce__: set_proto.__reduce__,
        // __sizeof__: set_proto.__sizeof__,
        symmetric_difference: set_methods.symmetric_difference,
        union: set_methods.union,
    },
    proto: {
        $subtype_new: function (args, kwargs) {
            const instance = new this.constructor();
            // pass the args but ignore the kwargs for subtyping
            const frozenset = Sk.builtin.frozenset.prototype.tp$new(args);
            instance.v = frozenset.v;
            return instance;
        },
        sk$asarray: set_proto.sk$asarray,
        set$size: set_proto.set$size,
    },
});

Sk.exportSymbol("Sk.builtin.frozenset", Sk.builtin.frozenset);
