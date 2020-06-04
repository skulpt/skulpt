function get_dict_hash(key) {
    let key_hash;
    if (key.$savedKeyHash_) {
        return key.$savedKeyHash_;
    }
    if (key.ob$type === Sk.builtin.str) {
        key_hash = "_" + key.$jsstr();
        key.$savedKeyHash_ = key_hash;
        return key_hash;
    }
    key_hash = "#_" + Sk.builtin.hash(key).v;
    key.$savedKeyHash_ = key_hash; // this is a base key hash
    return key_hash;
}

/**
 * @constructor
 * @param {Array} L
 *
 * @description
 * call with an array of key value pairs
 *
 */
Sk.builtin.dict = Sk.abstr.buildNativeClass("dict", {
    constructor: function dict(L) {
        // calling new Sk.builtin.dict is an internal method that requires an array of key value pairs
        if (L === undefined) {
            L = [];
        }
        Sk.asserts.assert(Array.isArray(L) && this instanceof Sk.builtin.dict);

        this.size = 0;
        this.buckets = {};
        this.base_hashes = {};
        for (let i = 0; i < L.length; i += 2) {
            this.set$item(L[i], L[i + 1]);
        }
    },
    slots: {
        tp$as_sequence_or_mapping: true,
        tp$hash: Sk.builtin.none.none$,
        tp$doc:
            "dict() -> new empty dictionary\ndict(mapping) -> new dictionary initialized from a mapping object's\n    (key, value) pairs\ndict(iterable) -> new dictionary initialized as if via:\n    d = {}\n    for k, v in iterable:\n        d[k] = v\ndict(**kwargs) -> new dictionary initialized with the name=value pairs\n    in the keyword argument list.  For example:  dict(one=1, two=2)",
        $r: function () {
            const ret = [];
            if (this.$entered_repr !== undefined) {
                // prevents recursively calling repr;
                return new Sk.builtin.str("{...}");
            }
            this.$entered_repr = true;
            // iterate over the keys - we don't use the dict iterator or mp$subscript here
            const buckets = this.buckets;
            let item, k, v;
            for (let key_hash in buckets) {
                item = buckets[key_hash];
                k = item.lhs;
                v = item.rhs;
                ret.push(Sk.misceval.objectRepr(k).v + ": " + Sk.misceval.objectRepr(v).v);
            }
            this.$entered_repr = undefined;
            return new Sk.builtin.str("{" + ret.join(", ") + "}");
        },
        tp$new: Sk.generic.new,
        tp$init: function (args, kwargs) {
            return this.update$common(args, kwargs, "dict");
        },
        tp$iter: function () {
            return new Sk.builtin.dict_iter_(this);
        },
        tp$richcompare: function (other, op) {
            let res;
            if (!(other instanceof Sk.builtin.dict)) {
                res = Sk.builtin.NotImplemented.NotImplemented$;
            } else if (op == "Eq" || op == "NotEq") {
                if (other === this) {
                    res = true;
                } else if (this.size !== other.size) {
                    res = false;
                } else {
                    let item, k, v, otherv;
                    const buckets = this.buckets;
                    for (let key_hash in buckets) {
                        item = buckets[key_hash];
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
                    res = res === undefined;
                }
                if (op == "NotEq") {
                    res = !res;
                }
            } else {
                res = Sk.builtin.NotImplemented.NotImplemented$;
            }
            return res;
        },
        // sequence or mapping slots
        sq$length: function () {
            return this.get$size();
        },
        sq$contains: function (ob) {
            return this.mp$lookup(ob) !== undefined;
        },
        mp$subscript: function (key) {
            const res = this.mp$lookup(key);
            if (res !== undefined) {
                // Found in dictionary
                return res;
            } else {
                // Not found in dictionary
                throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key).$jsstr());
            }
        },
        mp$ass_subscript: function (key, value) {
            if (value == null) {
                this.del$item(key);
            } else {
                this.set$item(key, value);
            }
            return Sk.builtin.none.none$;
        },
    },
    proto: {
        get$size: function () {
            // can't be overridden by subclasses so we use this for the dict key iterator
            return this.size;
        },
    },
    methods: {
        __reversed__: {
            $meth: function () {
                return new Sk.builtin.dict_reverse_iter_(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Return a reverse iterator over the dict keys.",
        },
        get: {
            $meth: function (k, d) {
                if (d === undefined) {
                    d = Sk.builtin.none.none$;
                }
                let ret = this.mp$lookup(k);
                if (ret === undefined) {
                    ret = d;
                }
                return ret;
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($self, key, default=None, /)",
            $doc: "Return the value for key if key is in the dictionary, else default.",
        },
        setdefault: {
            $meth: function (key, default_) {
                const res = this.mp$lookup(key);
                if (res !== undefined) {
                    return res;
                }
                default_ = default_ || Sk.builtin.none.none$;
                this.set$item(key, default_);
                return default_;
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($self, key, default=None, /)",
            $doc:
                "Insert key with a value of default if key is not in the dictionary.\n\nReturn the value for key if key is in the dictionary, else default.",
        },
        pop: {
            $meth: function (key, d) {
                const hash = get_dict_hash(key);
                let item, value, s;
                if (hash[0] === "_") {
                    item = this.buckets[hash];
                    if (item !== undefined) {
                        value = item.rhs;
                        delete this.buckets[hash];
                    }
                } else {
                    item = this.pop$item_from_base_hash(key, hash);
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
                throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(s).$jsstr());
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
                const all_key_hashes = Object.keys(this.buckets);
                const youngest_key_hash = all_key_hashes[all_key_hashes.length - 1];
                const key = youngest_key_hash.lhs;
                const val = this.pop.$meth.call(this, key, Sk.builtin.none.none$);
                return new Sk.builtin.tuple([key, val]);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.popitem() -> (k, v), remove and return some (key, value) pair as a\n2-tuple; but raise KeyError if D is empty.",
        },
        /* keys items values are defined later when we switch versions */

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
                this.buckets = {};
                this.base_hashes = {};
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
});

Sk.exportSymbol("Sk.builtin.dict", Sk.builtin.dict);

/**
 * 
 * this is effectively a builtin staticmethod for dict
 * We create this separately
 * 
 */
Sk.builtin.dict.prototype.fromkeys = new Sk.builtin.sk_method({
    $name: "fromkeys",
    $flags: {MinArgs: 1, MaxArgs: 2},
    $textsig: "($type, iterable, value=None, /)",
    $meth: function fromkeys(seq, value) {
        const keys = Sk.abstr.arrayFromIterable(seq);
        const dict = new Sk.builtin.dict([]);
        value = value || Sk.builtin.none.none$;
        for (let i = 0; i<keys.length; i++) {
            dict.set$item(keys[i], value);
        }
        return dict;
    },
    $doc: "Create a new dictionary with keys from iterable and values set to value.",
}, Sk.builtin.dict);

/**
 * NB:
 * We could put the following methods on the proto in the above object literal
 * but they're quite long so we keep them below for readability
 *
 */

/**
 *
 * @function
 * @returns {Array} dict keys as an array
 *
 * @description
 * get the keys as an array - used internally for certain methods.
 */
Sk.builtin.dict.prototype.sk$asarray = function () {
    const buckets = this.buckets;
    const keys = [];
    for (let hash in buckets) {
        keys.push(buckets[hash].lhs);
    }
    return keys;
};

/**
 * @function
 * @param {Sk.builtin.object} key - key to get item for
 * @param {String} base_hash - base_hash from the key
 *
 * @description
 * fast call - if we have a str then we can guarantee that it's in the bucket
 * so we compare strings quickly rather than reaching out to richcompareBool
 *
 * @return the item if found or undefined if not found
 */
Sk.builtin.dict.prototype.get$item_from_base_hash = function (key, base_hash) {
    const base_hash_keys = this.base_hashes[base_hash];
    let stored_key;
    if (base_hash_keys === undefined) {
        return;
    }
    for (let i = 0; i < base_hash_keys.length; i++) {
        stored_key = base_hash_keys[i];
        if (stored_key === undefined) {
            continue;
        }
        if (stored_key === key || Sk.misceval.richCompareBool(key, stored_key, "Eq")) {
            return this.buckets["#" + i + base_hash.slice(1)];
        }
    }
    return;
};

/**
 * @function
 * @param {Sk.builtin.object} key
 * @param {String} base_hash
 *
 * @return undefined if no key was found
 * or the item if the key was in the bucket
 * also removes the item from buckets
 */
Sk.builtin.dict.prototype.pop$item_from_base_hash = function (key, base_hash) {
    const base_hash_keys = this.base_hashes[base_hash];
    let stored_key, item;
    if (base_hash_keys === undefined) {
        return undefined;
    }
    for (let i = 0; i < base_hash_keys.length; i++) {
        stored_key = base_hash_keys[i];
        if (stored_key === undefined) {
            continue;
        }
        if (stored_key === key || Sk.misceval.richCompareBool(key, stored_key, "Eq")) {
            const key_hash = "#" + i + base_hash.slice(1);
            item = this.buckets[key_hash];
            delete this.buckets[key_hash];
            base_hash_keys[i] = undefined;
            return item;
        }
    }
    return;
};

/**
 * @function
 * @param {Sk.builtin.object} key
 * @param {String} base_hash
 *
 * @description
 * given a key and a base_hash will find a free slot or append to the list of slots for a given base_hash
 * then will set the item in the buckets and return the item
 * Note this should only be called and immediately preceded by assigning the value to the rhs
 *
 * @return item {lhs: key}
 */
Sk.builtin.dict.prototype.insert$item_from_base_hash = function (key, base_hash) {
    let key_hash,
        base_hash_keys = this.base_hashes[base_hash];
    if (base_hash_keys === undefined) {
        base_hash_keys = this.base_hashes[base_hash] = [];
        key_hash = "#" + 0 + base_hash.slice(1);
        base_hash_keys.push(key);
    } else {
        // we might have a freeslot from deleting an item
        const free_slot = base_hash_keys.indexOf(undefined);
        if (free_slot !== -1) {
            key_hash = "#" + free_slot + base_hash.slice(1);
            base_hash_keys[free_slot] = key;
        } else {
            key_hash = "#" + base_hash_keys.length + base_hash.slice(1);
            base_hash_keys.push(key);
        }
    }
    const item = (this.buckets[key_hash] = { lhs: key });
    return item;
};

/**
 * @function
 * @param {Sk.builtin.object} key - want to check if the key is inside the dict
 *
 * @return undefined if no key was found
 * or the item.rhs (value) if the key was found
 */
Sk.builtin.dict.prototype.mp$lookup = function (key) {
    let item;
    const hash = get_dict_hash(key);
    if (hash[0] === "_") {
        item = this.buckets[hash];
    } else {
        // then we have a base hash so this is non string;
        item = this.get$item_from_base_hash(key, hash);
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
 * @param {Sk.builtin.dict} dict or dictlike object (anything with a keys method)
 *
 * @description
 * this function mimics the cpython implementation, which is also the reason for the
 * almost similar code, this may be changed in future
 *
 * Note we don't use mp$ass_subscript since that slot might be overridden by a subclass
 * Instead we use this.set$item which is the dict implementation of mp$ass_subscript
 */
Sk.builtin.dict.prototype.dict$merge = function (b) {
    // we don't use mp$ass_subscript incase a subclass overrides __setitem__ we just ignore that like Cpython does
    // so use this.set$item instead which can't be overridden by a subclass
    let k, v, item;
    if (b.tp$iter === Sk.builtin.dict.prototype.tp$iter) {
        // fast way used
        const buckets = b.buckets;
        for (let key_hash in buckets) {
            item = buckets[key_hash];
            k = item.lhs;
            v = item.rhs;
            this.set$item(k, v);
        }
        return;
    } else {
        // generic slower way for a subclass that has overriden the tp$iter method
        // we'll just assume prototypical inheritance here! and sort of support suspensions
        const keys = Sk.misceval.callsimArray(b.keys, [b]);
        const self = this;
        return Sk.misceval.iterFor(Sk.abstr.iter(keys), (key) => {
            v = b.mp$subscript(key); // get value (no suspension for keylookup... todo?)
            if (v === undefined) {
                throw new Sk.builtin.AttributeError("cannot get item for key: " + Sk.misceval.objectRepr(key).$jsstr());
            }
            self.set$item(key, v);
        });
    }
};

/**
 * @function
 *
 * @param {Array} args
 * @param {Array} kwargs
 * @param {String} func_name for error messages
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
 * otherwise call dict$merge_from_seq
 *
 * finally put the kwargs in the dict.
 *
 */
Sk.builtin.dict.prototype.update$common = function (args, kwargs, func_name) {
    Sk.abstr.checkArgsLen(func_name, args, 0, 1);
    const arg = args[0];
    const self = this;
    let ret;
    if (arg !== undefined) {
        if (arg instanceof Sk.builtin.dict) {
            ret = this.dict$merge(arg);
        } else if (Sk.abstr.lookupSpecial(arg, "keys") !== undefined) {
            ret = this.dict$merge(arg);
        } else {
            ret = this.dict$merge_from_seq(arg);
        }
    }
    return Sk.misceval.chain(ret, () => {
        if (kwargs) {
            for (let i = 0; i < kwargs.length; i += 2) {
                self.set$item(new Sk.builtin.str(kwargs[i]), kwargs[i + 1]);
            }
        }
        return Sk.builtin.none.none$;
    });
};

/**
 * @function
 *
 * @param {Array} args
 *
 * @description
 * iterate over a sequence like object
 * check the next value has length 2
 * and then set the key value pair in
 *
 */
Sk.builtin.dict.prototype.dict$merge_from_seq = function (arg) {
    let idx = 0;
    const self = this;
    return Sk.misceval.iterFor(Sk.abstr.iter(arg), (i) => {
        try {
            // this should really just be a tuple/list of length 2 so no suspension to get the sequence
            const seq = Sk.abstr.arrayFromIterable(i);
            if (seq.length !== 2) {
                throw new Sk.builtin.ValueError("dictionary update sequence element #" + idx + " has length " + seq.length + "; 2 is required");
            }
            self.set$item(seq[0], seq[1]);
        } catch (e) {
            if (e instanceof Sk.builtin.TypeError) {
                throw new Sk.builtin.TypeError("cannot convert dictionary update sequence element #" + idx + " to a sequence");
            } else {
                throw e;
            }
        }
        idx++;
    });
};

/**
 * @function
 *
 * @param {Sk.builtin.object} key
 * @param {Sk.builtin.object} value
 *
 * @description
 * sets the item from a key, value
 *
 */
Sk.builtin.dict.prototype.set$item = function (key, value) {
    const hash = get_dict_hash(key);
    if (hash[0] === "_") {
        // we have a string so pass it to the dictionary
        if (this.buckets[hash] === undefined) {
            this.size += 1;
            this.buckets[hash] = { lhs: key };
        }
        this.buckets[hash].rhs = value;
        return;
    }
    let item = this.get$item_from_base_hash(key, hash);
    if (item === undefined) {
        item = this.insert$item_from_base_hash(key, hash);
        this.size += 1;
    }
    item.rhs = value;
    return;
};

/**
 * @function
 *
 * @param {Sk.builtin.object} key
 *
 * @description
 * deletes an item in the dictionary
 *
 */
Sk.builtin.dict.prototype.del$item = function (key) {
    const hash = get_dict_hash(key);
    let item;
    if (hash[0] === "_") {
        item = this.buckets[hash];
        delete this.buckets[hash];
    } else {
        item = this.pop$item_from_base_hash(key, hash);
    }
    if (item !== undefined) {
        this.size -= 1;
        return;
    }
    // Not found in dictionary
    throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key).$jsstr());
};

/**
 * Py3 and Py2 dict views are different
 * Py2 just returns a List object
 */

Sk.builtin.dict.py3_dictviews = {
    keys: {
        $meth: function () {
            return new Sk.builtin.dict_keys(this);
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.keys() -> a set-like object providing a view on D's keys",
    },
    items: {
        $meth: function () {
            return new Sk.builtin.dict_items(this);
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.items() -> a set-like object providing a view on D's items",
    },
    values: {
        $meth: function () {
            return new Sk.builtin.dict_values(this);
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.values() -> an object providing a view on D's values",
    },
};

Sk.builtin.dict.py2_dictviews = {
    keys: {
        $meth: function () {
            return new Sk.builtin.list(this.sk$asarray());
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.keys() -> a set-like object providing a view on D's keys",
    },
    items: {
        $meth: function () {
            const L = [];
            const buckets = this.buckets;
            let item;
            for (let key_hash in buckets) {
                item = buckets[key_hash];
                L.push(new Sk.builtin.tuple([item.lhs, item.rhs]));
            }
            return new Sk.builtin.list(L);
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.items() -> a set-like object providing a view on D's items",
    },
    values: {
        $meth: function () {
            const L = [];
            const buckets = this.buckets;
            for (let key_hash in buckets) {
                L.push(buckets[key_hash].rhs);
            }
            return new Sk.builtin.list(L);
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.values() -> an object providing a view on D's values",
    },
};

Sk.setupDictIterators = function (python3) {
    const dict = Sk.builtin.dict;
    const proto = dict.prototype;
    let dict_view, dict_views;
    if (python3) {
        dict_views = dict.py3_dictviews;
        for (let dict_view_name in dict_views) {
            dict_view = dict_views[dict_view_name];
            dict_view.$name = dict_view_name;
            proto[dict_view_name] = new Sk.builtin.method_descriptor(dict, dict_view);
        }
        delete proto.haskey$;
    } else {
        dict_views = dict.py2_dictviews;
        for (let dict_view_name in dict_views) {
            dict_view = dict_views[dict_view_name];
            dict_view.$name = dict_view_name;
            proto[dict_view_name] = new Sk.builtin.method_descriptor(dict, dict_view);
        }
        proto.has_key = new Sk.builtin.method_descriptor(dict, proto.haskey$);
    }
};

/**
 * Py2 methods
 */

Sk.builtin.dict.prototype.haskey$ = {
    $name: "has_key",
    $flags: {OneArg: true},
    $meth: function (k) {
        return new Sk.builtin.bool(this.sq$contains(k));
    },
    $doc: "D.has_key(k) -> True if D has a key k, else False",
};
