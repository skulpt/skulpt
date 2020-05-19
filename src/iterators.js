
/**
 * @function
 * @param {Strin} name - the name of the iterator
 * @param {Constructor} iter_constructor - the iter_constructor must set up this.$seq, this.$index = 0, [this.$orig];
 */
Sk.builtin.setUpGenericIterator = function (name, iter_constructor) {
    Sk.abstr.setUpInheritance(name, iter_constructor, Sk.builtin.object);
    iter_constructor.prototype.tp$iter = Sk.builtin.GenericSelfIter;
    return iter_constructor;
};


/**
 * @constructor
 * @param {Sk.builtin.func} callable
 * @param {Sk.builtin.object} sentinel - if reached returns undefined
 */
Sk.builtin.callable_iter_ = Sk.builtin.setUpGenericIterator("callable_iterator",
function (callable, sentinel) {
    if (!Sk.builtin.checkCallable(callable)) {
        throw new Sk.builtin.TypeError("iter(v, w): v must be callable");
    }
    this.callable = callable;
    this.sentinel = sentinel;
    this.flag = false;
});

Sk.builtin.callable_iter_.prototype.tp$iternext = function __next__ () {
    if (this.flag === true) {
        // Iterator has already completed
        return undefined;
    }
    let ret = Sk.misceval.callsimOrSuspendArray(this.callable, []);
    const self = this;
    return Sk.misceval.chain(ret, function (r) {
        if (Sk.misceval.richCompareBool(r, self.sentinel, "Eq")) {
            self.flag = true;
            return undefined;
        } else {
            return r;
        }
    });
};

/**
 * @constructor
 * @param {Sk.builtin.dict || Sk.builtin.mappingproxy} dict
 */
Sk.builtin.dict_iter_ = Sk.builtin.setUpGenericIterator("dict_keyiterator", function (dict) {
    this.$index = 0;
    this.$seq = dict.$allkeys(); // a private method of dict objects
    this.$orig = dict;
}
);
Sk.builtin.dict_iter_.prototype.tp$iternext = Sk.builtin.GenericIterNext(true);
Sk.builtin.dict_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHint, {NoArgs: true})
];

/**
 * @constructor
 * @param {Sk.builtin.list} lst
 */
Sk.builtin.list_iter_ = Sk.builtin.setUpGenericIterator("list_iterator", function (lst) {
    this.$index = 0;
    this.$seq = lst.v;
    this.$flag = false; // the list can change size but once we've consumed the iterator we must stop
});

Sk.builtin.list_iter_.prototype.tp$iternext = function __next__ () {
    if (this.$index >= this.$seq.length || this.$flag) {
        this.$flag = true;
        return undefined;
    } 
    return this.$seq[this.$index++];
};
Sk.builtin.list_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHint, {NoArgs: true})
];

/**
 * @constructor
 * @param {Sk.builtin.set || Sk.builtin.frozenset} set
 */
Sk.builtin.set_iter_ = Sk.builtin.setUpGenericIterator("set_iterator", function (set) {
    this.$index = 0;
    this.$seq = set.v.$allkeys();
    this.$orig = set.v;
}, true
);

Sk.builtin.set_iter_.prototype.tp$iternext = Sk.builtin.GenericIterNext(true);
Sk.builtin.set_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHint, {NoArgs: true})
];

/**
 * @constructor
 * @param {Object} obj
 */
Sk.builtin.str_iter_ = Sk.builtin.setUpGenericIterator("str_iterator", function (str) {
    this.$index = 0;
    this.$seq = str.v.slice();
});
Sk.builtin.str_iter_.prototype.tp$iternext = Sk.builtin.GenericIterNext(false);
Sk.builtin.str_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHint, {NoArgs: true})
];

/**
 * @constructor
 * @param {Sk.builtin.tuple} tuple
 */
Sk.builtin.tuple_iter_ = Sk.builtin.setUpGenericIterator("tuple_iterator", function (tuple) {
    this.$index = 0;
    this.$seq = tuple.v;
});
Sk.builtin.tuple_iter_.prototype.tp$iternext = Sk.builtin.GenericIterNext(false);
Sk.builtin.tuple_iter_.prototype.tp$methods = [
    new Sk.MethodDef("__length_hint__", Sk.builtin.GenericIterLengthHint, {NoArgs: true})
];

Sk.builtin.callable_iter_.prototype.sk$acceptable_as_base_class = 
Sk.builtin.dict_iter_.prototype.sk$acceptable_as_base_class = 
Sk.builtin.list_iter_.prototype.sk$acceptable_as_base_class = 
Sk.builtin.set_iter_.prototype.sk$acceptable_as_base_class = 
Sk.builtin.str_iter_.prototype.sk$acceptable_as_base_class = 
Sk.builtin.tuple_iter_.prototype.sk$acceptable_as_base_class = false;

Sk.exportSymbol("Sk.builtin.setUpGenericIterator", Sk.builtin.setUpGenericIterator);
Sk.exportSymbol("Sk.builtin.callable_iter_", Sk.builtin.callable_iter_);
Sk.exportSymbol("Sk.builtin.dict_iter_", Sk.builtin.dict_iter_);
Sk.exportSymbol("Sk.builtin.list_iter_", Sk.builtin.list_iter_);
Sk.exportSymbol("Sk.builtin.set_iter_", Sk.builtin.set_iter_);
Sk.exportSymbol("Sk.builtin.str_iter_", Sk.builtin.str_iter_);
Sk.exportSymbol("Sk.builtin.tuple_iter_", Sk.builtin.tuple_iter_);


