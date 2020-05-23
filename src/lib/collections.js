const collections_mod = function (keywds) {
    const collections = {};
    // defaultdict object
    collections.defaultdict = Sk.abstr.buildNativeClass("collections.defaultdict", {
        constructor: function (default_factory, L) {
            this.default_factory = default_factory;
            Sk.builtin.dict.call(this, L);
        },
        base: Sk.builtin.dict,
        methods: {
            copy: {
                $meth: function () {
                    const L = [];
                    Sk.misceval.iterFor(Sk.abstr.iter(this), function (k) {
                        L.push(k);
                        L.push(self.mp$subscript(k));
                    })
                    return new collections.defaultdict(this.default_factory, L);
                },
                $flags: { NoArgs: true }
            },
            __missing__: {
                $meth: function (key) {
                    if (Sk.builtin.checkNone(this.default_factory)) {
                        throw new Sk.builtin.KeyError(Sk.misceval.objectRepr(key).v);
                    } else {
                        const ret = Sk.misceval.callsimArray(self.default_factory, []);
                        this.mp$ass_subscript(key, ret);
                        return ret;
                    }
                },
                $flags: { OneArg: true }
            }

        },
        getsets: {
            default_factory: {
                $get: function () {
                    return this.default_factory
                },
                $set: function (value) {
                    this.default_factory = value;
                }
            }
        },
        slots: {
            tp$doc: "defaultdict(default_factory[, ...]) --> dict with default factory\n\nThe default factory is called without arguments to produce\na new value when a key is not present, in __getitem__ only.\nA defaultdict compares equal to a dict with the same items.\nAll remaining arguments are treated the same as if they were\npassed to the dict constructor, including keyword arguments.\n",
            tp$init: function (args, kwargs) {
                const default_ = args.shift();
                if (default_ === undefined) {
                    this.default_factory = Sk.builtin.none.none$;
                } else if (!Sk.builtin.checkCallable(default_) && !(Sk.builtin.checkNone(default_))) {
                    throw new Sk.builtin.TypeError("first argument must be callable");
                } else {
                    this.default_factory = default_;
                }
                Sk.builtin.dict.prototype.tp$init.call(this, args, kwargs);
            },
            $r: function () {
                const def_str = Sk.misceval.objectRepr(this.default_factory).v;
                const dict_str = Sk.builtin.dict.prototype.$r.call(this).v;
                return new Sk.builtin.str("defaultdict(" + def_str + ", " + dict_str + ")");
            },
            mp$subscript: function (key) {
                return this.mp$lookup(key) || Sk.misceval.callsimArray(this.__missing__, [this, key]);
            }
        }
    });

    collections.Counter = Sk.abstr.buildNativeClass("Counter", {
        constructor: function () {
            this.$d = new Sk.builtin.dict;
        },
        base: Sk.builtin.dict,
        methods: {
            elements: {
                $flags: { NoArgs: true },
                $meth: function () {
                    Sk.builtin.pyCheckArgsLen("elements", arguments.length, 1, 1);
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
                    Defaults: [Sk.builtin.none.none$]
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
                    Sk.abstr.checkArgsLen("update", args, 0, 1)
                    let k, count;
                    const mapping = args[0];
                    const iter = Sk.abstr.iter(mapping);
                    for (k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext) {
                        count = this.mp$subscript(k);
                        this.mp$ass_subscript(k, count.nb$add(mapping.mp$subscript(k)));
                    }
                    kwargs = kwargs || [];
                    for (let i = 0; i < kwargs.length; i += 2) {
                        k = new Sk.builtin.str(kwargs[i]);
                        count = this.mp$subscript(k);
                        this.mp$ass_subscript(k, count.nb$add(mapping.mp$subscript(k)));
                    }
                    return Sk.builtin.none.none$;
                },
            },
            subtract: {
                $flags: { FastCall: true },
                $meth: function (args, kwargs) {
                    Sk.abstr.checkArgsLen("subtract", args, 0, 1);
                    let k, count;
                    const mapping = args[0];
                    const iter = Sk.abstr.iter(mapping);
                    for (k = iter.tp$iternext(); k !== undefined; k = iter.tp$iternext) {
                        count = this.mp$subscript(k);
                        this.mp$ass_subscript(k, count.nb$subtract(mapping.mp$subscript(k)));
                    }
                    kwargs = kwargs || [];
                    for (let i = 0; i < kwargs.length; i += 2) {
                        k = new Sk.builtin.str(kwargs[i]);
                        count = this.mp$subscript(k);
                        this.mp$ass_subscript(k, count.nb$subtract(mapping.mp$subscript(k)));
                    }
                    return Sk.builtin.none.none$;
                },
            }


        },
        getsets: {
            __dict__: Sk.generic.getSetDict,
        },
        slots: {
            tp$doc: "Dict subclass for counting hashable items.  Sometimes called a bag\n    or multiset.  Elements are stored as dictionary keys and their counts\n    are stored as dictionary values.\n\n    >>> c = Counter('abcdeabcdabcaba')  # count elements from a string\n\n    >>> c.most_common(3)                # three most common elements\n    [('a', 5), ('b', 4), ('c', 3)]\n    >>> sorted(c)                       # list all unique elements\n    ['a', 'b', 'c', 'd', 'e']\n    >>> ''.join(sorted(c.elements()))   # list elements with repetitions\n    'aaaaabbbbcccdde'\n    >>> sum(c.values())                 # total of all counts\n    15\n\n    >>> c['a']                          # count of letter 'a'\n    5\n    >>> for elem in 'shazam':           # update counts from an iterable\n    ...     c[elem] += 1                # by adding 1 to each element's count\n    >>> c['a']                          # now there are seven 'a'\n    7\n    >>> del c['b']                      # remove all 'b'\n    >>> c['b']                          # now there are zero 'b'\n    0\n\n    >>> d = Counter('simsalabim')       # make another counter\n    >>> c.update(d)                     # add in the second counter\n    >>> c['a']                          # now there are nine 'a'\n    9\n\n    >>> c.clear()                       # empty the counter\n    >>> c\n    Counter()\n\n    Note:  If a count is set to zero or reduced to zero, it will remain\n    in the counter until the entry is deleted or the counter is cleared:\n\n    >>> c = Counter('aaabbc')\n    >>> c['b'] -= 2                     # reduce the count of 'b' by two\n    >>> c.most_common()                 # 'b' is still in, but its count is zero\n    [('a', 3), ('c', 1), ('b', 0)]\n\n",
            tp$init: function (args, kwargs) {
                Sk.abstr.checkArgsLen(this.tp$name, args, 0, 1);
                const one = new Sk.builtin.int_(1);
                kwargs = kwargs || [];
                let self = this;
                if (args[0] !== undefined) {
                    Sk.misceval.iterFor(Sk.abstr.iter(args[0]), function (k) {
                        let count = self.mp$subscript(k);
                        count = count.nb$add(one);
                        self.mp$ass_subscript(k, count);
                    })
                }
                for (let i = 0; i < kwargs.length; i += 2) {
                    const k = new Sk.builtin.str(kwargs[i]);
                    let count = this.mp$subscript(k);
                    count = count.nb$add(kwargs[i + 1]);
                    if (count === Sk.builtin.NotImplemented.NotImplemented$) {
                        throw new Sk.builtin.NotImplementedError("can't add " + Sk.abstr.typeName(k) + " with int")
                    }
                    this.mp$ass_subscript(k, count);
                }
                return Sk.builtin.none.none$;
            },
            $r: function () {
                var dict_str = this.size > 0 ? Sk.builtin.dict.prototype.$r.call(this).v : '';
                return new Sk.builtin.str("Counter(" + dict_str + ")");
            },
            mp$subscript: function (key) {
                return this.mp$lookup(key) || new Sk.builtin.int_(0);
            },
        },
    });

    // OrderedDict
    collections.OrderedDict = Sk.abstr.buildNativeClass("OrderedDict", {
        constructor: function () {
            this.orderedkeys = [];
            Sk.builtin.dict.call(this);
            return this;
        },
        base: Sk.builtin.dict,
        slots: {
            tp$init: function (args, kwargs) {
                // we take an alternative approach and instead override get and set item
                // we still override __init__ just because...
                Sk.builtin.dict.prototype.tp$init.call(this, args, kwargs);
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
                    ret.push("(" + Sk.misceval.objectRepr(k).v + ", " + Sk.misceval.objectRepr(v).v + ")");
                }
                pairstr = ret.join(", ");
                if (ret.length > 0) {
                    pairstr = "[" + pairstr + "]";
                }
                return new Sk.builtin.str("OrderedDict(" + pairstr + ")");
            },
            mp$ass_subscript: function (key, w) {
                var idx = this.orderedkeys.indexOf(key);
                if (idx == -1) {
                    this.orderedkeys.push(key);
                }
                return Sk.builtin.dict.prototype.mp$ass_subscript.call(this, key, w);
            },
            mp$del_subscript: function (key) {
                // oops need to edit this as it really doesn't ever get called... or maybe it does by dict;
                var idx = this.orderedkeys.indexOf(key);
                if (idx != -1) {
                    this.orderedkeys.splice(idx, 1);
                }
                return Sk.builtin.dict.prototype.mp$del_subscript.call(this, key);
            }
        },
        methods: {
            pop: {
                $flags: { NamedArgs: ['key', 'default'], Defaults: [null, undefined] },
                $meth: function (args) {
                    const key = args[0];
                    const d = args[1];
                    const idx = this.orderedkeys.indexOf(key);
                    if (idx != -1) {
                        this.orderedkeys.splice(idx, 1);
                    }
                    // Sk.builtin.dict.prototype.pop.$meth.call(this, key, d);
                    return Sk.misceval.callsimArray(Sk.builtin.dict.prototype["pop"], [this, key, d]);
                }
            },
            popitem: {
                $flags: { NamedArgs: ['last'], Defaults: [Sk.builtin.bool.true$] },
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
                    return Sk.builtin.tuple([key, val]);
                }
            }
        }
    });



    collections.OrderedDict.prototype.ob$eq = function (other) {
        var l;
        var otherl;
        var iter;
        var k;
        var v;

        if (!(other instanceof collections.OrderedDict)) {
            return Sk.builtin.dict.prototype.ob$eq.call(this, other);
        }

        l = this.sq$length();
        otherl = other.sq$length();

        if (l !== otherl) {
            return Sk.builtin.bool.false$;
        }

        for (iter = this.tp$iter(), otheriter = other.tp$iter(),
            k = iter.tp$iternext(), otherk = otheriter.tp$iternext(); k !== undefined; k = iter.tp$iternext(), otherk = otheriter.tp$iternext()) {
            if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(k, otherk, "Eq"))) {
                return Sk.builtin.bool.false$;
            }
            v = this.mp$subscript(k);
            otherv = other.mp$subscript(otherk);

            if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(v, otherv, "Eq"))) {
                return Sk.builtin.bool.false$;
            }
        }

        return Sk.builtin.bool.true$;
    };

    collections.OrderedDict.prototype.ob$ne = function (other) {
        var l;
        var otherl;
        var iter;
        var k;
        var v;

        if (!(other instanceof collections.OrderedDict)) {
            return Sk.builtin.dict.prototype.ob$ne.call(this, other);
        }

        l = this.size;
        otherl = other.size;

        if (l !== otherl) {
            return Sk.builtin.bool.true$;
        }

        for (iter = this.tp$iter(), otheriter = other.tp$iter(),
            k = iter.tp$iternext(), otherk = otheriter.tp$iternext(); k !== undefined; k = iter.tp$iternext(), otherk = otheriter.tp$iternext()) {
            if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(k, otherk, "Eq"))) {
                return Sk.builtin.bool.true$;
            }
            v = this.mp$subscript(k);
            otherv = other.mp$subscript(otherk);

            if (!Sk.misceval.isTrue(Sk.misceval.richCompareBool(v, otherv, "Eq"))) {
                return Sk.builtin.bool.true$;
            }
        }

        return Sk.builtin.bool.false$;
    };

    // deque
    collections.deque = function deque(iterable, maxlen) {
        throw new Sk.builtin.NotImplementedError("deque is not implemented")
    };

    // namedtuple
    // namedtuple
    collections.namedtuples = {};

    const namedtuple = function (name, fields, rename, defaults, module) {
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
            flds = []
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
                if (Sk.ffi.remapToJs(Sk.misceval.callsimArray(keywds.$d["iskeyword"], [Sk.ffi.remapToPy(flds[i])])) ||
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

        // Constructor for namedtuple

        const nt_klass = Sk.abstr.buildNativeClass($name, {
            constructor: function () { },
            base: Sk.builtin.tuple,
            slots: {
                tp$doc: $name + "(" + flds.join(", ") + ")",
                tp$new: function (args, kwargs) {
                    args = Sk.abstr.copyKeywordsToNamedArgs("__new__", flds, args, kwargs, dflts);
                    const named_tuple_instance = new this.constructor;
                    Sk.builtin.tuple.call(named_tuple_instance, args);
                    return named_tuple_instance;
                },
                $r: function () {
                    const bits = [];
                    for (let i = 0; i < this.v.length; ++i) {
                        bits[i] = flds[i] + "=" + Sk.misceval.objectRepr(this.v[i]).v;
                    }
                    const pairs = bits.join(", ");
                    cls = Sk.abstr.typeName(this);
                    return new Sk.builtin.str(cls + "(" + pairs + ")");
                },
            },
            proto: {
                __module__: Sk.builtin.checkNone(module) ? Sk.globals["__name__"] : module,
                __slots__: new Sk.builtin.tuple,
                _fields: new Sk.builtin.tuple(flds.map(x => new Sk.builtin.str(x))),
            }
        });

        // since the function api isn't particularly nice we define the remainder of the functions after creating the class
        // create the field properties
        for (let i = 0; i < flds.length; i++) {
            const fld = Sk.fixReservedNames(flds[i]);
            const fget = function (self) {
                Sk.builtin.pyCheckArgs(fld, arguments, 0, 0, false, true);
                return self.v[i];
            }
            nt_klass.prototype[fld] = new Sk.builtin.property(new Sk.builtin.func(fget), undefined, undefined, new Sk.builtin.str("Alias for field number " + i));
        };

        // _make
        const _make = function _make(_cls, iterable) {
            iterable = Sk.abstr.iter(iterable);
            values = [];
            for (let i = iterable.tp$iternext(); i !== undefined; i = iterable.tp$iternext()) {
                values.push(i);
            }
            return _cls.prototype.tp$new(values);
        };
        _make.co_varnames = ["_cls", "iterable"];
        nt_klass.prototype._make = new Sk.builtin.classmethod(new Sk.builtin.func(_make));

        // _asdict
        const _asdict = function _asdict(self) {
            const asdict = [];
            for (let i = 0; i < self._fields.v.length; i++) {
                asdict.push(self._fields.v[i]);
                asdict.push(self.v[i]);
            }
            return new Sk.builtin.dict(asdict);
        };
        _asdict.co_varnames = ["self"];
        nt_klass.prototype._asdict = new Sk.builtin.func(_asdict);

        // _flds_defaults
        const dflts_dict = [];
        for (let i = flds.length - dflts.length; i < flds.length; i++) {
            dflts_dict.push(new Sk.builtin.str(flds[i]));
            dflts_dict.push(dflts[i - (flds.length - dflts.length)]);
        }
        nt_klass.prototype._field_defaults = new Sk.builtin.dict(dflts_dict);

        // _replace
        const _replace = function _replace(kwds, _self) {
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
                const key_list = Object.keys(kwd_dict).map(x => "'" + x + "'");
                throw new Sk.builtin.ValueError("Got unexpectd field names: [" + key_list + "]");
            }
            return nt_klass.prototype.tp$new(args);
        };
        _replace.co_kwargs = 1;
        _replace.co_varnames = ["_self"];
        nt_klass.prototype._replace = new Sk.builtin.func(_replace);

        collections.namedtuples[$name] = nt_klass;
        return nt_klass;
    };

    namedtuple.co_name = new Sk.builtin.str("namedtuple");
    namedtuple.co_argcount = 2;
    namedtuple.co_kwonlyargcount = 3;
    namedtuple.$kwdefs = [Sk.builtin.bool.false$, Sk.builtin.none.none$, Sk.builtin.none.none$];
    namedtuple.co_varnames = ["typename", "field_names", "rename", "defaults", "module"];

    collections.namedtuple = new Sk.builtin.func(namedtuple);

    return collections;
}

var $builtinmodule = function (name) {
    return Sk.misceval.chain(Sk.importModule("keyword", false, true), collections_mod);
};
