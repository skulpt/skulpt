Sk.builtin.structseq_types = {};

Sk.builtin.make_structseq = function (module, name, fields, doc) {
    const nm = module + "." + name;
    const flds = [];
    const docs = [];
    for (let key in fields) {
        flds.push(key);
        docs.push(fields[key]);
    }

    const getsets = {};
    for (let i = 0; i < flds.length; i++) {
        getsets[flds[i]] = {
            $get() { return this.v[i]; },
            $doc: docs[i]
        };
    }

    /**
     * @constructor
     * @extends Sk.builtin.tuple
     * @param {!Array<Object>|Object} arg
     */
    var structseq = Sk.abstr.buildNativeClass(nm, {
        constructor: function structseq_constructor(v) {
            Sk.asserts.assert((Array.isArray(v) || v === undefined) && this instanceof structseq);
            Sk.builtin.tuple.call(this, v);
        },
        base: Sk.builtin.tuple,
        slots: {
            tp$new(args, kwargs) {
                Sk.abstr.checkOneArg(nm, args, kwargs);
                const v = [];
                const arg = args[0];
                for (let it = Sk.abstr.iter(arg), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    v.push(i);
                }
                if (v.length != flds.length) {
                    throw new Sk.builtin.TypeError(nm + "() takes a " + flds.length + "-sequence (" + v.length + "-sequence given)");
                }
                return new structseq(v);
            },
            tp$doc: doc ? doc : Sk.builtin.none.none$,
            $r() {
                var ret;
                var i;
                var bits;
                if (this.v.length === 0) {
                    return new Sk.builtin.str(nm + "()");
                }
                bits = [];
                for (i = 0; i < this.v.length; ++i) {
                    bits[i] = flds[i] + "=" + Sk.misceval.objectRepr(this.v[i]);
                }
                ret = bits.join(", ");
                if (this.v.length === 1) {
                    ret += ",";
                }
                return new Sk.builtin.str(nm + "(" + ret + ")");
            },

        },
        methods: {
            __reduce__: {
                $meth() {
                    throw new Sk.builtin.NotImplementedError("__reduce__ is not implemented");
                },
                $flags: { NoArgs: true }
            }
        },
        getsets: getsets,
        proto: {
            num_sequence_fields: new Sk.builtin.int_(flds.length)
        }
    });
    return structseq;
};
Sk.exportSymbol("Sk.builtin.make_structseq", Sk.builtin.make_structseq);
