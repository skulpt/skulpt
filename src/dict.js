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
        this.entries = {};
        this.buckets = {};
        for (let i = 0; i < L.length; i += 2) {
            this.set$item(L[i], L[i + 1]);
        }
    },
    slots: /**@lends {Sk.builtin.dict.prototype}*/ {
        tp$getattr: Sk.generic.getAttr,
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
            const entries = this.entries;
            let item, k, v;
            for (let key_hash in entries) {
                item = entries[key_hash];
                k = item.lhs;
                v = item.rhs;
                ret.push(Sk.misceval.objectRepr(k) + ": " + Sk.misceval.objectRepr(v));
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
                    const entries = this.entries;
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
                throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key));
            }
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
        get_dict_hash: function get_dict_hash(key) {
            if (key.$savedKeyHash_ !== undefined) {
                return key.$savedKeyHash_;
            }
            let key_hash;
            if (key.ob$type === Sk.builtin.str) {
                key_hash = "_" + key.$jsstr();
                key.$savedKeyHash_ = key_hash;
                return key_hash;
            }
            key_hash = "#_" + Sk.builtin.hash(key).v;
            key.$savedKeyHash_ = key_hash; // this is a base key hash
            return key_hash;
        },
    },
    methods: /**@lends {Sk.builtin.dict.prototype}*/ {
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
                const hash = this.get_dict_hash(key);
                let item, value, s;
                if (hash[0] === "_") {
                    item = this.entries[hash];
                    if (item !== undefined) {
                        value = item.rhs;
                        delete this.entries[hash];
                    }
                } else {
                    item = this.pop$item_from_bucket(key, hash);
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
                throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key));
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
                const all_key_hashes = Object.keys(this.entries);
                const youngest_key_hash = all_key_hashes[all_key_hashes.length - 1];
                const key = this.entries[youngest_key_hash].lhs;
                const val = this.pop.$meth.call(this, key, Sk.builtin.none.none$);
                return new Sk.builtin.tuple([key, val]);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.popitem() -> (k, v), remove and return some (key, value) pair as a\n2-tuple; but raise KeyError if D is empty.",
        },
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
                this.entries = {};
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
                const keys = Sk.misceval.arrayFromIterable(seq);
                const dict = new Sk.builtin.dict([]);
                value = value || Sk.builtin.none.none$;
                for (let i = 0; i < keys.length; i++) {
                    dict.set$item(keys[i], value);
                }
                return dict;
            },
            $doc: "Create a new dictionary with keys from iterable and values set to value.",
        },
    },
});

Sk.exportSymbol("Sk.builtin.dict", Sk.builtin.dict);

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
 *
 * @function
 * @returns {Array} dict keys as an array
 *
 * @description
 * get the keys as an array - used internally for certain methods.
 * @private
 */
Sk.builtin.dict.prototype.sk$asarray = function () {
    const entries = this.entries;
    const keys = [];
    for (let hash in entries) {
        keys.push(entries[hash].lhs);
    }
    return keys;
};

/**
 * @function
 * @param {pyObject} key - key to get item for
 * @param {string} base_hash - base_hash from the key
 *
 * @description
 * fast call - if we have a str then we can guarantee that it's in the bucket
 * so we compare strings quickly rather than reaching out to richcompareBool
 *
 * @return {pyObject|undefined} the item if found or undefined if not found
 * @private
 */
Sk.builtin.dict.prototype.get$item_from_bucket = function (key, base_hash) {
    const bucket = this.buckets[base_hash];
    let stored_key, item;
    if (bucket === undefined) {
        return;
    }
    for (let i = 0; i < bucket.length; i++) {
        item = bucket[i];
        if (item === undefined) {
            continue;
        }
        stored_key = item.lhs;
        if (stored_key === key || Sk.misceval.richCompareBool(key, stored_key, "Eq")) {
            return item;
        }
    }
    return;
};

/**
 * @function
 * @param {pyObject} key
 * @param {string} base_hash
 *
 * @return undefined if no key was found
 * or the item if the key was in the bucket
 * also removes the item from entries
 * @private
 */
Sk.builtin.dict.prototype.pop$item_from_bucket = function (key, base_hash) {
    const bucket = this.buckets[base_hash];
    let stored_key, item;
    if (bucket === undefined) {
        return undefined;
    }
    for (let i = 0; i < bucket.length; i++) {
        item = bucket[i];
        if (item === undefined) {
            continue;
        }
        stored_key = item.lhs;
        if (stored_key === key || Sk.misceval.richCompareBool(key, stored_key, "Eq")) {
            const key_hash = "#" + i + base_hash.slice(1);
            delete this.entries[key_hash];
            bucket[i] = undefined;
            return item;
        }
    }
    return;
};

/**
 * @function
 * @param {Sk.builtin.object} key
 * @param {Sk.builtin.object} value
 * @param {string} base_hash
 *
 * @description
 * given a key and a base_hash will find a free slot or append to the list of slots for a given base_hash
 * then will set the item in the entries and return the item
 * Note this should only be called and immediately preceded by assigning the value to the rhs
 *
 * @return {{lhs: Sk.builtin.object, rhs: Sk.builtin.object}}
 * @private
 */
Sk.builtin.dict.prototype.insert$item_from_bucket = function (key, value, base_hash) {
    let key_hash,
        bucket = this.buckets[base_hash];
    const item = { lhs: key, rhs: value };
    if (bucket === undefined) {
        bucket = this.buckets[base_hash] = [];
        key_hash = "#" + 0 + base_hash.slice(1);
        bucket.push(item);
    } else {
        // we might have a freeslot from deleting an item
        const free_slot = bucket.indexOf(undefined);
        if (free_slot !== -1) {
            key_hash = "#" + free_slot + base_hash.slice(1);
            bucket[free_slot] = item;
        } else {
            key_hash = "#" + bucket.length + base_hash.slice(1);
            bucket.push(item);
        }
    }
    this.entries[key_hash] = item;
    return item;
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
    const hash = this.get_dict_hash(key);
    if (hash[0] === "_") {
        item = this.entries[hash];
    } else {
        // then we have a base hash so this is non string;
        item = this.get$item_from_bucket(key, hash);
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
    let k, v, item;
    if (b.tp$iter === Sk.builtin.dict.prototype.tp$iter) {
        // fast way used
        const entries = b.entries;
        for (let key_hash in entries) {
            item = entries[key_hash];
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
                throw new Sk.builtin.AttributeError("cannot get item for key: " + Sk.misceval.objectRepr(key));
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
 * otherwise call dict$merge_from_seq
 *
 * finally put the kwargs in the dict.
 * @private
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
        } else if (Sk.abstr.lookupSpecial(arg, new Sk.builtin.str("keys")) !== undefined) {
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
 * @param {pyObject} arg
 *
 * @description
 * iterate over a sequence like object
 * check the next value has length 2
 * and then set the key value pair in
 * @private
 *
 */
Sk.builtin.dict.prototype.dict$merge_from_seq = function (arg) {
    let idx = 0;
    const self = this;
    return Sk.misceval.iterFor(Sk.abstr.iter(arg), (i) => {
        try {
            // this should really just be a tuple/list of length 2 so no suspension to get the sequence
            const seq = Sk.misceval.arrayFromIterable(i);
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
 * @param {pyObject} key should be a python object
 * @param {pyObject} value
 *
 * @description
 * sets the item from a key, value
 * @private
 *
 */
Sk.builtin.dict.prototype.set$item = function (key, value) {
    const hash = this.get_dict_hash(key);
    let item;
    if (hash[0] === "_") {
        // we have a string so pass it to the dictionary
        item = this.entries[hash];
        if (item === undefined) {
            this.size += 1;
            item = this.entries[hash] = { lhs: key, rhs: undefined };
        }
        item.rhs = value;
        return;
    }
    item = this.get$item_from_bucket(key, hash);
    if (item === undefined) {
        item = this.insert$item_from_bucket(key, value, hash);
        this.size += 1;
    } else {
        item.rhs = value;
    }
    return;
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
    const hash = this.get_dict_hash(key);
    let item;
    if (hash[0] === "_") {
        item = this.entries[hash];
        delete this.entries[hash];
    } else {
        item = this.pop$item_from_bucket(key, hash);
    }
    if (item !== undefined) {
        this.size -= 1;
        return;
    }
    // Not found in dictionary
    throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key));
};

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
            const L = [];
            const entries = this.entries;
            let item;
            for (let key_hash in entries) {
                item = entries[key_hash];
                L.push(new Sk.builtin.tuple([item.lhs, item.rhs]));
            }
            return new Sk.builtin.list(L);
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.items() -> a set-like object providing a view on D's items",
    },
    values: {
        $name: "values",
        $meth: function () {
            const L = [];
            const entries = this.entries;
            for (let key_hash in entries) {
                L.push(entries[key_hash].rhs);
            }
            return new Sk.builtin.list(L);
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.values() -> an object providing a view on D's values",
    },
};
