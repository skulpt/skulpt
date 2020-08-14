const collections_mod = function (keywds) {
    const collections = {};

    // defaultdict object
    const _copy_dd_method_df = {
        $meth: function () {
            const L = [];
            // this won't suspend
            Sk.misceval.iterFor(Sk.abstr.iter(this), (k) => {
                L.push(k);
                L.push(this.mp$subscript(k));
            });
            return new collections.defaultdict(this.default_factory, L);
        },
        $flags: { NoArgs: true },
    };

    collections.defaultdict = Sk.abstr.buildNativeClass("collections.defaultdict", {
        constructor: function defaultdict(default_factory, L) {
            this.default_factory = default_factory;
            Sk.builtin.dict.call(this, L);
        },
        base: Sk.builtin.dict,
        methods: {
            copy: _copy_dd_method_df,
            __copy__: _copy_dd_method_df,
            __missing__: {
                $meth: function (key) {
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
                $get: function () {
                    return this.default_factory;
                },
                $set: function (value) {
                    this.default_factory = value;
                },
            },
        },
        slots: {
            tp$doc:
                "defaultdict(default_factory[, ...]) --> dict with default factory\n\nThe default factory is called without arguments to produce\na new value when a key is not present, in __getitem__ only.\nA defaultdict compares equal to a dict with the same items.\nAll remaining arguments are treated the same as if they were\npassed to the dict constructor, including keyword arguments.\n",
            tp$init: function (args, kwargs) {
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
            $r: function () {
                const def_str = Sk.misceval.objectRepr(this.default_factory);
                const dict_str = Sk.builtin.dict.prototype.$r.call(this).v;
                return new Sk.builtin.str("defaultdict(" + def_str + ", " + dict_str + ")");
            },
            mp$subscript: function (key) {
                return this.mp$lookup(key) || Sk.misceval.callsimArray(this.__missing__, [this, key]);
            },
        },
    });

    collections.Counter = Sk.abstr.buildNativeClass("Counter", {
        constructor: function Counter() {
            this.$d = new Sk.builtin.dict();
        },
        base: Sk.builtin.dict,
        methods: {
            elements: {
                $flags: { NoArgs: true },
                $meth: function () {
                    const all_elements = [];
                    for (let iter = this.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                        for (let i = 0; i < this.mp$subscript(k).v; i++) {
                            all_elements.push(k);
                        }
                    }
                    if (collections._chain === undefined) {
                        let itertools = Sk.importModule("itertools", false, true);
                        return Sk.misceval.chain(itertools, function (i) {
                            collections._chain = i.$d.chain;
                            return Sk.misceval.callsimArray(collections._chain, all_elements);
                        });
                    } else {
                        return Sk.misceval.callsimArray(collections._chain, all_elements);
                    }
                },
            },
            most_common: {
                $flags: {
                    NamedArgs: ["n"],
                    Defaults: [Sk.builtin.none.none$],
                },
                $meth: function (n) {
                    length = this.sq$length();
                    if (Sk.builtin.checkNone(n)) {
                        n = length;
                    } else {
                        if (!Sk.builtin.checkInt(n)) {
                            if (n instanceof Sk.builtin.float_) {
                                throw new Sk.builtin.TypeError("integer argument expected, got float");
                            } else {
                                throw new Sk.builtin.TypeError("an integer is required");
                            }
                        }

                        n = Sk.builtin.asnum$(n);
                        n = n <= length ? n : length;
                        n = n >= 0 ? n : 0;
                    }

                    var most_common_elem = [];
                    for (var iter = this.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                        most_common_elem.push([k, this.mp$subscript(k)]);
                    }

                    var sort_func = function (a, b) {
                        if (a[1].v < b[1].v) {
                            return 1;
                        } else if (a[1].v > b[1].v) {
                            return -1;
                        } else {
                            return 0;
                        }
                    };
                    most_common_elem = most_common_elem.sort(sort_func);

                    var ret = [];
                    for (var i = 0; i < n; i++) {
                        ret.push(new Sk.builtin.tuple(most_common_elem.shift()));
                    }

                    return new Sk.builtin.list(ret);
                },
            },
            update: {
                $flags: { FastCall: true },
                $meth: function (args, kwargs) {
                    Sk.abstr.checkArgsLen("update", args, 0, 1);
                    let k, iter, count;
                    const other = args[0];
                    if (other !== undefined) {
                        iter = Sk.abstr.iter(other);
                    }
                    if (other instanceof Sk.builtin.dict) {
                        for (k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                            count = this.mp$subscript(k);
                            this.mp$ass_subscript(k, count.nb$add(other.mp$subscript(k)));
                        }
                    } else if (iter) {
                        const one = new Sk.builtin.int_(1);
                        for (k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                            count = this.mp$subscript(k);
                            this.mp$ass_subscript(k, count.nb$add(one));
                        }
                    }
                    kwargs = kwargs || [];
                    for (let i = 0; i < kwargs.length; i += 2) {
                        k = new Sk.builtin.str(kwargs[i]);
                        count = this.mp$subscript(k);
                        this.mp$ass_subscript(k, count.nb$add(kwargs[i + 1]));
                    }
                    return Sk.builtin.none.none$;
                },
            },
            subtract: {
                $flags: { FastCall: true },
                $meth: function (args, kwargs) {
                    Sk.abstr.checkArgsLen("subtract", args, 0, 1);
                    let k, iter, count;
                    const other = args[0];
                    if (other !== undefined) {
                        iter = Sk.abstr.iter(other);
                    }
                    if (other instanceof Sk.builtin.dict) {
                        for (k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                            count = this.mp$subscript(k);
                            this.mp$ass_subscript(k, count.nb$subtract(other.mp$subscript(k)));
                        }
                    } else if (iter) {
                        const one = new Sk.builtin.int_(1);
                        for (k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
                            count = this.mp$subscript(k);
                            this.mp$ass_subscript(k, count.nb$subtract(one));
                        }
                    }
                    kwargs = kwargs || [];
                    for (let i = 0; i < kwargs.length; i += 2) {
                        k = new Sk.builtin.str(kwargs[i]);
                        count = this.mp$subscript(k);
                        this.mp$ass_subscript(k, count.nb$subtract(kwargs[i + 1]));
                    }
                    return Sk.builtin.none.none$;
                },
            },
        },
        getsets: {
            __dict__: Sk.generic.getSetDict,
        },
        slots: {
            tp$doc:
                "Dict subclass for counting hashable items.  Sometimes called a bag\n    or multiset.  Elements are stored as dictionary keys and their counts\n    are stored as dictionary values.\n\n    >>> c = Counter('abcdeabcdabcaba')  # count elements from a string\n\n    >>> c.most_common(3)                # three most common elements\n    [('a', 5), ('b', 4), ('c', 3)]\n    >>> sorted(c)                       # list all unique elements\n    ['a', 'b', 'c', 'd', 'e']\n    >>> ''.join(sorted(c.elements()))   # list elements with repetitions\n    'aaaaabbbbcccdde'\n    >>> sum(c.values())                 # total of all counts\n    15\n\n    >>> c['a']                          # count of letter 'a'\n    5\n    >>> for elem in 'shazam':           # update counts from an iterable\n    ...     c[elem] += 1                # by adding 1 to each element's count\n    >>> c['a']                          # now there are seven 'a'\n    7\n    >>> del c['b']                      # remove all 'b'\n    >>> c['b']                          # now there are zero 'b'\n    0\n\n    >>> d = Counter('simsalabim')       # make another counter\n    >>> c.update(d)                     # add in the second counter\n    >>> c['a']                          # now there are nine 'a'\n    9\n\n    >>> c.clear()                       # empty the counter\n    >>> c\n    Counter()\n\n    Note:  If a count is set to zero or reduced to zero, it will remain\n    in the counter until the entry is deleted or the counter is cleared:\n\n    >>> c = Counter('aaabbc')\n    >>> c['b'] -= 2                     # reduce the count of 'b' by two\n    >>> c.most_common()                 # 'b' is still in, but its count is zero\n    [('a', 3), ('c', 1), ('b', 0)]\n\n",
            tp$init: function (args, kwargs) {
                Sk.abstr.checkArgsLen(this.tp$name, args, 0, 1);
                return Sk.misceval.callsimArray(this.update, [this, ...args], kwargs);
            },
            $r: function () {
                var dict_str = this.size > 0 ? Sk.builtin.dict.prototype.$r.call(this).v : "";
                return new Sk.builtin.str("Counter(" + dict_str + ")");
            },
            mp$subscript: function (key) {
                return this.mp$lookup(key) || new Sk.builtin.int_(0);
            },
        },
    });

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
            tp$init: function (args, kwargs) {
                Sk.abstr.checkArgsLen("OrderedDict", args, 0, 1);
                args.unshift(this);
                res = Sk.misceval.callsimArray(this.update, args, kwargs);
                return Sk.builtin.none.none$;
            },
            tp$doc: "Dictionary that remembers insertion order",
            $r: function () {
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
            tp$richcompare: function (other, op) {
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
            mp$ass_subscript: function (key, w) {
                if (w === undefined) {
                    this.del$item(key);
                } else {
                    this.set$item(key, w);
                }
                return Sk.builtin.none.none$;
            },
            tp$iter: function () {
                return new odict_iter_(this);
            },
        },
        methods: {
            pop: {
                $flags: { NamedArgs: ["key", "default"], Defaults: [null] },
                $meth: function (key, d) {
                    const idx = this.orderedkeys.indexOf(key);
                    if (idx != -1) {
                        this.orderedkeys.splice(idx, 1);
                    }
                    if (d === null) {
                        return Sk.misceval.callsimArray(Sk.builtin.dict.prototype["pop"], [this, key]);
                    } else {
                        return Sk.misceval.callsimArray(Sk.builtin.dict.prototype["pop"], [this, key, d]);
                    }
                },
            },
            popitem: {
                $flags: { NamedArgs: ["last"], Defaults: [Sk.builtin.bool.true$] },
                $meth: function (last) {
                    let key, val;
                    if (this.orderedkeys.length == 0) {
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
        },
        proto: {
            sk$asarray: function () {
                return this.orderedkeys.slice();
            },
            set$item: function (key, w) {
                const idx = this.orderedkeys.indexOf(key);
                if (idx == -1) {
                    this.orderedkeys.push(key);
                }
                Sk.builtin.dict.prototype.set$item.call(this, key, w);
            },
            del$item: function (key) {
                // oops need to edit this as it really doesn't ever get called... or maybe it does by dict;
                var idx = this.orderedkeys.indexOf(key);
                if (idx != -1) {
                    this.orderedkeys.splice(idx, 1);
                }
                Sk.builtin.dict.prototype.del$item.call(this, key);
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
            tp$init: function (args, kwargs) {
                [iterable, maxlen] = Sk.abstr.copyKeywordsToNamedArgs("deque", ["iterable", "maxlen"], args, kwargs);
                if (maxlen !== undefined && !Sk.builtin.checkNone(maxlen)) {
                    maxlen = Sk.misceval.asIndexOrThrow(maxlen, "an integer is required");
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
                return Sk.builtin.none.none$;
            },
            tp$getattr: Sk.generic.getAttr,

            tp$richcompare: function (w, op) {
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
            tp$iter: function () {
                return new deque_iter_(this);
            },

            $r: function () {
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
            nb$bool: function () {
                return 0 !== ((this.tail - this.head) & this.mask);
            },

            tp$as_sequence_or_mapping: true,
            sq$contains: function (item) {
                for (let it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    if (Sk.misceval.richCompareBool(i, item, "Eq")) {
                        return true;
                    }
                }
                return false;
            },
            sq$concat: function (other) {
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
            sq$length: function () {
                return (this.tail - this.head) & this.mask;
            },
            sq$repeat: function (n) {
                n = Sk.misceval.asIndexOrThrow(n, "can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
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
            mp$subscript: function (index) {
                index = Sk.misceval.asIndexOrThrow(index);
                const size = (this.tail - this.head) & this.mask;
                if (index >= size || index < -size) {
                    throw new Sk.builtin.IndexError("deque index out of range");
                }
                const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;
                return this.v[pos];
            },
            mp$ass_subscript: function (index, val) {
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
                return Sk.builtin.none.none$;
            },
            nb$inplace_add: function (other) {
                this.maxlen = undefined;
                for (it = Sk.abstr.iter(other), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    this.$push(i);
                }
                return this;
            },
            nb$inplace_multiply: function (n) {
                n = Sk.misceval.asIndexOrThrow(n, "can't multiply sequence by non-int of type '" + Sk.abstr.typeName(n) + "'");
                if (typeof n !== "number") {
                    throw new Sk.builtin.OverflowError("cannot fit '" + Sk.abstr.typeName(n) + "' into an index-sized integer");
                }
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
                $meth: function (value) {
                    this.$push(value);
                    return Sk.builtin.none.none$;
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "Add an element to the right side of the deque.",
            },
            appendleft: {
                $meth: function (value) {
                    this.$pushLeft(value);
                    return Sk.builtin.none.none$;
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "Add an element to the left side of the deque.",
            },
            clear: {
                $meth: function () {
                    this.$clear();
                    return Sk.builtin.none.none$;
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "Remove all elements from the deque.",
            },
            __copy__: {
                $meth: function () {
                    return this.$copy();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "Return a shallow copy of a deque.",
            },
            copy: {
                $meth: function () {
                    return this.$copy();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "Return a shallow copy of a deque.",
            },
            count: {
                $meth: function (x) {
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
                $meth: function (iterable) {
                    this.$extend(iterable);
                    return Sk.builtin.none.none$;
                },
                $flags: { OneArg: true },
                $textsig: null,
                $doc: "Extend the right side of the deque with elements from the iterable",
            },
            extendleft: {
                $meth: function (iterable) {
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
                $meth: function (x, start, stop) {
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
                $meth: function (index, value) {
                    index = Sk.misceval.asIndexOrThrow(index, "integer argument expected, got " + Sk.abstr.typeName(index));
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
                $meth: function () {
                    return this.$pop();
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "Remove and return the rightmost element.",
            },
            popleft: {
                $meth: function () {
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
                $meth: function (value) {
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
                $meth: function () {
                    return new _deque_reverse_iterator_iter_(this);
                },
                $flags: { NoArgs: true },
                $textsig: null,
                $doc: "D.__reversed__() -- return a reverse iterator over the deque",
            },
            reverse: {
                $meth: function () {
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
                $meth: function (num) {
                    num = num || new Sk.builtin.int_(1);
                    n = Sk.misceval.asIndexOrThrow(num, "'" + Sk.abstr.typeName(num) + "' object cannot be interpreted as an integer");
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
                $get: function () {
                    return this.maxlen === undefined ? Sk.builtin.none.none$ : new Sk.builtin.int_(this.maxlen);
                },
                $doc: "maximum size of a deque or None if unbounded",
            },
        },
        proto: {
            $clear: function () {
                this.head = 0;
                this.tail = 0;
                this.mask = 1;
                this.v = new Array(2);
            },
            $copy: function () {
                return new collections.deque(this.v.slice(0), this.maxlen, this.head, this.tail, this.mask);
            },
            $extend: function (iterable) {
                for (it = Sk.abstr.iter(iterable), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
                    this.$push(i);
                }
            },
            set$item: function (index, val) {
                const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;
                this.v[pos] = val;
            },
            del$item: function (index) {
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
            $push: function (value) {
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
            $pushLeft: function (value) {
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
            $pop: function () {
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
            $popLeft: function () {
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
            $resize: function (size, length) {
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
            $index: function (x, start, stop) {
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
            sk$asarray: function () {
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
        iternext: function () {
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
        }
    });

    const _deque_reverse_iterator_iter_ = Sk.abstr.buildIteratorClass("_collections._deque_reverse_iterator", {
        constructor: function _deque_reverse_iterator(dq) {
            this.$index = ((dq.tail - dq.head) & dq.mask) - 1;
            this.dq = dq.v;
            this.$head = dq.head;
            this.$mask = dq.mask;
        },
        iternext: function () {
            if (this.$index < 0) {
                return undefined;
            }
            const pos = (this.$head + this.$index) & this.$mask;
            this.$index--;
            return this.dq[pos];
        },
        methods: {
            __length_hint__: Sk.generic.iterReverseLengthHintMethodDef
        }
    });

    // deque end

    // namedtuple
    collections.namedtuples = {};

    const namedtuple = function namedtuple(name, fields, rename, defaults, module) {
        if (Sk.ffi.remapToJs(Sk.misceval.callsimArray(keywds.$d["iskeyword"], [name]))) {
            throw new Sk.builtin.ValueError("Type names and field names cannot be a keyword: '" + Sk.misceval.objectRepr(name) + "'");
        }

        const $name = name.$jsstr();
        // regex tests for name and fields
        const startsw = new RegExp(/^[0-9].*/);
        const startsw2 = new RegExp(/^[0-9_].*/);
        const alnum = new RegExp(/^\w*$/);
        if (startsw.test($name) || !alnum.test($name) || !$name) {
            throw new Sk.builtin.ValueError("Type names and field names must be valid identifiers: '" + $name + "'");
        }

        let flds;
        // fields could be a string or an iterable of strings
        if (Sk.builtin.checkString(fields)) {
            flds = fields.$jsstr();
            flds = flds.replace(/,/g, " ").split(/\s+/);
            if (flds.length == 1 && flds[0] === "") {
                flds = [];
            }
        } else {
            flds = [];
            iter = Sk.abstr.iter(fields);
            for (i = iter.tp$iternext(); i !== undefined; i = iter.tp$iternext()) {
                flds.push(Sk.ffi.remapToJs(i));
            }
        }

        // rename fields
        rename = Sk.misceval.isTrue(rename);
        if (rename) {
            let seen = new Set();
            for (i = 0; i < flds.length; i++) {
                if (
                    Sk.ffi.remapToJs(Sk.misceval.callsimArray(keywds.$d["iskeyword"], [Sk.ffi.remapToPy(flds[i])])) ||
                    startsw2.test(flds[i]) ||
                    !alnum.test(flds[i]) ||
                    !flds[i] ||
                    seen.has(flds[i])
                ) {
                    flds[i] = "_" + i;
                }
                seen.add(flds[i]);
            }
        }

        // check the field names
        for (i = 0; i < flds.length; i++) {
            if (Sk.ffi.remapToJs(Sk.misceval.callsimArray(keywds.$d["iskeyword"], [Sk.ffi.remapToPy(flds[i])]))) {
                throw new Sk.builtin.ValueError("Type names and field names cannot be a keyword: '" + flds[i] + "'");
            } else if ((startsw2.test(flds[i]) || !flds[i]) && !rename) {
                throw new Sk.builtin.ValueError("Field names cannot start with an underscore: '" + flds[i] + "'");
            } else if (!alnum.test(flds[i])) {
                throw new Sk.builtin.ValueError("Type names and field names must be valid identifiers: '" + flds[i] + "'");
            }
        }

        // check duplicates
        let seen = new Set();
        for (i = 0; i < flds.length; i++) {
            if (seen.has(flds[i])) {
                throw new Sk.builtin.ValueError("Encountered duplicate field name: '" + flds[i] + "'");
            }
            seen.add(flds[i]);
        }

        // create array of default values
        const dflts = [];
        if (!Sk.builtin.checkNone(defaults)) {
            defaults = Sk.abstr.iter(defaults);
            for (let i = defaults.tp$iternext(); i !== undefined; i = defaults.tp$iternext()) {
                dflts.push(i);
            }
        }
        if (dflts.length > flds.length) {
            throw new Sk.builtin.TypeError("Got more default values than field names");
        }

        // _field_defaults
        const dflts_dict = [];
        for (let i = flds.length - dflts.length; i < flds.length; i++) {
            dflts_dict.push(new Sk.builtin.str(flds[i]));
            dflts_dict.push(dflts[i - (flds.length - dflts.length)]);
        }
        const _field_defaults = new Sk.builtin.dict(dflts_dict);

        // _make
        const $make = function _make(_cls, iterable) {
            iterable = Sk.abstr.iter(iterable);
            values = [];
            for (let i = iterable.tp$iternext(); i !== undefined; i = iterable.tp$iternext()) {
                values.push(i);
            }
            return _cls.prototype.tp$new(values);
        };
        $make.co_varnames = ["_cls", "iterable"];
        const _make = new Sk.builtin.classmethod(new Sk.builtin.func($make));

        // _asdict
        const $asdict = function _asdict(self) {
            const asdict = [];
            for (let i = 0; i < self._fields.v.length; i++) {
                asdict.push(self._fields.v[i]);
                asdict.push(self.v[i]);
            }
            return new Sk.builtin.dict(asdict);
        };
        $asdict.co_varnames = ["self"];
        const _asdict = new Sk.builtin.func($asdict);

        // _replace
        const $replace = function _replace(kwds, _self) {
            const kwd_dict = {};
            for (let i = 0; i < kwds.length; i = i + 2) {
                kwd_dict[kwds[i].$jsstr()] = kwds[i + 1];
            }
            // get the arguments to pass to the contructor
            const args = [];
            for (let i = 0; i < flds.length; i++) {
                const key = flds[i];
                const v = key in kwd_dict ? kwd_dict[key] : _self.v[i];
                args.push(v);
                delete kwd_dict[key];
            }
            // check if kwd_dict is empty
            for (let _ in kwd_dict) {
                // if we're here we got an enexpected kwarg
                const key_list = Object.keys(kwd_dict).map((x) => "'" + x + "'");
                throw new Sk.builtin.ValueError("Got unexpectd field names: [" + key_list + "]");
            }
            return nt_klass.prototype.tp$new(args);
        };
        $replace.co_kwargs = 1;
        $replace.co_varnames = ["_self"];
        const _replace = new Sk.builtin.func($replace);

        // Constructor for namedtuple
        const nt_klass = Sk.abstr.buildNativeClass($name, {
            constructor: function NamedTuple() {},
            base: Sk.builtin.tuple,
            slots: {
                tp$doc: $name + "(" + flds.join(", ") + ")",
                tp$new: function (args, kwargs) {
                    args = Sk.abstr.copyKeywordsToNamedArgs("__new__", flds, args, kwargs, dflts);
                    const named_tuple_instance = new this.constructor();
                    Sk.builtin.tuple.call(named_tuple_instance, args);
                    return named_tuple_instance;
                },
                $r: function () {
                    const bits = [];
                    for (let i = 0; i < this.v.length; ++i) {
                        bits[i] = flds[i] + "=" + Sk.misceval.objectRepr(this.v[i]);
                    }
                    const pairs = bits.join(", ");
                    cls = Sk.abstr.typeName(this);
                    return new Sk.builtin.str(cls + "(" + pairs + ")");
                },
            },
            proto: {
                __module__: Sk.builtin.checkNone(module) ? Sk.globals["__name__"] : module,
                __slots__: new Sk.builtin.tuple(),
                _fields: new Sk.builtin.tuple(flds.map((x) => new Sk.builtin.str(x))),
                _field_defaults: _field_defaults,
                _make: _make,
                _asdict: _asdict,
                _replace: _replace,
            },
        });

        // create the field properties
        for (let i = 0; i < flds.length; i++) {
            const fld = Sk.fixReserved(flds[i]);
            const fget = function (self) {
                Sk.builtin.pyCheckArgs(fld, arguments, 0, 0, false, true);
                return self.v[i];
            };
            fget.co_name = new Sk.builtin.str(fld);
            nt_klass.prototype[fld] = new Sk.builtin.property(
                new Sk.builtin.func(fget),
                undefined,
                undefined,
                new Sk.builtin.str("Alias for field number " + i)
            );
        }

        collections.namedtuples[$name] = nt_klass;
        return nt_klass;
    };

    namedtuple.co_argcount = 2;
    namedtuple.co_kwonlyargcount = 3;
    namedtuple.$kwdefs = [Sk.builtin.bool.false$, Sk.builtin.none.none$, Sk.builtin.none.none$];
    namedtuple.co_varnames = ["typename", "field_names", "rename", "defaults", "module"];

    collections.namedtuple = new Sk.builtin.func(namedtuple);

    return collections;
};

var $builtinmodule = function (name) {
    return Sk.misceval.chain(Sk.importModule("keyword", false, true), collections_mod);
};