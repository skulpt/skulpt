/**
 * @constructor
 * @param {Sk.builtin.func} callable
 * @param {Sk.builtin.object} sentinel - if reached returns undefined
 */
Sk.builtin.callable_iter_ = Sk.generic.iterator("callable_iterator", {
    constructor: function (callable, sentinel) {
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
            const self = this;
            return Sk.misceval.chain(ret, function (r) {
                if (Sk.misceval.richCompareBool(r, self.$sentinel, "Eq", true)) {
                    self.$flag = true;
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
 * @param {Sk.builtin.dict} dict
 */
Sk.builtin.dict_iter_ = Sk.generic.iterator("dict_keyiterator", {
    constructor: function (dict) {
        this.$index = 0;
        this.$seq = dict.$allkeys(); // a private method of dict objects
        this.$orig = dict;
    },
    iternext: Sk.generic.iterNextWithArrayCheckSize,
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});

/**
 * @constructor
 * @param {Sk.builtin.list} lst
 */
Sk.builtin.list_iter_ = Sk.generic.iterator("list_iterator", {
    constructor: function (lst) {
        this.$index = 0;
        this.$seq = lst.v;
        this.$done = false; // the list can change size but once we've consumed the iterator we must stop
    },
    iternext: function () {
        if (this.$index >= this.$seq.length || this.$flag) {
            this.$done = true;
            return undefined;
        }
        return this.$seq[this.$index++];
    },
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});

/**
 * @constructor
 * @param {Sk.builtin.set} set or frozenset
 */
Sk.builtin.set_iter_ = Sk.generic.iterator("set_iterator", {
    constructor: function (set) {
        this.$index = 0;
        this.$seq = set.v.$allkeys();
        this.$orig = set.v;
    },
    iternext: Sk.generic.iterNextWithArrayCheckSize,
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});

/**
 * @constructor
 * @param {Sk.builtin.object} obj
 */
Sk.builtin.seq_iter_ = Sk.generic.iterator("iterator", {
    constructor: function (seq) {
        this.$index = 0;
        this.$seq = seq;
    },
    iternext: function (canSuspend) {
        let ret;
        try {
            ret = this.$seq.mp$subscript(
                new Sk.builtin.int_(this.$index),
                canSuspend
            );
        } catch (e) {
            if (
                e instanceof Sk.builtin.IndexError ||
                e instanceof Sk.builtin.StopIteration
            ) {
                return undefined;
            } else {
                throw e;
            }
        }
        this.idx++;
        return ret;
    },
    methods: {
        __length_hint__: {
            $flags: { NoArgs: true },
            $meth: function () {
                if (this.$seq.sq$length) {
                    // sq$length will return Sk.miseval.asIndex
                    return this.$seq.sq$length() - this.$index;
                } else {
                    throw new Sk.builtin.NotImplemented(
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
 * @param {Sk.builtin.str} str
 */
Sk.builtin.str_iter_ = Sk.generic.iterator("str_iterator", {
    constructor: function (str) {
        this.$index = 0;
        this.$seq = str.v.slice();
    },
    iternext: Sk.generic.iterNextWithArray,
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});

/**
 * @constructor
 * @param {Sk.builtin.tuple} tuple
 */
Sk.builtin.tuple_iter_ = Sk.generic.iterator("tuple_iterator", {
    constructor: function (tuple) {
        this.$index = 0;
        this.$seq = tuple.v;
    },
    iternext: Sk.generic.iterNextWithArray,
    methods: {
        __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
    },
    flags: { sk$acceptable_as_base_class: false },
});

Sk.exportSymbol("Sk.builtin.callable_iter_", Sk.builtin.callable_iter_);
Sk.exportSymbol("Sk.builtin.dict_iter_", Sk.builtin.dict_iter_);
Sk.exportSymbol("Sk.builtin.list_iter_", Sk.builtin.list_iter_);
Sk.exportSymbol("Sk.builtin.set_iter_", Sk.builtin.set_iter_);
Sk.exportSymbol("Sk.builtin.seq_iter", Sk.builtin.seq_iter);
Sk.exportSymbol("Sk.builtin.str_iter_", Sk.builtin.str_iter_);
Sk.exportSymbol("Sk.builtin.tuple_iter_", Sk.builtin.tuple_iter_);
