function $builtinmodule(name) {
    const collections = {};
    // keyword.iskeyword and itertools.chain are required for collections
    return Sk.misceval.chain(
        Sk.importModule("keyword", false, true),
        (keyword_mod) => {
            collections._iskeyword = keyword_mod.$d.iskeyword;
            return Sk.importModule("itertools", false, true);
        },
        (itertools_mod) => {
            collections._chain = itertools_mod.$d.chain;
            collections._starmap = itertools_mod.$d.starmap;
            collections._repeat = itertools_mod.$d.repeat;
            return Sk.importModule("operator", false, true);
        },
        (operator) => {
            collections._itemgetter = operator.$d.itemgetter;
        },
        () => collections_mod(collections)
    );
}

function collections_mod(collections) {
    collections.__all__ = new Sk.builtin.list(
        [
            "deque",
            "defaultdict",
            "namedtuple",
            // 'UserDict',
            // 'UserList',
            // 'UserString',
            "Counter",
            "OrderedDict",
            // 'ChainMap'
        ].map((x) => new Sk.builtin.str(x))
    );

    // defaultdict object
    collections.defaultdict = Sk.abstr.buildNativeClass("collections.defaultdict", {
        constructor: function defaultdict(default_factory, L) {
            this.default_factory = default_factory;
            Sk.builtin.dict.call(this, L);
        },
        base: Sk.builtin.dict,
        methods: {
            copy: {
                $meth() {
                    return this.$copy();
                },
                $flags: { NoArgs: true },
            },
            __copy__: {
                $meth() {
                    return this.$copy();
                },
                $flags: { NoArgs: true },
            },
            __missing__: {
                $meth(key) {
                    if (Sk.builtin.checkNone(this.default_factory)) {
                        throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key));
                    } else {
                        const ret = Sk.misceval.callsimArray(this.default_factory, []);
                        this.mp$ass_subscript(key, ret);
                        return ret;
                    }
                },
                $flags: { OneArg: true },
            },
        },
        getsets: {
            default_factory: {
                $get() {
                    return this.default_factory;
                },
                $set(value) {
                    value = value || Sk.builtin.none.none$;
                    this.default_factory = value;
                },
            },
        },
        slots: {
            tp$doc:
                "defaultdict(default_factory[, ...]) --> dict with default factory\n\nThe default factory is called without arguments to produce\na new value when a key is not present, in __getitem__ only.\nA defaultdict compares equal to a dict with the same items.\nAll remaining arguments are treated the same as if they were\npassed to the dict constructor, including keyword arguments.\n",
            tp$init(args, kwargs) {
                const default_ = args.shift();
                if (default_ === undefined) {
                    this.default_factory = Sk.builtin.none.none$;
                } else if (!Sk.builtin.checkCallable(default_) && !Sk.builtin.checkNone(default_)) {
                    throw new Sk.builtin.TypeError("first argument must be callable");
                } else {
                    this.default_factory = default_;
                }
                return Sk.builtin.dict.prototype.tp$init.call(this, args, kwargs);
            },
            $r() {
                const def_str = Sk.misceval.objectRepr(this.default_factory);
                const dict_str = Sk.builtin.dict.prototype.$r.call(this).v;
                return new Sk.builtin.str("defaultdict(" + def_str + ", " + dict_str + ")");
            },
        },
        proto: {
            $copy() {
                const L = [];
                // this won't suspend
                Sk.misceval.iterFor(Sk.abstr.iter(this), (k) => {
                    L.push(k);
                    L.push(this.mp$subscript(k));
                });
                return new collections.defaultdict(this.default_factory, L);
            },
        },
    });

    collections.Counter = Sk.abstr.buildNativeClass("Counter", {
        constructor: function Counter() {
            this.$d = new Sk.builtin.dict();
            Sk.builtin.dict.apply(this);
        },
        base: Sk.builtin.dict,
        methods: {
            elements: {
                $flags: { NoArgs: true },
                $meth() {
                    // this is how Cpython does it
                    const from_iterable = collections._chain.tp$getattr(new Sk.builtin.str("from_iterable"));
                    const starmap = collections._starmap;
                    const repeat = collections._repeat;
                    const tp_call = Sk.misceval.callsimArray;
                    return tp_call(from_iterable, [tp_call(starmap, [repeat, tp_call(this.tp$getattr(this.str$items))])]);
                },
            },
            most_common: {
                $flags: { NamedArgs: ["n"], Defaults: [Sk.builtin.none.none$] },
                $meth(n) {
                    length = this.sq$length();
                    if (Sk.builtin.checkNone(n)) {
                        n = length;
                    } else {
                        n = Sk.misceval.asIndexOrThrow(n);
                        n = n > length ? length : n < 0 ? 0 : n;
                    }
                    const most_common_elem = this.$items().sort((a, b) => {
                        if (Sk.misceval.richCompareBool(a[1], b[1], "Lt")) {
                            return 1;
                        } else if (Sk.misceval.richCompareBool(a[1], b[1], "Gt")) {
                            return -1;
                        } else {
                            return 0;
                        }
                    });

                    return new Sk.builtin.list(most_common_elem.slice(0, n).map((x) => new Sk.builtin.tuple(x)));
                },
            },
            update: {
                $flags: { FastCall: true },
                $meth(args, kwargs) {
                    Sk.abstr.checkArgsLen("update", args, 0, 1);
                    return this.counter$update(args, kwargs);
                },
            },
            subtract: {
                $flags: { FastCall: true },
                $meth(args, kwargs) {
                    Sk.abstr.checkArgsLen("subtract", args, 0, 1);
                    const other = args[0];
                    if (other !== undefined) {
                        if (other instanceof Sk.builtin.dict) {
                            for (let iter = Sk.abstr.iter(other), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                                const count = this.mp$subscript(k);
                                this.mp$ass_subscript(k, Sk.abstr.numberBinOp(count, other.mp$subscript(k), "Sub"));
                            }
                        } else {
                            for (iter = Sk.abstr.iter(other), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                                const count = this.mp$subscript(k);
                                this.mp$ass_subscript(k, Sk.abstr.numberBinOp(count, this.$one, "Sub"));
                            }
                        }
                    }

                    kwargs = kwargs || [];
                    for (let i = 0; i < kwargs.length; i += 2) {
                        const k = new Sk.builtin.str(kwargs[i]);
                        const count = this.mp$subscript(k);
                        this.mp$ass_subscript(k, Sk.abstr.numberBinOp(count, kwargs[i + 1], "Sub"));
                    }
                    return Sk.builtin.none.none$;
                },
            },
            __missing__: {
                $meth(key) {
                    return this.$zero;
                },
                $flags: { OneArg: true },
            },
            copy: {
                $meth() {
                    return Sk.misceval.callsimArray(collections.Counter, [this]);
                },
                $flags: { NoArgs: true },
            },
        },
        getsets: {
            __dict__: Sk.generic.getSetDict,
        },
        slots: {
            tp$doc:
                "Dict subclass for counting hashable items.  Sometimes called a bag\n    or multiset.  Elements are stored as dictionary keys and their counts\n    are stored as dictionary values.\n\n    >>> c = Counter('abcdeabcdabcaba')  # count elements from a string\n\n    >>> c.most_common(3)                # three most common elements\n    [('a', 5), ('b', 4), ('c', 3)]\n    >>> sorted(c)                       # list all unique elements\n    ['a', 'b', 'c', 'd', 'e']\n    >>> ''.join(sorted(c.elements()))   # list elements with repetitions\n    'aaaaabbbbcccdde'\n    >>> sum(c.values())                 # total of all counts\n    15\n\n    >>> c['a']                          # count of letter 'a'\n    5\n    >>> for elem in 'shazam':           # update counts from an iterable\n    ...     c[elem] += 1                # by adding 1 to each element's count\n    >>> c['a']                          # now there are seven 'a'\n    7\n    >>> del c['b']                      # remove all 'b'\n    >>> c['b']                          # now there are zero 'b'\n    0\n\n    >>> d = Counter('simsalabim')       # make another counter\n    >>> c.update(d)                     # add in the second counter\n    >>> c['a']                          # now there are nine 'a'\n    9\n\n    >>> c.clear()                       # empty the counter\n    >>> c\n    Counter()\n\n    Note:  If a count is set to zero or reduced to zero, it will remain\n    in the counter until the entry is deleted or the counter is cleared:\n\n    >>> c = Counter('aaabbc')\n    >>> c['b'] -= 2                     # reduce the count of 'b' by two\n    >>> c.most_common()                 # 'b' is still in, but its count is zero\n    [('a', 3), ('c', 1), ('b', 0)]\n\n",
            tp$init(args, kwargs) {
                Sk.abstr.checkArgsLen(this.tpjs_name, args, 0, 1);
                return this.counter$update(args, kwargs);
            },
            $r() {
                /**@todo this should be ordered by count */
                const dict_str = this.size > 0 ? Sk.builtin.dict.prototype.$r.call(this).v : "";
                return new Sk.builtin.str(Sk.abstr.typeName(this) + "(" + dict_str + ")");
            },
            tp$as_sequence_or_mapping: true,
            mp$ass_subscript(key, value) {
                if (value === undefined) {
                    return this.mp$lookup(key) && Sk.builtin.dict.prototype.mp$ass_subscript.call(this, key, value);
                }
                return Sk.builtin.dict.prototype.mp$ass_subscript.call(this, key, value);
            },
            tp$as_number: true,
            nb$positive: counterNumberSlot(function (result) {
                this.$items().forEach(([elem, count]) => {
                    if (Sk.misceval.richCompareBool(count, this.$zero, "Gt")) {
                        result.mp$ass_subscript(elem, count);
                    }
                });
            }),
            nb$negative: counterNumberSlot(function (result) {
                this.$items().forEach(([elem, count]) => {
                    if (Sk.misceval.richCompareBool(count, this.$zero, "Lt")) {
                        result.mp$ass_subscript(elem, Sk.abstr.numberBinOp(this.$zero, count, "Sub"));
                    }
                });
            }),
            nb$subtract: counterNumberSlot(function (result, other) {
                this.$items().forEach(([elem, count]) => {
                    const newcount = Sk.abstr.numberBinOp(count, other.mp$subscript(elem), "Sub");
                    if (Sk.misceval.richCompareBool(newcount, this.$zero, "Gt")) {
                        result.mp$ass_subscript(elem, newcount);
                    }
                });
                other.$items().forEach(([elem, count]) => {
                    if (this.mp$lookup(elem) === undefined && Sk.misceval.richCompareBool(count, this.$zero, "Lt")) {
                        result.mp$ass_subscript(elem, Sk.abstr.numberBinOp(this.$zero, count, "Sub"));
                    }
                });
            }),
            nb$add: counterNumberSlot(function (result, other) {
                this.$items().forEach(([elem, count]) => {
                    const newcount = Sk.abstr.numberBinOp(count, other.mp$subscript(elem), "Add");
                    if (Sk.misceval.richCompareBool(newcount, this.$zero, "Gt")) {
                        result.mp$ass_subscript(elem, newcount);
                    }
                });
                other.$items().forEach(([elem, count]) => {
                    if (this.mp$lookup(elem) === undefined && Sk.misceval.richCompareBool(count, this.$zero, "Gt")) {
                        result.mp$ass_subscript(elem, count);
                    }
                });
            }),
            nb$inplace_add: counterInplaceSlot("+", function (other) {
                other.$items().forEach(([elem, count]) => {
                    const newcount = Sk.abstr.numberInplaceBinOp(this.mp$subscript(elem), count, "Add");
                    this.mp$ass_subscript(elem, newcount);
                });
            }),
            nb$inplace_subtract: counterInplaceSlot("-", function (other) {
                other.$items().forEach(([elem, count]) => {
                    const newcount = Sk.abstr.numberInplaceBinOp(this.mp$subscript(elem), count, "Sub");
                    this.mp$ass_subscript(elem, newcount);
                });
            }),
            nb$or: counterNumberSlot(function (result, other) {
                this.$items().forEach(([elem, count]) => {
                    const other_count = other.mp$subscript(elem);
                    const newcount = Sk.misceval.richCompareBool(count, other_count, "Lt") ? other_count : count;
                    if (Sk.misceval.richCompareBool(newcount, this.$zero, "Gt")) {
                        result.mp$ass_subscript(elem, newcount);
                    }
                });
                other.$items().forEach(([elem, count]) => {
                    if (this.mp$lookup(elem) === undefined && Sk.misceval.richCompareBool(count, this.$zero, "Gt")) {
                        result.mp$ass_subscript(elem, count);
                    }
                });
            }),
            nb$and: counterNumberSlot(function (result, other) {
                this.$items().forEach(([elem, count]) => {
                    const other_count = other.mp$subscript(elem);
                    const newcount = Sk.misceval.richCompareBool(count, other_count, "Lt") ? count : other_count;
                    if (Sk.misceval.richCompareBool(newcount, this.$zero, "Gt")) {
                        result.mp$ass_subscript(elem, newcount);
                    }
                });
            }),
            nb$inplace_and: counterInplaceSlot("&", function (other) {
                this.$items().forEach(([elem, count]) => {
                    const other_count = other.mp$subscript(elem);
                    if (Sk.misceval.richCompareBool(other_count, count, "Lt")) {
                        this.mp$ass_subscript(elem, other_count);
                    }
                });
            }),
            nb$inplace_or: counterInplaceSlot("|", function (other) {
                other.$items().forEach(([elem, other_count]) => {
                    if (Sk.misceval.richCompareBool(other_count, this.mp$subscript(elem), "Gt")) {
                        this.mp$ass_subscript(elem, other_count);
                    }
                });
            }),
            nb$reflected_and: null, // Counter doesn't have reflected slots
            nb$reflected_or: null,
            nb$reflected_add: null,
            nb$reflected_subtract: null,
        },
        proto: {
            keep$positive() {
                this.$items().forEach(([elem, count]) => {
                    if (Sk.misceval.richCompareBool(count, this.$zero, "LtE")) {
                        this.mp$ass_subscript(elem); // delete the element
                    }
                });
                return this;
            },
            $zero: new Sk.builtin.int_(0),
            $one: new Sk.builtin.int_(1),
            str$items: new Sk.builtin.str("items"),
            counter$update(args, kwargs) {
                const iterable = args[0];
                if (iterable !== undefined) {
                    if (Sk.builtin.checkMapping(iterable)) {
                        if (!this.sq$length()) {
                            // reach out to dict update function
                            this.update$common(args, undefined, "update");
                        } else {
                            for (let iter = Sk.abstr.iter(iterable), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                                const count = this.mp$subscript(k);
                                this.mp$ass_subscript(k, Sk.abstr.numberBinOp(count, iterable.mp$subscript(k), "Add"));
                            }
                        }
                    } else {
                        for (let iter = Sk.abstr.iter(iterable), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                            const count = this.mp$subscript(k);
                            this.mp$ass_subscript(k, Sk.abstr.numberBinOp(count, this.$one, "Add"));
                        }
                    }
                }
                if (kwargs && kwargs.length) {
                    if (!this.sq$length()) {
                        // reach out to dict update function
                        this.update$common([], kwargs, "update");
                    } else {
                        for (let i = 0; i < kwargs.length; i += 2) {
                            const k = new Sk.builtin.str(kwargs[i]);
                            const count = this.mp$subscript(k);
                            this.mp$ass_subscript(k, Sk.abstr.numberBinOp(count, kwargs[i + 1], "Add"));
                        }
                    }
                }

                return Sk.builtin.none.none$;
            },
        },
        classmethods: {
            fromkeys: {
                $meth: function fromkeys() {
                    throw new Sk.builtin.NotImplementedError("Counter.fromkeys() is undefined.  Use Counter(iterable) instead.");
                },
                $flags: { MinArgs: 1, MaxArgs: 2 },
            },
        },
    });

    function counterNumberSlot(f) {
        return function (other) {
            if (other !== undefined && !(other instanceof collections.Counter)) {
                return Sk.builtin.NotImplemented.NotImplemented$;
            }
            const result = new collections.Counter();
            f.call(this, result, other);
            return result;
        };
    }
    function counterInplaceSlot(symbol, f) {
        return function (other) {
            // can add anything with items defined but just support dict instances...
            if (!(other instanceof Sk.builtin.dict)) {
                throw new Sk.builtin.TypeError("Counter " + symbol + "= " + Sk.abstr.typeName(other) + " is not supported");
            }
            f.call(this, other);
            return this.keep$positive();
        };
    }

    // OrderedDict
    const odict_iter_ = Sk.abstr.buildIteratorClass("odict_iterator", {
        constructor: function odict_iter_(odict) {
            this.$index = 0;
            this.$seq = odict.sk$asarray();
            this.$orig = odict;
        },
        iternext: Sk.generic.iterNextWithArrayCheckSize,
        flags: { sk$acceptable_as_base_class: false },
    });

    collections.OrderedDict = Sk.abstr.buildNativeClass("OrderedDict", {
        constructor: function OrderedDict() {
            this.orderedkeys = [];
            Sk.builtin.dict.call(this);
            return this;
        },
        base: Sk.builtin.dict,
        slots: {
            tp$as_sequence_or_mapping: true,
            tp$init(args, kwargs) {
                Sk.abstr.checkArgsLen("OrderedDict", args, 0, 1);
                args.unshift(this);
                res = Sk.misceval.callsimArray(this.update, args, kwargs);
            },
            tp$doc: "Dictionary that remembers insertion order",
            $r() {
                let v, pairstr;
                const ret = [];
                for (let iter = this.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                    v = this.mp$subscript(k);
                    if (v === undefined) {
                        //print(k, "had undefined v");
                        v = null;
                    }
                    ret.push("(" + Sk.misceval.objectRepr(k) + ", " + Sk.misceval.objectRepr(v) + ")");
                }
                pairstr = ret.join(", ");
                if (ret.length > 0) {
                    pairstr = "[" + pairstr + "]";
                }
                return new Sk.builtin.str("OrderedDict(" + pairstr + ")");
            },
            tp$richcompare(other, op) {
                if (op != "Eq" && op != "Ne") {
                    return Sk.builtin.NotImplemented.NotImplemented$;
                }
                const $true = op == "Eq" ? true : false;
                if (!(other instanceof collections.OrderedDict)) {
                    return Sk.builtin.dict.prototype.tp$richcompare.call(this, other, op);
                }
                const l = this.size;
                const otherl = other.size;
                if (l !== otherl) {
                    return !$true;
                }

                for (
                    let iter = this.tp$iter(), otheriter = other.tp$iter(), k = iter.tp$iternext(), otherk = otheriter.tp$iternext();
                    k !== undefined;
                    k = iter.tp$iternext(), otherk = otheriter.tp$iternext()
                ) {
                    if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(k, otherk, "Eq"))) {
                        return !$true;
                    }
                    const v = this.mp$subscript(k);
                    const otherv = other.mp$subscript(otherk);

                    if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(v, otherv, "Eq"))) {
                        return !$true;
                    }
                }
                return $true;
            },
            mp$ass_subscript(key, w) {
                if (w === undefined) {
                    const item = this.pop$item(key);
                    if (item === undefined) {
                        throw new Sk.builtin.KeyError(key);
                    }
                } else {
                    this.set$item(key, w);
                }
            },
            tp$iter() {
                return new odict_iter_(this);
            },
        },
        methods: {
            pop: {
                $flags: { NamedArgs: ["key", "default"], Defaults: [null] },
                $meth(key, d) {
                    if (d === null) {
                        return Sk.misceval.callsimArray(Sk.builtin.dict.prototype["pop"], [this, key]);
                    } else {
                        return Sk.misceval.callsimArray(Sk.builtin.dict.prototype["pop"], [this, key, d]);
                    }
                },
            },
            popitem: {
                $flags: { NamedArgs: ["last"], Defaults: [Sk.builtin.bool.true$] },
                $meth(last) {
                    let key, val;
                    if (!this.orderedkeys.length) {
                        throw new Sk.builtin.KeyError("dictionary is empty");
                    }
                    key = this.orderedkeys[0];
                    if (Sk.misceval.isTrue(last)) {
                        key = this.orderedkeys[this.orderedkeys.length - 1];
                    }
                    val = Sk.misceval.callsimArray(this["pop"], [this, key]);
                    return new Sk.builtin.tuple([key, val]);
                },
            },
            move_to_end: {
                $flags: { NamedArgs: ["key", "last"], Defaults: [Sk.builtin.bool.true$] },
                $meth(key, last) {
                    let orderedkey,
                        idx = -1;
                    for (let i = 0; i < this.orderedkeys.length; i++) {
                        orderedkey = this.orderedkeys[i];
                        if (orderedkey === key || Sk.misceval.richCompareBool(orderedkey, key, "Eq")) {
                            idx = i;
                            break;
                        }
                    }
                    if (idx !== -1) {
                        this.orderedkeys.splice(idx, 1);
                    } else {
                        throw new Sk.builtin.KeyError(key);
                    }
                    if (Sk.misceval.isTrue(last)) {
                        this.orderedkeys.push(key);
                    } else {
                        this.orderedkeys.unshift(key);
                    }
                    return Sk.builtin.none.none$;
                },
            },
        },
        proto: {
            sk$asarray() {
                return this.orderedkeys.slice(0);
            },
            set$item(key, w) {
                const idx = this.orderedkeys.indexOf(key);
                if (idx == -1) {
                    this.orderedkeys.push(key);
                }
                Sk.builtin.dict.prototype.set$item.call(this, key, w);
            },
            pop$item(key) {
                var idx = this.orderedkeys.indexOf(key);
                if (idx != -1) {
                    this.orderedkeys.splice(idx, 1);
                    return Sk.builtin.dict.prototype.pop$item.call(this, key);
                }
            },
        },
    });

    collections.deque = Sk.abstr.buildNativeClass("collections.deque", {
        constructor: function deque(D, maxlen, head, tail, mask) {
            this.head = head || 0;
            this.tail = tail || 0;
            this.mask = mask || 1;
            this.maxlen = maxlen;
            this.v = D || new Array(2);
        },
        slots: {
            tp$doc: "deque([iterable[, maxlen]]) --> deque object\n\nA list-like sequence optimized for data accesses near its endpoints.",
            tp$hash: Sk.builtin.none.none$,
            tp$new: Sk.generic.new,
            tp$init(args, kwargs) {
                [iterable, maxlen] = Sk.abstr.copyKeywordsToNamedArgs("deque", ["iterable", "maxlen"], args, kwargs);
                if (maxlen !== undefined && !Sk.builtin.checkNone(maxlen)) {
                    maxlen = Sk.misceval.asIndexSized(maxlen, Sk.builtin.OverflowError, "an integer is required");
                    if (maxlen < 0) {
                        throw new Sk.builtin.ValueError("maxlen must be non-negative");
                    } else {
                        this.maxlen = maxlen;
                    }
                }
                this.$clear();
                if (iterable !== undefined) {
                    this.$extend(iterable);
                }
            },
            tp$getattr: Sk.generic.getAttr,

            tp$richcompare(w, op) {
                if (this === w && Sk.misceval.opAllowsEquality(op)) {
                    return true;
                }
                // w not a deque
                if (!(w instanceof collections.deque)) {
                    return Sk.builtin.NotImplemented.NotImplemented$;
                }
                const wd = w;
                const v = this.v;
                w = w.v;
                const vl = (this.tail - this.head) & this.mask;
                const wl = (wd.tail - wd.head) & wd.mask;
                let k,
                    i = Math.max(vl, wl);
                if (vl === wl) {
                    for (i = 0; i < vl && i < wl; ++i) {
                        k = Sk.misceval.richCompareBool(v[(this.head + i) & this.mask], w[(wd.head + i) & wd.mask], "Eq");
                        if (!k) {
                            break;
                        }
                    }
                }
                if (i >= vl || i >= wl) {
                    // no more items to compare, compare sizes
                    switch (op) {
                        case "Lt":
                            return vl < wl;
                        case "LtE":
                            return vl <= wl;
                        case "Eq":
                            return vl === wl;
                        case "NotEq":
                            return vl !== wl;
                        case "Gt":
                            return vl > wl;
                        case "GtE":
                            return vl >= wl;
                    }
                }

                // we have an item that's different
                // shortcuts for eq/not
                if (op === "Eq") {
                    return false;
                }
                if (op === "NotEq") {
                    return true;
                }
                // or, compare the differing element using the proper operator
                return Sk.misceval.richCompareBool(v[(this.head + i) & this.mask], w[(wd.head + i) & wd.mask], op);
            },
            tp$iter() {
                return new deque_iter_(this);
            },

            $r() {
                // represetation: deque(['a','b','c'][,maxlen=n])
                const ret = [];
                const size = (this.tail - this.head) & this.mask;
                if (this.$entered_repr) {
                    return new Sk.builtin.str("[...]");
                }
                this.$entered_repr = true;
                for (let i = 0; i < size; i++) {
                    ret.push(Sk.misceval.objectRepr(this.v[(this.head + i) & this.mask]));
                }
                const name = Sk.abstr.typeName(this);
                if (this.maxlen !== undefined) {
                    return new Sk.builtin.str(name + "([" + ret.filter(Boolean).join(", ") + "], maxlen=" + this.maxlen + ")");
                }
                this.$entered_repr = undefined;
                return new Sk.builtin.str(name + "([" + ret.filter(Boolean).join(", ") + "])");
            },
            tp$as_number: true,
            nb$bool() {
                return 0 !== ((this.tail - this.head) & this.mask);
            },

            tp$as_sequence_or_mapping: true,
            sq$contains(item) {
                for (let it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    if (Sk.misceval.richCompareBool(i, item, "Eq")) {
                        return true;
                    }
                }
                return false;
            },
            sq$concat(other) {
                // check type
                if (!(other instanceof collections.deque)) {
                    throw new Sk.builtin.TypeError("can only concatenate deque (not '" + Sk.abstr.typeName(other) + "') to deque");
                }
                // TODO this can't be the right constructor
                const new_deque = this.$copy();
                for (let iter = other.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                    new_deque.$push(k);
                }
                return new_deque;
            },
            sq$length() {
                return (this.tail - this.head) & this.mask;
            },
            sq$repeat(n) {
                n = Sk.misceval.asIndexOrThrow(n, "can't multiply sequence by non-int of type '{tp$name}'");
                const size = (this.tail - this.head) & this.mask;
                const new_deque = this.$copy();
                let pos;
                if (n <= 0) {
                    new_deque.$clear();
                }
                for (let i = 1; i < n; i++) {
                    for (let j = 0; j < size; j++) {
                        pos = (this.head + j) & this.mask;
                        new_deque.$push(this.v[pos]);
                    }
                }
                return new_deque;
            },
            mp$subscript(index) {
                index = Sk.misceval.asIndexOrThrow(index);
                const size = (this.tail - this.head) & this.mask;
                if (index >= size || index < -size) {
                    throw new Sk.builtin.IndexError("deque index out of range");
                }
                const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;
                return this.v[pos];
            },
            mp$ass_subscript(index, val) {
                index = Sk.misceval.asIndexOrThrow(index);
                const size = (this.tail - this.head) & this.mask;
                if (index >= size || index < -size) {
                    throw new Sk.builtin.IndexError("deque index out of range");
                }
                if (val === undefined) {
                    this.del$item(index);
                } else {
                    this.set$item(index, val);
                }
            },
            nb$inplace_add(other) {
                this.maxlen = undefined;
                for (it = Sk.abstr.iter(other), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    this.$push(i);
                }
                return this;
            },
            nb$inplace_multiply(n) {
                n = Sk.misceval.asIndexSized(n, Sk.builtin.OverflowError, "can't multiply sequence by non-int of type '{tp$name}'");
                if (n <= 0) {
                    this.$clear();
                }
                const tmp = this.$copy();
                const size = (this.tail - this.head) & this.mask;
                for (let i = 1; i < n; i++) {
                    for (let j = 0; j < size; j++) {
                        const pos = (this.head + j) & this.mask;
                        tmp.$push(this.v[pos]);
                    }
                }
                this.v = tmp.v;
                this.head = tmp.head;
                this.tail = tmp.tail;
                this.mask = tmp.mask;
                return this;
            },
        },

        methods: {
            append: {
                $meth(value) {
                    this.$push(value);
                    return Sk.builtin.none.none$;
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "Add an element to the right side of the deque.",
            },
            appendleft: {
                $meth(value) {
                    this.$pushLeft(value);
                    return Sk.builtin.none.none$;
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "Add an element to the left side of the deque.",
            },
            clear: {
                $meth() {
                    this.$clear();
                    return Sk.builtin.none.none$;
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "Remove all elements from the deque.",
            },
            __copy__: {
                $meth() {
                    return this.$copy();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "Return a shallow copy of a deque.",
            },
            copy: {
                $meth() {
                    return this.$copy();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "Return a shallow copy of a deque.",
            },
            count: {
                $meth(x) {
                    const size = (this.tail - this.head) & this.mask;
                    let count = 0;
                    for (let i = 0; i < size; i++) {
                        if (Sk.misceval.richCompareBool(this.v[(this.head + i) & this.mask], x, "Eq")) {
                            count++;
                        }
                    }
                    return new Sk.builtin.int_(count);
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "D.count(value) -> integer -- return number of occurrences of value",
            },
            extend: {
                $meth(iterable) {
                    this.$extend(iterable);
                    return Sk.builtin.none.none$;
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "Extend the right side of the deque with elements from the iterable",
            },
            extendleft: {
                $meth(iterable) {
                    for (it = Sk.abstr.iter(iterable), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                        this.$pushLeft(i);
                    }
                    return Sk.builtin.none.none$;
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "Extend the left side of the deque with elements from the iterable",
            },
            index: {
                $meth(x, start, stop) {
                    const i = this.$index(x, start, stop);
                    if (i !== undefined) {
                        return new Sk.builtin.int_(i);
                    }
                    throw new Sk.builtin.ValueError(Sk.misceval.objectRepr(x) + " is not in deque");
                },
                $flags: { MinArgs: 1, MaxArgs: 3 },
                $textsig: null,
                $doc: "D.index(value, [start, [stop]]) -> integer -- return first index of value.\nRaises ValueError if the value is not present.",
            },
            insert: {
                $meth(index, value) {
                    index = Sk.misceval.asIndexOrThrow(index, "integer argument expected, got {tp$name}");
                    const size = (this.tail - this.head) & this.mask;
                    if (this.maxlen !== undefined && size >= this.maxlen) {
                        throw new Sk.builtin.IndexError("deque already at its maximum size");
                    }
                    if (index > size) {
                        index = size;
                    }
                    if (index <= -size) {
                        index = 0;
                    }

                    const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;

                    let cur = this.tail;
                    this.tail = (this.tail + 1) & this.mask;

                    while (cur !== pos) {
                        const prev = (cur - 1) & this.mask;
                        this.v[cur] = this.v[prev];
                        cur = prev;
                    }
                    this.v[pos] = value;
                    if (this.head === this.tail) {
                        this.$resize(this.v.length, this.v.length << 1);
                    }
                    return Sk.builtin.none.none$;
                },
                $flags: { MinArgs: 2, MaxArgs: 2 },
                $textsig: null,
                $doc: "D.insert(index, object) -- insert object before index",
            },
            pop: {
                $meth() {
                    return this.$pop();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "Remove and return the rightmost element.",
            },
            popleft: {
                $meth() {
                    return this.$popLeft();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "Remove and return the leftmost element.",
            },
            // __reduce__: {
            //     $meth: methods.__reduce__,
            //     $flags: {},
            //     $textsig: null,
            //     $doc: "Return state information for pickling.",
            // },
            remove: {
                $meth(value) {
                    const index = this.$index(value);
                    if (index === undefined) {
                        throw new Sk.builtin.ValueError(Sk.misceval.objectRepr(value) + " is not in deque");
                    }
                    const pos = (this.head + index) & this.mask;
                    let cur = pos;
                    while (cur !== this.tail) {
                        const next = (cur + 1) & this.mask;
                        this.v[cur] = this.v[next];
                        cur = next;
                    }

                    this.tail = (this.tail - 1) & this.mask;
                    var size = (this.tail - this.head) & this.mask;
                    if (size < this.mask >>> 1) {
                        this.$resize(size, this.v.length >>> 1);
                    }
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "D.remove(value) -- remove first occurrence of value.",
            },
            __reversed__: {
                $meth() {
                    return new _deque_reverse_iterator_iter_(this);
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "D.__reversed__() -- return a reverse iterator over the deque",
            },
            reverse: {
                $meth() {
                    const head = this.head;
                    const tail = this.tail;
                    const mask = this.mask;
                    const size = (this.tail - this.head) & this.mask;
                    for (let i = 0; i < ~~(size / 2); i++) {
                        const a = (tail - i - 1) & mask;
                        const b = (head + i) & mask;
                        const temp = this.v[a];
                        this.v[a] = this.v[b];
                        this.v[b] = temp;
                    }
                    return Sk.builtin.none.none$;
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "D.reverse() -- reverse *IN PLACE*",
            },
            rotate: {
                $meth(n) {
                    if (n === undefined) {
                        n = 1;
                    } else {
                        n = Sk.misceval.asIndexSized(n, Sk.builtin.OverflowError);
                    }
                    const head = this.head;
                    const tail = this.tail;

                    if (n === 0 || head === tail) {
                        return this;
                    }
                    this.head = (head - n) & this.mask;
                    this.tail = (tail - n) & this.mask;
                    if (n > 0) {
                        for (let i = 1; i <= n; i++) {
                            const a = (head - i) & this.mask;
                            const b = (tail - i) & this.mask;
                            this.v[a] = this.v[b];
                            this.v[b] = undefined;
                        }
                    } else {
                        for (let i = 0; i > n; i--) {
                            const a = (tail - i) & this.mask;
                            const b = (head - i) & this.mask;
                            this.v[a] = this.v[b];
                            this.v[b] = undefined;
                        }
                    }
                    return Sk.builtin.none.none$;
                },
                $flags: { MinArgs: 0, MaxArgs: 1 },
                $textsig: null,
                $doc: "Rotate the deque n steps to the right (default n=1).  If n is negative, rotates left.",
            },
        },
        getsets: {
            maxlen: {
                $get() {
                    return this.maxlen === undefined ? Sk.builtin.none.none$ : new Sk.builtin.int_(this.maxlen);
                },
                $doc: "maximum size of a deque or None if unbounded",
            },
        },
        proto: {
            $clear() {
                this.head = 0;
                this.tail = 0;
                this.mask = 1;
                this.v = new Array(2);
            },
            $copy() {
                return new collections.deque(this.v.slice(0), this.maxlen, this.head, this.tail, this.mask);
            },
            $extend(iterable) {
                for (it = Sk.abstr.iter(iterable), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    this.$push(i);
                }
            },
            set$item(index, val) {
                const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;
                this.v[pos] = val;
            },
            del$item(index) {
                const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;
                let cur = pos;
                // Shift items backward 1 to erase position.
                while (cur !== this.tail) {
                    const next = (cur + 1) & this.mask;
                    this.v[cur] = this.v[next];
                    cur = next;
                }
                // Decrease tail position by 1.
                const size = (this.tail - this.head) & this.mask;
                this.tail = (this.tail - 1) & this.mask;
                if (size < this.mask >>> 1) {
                    this.$resize(size, this.v.length >>> 1);
                }
            },
            $push(value) {
                this.v[this.tail] = value;
                this.tail = (this.tail + 1) & this.mask;
                if (this.head === this.tail) {
                    this.$resize(this.v.length, this.v.length << 1);
                }

                const size = (this.tail - this.head) & this.mask;
                if (this.maxlen !== undefined && size > this.maxlen) {
                    this.$popLeft();
                }
                return this;
            },
            $pushLeft(value) {
                this.head = (this.head - 1) & this.mask;
                this.v[this.head] = value;
                if (this.head === this.tail) {
                    this.$resize(this.v.length, this.v.length << 1);
                }

                const size = (this.tail - this.head) & this.mask;
                if (this.maxlen !== undefined && size > this.maxlen) {
                    this.$pop();
                }
                return this;
            },
            $pop() {
                if (this.head === this.tail) {
                    throw new Sk.builtin.IndexError("pop from an empty deque");
                }
                this.tail = (this.tail - 1) & this.mask;
                const value = this.v[this.tail];
                this.v[this.tail] = undefined;
                const size = (this.tail - this.head) & this.mask;
                if (size < this.mask >>> 1) {
                    this.$resize(size, this.v.length >>> 1);
                }
                return value;
            },
            $popLeft() {
                if (this.head === this.tail) {
                    throw new Sk.builtin.IndexError("pop from an empty deque");
                }
                const value = this.v[this.head];
                this.v[this.head] = undefined;
                this.head = (this.head + 1) & this.mask;
                const size = (this.tail - this.head) & this.mask;
                if (size < this.mask >>> 1) {
                    this.$resize(size, this.v.length >>> 1);
                }
                return value;
            },
            $resize(size, length) {
                const head = this.head;
                const mask = this.mask;
                this.head = 0;
                this.tail = size;
                this.mask = length - 1;
                // Optimize resize when list is already sorted.
                if (head === 0) {
                    this.v.length = length;
                    return;
                }
                const sorted = new Array(length);
                for (let i = 0; i < size; i++) {
                    sorted[i] = this.v[(head + i) & mask];
                }
                this.v = sorted;
            },
            $index(x, start, stop) {
                const size = (this.tail - this.head) & this.mask;
                start = start === undefined ? 0 : Sk.misceval.asIndexOrThrow(start);
                stop = stop === undefined ? size : Sk.misceval.asIndexOrThrow(stop);

                const head = this.head;
                const mask = this.mask;
                const list = this.v;

                const offset = start >= 0 ? start : start < -size ? 0 : size + start;
                stop = stop >= 0 ? stop : stop < -size ? 0 : size + stop;
                for (let i = offset; i < stop; i++) {
                    if (list[(head + i) & mask] === x) {
                        return i;
                    }
                }
            },
            sk$asarray() {
                const ret = [];
                const size = (this.tail - this.head) & this.mask;
                for (let i = 0; i < size; ++i) {
                    const pos = (this.head + i) & this.mask;
                    ret.push(this.v[pos]);
                }
                return ret;
            },
        },
    });

    const deque_iter_ = Sk.abstr.buildIteratorClass("_collections._deque_iterator", {
        constructor: function _deque_iterator(dq) {
            this.$index = 0;
            this.dq = dq.v;
            this.$length = (dq.tail - dq.head) & dq.mask;
            this.$head = dq.head;
            this.$tail = dq.tail;
            this.$mask = dq.mask;
        },
        iternext() {
            if (this.$index >= this.$length) {
                return undefined;
            }
            const pos = ((this.$index >= 0 ? this.$head : this.$tail) + this.$index) & this.$mask;
            this.$index++;
            return this.dq[pos];
        },
        methods: {
            __length_hint__: {
                $meth: function __length_hint__() {
                    return new Sk.builtin.int_(this.$length - this.$index);
                },
                $flags: { NoArgs: true },
            },
        },
    });

    const _deque_reverse_iterator_iter_ = Sk.abstr.buildIteratorClass("_collections._deque_reverse_iterator", {
        constructor: function _deque_reverse_iterator(dq) {
            this.$index = ((dq.tail - dq.head) & dq.mask) - 1;
            this.dq = dq.v;
            this.$head = dq.head;
            this.$mask = dq.mask;
        },
        iternext() {
            if (this.$index < 0) {
                return undefined;
            }
            const pos = (this.$head + this.$index) & this.$mask;
            this.$index--;
            return this.dq[pos];
        },
        methods: {
            __length_hint__: Sk.generic.iterReverseLengthHintMethodDef,
        },
    });

    // deque end

    // regex tests for name and fields
    const startsw = new RegExp(/^[0-9].*/);
    const startsw2 = new RegExp(/^[0-9_].*/);
    const alnum = new RegExp(/^\w*$/);
    const comma = /,/g;
    const spaces = /\s+/;

    function namedtuple(name, fields, rename, defaults, module) {
        name = name.tp$str();
        if (Sk.misceval.isTrue(Sk.misceval.callsimArray(collections._iskeyword, [name]))) {
            throw new Sk.builtin.ValueError("Type names and field names cannot be a keyword: '" + Sk.misceval.objectRepr(name) + "'");
        }
        const js_name = name.$jsstr();
        if (startsw.test(js_name) || !alnum.test(js_name) || !js_name) {
            throw new Sk.builtin.ValueError("Type names and field names must be valid identifiers: '" + js_name + "'");
        }

        let flds, field_names;
        // fields could be a string or an iterable of strings
        if (Sk.builtin.checkString(fields)) {
            flds = fields.$jsstr().replace(comma, " ").split(spaces);
            if (flds.length == 1 && flds[0] === "") {
                flds = [];
            }
            field_names = flds.map((x) => new Sk.builtin.str(x));
        } else {
            flds = [];
            field_names = [];
            for (let iter = Sk.abstr.iter(fields), i = iter.tp$iternext(); i !== undefined; i = iter.tp$iternext()) {
                i = i.tp$str();
                field_names.push(i);
                flds.push(i.$jsstr());
            }
        }

        // rename fields
        let seen = new Set();
        if (Sk.misceval.isTrue(rename)) {
            for (i = 0; i < flds.length; i++) {
                if (
                    Sk.misceval.isTrue(Sk.misceval.callsimArray(collections._iskeyword, [field_names[i]])) ||
                    startsw2.test(flds[i]) ||
                    !alnum.test(flds[i]) ||
                    !flds[i] ||
                    seen.has(flds[i])
                ) {
                    flds[i] = "_" + i;
                    field_names[i] = new Sk.builtin.str("_" + i);
                }
                seen.add(flds[i]);
            }
        } else {
            // check the field names
            for (i = 0; i < flds.length; i++) {
                if (Sk.misceval.isTrue(Sk.misceval.callsimArray(collections._iskeyword, [field_names[i]]))) {
                    throw new Sk.builtin.ValueError("Type names and field names cannot be a keyword: '" + flds[i] + "'");
                } else if (startsw2.test(flds[i])) {
                    throw new Sk.builtin.ValueError("Field names cannot start with an underscore: '" + flds[i] + "'");
                } else if (!alnum.test(flds[i]) || !flds[i]) {
                    throw new Sk.builtin.ValueError("Type names and field names must be valid identifiers: '" + flds[i] + "'");
                } else if (seen.has(flds[i])) {
                    throw new Sk.builtin.ValueError("Encountered duplicate field name: '" + flds[i] + "'");
                }
                seen.add(flds[i]);
            }
        }
        const _field_names = new Sk.builtin.tuple(field_names);

        // create array of default values
        const dflts_dict = [];
        let dflts = [];
        if (!Sk.builtin.checkNone(defaults)) {
            dflts = Sk.misceval.arrayFromIterable(defaults);
            if (dflts.length > flds.length) {
                throw new Sk.builtin.TypeError("Got more default values than field names");
            }
            for (let j = 0, i = field_names.length - dflts.length; i < field_names.length; j++, i++) {
                dflts_dict.push(field_names[i]);
                dflts_dict.push(dflts[j]);
            }
        }
        // _field_defaults
        const _field_defaults = new Sk.builtin.dict(dflts_dict);

        // _make
        function _make(_cls, iterable) {
            return _cls.prototype.tp$new(Sk.misceval.arrayFromIterable(iterable));
        }
        _make.co_varnames = ["_cls", "iterable"];

        // _asdict
        function _asdict(self) {
            const asdict = [];
            for (let i = 0; i < self._fields.v.length; i++) {
                asdict.push(self._fields.v[i]);
                asdict.push(self.v[i]);
            }
            return new Sk.builtin.dict(asdict);
        }
        _asdict.co_varnames = ["self"];

        // _replace
        function _replace(kwargs, _self) {
            // this is the call signature from skulpt kwargs is a list of pyObjects
            kwargs = new Sk.builtin.dict(kwargs);
            // this is the way Cpython does it.
            const pop = kwargs.tp$getattr(new Sk.builtin.str("pop"));
            // in the unlikely event that someone calls _replace with _self that isn't a named tuple
            // throw an error if _make doesn't exist
            const _make = Sk.abstr.gattr(_self, new Sk.builtin.str("_make"));
            const call = Sk.misceval.callsimArray;
            const res = call(_make, [call(Sk.builtin.map_, [pop, _field_names, _self])]);
            if (kwargs.sq$length()) {
                const keys = kwargs.sk$asarray();
                throw new Sk.builtin.ValueError("Got unexpectd field names: [" + keys.map((x) => "'" + x.$jsstr() + "'") + "]");
            }
            return res;
        }
        _replace.co_kwargs = 1;
        _replace.co_varnames = ["_self"];

        // create property getters for each field
        const getters = {};
        for (let i = 0; i < flds.length; i++) {
            getters[field_names[i].$mangled] = new Sk.builtin.property(
                new collections._itemgetter([new Sk.builtin.int_(i)]),
                undefined,
                undefined,
                new Sk.builtin.str("Alias for field number " + i)
            );
        }

        // build namedtuple class
        return Sk.abstr.buildNativeClass(js_name, {
            constructor: function NamedTuple() {},
            base: Sk.builtin.tuple,
            slots: {
                tp$doc: js_name + "(" + flds.join(", ") + ")",
                tp$new(args, kwargs) {
                    args = Sk.abstr.copyKeywordsToNamedArgs("__new__", flds, args, kwargs, dflts);
                    const named_tuple_instance = new this.constructor();
                    Sk.builtin.tuple.call(named_tuple_instance, args);
                    return named_tuple_instance;
                },
                $r() {
                    const bits = this.v.map((x, i) => flds[i] + "=" + Sk.misceval.objectRepr(x));
                    return new Sk.builtin.str(Sk.abstr.typeName(this) + "(" + bits.join(", ") + ")");
                },
            },
            proto: Object.assign(
                {
                    __module__: Sk.builtin.checkNone(module) ? Sk.globals["__name__"] : module,
                    __slots__: new Sk.builtin.tuple(),
                    _fields: _field_names,
                    _field_defaults: _field_defaults,
                    _make: new Sk.builtin.classmethod(new Sk.builtin.func(_make)),
                    _asdict: new Sk.builtin.func(_asdict),
                    _replace: new Sk.builtin.func(_replace),
                },
                getters
            ),
        });
    }

    namedtuple.co_argcount = 2;
    namedtuple.co_kwonlyargcount = 3;
    namedtuple.$kwdefs = [Sk.builtin.bool.false$, Sk.builtin.none.none$, Sk.builtin.none.none$];
    namedtuple.co_varnames = ["typename", "field_names", "rename", "defaults", "module"];

    collections.namedtuple = new Sk.builtin.func(namedtuple);

    return collections;
}
