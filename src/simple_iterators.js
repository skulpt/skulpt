/**
 * 
 * @constructor
 * @extends {Sk.builtin.object}
 * @param {Sk.builtin.func} callable
 * @param {Sk.builtin.object} sentinel - if reached returns undefined
 * @private
 */
Sk.builtin.callable_iter_ = Sk.abstr.buildIteratorClass("callable_iterator", {
    constructor: function callable_iter (callable, sentinel) {
        if (!Sk.builtin.checkCallable(callable)) {
            throw new Sk.builtin.TypeError("iter(v, w): v must be callable");
        }
        this.$callable = callable;
        this.$sentinel = sentinel;
        this.$flag = false;
    },
    iternext: function (canSuspend) {
        let ret;
        if (this.$flag === true) {
            // Iterator has already completed
            return undefined;
        }
        if (canSuspend) {
            ret = Sk.misceval.callsimOrSuspendArray(this.$callable, []);
            return Sk.misceval.chain(ret, (r) => {
                if (Sk.misceval.richCompareBool(r, this.$sentinel, "Eq", true)) {
                    this.$flag = true;
                    return undefined;
                } else {
                    return r;
                }
            });
        } else {
            ret = Sk.misceval.callsimArray(this.$callable, []);
            if (Sk.misceval.richCompareBool(ret, this.$sentinel, "Eq", false)) {
                this.$flag = true;
                return undefined;
            } else {
                return ret;
            }
        }
    },
    flags: { sk$acceptable_as_base_class: false },
});







/**
 * @constructor
 * @extends {Sk.builtin.object}
 * @param {Sk.builtin.object} seq
 * @private
 */
Sk.builtin.seq_iter_ = Sk.abstr.buildIteratorClass("iterator", {
    constructor: function seq_iter (seq) {
        this.$index = 0;
        this.$seq = seq;
    },
    iternext: function (canSuspend) {
        let ret;
        ret = Sk.misceval.tryCatch(
            () => {
                return this.$seq.mp$subscript(new Sk.builtin.int_(this.$index++), canSuspend);
            },
            (e) => {
                if (e instanceof Sk.builtin.IndexError || e instanceof Sk.builtin.StopIteration) {
                    return undefined;
                } else {
                    throw e;
                }
            }
        );
        return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
    },
    methods: {
        __length_hint__: {
            $flags: { NoArgs: true },
            $meth: function () {
                if (this.$seq.sq$length) {
                    // sq$length will return Sk.miseval.asIndex
                    return this.$seq.sq$length() - this.$index;
                } else {
                    throw new Sk.builtin.NotImplementedError(
                        "len is not implemented for " + Sk.abstr.typeName(this.$seq)
                    );
                }
            },
        },
    },
    flags: { sk$acceptable_as_base_class: false },
});

/**
 * @constructor
 * @extends {Sk.builtin.object}
 * @param {Sk.builtin.str} str
 * @private
 */
Sk.builtin.str_iter_ = Sk.abstr.buildIteratorClass("str_iterator", {
    constructor: function str_iter_(str) {
        this.$index = 0;
        this.$seq = str.v.slice(0);
        this.$length = str.sq$length();
    },
    iternext: function () {
        if (this.$index >= this.$length) {
            return undefined;
        }
        return new Sk.builtin.str(this.$seq.substr(this.$index++, 1));
    },
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});





Sk.exportSymbol("Sk.builtin.callable_iter_", Sk.builtin.callable_iter_);
Sk.exportSymbol("Sk.builtin.str_iter_", Sk.builtin.str_iter_);