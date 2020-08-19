/** @typedef {Sk.builtin.object} */ var pyObject;
/** @typedef {Sk.builtin.type|Function} */ var typeObject;

/**
 * @constructor
 * @extends {Sk.builtin.object}
 * @param {Array=} L A javascript array of key value pairs - All elements should be pyObjects
 *
 * @description
 * call with an array of key value pairs
 * Do not use this function to convert a JS object to a dict
 * Instead use {@link Sk.ffi.remapToPy}
 *
 *
 */
Sk.builtin.dict = Sk.abstr.buildNativeClass("dict", {
    constructor: function dict(L) {
        // calling new Sk.builtin.dict is an internal method that requires an array of key value pairs
        if (L === undefined) {
            L = [];
        }
        Sk.asserts.assert(Array.isArray(L) && L.length % 2 === 0 && this instanceof Sk.builtin.dict, "bad call to dict constructor");

        this.size = 0;
        this.entries = Object.create(null);
        this.buckets = {};
        for (let i = 0; i < L.length; i += 2) {
            this.set$item(L[i], L[i + 1]);
        }
        this.in$repr = false;
    },
    slots: /**@lends {Sk.builtin.dict.prototype}*/ {
        tp$getattr: Sk.generic.getAttr,
        tp$as_sequence_or_mapping: true,
        tp$as_number: true,
        tp$hash: Sk.builtin.none.none$,
        tp$doc:
            "dict() -> new empty dictionary\ndict(mapping) -> new dictionary initialized from a mapping object's\n    (key, value) pairs\ndict(iterable) -> new dictionary initialized as if via:\n    d = {}\n    for k, v in iterable:\n        d[k] = v\ndict(**kwargs) -> new dictionary initialized with the name=value pairs\n    in the keyword argument list.  For example:  dict(one=1, two=2)",
        $r: function () {
            if (this.in$repr) {
                // prevents recursively calling repr;
                return new Sk.builtin.str("{...}");
            }
            this.in$repr = true;
            // iterate over the keys - we don't use the dict iterator or mp$subscript here
            const ret = Object.values(this.entries).map((x) => Sk.misceval.objectRepr(x.lhs) + ": " + Sk.misceval.objectRepr(x.rhs));
            this.in$repr = false;
            return new Sk.builtin.str("{" + ret.join(", ") + "}");
        },
        tp$new: Sk.generic.new,
        tp$init: function (args, kwargs) {
            return this.update$common(args, kwargs, "dict");
        },
        tp$iter: function () {
            return new dict_iter_(this);
        },
        tp$richcompare: function (other, op) {
            let res;
            if (!(other instanceof Sk.builtin.dict) || (op !== "Eq" && op !== "NotEq")) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            if (other === this) {
                res = true;
            } else if (this.size !== other.size) {
                res = false;
            } else {
                let item, k, v, otherv;
                const entries = this.entries;
                res = true;
                for (let key_hash in entries) {
                    item = entries[key_hash];
                    k = item.lhs;
                    v = item.rhs;
                    otherv = other.mp$lookup(k);
                    if (otherv === undefined) {
                        res = false;
                        break;
                    }
                    if (!Sk.misceval.richCompareBool(v, otherv, "Eq")) {
                        res = false;
                        break;
                    }
                }
            }
            return op === "Eq" ? res : !res;
        },
        // as number slot
        nb$or: function(other) {
            if (!(other instanceof Sk.builtin.dict)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            const dict = this.dict$copy();
            dict.dict$merge(other);
            return dict;
        },
        nb$inplace_or: function(other){
            this.update$common([other], [], "|");
            return this;
        },
        // sequence or mapping slots
        sq$length: function () {
            return this.get$size();
        },
        sq$contains: function (ob) {
            return this.mp$lookup(ob) !== undefined;
        },
        mp$subscript: function (key, canSuspend) {
            const res = this.mp$lookup(key);
            if (res !== undefined) {
                // Found in dictionary
                return res;
            }
            let missing = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$missing);  
            if (missing !== undefined) {
                const ret = Sk.misceval.callsimOrSuspendArray(missing, [this, key]);
                return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
            }
            throw new Sk.builtin.KeyError(key);
        },
        mp$ass_subscript: function (key, value) {
            if (value === undefined) {
                this.del$item(key);
            } else {
                this.set$item(key, value);
            }
            return Sk.builtin.none.none$;
        },
    },
    proto: /**@lends {Sk.builtin.dict.prototype}*/ {
        get$size: function () {
            // can't be overridden by subclasses so we use this for the dict key iterator
            return this.size;
        },
        sk$asarray: function () {
            return Object.values(this.entries).map((item) => item.lhs);
        },
    },
    methods: /**@lends {Sk.builtin.dict.prototype}*/ {
        __reversed__: {
            $meth: function () {
                return new dict_reverse_iter_(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Return a reverse iterator over the dict keys.",
        },
        get: {
            $meth: function (key, d) {
                return this.mp$lookup(key) || d || Sk.builtin.none.none$;
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($self, key, default=None, /)",
            $doc: "Return the value for key if key is in the dictionary, else default.",
        },
        setdefault: {
            $meth: function (key, default_) {
                // logic could be simpler here but some tests dictate we can't do too many lookups
                let item;
                const hash = getHash(key);
                item = (typeof hash === "string") ?  this.entries[hash] : this.get$bucket_item(key, hash);
                if (item !== undefined) {
                    return item.rhs;
                }
                default_ = default_ || Sk.builtin.none.none$;
                if (typeof hash === "string" ) {
                    this.entries[hash] = {lhs: key, rhs: default_};
                } else {
                    this.set$bucket_item(key, default_, hash);
                }
                this.size++;
                this.$version++;
                return default_;
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($self, key, default=None, /)",
            $doc:
                "Insert key with a value of default if key is not in the dictionary.\n\nReturn the value for key if key is in the dictionary, else default.",
        },
        pop: {
            $meth: function (key, d) {
                const hash = getHash(key);
                let item, value;
                if (typeof hash === "string") {
                    item = this.entries[hash];
                    if (item !== undefined) {
                        value = item.rhs;
                        delete this.entries[hash];
                    }
                } else {
                    item = this.pop$bucket_item(key, hash);
                    if (item !== undefined) {
                        value = item.rhs;
                    }
                }
                if (value !== undefined) {
                    this.size -= 1;
                    return value;
                }
                // Not found in dictionary
                if (d !== undefined) {
                    return d;
                }
                throw new Sk.builtin.KeyError(key);
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: null,
            $doc:
                "D.pop(k[,d]) -> v, remove specified key and return the corresponding value.\nIf key is not found, d is returned if given, otherwise KeyError is raised",
        },
        popitem: {
            $meth: function () {
                // not particularly efficent but we get allkeys as an array to iter anyway
                if (this.get$size() == 0) {
                    throw new Sk.builtin.KeyError("popitem(): dictionary is empty");
                }
                const youngest_key = Object.values(this.entries)[this.size - 1].lhs;
                const val = this.pop.$meth.call(this, youngest_key, Sk.builtin.none.none$);
                return new Sk.builtin.tuple([youngest_key, val]);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.popitem() -> (k, v), remove and return some (key, value) pair as a\n2-tuple; but raise KeyError if D is empty.",
        },
        keys: {
            $meth: function () {
                return new dict_keys(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.keys() -> a set-like object providing a view on D's keys",
        },
        items: {
            $meth: function () {
                return new dict_items(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.items() -> a set-like object providing a view on D's items",
        },
        values: {
            $meth: function () {
                return new dict_values(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.values() -> an object providing a view on D's values",
        },
        update: {
            $meth: function (args, kwargs) {
                return this.update$common(args, kwargs, "update");
            },
            $flags: { FastCall: true },
            $textsig: null,
            $doc:
                "D.update([E, ]**F) -> None.  Update D from dict/iterable E and F.\nIf E is present and has a .keys() method, then does:  for k in E: D[k] = E[k]\nIf E is present and lacks a .keys() method, then does:  for k, v in E: D[k] = v\nIn either case, this is followed by: for k in F:  D[k] = F[k]",
        },
        clear: {
            $meth: function () {
                this.size = 0;
                this.entries = Object.create(null);
                this.buckets = {};
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.clear() -> None.  Remove all items from D.",
        },
        copy: {
            $meth: function () {
                const newCopy = new Sk.builtin.dict([]);
                newCopy.dict$merge(this);
                return newCopy;
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.copy() -> a shallow copy of D",
        },
    },
    classmethods: /**@lends {Sk.builtin.dict.prototype}*/ {
        fromkeys: {
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($type, iterable, value=None, /)",
            $meth: function fromkeys(seq, value) {
                value = value || Sk.builtin.none.none$;
                const dict = new Sk.builtin.dict([]);
                return Sk.misceval.chain(
                    Sk.misceval.iterFor(Sk.abstr.iter(seq), (key) => {
                        dict.set$item(key, value);
                    }),
                    () => dict
                );
            },
            $doc: "Create a new dictionary with keys from iterable and values set to value.",
        },
    },
});


function getHash(key) {
    let key_hash = key.$savedKeyHash_;
    if (key_hash !== undefined) {
        return key_hash;
    } else if (key.ob$type === Sk.builtin.str) {
        key_hash = key.$jsstr().replace(/^[0-9!#_]/, "!$&"); // avoid numbers and clashes
        key.$savedKeyHash_ = key_hash;
        return key_hash;
    }
    key_hash = Sk.builtin.hash(key).v; // builtin.hash returns an int
    return key_hash;
}

/**
 * @private
 * @param {Sk.builtin.str} pyName
 * @this {Sk.builtin.dict}
 */
Sk.builtin.dict.prototype.quick$lookup = function (pyName) {
    /**@type {string} */
    const key_hash = pyName.$savedKeyHash_;
    if (key_hash === undefined) {
        return;
    }
    const item = this.entries[key_hash];
    if (item !== undefined) {
        return item.rhs;
    }
    return;
};

/**
 * NB:
 * We could put the following methods on the proto in the above object literal
 * but they're quite long so we keep them below for readability
 * @ignore
 */

/**
 * @function
 * @param {pyObject} key - key to get item for
 * @param {string} hash_value - hash_value from the key
 *
 * @description
 * fast call - if we have a str then we can guarantee that it's in the bucket
 * so we compare strings quickly rather than reaching out to richcompareBool
 *
 * @return {pyObject|undefined} the item if found or undefined if not found
 * @private
 */
Sk.builtin.dict.prototype.get$bucket_item = function (key, hash_value) {
    const bucket = this.buckets[hash_value];
    let bucket_key, item;
    if (bucket === undefined) {
        return;
    }
    for (let i = 0; i < bucket.length; i++) {
        item = bucket[i];
        if (item === undefined) {
            continue;
        }
        bucket_key = item.lhs;
        if (bucket_key === key || Sk.misceval.richCompareBool(key, bucket_key, "Eq")) {
            return item;
        }
    }
    return;
};

/**
 * @function
 * @param {pyObject} key
 * @param {string} hash_value
 *
 * @return undefined if no key was found
 * or the item if the key was in the bucket
 * also removes the item from entries
 * @private
 */
Sk.builtin.dict.prototype.pop$bucket_item = function (key, hash_value) {
    const bucket = this.buckets[hash_value];
    let bucket_key, item;
    if (bucket === undefined) {
        return undefined;
    }
    for (let i = 0; i < bucket.length; i++) {
        item = bucket[i];
        if (item === undefined) {
            continue;
        }
        bucket_key = item.lhs;
        if (bucket_key === key || Sk.misceval.richCompareBool(key, bucket_key, "Eq")) {
            const key_hash = "#" + hash_value + "_" + i;
            delete this.entries[key_hash];
            bucket[i] = undefined;
            if (bucket.every((x) => x === undefined)) {
                delete this.buckets[hash_value];
            }
            return item;
        }
    }
    return;
};

/**
 * @function
 * @param {Sk.builtin.object} key
 * @param {Sk.builtin.object} value
 * @param {string} hash_value
 *
 * @description
 * given a key and a hash_value will find a free slot or append to the list of slots for a given hash_value
 * then will set the item in the entries and return the item
 * Note this should only be called and immediately preceded by assigning the value to the rhs
 *
 * @return {{lhs: Sk.builtin.object, rhs: Sk.builtin.object}}
 * @private
 */
Sk.builtin.dict.prototype.set$bucket_item = function (key, value, hash_value) {
    let key_hash,
        bucket = this.buckets[hash_value];
    const item = { lhs: key, rhs: value };
    if (bucket === undefined) {
        this.buckets[hash_value] = [item];
        key_hash = "#" + hash_value + "_" + 0;
    } else {
        // we might have a freeslot from deleting an item
        const free_slot_idx = bucket.indexOf(undefined);
        if (free_slot_idx !== -1) {
            key_hash = "#" + hash_value + "_" + free_slot_idx;
            bucket[free_slot_idx] = item;
        } else {
            key_hash = "#" + hash_value + "_" + bucket.length;
            bucket.push(item);
        }
    }
    this.entries[key_hash] = item;
};

/**
 * @function
 * @param {Sk.builtin.object} key - want to check if the key is inside the dict
 *
 * @return undefined if no key was found
 * or the item.rhs (value) if the key was found
 * @private
 */
Sk.builtin.dict.prototype.mp$lookup = function (key) {
    let item;
    const hash = getHash(key);
    if (typeof hash === "string") {
        item = this.entries[hash];
    } else {
        // then we have a base hash so this is non string;
        item = this.get$bucket_item(key, hash);
    }
    if (item !== undefined) {
        return item.rhs;
    }
    // Not found in dictionary
    return undefined;
};

/**
 * @function
 *
 * @param {Sk.builtin.dict} b or dictlike object (anything with a keys method)
 *
 * @description
 * this function mimics the cpython implementation, which is also the reason for the
 * almost similar code, this may be changed in future
 *
 * Note we don't use mp$ass_subscript since that slot might be overridden by a subclass
 * Instead we use this.set$item which is the dict implementation of mp$ass_subscript
 * @private
 */
Sk.builtin.dict.prototype.dict$merge = function (b) {
    // we don't use mp$ass_subscript incase a subclass overrides __setitem__ we just ignore that like Cpython does
    // so use this.set$item instead which can't be overridden by a subclass
    let keys;
    if (b.tp$iter === Sk.builtin.dict.prototype.tp$iter) {
        // fast way used
        keys = b.tp$iter();
    } else {
        // generic slower way for a subclass that has overriden the tp$iter method
        // we'll just assume prototypical inheritance here!
        keys = Sk.misceval.callsimOrSuspendArray(b.keys, [b]);
    }
    return Sk.misceval.chain(keys, (keys) =>
        Sk.misceval.iterFor(Sk.abstr.iter(keys), (key) =>
            Sk.misceval.chain(b.mp$subscript(key), (v) => {
                this.set$item(key, v);
            })
        )
    );
};

/**
 * @function
 *
 * @param {Array} args
 * @param {Array} kwargs
 * @param {string} func_name for error messages
 *
 * @description
 *
 * update() accepts either another dictionary object or an iterable of key/value pairs (as tuples or other iterables of length two).
 * If keyword arguments are specified, the dictionary is then updated with those key/value pairs: d.update(red=1, blue=2).
 * https://hg.python.org/cpython/file/4ff865976bb9/Objects/dictobject.c
 *
 * this function is called by both __init__ and update
 * We check that there is only 1 arg
 *
 * if arg is a dict like object we call dict$merge (must have a keys attribute)
 * otherwise call dict$merge_seq
 *
 * finally put the kwargs in the dict.
 * @private
 *
 */
Sk.builtin.dict.prototype.update$common = function (args, kwargs, func_name) {
    Sk.abstr.checkArgsLen(func_name, args, 0, 1);
    const arg = args[0];
    let ret;
    if (arg !== undefined) {
        if (arg instanceof Sk.builtin.dict) {
            ret = this.dict$merge(arg);
        } else if (Sk.abstr.lookupSpecial(arg, new Sk.builtin.str("keys")) !== undefined) {
            ret = this.dict$merge(arg);
        } else {
            ret = this.dict$merge_seq(arg);
        }
    }
    return Sk.misceval.chain(ret, () => {
        if (kwargs) {
            for (let i = 0; i < kwargs.length; i += 2) {
                this.set$item(new Sk.builtin.str(kwargs[i]), kwargs[i + 1]);
            }
        }
        return Sk.builtin.none.none$;
    });
};

/**
 * @function
 *
 * @param {pyObject} arg
 *
 * @description
 * iterate over a sequence like object
 * check the next value has length 2
 * and then set the key value pair in
 * @private
 *
 */
Sk.builtin.dict.prototype.dict$merge_seq = function (arg) {
    let idx = 0;
    return Sk.misceval.iterFor(Sk.abstr.iter(arg), (i) => {
        if (!Sk.builtin.checkIterable(i)) {
            throw new Sk.builtin.TypeError("cannot convert dictionary update sequence element #" + idx + " to a sequence");
        }
        const seq = Sk.misceval.arrayFromIterable(i);
        this.set$item(seq[0], seq[1]);
        if (seq.length !== 2) {
            throw new Sk.builtin.ValueError("dictionary update sequence element #" + idx + " has length " + seq.length + "; 2 is required");
        }
        idx++;
    });
};

/**
 * @function
 *
 * @param {pyObject} key should be a python object
 * @param {pyObject} value
 *
 * @description
 * sets the item from a key, value
 * @private
 *
 */
Sk.builtin.dict.prototype.set$item = function (key, value) {
    const hash = getHash(key);
    let item;
    if (typeof hash === "string") {
        // we have a string so pass it to the dictionary
        item = this.entries[hash];
        if (item === undefined) {
            this.entries[hash] = { lhs: key, rhs: value };
            this.size += 1;
        } else {
            item.rhs = value;
        }
    } else {
        item = this.get$bucket_item(key, hash);
        if (item === undefined) {
            this.set$bucket_item(key, value, hash);
            this.size += 1;
        } else {
            item.rhs = value;
        }
    }
};

/**
 * @function
 *
 * @param {Sk.builtin.object} key
 *
 * @description
 * deletes an item in the dictionary
 * @private
 *
 */
Sk.builtin.dict.prototype.del$item = function (key) {
    const hash = getHash(key);
    let item;
    if (typeof hash === "string") {
        item = this.entries[hash];
        delete this.entries[hash];
    } else {
        item = this.pop$bucket_item(key, hash);
    }
    if (item !== undefined) {
        this.size -= 1;
        return;
    }
    // Not found in dictionary
    throw new Sk.builtin.KeyError(key);
};

function as_set(self) {
    return new Sk.builtin.set(Sk.misceval.arrayFromIterable(self));
}
function checkAnyView(view) {
    return view instanceof dict_keys || view instanceof dict_items;
}
function all_contained_in(self, other) {
    for (let it = Sk.abstr.iter(self), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
        if (!Sk.abstr.sequenceContains(other, i)) {
            return false;
        }
    }
    return true;
}

// compile shared slots
const dict_view_slots = {
    tp$getattr: Sk.generic.getAttr,
    tp$as_number: true,
    tp$as_sequence_or_mapping: true,
    tp$hash: Sk.builtin.none.none$,
    $r: function () {
        if (this.in$repr) {
            // prevent recursively calling oneself
            return new Sk.builtin.str("...");
        }
        this.in$repr = true;
        let ret = Sk.misceval.arrayFromIterable(this);
        ret = ret.map((x) => Sk.misceval.objectRepr(x));
        this.in$repr = false;
        return new Sk.builtin.str(Sk.abstr.typeName(this) + "([" + ret.join(", ") + "])");
    },
    tp$richcompare: function (other, op) {
        if (!(Sk.builtin.checkAnySet(other) || checkAnyView(other))) {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        let result;
        const len_self = this.sq$length();
        const len_other = other.sq$length();
        switch (op) {
            case "NotEq":
            case "Eq":
                if (len_self === len_other) {
                    result = all_contained_in(this, other);
                }
                result = op === "NotEq" ? !result : result;
                break;
            case "Lt":
                if (len_self < len_other) {
                    result = all_contained_in(this, other);
                }
                break;
            case "LtE":
                if (len_self <= len_other) {
                    result = all_contained_in(this, other);
                }
                break;
            case "Gt":
                if (len_self > len_other) {
                    result = all_contained_in(other, this);
                }
                break;
            case "GtE":
                if (len_self >= len_other) {
                    result = all_contained_in(other, this);
                }
                break;
        }
        return result;
    },
    nb$subtract: function (other) {
        const set = as_set(this);
        return set.difference.$meth.call(set, other);
    },
    nb$and: function (other) {
        const set = as_set(this);
        return set.intersection.$meth.call(set, other);
    },
    nb$or: function (other) {
        const set = as_set(this);
        return set.union.$meth.call(set, other);
    },
    nb$xor: function (other) {
        const set = as_set(this);
        return set.symmetric_difference.$meth.call(set, other);
    },
    sq$length: function () {
        return this.dict.get$size();
    },
};


function buildDictView(typename, slots, reverse_method) {
    const options = {
        constructor: function dict_view(dict) {
            if (arguments.length !== 1) {
                throw new Sk.builtin.TypeError("cannot create '" + Sk.abstr.typeName(this) + "' instances");
            }
            this.dict = dict;
            this.in$repr = false;
        },
    };
    options.slots = Object.assign(slots, dict_view_slots);
    options.methods = {
        isdisjoint: {
            $meth: function (other) {
                const set = as_set(this);
                return set.isdisjoint.$meth.call(set, other);
            },
            $flags: { OneArg: true },
            $textsig: null,
            $doc: "Return True if the view and the given iterable have a null intersection.",
        },
        __reversed__: {
            $meth: reverse_method,
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Return a reverse iterator over the dict keys.",
        },
    };
    options.flags = {
        sk$acceptable_as_base: false,
    };
    if (typename === "dict_values") {
        // dict_values doesn't have number or richcompare slots
        delete options.slots.tp$as_number;
        delete options.slots.tp$richcompare;
    }
    return Sk.abstr.buildNativeClass(typename, options);
}

var dict_keys = buildDictView(
    "dict_keys",
    {
        sq$contains: function (key) {
            return this.dict.mp$lookup(key) !== undefined;
        },
        tp$iter: function () {
            return new dict_iter_(this.dict);
        },
    },
    function __reverse__() {
        return new dict_reverse_iter_(this.dict);
    }
);

var dict_values = buildDictView(
    "dict_values",
    {
        tp$iter: function () {
            return new dict_valueiter_(this.dict);
        },
    },
    function __reverse__() {
        return new dict_reverse_valueiter_(this.dict);
    }
);

var dict_items = buildDictView(
    "dict_items",
    {
        sq$contains: function (item) {
            if (!(item instanceof Sk.builtin.tuple && item.sq$length() === 2)) {
                return false;
            }
            const key = item.mp$subscript(new Sk.builtin.int_(0));
            const value = item.mp$subscript(new Sk.builtin.int_(1));
            const found = this.dict.mp$lookup(key);
            if (found === undefined) {
                return false;
            }
            return found === value || Sk.misceval.richCompareBool(found, value, "Eq");
        },
        tp$iter: function () {
            return new dict_itemiter_(this.dict);
        },
    },
    function __reverse__() {
        return new dict_reverse_itemiter_(this.dict);
    }
);

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
var dict_iter_ = buildDictIterClass("dict_keyiterator", Sk.generic.iterNextWithArrayCheckSize);

function dict_iter_get_value_or_throw() {
    const key = Sk.generic.iterNextWithArrayCheckSize.call(this);
    if (key === undefined) {
        return undefined;
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
var dict_valueiter_ = buildDictIterClass("dict_valueiterator", function () {
    return dict_iter_get_value_or_throw.call(this);
});

/**
 * @constructor
 * @param {Sk.builtin.dict} dict
 */
var dict_itemiter_ = buildDictIterClass("dict_itemiterator", function () {
    const idx = this.$index;
    const val = dict_iter_get_value_or_throw.call(this);
    if (val === undefined) {
        return undefined;
    }
    return new Sk.builtin.tuple([this.$seq[idx], val]);
});

function dict_reverse_iter_constructor(dict) {
    dict_iter_constructor.call(this, dict);
    this.$seq.reverse();
}

var dict_reverse_iter_ = buildDictIterClass("dict_reversekeyiterator", dict_iter_.prototype.tp$iternext, function (dict) {
    dict_reverse_iter_constructor.call(this, dict);
});

var dict_reverse_itemiter_ = buildDictIterClass("dict_reverseitemiterator", dict_itemiter_.prototype.tp$iternext, function (dict) {
    dict_reverse_iter_constructor.call(this, dict);
});

var dict_reverse_valueiter_ = buildDictIterClass("dict_reversevalueiterator", dict_valueiter_.prototype.tp$iternext, function (dict) {
    dict_reverse_iter_constructor.call(this, dict);
});



/**
 * Py2 methods
 * @private
 */
Sk.builtin.dict.py2$methods = {
    has_key: {
        $name: "has_key",
        $flags: { OneArg: true },
        $meth: function (k) {
            return new Sk.builtin.bool(this.sq$contains(k));
        },
        $doc: "D.has_key(k) -> True if D has a key k, else False",
    },
    keys: {
        $name: "keys",
        $meth: function () {
            return new Sk.builtin.list(this.sk$asarray());
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.keys() -> a set-like object providing a view on D's keys",
    },
    items: {
        $name: "items",
        $meth: function () {
            return new Sk.builtin.list(Object.values(this.entries).map((item) => new Sk.builtin.tuple([item.lhs, item.rhs])));
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.items() -> a set-like object providing a view on D's items",
    },
    values: {
        $name: "values",
        $meth: function () {
            return new Sk.builtin.list(Object.values(this.entries).map((item) => item.rhs));
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.values() -> an object providing a view on D's values",
    },
};
