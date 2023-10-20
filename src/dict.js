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
 * To subclass from a dict in javascript you need to implement
 * mp$lookup
 * dict$setItem
 * dict$clear
 * pop$item
 * dict$copy
 * get$size
 * $items
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
            this.dict$setItem(L[i], L[i + 1]);
        }
        this.in$repr = false;
        this.$version = 0; // change version number anytime the keys change
    },
    slots: /**@lends {Sk.builtin.dict.prototype}*/ {
        tp$getattr: Sk.generic.getAttr,
        tp$as_sequence_or_mapping: true,
        tp$as_number: true,
        tp$hash: Sk.builtin.none.none$,
        tp$doc:
            "dict() -> new empty dictionary\ndict(mapping) -> new dictionary initialized from a mapping object's\n    (key, value) pairs\ndict(iterable) -> new dictionary initialized as if via:\n    d = {}\n    for k, v in iterable:\n        d[k] = v\ndict(**kwargs) -> new dictionary initialized with the name=value pairs\n    in the keyword argument list.  For example:  dict(one=1, two=2)",
        $r() {
            if (this.in$repr) {
                // prevents recursively calling repr;
                return new Sk.builtin.str("{...}");
            }
            this.in$repr = true;
            // iterate over the keys - we don't use the dict iterator or mp$subscript here
            const ret = this.$items().map(([key, val]) => Sk.misceval.objectRepr(key) + ": " + Sk.misceval.objectRepr(val));
            this.in$repr = false;
            return new Sk.builtin.str("{" + ret.join(", ") + "}");
        },
        tp$new: Sk.generic.new,
        tp$init(args, kwargs) {
            return this.update$common(args, kwargs, "dict");
        },
        tp$iter() {
            return new dict_iter_(this);
        },
        tp$richcompare(other, op) {
            let res;
            if (!(other instanceof Sk.builtin.dict) || (op !== "Eq" && op !== "NotEq")) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            if (other === this) {
                res = true;
            } else if (this.size !== other.size) {
                res = false;
            } else {
                let otherv;
                res = this.$items().every(([key, val]) => {
                    otherv = other.mp$lookup(key);
                    return otherv !== undefined && (otherv === val || Sk.misceval.richCompareBool(val, otherv, "Eq"));
                });
            }
            return op === "Eq" ? res : !res;
        },
        // as number slot
        nb$or(other) {
            if (!(other instanceof Sk.builtin.dict)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            const dict = this.dict$copy();
            dict.dict$merge(other);
            return dict;
        },
        nb$reflected_or(other) {
            if (!(other instanceof Sk.builtin.dict)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            // dict or is not commutative so must define reflected slot here.
            const dict = other.dict$copy();
            dict.dict$merge(this);
            return dict;
        },
        nb$inplace_or(other) {
            return Sk.misceval.chain(this.update$onearg(other), () => this);
        },
        // sequence or mapping slots
        sq$length() {
            return this.get$size();
        },
        sq$contains(ob) {
            return this.mp$lookup(ob) !== undefined;
        },
        mp$subscript(key, canSuspend) {
            const res = this.mp$lookup(key);
            if (res !== undefined) {
                // Found in dictionary
                return res;
            }
            let missing = Sk.abstr.lookupSpecial(this, Sk.builtin.str.$missing);
            if (missing !== undefined) {
                const ret = Sk.misceval.callsimOrSuspendArray(missing, [key]);
                return canSuspend ? ret : Sk.misceval.retryOptionalSuspensionOrThrow(ret);
            }
            throw new Sk.builtin.KeyError(key);
        },
        mp$ass_subscript(key, value) {
            if (value === undefined) {
                const err = this.dict$delItem(key);
                if (err) {
                    throw err;
                }
            } else {
                this.dict$setItem(key, value);
            }
        },
    },
    methods: /**@lends {Sk.builtin.dict.prototype}*/ {
        __reversed__: {
            $meth() {
                return new dict_reverse_iter_(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "Return a reverse iterator over the dict keys.",
        },
        get: {
            $meth(key, d) {
                return this.mp$lookup(key) || d || Sk.builtin.none.none$;
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($self, key, default=None, /)",
            $doc: "Return the value for key if key is in the dictionary, else default.",
        },
        setdefault: {
            $meth(key, default_) {
                if (this.ob$type !== Sk.builtin.dict) {
                    let rv = this.mp$lookup(key);
                    if (rv !== undefined) {
                        return rv;
                    }
                    default_ || (default_ = Sk.builtin.none.none$);
                    this.dict$setItem(key, default_);
                    return default_;
                } else {
                    // logic could be simpler here but some tests dictate we can't do too many lookups
                    let item;
                    const hash = getHash(key);
                    item = typeof hash === "string" ? this.entries[hash] : this.get$bucket_item(key, hash);
                    if (item !== undefined) {
                        return item[1];
                    }
                    default_ || (default_ = Sk.builtin.none.none$);
                    if (typeof hash === "string") {
                        this.entries[hash] = [key, default_];
                    } else {
                        this.set$bucket_item(key, default_, hash);
                    }
                    this.size++;
                    this.$version++;
                    return default_;
                }
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($self, key, default=None, /)",
            $doc:
                "Insert key with a value of default if key is not in the dictionary.\n\nReturn the value for key if key is in the dictionary, else default.",
        },
        pop: {
            $meth(key, d) {
                const item = this.pop$item(key);
                if (item !== undefined) {
                    return item[1];
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
            $meth() {
                // not particularly efficent but we get allkeys as an array to iter anyway
                const size = this.get$size();
                if (size === 0) {
                    throw new Sk.builtin.KeyError("popitem(): dictionary is empty");
                }
                const [key, val] = this.$items()[size - 1];
                this.pop$item(key);
                return new Sk.builtin.tuple([key, val]);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.popitem() -> (k, v), remove and return some (key, value) pair as a\n2-tuple; but raise KeyError if D is empty.",
        },
        keys: {
            $meth() {
                return new dict_keys(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.keys() -> a set-like object providing a view on D's keys",
        },
        items: {
            $meth() {
                return new dict_items(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.items() -> a set-like object providing a view on D's items",
        },
        values: {
            $meth() {
                return new dict_values(this);
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.values() -> an object providing a view on D's values",
        },
        update: {
            $meth(args, kwargs) {
                return Sk.misceval.chain(this.update$common(args, kwargs, "update"), () => Sk.builtin.none.none$);
            },
            $flags: { FastCall: true },
            $textsig: null,
            $doc:
                "D.update([E, ]**F) -> None.  Update D from dict/iterable E and F.\nIf E is present and has a .keys() method, then does:  for k in E: D[k] = E[k]\nIf E is present and lacks a .keys() method, then does:  for k, v in E: D[k] = v\nIn either case, this is followed by: for k in F:  D[k] = F[k]",
        },
        clear: {
            $meth() {
                this.dict$clear();
                return Sk.builtin.none.none$;
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.clear() -> None.  Remove all items from D.",
        },
        copy: {
            $meth() {
                return this.dict$copy();
            },
            $flags: { NoArgs: true },
            $textsig: null,
            $doc: "D.copy() -> a shallow copy of D",
        },
    },
    classmethods: /**@lends {Sk.builtin.dict.prototype}*/ Object.assign({
        fromkeys: {
            $meth: function fromkeys(seq, value) {
                value = value || Sk.builtin.none.none$;
                let dict = this === Sk.builtin.dict ? new this() : this.tp$call([], []);
                return Sk.misceval.chain(
                    dict,
                    (d) => {
                        dict = d;
                        return Sk.misceval.iterFor(Sk.abstr.iter(seq), (key) => {
                            return dict.mp$ass_subscript(key, value, true);
                        });
                    },
                    () => dict
                );
            },
            $flags: { MinArgs: 1, MaxArgs: 2 },
            $textsig: "($type, iterable, value=None, /)",
            $doc: "Create a new dictionary with keys from iterable and values set to value.",
        },
    }, Sk.generic.classGetItem),
    proto: /**@lends {Sk.builtin.dict.prototype}*/ {
        quick$lookup,
        mp$lookup,
        get$size() {
            // can't be overridden by subclasses so we use this for the dict key iterator
            return this.size;
        },
        sk$asarray() {
            return this.$items().map((item) => item[0]);
        },
        update$common,
        update$onearg(arg) {
            if (arg instanceof Sk.builtin.dict || Sk.abstr.lookupSpecial(arg, Sk.builtin.str.$keys) !== undefined) {
                return this.dict$merge(arg);
            } else {
                return this.dict$merge_seq(arg);
            }
        },
        dict$copy() {
            const newCopy = new Sk.builtin.dict([]);
            newCopy.size = this.size;
            const entries = Object.entries(this.entries); // do it this way for mappingproxy
            for (let i in entries) {
                const key = entries[i][0];
                const item = entries[i][1];
                newCopy.entries[key] = [item[0], item[1]];
            }
            let bucket, this_bucket;
            for (let i in this.buckets) {
                this_bucket = this.buckets[i];
                newCopy.buckets[i] = bucket = [];
                for (let j = 0; j < this_bucket.length; j++) {
                    bucket.push(newCopy.entries["#" + i + "_" + j]);
                }
            }
            return newCopy;
        },
        $items() {
            return Object.values(this.entries);
        },
        dict$clear() {
            this.size = 0;
            this.$version++;
            this.entries = Object.create(null);
            this.buckets = {};
        },
        dict$setItem,
        dict$delItem,
        get$bucket_item,
        pop$bucket_item,
        set$bucket_item,
        pop$item,
        dict$merge,
        dict$merge_seq,
    },
});

function getHash(key) {
    let key_hash = key.$savedKeyHash;
    if (key_hash !== undefined) {
        return key_hash;
    }
    key_hash = Sk.abstr.objectHash(key);
    return key_hash;
}

/**
 * @private
 * @param {Sk.builtin.str} pyName
 * @this {Sk.builtin.dict}
 * 
 * this is hot code!
 */
function quick$lookup(pyName) {
    /**@type {string} */
    var key_hash = pyName.$savedKeyHash;
    var item = this.entries[key_hash];
    if (item !== undefined) {
        return item[1];
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
function get$bucket_item(key, hash_value) {
    const bucket = this.buckets[hash_value];
    if (bucket === undefined) {
        return;
    }
    let item;
    for (let i = 0; i < bucket.length; i++) {
        item = bucket[i];
        if (item === undefined) {
            continue;
        }
        if (item[0] === key || Sk.misceval.richCompareBool(key, item[0], "Eq")) {
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
function pop$bucket_item(key, hash_value) {
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
        if (item[0] === key || Sk.misceval.richCompareBool(key, item[0], "Eq")) {
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
 * @private
 */
function set$bucket_item(key, value, hash_value) {
    let key_hash,
        bucket = this.buckets[hash_value];
    const item = [key, value];
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
 * or the item[1] (value) if the key was found
 * @private
 */
function mp$lookup(key) {
    let item;
    const hash = getHash(key);
    if (typeof hash === "string") {
        item = this.entries[hash];
    } else {
        // then we have a base hash so this is non string;
        item = this.get$bucket_item(key, hash);
    }
    if (item !== undefined) {
        return item[1];
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
 * Instead we use this.dict$setItem which is the dict implementation of mp$ass_subscript
 * @private
 */
function dict$merge(b) {
    // we don't use mp$ass_subscript incase a subclass overrides __setitem__ we just ignore that like Cpython does
    // so use this.dict$setItem instead which can't be overridden by a subclass
    if (b.tp$iter === Sk.builtin.dict.prototype.tp$iter) {
        // fast way used
        const keys = b.tp$iter();
        for (let key = keys.tp$iternext(); key !== undefined; key = keys.tp$iternext()) {
            const v = b.mp$subscript(key);
            this.dict$setItem(key, v);
        }
    } else {
        // generic slower way for a subclass that has overriden the tp$iter method
        // or other mapping types like mapping proxy
        const keyfunc = Sk.abstr.lookupSpecial(b, Sk.builtin.str.$keys);
        if (keyfunc === undefined) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(b) + "' object is not a mapping");
        }

        return Sk.misceval.chain(Sk.misceval.callsimOrSuspendArray(keyfunc), (keys) =>
            Sk.misceval.iterFor(Sk.abstr.iter(keys), (key) =>
                Sk.misceval.chain(Sk.abstr.objectGetItem(b, key, true), (v) => {
                    this.dict$setItem(key, v);
                })
            )
        );
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
 * otherwise call dict$merge_seq
 *
 * finally put the kwargs in the dict.
 * @private
 *
 */
function update$common(args, kwargs, func_name) {
    Sk.abstr.checkArgsLen(func_name, args, 0, 1);
    const arg = args[0];
    let ret;
    if (arg !== undefined) {
        ret = this.update$onearg(arg);
    }
    return Sk.misceval.chain(ret, () => {
        if (kwargs) {
            for (let i = 0; i < kwargs.length; i += 2) {
                this.dict$setItem(new Sk.builtin.str(kwargs[i]), kwargs[i + 1]);
            }
        }
        return;
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
function dict$merge_seq(arg) {
    let idx = 0;
    return Sk.misceval.iterFor(Sk.abstr.iter(arg), (i) => {
        if (!Sk.builtin.checkIterable(i)) {
            throw new Sk.builtin.TypeError("cannot convert dictionary update sequence element #" + idx + " to a sequence");
        }
        const seq = Sk.misceval.arrayFromIterable(i);
        if (seq.length !== 2) {
            throw new Sk.builtin.ValueError("dictionary update sequence element #" + idx + " has length " + seq.length + "; 2 is required");
        }
        this.dict$setItem(seq[0], seq[1]);
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
function dict$setItem(key, value) {
    const hash = getHash(key);
    let item;
    if (typeof hash === "string") {
        // we have a string so pass it to the dictionary
        item = this.entries[hash];
        if (item === undefined) {
            this.entries[hash] = [key, value];
            this.size++;
            this.$version++;
        } else {
            item[1] = value;
        }
    } else {
        item = this.get$bucket_item(key, hash);
        if (item === undefined) {
            this.set$bucket_item(key, value, hash);
            this.size++;
            this.$version++;
        } else {
            item[1] = value;
        }
    }
};

/** means we don't need to wrap in a try/except for genericSetAttr */
function dict$delItem(key) {
    const item = this.pop$item(key);
    if (item === undefined) {
        return new Sk.builtin.KeyError(key);
    }
}

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
function pop$item(key) {
    const hash = getHash(key);
    let item;
    if (typeof hash === "string") {
        item = this.entries[hash];
        delete this.entries[hash];
    } else {
        item = this.pop$bucket_item(key, hash);
    }
    if (item !== undefined) {
        this.size--;
        this.$version++;
        return item;
    }
    // Not found in dictionary
    return undefined;
};


/******** Start of Dict Views ********/

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
    $r() {
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
    tp$richcompare(other, op) {
        if (!(Sk.builtin.checkAnySet(other) || checkAnyView(other))) {
            return Sk.builtin.NotImplemented.NotImplemented$;
        }
        const len_self = this.sq$length();
        const len_other = other.sq$length();
        switch (op) {
            case "NotEq":
            case "Eq":
                let res;
                if (this === other) {
                    res = true;
                } else if (len_self === len_other) {
                    res = all_contained_in(this, other);
                }
                return op === "NotEq" ? !res : res;
            case "Lt":
                return len_self < len_other && all_contained_in(this, other);
            case "LtE":
                return len_self <= len_other && all_contained_in(this, other);
            case "Gt":
                return len_self > len_other && all_contained_in(other, this);
            case "GtE":
                return len_self >= len_other && all_contained_in(other, this);
        }
    },
    nb$subtract(other) {
        const set = as_set(this);
        return set.difference.$meth.call(set, other);
    },
    nb$and(other) {
        const set = as_set(this);
        return set.intersection.$meth.call(set, other);
    },
    nb$or(other) {
        const set = as_set(this);
        return set.union.$meth.call(set, other);
    },
    nb$xor(other) {
        const set = as_set(this);
        return set.symmetric_difference.$meth.call(set, other);
    },
    sq$length() {
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
            $meth(other) {
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
        sq$contains(key) {
            return this.dict.mp$lookup(key) !== undefined;
        },
        tp$iter() {
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
        tp$iter() {
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
        sq$contains(item) {
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
        tp$iter() {
            return new dict_itemiter_(this.dict);
        },
    },
    function __reverse__() {
        return new dict_reverse_itemiter_(this.dict);
    }
);

/**
 * @param {string} typename
 * @param {Function} iternext
 * @param {Function=} constructor
 */
function buildDictIterClass(typename, iternext, reversed) {
    return Sk.abstr.buildIteratorClass(typename, {
        constructor: function dict_iter_constructor(dict) {
            this.$index = 0;
            this.$orig = dict;
            this.tp$iternext = () => {
                // only set up the array on the first iteration
                this.$seq = dict.$items();
                this.$version = dict.$version;
                if (reversed) {
                    this.$seq = this.$seq.reverse();
                }
                this.tp$iternext = this.constructor.prototype.tp$iternext;
                return this.tp$iternext();
            };
        },
        iternext: iternext,
        methods: {
            __length_hint__: Sk.generic.iterLengthHintWithArrayMethodDef,
        },
        flags: { sk$unacceptableBase: true },
        proto: { next$item: itemIterNextCheckSize },
    });
}

function itemIterNextCheckSize() {
    if (this.$version !== this.$orig.$version) {
        if (this.$seq.length !== this.$orig.get$size()) {
            throw new Sk.builtin.RuntimeError("dict changed size during iteration");
        }
        throw new Sk.builtin.RuntimeError("dictionary keys changed during iteration");
    }
    return this.$seq[this.$index++];
}

/**
 * @constructor
 * @param {Sk.builtin.dict} dict
 */
var dict_iter_ = buildDictIterClass("dict_keyiterator", function () {
    const item = this.next$item();
    return item && item[0];
});

/**
 * @constructor
 * @param {Sk.builtin.dict} dict
 */
var dict_itemiter_ = buildDictIterClass("dict_itemiterator", function () {
    const item = this.next$item();
    return item && new Sk.builtin.tuple([item[0], item[1]]);
});

/**
 * @constructor
 * @param {Sk.builtin.dict} dict
 */
var dict_valueiter_ = buildDictIterClass("dict_valueiterator", function () {
    const item = this.next$item();
    return item && item[1];
});

var dict_reverse_iter_ = buildDictIterClass("dict_reversekeyiterator", dict_iter_.prototype.tp$iternext, true);
var dict_reverse_itemiter_ = buildDictIterClass("dict_reverseitemiterator", dict_itemiter_.prototype.tp$iternext, true);
var dict_reverse_valueiter_ = buildDictIterClass("dict_reversevalueiterator", dict_valueiter_.prototype.tp$iternext, true);

/**
 * Py2 methods
 * @private
 */
Sk.builtin.dict.py2$methods = {
    has_key: {
        $name: "has_key",
        $flags: { OneArg: true },
        $meth(k) {
            return new Sk.builtin.bool(this.sq$contains(k));
        },
        $doc: "D.has_key(k) -> True if D has a key k, else False",
    },
    keys: {
        $name: "keys",
        $meth() {
            return new Sk.builtin.list(this.sk$asarray());
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.keys() -> a set-like object providing a view on D's keys",
    },
    items: {
        $name: "items",
        $meth() {
            return new Sk.builtin.list(this.$items().map(([key, val]) => new Sk.builtin.tuple([key, val])));
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.items() -> a set-like object providing a view on D's items",
    },
    values: {
        $name: "values",
        $meth() {
            return new Sk.builtin.list(this.$items().map(([_, val]) => val));
        },
        $flags: { NoArgs: true },
        $textsig: null,
        $doc: "D.values() -> an object providing a view on D's values",
    },
};
