const collections_mod = function (keywds) {
    const collections = {};

    // defaultdict object
    const _copy_dd_method_df = {
        $meth: function () {
            const L = [];
            const self = this;
            Sk.misceval.iterFor(Sk.abstr.iter(self), function (k) {
                L.push(k);
                L.push(self.mp$subscript(k));
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
                Sk.builtin.dict.prototype.tp$init.call(this, args, kwargs);
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
                args = [this].concat(args);
                return Sk.misceval.callsimArray(this.update, args, kwargs);
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
            this.$orig_size = odict.sq$length();
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

    // deque - Special thanks to:https://github.com/blakeembrey/deque
    collections.deque = function (iterable, maxlen) {
        if (!(this instanceof collections.deque)) {
            return new collections.deque(iterable, maxlen);
        }
        if (this["$d"]) {
            this["$d"]["maxlen"] = maxlen ? maxlen : Sk.builtin.none.none$;
        } else {
            this["$d"] = { maxlen: maxlen ? maxlen : Sk.builtin.none.none$ };
        }

        this.head = 0;
        this.tail = 0;
        this.mask = 1;

        if (maxlen && !Sk.builtin.checkNone(maxlen)) {
            maxlen = Sk.builtin.asnum$(maxlen);
            if (!Number.isInteger(maxlen)) {
                throw new Sk.builtin.TypeError("an integer is required");
            } else if (maxlen < 0) {
                throw new Sk.builtin.ValueError("maxlen must be non-negative");
            } else {
                this.maxlen = maxlen;
            }
        }

        if (iterable === undefined) {
            this.v = new Array(2);
        } else if (Sk.builtin.checkIterable(iterable)) {
            this.v = new Array(2);
            collections.deque.prototype["extend"].func_code(this, iterable);
        } else {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
        }

        this.__class__ = collections.deque;

        return this;
    };
    collections.deque.minArgs = 1;
    collections.deque.maxArgs = 2;
    collections.deque.co_varnames = ["iterable", "maxlen"];
    collections.deque.co_name = new Sk.builtin.str("collections.deque");
    collections.deque.co_argcount = 2;
    collections.deque.$defaults = [new Sk.builtin.tuple([]), Sk.builtin.none.none$];

    Sk.abstr.setUpInheritance("collections.deque", collections.deque, Sk.builtin.seqtype);
    Sk.abstr.markUnhashable(collections.deque);

    collections.deque.prototype.$init$ = collections.deque;

    collections.deque.prototype.__init__ = new Sk.builtin.func(function (self, iterable, maxlen) {
        self.$init$(iterable, maxlen);
    });

    collections.deque.prototype.$resize = function (size, length) {
        var head = this.head;
        var mask = this.mask;
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
    };
    collections.deque.prototype.$push = function (value) {
        this.v[this.tail] = value;
        this.tail = (this.tail + 1) & this.mask;
        if (this.head === this.tail) {
            this.$resize(this.v.length, this.v.length << 1);
        }

        var size = (this.tail - this.head) & this.mask;
        if (this.maxlen !== undefined && size > this.maxlen) {
            collections.deque.prototype["popleft"].func_code(this);
        }
        return this;
    };
    collections.deque.prototype.$pushLeft = function (value) {
        this.head = (this.head - 1) & this.mask;
        this.v[this.head] = value;
        if (this.head === this.tail) {
            this.$resize(this.v.length, this.v.length << 1);
        }

        var size = (this.tail - this.head) & this.mask;
        if (this.maxlen !== undefined && size > this.maxlen) {
            collections.deque.prototype["pop"].func_code(this);
        }
        return this;
    };

    collections.deque.prototype["append"] = new Sk.builtin.func(function (self, value) {
        Sk.builtin.pyCheckArgsLen("append", arguments.length, 1, 1, true, false);
        self.$push(value);
        return Sk.builtin.none.none$;
    });

    collections.deque.prototype["appendleft"] = new Sk.builtin.func(function (self, value) {
        Sk.builtin.pyCheckArgsLen("appendleft", arguments.length, 1, 1, true, false);
        self.$pushLeft(value);
        return Sk.builtin.none.none$;
    });

    collections.deque.prototype["extend"] = new Sk.builtin.func(function (self, iterable) {
        Sk.builtin.pyCheckArgsLen("extend", arguments.length, 1, 1, true, false);
        if (!Sk.builtin.checkIterable(iterable)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
        }

        for (it = Sk.abstr.iter(iterable), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            self.$push(i);
        }
        return Sk.builtin.none.none$;
    });

    collections.deque.prototype["extendleft"] = new Sk.builtin.func(function (self, iterable) {
        Sk.builtin.pyCheckArgsLen("extendleft", arguments.length, 1, 1, true, false);
        if (!Sk.builtin.checkIterable(iterable)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
        }

        for (it = Sk.abstr.iter(iterable), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            self.$pushLeft(i);
        }
        return Sk.builtin.none.none$;
    });

    collections.deque.prototype["clear"] = new Sk.builtin.func(function (self) {
        Sk.builtin.pyCheckArgsLen("clear", arguments.length, 0, 0, true, false);
        self.head = 0;
        self.tail = 0;
        self.mask = 1;
        self.maxlen = undefined;
        self.v = new Array(2);
    });

    collections.deque.prototype["insert"] = new Sk.builtin.func(function (self, idx, value) {
        Sk.builtin.pyCheckArgsLen("insert", arguments.length, 2, 2, true, false);

        index = Sk.builtin.asnum$(idx);
        if (!Number.isInteger(index)) {
            throw new Sk.builtin.TypeError("integer argument expected, got " + Sk.abstr.typeName(idx));
        }
        var size = (self.tail - self.head) & self.mask;
        if (self.maxlen !== undefined && size >= self.maxlen) {
            throw new Sk.builtin.IndexError("deque already at its maximum size");
        }
        if (index > size) {
            index = size;
        }
        if (index <= -size) {
            index = 0;
        }

        const pos = ((index >= 0 ? self.head : self.tail) + index) & self.mask;

        var cur = self.tail;

        self.tail = (self.tail + 1) & self.mask;

        while (cur !== pos) {
            const prev = (cur - 1) & self.mask;
            self.v[cur] = self.v[prev];
            cur = prev;
        }
        self.v[pos] = value;
        if (self.head === self.tail) {
            self.$resize(self.v.length, self.v.length << 1);
        }
        return Sk.builtin.none.none$;
    });

    collections.deque.prototype["index"] = new Sk.builtin.func(function (self, x, start, stop) {
        Sk.builtin.pyCheckArgsLen("index", arguments.length, 1, 3, true, false);

        var size = (self.tail - self.head) & self.mask;
        if (start) {
            start = Sk.builtin.asnum$(start);
            if (!Number.isInteger(start)) {
                throw new Sk.builtin.TypeError("slice indices must be integers or have an __index__ method");
            }
        } else {
            var start = 0;
        }
        if (stop) {
            stop = Sk.builtin.asnum$(stop);
            if (!Number.isInteger(stop)) {
                throw new Sk.builtin.TypeError("slice indices must be integers or have an __index__ method");
            }
        } else {
            var stop = size;
        }

        var head = self.head;
        var mask = self.mask;
        var list = self.v;

        const offset = start >= 0 ? start : start < -size ? 0 : size + start;
        stop = stop >= 0 ? stop : stop < -size ? 0 : size + stop;
        for (var i = offset; i < stop; i++) {
            if (list[(head + i) & mask] === x) {
                return i;
            }
        }
        throw new Sk.builtin.ValueError(Sk.ffi.remapToJs(x) + " is not in deque");
    });

    collections.deque.prototype["__delitem__"] = new Sk.builtin.func(function (self, idx) {
        var size = (self.tail - self.head) & self.mask;
        index = Sk.builtin.asnum$(idx);
        if (!Number.isInteger(index)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(idx) + "' object cannot be interpreted as an integer");
        }

        if ((index | 0) !== index || index >= size || index < -size) {
            throw new Sk.builtin.IndexError("deque index out of range");
        }

        const pos = ((index >= 0 ? self.head : self.tail) + index) & self.mask;
        var cur = pos;
        // Shift items backward 1 to erase position.
        while (cur !== self.tail) {
            const next = (cur + 1) & self.mask;
            self.v[cur] = self.v[next];
            cur = next;
        }
        // Decrease tail position by 1.
        self.tail = (self.tail - 1) & self.mask;
        if (size < self.mask >>> 1) {
            self.$resize(size, self.v.length >>> 1);
        }
        return Sk.builtin.none.none$;
    });

    // del deque[index]
    collections.deque.prototype.mp$del_subscript = function (idx) {
        collections.deque.prototype["__delitem__"].func_code(this, idx);
    };

    collections.deque.prototype["count"] = new Sk.builtin.func(function (self, x) {
        Sk.builtin.pyCheckArgsLen("count", arguments.length, 1, 1, true, false);
        var head = self.head;
        var size = (self.tail - self.head) & self.mask;
        var mask = self.mask;
        var list = self.v;
        var count = 0;
        const offset = 0;
        for (var i = 0; i < size; i++) {
            if (list[(head + i) & mask] == x) {
                count++;
            }
        }
        return new Sk.builtin.int_(count);
    });

    collections.deque.prototype["pop"] = new Sk.builtin.func(function (self) {
        Sk.builtin.pyCheckArgsLen("pop", arguments.length, 0, 0, true, false);
        if (self.head === self.tail) {
            throw new Sk.builtin.IndexError("pop from an empty deque");
        }
        self.tail = (self.tail - 1) & self.mask;
        const value = self.v[self.tail];
        self.v[self.tail] = undefined;
        var size = (self.tail - self.head) & self.mask;
        if (size < self.mask >>> 1) {
            self.$resize(size, self.v.length >>> 1);
        }
        return value;
    });

    collections.deque.prototype["popleft"] = new Sk.builtin.func(function (self) {
        Sk.builtin.pyCheckArgsLen("popleft", arguments.length, 0, 0, true, false);
        if (self.head === self.tail) {
            throw new Sk.builtin.IndexError("pop from an empty deque");
        }
        const value = self.v[self.head];
        self.v[self.head] = undefined;
        self.head = (self.head + 1) & self.mask;
        var size = (self.tail - self.head) & self.mask;
        if (size < self.mask >>> 1) {
            self.$resize(size, self.v.length >>> 1);
        }
        return value;
    });

    collections.deque.prototype.__iter__ = new Sk.builtin.func(function (self) {
        Sk.builtin.pyCheckArgsLen("__iter__", arguments.length, 0, 0, true, false);
        return new collections.deque.deque_iter_(self);
    });
    // get value via deque[index]
    collections.deque.prototype["mp$subscript"] = function (idx) {
        index = Sk.builtin.asnum$(idx);
        if (!Number.isInteger(index)) {
            throw new Sk.builtin.TypeError("sequence index must be integer, not '" + Sk.abstr.typeName(idx) + "'");
        }

        var size = (this.tail - this.head) & this.mask;
        if ((index | 0) !== index || index >= size || index < -size) {
            throw new Sk.builtin.IndexError("deque index out of range");
        }
        const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;
        return this.v[pos];
    };

    // set value via deque[index] = val
    collections.deque.prototype["mp$ass_subscript"] = function (idx, val) {
        index = Sk.builtin.asnum$(idx);
        if (!Number.isInteger(index)) {
            throw new Sk.builtin.TypeError("sequence index must be integer, not '" + Sk.abstr.typeName(idx) + "'");
        }

        var size = (this.tail - this.head) & this.mask;
        if ((index | 0) !== index || index >= size || index < -size) {
            throw new Sk.builtin.IndexError("deque index out of range");
        }
        const pos = ((index >= 0 ? this.head : this.tail) + index) & this.mask;
        this.v[pos] = val;
    };

    collections.deque.prototype["__reversed__"] = new Sk.builtin.func(function (self) {
        var dq = new collections.deque(self);
        collections.deque.prototype["reverse"].func_code(dq);
        return new collections._deque_reverse_iterator(dq);
    });

    collections.deque.prototype.tp$setattr = function (pyName, value) {
        if (!(Sk.ffi.remapToJs(pyName) in this["$d"])) {
            throw new Sk.builtin.AttributeError("'collections.deque' object has no attribute '" + Sk.ffi.remapToJs(pyName) + "'");
        }
        throw new Sk.builtin.AttributeError("attribute '" + Sk.ffi.remapToJs(pyName) + "' of 'collections.deque' objects is not writable");
    };

    collections.deque.__class__ = collections.deque;

    collections.deque.deque_iter_ = function (dq) {
        if (!(this instanceof collections.deque.deque_iter_)) {
            return new collections.deque.deque_iter_(dq);
        }
        this.$index = 0;
        this.dq = dq.v;
        this.sq$length = (dq.tail - dq.head) & dq.mask;
        this.tp$iter = this;

        this.$head = dq.head;
        this.$tail = dq.tail;
        this.$mask = dq.mask;

        var pos;
        this.tp$iternext = function () {
            if (this.$index >= this.sq$length) {
                return undefined;
            }

            pos = ((this.$index >= 0 ? this.$head : this.$tail) + this.$index) & this.$mask;
            this.$index++;
            return this.dq[pos];
        };
        this.$r = function () {
            return new Sk.builtin.str("_collections._deque_iterator");
        };
        return this;
    };

    Sk.abstr.setUpInheritance("_collections._deque_iterator", collections.deque.deque_iter_, Sk.builtin.object);

    collections.deque.deque_iter_.prototype.__class__ = collections.deque.deque__iter_;

    collections.deque.deque_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
        return self;
    });

    collections.deque.deque_iter_.prototype.next$ = function (self) {
        var ret = self.tp$iternext();
        if (ret === undefined) {
            throw new Sk.builtin.StopIteration();
        }
        return ret;
    };

    collections.deque.prototype.tp$iter = function () {
        return new collections.deque.deque_iter_(this);
    };

    collections.deque.prototype["remove"] = new Sk.builtin.func(function (self, value) {
        Sk.builtin.pyCheckArgsLen("remove", arguments.length, 1, 1, true, false);
        // Remove the first occurrence of value. If not found, raises a ValueError.
        var index = collections.deque.prototype["index"].func_code(self, value);
        const pos = (self.head + index) & self.mask;
        var cur = pos;

        while (cur !== self.tail) {
            const next = (cur + 1) & self.mask;
            self.v[cur] = self.v[next];
            cur = next;
        }

        self.tail = (self.tail - 1) & self.mask;
        var size = (self.tail - self.head) & self.mask;
        if (size < self.mask >>> 1) {
            self.$resize(size, self.v.length >>> 1);
        }
    });

    collections.deque.prototype["__add__"] = new Sk.builtin.func(function (self, dqe) {
        // check type
        if (Sk.abstr.typeName(dqe) != "collections.deque") {
            throw new Sk.builtin.TypeError('can only concatenate deque (not "' + Sk.abstr.typeName(dqe) + '") to deque');
        }
        var new_deque = collections.deque(self, self.maxlen);
        for (var iter = dqe.tp$iter(), k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext()) {
            new_deque.$push(k);
        }
        return new_deque;
    });

    // deque += iterable
    collections.deque.prototype["__iadd__"] = new Sk.builtin.func(function (self, iterable) {
        // check type
        if (!Sk.builtin.checkIterable(iterable)) {
            throw new Sk.builtin.TypeError("'" + Sk.abstr.typeName(iterable) + "' object is not iterable");
        }
        for (it = Sk.abstr.iter(iterable), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            self.$push(i);
        }
        return self;
    });

    // n * deque and deque * n for seqtype object
    collections.deque.prototype["sq$repeat"] = function (num) {
        var ret;
        n = Sk.builtin.asnum$(num);
        if (!Number.isInteger(n)) {
            throw new Sk.builtin.OverflowError("can't multiply sequence by non-int of type '" + Sk.abstr.typeName(num) + "'");
        }
        ret = [];
        var size = (this.tail - this.head) & this.mask;

        var pos;
        for (i = 0; i < n; ++i) {
            for (j = 0; j < size; ++j) {
                pos = (this.head + j) & this.mask;
                ret.push(this.v[pos]);
            }
        }

        if (this.maxlen !== undefined) {
            return new collections.deque(Sk.builtin.list(ret), Sk.builtin.int_(this.maxlen));
        }

        return new collections.deque(Sk.builtin.list(ret));
    };

    collections.deque.prototype["reverse"] = new Sk.builtin.func(function (self) {
        Sk.builtin.pyCheckArgsLen("reverse", arguments.length, 0, 0, true, false);
        var head = self.head,
            tail = self.tail,
            mask = self.mask;
        var size = (self.tail - self.head) & self.mask;
        for (var i = 0; i < ~~(size / 2); i++) {
            const a = (tail - i - 1) & mask;
            const b = (head + i) & mask;
            const temp = self.v[a];
            self.v[a] = self.v[b];
            self.v[b] = temp;
        }
        return Sk.builtin.none.none$;
    });

    collections.deque.prototype["rotate"] = new Sk.builtin.func(function (self, num = Sk.builtin.int_(1)) {
        Sk.builtin.pyCheckArgsLen("rotate", arguments.length, 0, 1, true, false);
        n = Sk.builtin.asnum$(num);
        if (!Number.isInteger(n)) {
            throw new Sk.builtin.OverflowError("'" + Sk.abstr.typeName(num) + "' object cannot be interpreted as an integer");
        }

        var head = self.head;
        var tail = self.tail;

        if (n === 0 || head === tail) {
            return self;
        }
        self.head = (head - n) & self.mask;
        self.tail = (tail - n) & self.mask;
        if (n > 0) {
            for (var i = 1; i <= n; i++) {
                const a = (head - i) & self.mask;
                const b = (tail - i) & self.mask;
                self.v[a] = self.v[b];
                self.v[b] = undefined;
            }
        } else {
            for (let i = 0; i > n; i--) {
                const a = (tail - i) & self.mask;
                const b = (head - i) & self.mask;
                self.v[a] = self.v[b];
                self.v[b] = undefined;
            }
        }
        return Sk.builtin.none.none$;
    });

    // for len(deque) function
    collections.deque.prototype.sq$length = function () {
        return (this.tail - this.head) & this.mask;
    };

    collections.deque.prototype.sq$contains = function (item) {
        var it, i;

        for (it = this.tp$iter(), i = it.tp$iternext(); i !== undefined; i = it.tp$iternext()) {
            if (Sk.misceval.richCompareBool(i, item, "Eq")) {
                return true;
            }
        }
        return false;
    };

    collections.deque.prototype.__contains__ = new Sk.builtin.func(function (self, item) {
        Sk.builtin.pyCheckArgsLen("__contains__", arguments.length - 1, 1, 1);
        return new Sk.builtin.bool(self.sq$contains(item));
    });

    collections.deque.prototype["$r"] = function () {
        // represetation: deque(['a','b','c'][,maxlen=n])
        var ret = [];
        var size = (this.tail - this.head) & this.mask;
        for (var i = 0; i < size; i++) {
            if (this.v[(this.head + i) & this.mask]) {
                if (this.v[(this.head + i) & this.mask] == this) {
                    ret.push("[...]");
                } else {
                    ret.push(Sk.misceval.objectRepr(this.v[(this.head + i) & this.mask]).v);
                }
            }
        }
        if (this.maxlen !== undefined) {
            return new Sk.builtin.str("deque([" + ret.filter(Boolean).join(", ") + "], maxlen=" + this.maxlen + ")");
        }
        return new Sk.builtin.str("deque([" + ret.filter(Boolean).join(", ") + "])");
    };

    // for repr(deque)
    collections.deque.prototype.__repr__ = new Sk.builtin.func(function (self) {
        Sk.builtin.pyCheckArgsLen("__repr__", arguments.length, 0, 0, false, true);
        return collections.deque.prototype["$r"].call(self);
    });

    collections.deque.prototype.tp$richcompare = function (w, op) {
        var k;
        var i;
        var wl;
        var vl;
        var v;
        if (this === w && Sk.misceval.opAllowsEquality(op)) {
            return true;
        }

        // w not a deque
        if (!w.__class__ || w.__class__ != collections.deque) {
            // shortcuts for eq/not
            if (op === "Eq") {
                return false;
            }
            if (op === "NotEq") {
                return true;
            }

            return false;
        }
        var wd = w;
        v = this.v;
        w = w.v;
        vl = (this.tail - this.head) & this.mask;
        wl = (wd.tail - wd.head) & wd.mask;

        for (i = 0; i < vl && i < wl; ++i) {
            k = Sk.misceval.richCompareBool(v[(this.head + i) & this.mask], w[(wd.head + i) & wd.mask], "Eq");
            if (!k) {
                break;
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
                default:
                    Sk.asserts.fail();
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
    };

    collections._deque_reverse_iterator = function (value) {
        this.v = value;
    };

    Sk.abstr.setUpInheritance("_collections._deque_reverse_iterator", collections._deque_reverse_iterator, Sk.builtin.seqtype);

    collections._deque_reverse_iterator._deque_reverse_iterator_iter_ = function (dq) {
        if (!(this instanceof collections._deque_reverse_iterator._deque_reverse_iterator_iter_)) {
            return new collections._deque_reverse_iterator._deque_reverse_iterator_iter_(dq);
        }
        this.$index = 0;
        this.dq = dq.v.v;
        this.sq$length = this.dq.length;
        this.tp$iter = this;
        var pos;
        this.tp$iternext = function () {
            if (this.$index >= this.sq$length) {
                return undefined;
            }
            pos = ((this.$index >= 0 ? dq.v.head : dq.v.tail) + this.$index) & dq.v.mask;
            this.$index++;
            return this.dq[pos];
        };
        this.$r = function () {
            return new Sk.builtin.str("_collections._deque_reverse_iterator_iter_");
        };
        return this;
    };

    collections._deque_reverse_iterator.prototype["tp$iter"] = function () {
        return new collections._deque_reverse_iterator._deque_reverse_iterator_iter_(this);
    };

    Sk.abstr.setUpInheritance(
        "_deque_reverse_iterator_iterator",
        collections._deque_reverse_iterator._deque_reverse_iterator_iter_,
        Sk.builtin.object
    );

    collections._deque_reverse_iterator._deque_reverse_iterator_iter_.prototype.__class__ =
        collections._deque_reverse_iterator._deque_reverse_iterator_iter_;

    collections._deque_reverse_iterator._deque_reverse_iterator_iter_.prototype.__iter__ = new Sk.builtin.func(function (self) {
        return self;
    });

    collections._deque_reverse_iterator._deque_reverse_iterator_iter_.prototype.next$ = function (self) {
        var ret = self.tp$iternext();
        if (ret === undefined) {
            throw new Sk.builtin.StopIteration();
        }
        return ret;
    };

    collections._deque_reverse_iterator.prototype["$r"] = function () {
        return new Sk.builtin.str("<_collections._deque_reverse_iterator object>");
    };
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
                    let err = [];
                    for (let i = 0; i < flds.length; i++) {
                        if (args[i] === undefined) {
                            err.push(flds[i]);
                        }
                    }
                    if (err.length) {
                        throw new Sk.builtin.TypeError("__new__ missing " + err.length + " required arguments: " + err.join(", "));
                    }
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
