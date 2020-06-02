/**
 * @constructor
 * @param {Array} S
 *
 * @description
 * internally call new Sk.builtin.set with an array of python objects
 */
Sk.builtin.set = Sk.abstr.buildNativeClass("set", {
    constructor: function (S) {
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
            const ret = this.sk$asarray().map((x) => Sk.misceval.objectRepr(x).v);
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
        nb$subtract: function (other) {
            Sk.builtin.set.$check_instance_or_throw(other);
            return this.difference.$meth.call(this, other);
        },
        nb$and: function (other) {
            Sk.builtin.set.$check_instance_or_throw(other);
            return this.intersection.$meth.call(this, other);
        },
        nb$or: function (other) {
            Sk.builtin.set.$check_instance_or_throw(other);
            return this.union.$meth.call(this, other);
        },
        nb$xor: function (other) {
            Sk.builtin.set.$check_instance_or_throw(other);
            return this.symmetric_difference.$meth.call(this, other);
        },
        nb$inplace_subtract: function (other) {
            Sk.builtin.set.$check_instance_or_throw(other);
            return this.difference_update.$meth.call(this, other);
        },
        nb$inplace_and: function (other) {
            Sk.builtin.set.$check_instance_or_throw(other);
            return this.intersection_update.$meth.call(this, other);
        },
        nb$inplace_or: function (other) {
            Sk.builtin.set.$check_instance_or_throw(other);
            return this.update.$meth.call(this, other);
        },
        nb$inplace_xor: function (other) {
            Sk.builtin.set.$check_instance_or_throw(other);
            return this.symmetric_difference_update.$meth.call(this, other);
        },
        // sequence or mapping slots
        sq$length: function () {
            return this.set$size();
        },
        sq$contains: function (ob) {
            return this.v.sq$contains(ob);
        },
    },
    methods: Sk.builtin.setMethodDefs,
    proto: {
        sk$asarray: function () {
            return this.v.sk$asarray();
        },
        set$size: function () {
            // this method cannot be overriden by subclasses
            return this.v.sq$length();
        }
    },
    flags: {
        $check_instance_or_throw: function (other) {
            if (Sk.__future__.python3 && !Sk.builtin.checkAnySet(other)) {
                throw new Sk.builtin.TypeError(
                    "unsupported operand type(s) for ^: '" + Sk.abstr.typeName(this) + "' and '" + Sk.abstr.typeName(other) + "'"
                );
            }
        },
    },
});

Sk.abstr.markUnhashable(Sk.builtin.set);

Sk.exportSymbol("Sk.builtin.set", Sk.builtin.set);
