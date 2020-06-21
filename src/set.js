/**
 * Here we define the shared set methods that might be used by set or frozenset
 */
const set_methods = {
    add: {
        $meth: function (item) {
            this.v.mp$ass_subscript(item, true);
            return Sk.builtin.none.none$;
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "Add an element to a set.\n\nThis has no effect if the element is already present.",
    },
    clear: {
        $meth: function () {
            this.v = new Sk.builtin.dict([]);
            return Sk.builtin.none.none$;
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "Remove all elements from this set.",
    },
    copy: {
        $meth: function () {
            return new this.constructor(this.sk$asarray());
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "Return a shallow copy of a set.",
    },
    discard: {
        $meth: function (item) {
            Sk.misceval.callsimArray(this.v.pop, [this.v, item, Sk.builtin.none.none$]);
            return Sk.builtin.none.none$;
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "Remove an element from a set if it is a member.\n\nIf the element is not a member, do nothing.",
    },
    difference: {
        $meth: function (...args) {
            const tmp = this.copy.$meth.call(this); // could be a set or a frozenset
            Sk.builtin.set.prototype.difference_update.$meth.call(tmp, ...args);
            return tmp;
        },
        $flags: { MinArgs: 0 },
        $textsig: null,
        $doc: "Return the difference of two or more sets as a new set.\n\n(i.e. all elements that are in this set but not the others.)",
    },
    difference_update: {
        $meth: function (...args) {
            if (!args.length) {
                return Sk.builtin.none.none$;
            }
            // we don't use the iterator since a set shouldn't change size during iteration
            const vals = this.sk$asarray();
            const discard = Sk.builtin.set.prototype.discard.$meth;
            for (let j = 0; j < vals.length; j++) {
                const item = vals[j];
                for (let i = 0; i < args.length; i++) {
                    if (Sk.abstr.sequenceContains(args[i], item)) {
                        discard.call(this, item);
                        break;
                    }
                }
            }
            return Sk.builtin.none.none$;
        },
        $flags: { MinArgs: 0 },
        $textsig: null,
        $doc: "Remove all elements of another set from this set.",
    },
    intersection: {
        $meth: function (...args) {
            const tmp = this.copy.$meth.call(this);
            Sk.builtin.set.prototype.intersection_update.$meth.call(tmp, ...args);
            return tmp;
        },
        $flags: { MinArgs: 0 },
        $textsig: null,
        $doc: "Return the intersection of two sets as a new set.\n\n(i.e. all elements that are in both sets.)",
    },
    intersection_update: {
        $meth: function (...args) {
            if (!args.length) {
                return Sk.builtin.none.none$;
            }
            const vals = this.sk$asarray();
            const discard = Sk.builtin.set.prototype.discard.$meth;
            for (let j = 0; j < vals.length; j++) {
                const item = vals[j];
                for (let i = 0; i < args.length; i++) {
                    if (!Sk.abstr.sequenceContains(args[i], item)) {
                        discard.call(this, item);
                        break;
                    }
                }
            }
            return Sk.builtin.none.none$;
        },
        $flags: { MinArgs: 0 },
        $textsig: null,
        $doc: "Update a set with the intersection of itself and another.",
    },
    isdisjoint: {
        $meth: function (other) {
            // requires all items in this to not be in other
            let isIn;
            other = Sk.abstr.arrayFromIterable(other);
            for (let i = 0; i < other.length; i++) {
                isIn = this.sq$contains(other[i]);
                if (isIn) {
                    return Sk.builtin.bool.false$;
                }
            }
            return Sk.builtin.bool.true$;
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "Return True if two sets have a null intersection.",
    },
    issubset: {
        $meth: function (other) {
            if (!Sk.builtin.checkAnySet(other)) {
                other = new Sk.builtin.set(Sk.abstr.arrayFromIterable(other));
            }
            let isIn;
            const thisLength = this.set$size();
            const otherLength = this.set$size();
            if (thisLength > otherLength) {
                // every item in this set can't be in other if it's shorter!
                return Sk.builtin.bool.false$;
            }
            for (let it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                isIn = other.sq$contains(i);
                if (!isIn) {
                    return Sk.builtin.bool.false$;
                }
            }
            return Sk.builtin.bool.true$;
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "Report whether another set contains this set.",
    },
    issuperset: {
        $meth: function (other) {
            if (!Sk.builtin.checkAnySet(other)) {
                other = new Sk.builtin.set(Sk.abstr.arrayFromIterable(other));
            }
            return other.issubset.$meth.call(other, this);
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "Report whether this set contains another set.",
    },
    pop: {
        $meth: function () {
            if (this.set$size() === 0) {
                throw new Sk.builtin.KeyError("pop from an empty set");
            }
            const vals = this.sk$asarray();
            const item = vals[0];
            this.discard.$meth.call(this, item); //can only be called by a set not a frozen set
            return item;
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "Remove and return an arbitrary set element.\nRaises KeyError if the set is empty.",
    },
    // __reduce__: {
    //     $meth: methods.$__reduce__,
    //     $flags:{},
    //     $textsig: null,
    //     $doc: "Return state information for pickling." },
    remove: {
        $meth: function (item) {
            return this.v.mp$ass_subscript(item);
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "Remove an element from a set; it must be a member.\n\nIf the element is not a member, raise a KeyError.",
    },
    // __sizeof__: {
    //     $meth: methods.$__sizeof__,
    //     $flags:{},
    //     $textsig: null,
    //     $doc: "S.__sizeof__() -> size of S in memory, in bytes" },
    symmetric_difference: {
        $meth: function (other) {
            const S = this.union.$meth.call(this, other);
            const vals = S.sk$asarray();
            const discard = Sk.builtin.set.prototype.discard.$meth;
            for (let i = 0; i < vals.length; i++) {
                const item = vals[i];
                if (Sk.abstr.sequenceContains(this, item) && Sk.abstr.sequenceContains(other, item)) {
                    discard.call(S, item);
                }
            }
            return S;
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "Return the symmetric difference of two sets as a new set.\n\n(i.e. all elements that are in exactly one of the sets.)",
    },
    symmetric_difference_update: {
        $meth: function (other) {
            const sd = this.symmetric_difference.$meth.call(this, other);
            this.clear.$meth.call(this);
            this.update.$meth.call(this, sd);
            return Sk.builtin.none.none$;
        },
        $flags: { OneArg: true },
        $textsig: null,
        $doc: "Update a set with the symmetric difference of itself and another.",
    },
    union: {
        $meth: function (...args) {
            const S = this.copy.$meth.call(this);
            Sk.builtin.set.prototype.update.$meth.call(S, ...args);
            return S;
        },
        $flags: { MinArgs: 0 },
        $textsig: null,
        $doc: "Return the union of sets as a new set.\n\n(i.e. all elements that are in either set.)",
    },
    update: {
        $meth: function (...args) {
            const add = Sk.builtin.set.prototype.add.$meth;
            for (let i = 0; i < args.length; i++) {
                for (let it = Sk.abstr.iter(args[i]), item = it.tp$iternext(); item !== undefined; item = it.tp$iternext()) {
                    add.call(this, item);
                }
            }
            return Sk.builtin.none.none$;
        },
        $flags: { MinArgs: 0 },
        $textsig: null,
        $doc: "Update a set with the union of itself and others.",
    },
};

/**
 *
 * @constructor
 * @param {Array} S
 *
 * @description
 * internally call new Sk.builtin.set with an array of python objects
 */
Sk.builtin.set = Sk.abstr.buildNativeClass("set", {
    constructor: function set (S) {
        if (S === undefined) {
            S = [];
        }
        Sk.asserts.assert(Array.isArray(S) && this instanceof Sk.builtin.set, "Bad call to set - must be called with an Array and 'new'");
        const L = [];
        for (let i = 0; i < S.length; i++) {
            L.push(S[i]);
            L.push(true);
        }
        this.v = new Sk.builtin.dict(L);
    },
    slots: {
        tp$getattr: Sk.generic.getAttr,
        tp$as_number: true,
        tp$as_sequence_or_mapping: true,
        tp$hash: Sk.builtin.none.none$,
        tp$doc: "set() -> new empty set object\nset(iterable) -> new set object\n\nBuild an unordered collection of unique elements.",
        tp$init: function (args, kwargs) {
            Sk.abstr.checkNoKwargs("set", kwargs);
            Sk.abstr.checkArgsLen("set", args, 0, 1);
            return Sk.builtin.set.prototype.update.$meth.call(this, ...args);
        },
        tp$new: Sk.generic.new,
        $r: function () {
            const ret = this.sk$asarray().map((x) => Sk.misceval.objectRepr(x));
            if (Sk.__future__.python3) {
                if (ret.length === 0) {
                    return new Sk.builtin.str(Sk.abstr.typeName(this) + "()");
                } else if (this.ob$type !== Sk.builtin.set) {
                    // then we are a subclass of set
                    return new Sk.builtin.str(Sk.abstr.typeName(this) + "({" + ret.join(", ") + "})");
                } else {
                    return new Sk.builtin.str("{" + ret.join(", ") + "}");
                }
            } else {
                return new Sk.builtin.str(Sk.abstr.typeName(this) + "([" + ret.join(", ") + "])");
            }
        },
        tp$iter: function () {
            return new Sk.builtin.set_iter_(this);
        },
        tp$richcompare: function (other, op) {
            if (!Sk.builtin.checkAnySet(other)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            switch (op) {
                case "Eq":
                    if (this.set$size() !== other.set$size()) {
                        return false;
                    }
                    if (this === other) {
                        return true;
                    }
                    return Sk.misceval.isTrue(this.issubset.$meth.call(this, other));
                case "NotEq":
                    const res = this.tp$richcompare(other, "Eq");
                    if (res === Sk.builtin.NotImplemented.NotImplemented$) {
                        return res;
                    }
                    return !res;
                case "LtE":
                    if (this === other) {
                        return true;
                    }
                    return Sk.misceval.isTrue(this.issubset.$meth.call(this, other));
                case "GtE":
                    if (this === other) {
                        return true;
                    }
                    return Sk.misceval.isTrue(this.issuperset.$meth.call(this, other));
                case "Lt":
                    if (this.set$size() >= other.set$size()) {
                        return false;
                    }
                    return Sk.misceval.isTrue(this.issubset.$meth.call(this, other));
                case "Gt":
                    if (this.set$size() <= other.set$size()) {
                        return false;
                    }
                    return Sk.misceval.isTrue(this.issuperset.$meth.call(this, other));
            }
        },
        // number slots
        nb$subtract: numberSlot(function (other) {
            return this.difference.$meth.call(this, other);
        }),
        nb$and: numberSlot(function (other) {
            return this.intersection.$meth.call(this, other);
        }),
        nb$or: numberSlot(function (other) {
            return this.union.$meth.call(this, other);
        }),
        nb$xor: numberSlot(function (other) {
            return this.symmetric_difference.$meth.call(this, other);
        }),
        nb$inplace_subtract: numberSlot(function (other) {
            return this.difference_update.$meth.call(this, other);
        }),
        nb$inplace_and: numberSlot(function (other) {
            return this.intersection_update.$meth.call(this, other);
        }),
        nb$inplace_or: numberSlot(function (other) {
            return this.update.$meth.call(this, other);
        }),
        nb$inplace_xor: numberSlot(function (other) {
            return this.symmetric_difference_update.$meth.call(this, other);
        }),
        // sequence or mapping slots
        sq$length: function () {
            return this.set$size();
        },
        sq$contains: function (ob) {
            return this.v.sq$contains(ob);
        },
    },
    methods: set_methods,
    proto: {
        sk$asarray: function () {
            return this.v.sk$asarray();
        },
        set$size: function () {
            // this method cannot be overriden by subclasses
            return this.v.sq$length();
        },
    },
});

Sk.exportSymbol("Sk.builtin.set", Sk.builtin.set);

const set_proto = Sk.builtin.set.prototype;
/**
 * @constructor
 * @param {Array.<Object>} S
 */
Sk.builtin.frozenset = Sk.abstr.buildNativeClass("frozenset", {
    constructor: function frozenset (S) {
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
        tp$getattr: Sk.generic.getAttr,
        tp$as_number: true,
        tp$as_sequence_or_mapping: true,
        tp$doc:
            "frozenset() -> empty frozenset object\nfrozenset(iterable) -> frozenset object\n\nBuild an immutable unordered collection of unique elements.",
        tp$hash: function () {
            // numbers taken from Cpython 2.7 hash function
            let hash = 1927868237;
            const entries = this.sk$asarray();
            hash *= entries.length + 1;
            for (let i = 0; i < entries.length; i++) {
                const h = Sk.builtin.hash(entries[i]).v;
                hash ^= (h ^ (h << 16) ^ 89869747) * 3644798167;
            }
            hash = hash * 69069 + 907133923;
            hash = new Sk.builtin.int_(hash);
            this.$savedHash_ = hash;
            return hash;
        },
        tp$new: function (args, kwargs) {
            if (this !== Sk.builtin.frozenset.prototype) {
                return this.$subtype_new(args, kwargs);
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

function numberSlot(f) {
    return function (other) {
        if (!Sk.builtin.checkAnySet(other)) {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        return f.call(this, other);
    };
}
