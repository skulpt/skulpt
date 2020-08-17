var set_private_ = {};

/**
 *
 * @constructor
 * @param {Array} S
 *
 * @description
 * internally call new Sk.builtin.set with an array of python objects
 */
Sk.builtin.set = Sk.abstr.buildNativeClass("set", {
    constructor: function set(S) {
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
    slots: /**@lends {Sk.builtin.set.prototype}*/ {
        tp$getattr: Sk.generic.getAttr,
        tp$as_number: true,
        tp$as_sequence_or_mapping: true,
        tp$hash: Sk.builtin.none.none$,
        tp$doc: "set() -> new empty set object\nset(iterable) -> new set object\n\nBuild an unordered collection of unique elements.",
        tp$init: function (args, kwargs) {
            Sk.abstr.checkNoKwargs("set", kwargs);
            Sk.abstr.checkArgsLen("set", args, 0, 1);
            const iterable = args[0];
            return Sk.misceval.chain(iterable && this.set$update(iterable), () => Sk.builtin.none.none$);
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
                case "NotEq":
                case "Eq":
                    let res;
                    if (this === other) {
                        res = true;
                    } else if (this.get$size() !== other.get$size()) {
                        res = false;
                    } else {
                        res = Sk.misceval.isTrue(this.set$issubset(other));
                    }
                    return op === "Eq" ? res : !res;
                case "LtE":
                    return this === other || Sk.misceval.isTrue(this.set$issubset(other));
                case "GtE":
                    return this === other || Sk.misceval.isTrue(other.set$issubset(this));
                case "Lt":
                    return this.get$size() < other.get$size() && Sk.misceval.isTrue(this.set$issubset(other));
                case "Gt":
                    return this.get$size() > other.get$size() && Sk.misceval.isTrue(other.set$issubset(this));
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
            return this.get$size();
        },
        sq$contains: function (ob) {
            return this.v.sq$contains(ob);
        },
    },
    methods: /**@lends {Sk.builtin.set.prototype}*/ {
        add: {
            $meth: function (item) {
                this.set$add(item);
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
                return this.set$copy();
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Return a shallow copy of a set.",
        },
        discard: {
            $meth: function (item) {
                this.set$discard(item);
                return Sk.builtin.none.none$;
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "Remove an element from a set if it is a member.\n\nIf the element is not a member, do nothing.",
        },
        difference: {
            $meth: function (...args) {
                const result = this.set$copy();
                return Sk.misceval.chain(
                    Sk.misceval.iterArray(args, (arg) => result.set$difference_update(arg)),
                    () => result
                );
            },
            $flags: { MinArgs: 0 },
            $textsig: null,
            $doc: "Return the difference of two or more sets as a new set.\n\n(i.e. all elements that are in this set but not the others.)",
        },
        difference_update: {
            $meth: function (...args) {
                return Sk.misceval.chain(
                    Sk.misceval.iterArray(args, (arg) => this.set$difference_update(arg)),
                    () => Sk.builtin.none.none$
                );
            },
            $flags: { MinArgs: 0 },
            $textsig: null,
            $doc: "Remove all elements of another set from this set.",
        },
        intersection: {
            $meth: function (...args) {
                return this.set$intersection_multi(...args);
            },
            $flags: { MinArgs: 0 },
            $textsig: null,
            $doc: "Return the intersection of two sets as a new set.\n\n(i.e. all elements that are in both sets.)",
        },
        intersection_update: {
            $meth: function (...args) {
                return Sk.misceval.chain(this.set$intersection_multi(...args), (res) => {
                    this.swap$bodies(res);
                    return Sk.builtin.none.none$;
                });
            },
            $flags: { MinArgs: 0 },
            $textsig: null,
            $doc: "Update a set with the intersection of itself and another.",
        },
        isdisjoint: {
            $meth: function (other) {
                // requires all items in this to not be in other
                return Sk.misceval.chain(
                    Sk.misceval.iterFor(Sk.abstr.iter(other), (i) => {
                        if (this.sq$contains(i)) {
                            return new Sk.misceval.Break(Sk.builtin.bool.false$);
                        }
                    }),
                    (res) => res || Sk.builtin.bool.true$
                );
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "Return True if two sets have a null intersection.",
        },
        issubset: {
            $meth: function (other) {
                if (!Sk.builtin.checkAnySet(other)) {
                    other = this.set$make_basetype(other);
                }
                return Sk.misceval.chain(other, (other_set) => this.set$issubset(other_set));
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "Report whether another set contains this set.",
        },
        issuperset: {
            $meth: function (other) {
                if (!Sk.builtin.checkAnySet(other)) {
                    other = this.set$make_basetype(other);
                }
                return Sk.misceval.chain(other, (other_set) => other_set.set$issubset(this));
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "Report whether this set contains another set.",
        },
        pop: {
            $meth: function () {
                if (this.get$size() === 0) {
                    throw new Sk.builtin.KeyError("pop from an empty set");
                }
                const item = Sk.misceval.callsimArray(this.v.popitem, [this.v]);
                return item.v[0];
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
                let other_set;
                return Sk.misceval.chain(
                    this.set$make_basetype(other),
                    (os) => {
                        other_set = os;
                        return other_set.set$symmetric_diff_update(this);
                    },
                    () => other_set
                );
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "Return the symmetric difference of two sets as a new set.\n\n(i.e. all elements that are in exactly one of the sets.)",
        },
        symmetric_difference_update: {
            $meth: function (other) {
                return Sk.misceval.chain(this.set$symmetric_diff_update(other), () => Sk.builtin.none.none$);
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "Update a set with the symmetric difference of itself and another.",
        },
        union: {
            $meth: function (...args) {
                const result = this.set$copy();
                return Sk.misceval.chain(
                    Sk.misceval.iterArray(args, (arg) => result.set$update(arg)),
                    () => result
                );
            },
            $flags: { MinArgs: 0 },
            $textsig: null,
            $doc: "Return the union of sets as a new set.\n\n(i.e. all elements that are in either set.)",
        },
        update: {
            $meth: function (...args) {
                return Sk.misceval.chain(
                    Sk.misceval.iterArray(args, (arg) => this.set$update(arg)),
                    () => Sk.builtin.none.none$
                );
            },
            $flags: { MinArgs: 0 },
            $textsig: null,
            $doc: "Update a set with the union of itself and others.",
        },
    },
    proto: /**@lends {Sk.builtin.set.prototype}*/ Object.assign(set_private_, {
        sk$asarray: function () {
            return this.v.sk$asarray();
        },
        get$size: function () {
            // this method cannot be overriden by subclasses
            return this.v.sq$length();
        },
        set$add: function (entry) {
            this.v.mp$ass_subscript(entry, true);
        },
        set$make_basetype: function (other) {
            return Sk.misceval.chain(Sk.misceval.arrayFromIterable(other, true), (S) => new this.sk$baseType(S));
        },
        set$discard: function (entry) {
            if (this.v.mp$lookup(entry) !== undefined) {
                this.v.del$item(entry);
                return entry;
            }
            return null;
        },
        set$copy: function () {
            return new this.sk$baseType(this.sk$asarray());
        },
        set$difference_update: function (other) {
            return Sk.misceval.iterFor(Sk.abstr.iter(other), (entry) => {
                this.set$discard(entry);
            });
        },
        set$intersection: function (other) {
            const res = new this.sk$baseType();
            return Sk.misceval.chain(
                Sk.misceval.iterFor(Sk.abstr.iter(other), (entry) => {
                    if (this.sq$contains(entry)) {
                        res.set$add(entry);
                    }
                }),
                () => res
            );
        },
        set$intersection_multi: function (...args) {
            if (!args.length) {
                return this.set$copy();
            }
            let result = this;
            return Sk.misceval.chain(
                Sk.misceval.iterArray(args, (arg) => {
                    return Sk.misceval.chain(result.set$intersection(arg), (res) => {
                        result = res;
                    });
                }),
                () => result
            );
        },
        set$issubset: function (other_set) {
            const thisLength = this.get$size();
            const otherLength = other_set.get$size();
            if (thisLength > otherLength) {
                // every item in this set can't be in other if it's shorter!
                return Sk.builtin.bool.false$;
            }
            for (let it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                if (!other_set.sq$contains(i)) {
                    return Sk.builtin.bool.false$;
                }
            }
            return Sk.builtin.bool.true$;
        },
        set$symmetric_diff_update: function (other) {
            return Sk.misceval.iterFor(Sk.abstr.iter(other), (entry) => {
                const discarded = this.set$discard(entry);
                if (discarded === null) {
                    this.set$add(entry);
                }
            });
        },
        set$update: function (other) {
            return Sk.misceval.iterFor(Sk.abstr.iter(other), (entry) => {
                this.set$add(entry);
            });
        },
        swap$bodies: function (other) {
            this.v = other.v;
        },
    }),
});

Sk.exportSymbol("Sk.builtin.set", Sk.builtin.set);

const set_proto = Sk.builtin.set.prototype;
/**
 * @constructor
 * @param {Array.<Object>} S
 */
Sk.builtin.frozenset = Sk.abstr.buildNativeClass("frozenset", {
    constructor: function frozenset(S) {
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
    slots: /**@lends {Sk.builtin.frozenset.prototype}*/ {
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
        /**
         * @param {Array} args
         * @param {Array=} kwargs
         * @ignore
         */
        tp$new: function (args, kwargs) {
            if (this !== Sk.builtin.frozenset.prototype) {
                return this.$subtype_new(args, kwargs);
            }
            Sk.abstr.checkNoKwargs("frozenset", kwargs);
            Sk.abstr.checkArgsLen("frozenset", args, 0, 1);
            const arg = args[0];
            if (arg !== undefined && arg.ob$type === Sk.builtin.frozenset) {
                return arg;
            }
            return Sk.misceval.chain(Sk.misceval.arrayFromIterable(arg, true), (S) => new Sk.builtin.frozenset(S));
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
    methods: /**@lends {Sk.builtin.frozenset.prototype}*/ {
        copy: set_proto.copy.d$def,
        difference: set_proto.difference.d$def,
        intersection: set_proto.intersection.d$def,
        isdisjoint: set_proto.isdisjoint.d$def,
        issubset: set_proto.issubset.d$def,
        issuperset: set_proto.issuperset.d$def,
        // __reduce__: set_proto.__reduce__,
        // __sizeof__: set_proto.__sizeof__,
        symmetric_difference: set_proto.symmetric_difference.d$def,
        union: set_proto.union.d$def,
    },
    proto: /**@lends {Sk.builtin.frozenset.prototype}*/ Object.assign(
        {
            $subtype_new: function (args, kwargs) {
                const instance = new this.constructor();
                // pass the args but ignore the kwargs for subtyping
                return Sk.misceval.chain(Sk.builtin.frozenset.prototype.tp$new(args), (fs) => {
                    instance.v = frozenset.v;
                    return instance;
                });
            },
        },
        set_private_
    ),
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
