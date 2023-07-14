Sk.builtin.structseq_types = {};

Sk.builtin.make_structseq = function (module, name, visible_fields, hidden_fields={}, doc=null) {
    const nm = module + "." + name;
    const flds = [];
    const getsets = {};
    Object.keys(visible_fields).forEach((key, i) => {
        flds.push(key);
        getsets[key] = {
            $get() { return this.v[i]; },
            $doc: visible_fields[key],
        };
    });
    const n_flds = flds.length;
    let n_total_flds = n_flds;

    Object.keys(hidden_fields).forEach((key, i) => {
        getsets[key] = {
            $get() {
                return this.$hidden[i] || Sk.builtin.none.none$;
            },
            $doc: hidden_fields[key],
        };
        n_total_flds++;
    });

    /**
     * @constructor
     * @extends Sk.builtin.tuple
     * @param {!Array<Object>|Object} arg
     */
    var structseq = Sk.abstr.buildNativeClass(nm, {
        constructor: function structseq_constructor(v, hidden) {
            Sk.asserts.assert(this instanceof structseq);
            Sk.builtin.tuple.call(this, v);
            this.$hidden = hidden || [];
        },
        base: Sk.builtin.tuple,
        slots: {
            tp$new(args, kwargs) {
                Sk.abstr.checkOneArg(nm, args, kwargs);
                const arg = Sk.misceval.arrayFromIterable(args[0]);
                if (arg.length < n_flds) {
                    throw new Sk.builtin.TypeError(nm + "() takes an at least " + n_flds + "-sequence (" + arg.length + "-sequence given)");
                } else if (arg.length > n_total_flds) {
                    throw new Sk.builtin.TypeError(nm + "() takes an at most " + n_total_flds + "-sequence (" + arg.length + "-sequence given)"); 
                }
                return new structseq(arg.slice(0, n_flds), arg.slice(n_flds));
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
                for (i = 0; i < flds.length; ++i) {
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
            num_sequence_fields: new Sk.builtin.int_(n_flds)
        }
    });
    return structseq;
};
Sk.exportSymbol("Sk.builtin.make_structseq", Sk.builtin.make_structseq);
