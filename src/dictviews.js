const dict$views = {
    KEYS: "dict_keys",
    VALUES: "dict_values",
    ITEMS: "dict_items",
};

function buildDictView(typename) {
    const dict_view_options = {};
    dict_view_options.constructor = function (dict) {
        this.dict = dict;
    };
    dict_view_options.slots = {
        tp$getattr: Sk.generic.getAttr,
        tp$as_number: true,
        tp$as_sequence_or_mapping: true,
        tp$hash: Sk.builtin.none.none$,
        $r: function () {
            if (this.$entered_repr !== undefined) {
                // prevent recursively calling oneself
                return new Sk.builtin.str("...");
            }
            this.$entered_repr = true;
            const L = Sk.misceval.arrayFromIterable(this);
            const res = Sk.misceval.objectRepr(new Sk.builtin.list(L));
            this.$entered_repr = undefined;
            return new Sk.builtin.str(Sk.abstr.typeName(this) + "(" + res + ")");
        },
        tp$richcompare: function () {
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
        tp$iter: function () {
            if (this.tp$name === dict$views.KEYS) {
                return new Sk.builtin.dict_iter_(this.dict);
            } else if (this.tp$name === dict$views.VALUES) {
                return new Sk.builtin.dict_valueiter_(this.dict);
            } else if (this.tp$name === dict$views.ITEMS) {
                return new Sk.builtin.dict_itemiter_(this.dict);
            }
        },
        nb$subtract: function () {
            // TODO
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
        nb$and: function () {
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
        nb$or: function () {
            return Sk.builtin.NotImplemented.NotImplemented$;
        },
        nb$xor: function () {
            return Sk.builtin.NotImplemented.NotImplemented$;
        },

        sq$length: function () {
            return this.dict.get$size();
        },
        sq$contains: function (item) {
            var iter, key, value, pair;
            if (this.tp$name === dict$views.KEYS) {
                return this.dict.mp$lookup(item) !== undefined;
            } else if (this.tp$name === dict$views.VALUES) {
                for (iter = Sk.abstr.iter(this.dict), key = iter.tp$iternext(); key !== undefined; key = iter.tp$iternext()) {
                    value = this.dict.mp$subscript(key);
                    if (value === undefined) {
                        value = null;
                    }
                    if (Sk.misceval.isTrue(Sk.misceval.richCompareBool(value, item, "Eq"))) {
                        return true;
                    }
                }
                return false;
            } else if (this.tp$name === dict$views.ITEMS) {
                if (item.mp$subscript && item.sq$length && item.sq$length() === 2) {
                    key = item.mp$subscript(new Sk.builtin.int_(0));
                    value = this.dict.mp$lookup(key);
                    if (value !== undefined) {
                        pair = new Sk.builtin.tuple([key, value]);
                        if (Sk.misceval.isTrue(Sk.misceval.richCompareBool(pair, item, "Eq"))) {
                            return true;
                        }
                    }
                }
                return false;
            }
        },
    };
    dict_view_options.methods = {
        isdisjoint: {
            $meth: function () {
                return Sk.builtin.NotImplemented.NotImplemented$;
            },
            $flags: {},
            $textsig: null,
            $doc: "Return True if the view and the given iterable have a null intersection.",
        },
        __reversed__: {
            $meth: function () {
                if (this.tp$name === dict$views.KEYS) {
                    return new Sk.builtin.dict_reverse_iter_(this.dict);
                } else if (this.tp$name === dict$views.ITEMS) {
                    return new Sk.builtin.dict_reverse_itemiter_(this.dict);
                } else if (this.tp$name === dict$views.VALUES) {
                    return new Sk.builtin.dict_reverse_valueiter_(this.dict);
                }
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Return a reverse iterator over the dict keys.",
        },
    };
    dict_view_options.flags = {
        sk$acceptable_as_base: false,
    };

    return Sk.abstr.buildNativeClass(typename, dict_view_options);
}

Sk.builtin.dict_keys = buildDictView("dict_keys");
Sk.builtin.dict_values = buildDictView("dict_values");
Sk.builtin.dict_items = buildDictView("dict_items");

function dict_iter_constructor(dict) {
    this.$index = 0;
    this.$seq = dict.sk$asarray();
    this.$orig = dict;
}

/**
 * @param {string} typename 
 * @param {Function} iternext 
 * @param {Function=} constructor 
 */
function buildDictIterClass(typename, iternext, constructor) {
    return Sk.abstr.buildIteratorClass(typename, {
        constructor:
            constructor ||
            function (dict) {
                dict_iter_constructor.call(this, dict);
            },
        iternext: iternext,
        methods: {
            __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
        },
        flags: { sk$acceptable_as_base_class: false },
    });
}

/**
 * @constructor
 * @param {Sk.builtin.dict} dict
 */
Sk.builtin.dict_iter_ = buildDictIterClass("dict_keyiterator", Sk.generic.iterNextWithArrayCheckSize);

function dict_iter_get_value_or_throw() {
    const key = Sk.generic.iterNextWithArrayCheckSize.call(this);
    if (key === undefined) {
        return key;
    }
    const res = this.$orig.mp$lookup(key);
    if (res !== undefined) {
        return res;
    }
    // some what of a hack since we don't dynamically get keys unlike Python
    throw new Sk.builtin.RuntimeError(Sk.misceval.objectRepr(key) + " removed during iteration");
}

/**
 * @constructor
 * @param {Sk.builtin.dict} dict
 */
Sk.builtin.dict_valueiter_ = buildDictIterClass("dict_valueiterator", function () {
    return dict_iter_get_value_or_throw.call(this);
});

/**
 * @constructor
 * @param {Sk.builtin.dict} dict
 */
Sk.builtin.dict_itemiter_ = buildDictIterClass("dict_itemiterator", function __next__ () {
    const idx = this.$index;
    const val = dict_iter_get_value_or_throw.call(this);
    if (val === undefined) {
        return val;
    }
    return new Sk.builtin.tuple([this.$seq[idx], val]);
});

function dict_reverse_iter_constructor(dict) {
    dict_iter_constructor.call(this, dict);
    this.$seq.reverse();
}

Sk.builtin.dict_reverse_iter_ = buildDictIterClass("dict_reversekeyiterator", Sk.generic.iterNextWithArrayCheckSize, function (dict) {
    dict_reverse_iter_constructor.call(this, dict);
});

Sk.builtin.dict_reverse_itemiter_ = buildDictIterClass("dict_reverseitemiterator", Sk.builtin.dict_itemiter_.prototype.tp$iternext, function (dict) {
    dict_reverse_iter_constructor.call(this, dict);
});

Sk.builtin.dict_reverse_valueiter_ = buildDictIterClass("dict_reversevalueiterator", Sk.builtin.dict_valueiter_.prototype.tp$iternext, function (dict) {
    dict_reverse_iter_constructor.call(this, dict);
});
