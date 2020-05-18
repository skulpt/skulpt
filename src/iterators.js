/**
 * @constructor
 * @param {Sk.builtin.func} callable
 * @param {Sk.builtin.object} sentinel - if reached returns undefined
 */
Sk.builtin.callable_iterator = function (callable, sentinel) {
    if (!Sk.builtin.checkCallable(callable)) {
        throw new Sk.builtin.TypeError("iter(v, w): v must be callable");
    }
    this.callable = callable;
    this.sentinel = sentinel;
    this.flag = false;
};

Sk.exportSymbol("Sk.builtin.callable_iterator", Sk.builtin.callable_iterator);
Sk.abstr.setUpInheritance("callable_iterator", Sk.builtin.callable_iterator, Sk.builtin.object);

Sk.builtin.callable_iterator.sk$acceptable_as_base_class = false;
Sk.builtin.callable_iterator.prototype.tp$iter = Sk.builtin.genericSelfIter;
Sk.builtin.callable_iterator.prototype.tp$iternext = function () {
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
 * @function
 * @param {Strin} name - the name of the iterator
 * @param {Constructor} iter_constructor - the iter_constructor must set up this.$seq, this.$index = 0, [this.$orig];
 * @param {Boolean} checksize - some iterators like set and dict raise a RuntimeError if the size changes
 */
Sk.builtin.setUpGenericIterator = function (name, iter_constructor, checksize) {

    Sk.abstr.setUpInheritance(name, iter_constructor, Sk.builtin.object);

    iter_constructor.sk$acceptable_as_base_class = false; 

    iter_constructor.prototype.tp$iter = Sk.builtin.GenericSelfIter;
    
    iter_constructor.prototype.tp$iternext = function __iter__() {
        if (this.$index >= this.$seq.length) {
            return undefined;
        } else if (checksize && this.$seq.length > this.$orig.sq$length()) {
            throw new Sk.builtin.RuntimeError(Sk.abstr.typeName(this.$orig) + " changed size during iteration");
        }
        return this.$seq[this.$index++];
    };
    
    iter_constructor.prototype.__length_hint__ = new Sk.builtin.func(function __length_hint__(self) {
        Sk.builtin.pyCheckArgs("__length_hint__", arguments, 0, 0, false, true);
        return self.$seq.length - self.$index;
    });

    return iter_constructor;
};
Sk.exportSymbol("Sk.builtin.setUpGenericIterator", Sk.builtin.setUpGenericIterator);

/**
 * @constructor
 * @param {Sk.builtin.dict || Sk.builtin.mappingproxy} dict
 */
Sk.builtin.dict_iter_ = Sk.builtin.setUpGenericIterator("dict_keyiterator", function (dict) {
    this.$index = 0;
    this.$seq = dict.$allkeys(); // a private method of dict objects
    this.$orig = dict;
}, true
);

/**
 * @constructor
 * @param {Sk.builtin.tuple} tuple
 */
Sk.builtin.tuple_iter_ = Sk.builtin.setUpGenericIterator("tuple_iterator", function (tuple) {
    this.$index = 0;
    this.$seq = tuple.v;
}, false
);

/**
 * @constructor
 * @param {Sk.builtin.list} lst
 */
Sk.builtin.list_iter_ = Sk.builtin.setUpGenericIterator("list_iterator", function (lst) {
    this.$index = 0;
    this.$seq = lst.v;
}, false
);

/**
 * @constructor
 * @param {Sk.builtin.set || Sk.builtin.frozenset} set
 */
Sk.builtin.set_iter_ = Sk.builtin.setUpGenericIterator("set_iter", function (set) {
    this.$index = 0;
    this.$seq = set.v.$allkeys();
    this.$orig = set.v;
}, true
);
