/**
 * @constructor
 * @param {Sk.builtin.func} callable
 * @param {Sk.builtin.object} sentinel - if reached returns undefined
 */
Sk.builtin.callable_iter_ = function (callable, sentinel) {
    if (!Sk.builtin.checkCallable(callable)) {
        throw new Sk.builtin.TypeError("iter(v, w): v must be callable");
    }
    this.$callable = callable;
    this.$sentinel = sentinel;
    this.$flag = false;
};
Sk.abstr.setUpInheritance("callable_iterator", Sk.builtin.callable_iter_, Sk.builtin.object);
Sk.builtin.callable_iter_.sk$acceptable_as_base_class = false;
Sk.builtin.callable_iter_.prototype.tp$iter = Sk.builtin.GenericSelfIter;
Sk.builtin.callable_iter_.prototype.tp$iternext = function (canSuspend) {
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
    
};

/**
 * @constructor
 * @param {Sk.builtin.dict || Sk.builtin.mappingproxy} dict
 */
Sk.builtin.dict_iter_ = function (dict) {
    this.$index = 0;
    this.$seq = dict.$allkeys(); // a private method of dict objects
    this.$orig = dict;
};

Sk.abstr.setUpInheritance("dict_keyiterator", Sk.builtin.dict_iter_, Sk.builtin.object);
Sk.builtin.dict_iter_.sk$acceptable_as_base_class = false;
Sk.builtin.dict_iter_.prototype.tp$iter = Sk.builtin.GenericSelfIter;
Sk.builtin.dict_iter_.prototype.tp$iternext = Sk.builtin.GenericIterNextWithArray(true);
Sk.builtin.dict_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHintWithArray, {NoArgs: true})
];

/**
 * @constructor
 * @param {Sk.builtin.list} lst
 */
Sk.builtin.list_iter_ = function (lst) {
    this.$index = 0;
    this.$seq = lst.v;
    this.$done = false; // the list can change size but once we've consumed the iterator we must stop
};
Sk.abstr.setUpInheritance("list_iterator", Sk.builtin.list_iter_, Sk.builtin.object);
Sk.builtin.list_iter_.sk$acceptable_as_base_class = false;
Sk.builtin.list_iter_.prototype.tp$iter = Sk.builtin.GenericSelfIter;
Sk.builtin.list_iter_.prototype.tp$iternext = function __next__ () {
    if (this.$index >= this.$seq.length || this.$flag) {
        this.$done = true;
        return undefined;
    } 
    return this.$seq[this.$index++];
};
Sk.builtin.list_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHintWithArray, {NoArgs: true})
];

/**
 * @constructor
 * @param {Sk.builtin.set || Sk.builtin.frozenset} set
 */
Sk.builtin.set_iter_ = function (set) {
    this.$index = 0;
    this.$seq = set.v.$allkeys();
    this.$orig = set.v;
};

Sk.abstr.setUpInheritance("set_iterator", Sk.builtin.set_iter_, Sk.builtin.object);
Sk.builtin.set_iter_.sk$acceptable_as_base_class = false;
Sk.builtin.set_iter_.prototype.tp$iter = Sk.builtin.GenericSelfIter;
Sk.builtin.set_iter_.prototype.tp$iternext = Sk.builtin.GenericIterNextWithArray(true);
Sk.builtin.set_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHintWithArray, {NoArgs: true})
];

/**
 * @constructor
 * @param {Sk.builtin.object} obj
 */
Sk.builtin.seq_iter_ = function (seq) {
    this.$index = 0;
    this.$seq = seq;
};
Sk.abstr.setUpInheritance("iterator", Sk.builtin.seq_iter_, Sk.builtin.object);
Sk.builtin.seq_iter_.sk$acceptable_as_base_class = false;
Sk.builtin.seq_iter_.prototype.tp$iter = Sk.builtin.GenericSelfIter;
Sk.builtin.seq_iter_.prototype.tp$iternext = function (canSuspend) {
    let ret;
    try {
        ret = this.$seq.mp$subscript(new Sk.builtin.int_(this.$index), canSuspend);
    } catch (e) {
        if (e instanceof Sk.builtin.IndexError || e instanceof Sk.builtin.StopIteration) {
            return undefined;
        } else {
            throw e;
        }
    }
    this.idx++;
    return ret;
};
Sk.builtin.seq_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__",
    function () {
        if (this.$seq.sq$length) {
            // sq$length will return Sk.miseval.asIndex
            return this.$seq.sq$length() - this.$index;
        }
        else {
            throw new Sk.builtin.NotImplemented("len is not implemented for "+ Sk.abstr.typeName(this.$seq));
        }
    }, 
    {NoArgs: true}
    )
];

/**
 * @constructor
 * @param {Sk.builtin.str} str
 */
Sk.builtin.str_iter_ = function (str) {
    this.$index = 0;
    this.$seq = str.v.slice();
};
Sk.abstr.setUpInheritance("set_iterator", Sk.builtin.str_iter_, Sk.builtin.object);
Sk.builtin.str_iter_.sk$acceptable_as_base_class = false;
Sk.builtin.str_iter_.prototype.tp$iter = Sk.builtin.GenericSelfIter;
Sk.builtin.str_iter_.prototype.tp$iternext = Sk.builtin.GenericIterNextWithArray(false);
Sk.builtin.str_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHintWithArray, {NoArgs: true})
];

/**
 * @constructor
 * @param {Sk.builtin.tuple} tuple
 */
Sk.builtin.tuple_iter_ = function (tuple) {
    this.$index = 0;
    this.$seq = tuple.v;
};
Sk.abstr.setUpInheritance("tuple_iterator", Sk.builtin.tuple_iter_, Sk.builtin.object);
Sk.builtin.tuple_iter_.sk$acceptable_as_base_class = false;
Sk.builtin.tuple_iter_.prototype.tp$iter = Sk.builtin.GenericSelfIter;
Sk.builtin.tuple_iter_.prototype.tp$iternext = Sk.builtin.GenericIterNextWithArray(false);
Sk.builtin.tuple_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHintWithArray, {NoArgs: true})
];


Sk.exportSymbol("Sk.builtin.callable_iter_", Sk.builtin.callable_iter_);
Sk.exportSymbol("Sk.builtin.dict_iter_", Sk.builtin.dict_iter_);
Sk.exportSymbol("Sk.builtin.list_iter_", Sk.builtin.list_iter_);
Sk.exportSymbol("Sk.builtin.set_iter_", Sk.builtin.set_iter_);
Sk.exportSymbol("Sk.builtin.seq_iter", Sk.builtin.seq_iter);
Sk.exportSymbol("Sk.builtin.str_iter_", Sk.builtin.str_iter_);
Sk.exportSymbol("Sk.builtin.tuple_iter_", Sk.builtin.tuple_iter_);


