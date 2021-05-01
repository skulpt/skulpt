/**
 * @constructor
 * @param {Array} L
 * @extends {Sk.builtin.object}
 */
Sk.builtin.tuple = Sk.abstr.buildNativeClass("tuple", {
    constructor: function tuple(L) {
        if (L === undefined) {
            L = [];
        } else if (!Array.isArray(L)) {
            L = Sk.misceval.arrayFromIterable(L); 
            // internal calls to constructor can't suspend - avoid using this
        }
        Sk.asserts.assert(this instanceof Sk.builtin.tuple, "bad call to tuple, use 'new' with an Array of python objects");
        this.v = L;
        this.in$repr = false;
    },
    slots: /**@lends {Sk.builtin.tuple.prototype}*/ {
        tp$getattr: Sk.generic.getAttr,
        tp$as_sequence_or_mapping: true,
        tp$doc:
            "Built-in immutable sequence.\n\nIf no argument is given, the constructor returns an empty tuple.\nIf iterable is specified the tuple is initialized from iterable's items.\n\nIf the argument is a tuple, the return value is the same object.",
        $r() {
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
        tp$new(args, kwargs) {
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
            if (arg.constructor === Sk.builtin.tuple) {
                return arg;
            }
            return Sk.misceval.chain(Sk.misceval.arrayFromIterable(arg, true), (L) => new Sk.builtin.tuple(L));
        },
        tp$hash() {
            // the numbers and order are taken from Cpython
            let y,
                x = 0x345678,
                mult = 1000003;
            const len = this.v.length;
            for (let i = 0; i < len; ++i) {
                y = Sk.abstr.objectHash(this.v[i]);
                if (y === -1) {
                    return -1;
                }
                x = (x ^ y) * mult;
                mult += 82520 + len + len;
            }
            x += 97531;
            if (x === -1) {
                x = -2;
            }
            return x | 0;
        },
        tp$richcompare: Sk.generic.seqCompare,
        tp$iter() {
            return new tuple_iter_(this);
        },

        // sequence and mapping slots
        mp$subscript(index) {
            if (Sk.misceval.isIndex(index)) {
                let i = Sk.misceval.asIndexSized(index);
                if (i < 0) {
                    i = this.v.length + i;
                }
                if (i < 0 || i >= this.v.length) {
                    throw new Sk.builtin.IndexError("tuple index out of range");
                }
                return this.v[i];
            } else if (index instanceof Sk.builtin.slice) {
                const ret = [];
                index.sssiter$(this.v.length, (i) => {
                    ret.push(this.v[i]);
                });
                return new Sk.builtin.tuple(ret);
            }
            throw new Sk.builtin.TypeError("tuple indices must be integers or slices, not " + Sk.abstr.typeName(index));
        },
        sq$length() {
            return this.v.length;
        },
        sq$repeat(n) {
            n = Sk.misceval.asIndexSized(n, Sk.builtin.OverflowError);
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
        sq$concat(other) {
            if (!(other instanceof Sk.builtin.tuple)) {
                throw new Sk.builtin.TypeError("can only concatenate tuple (not '" + Sk.abstr.typeName(other) + "') to tuple");
            }
            return new Sk.builtin.tuple(this.v.concat(other.v));
        },
        sq$contains(ob) {
            for (let it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                if (i === ob || Sk.misceval.richCompareBool(i, ob, "Eq")) {
                    return true;
                }
            }
            return false;
        },
    },
    proto: /**@lends {Sk.builtin.tuple.prototype}*/ {
        $subtype_new(args, kwargs) {
            const instance = new this.constructor();
            // pass the args but ignore the kwargs for subtyping - these might be handled by the subtypes init method
            const tuple = Sk.builtin.tuple.prototype.tp$new(args);
            instance.v = tuple.v;
            return instance;
        },
        sk$asarray() {
            return this.v.slice(0);
        },
    },
    methods: /**@lends {Sk.builtin.tuple.prototype}*/ {
        __getnewargs__: {
            $meth() {
                return new Sk.builtin.tuple(this.v.slice(0));
            },
            $flags: { NoArgs: true },
            $textsig: "($self, /)",
            $doc: null,
        },
        index: /**@lends {Sk.builtin.type.prototype}*/ {
            $meth(item, start, end) {
                if ((start !== undefined && !Sk.misceval.isIndex(start)) || (end !== undefined && !Sk.misceval.isIndex(end))) {
                    // unusually can't have None here so check this first...
                    throw new Sk.builtin.TypeError("slice indices must be integers or have an __index__ method");
                }
                ({ start, end } = Sk.builtin.slice.startEnd$wrt(this, start, end));
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
            $meth(item) {
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
