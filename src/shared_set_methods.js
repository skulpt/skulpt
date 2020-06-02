
Sk.builtin.setMethodDefs = {
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
            this.v.pop.func_code.call(null, this.v, item, Sk.builtin.none.none$);
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
        $flags: {MinArgs: 0},
        $textsig: null,
        $doc: "Remove all elements of another set from this set.",
    },
    intersection: {
        $meth: function (...args) {
            const tmp = this.copy.$meth.call(this);
            Sk.builtin.set.prototype.intersection_update.$meth.call(tmp, ...args);
            return tmp;
        },
        $flags: {MinArgs: 0},
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
                for (i = 0; i < args.length; i++) {
                    if (!Sk.abstr.sequenceContains(args[i], item)) {
                        discard.call(this, item);
                        break;
                    }
                }
            }
            return Sk.builtin.none.none$;
        },
        $flags: {MinArgs: 0},
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
            for (let it = this.tp$iter(), i= it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
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
            }; 
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
            this.v.mp$del_subscript(item);
            return Sk.builtin.none.none$;
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
        $flags: {MinArgs: 0},
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
        $flags: {MinArgs: 0},
        $textsig: null,
        $doc: "Update a set with the union of itself and others.",
    },
};