/**
 * @constructor
 * @param {Array} L
 * @extends {Sk.builtin.object}
 */
Sk.builtin.tuple = Sk.abstr.buildNativeClass("tuple", {
    constructor: function tuple(L) {
        if (L === undefined) {
            L = [];
        }
        Sk.asserts.assert(Array.isArray(L) && this instanceof Sk.builtin.tuple, "bad call to tuple, use 'new' with an Array");
        this.v = L;
        this.in$repr = false;
    },
    slots: /**@lends {Sk.builtin.tuple.prototype}*/ {
        tp$getattr: Sk.generic.getAttr,
        tp$as_sequence_or_mapping: true,
        tp$doc:
            "Built-in immutable sequence.\n\nIf no argument is given, the constructor returns an empty tuple.\nIf iterable is specified the tuple is initialized from iterable's items.\n\nIf the argument is a tuple, the return value is the same object.",
        $r: function () {
            if (this.in$repr) {
                return new Sk.builtin.str("(...)");
            }
            this.in$repr = true;
            let ret = this.v.map((x) => Sk.misceval.objectRepr(x));
            this.in$repr = false;
            ret = ret.join(", ");
            if (this.v.length === 1) {
                ret += ",";
            }
            return new Sk.builtin.str("(" + ret + ")");
        },
        /**
         * @param {Array} args
         * @param {Array=} kwargs
         * @ignore
         */
        tp$new: function (args, kwargs) {
            // this = Sk.builtin.prototype or a prototype that inherits from Sk.builtin.tuple.prototype
            if (this !== Sk.builtin.tuple.prototype) {
                return this.$subtype_new(args, kwargs);
            }
            Sk.abstr.checkNoKwargs("tuple", kwargs);
            Sk.abstr.checkArgsLen("tuple", args, 0, 1);
            const arg = args[0];
            if (arg === undefined) {
                return new Sk.builtin.tuple([]);
            }
            if (arg.ob$type === Sk.builtin.tuple) {
                return arg;
            }
            // make tuples suspendible
            return Sk.misceval.chain(Sk.misceval.arrayFromIterable(arg, true), (L) => new Sk.builtin.tuple(L));
        },
        tp$hash: function () {
            // the numbers and order are taken from Cpython
            let y,
                x = 0x345678,
                mult = 1000003;
            const len = this.v.length;
            for (let i = 0; i < len; ++i) {
                y = Sk.builtin.hash(this.v[i]).v;
                if (y === -1) {
                    return new Sk.builtin.int_(-1);
                }
                x = (x ^ y) * mult;
                mult += 82520 + len + len;
            }
            x += 97531;
            if (x === -1) {
                x = -2;
            }
            return new Sk.builtin.int_(x | 0);
        },
        tp$iter: function () {
            return new tuple_iter_(this);
        },

        // sequence and mapping slots
        mp$subscript: function (index) {
            let i;
            if (Sk.misceval.isIndex(index)) {
                i = Sk.misceval.asIndex(index);
                if (typeof i !== "number") {
                    throw new Sk.builtin.IndexError("cannot fit '" + Sk.abstr.typeName(index) + "' into an index-sized integer");
                }
                if (i !== undefined) {
                    if (i < 0) {
                        i = this.v.length + i;
                    }
                    if (i < 0 || i >= this.v.length) {
                        throw new Sk.builtin.IndexError("tuple index out of range");
                    }
                    return this.v[i];
                }
            } else if (index instanceof Sk.builtin.slice) {
                const ret = [];
                const lst = this.v;
                index.sssiter$(lst.length, (i) => {
                    ret.push(lst[i]);
                });
                return new Sk.builtin.tuple(ret);
            }

            throw new Sk.builtin.TypeError("tuple indices must be integers or slices, not " + Sk.abstr.typeName(index));
        },
        sq$length: function () {
            return this.v.length;
        },
        sq$repeat: function (n) {
            n = Sk.misceval.asIndex(n);
            if (typeof n !== "number") {
                throw new Sk.builtin.OverflowError("cannot fit '" + Sk.abstr.typeName(n) + "' into an index-sized integer");
            }
            if (n === 1 && this.constructor === Sk.builtin.tuple) {
                return this;
            }
            const ret = [];
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < this.v.length; j++) {
                    ret.push(this.v[j]);
                }
            }
            return new Sk.builtin.tuple(ret);
        },
        sq$concat: function (other) {
            if (!(other instanceof Sk.builtin.tuple)) {
                throw new Sk.builtin.TypeError("can only concatenate tuple (not '" + Sk.abstr.typeName(other) + "') to tuple");
            }
            return new Sk.builtin.tuple(this.v.concat(other.v));
        },
        sq$contains: function (ob) {
            for (let it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                if (i === ob || Sk.misceval.richCompareBool(i, ob, "Eq")) {
                    return true;
                }
            }
            return false;
        },

        // richcompare
        tp$richcompare: function (w, op) {
            // w not a tuple
            if (!(w instanceof Sk.builtin.tuple)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            w = w.v;
            const v = this.v;
            const vl = v.length;
            const wl = w.length;
            let i;
            for (i = 0; i < vl && i < wl; ++i) {
                if (!(v[i] === w[i] || Sk.misceval.richCompareBool(v[i], w[i], "Eq"))) {
                    break;
                }
            }

            if (i >= vl || i >= wl) {
                // no more items to compare, compare sizes
                switch (op) {
                    case "Lt":
                        return vl < wl;
                    case "LtE":
                        return vl <= wl;
                    case "Eq":
                        return vl === wl;
                    case "NotEq":
                        return vl !== wl;
                    case "Gt":
                        return vl > wl;
                    case "GtE":
                        return vl >= wl;
                    default:
                        Sk.asserts.fail();
                }
            }

            // we have an item that's different
            // shortcuts for eq/not
            if (op === "Eq") {
                return false;
            }
            if (op === "NotEq") {
                return true;
            }

            // or, compare the differing element using the proper operator
            return Sk.misceval.richCompareBool(v[i], w[i], op);
        },
    },
    proto: /**@lends {Sk.builtin.tuple.prototype}*/ {
        $subtype_new: function (args, kwargs) {
            const instance = new this.constructor();
            // pass the args but ignore the kwargs for subtyping - these might be handled by the subtypes init method
            const tuple = Sk.builtin.tuple.prototype.tp$new(args);
            instance.v = tuple.v;
            return instance;
        },
        sk$asarray: function () {
            return this.v.slice(0);
        },
    },
    methods: /**@lends {Sk.builtin.tuple.prototype}*/ {
        __getnewargs__: {
            $meth: function () {
                return new Sk.builtin.tuple(this.v.slice(0));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: null,
        },
        index: /**@lends {Sk.builtin.type.prototype}*/ {
            $meth: function (item, start, end) {
                ({ start, end } = Sk.builtin.slice.$indices(this, start, end));
                const obj = this.v;
                for (let i = start; i < end; i++) {
                    if (obj[i] === item || Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
                        return new Sk.builtin.int_(i);
                    }
                }
                throw new Sk.builtin.ValueError("tuple.index(x): x not in tuple");
            },
            $flags: { MinArgs: 1, MaxArgs: 3 },
            $textsig: "($self, value, start=0, stop=sys.maxsize, /)",
            $doc: "Return first index of value.\n\nRaises ValueError if the value is not present.",
        },
        count: {
            $meth: function (item) {
                const len = this.v.length;
                const obj = this.v;
                let count = 0;
                for (let i = 0; i < len; ++i) {
                    if (obj[i] === item || Sk.misceval.richCompareBool(obj[i], item, "Eq")) {
                        count += 1;
                    }
                }
                return new Sk.builtin.int_(count);
            },
            $flags: { OneArg: true },
            $textsig: "($self, value, /)",
            $doc: "Return number of occurrences of value.",
        },
    },
});

Sk.exportSymbol("Sk.builtin.tuple", Sk.builtin.tuple);

/**
 * @constructor
 * @extends {Sk.builtin.object}
 * @param {Sk.builtin.tuple} tuple
 * @private
 */
var tuple_iter_ = Sk.abstr.buildIteratorClass("tuple_iterator", {
    constructor: function tuple_iter_(tuple) {
        this.$index = 0;
        this.$seq = tuple.sk$asarray();
    },
    iternext: Sk.generic.iterNextWithArray,
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});
