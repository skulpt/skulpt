/**
 * @constructor
 * @param {Object} seq
 * @extends Sk.builtin.object
 */
Sk.builtin.reversed = Sk.abstr.buildIteratorClass("reversed", {
    constructor: function reversed(seq) {
        this.$idx = seq.sq$length() - 1;
        this.$seq = seq;
        return this;
    },
    iternext(canSuspend) {
        if (this.$idx < 0) {
            return undefined;
        }
        const ret = Sk.misceval.tryCatch(
            () => Sk.abstr.objectGetItem(this.$seq, new Sk.builtin.int_(this.$idx--), canSuspend),
            (e) => {
                if (e instanceof Sk.builtin.IndexError) {
                    this.$idx = -1;
                    return undefined;
                } else {
                    throw e;
                }
            }
        );
        return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
    },
    slots: {
        tp$doc: "Return a reverse iterator over the values of the given sequence.",
        tp$new(args, kwargs) {
            if (this === Sk.builtin.reversed.prototype) {
                Sk.abstr.checkNoKwargs("reversed", kwargs);
            }
            Sk.abstr.checkArgsLen("reversed", args, 1, 1);
            let seq = args[0];
            const special = Sk.abstr.lookupSpecial(seq, Sk.builtin.str.$reversed);
            if (special !== undefined) {
                return Sk.misceval.callsimArray(special, []);
            } else if (!Sk.builtin.checkSequence(seq) || Sk.abstr.lookupSpecial(seq, Sk.builtin.str.$len) === undefined) {
                throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(seq) + "' object is not a sequence");
            }
            if (this === Sk.builtin.reversed.prototype) {
                return new Sk.builtin.reversed(seq);
            } else {
                const instance = new this.constructor();
                Sk.builtin.reversed.call(instance, seq);
                return instance;
            }
        },
    },
    methods: {
        __length_hint__: {
            $meth: function __length_hint__() {
                return this.$idx >= 0 ? new Sk.builtin.int_(this.$idx) : new Sk.builtin.int_(0);
            },
            $flags: { NoArgs: true },
        },
    },
});
